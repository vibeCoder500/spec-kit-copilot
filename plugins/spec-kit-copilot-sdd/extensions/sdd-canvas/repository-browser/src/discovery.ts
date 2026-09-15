import { createHash } from "node:crypto";
import { isAlias, isMap, isPair, isScalar, isSeq, parseAllDocuments } from "yaml";
import type { AdoClient, AdoOperation } from "./ado-client.ts";
import { createContinuations } from "./continuations.ts";
import { RepositoryError } from "./errors.ts";
import { UUID } from "./profile.ts";
import type { RepositoryProfile } from "./profile.ts";
import type { RepositoryDetail, RepositoryPage, RepositorySummary } from "./types.ts";

interface TeamArea { path: string; includeChildren: boolean }
interface RelevantRun {
    areas: TeamArea[];
    fingerprint: string;
    areaOffset: number;
    searchOffset: number;
    queue: string[];
    seen: Set<string>;
    returned: number;
    expiresAt: number;
}

const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function normalizeSearch(input: string): string {
    if (typeof input !== "string") throw new RepositoryError("invalid_request");
    const normalized = input.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
    if (normalized.length > 256 || /[\p{Cc}\p{Cf}]/u.test(normalized)) throw new RepositoryError("invalid_request");
    return normalized;
}

export function matchesSearch(name: string, query: string): boolean {
    const normalized = name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
    return query.split(" ").every((word) => normalized.includes(word));
}

function compare(left: RepositorySummary, right: RepositorySummary) {
    const leftName = normalizeSearch(left.name);
    const rightName = normalizeSearch(right.name);
    return leftName < rightName ? -1 : leftName > rightName ? 1 : left.id.localeCompare(right.id, "en");
}

export async function boundedMap<Input, Output>(inputs: readonly Input[], run: (input: Input) => Promise<Output>): Promise<Output[]> {
    const results: Output[] = [];
    for (let index = 0; index < inputs.length; index += 4) results.push(...await Promise.all(inputs.slice(index, index + 4).map(run)));
    return results;
}

export function normalizeArea(value: string): string {
    if (typeof value !== "string" || value.length > 2048 || /[\p{Cc}\p{Cf}/]/u.test(value)) throw new RepositoryError("upstream_unavailable");
    const parts = value.normalize("NFKC").split("\\").map((part) => part.trim().toLocaleLowerCase("en-US"));
    if (parts.some((part) => !part || part === "." || part === "..")) throw new RepositoryError("upstream_unavailable");
    return parts.join("\\");
}

function unsafeYaml(node: unknown, depth = 0): boolean {
    if (depth > 40 || isAlias(node)) return true;
    if (typeof object(node).tag === "string" && String(object(node).tag).startsWith("!")) return true;
    if (isPair(node)) return (isScalar(node.key) && node.key.value === "<<") || unsafeYaml(node.key, depth + 1) || unsafeYaml(node.value, depth + 1);
    if (isMap(node) || isSeq(node)) return node.items.some((child) => unsafeYaml(child, depth + 1));
    return false;
}

export function manifestArea(bytes: Uint8Array, profile: Readonly<RepositoryProfile>): string | null {
    if (!bytes.length || bytes.length > 65_536) return null;
    try {
        const parsed = parseAllDocuments(new TextDecoder("utf-8", { fatal: true }).decode(bytes), { strict: true, uniqueKeys: true, prettyErrors: false });
        if (parsed.length !== 1 || parsed[0]!.errors.length || parsed[0]!.warnings.length || unsafeYaml(parsed[0]!.contents)) return null;
        const root = object(parsed[0]!.toJS({ maxAliasCount: 0 }));
        let metadata = root;
        if (root.schemaVersion === "1.0.0") {
            const providers = Array.isArray(root.providers) ? root.providers.map(object).filter((provider) => provider.provider === "InventoryAsCode") : [];
            if (providers.length !== 1) return null;
            metadata = object(providers[0]!.metadata);
        } else if (root.schemaVersion !== "0.0.1") return null;
        const area = object(object(metadata.routing).defaultAreaPath);
        if (typeof area.org !== "string" || area.org.normalize("NFKC").trim().toLowerCase() !== profile.organization.toLowerCase() || typeof area.path !== "string") return null;
        const path = normalizeArea(area.path);
        return path.split("\\")[0] === profile.project.toLowerCase() ? path : null;
    } catch { return null; }
}

export function areaMatches(area: TeamArea, path: string): boolean {
    return path === area.path || (area.includeChildren && path.startsWith(`${area.path}\\`));
}

