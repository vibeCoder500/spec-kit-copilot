import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { basename } from "node:path";
import { createAdoClient } from "./ado-client.ts";
import { createPreparedArtifactClock } from "./artifact-clock.ts";
import { createCloneService } from "./clone.ts";
import { createRepositoryConnection } from "./auth.ts";
import type { AuthDependencies } from "./auth.ts";
import { createRepositoryDiscovery } from "./discovery.ts";
import { errorEnvelope, RepositoryError } from "./errors.ts";
import { nativeAuthDependencies } from "./msal-client.ts";
import { loadRepositoryProfile } from "./profile.ts";
import type { ProfileStatus } from "./profile.ts";
import { createRemoteReview } from "./remote-review.ts";
import type { ArtifactRoot } from "./types.ts";
import { assertWorkspaceBinding, inspectWorkspaceBinding } from "./workspace-binding.ts";
import type { WorkspaceBinding } from "./workspace-binding.ts";

export async function createRepositoryService({ workspacePath, profileStatus, dependencies, request, cloneOptions, bindingOptions, onChange = () => undefined }: {
    workspacePath: string;
    profileStatus?: ProfileStatus;
    dependencies?: AuthDependencies;
    request?: typeof fetch;
    cloneOptions?: Partial<Pick<Parameters<typeof createCloneService>[0], "homeDirectory" | "runner" | "executable" | "now">>;
    bindingOptions?: Partial<Pick<Parameters<typeof inspectWorkspaceBinding>[0], "homeDirectory" | "runner" | "executable">>;
    onChange?: () => void;
}) {
    const configuration = profileStatus ?? await loadRepositoryProfile();
    const localContextId = `local_${randomBytes(24).toString("base64url")}`;
    let workspaceBinding: WorkspaceBinding = await inspectWorkspaceBinding({ workspacePath, ...bindingOptions });
    const artifactTime = await createPreparedArtifactClock({ workspacePath, binding: workspaceBinding, ...bindingOptions });
    let mode: "local" | "remote" = "local";
    let selectedContextId: string | undefined;
    let generation = 0;
    let selectionGeneration = 0;
    let disposed = false;
    const profile = configuration.state === "configured" ? configuration.profile : undefined;
    const adapter = dependencies ?? nativeAuthDependencies();
    const connection = profile ? createRepositoryConnection(profile, { ...adapter, onChange: (snapshot) => {
        if (snapshot.generation !== generation || snapshot.state !== "connected") {
            generation = snapshot.generation;
            selectionGeneration++;
            discovery?.clear(); review?.clear(); clones?.clear(); selectedContextId = undefined; mode = "local";
        }
        adapter.onChange?.(snapshot);
        onChange();
    } }) : undefined;
    const client = profile && connection ? createAdoClient({ profile, connection, request }) : undefined;
    const discovery = client && profile ? createRepositoryDiscovery({ client, profile }) : undefined;
    const review = client ? createRemoteReview({ client }) : undefined;
    const clones = review && profile && connection ? createCloneService({ review, profile, connection, workspacePath, ...cloneOptions, onChange }) : undefined;

    function available() {
        if (disposed || !connection || !discovery || !review) throw new RepositoryError("connection_required");
        return { connection, discovery, review };
    }

    const service = {
        artifactTime,
        snapshot() {
            return { configuration: configuration.state, connection: connection?.snapshot() ?? { state: "disconnected", generation: 0, projectLabel: "" },
                localContext: { contextId: localContextId, label: basename(workspacePath), binding: workspaceBinding.state }, mode, selectedContextId: selectedContextId ?? null,
                capabilities: { browse: Boolean(connection), clone: Boolean(clones) } };
        },
        connect() { return available().connection.connect(); },
        disconnect() { connection?.disconnect(); },
        search: (query: string, cursor?: string) => available().discovery.search(query, cursor),
        relevant: (cursor?: string) => available().discovery.relevant(cursor),
        detail: (id: string) => available().discovery.detail(id),
        async context(repositoryId: string) {
            const selection = ++selectionGeneration;
            const context = await available().review.open(repositoryId);
            if (selection !== selectionGeneration || disposed) throw new RepositoryError("invalid_context");
            mode = "remote"; selectedContextId = context.contextId; onChange();
            return context;
        },
        items: (contextId: string, root: ArtifactRoot, cursor?: string) => available().review.items(contextId, root, cursor),
        content: (contextId: string, itemId: string) => available().review.content(contextId, itemId),
        reference: (contextId: string, itemId: string, target: string) => available().review.reference(contextId, itemId, target),
        async refresh(contextId: string) {
            const selection = ++selectionGeneration;
            const context = await available().review.refresh(contextId);
            if (selection !== selectionGeneration || disposed) throw new RepositoryError("invalid_context");
            mode = "remote"; selectedContextId = context.contextId; onChange();
            return context;
        },
        selectLocal() { selectionGeneration++; mode = "local"; selectedContextId = undefined; onChange(); return service.snapshot(); },
        cloneConfirm(contextId: string) { available(); if (!clones) throw new RepositoryError("clone_conflict"); return clones.confirm(contextId); },
        cloneStart(operationId: string, confirmation: string) { available(); if (!clones) throw new RepositoryError("clone_conflict"); return clones.start(operationId, confirmation); },
        cloneStatus(operationId: string) { available(); if (!clones) throw new RepositoryError("clone_conflict"); return clones.status(operationId); },
        cloneCancel(operationId: string) { available(); if (!clones) throw new RepositoryError("clone_conflict"); clones.cancel(operationId); },
        assertLocal(contextId?: string) {
            if (disposed) throw new RepositoryError("invalid_context");
            if (mode !== "local") throw new RepositoryError("remote_read_only");
            if ((profile || contextId !== undefined) && contextId !== localContextId) throw new RepositoryError("local_context_mismatch");
        },
        async verifyLocal(contextId?: string) {
            service.assertLocal(contextId);
            workspaceBinding = await inspectWorkspaceBinding({ workspacePath, ...bindingOptions, previous: workspaceBinding });
            service.assertLocal(contextId);
            assertWorkspaceBinding(workspaceBinding);
        },
        dispose() { disposed = true; connection?.dispose(); discovery?.dispose(); review?.dispose(); clones?.dispose(); },
    };
    return service;
}

