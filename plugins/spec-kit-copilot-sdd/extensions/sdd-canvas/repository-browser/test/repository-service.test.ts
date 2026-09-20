import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { AuthenticationResult } from "@azure/msal-node";
import * as repositoryModule from "../src/repository-service.ts";
import { createRepositoryService, handleRepositoryRequest } from "../src/repository-service.ts";
import { parseRepositoryProfile } from "../src/profile.ts";
import { RepositoryError } from "../src/errors.ts";
import { createPreparationStore } from "../src/preparation-store.ts";
import type { CanvasReadiness, HandoffOutcome, HostHandoffAdapter, HostWorkspaceSnapshot, LocalRepositoryIdentity, WorkspaceActivation } from "../src/types.ts";

const profile = parseRepositoryProfile({ schemaVersion: 1, enabled: true, tenantId: "11111111-1111-4111-8111-111111111111",
    clientId: "22222222-2222-4222-8222-222222222222", organization: "Synthetic", project: "Project" });
const repositoryId = "33333333-3333-4333-8333-333333333333";

test("Unconfigured service stays offline and preserves legacy local workflow requests", async () => {
    let calls = 0;
    const service = await createRepositoryService({ workspacePath: "/synthetic", profileStatus: { state: "unconfigured" },
        request: async () => { calls++; throw new Error("Unexpected network"); } });
    assert.equal(service.snapshot().configuration, "unconfigured");
    service.assertLocal();
    await service.verifyLocal();
    assert.throws(() => service.assertLocal("another-context"), { code: "local_context_mismatch" });
    assert.throws(() => service.connect(), { code: "connection_required" });
    assert.equal(calls, 0);
    service.dispose();
});

test("Remote selection blocks workflows until explicit local selection and context match", async () => {
    const result = (nonce?: string) => ({ accessToken: "synthetic-token", tenantId: profile.tenantId, scopes: ["vso.code"], expiresOn: new Date(Date.now() + 600_000), idTokenClaims: { nonce },
        account: { tenantId: profile.tenantId, localAccountId: repositoryId, homeAccountId: "synthetic-account", username: "synthetic@example.invalid" } }) as AuthenticationResult;
    const service = await createRepositoryService({ workspacePath: "/synthetic", profileStatus: { state: "configured", profile }, dependencies: {
        createClient: () => ({ getAuthCodeUrl: async () => `https://login.microsoftonline.com/${profile.tenantId}/oauth2/v2.0/authorize`,
            acquireTokenByCode: async (request) => result(request.nonce), acquireTokenSilent: async () => result(), clear: async () => undefined }),
        generatePkce: async () => ({ verifier: "synthetic", challenge: "synthetic" }), openBrowser: async () => undefined,
        callback: async () => ({ redirectUri: "http://localhost:32100/speckit-canvas/oauth/callback", result: Promise.resolve("synthetic-code"), close() {} }),
    }, request: async (input) => {
        const url = new URL(String(input));
        const value = url.pathname.endsWith("/refs") ? { value: [{ name: "refs/heads/main", objectId: "a".repeat(40) }] } :
            url.pathname.endsWith("/items") ? { path: "/.specify", isFolder: true } :
                { id: repositoryId, name: "Synthetic", defaultBranch: "refs/heads/main", project: { name: profile.project } };
        return new Response(JSON.stringify(value));
    } });
    const local = service.snapshot().localContext.contextId;
    assert.throws(() => service.assertLocal(), { code: "local_context_mismatch" });
    service.assertLocal(local);
    await service.connect().completion;
    const context = await service.context(repositoryId);
    assert.equal(service.snapshot().selectedContextId, context.contextId);
    assert.throws(() => service.assertLocal(local), { code: "remote_read_only" });
    await assert.rejects(service.verifyLocal(local), { code: "remote_read_only" });
    service.selectLocal();
    service.assertLocal(local);
    const late = service.context(repositoryId);
    service.selectLocal();
    await assert.rejects(late, { code: "invalid_context" });
    assert.equal(service.snapshot().mode, "local");
    service.disconnect();
    assert.equal(service.snapshot().connection.state, "disconnected");
    assert.equal(service.snapshot().selectedContextId, null);
    service.dispose();
});

