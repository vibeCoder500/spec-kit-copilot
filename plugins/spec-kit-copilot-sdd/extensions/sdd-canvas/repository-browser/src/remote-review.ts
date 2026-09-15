import { createHash, randomBytes } from "node:crypto";
import { posix } from "node:path";
import type { AdoClient, AdoOperation } from "./ado-client.ts";
import { createContinuations } from "./continuations.ts";
import { repositoryDetail } from "./discovery.ts";
import { RepositoryError } from "./errors.ts";
import type { ArtifactRoot, ItemPage, RemoteDocument, RepositoryContext, RepositoryItem } from "./types.ts";

interface ReviewState {
    context: RepositoryContext;
    identity: string;
    expiresAt: number;
    items: Map<string, RepositoryItem>;
    roots: Map<ArtifactRoot, RepositoryItem[]>;
}

const ROOTS: ArtifactRoot[] = ["/.specify", "/specs"];
const identity = (operation: AdoOperation) => JSON.stringify([operation.access.tenantId, operation.access.accountId, operation.access.connectionId, operation.access.generation]);

export function allowedArtifactPath(path: string): string {
    if (typeof path !== "string" || path.length > 4096 || /[\p{Cc}\p{Cf}\\%?:#]/u.test(path) ||
        !ROOTS.some((root) => path === root || path.startsWith(`${root}/`)) ||
        path.split("/").slice(1).some((segment) => !segment || segment === "." || segment === "..")) throw new RepositoryError("invalid_request");
    return path;
}

export function decodeArtifact(bytes: Uint8Array, encoding?: unknown, binary = false): string {
    if (binary) throw new RepositoryError("unsupported_file");
    if (bytes.length > 5_242_880) throw new RepositoryError("file_too_large");
    let label = "utf-8";
    let offset = 0;
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) offset = 3;
    else if (bytes[0] === 0xff && bytes[1] === 0xfe) { label = "utf-16le"; offset = 2; }
    else if (bytes[0] === 0xfe && bytes[1] === 0xff) { label = "utf-16be"; offset = 2; }
    else if (encoding !== undefined && encoding !== null) {
        const metadata = String(encoding).trim().toLowerCase();
        if (["1200", "utf-16", "utf-16le", "unicode"].includes(metadata)) label = "utf-16le";
        else if (["1201", "utf-16be", "unicodefffe"].includes(metadata)) label = "utf-16be";
        else if (!["", "65001", "1252", "utf8", "utf-8"].includes(metadata)) throw new RepositoryError("unsupported_file");
    }
    let content: string;
    try { content = new TextDecoder(label, { fatal: true }).decode(bytes.subarray(offset)); }
    catch { throw new RepositoryError("unsupported_file"); }
    const sample = content.slice(0, 8192);
    const controls = [...sample].filter((character) => { const code = character.charCodeAt(0); return code < 9 || (code > 13 && code < 32); }).length;
    if (content.includes("\0") || (sample.length > 0 && controls / sample.length > 0.3)) throw new RepositoryError("unsupported_file");
    if (Buffer.byteLength(content, "utf8") > 5_242_880) throw new RepositoryError("file_too_large");
    return content;
}

