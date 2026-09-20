import { cp, mkdir, mkdtemp, readdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertOwnedWorkspace, createOwnedWorkspace } from "./workspace.mjs";

export async function createRepositoryFixture({ sourceWorkspace } = {}) {
    if (sourceWorkspace) await assertOwnedWorkspace(sourceWorkspace);
    const cloneHome = await realpath(await mkdtemp(join(tmpdir(), "sdd-repository-clone-fixture-")));
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const repositoryId = "33333333-3333-4333-8333-333333333333";
    const otherId = "66666666-6666-4666-8666-666666666666";
    const commit = "a".repeat(40);
    const specBlob = "b".repeat(40);
    const researchBlob = "c".repeat(40);
    const manifestBlob = "d".repeat(40);
    let denied = false;
    let requests = 0;
    let artifactReads = 0;
    let browserOpens = 0;
    let holdClone = false;
    const gitCalls = [];
    const repository = { id: repositoryId, name: "Synthetic repository 1", defaultBranch: "refs/heads/main", project: { name: "SyntheticProject" }, isDisabled: false };
    const profile = { schemaVersion: 1, enabled: true, tenantId, clientId: "22222222-2222-4222-8222-222222222222", organization: "SyntheticOrg", project: "SyntheticProject" };
    const result = (nonce) => ({ accessToken: "synthetic-token", tenantId, scopes: ["vso.code", "vso.project", "vso.work"], expiresOn: new Date(Date.now() + 600_000), idTokenClaims: { nonce },
        account: { tenantId, localAccountId: "77777777-7777-4777-8777-777777777777", homeAccountId: "synthetic-account", username: "synthetic@example.invalid" } });
    const options = {
        bindingOptions: { homeDirectory: cloneHome },
        cloneOptions: { homeDirectory: cloneHome, executable: join(cloneHome, "synthetic-git.exe"), runner: async ({ args, cwd, signal }) => {
            gitCalls.push(args);
            if (args.includes("clone")) {
                await mkdir(join(args.at(-1), ".git"), { recursive: true });
                if (sourceWorkspace) for (const name of [".specify", ".github", "specs"]) await cp(join(sourceWorkspace, name), join(args.at(-1), name), { recursive: true, errorOnExist: true, force: false });
                if (holdClone) await new Promise((_resolve, reject) => {
                    const cancel = () => reject(Object.assign(new Error("Synthetic preparation cancelled."), { code: "clone_cancelled" }));
                    if (signal.aborted) cancel(); else signal.addEventListener("abort", cancel, { once: true });
                });
                return "";
            }
            if (args.includes("get-url")) return `https://dev.azure.com/SyntheticOrg/SyntheticProject/_git/${repositoryId}`;
            if (args.includes("symbolic-ref")) return `${args.includes("--short") ? "" : "refs/heads/"}speckit/canvas-${cwd.split(/[\\/]/).at(-2)}`;
            if (args.includes("--show-toplevel")) return cwd;
            if (args.includes("HEAD")) return commit;
            if (args.includes("--git-common-dir")) return join(cwd, ".git");
            return "";
        } },
        profileStatus: { state: "configured", profile },
        dependencies: {
            createClient: () => ({ getAuthCodeUrl: async () => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
                acquireTokenByCode: async (request) => result(request.nonce), acquireTokenSilent: async () => result(), clear: async () => undefined }),
            generatePkce: async () => ({ challenge: "synthetic-challenge", verifier: "synthetic-verifier" }), openBrowser: async () => { browserOpens++; },
            callback: async () => ({ redirectUri: "http://localhost:32001/speckit-canvas/oauth/callback", result: Promise.resolve("synthetic-code"), close() {} }),
        },
        request: async (target, parameters) => {
            const url = new URL(target); requests++;
            if (new Headers(parameters?.headers).get("Authorization") !== "Bearer synthetic-token") throw new Error("Synthetic delegated access required.");
            const path = url.pathname;
            if (path.endsWith(`/blobs/${specBlob}`) || path.endsWith(`/blobs/${researchBlob}`)) artifactReads++;
            let data;
            if (path.endsWith("/teams")) data = { value: [{ id: "44444444-4444-4444-8444-444444444444", projectId: "55555555-5555-4555-8555-555555555555" }] };
            else if (path.endsWith("/teamfieldvalues")) data = { field: { referenceName: "System.AreaPath" }, values: [{ value: "SyntheticProject\\Owned", includeChildren: true }] };
            else if (path.endsWith("/codesearchresults")) data = { infoCode: 0, count: 1, results: [{ path: "/es-metadata.yml", repository: { id: repositoryId }, project: { name: "SyntheticProject" } }] };
            else if (path.endsWith("/repositories")) data = { value: [repository, { ...repository, id: otherId, name: "Synthetic repository 2" }] };
            else if (denied) return new Response("Not found", { status: 404 });
            else if (path.endsWith("/refs")) data = { value: [{ name: "refs/heads/main", objectId: commit }] };
            else if (path.endsWith(`/blobs/${manifestBlob}`)) return new Response("schemaVersion: 1.0.0\nproviders:\n- provider: InventoryAsCode\n  metadata:\n    routing:\n      defaultAreaPath:\n        org: SyntheticOrg\n        path: 'SyntheticProject\\Owned'\n");
            else if (path.endsWith(`/blobs/${specBlob}`)) return new Response(path.includes(`/repositories/${otherId}/`)
                ? "# Second repository specification\n\n## Independent requirements\n\nThis artifact belongs to the second remote repository.\n"
                : "# Remote specification\n\n## Decisions\n\n[Research](research.md#findings)\n\n![No remote request](https://unexpected.invalid/image.png)\n\n- [ ] A synthetic task\n\n[NEEDS CLARIFICATION: Not actionable remotely]\n");
            else if (path.endsWith(`/blobs/${researchBlob}`)) return new Response("# Remote research\n\n## Findings\n\nA fixed-commit reference.\n");
            else if (path.endsWith("/items")) {
                const itemPath = url.searchParams.get("path");
                if (itemPath === "/.specify") data = { path: itemPath, isFolder: true, objectId: commit };
                else if (itemPath === "/es-metadata.yml") data = { path: itemPath, isFolder: false, objectId: manifestBlob, contentMetadata: { isBinary: false } };
                else if (itemPath) data = { path: itemPath, isFolder: false, objectId: itemPath.endsWith("research.md") ? researchBlob : specBlob, contentMetadata: { isBinary: false, encoding: 65001 } };
                else {
                    const root = url.searchParams.get("scopePath");
                    data = { value: [{ path: root, isFolder: true, objectId: commit },
                        { path: `${root}/001-feature`, isFolder: true, objectId: commit },
                        { path: `${root}/001-feature/spec.md`, isFolder: false, objectId: specBlob },
                        { path: `${root}/001-feature/research.md`, isFolder: false, objectId: researchBlob }] };
                }
            } else if (path.endsWith(`/${otherId}`)) data = { ...repository, id: otherId, name: "Synthetic repository 2" };
            else if (path.endsWith(`/${repositoryId}`)) data = repository;
            else throw new Error("Unexpected synthetic ADO route.");
            return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
        },
    };
    return { options, revoke() { denied = true; }, requests: () => requests, browserOpens: () => browserOpens,
        holdClone() { holdClone = true; }, cloneCount: () => gitCalls.filter(args => args.includes("clone")).length,
        gitCalls: () => gitCalls.length, cloneFiles: () => readdir(cloneHome), artifactReads: () => artifactReads,
        async cleanup() { await rm(cloneHome, { recursive: true, force: true }); } };
}