test("Repository routes enforce methods, origin, duplicate parameters, body shape, and safe errors", async () => {
    const service = await createRepositoryService({ workspacePath: "/synthetic", profileStatus: { state: "unconfigured" } });
    let origin = "";
    const server = createServer((req, res) => { void handleRepositoryRequest(req, res, new URL(req.url!, origin), service); });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    try {
        const endpoint = (path: string) => `${origin}/api/repositories/${path}`;
        assert.equal((await fetch(endpoint("connection"))).status, 200);
        for (const path of ["context", "items", "content", "reference", "refresh", "local", "clone", "clone/confirm", "clone/cancel"]) {
            assert.equal((await fetch(endpoint(path))).status, 400);
            assert.equal((await fetch(endpoint(path), { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: "{}" })).status, 400);
        }
        assert.equal((await fetch(endpoint("connection?cap=first&cap=second"))).status, 400);
        assert.equal((await fetch(endpoint("connection?unknown=field"))).status, 400);
        assert.equal((await fetch(endpoint("connect"), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 400);
        for (const body of ["[]", '{"unexpected":true}', "invalid", `{"value":"${"x".repeat(32_769)}"}`]) {
            assert.equal((await fetch(endpoint("connect"), { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body })).status, 400);
        }
        const response = await fetch(endpoint("connect"), { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: "{}" });
        assert.equal(response.status, 401);
        assert.equal((await response.json()).error.code, "connection_required");
    } finally { service.dispose(); await new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections(); }); }
});

function offlineEntryHost(): HostHandoffAdapter {
    return {
        inspectCurrent: async () => ({ sessionId: "private-source-session", contextRevision: "private-source-revision", workingDirectory: "/synthetic-private-workspace",
            activity: "unknown", activityRevision: "private-activity", capabilityGeneration: "private-capabilities",
            capabilities: { localCanvas: true, atomicPreparation: false, atomicHandoff: false, targetAcknowledgment: false, handoffReconciliation: false } }),
        openCurrentCanvas: async () => { throw new Error("Unexpected canvas opening"); },
        admitPreparation: async () => { throw new RepositoryError("host_handoff_unsupported"); },
        handoffPrepared: async () => { throw new RepositoryError("host_handoff_unsupported"); },
        getHandoffOutcome: async () => { throw new RepositoryError("host_handoff_unsupported"); },
        dispose() {},
    };
}

test("Entry state is independent of remote authentication and does not expose host identity", async () => {
    const createEntry = Reflect.get(repositoryModule, "createEntryCoordinator");
    assert.equal(typeof createEntry, "function", "The isolated entry coordinator must exist");
    let requests = 0;
    const entry = await createEntry({ host: offlineEntryHost(), profileStatus: { state: "unconfigured" },
        request: async () => { requests++; throw new Error("Unexpected provider request"); } });
    try {
        const state = await entry.state();
        assert.equal(state.configuration, "unconfigured");
        assert.equal(state.phase, "chooser");
        assert.equal(state.host.canPrepareRemote, false);
        assert.equal(requests, 0);
        assert.doesNotMatch(JSON.stringify(state), /private-source-session|private-source-revision|synthetic-private-workspace|private-capabilities|private-activity/);
    } finally { entry.dispose(); }
});