export type RepositoryService = Awaited<ReturnType<typeof createRepositoryService>>;

function text(input: unknown, maximum = 256): string {
    if (typeof input !== "string" || !input || input.length > maximum || /[\p{Cc}]/u.test(input)) throw new RepositoryError("invalid_request");
    return input;
}

async function requestBody(req: IncomingMessage): Promise<Record<string, unknown>> {
    if (!/^application\/json(?:;|$)/i.test(String(req.headers["content-type"] ?? ""))) throw new RepositoryError("invalid_request");
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        size += chunk.length;
        if (size > 32_768) throw new RepositoryError("invalid_request");
        chunks.push(chunk);
    }
    try {
        const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        return parsed as Record<string, unknown>;
    } catch { throw new RepositoryError("invalid_request"); }
}

export async function handleRepositoryRequest(req: IncomingMessage, res: ServerResponse, url: URL, service: RepositoryService) {
    function json(status: number, payload: unknown) {
        res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" });
        res.end(JSON.stringify(payload));
    }
    try {
        if (req.method !== "GET" && req.method !== "POST") throw new RepositoryError("invalid_request");
        if (req.method === "POST" && req.headers.origin !== url.origin) throw new RepositoryError("invalid_request");
        const path = url.pathname.slice("/api/repositories/".length);
        const queries: Record<string, string[]> = { connection: [], relevant: ["cursor"], search: ["q", "cursor"], detail: ["repositoryId"],
            items: ["contextId", "root", "cursor"], content: ["contextId", "itemId"], clone: ["operationId"] };
        const bodies: Record<string, string[]> = { connect: [], disconnect: [], context: ["repositoryId"], reference: ["contextId", "itemId", "target"], refresh: ["contextId"], local: [],
            "clone/confirm": ["contextId"], clone: ["operationId", "confirmation"], "clone/cancel": ["operationId"] };
        const allowed = req.method === "GET" ? queries[path] : bodies[path];
        if (!allowed) throw new RepositoryError("invalid_request");
        for (const key of url.searchParams.keys()) {
            if (url.searchParams.getAll(key).length !== 1 || (key !== "cap" && (req.method !== "GET" || !allowed.includes(key)))) throw new RepositoryError("invalid_request");
        }
        const body = req.method === "POST" ? await requestBody(req) : {};
        if (Object.keys(body).some((key) => !allowed.includes(key))) throw new RepositoryError("invalid_request");
        const query = (key: string, maximum?: number) => text(url.searchParams.get(key), maximum);
        const cursor = url.searchParams.has("cursor") ? query("cursor", 8192) : undefined;
        let data: unknown;
        if (path === "connection") data = service.snapshot();
        else if (path === "connect") { const started = service.connect(); json(202, { ok: true, data: { transactionId: started.transactionId } }); return; }
        else if (path === "disconnect") { service.disconnect(); data = service.snapshot(); }
        else if (path === "local") data = service.selectLocal();
        else if (path === "clone/confirm") data = await service.cloneConfirm(text(body.contextId));
        else if (path === "clone" && req.method === "POST") { data = await service.cloneStart(text(body.operationId), text(body.confirmation)); json(202, { ok: true, data }); return; }
        else if (path === "clone") data = service.cloneStatus(query("operationId"));
        else if (path === "clone/cancel") { service.cloneCancel(text(body.operationId)); data = { cancelled: true }; }
        else if (path === "search") data = await service.search(query("q"), cursor);
        else if (path === "relevant") data = await service.relevant(cursor);
        else if (path === "detail") data = await service.detail(query("repositoryId"));
        else if (path === "context") data = await service.context(text(body.repositoryId));
        else if (path === "items") {
            const root = query("root");
            if (root !== "/.specify" && root !== "/specs") throw new RepositoryError("invalid_request");
            data = await service.items(query("contextId"), root, cursor);
        } else if (path === "content") data = await service.content(query("contextId"), query("itemId"));
        else if (path === "reference") data = await service.reference(text(body.contextId), text(body.itemId), text(body.target, 4096));
        else if (path === "refresh") data = await service.refresh(text(body.contextId));
        else throw new RepositoryError("invalid_request");
        json(200, { ok: true, data });
    } catch (error) {
        const envelope = errorEnvelope(error);
        const status = envelope.error.code === "invalid_request" ? 400 : envelope.error.code === "resource_unavailable" ? 404 :
            ["connection_required", "interaction_required"].includes(envelope.error.code) ? 401 :
            ["wrong_tenant", "insufficient_scope", "policy_blocked"].includes(envelope.error.code) ? 403 :
            envelope.error.code === "rate_limited" ? 429 : envelope.error.code === "upstream_unavailable" ? 503 : 409;
        json(status, envelope);
    }
}