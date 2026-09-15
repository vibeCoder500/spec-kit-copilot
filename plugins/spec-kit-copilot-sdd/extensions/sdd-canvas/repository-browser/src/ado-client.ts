import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import type { RepositoryConnection } from "./auth.ts";
import { RepositoryError } from "./errors.ts";
import { UUID } from "./profile.ts";
import type { RepositoryProfile } from "./profile.ts";
import type { RepositorySummary } from "./types.ts";

const COMMIT = /^[a-f0-9]{40}$/i;
const PROOF_ARTIFACT = "/.specify/memory/constitution.md";

export type RepositoryAccess = Awaited<ReturnType<RepositoryConnection["access"]>>;

export interface AdoOperation {
    access: RepositoryAccess;
    signal: AbortSignal;
    json(segments: string[], query?: Record<string, string>, options?: { body?: unknown; search?: boolean; maximumBytes?: number; personalization?: boolean }): Promise<Record<string, unknown>>;
    bytes(segments: string[], query?: Record<string, string>, maximumBytes?: number): Promise<Buffer>;
}

async function responseBytes(response: Response, maximumBytes: number): Promise<Buffer> {
    if (!response.body || Number(response.headers.get("content-length")) > maximumBytes) {
        await response.body?.cancel();
        throw new RepositoryError("file_too_large");
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
        while (true) {
            const part = await reader.read();
            if (part.done) break;
            size += part.value.length;
            if (size > maximumBytes) { await reader.cancel(); throw new RepositoryError("file_too_large"); }
            chunks.push(part.value);
        }
        return Buffer.concat(chunks, size);
    } finally { reader.releaseLock(); }
}