test("Entry HTTP boundary rejects caller-owned paths, duplicate fields, and legacy operations", async () => {
    const handleEntry = Reflect.get(repositoryModule, "handleEntryRequest");
    assert.equal(typeof handleEntry, "function", "The isolated entry request dispatcher must exist");
    let localCalls = 0;
    const entry = {
        state: async () => ({ phase: "chooser" }),
        local: async (contextId: string, requestId: string) => { localCalls++; return { contextId, requestId }; },
    };
    let origin = "";
    const server = createServer((request, response) => { void handleEntry(request, response, new URL(request.url!, origin), entry); });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const headers = { "Content-Type": "application/json", Origin: origin };
    try {
        const endpoint = (path: string) => `${origin}/api/entry/${path}`;
        assert.equal((await fetch(endpoint("state"))).status, 200);
        for (const path of ["state?cap=first&cap=second", "state?workingDirectory=private", "content", "context", "items", "reference", "refresh", "clone/confirm"]) {
            assert.equal((await fetch(endpoint(path))).status, 400, path);
        }
        for (const method of ["PUT", "DELETE", "OPTIONS"]) assert.equal((await fetch(endpoint("state"), { method })).status, 400);
        assert.equal((await fetch(endpoint("local"), { method: "POST", headers: { "Content-Type": "application/json" }, body: '{}' })).status, 400);
        for (const body of ["[]", "invalid", '{"contextId":"first","contextId":"second","requestId":"request"}',
            '{"contextId":"context","requestId":"request","workingDirectory":"private"}',
            '{"contextId":"context","requestId":"request","acknowledgment":{"ready":true}}',
            '{"contextId":"context","requestId":"request","providerId":"untrusted"}',
            `{"contextId":"${"x".repeat(32_769)}","requestId":"request"}`]) {
            assert.equal((await fetch(endpoint("local"), { method: "POST", headers, body })).status, 400);
        }
        assert.equal(localCalls, 0);
        const accepted = await fetch(endpoint("local"), { method: "POST", headers, body: '{"contextId":"context","requestId":"request"}' });
        assert.equal(accepted.status, 200);
        assert.equal(localCalls, 1);
        assert.equal(accepted.headers.get("cache-control"), "no-store");
        assert.equal(accepted.headers.get("referrer-policy"), "no-referrer");
        assert.equal(accepted.headers.get("x-content-type-options"), "nosniff");
    } finally { await new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections(); }); }
});

test("Local entry opens once while disconnected and busy after fresh host and Git checks", async () => {
    let revision = "first-context";
    let head = "a".repeat(40);
    let opened = 0;
    let inspected = 0;
    const host = offlineEntryHost();
    host.inspectCurrent = async () => ({ sessionId: "synthetic-source", contextRevision: revision, workingDirectory: "/synthetic",
        activity: "busy", activityRevision: "busy", capabilityGeneration: "unsupported",
        capabilities: { localCanvas: true, atomicPreparation: false, atomicHandoff: false, targetAcknowledgment: false, handoffReconciliation: false } });
    host.openCurrentCanvas = async (expected, instanceId) => {
        assert.equal(expected.contextRevision, revision); opened++;
        return { ...expected, workingDirectory: "/synthetic", instanceId, providerId: "project:sdd-canvas" };
    };
    const entry = await repositoryModule.createEntryCoordinator({ host, profileStatus: { state: "invalid" },
        request: async () => assert.fail("Local entry cannot contact a provider"), inspectWorkspace: async (): Promise<LocalRepositoryIdentity> => {
            inspected++;
            return { workingDirectory: "/synthetic", worktreeRoot: "/synthetic", gitCommonDirectory: "/synthetic/.git", origin: null,
                head, branch: "refs/heads/local" };
        } });
    try {
        const state = await entry.state();
        assert.equal(state.localContext.state, "repository");
        assert.equal(state.host.canOpenCurrent, true);
        assert.equal(state.host.activity, "busy");
        await entry.local(state.localContext.contextId, "first-request");
        await entry.local(state.localContext.contextId, "first-request");
        assert.equal(opened, 1);
        assert.ok(inspected >= 3);
        revision = "different-context";
        await assert.rejects(entry.local(state.localContext.contextId, "first-request"), { code: "context_changed" });
        assert.equal(opened, 1);
        const refreshed = await entry.state();
        head = "b".repeat(40);
        await assert.rejects(entry.local(refreshed.localContext.contextId, "next-request"), { code: "context_changed" });
        assert.equal(opened, 1);
    } finally { entry.dispose(); }
});