export async function repositoryDetail(client: AdoClient, operation: AdoOperation, id: string): Promise<RepositoryDetail> {
    const repository = await client.repository(operation, id);
    const sourceVersion = await client.commit(operation, repository);
    if (!sourceVersion) return { ...repository, sourceVersion: null, speckitStatus: repository.operationalState === "maintenance" ? "unavailable" : "unscannable" };
    let enabled = false;
    try { const root = await client.item(operation, id, sourceVersion, "/.specify"); enabled = root.path === "/.specify" && root.isFolder === true; }
    catch (error) {
        if (!(error instanceof RepositoryError) || error.code !== "resource_unavailable") throw error;
        await client.repository(operation, id);
    }
    operation.access.assertCurrent();
    return { ...repository, sourceVersion, speckitStatus: enabled ? "enabled" : "not_enabled" };
}

async function teamAreas(operation: AdoOperation, profile: Readonly<RepositoryProfile>): Promise<TeamArea[]> {
    const granted = operation.access.scopes.map((scope) => scope.toLowerCase().split("/").at(-1));
    if (!granted.includes(".default") && ["vso.project", "vso.work"].some((scope) => !granted.includes(scope))) throw new RepositoryError("insufficient_scope");
    const teams = new Set<string>();
    for (let offset = 0; ; offset += 100) {
        if (offset >= 100_000 || operation.signal.aborted) throw new RepositoryError("upstream_unavailable");
        const page = await operation.json(["_apis", "projects", profile.project, "teams"], { $mine: "true", $top: "100", $skip: String(offset) }, { personalization: true, maximumBytes: 2 * 1024 * 1024 });
        if (!Array.isArray(page.value) || page.value.length > 100) throw new RepositoryError("upstream_unavailable");
        for (const value of page.value) {
            const team = object(value);
            if (typeof team.id !== "string" || !UUID.test(team.id) || typeof team.projectId !== "string" || !UUID.test(team.projectId)) throw new RepositoryError("upstream_unavailable");
            teams.add(team.id.toLowerCase());
        }
        if (page.value.length < 100) break;
    }
    const merged = new Map<string, boolean>();
    await boundedMap([...teams], async (team) => {
        const values = await operation.json([profile.project, team, "_apis", "work", "teamsettings", "teamfieldvalues"], {}, { personalization: true, maximumBytes: 2 * 1024 * 1024 });
        if (object(values.field).referenceName !== "System.AreaPath" || !Array.isArray(values.values)) throw new RepositoryError("upstream_unavailable");
        for (const value of values.values) {
            const area = object(value);
            if (typeof area.value !== "string" || typeof area.includeChildren !== "boolean") throw new RepositoryError("upstream_unavailable");
            const path = normalizeArea(area.value);
            if (path.split("\\")[0] !== profile.project.toLowerCase()) throw new RepositoryError("upstream_unavailable");
            merged.set(path, Boolean(merged.get(path)) || area.includeChildren);
            if (merged.size > 1000) throw new RepositoryError("upstream_unavailable");
        }
    });
    return [...merged].sort(([left], [right]) => left.localeCompare(right, "en")).map(([path, includeChildren]) => ({ path, includeChildren }));
}