export async function createEntryHostFixture({ workspace, supported = false, cloneOnly = false, onOpen = async () => undefined } = {}) {
    if (supported && cloneOnly) throw new Error("Choose either the production clone-only adapter or the synthetic handoff adapter.");
    const source = await assertOwnedWorkspace(workspace);
    const target = await createOwnedWorkspace();
    let activeDirectory = source.workspace;
    let contextRevision = 0;
    let activityRevision = 0;
    let activity = "idle";
    let notifyActivity = () => undefined;
    let notifyContext = () => undefined;
    let disposed = false;
    let nextOutcome = "canvas_ready";
    let beforeAdmission = () => undefined;
    let targetBinding = async () => { throw failure("canvas_unavailable"); };
    let localBinding = onOpen;
    let activatedRequest;
    const admissions = new Map();
    const attempts = new Map();
    const events = [];
    const counts = { inspections: 0, opens: 0, starts: 0, handoffs: 0, reconciliations: 0 };
    const failure = (code) => Object.assign(new Error("Synthetic entry host rejected the request."), { code });
    const snapshot = () => ({ sessionId: activeDirectory === source.workspace ? `fixture-source-${source.owner.id}` : `fixture-target-${target.id}`,
        contextRevision: `fixture-context-${contextRevision}`, workingDirectory: activeDirectory, activity,
        activityRevision: `fixture-activity-${activityRevision}`, capabilityGeneration: "fixture-capabilities-1",
        capabilities: { localCanvas: true, atomicPreparation: supported, atomicHandoff: supported,
            targetAcknowledgment: supported, handoffReconciliation: supported } });
    const check = (expected, remote = false) => {
        if (disposed) throw failure("invalid_context");
        const current = snapshot();
        if (remote && !supported) throw failure("host_handoff_unsupported");
        if (expected.sessionId !== current.sessionId || expected.contextRevision !== current.contextRevision) throw failure("context_changed");
        if (remote && activity !== "idle") throw failure(activity === "busy" ? "session_busy" : "activity_unknown");
        return current;
    };
    let adapter = {
        async inspectCurrent() { if (disposed) throw failure("invalid_context"); counts.inspections++; return snapshot(); },
        async openCurrentCanvas(expected, instanceId) {
            const current = check(expected);
            counts.opens++;
            if (activatedRequest) {
                const outcome = attempts.get(activatedRequest.attemptId);
                if (instanceId !== activatedRequest.instanceId) throw failure("entry_required");
                events.push("guarded_canvas_open");
                if (nextOutcome === "workspace_activated") throw failure("canvas_unavailable");
                await targetBinding({ request: activatedRequest, activation: outcome.activation, instanceId });
                outcome.status = "canvas_ready";
                outcome.result = { ...outcome.activation, providerId: "project:sdd-canvas", instanceId };
                events.push("target_verified", "canvas_ready");
            }
            await localBinding(current.workingDirectory, instanceId);
            check(expected);
            return { sessionId: current.sessionId, contextRevision: current.contextRevision, workingDirectory: current.workingDirectory,
                providerId: "project:sdd-canvas", instanceId };
        },
        async admitPreparation(input, start) {
            beforeAdmission();
            check(input.expectedSource, true);
            if (input.capabilityGeneration !== snapshot().capabilityGeneration) throw failure("context_changed");
            if (admissions.has(input.operationId)) return admissions.get(input.operationId);
            counts.starts++;
            const result = Promise.resolve().then(start);
            admissions.set(input.operationId, result);
            return result;
        },
        async handoffPrepared(input) {
            if (attempts.has(input.attemptId)) return structuredClone(attempts.get(input.attemptId));
            check(input.expectedSource, true);
            counts.handoffs++;
            if (["rejected", "unknown", "in_progress"].includes(nextOutcome)) {
                const outcome = { status: nextOutcome }; attempts.set(input.attemptId, outcome); return outcome;
            }
            activatedRequest = structuredClone(input);
            activeDirectory = input.target.destination; contextRevision++;
            const current = snapshot();
            const activation = { attemptId: input.attemptId, sessionId: current.sessionId, contextRevision: current.contextRevision,
                workingDirectory: activeDirectory, targetKind: "prepared_checkout", targetBranch: input.target.branch };
            events.push("workspace_activated");
            const outcome = { status: "workspace_activated", activation };
            attempts.set(input.attemptId, outcome);
            return structuredClone(outcome);
        },
        async getHandoffOutcome(attemptId) {
            if (!supported) throw failure("host_handoff_unsupported");
            counts.reconciliations++;
            return structuredClone(attempts.get(attemptId) ?? { status: "not_started" });
        },
        dispose() { disposed = true; },
    };
    if (cloneOnly) {
        const { createHostHandoffAdapter } = await import("../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/vendor/repository-browser/server.mjs");
        const production = createHostHandoffAdapter({ sessionId: `fixture-source-${source.owner.id}`, extensionId: "project:sdd-canvas",
            metadata: { snapshot: async () => ({ sessionId: `fixture-source-${source.owner.id}`, workingDirectory: activeDirectory }),
                activity: async () => activity === "unknown" ? {} : { hasActiveWork: activity === "busy", abortable: activity === "busy" } },
            canvas: { open: async input => { counts.opens++; await localBinding(activeDirectory, input.instanceId); return { ...input }; } },
            subscribeContextChanged: listener => { notifyContext = listener; return () => { notifyContext = () => undefined; }; },
            subscribeActivityChanged: listener => { notifyActivity = listener; return () => { notifyActivity = () => undefined; }; } });
        adapter = { ...production,
            async inspectCurrent() { counts.inspections++; return production.inspectCurrent(); },
            async admitPreparation(input, start) {
                beforeAdmission();
                return production.admitPreparation(input, async () => { counts.starts++; return start(); });
            },
            async handoffPrepared(input) { counts.handoffs++; return production.handoffPrepared(input); },
            async getHandoffOutcome(attemptId) { counts.reconciliations++; return production.getHandoffOutcome(attemptId); },
            dispose() { disposed = true; production.dispose(); },
        };
    }
    return {
        adapter, sourceDirectory: source.workspace, targetDirectory: target.workspace,
        counts: () => ({ ...counts }), events: () => [...events],
        setActivity(value) { if (!["idle", "busy", "unknown"].includes(value)) throw new Error("Invalid synthetic activity."); activity = value; activityRevision++; notifyActivity(); },
        changeContext() { contextRevision++; notifyContext(); },
        setOutcome(value) { if (!["canvas_ready", "workspace_activated", "rejected", "unknown", "in_progress"].includes(value)) throw new Error("Invalid synthetic handoff outcome."); nextOutcome = value; },
        beforeAdmission(callback) { beforeAdmission = callback; },
        bindTarget(callback) { targetBinding = callback; },
        bindLocal(callback) { localBinding = callback; },
        async cleanup() { adapter.dispose(); return target.cleanup(); },
    };
}