test("Local entry rejects missing repositories, wrong context and changed opening acknowledgments", async () => {
    const host = offlineEntryHost();
    host.openCurrentCanvas = async (expected, instanceId) => ({ ...expected, contextRevision: "another-context",
        workingDirectory: "/another-workspace", providerId: "project:sdd-canvas", instanceId });
    let repository: LocalRepositoryIdentity | null = null;
    const entry = await repositoryModule.createEntryCoordinator({ host, profileStatus: { state: "unconfigured" }, inspectWorkspace: async () => repository });
    try {
        const absent = await entry.state();
        assert.equal(absent.host.canOpenCurrent, false);
        await assert.rejects(entry.local(absent.localContext.contextId, "absent"), { code: "local_context_mismatch" });
        repository = { workingDirectory: "/synthetic-private-workspace", worktreeRoot: "/synthetic-private-workspace",
            gitCommonDirectory: "/synthetic-private-workspace/.git", origin: null, head: "a".repeat(40), branch: "refs/heads/local" };
        const state = await entry.state();
        await assert.rejects(entry.local("wrong-context", "invalid"), { code: "context_changed" });
        await assert.rejects(entry.local(state.localContext.contextId, "mismatched-host"), { code: "context_changed" });
    } finally { entry.dispose(); }
});