export function createRepositoryDiscovery({ client, profile, now = Date.now }: { client: AdoClient; profile: Readonly<RepositoryProfile>; now?: () => number }) {
    const cursors = createContinuations({ now });
    const runs = new Map<string, RelevantRun>();
    let sequence = 0;

    function binding(operation: AdoOperation, pageSize: number) {
        return { tenant: operation.access.tenantId, account: operation.access.accountId, connection: operation.access.connectionId,
            generation: operation.access.generation, profile: fingerprint(profile), pageSize };
    }

    async function verifyCandidate(operation: AdoOperation, id: string, areas: TeamArea[]): Promise<RepositorySummary | null> {
        try {
            const repository = await client.repository(operation, id);
            if (repository.operationalState !== "active") return null;
            const commit = await client.commit(operation, repository);
            if (!commit) return null;
            const item = await client.item(operation, id, commit, "/es-metadata.yml");
            if (item.path !== "/es-metadata.yml" || item.isFolder || typeof item.objectId !== "string" || !/^[a-f0-9]{40}$/i.test(item.objectId) || object(item.contentMetadata).isBinary) return null;
            const bytes = await client.blob(operation, id, item.objectId, 65_536);
            const path = manifestArea(bytes, profile);
            return path && areas.some((area) => areaMatches(area, path)) ? repository : null;
        } catch (error) {
            if (error instanceof RepositoryError && ["resource_unavailable", "file_too_large", "unsupported_file"].includes(error.code)) return null;
            throw error;
        }
    }

    return {
        async search(query: string, cursor?: string): Promise<RepositoryPage> {
            const normalized = normalizeSearch(query);
            if (!normalized) throw new RepositoryError("invalid_request");
            const operation = await client.open();
            const repositories = [...new Map((await client.list(operation)).map((repository) => [repository.id, repository])).values()]
                .filter((repository) => matchesSearch(repository.name, normalized)).sort(compare);
            const context = { ...binding(operation, 100), query: normalized, fingerprint: fingerprint(repositories.map(({ id, name }) => [id, name])) };
            const offset = cursor ? cursors.verify(cursor, "search", context) : 0;
            if (offset > repositories.length) throw new RepositoryError("invalid_context");
            const items = repositories.slice(offset, offset + 100);
            operation.access.assertCurrent();
            const hasMore = offset + items.length < repositories.length;
            return { items, hasMore, cursor: hasMore ? cursors.issue("search", context, offset + items.length) : null, outcome: "ready" };
        },
        async detail(id: string): Promise<RepositoryDetail> {
            return repositoryDetail(client, await client.open(), id);
        },
        async relevant(cursor?: string): Promise<RepositoryPage> {
            for (const [key, run] of runs) if (run.expiresAt <= now()) runs.delete(key);
            const operation = await client.open();
            const areas = await teamAreas(operation, profile);
            const digest = fingerprint(areas);
            const context = { ...binding(operation, 4), associationFingerprint: digest };
            let run: RelevantRun;
            if (cursor) {
                cursors.verify(cursor, "relevant", context);
                const previous = runs.get(cursor);
                if (!previous || previous.fingerprint !== digest) throw new RepositoryError("expired_cursor");
                run = { ...previous, areas, queue: [...previous.queue], seen: new Set(previous.seen) };
            } else run = { areas, fingerprint: digest, areaOffset: 0, searchOffset: 0, queue: [], seen: new Set(), returned: 0, expiresAt: now() + 600_000 };
            if (!areas.length) return { items: [], hasMore: false, cursor: null, outcome: "no_associations" };
            const items: RepositorySummary[] = [];
            let examined = 0;
            let associations = 0;
            let rawCandidates = 0;
            while (items.length < 4 && examined < 100 && associations < 100) {
                operation.access.assertCurrent();
                if (!run.queue.length) {
                    if (run.areaOffset >= areas.length || rawCandidates >= 100) break;
                    const batch = areas.slice(run.areaOffset, run.areaOffset + 20);
                    const terms = [...new Set(batch.map((area) => area.path.split("\\").at(-1)!))];
                    const candidateLimit = Math.min(100 - examined, 100 - rawCandidates);
                    const response = await operation.json([profile.project, "_apis", "search", "codesearchresults"], { "api-version": "7.1-preview.1" }, {
                        search: true, personalization: true, maximumBytes: 2 * 1024 * 1024,
                        body: { searchText: `(${terms.map((term) => JSON.stringify(term)).join(" OR ")}) path:"/es-metadata.yml"`, $top: candidateLimit, $skip: run.searchOffset,
                            filters: { Project: [profile.project] }, includeFacets: false, includeSnippet: false },
                    });
                    if ((response.infoCode !== undefined && response.infoCode !== 0) || !Array.isArray(response.results) ||
                        response.results.length > candidateLimit || typeof response.count !== "number" || !Number.isSafeInteger(response.count) || response.count < 0) throw new RepositoryError("upstream_unavailable");
                    const raw = response.results;
                    rawCandidates += raw.length;
                    if (!raw.length && response.count > run.searchOffset) throw new RepositoryError("upstream_unavailable");
                    for (const value of raw) {
                        const hit = object(value);
                        const id = object(hit.repository).id;
                        if (hit.path !== "/es-metadata.yml" || String(object(hit.project).name).toLowerCase() !== profile.project.toLowerCase() ||
                            typeof id !== "string" || !UUID.test(id)) continue;
                        const normalizedId = id.toLowerCase();
                        if (!run.seen.has(normalizedId) && !run.queue.includes(normalizedId)) run.queue.push(normalizedId);
                    }
                    run.searchOffset += raw.length;
                    if (run.searchOffset >= response.count || !raw.length) { run.areaOffset += batch.length; run.searchOffset = 0; }
                    associations += batch.length;
                    if (!run.queue.length) { examined += raw.length; continue; }
                }
                const candidates = run.queue.splice(0, Math.min(4 - items.length, 4, 100 - examined));
                examined += candidates.length;
                for (const id of candidates) run.seen.add(id);
                if (run.seen.size > 10_000) throw new RepositoryError("upstream_unavailable");
                const verified = await boundedMap(candidates, (id) => verifyCandidate(operation, id, areas));
                items.push(...verified.filter((item): item is RepositorySummary => item !== null));
            }
            operation.access.assertCurrent();
            run.returned += items.length;
            const hasMore = run.queue.length > 0 || run.areaOffset < areas.length;
            let next: string | null = null;
            if (hasMore) {
                next = cursors.issue("relevant", context, ++sequence);
                if (runs.size >= 32) runs.delete(runs.keys().next().value!);
                runs.set(next, run);
            }
            return { items: items.sort(compare), hasMore, cursor: next,
                outcome: !run.returned && !hasMore ? "no_linked_repositories" : !items.length && hasMore ? "scanning" : "ready" };
        },
        clear() { runs.clear(); },
        dispose() { runs.clear(); cursors.dispose(); },
    };
}

export type RepositoryDiscovery = ReturnType<typeof createRepositoryDiscovery>;