export function createRemoteReview({ client, now = Date.now }: { client: AdoClient; now?: () => number }) {
    const states = new Map<string, ReviewState>();
    const cursors = createContinuations({ now });

    async function use(contextId: string) {
        const state = states.get(contextId);
        if (!state || state.expiresAt <= now()) { states.delete(contextId); throw new RepositoryError("invalid_context"); }
        const operation = await client.open();
        if (state.identity !== identity(operation)) { states.delete(contextId); throw new RepositoryError("invalid_context"); }
        try {
            const repository = await client.repository(operation, state.context.repository.id);
            if (repository.operationalState !== "active") throw new RepositoryError("resource_unavailable");
        } catch (error) {
            if (error instanceof RepositoryError && error.code === "resource_unavailable") states.delete(contextId);
            throw error;
        }
        return { state, operation };
    }

    function asItem(state: ReviewState, raw: Record<string, unknown>): RepositoryItem {
        const path = allowedArtifactPath(String(raw.path));
        if (typeof raw.objectId !== "string" || !/^[a-f0-9]{40}$/i.test(raw.objectId) || raw.gitObjectType === "commit") throw new RepositoryError("unsupported_file");
        const objectId = raw.objectId.toLowerCase();
        const kind = raw.isFolder === true ? "folder" : "file";
        const id = `remote_${createHash("sha256").update(JSON.stringify([state.context.contextId, path, objectId, kind])).digest("base64url")}`;
        return { id, path, objectId, kind, label: posix.basename(path) };
    }

    async function read(state: ReviewState, operation: AdoOperation, item: RepositoryItem): Promise<RemoteDocument> {
        if (item.kind !== "file") throw new RepositoryError("unsupported_file");
        const source = state.context;
        const metadata = await client.item(operation, source.repository.id, source.sourceVersion, item.path);
        if (metadata.path !== item.path || metadata.isFolder || metadata.objectId !== item.objectId) throw new RepositoryError("source_unavailable");
        const contentMetadata = metadata.contentMetadata && typeof metadata.contentMetadata === "object" ? metadata.contentMetadata as Record<string, unknown> : {};
        if (contentMetadata.isBinary === true) throw new RepositoryError("unsupported_file");
        const bytes = await client.blob(operation, source.repository.id, item.objectId);
        const content = decodeArtifact(bytes, contentMetadata.encoding, contentMetadata.isBinary === true);
        operation.access.assertCurrent();
        return { artifact: { id: item.id, relativePath: item.path.slice(1), label: item.label, role: "reference", availability: "available" },
            revision: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, content, byteSize: bytes.length, sourceKind: "git-commit",
            source: { provider: "azure-devops", repositoryId: source.repository.id, repositoryName: source.repository.name,
                branch: source.repository.defaultBranch!, commit: source.sourceVersion, objectId: item.objectId },
            format: /\.(?:md|markdown)$/i.test(item.path) ? "markdown" : "text", contextId: source.contextId, generation: source.generation };
    }

    const service = {
        async open(repositoryId: string): Promise<RepositoryContext> {
            const operation = await client.open();
            const repository = await repositoryDetail(client, operation, repositoryId);
            if (!repository.sourceVersion || repository.operationalState !== "active") throw new RepositoryError("source_unavailable");
            const context: RepositoryContext = { contextId: `remote-context_${randomBytes(24).toString("base64url")}`, repository,
                sourceVersion: repository.sourceVersion, generation: operation.access.generation, roots: repository.speckitStatus === "enabled" ? [...ROOTS] : [] };
            for (const [key, entry] of states) if (entry.expiresAt <= now()) states.delete(key);
            if (states.size >= 16) states.delete(states.keys().next().value!);
            states.set(context.contextId, { context, identity: identity(operation), expiresAt: now() + 600_000, items: new Map(), roots: new Map() });
            return structuredClone(context);
        },
        async items(contextId: string, root: ArtifactRoot, cursor?: string): Promise<ItemPage> {
            const { state, operation } = await use(contextId);
            if (!state.context.roots.includes(root)) throw new RepositoryError("invalid_request");
            let items = state.roots.get(root);
            if (!items) {
                let raw: Record<string, unknown>[];
                try { raw = await client.tree(operation, state.context.repository.id, state.context.sourceVersion, root); }
                catch (error) {
                    if (!(error instanceof RepositoryError) || error.code !== "resource_unavailable") throw error;
                    await client.repository(operation, state.context.repository.id);
                    raw = [];
                }
                if (raw.length > 10_000) throw new RepositoryError("upstream_unavailable");
                const paths = new Set<string>();
                items = [];
                for (const entry of raw) {
                    if (entry.path === root && entry.isFolder === true) continue;
                    const item = asItem(state, entry);
                    if (!item.path.startsWith(`${root}/`) || paths.has(item.path)) throw new RepositoryError("source_unavailable");
                    paths.add(item.path);
                    items.push(item);
                }
                items.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : left.objectId.localeCompare(right.objectId, "en"));
                operation.access.assertCurrent();
                state.roots.set(root, items);
                for (const item of items) state.items.set(item.id, item);
            }
            const binding = { identity: state.identity, contextId, root, commit: state.context.sourceVersion, pageSize: 50 };
            const offset = cursor ? cursors.verify(cursor, "items", binding) : 0;
            if (offset > items.length) throw new RepositoryError("invalid_context");
            const page = items.slice(offset, offset + 50);
            const hasMore = offset + page.length < items.length;
            operation.access.assertCurrent();
            return { items: page.map((item) => ({ ...item })), hasMore, cursor: hasMore ? cursors.issue("items", binding, offset + page.length) : null,
                contextId, sourceVersion: state.context.sourceVersion };
        },
        async content(contextId: string, itemId: string): Promise<RemoteDocument> {
            const { state, operation } = await use(contextId);
            const item = state.items.get(itemId);
            if (!item) throw new RepositoryError("invalid_context");
            return read(state, operation, item);
        },
        async reference(contextId: string, itemId: string, target: string) {
            const { state, operation } = await use(contextId);
            const source = state.items.get(itemId);
            if (!source || source.kind !== "file" || typeof target !== "string" || target.length > 4096 || /[\p{Cc}\p{Cf}\\]/u.test(target)) throw new RepositoryError("invalid_request");
            let url: URL;
            let path: string;
            let fragment: string;
            try {
                url = new URL(target, `https://repository.invalid${source.path}`);
                if (url.origin !== "https://repository.invalid" || url.search || url.username || url.password) throw new Error();
                path = allowedArtifactPath(decodeURIComponent(url.pathname));
                fragment = decodeURIComponent(url.hash.slice(1));
            } catch { throw new RepositoryError("invalid_request"); }
            const raw = await client.item(operation, state.context.repository.id, state.context.sourceVersion, path);
            if (raw.path !== path) throw new RepositoryError("source_unavailable");
            const item = asItem(state, raw);
            operation.access.assertCurrent();
            state.items.set(item.id, item);
            return { document: await read(state, operation, item), fragment };
        },
        async refresh(contextId: string) {
            const { state } = await use(contextId);
            const next = await service.open(state.context.repository.id);
            states.delete(contextId);
            return next;
        },
        async source(contextId: string) {
            const { state, operation } = await use(contextId);
            operation.access.assertCurrent();
            return structuredClone(state.context);
        },
        clear() { states.clear(); },
        dispose() { states.clear(); cursors.dispose(); },
    };
    return service;
}

export type RemoteReview = ReturnType<typeof createRemoteReview>;