test("Entry preparation routes accept only opaque bindings and preserve guarded mutation statuses", async () => {
    const operationId = "a".repeat(32);
    let calls = 0;
    let failure: ConstructorParameters<typeof RepositoryError>[0] | undefined;
    const handleEntry = Reflect.get(repositoryModule, "handleEntryRequest");
    const entry = { state: async () => ({}), local: async () => ({}),
        select: async (repository: string, context: string) => { calls++; return { repository, context, selectionId: "selection" }; },
        clone: async () => { calls++; if (failure) throw new RepositoryError(failure); return { operationId, state: "preparing" }; },
        operation: async (id: string) => { if (id !== operationId) throw new RepositoryError("resource_unavailable"); return { operationId, state: "preparing" }; },
        cancel: async (id: string, requestId: string) => { calls++; return { operationId: id, requestId, state: "cancelled" }; },
        preparations: async () => ({ items: [] }),
        handoff: async (id: string, contextId: string, requestId: string) => { calls++; return { operationId: id, contextId, requestId }; },
    };
    let origin = "";
    const server = createServer((request, response) => { void handleEntry(request, response, new URL(request.url!, origin), entry); });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const post = (path: string, body: unknown) => fetch(`${origin}/api/entry/${path}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    try {
        assert.equal((await post("selection", { repositoryId, contextId: "local" })).status, 200);
        const consent = { selectionId: "selection", confirmation: "nonce", requestId: "request" };
        assert.equal((await post("clone", consent)).status, 202);
        assert.equal((await post("clone", consent)).status, 202);
        for (const [code, status] of [["session_busy", 409], ["activity_unknown", 412], ["host_handoff_unsupported", 412], ["source_changed", 409], ["confirmation_expired", 409]] as const) {
            failure = code;
            const response = await post("clone", consent);
            assert.equal(response.status, status);
            assert.equal((await response.json()).error.code, code);
        }
        const previous = calls;
        for (const extra of [{ destination: "/private" }, { sourceCommit: "a".repeat(40) }, { sessionId: "forged" }, { supported: true }, { targetBranch: "refs/heads/forged" }]) {
            assert.equal((await post("clone", { ...consent, ...extra })).status, 400);
        }
        assert.equal(calls, previous);
        assert.equal((await fetch(`${origin}/api/entry/operations/${operationId}`)).status, 200);
        assert.equal((await fetch(`${origin}/api/entry/operations/${"b".repeat(32)}`)).status, 404);
        assert.equal((await post(`operations/${operationId}/cancel`, { requestId: "cancel" })).status, 200);
        assert.equal((await fetch(`${origin}/api/entry/preparations`)).status, 200);
        assert.equal((await post(`operations/${operationId}/handoff`, { contextId: "local", requestId: "explicit-handoff" })).status, 200);
        assert.equal((await post(`operations/${operationId}/handoff`, { contextId: "local", requestId: "explicit-handoff", targetKind: "host_worktree" })).status, 400);
    } finally { await new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }); }
});

test("Selection stays metadata-only on unsupported hosts and recognizes the current repository", async () => {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-entry-selection-")));
    let currentOrigin: string | null = null;
    let requests = 0;
    const result = (nonce?: string) => ({ accessToken: "synthetic-token", tenantId: profile.tenantId, scopes: ["vso.code"], expiresOn: new Date(Date.now() + 600_000), idTokenClaims: { nonce },
        account: { tenantId: profile.tenantId, localAccountId: repositoryId, homeAccountId: "synthetic-account", username: "synthetic@example.invalid" } }) as AuthenticationResult;
    const entry = await repositoryModule.createEntryCoordinator({ host: offlineEntryHost(), profileStatus: { state: "configured", profile }, cloneOptions: { homeDirectory: home },
        inspectWorkspace: async () => ({ workingDirectory: home, worktreeRoot: home, gitCommonDirectory: join(home, ".git"), origin: currentOrigin, head: "b".repeat(40), branch: "refs/heads/dirty-local" }),
        dependencies: { createClient: () => ({ getAuthCodeUrl: async () => `https://login.microsoftonline.com/${profile.tenantId}/oauth2/v2.0/authorize`,
            acquireTokenByCode: async input => result(input.nonce), acquireTokenSilent: async () => result(), clear: async () => undefined }),
            generatePkce: async () => ({ verifier: "synthetic", challenge: "synthetic" }), openBrowser: async () => undefined,
            callback: async () => ({ redirectUri: "http://localhost:32100/speckit-canvas/oauth/callback", result: Promise.resolve("synthetic-code"), close() {} }) },
        request: async input => {
            requests++;
            const url = new URL(String(input));
            assert.ok(!url.pathname.includes("/blobs"));
            if (url.pathname.endsWith("/items")) { assert.equal(url.searchParams.get("path"), "/.specify"); return Response.json({ path: "/.specify", isFolder: true }); }
            if (url.pathname.endsWith("/refs")) return Response.json({ value: [{ name: "refs/heads/main", objectId: "a".repeat(40) }] });
            return Response.json({ id: repositoryId, name: "Synthetic", defaultBranch: "refs/heads/main", project: { name: profile.project } });
        } });
    try {
        await entry.connect().completion;
        const state = await entry.state();
        const selected = await entry.select(repositoryId, state.localContext.contextId);
        assert.equal(selected.matchesCurrentWorkspace, false);
        assert.equal(selected.confirmation, null);
        assert.equal(selected.reason, "activity_unknown");
        assert.equal(selected.repository.sourceVersion, "a".repeat(40));
        assert.ok(requests > 0);
        assert.deepEqual(await readdir(home), []);
        await assert.rejects(entry.clone(selected.selectionId, "forged", "request"), { code: "activity_unknown" });
        currentOrigin = `https://dev.azure.com/Synthetic/Project/_git/${repositoryId}`;
        const local = await entry.state();
        assert.equal((await entry.select(repositoryId, local.localContext.contextId)).matchesCurrentWorkspace, true);
        entry.disconnect();
        await assert.rejects(entry.operation("a".repeat(32)), { code: "resource_unavailable" });
        assert.deepEqual(await readdir(home), []);
    } finally { entry.dispose(); await rm(home, { recursive: true, force: true }); }
});