export function createAdoClient({ profile, connection, request = fetch, pause = (milliseconds: number, signal: AbortSignal) => delay(milliseconds, undefined, { signal }) }: {
    profile: Readonly<RepositoryProfile>;
    connection: RepositoryConnection;
    request?: typeof fetch;
    pause?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}) {
    const api = {
        async open(): Promise<AdoOperation> {
            const access = await connection.access();
            const expiresAt = Date.now() + 35_000;
            const signal = AbortSignal.any([access.signal, AbortSignal.timeout(35_000)]);
            let retries = 2;
            async function send(segments: string[], query: Record<string, string>, options: { body?: unknown; search?: boolean; personalization?: boolean }, accept: string) {
                if (segments.some((segment) => !segment || segment === "." || segment === ".." || /[\p{Cc}/\\?#]/u.test(segment))) throw new RepositoryError("invalid_request");
                const url = new URL(`https://${options.search ? "almsearch.dev.azure.com" : "dev.azure.com"}/${[profile.organization, ...segments].map(encodeURIComponent).join("/")}`);
                url.searchParams.set("api-version", "7.1");
                for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
                while (true) {
                    access.assertCurrent();
                    if (signal.aborted) throw new RepositoryError("upstream_unavailable");
                    let response: Response;
                    try {
                        response = await request(url, { method: options.body === undefined ? "GET" : "POST",
                            headers: { Authorization: `Bearer ${access.accessToken}`, Accept: accept,
                                ...(options.body === undefined ? {} : { "Content-Type": "application/json" }) },
                            body: options.body === undefined ? undefined : JSON.stringify(options.body),
                            redirect: "error", signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) });
                    } catch {
                        access.assertCurrent();
                        throw new RepositoryError("upstream_unavailable");
                    }
                    access.assertCurrent();
                    if (response.ok) return response;
                    await response.body?.cancel();
                    if ([401, 403, 404].includes(response.status)) {
                        throw new RepositoryError(options.personalization && response.status === 403 ? "insufficient_scope" : "resource_unavailable");
                    }
                    const header = response.headers.get("retry-after");
                    const seconds = header && Number.isFinite(Number(header)) ? Math.max(1, Math.ceil(Number(header))) :
                        header && Number.isFinite(Date.parse(header)) ? Math.max(1, Math.ceil((Date.parse(header) - Date.now()) / 1000)) : 1;
                    if (![429, 502, 503, 504].includes(response.status) || retries <= 0 || Date.now() + seconds * 1000 >= expiresAt) {
                        throw new RepositoryError(response.status === 429 ? "rate_limited" : "upstream_unavailable", seconds);
                    }
                    retries--;
                    await pause(seconds * 1000, signal).catch(() => { throw new RepositoryError("upstream_unavailable"); });
                }
            }
            return {
                access, signal,
                async json(segments, query = {}, options = {}) {
                    const response = await send(segments, query, options, "application/json");
                    const payload = await readBoundedJson(response, options.maximumBytes ?? 25 * 1024 * 1024);
                    access.assertCurrent();
                    return record(payload);
                },
                async bytes(segments, query = {}, maximumBytes = 5_242_880) {
                    const response = await send(segments, query, {}, "application/octet-stream");
                    try {
                        const bytes = await responseBytes(response, maximumBytes);
                        access.assertCurrent();
                        return bytes;
                    } catch (error) {
                        if (error instanceof RepositoryError) throw error;
                        throw new RepositoryError("upstream_unavailable");
                    }
                },
            };
        },
        async list(operation: AdoOperation): Promise<RepositorySummary[]> {
            const payload = await operation.json([profile.project, "_apis", "git", "repositories"]);
            if (!Array.isArray(payload.value)) throw new RepositoryError("upstream_unavailable");
            return payload.value.filter((value) => !record(value).isDisabled).map((value) => repositorySummary(value, profile));
        },
        async repository(operation: AdoOperation, id: string): Promise<RepositorySummary> {
            if (!UUID.test(id)) throw new RepositoryError("invalid_request");
            const raw = await operation.json([profile.project, "_apis", "git", "repositories", id]);
            if (raw.isDisabled) throw new RepositoryError("resource_unavailable");
            const result = repositorySummary(raw, profile);
            if (result.id !== id.toLowerCase()) throw new RepositoryError("resource_unavailable");
            return result;
        },
        async commit(operation: AdoOperation, repository: RepositorySummary): Promise<string | null> {
            if (!repository.defaultBranch || repository.operationalState !== "active") return null;
            const raw = await operation.json([profile.project, "_apis", "git", "repositories", repository.id, "refs"], { filter: repository.defaultBranch.slice(5) });
            if (!Array.isArray(raw.value)) throw new RepositoryError("upstream_unavailable");
            const ref = raw.value.map(record).find((reference) => reference.name === repository.defaultBranch);
            return typeof ref?.objectId === "string" && COMMIT.test(ref.objectId) && !/^0+$/.test(ref.objectId) ? ref.objectId.toLowerCase() : null;
        },
        async item(operation: AdoOperation, repositoryId: string, commit: string, path: string) {
            if (!UUID.test(repositoryId) || !COMMIT.test(commit)) throw new RepositoryError("invalid_request");
            return operation.json([profile.project, "_apis", "git", "repositories", repositoryId, "items"], {
                path, "versionDescriptor.versionType": "commit", "versionDescriptor.version": commit,
                includeContentMetadata: "true", resolveLfs: "false",
            });
        },
        async tree(operation: AdoOperation, repositoryId: string, commit: string, path: string) {
            if (!UUID.test(repositoryId) || !COMMIT.test(commit)) throw new RepositoryError("invalid_request");
            const raw = await operation.json([profile.project, "_apis", "git", "repositories", repositoryId, "items"], {
                scopePath: path, recursionLevel: "Full", "versionDescriptor.versionType": "commit", "versionDescriptor.version": commit,
                includeContentMetadata: "true", resolveLfs: "false",
            });
            if (!Array.isArray(raw.value)) throw new RepositoryError("upstream_unavailable");
            return raw.value.map(record);
        },
        async blob(operation: AdoOperation, repositoryId: string, objectId: string, maximumBytes = 5_242_880) {
            if (!UUID.test(repositoryId) || !COMMIT.test(objectId)) throw new RepositoryError("invalid_request");
            return operation.bytes([profile.project, "_apis", "git", "repositories", repositoryId, "blobs", objectId], { download: "true" }, maximumBytes);
        },
    };
    return api;
}

function repositorySummary(value: unknown, profile: Readonly<RepositoryProfile>): RepositorySummary {
    const raw = record(value);
    const project = record(raw.project);
    if (typeof raw.id !== "string" || !UUID.test(raw.id) || typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 256 ||
        /[\p{Cc}\p{Cf}]/u.test(raw.name) ||
        (String(project.name).toLowerCase() !== profile.project.toLowerCase() && String(project.id).toLowerCase() !== profile.project.toLowerCase())) {
        throw new RepositoryError("resource_unavailable");
    }
    const defaultBranch = typeof raw.defaultBranch === "string" && raw.defaultBranch.startsWith("refs/heads/") &&
        raw.defaultBranch.length <= 1024 && !/[\p{Cc}\p{Cf}]/u.test(raw.defaultBranch) ? raw.defaultBranch : null;
    return { id: raw.id.toLowerCase(), name: raw.name, defaultBranch, operationalState: raw.isInMaintenance ? "maintenance" : "active" };
}

export type AdoClient = ReturnType<typeof createAdoClient>;

export async function readBoundedJson(response: Response, maximumBytes: number): Promise<unknown> {
    if (!response.body || Number(response.headers.get("content-length")) > maximumBytes) throw new RepositoryError("upstream_unavailable");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
        while (true) {
            const part = await reader.read();
            if (part.done) break;
            bytes += part.value.length;
            if (bytes > maximumBytes) { await reader.cancel(); throw new RepositoryError("upstream_unavailable"); }
            chunks.push(part.value);
        }
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        throw new RepositoryError("upstream_unavailable");
    } finally { reader.releaseLock(); }
}

function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new RepositoryError("resource_unavailable");
    return value as Record<string, unknown>;
}

export async function readRepositoryProof({ profile, connection, repositoryName, request = fetch }: {
    profile: Readonly<RepositoryProfile>;
    connection: RepositoryConnection;
    repositoryName: string;
    request?: typeof fetch;
}) {
    if (!repositoryName || repositoryName.length > 128 || /[\p{Cc}\p{Cf}/\\?#%]/u.test(repositoryName)) throw new RepositoryError("invalid_request");
    const access = await connection.access();
    const deadline = AbortSignal.any([access.signal, AbortSignal.timeout(35_000)]);

    async function get(segments: string[], parameters: Record<string, string> = {}) {
        access.assertCurrent();
        const url = new URL(`https://dev.azure.com/${[profile.organization, profile.project, "_apis", "git", ...segments].map(encodeURIComponent).join("/")}`);
        url.searchParams.set("api-version", "7.1");
        for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
        try {
            const response = await request(url, { headers: { Authorization: `Bearer ${access.accessToken}`, Accept: "application/json" },
                redirect: "error", signal: AbortSignal.any([deadline, AbortSignal.timeout(10_000)]) });
            access.assertCurrent();
            if ([401, 403, 404].includes(response.status)) { await response.body?.cancel(); throw new RepositoryError("resource_unavailable"); }
            if (!response.ok) { await response.body?.cancel(); throw new RepositoryError("upstream_unavailable"); }
            const payload = await readBoundedJson(response, 25 * 1024 * 1024);
            access.assertCurrent();
            return record(payload);
        } catch (error) {
            if (error instanceof RepositoryError) throw error;
            throw new RepositoryError(access.signal.aborted ? "invalid_context" : "upstream_unavailable");
        }
    }

    const repository = await get(["repositories", repositoryName]);
    const project = record(repository.project);
    if (typeof repository.id !== "string" || !UUID.test(repository.id) || typeof repository.name !== "string" ||
        repository.name.toLowerCase() !== repositoryName.toLowerCase() ||
        typeof project.name !== "string" || project.name.toLowerCase() !== profile.project.toLowerCase() ||
        repository.isDisabled || repository.isInMaintenance || typeof repository.defaultBranch !== "string" ||
        !repository.defaultBranch.startsWith("refs/heads/")) throw new RepositoryError("resource_unavailable");
    const repositoryId = repository.id;
    const branch = repository.defaultBranch;
    const refs = await get(["repositories", repositoryId, "refs"], { filter: branch.slice(5) });
    if (!Array.isArray(refs.value)) throw new RepositoryError("resource_unavailable");
    const selected = refs.value.map(record).find((reference) => reference.name === branch);
    if (typeof selected?.objectId !== "string" || !COMMIT.test(selected.objectId)) throw new RepositoryError("resource_unavailable");
    const sourceVersion = selected.objectId;
    const item = await get(["repositories", repositoryId, "items"], { path: PROOF_ARTIFACT,
        "versionDescriptor.versionType": "commit", "versionDescriptor.version": sourceVersion,
        includeContent: "true", includeContentMetadata: "true" });
    if (item.path !== PROOF_ARTIFACT || item.isFolder || typeof item.objectId !== "string" || !COMMIT.test(item.objectId) ||
        record(item.contentMetadata).isBinary || typeof item.content !== "string" || Buffer.byteLength(item.content, "utf8") > 5_242_880) {
        throw new RepositoryError("resource_unavailable");
    }
    access.assertCurrent();
    return { repositoryId, branch, sourceVersion, path: PROOF_ARTIFACT, objectId: item.objectId,
        content: item.content, byteSize: Buffer.byteLength(item.content, "utf8"),
        revision: `sha256:${createHash("sha256").update(item.content).digest("hex")}`, generation: access.generation };
}