async function handoffFixture(run: (proof: {
    entry: Awaited<ReturnType<typeof repositoryModule.createEntryCoordinator>>; counts: { clones: number; transitions: number; opens: number; lookups: number };
    events: string[]; setOutcome(value: HandoffOutcome["status"]): void; setProvider(value: boolean): void; setActivity(value: "idle" | "busy"): void;
    prepare(): Promise<string>; afterClone(callback: () => void): void; record(operationId: string): ReturnType<ReturnType<typeof createPreparationStore>["read"]>;
}) => Promise<void>, { cloneOnly = false } = {}) {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-entry-handoff-")));
    let currentDirectory = home;
    let revision = "original";
    let activity: HostWorkspaceSnapshot["activity"] = "idle";
    let activityRevision = 0;
    let provider = true;
    let outcome: HandoffOutcome["status"] = "workspace_activated";
    let activation: WorkspaceActivation | undefined;
    let operationId = "";
    let afterClone: () => void = () => undefined;
    const counts = { clones: 0, transitions: 0, opens: 0, lookups: 0 };
    const events: string[] = [];
    const store = createPreparationStore({ homeDirectory: home });
    const snapshot = (): HostWorkspaceSnapshot => ({ sessionId: "owned-session", contextRevision: revision, workingDirectory: currentDirectory,
        activity, activityRevision: String(activityRevision), capabilityGeneration: "fixture-capability", capabilities: { localCanvas: true,
            atomicPreparation: true, atomicHandoff: true, targetAcknowledgment: true, handoffReconciliation: true } });
    const host: HostHandoffAdapter = cloneOnly ? repositoryModule.createHostHandoffAdapter({ sessionId: "owned-session", metadata: {
        snapshot: async () => ({ sessionId: "owned-session", workingDirectory: currentDirectory }),
        activity: async () => ({ hasActiveWork: activity === "busy", abortable: activity === "busy" }),
    }, canvas: { open: async () => { counts.opens++; return assert.fail("Clone-only entry cannot open a canvas"); } } }) : {
        inspectCurrent: async () => snapshot(),
        admitPreparation: async (input, start) => {
            assert.equal(input.expectedSource.contextRevision, revision);
            if (activity !== "idle") throw new RepositoryError("session_busy");
            return start();
        },
        handoffPrepared: async input => {
            const record = await store.read(input.target.operationId);
            assert.equal(record.handoff?.status, "requested"); events.push("request_persisted");
            if (activity !== "idle") throw new RepositoryError("session_busy");
            counts.transitions++; operationId = input.target.operationId;
            if (outcome !== "workspace_activated") return { status: outcome };
            currentDirectory = input.target.destination; revision = "activated";
            activation = { attemptId: input.attemptId, sessionId: "owned-session", contextRevision: revision, workingDirectory: currentDirectory,
                targetKind: "prepared_checkout", targetBranch: input.target.branch };
            events.push("workspace_activated"); return { status: outcome, activation };
        },
        getHandoffOutcome: async () => { counts.lookups++; return { status: outcome, ...(activation ? { activation } : {}) }; },
        openCurrentCanvas: async (expected, instanceId) => {
            counts.opens++;
            const record = await store.read(operationId);
            assert.equal(record.handoff?.status, "workspace_activated"); events.push("activation_persisted");
            if (!provider) throw new RepositoryError("canvas_unavailable");
            assert.equal(expected.contextRevision, revision);
            const ready: CanvasReadiness = { ...activation!, providerId: "project:sdd-canvas", instanceId };
            await store.updateAttempt(operationId, { ...record.handoff!, status: "canvas_ready", result: ready });
            events.push("target_verified");
            return { ...ready };
        }, dispose() {},
    };
    const authentication = (nonce?: string) => ({ accessToken: "synthetic-token", tenantId: profile.tenantId, scopes: ["vso.code"], expiresOn: new Date(Date.now() + 600_000), idTokenClaims: { nonce },
        account: { tenantId: profile.tenantId, localAccountId: repositoryId, homeAccountId: "synthetic-account", username: "synthetic@example.invalid" } }) as AuthenticationResult;
    const entry = await repositoryModule.createEntryCoordinator({ host, profileStatus: { state: "configured", profile },
        handoffOptions: { verifyPrepared: async () => { events.push("preparation_verified"); } },
        inspectWorkspace: async path => ({ workingDirectory: path, worktreeRoot: path, gitCommonDirectory: join(path, ".git"), origin: null, head: "a".repeat(40), branch: "refs/heads/original" }),
        cloneOptions: { homeDirectory: home, executable: join(home, "trusted-git"), runner: async ({ args, cwd }) => {
            if (args.includes("clone")) { counts.clones++; await mkdir(join(args.at(-1)!, ".git"), { recursive: true }); afterClone(); return ""; }
            if (args.includes("get-url")) return `https://dev.azure.com/Synthetic/Project/_git/${repositoryId}`;
            if (args.includes("symbolic-ref")) return `speckit/canvas-${cwd.split(/[\\/]/).at(-2)}`;
            if (args.includes("--git-common-dir")) return join(cwd, ".git");
            if (args.includes("HEAD")) return "a".repeat(40);
            return "";
        } },
        dependencies: { createClient: () => ({ getAuthCodeUrl: async () => `https://login.microsoftonline.com/${profile.tenantId}/oauth2/v2.0/authorize`,
            acquireTokenByCode: async input => authentication(input.nonce), acquireTokenSilent: async () => authentication(), clear: async () => undefined }),
            generatePkce: async () => ({ verifier: "synthetic", challenge: "synthetic" }), openBrowser: async () => undefined,
            callback: async () => ({ redirectUri: "http://localhost:32100/speckit-canvas/oauth/callback", result: Promise.resolve("synthetic-code"), close() {} }) },
        request: async input => {
            const url = new URL(String(input));
            if (url.pathname.endsWith("/items")) return Response.json({ path: "/.specify", isFolder: true });
            if (url.pathname.endsWith("/refs")) return Response.json({ value: [{ name: "refs/heads/main", objectId: "a".repeat(40) }] });
            return Response.json({ id: repositoryId, name: "Synthetic", defaultBranch: "refs/heads/main", project: { name: profile.project } });
        } });
    try {
        assert.equal(typeof Reflect.get(entry, "handoff"), "function");
        await entry.connect().completion;
        await run({ entry, counts, events, setOutcome(value) { outcome = value; }, setProvider(value) { provider = value; },
            setActivity(value) { activity = value; activityRevision++; },
            afterClone(callback) { afterClone = callback; }, record: store.read,
            async prepare() {
                const state = await entry.state();
                const selection = await entry.select(repositoryId, state.localContext.contextId);
                assert.ok(selection.confirmation);
                const accepted = await entry.clone(selection.selectionId, selection.confirmation, "explicit-preparation");
                if (cloneOnly) assert.equal((await entry.clone(selection.selectionId, selection.confirmation, "explicit-preparation")).operationId, accepted.operationId);
                await entry.settled();
                return accepted.operationId;
            } });
    } finally { entry.dispose(); await entry.settled(); await rm(home, { recursive: true, force: true }); }
}

test("Production clone-only adapter completes and retains one checkout without handoff or source changes", () => handoffFixture(async ({ entry, prepare, counts, record }) => {
    const before = await entry.state();
    assert.equal(before.host.canPrepareRemote, true);
    assert.equal(before.host.canHandoff, false);
    assert.equal(before.host.reason, null);
    const operationId = await prepare();
    const completed = await entry.state();
    assert.equal(completed.phase, "prepared");
    assert.equal(completed.operation?.state, "prepared");
    assert.equal(completed.operation?.error, undefined);
    assert.equal(completed.localContext.contextId, before.localContext.contextId);
    assert.equal(completed.host.canRetryHandoff, false);
    assert.equal((await record(operationId)).handoff, undefined);
    await assert.rejects(entry.handoff(operationId, completed.localContext.contextId, "unsupported-switch"), { code: "host_handoff_unsupported" });
    entry.disconnect();
    await entry.connect().completion;
    const retained = await entry.preparations();
    assert.equal(retained.items.length, 1);
    assert.equal(retained.items[0]!.operationId, operationId);
    assert.equal(retained.items[0]!.destination, completed.operation!.destination);
    assert.equal(retained.items[0]!.handoffState, null);
    assert.deepEqual(counts, { clones: 1, transitions: 0, opens: 0, lookups: 0 });
}, { cloneOnly: true }));

test("Clone-only completion stays complete when the host becomes busy and never resumes a handoff", () => handoffFixture(async ({ entry, prepare, counts, afterClone, setActivity }) => {
    afterClone(() => { setActivity("busy"); });
    await prepare();
    assert.equal((await entry.state()).phase, "prepared");
    setActivity("idle");
    await entry.state(); await entry.settled();
    assert.equal((await entry.state()).phase, "prepared");
    assert.deepEqual(counts, { clones: 1, transitions: 0, opens: 0, lookups: 0 });
}, { cloneOnly: true }));

test("Entry persists each handoff phase and reaches readiness only after target verification", () => handoffFixture(async ({ entry, prepare, counts, events }) => {
    await prepare();
    const state = await entry.state();
    assert.equal(state.phase, "ready", JSON.stringify({ code: state.operation?.error, counts, events }));
    assert.equal(counts.clones, 1); assert.equal(counts.transitions, 1); assert.equal(counts.opens, 1);
    assert.ok(events.indexOf("request_persisted") < events.indexOf("workspace_activated"));
    assert.ok(events.indexOf("activation_persisted") < events.indexOf("target_verified"));
}));

test("Entry keeps unknown handoffs blocked and reconciles without another clone or transition", () => handoffFixture(async ({ entry, prepare, counts, setOutcome, record }) => {
    setOutcome("unknown"); const operationId = await prepare();
    assert.equal((await entry.state()).phase, "handoff_unknown");
    const state = await entry.state();
    await assert.rejects(entry.handoff(operationId, state.localContext.contextId, "explicit-retry"), { code: "handoff_unknown" });
    assert.equal((await record(operationId)).handoff?.status, "unknown");
    assert.equal(counts.clones, 1); assert.equal(counts.transitions, 1); assert.equal(counts.lookups, 1); assert.equal(counts.opens, 0);
}));

test("Activation-only recovery opens the same target without switching or cloning again", () => handoffFixture(async ({ entry, prepare, counts, setProvider }) => {
    setProvider(false); const operationId = await prepare();
    assert.equal((await entry.state()).phase, "handoff_failed");
    setProvider(true);
    const state = await entry.state();
    await entry.handoff(operationId, state.localContext.contextId, "provider-retry");
    assert.equal((await entry.state()).phase, "ready");
    assert.equal(counts.clones, 1); assert.equal(counts.transitions, 1); assert.equal(counts.opens, 2); assert.equal(counts.lookups, 1);
}));

test("Busy then idle during preparation permanently consumes automatic handoff eligibility", () => handoffFixture(async ({ entry, prepare, counts, afterClone, setActivity }) => {
    afterClone(() => { setActivity("busy"); setActivity("idle"); });
    const operationId = await prepare();
    assert.equal((await entry.state()).phase, "waiting_user");
    assert.equal(counts.transitions, 0); assert.equal(counts.clones, 1);
    await entry.state(); await entry.state();
    assert.equal(counts.transitions, 0);
    const state = await entry.state();
    await entry.handoff(operationId, state.localContext.contextId, "fresh-idle-action");
    assert.equal((await entry.state()).phase, "ready");
    assert.equal(counts.transitions, 1); assert.equal(counts.clones, 1);
}));