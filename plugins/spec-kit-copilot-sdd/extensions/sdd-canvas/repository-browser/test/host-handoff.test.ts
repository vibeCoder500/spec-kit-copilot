import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { createHostHandoffAdapter } from "../src/host-handoff.ts";
import * as hostModule from "../src/host-handoff.ts";
import type { CanvasReadiness, HandoffRequest, HostHandoffAdapter, HostWorkspaceSnapshot, WorkspaceActivation } from "../src/types.ts";

test("Default host adapter admits an isolated clone without advertising automatic handoff", async () => {
    const opened: unknown[] = [];
    const host = createHostHandoffAdapter({ sessionId: "source", extensionId: "project:sdd-canvas",
        metadata: { snapshot: async () => ({ sessionId: "source", workingDirectory: "/synthetic" }),
            activity: async () => ({ abortable: false, hasActiveWork: false }) },
        canvas: { open: async (request) => { opened.push(request); return { ...request, extensionId: "project:sdd-canvas" }; } },
    });
    try {
        const snapshot = await host.inspectCurrent();
        assert.equal(snapshot.activity, "idle");
        assert.deepEqual(snapshot.capabilities, { localCanvas: true, checkedPreparation: true, atomicPreparation: false, atomicHandoff: false,
            targetAcknowledgment: false, handoffReconciliation: false });
        assert.equal(hostModule.supportsRepositoryCloning(snapshot), true);
        assert.equal(hostModule.supportsRemotePreparation(snapshot), false);
        const result = await host.openCurrentCanvas(snapshot, "direct-instance");
        assert.equal(result.sessionId, "source");
        assert.equal(result.workingDirectory, "/synthetic");
        assert.equal(result.instanceId, "direct-instance");
        assert.deepEqual(opened, [{ extensionId: "project:sdd-canvas", canvasId: "sdd-canvas-direct", instanceId: "direct-instance", input: {} }]);
        let starts = 0;
        const admission = { operationId: "a".repeat(32), expectedSource: snapshot, capabilityGeneration: snapshot.capabilityGeneration,
            activityRevision: snapshot.activityRevision };
        assert.equal(await host.admitPreparation(admission, async () => { starts++; return "prepared"; }), "prepared");
        await assert.rejects(host.admitPreparation(admission, async () => { starts++; }), { code: "clone_conflict" });
        await assert.rejects(host.handoffPrepared({ attemptId: "attempt", expectedSource: snapshot, canvasId: "sdd-canvas-direct", instanceId: "target",
            target: { operationId: "operation", repositoryId: "repository", originIdentity: "https://unused.invalid", defaultRef: "refs/heads/main",
                sourceCommit: "a".repeat(40), destination: "/synthetic/target", gitCommonDirectory: "/synthetic/target/.git",
                branch: "refs/heads/prepared", initialWorktreeFingerprint: "b".repeat(64) } }), { code: "host_handoff_unsupported" });
        await assert.rejects(host.getHandoffOutcome("attempt"), { code: "host_handoff_unsupported" });
        assert.equal(starts, 1);
        assert.equal(opened.length, 1);
    } finally { host.dispose(); }
});

test("Checked clone admission rejects busy, unknown, stale, and disposed contexts before starting", async () => {
    let flags: unknown = { hasActiveWork: false, abortable: false };
    let workingDirectory = "/synthetic";
    let starts = 0;
    const host = createHostHandoffAdapter({ sessionId: "source", metadata: {
        snapshot: async () => ({ sessionId: "source", workingDirectory }),
        activity: async () => flags,
    } });
    try {
        const snapshot = await host.inspectCurrent();
        const admission = { operationId: "a".repeat(32), expectedSource: snapshot,
            capabilityGeneration: snapshot.capabilityGeneration, activityRevision: snapshot.activityRevision };
        const start = async () => { starts++; };
        flags = { hasActiveWork: true, abortable: false };
        await assert.rejects(host.admitPreparation(admission, start), { code: "session_busy" });
        flags = {};
        await assert.rejects(host.admitPreparation(admission, start), { code: "activity_unknown" });
        flags = { hasActiveWork: false, abortable: false };
        await assert.rejects(host.admitPreparation(admission, start), { code: "context_changed" });
        const current = await host.inspectCurrent();
        const fresh = { ...admission, expectedSource: current, activityRevision: current.activityRevision };
        await assert.rejects(host.admitPreparation({ ...fresh, capabilityGeneration: "stale" }, start), { code: "context_changed" });
        workingDirectory = "/another";
        await assert.rejects(host.admitPreparation(fresh, start), { code: "context_changed" });
        host.dispose();
        await assert.rejects(host.admitPreparation(fresh, start), { code: "invalid_context" });
        assert.equal(starts, 0);
    } finally { host.dispose(); }
});

test("Activity events invalidate clone consent even when the next snapshot is idle", async () => {
    let changed: () => void = () => undefined;
    let notifyDuringRead = false;
    let starts = 0;
    const host = createHostHandoffAdapter({ sessionId: "source", metadata: {
        snapshot: async () => {
            if (notifyDuringRead) changed();
            return { sessionId: "source", workingDirectory: "/synthetic" };
        },
        activity: async () => ({ hasActiveWork: false, abortable: false }),
    }, subscribeActivityChanged: listener => { changed = listener; return () => undefined; } });
    try {
        const snapshot = await host.inspectCurrent();
        changed();
        await assert.rejects(host.admitPreparation({ operationId: "a".repeat(32), expectedSource: snapshot,
            capabilityGeneration: snapshot.capabilityGeneration, activityRevision: snapshot.activityRevision }, async () => { starts++; }), { code: "context_changed" });
        const current = await host.inspectCurrent();
        assert.equal(current.activity, "idle");
        notifyDuringRead = true;
        assert.equal((await host.inspectCurrent()).activity, "unknown");
        await assert.rejects(host.admitPreparation({ operationId: "b".repeat(32), expectedSource: current,
            capabilityGeneration: current.capabilityGeneration, activityRevision: current.activityRevision }, async () => { starts++; }), { code: "activity_unknown" });
        assert.equal(starts, 0);
    } finally { host.dispose(); }
});

test("Missing activity or canvas support stays unknown or unavailable without inventing capabilities", async () => {
    const host = createHostHandoffAdapter({ sessionId: "source", metadata: {
        snapshot: async () => ({ sessionId: "source", workingDirectory: "/synthetic", capabilities: { atomicHandoff: true } }),
    } });
    try {
        const snapshot = await host.inspectCurrent();
        assert.equal(snapshot.activity, "unknown");
        assert.equal(snapshot.capabilities.localCanvas, false);
        assert.equal(snapshot.capabilities.atomicHandoff, false);
        assert.equal(hostModule.supportsRepositoryCloning(snapshot), false);
        await assert.rejects(host.openCurrentCanvas(snapshot, "instance"), { code: "canvas_unavailable" });
    } finally { host.dispose(); }
});

test("Host reads are bounded and sanitize errors while local opening may proceed during busy work", async () => {
    const timeout = createHostHandoffAdapter({ sessionId: "source", timeoutMs: 20,
        metadata: { snapshot: () => new Promise(() => undefined) } });
    try { await assert.rejects(timeout.inspectCurrent(), { code: "activity_unknown" }); }
    finally { timeout.dispose(); }
    const host = createHostHandoffAdapter({ sessionId: "source", timeoutMs: 20,
        metadata: { snapshot: async () => ({ sessionId: "source", workingDirectory: "/synthetic" }),
            activity: async () => ({ abortable: true, hasActiveWork: true }) },
        canvas: { open: async (request) => ({ ...request, extensionId: "project:sdd-canvas" }) },
    });
    try {
        const snapshot = await host.inspectCurrent();
        assert.equal(snapshot.activity, "busy");
        assert.equal((await host.openCurrentCanvas(snapshot, "local")).workingDirectory, "/synthetic");
    } finally { host.dispose(); }
    const failed = createHostHandoffAdapter({ sessionId: "source", metadata: { snapshot: async () => { throw new Error("private-provider-value"); } } });
    try { await assert.rejects(failed.inspectCurrent(), (error: unknown) => {
        assert.doesNotMatch(String(error), /private-provider-value/);
        return (error as { code?: string }).code === "activity_unknown";
    }); } finally { failed.dispose(); }
});

test("Context changes invalidate snapshots and local open acknowledgments", async () => {
    let workingDirectory = "/synthetic/first";
    let contextChanged: () => void = () => undefined;
    let opens = 0;
    const host = createHostHandoffAdapter({ sessionId: "source",
        metadata: { snapshot: async () => ({ sessionId: "source", workingDirectory }) },
        subscribeContextChanged: (listener) => { contextChanged = listener; return () => undefined; },
        canvas: { open: async (request) => { opens++; workingDirectory = "/synthetic/second"; contextChanged(); return { ...request, extensionId: "project:sdd-canvas" }; } },
    });
    try {
        const snapshot = await host.inspectCurrent();
        contextChanged();
        await assert.rejects(host.openCurrentCanvas(snapshot, "stale"), { code: "context_changed" });
        assert.equal(opens, 0);
        const current = await host.inspectCurrent();
        await assert.rejects(host.openCurrentCanvas(current, "changed-during-open"), { code: "context_changed" });
        assert.equal(opens, 1);
    } finally { host.dispose(); }
});

test("Host response identities cannot select a different provider, instance, or joined session", async () => {
    const host = createHostHandoffAdapter({ sessionId: "source", extensionId: "expected",
        metadata: { snapshot: async () => ({ sessionId: "source", workingDirectory: "/synthetic" }) },
        canvas: { open: async (request) => ({ ...request, extensionId: "another-provider" }) },
    });
    try { await assert.rejects(host.openCurrentCanvas(await host.inspectCurrent(), "instance"), { code: "canvas_unavailable" }); }
    finally { host.dispose(); }
    const wrongSession = createHostHandoffAdapter({ sessionId: "source",
        metadata: { snapshot: async () => ({ sessionId: "another-session", workingDirectory: "/synthetic" }) } });
    try { await assert.rejects(wrongSession.inspectCurrent(), { code: "context_changed" }); }
    finally { wrongSession.dispose(); }
});

test("Remote preparation requires every negotiated handoff capability", () => {
    const snapshot: HostWorkspaceSnapshot = { sessionId: "source", contextRevision: "context", workingDirectory: "/synthetic", activity: "idle",
        activityRevision: "idle", capabilityGeneration: "tested", capabilities: { localCanvas: true, atomicPreparation: true,
            atomicHandoff: true, targetAcknowledgment: true, handoffReconciliation: true } };
    assert.equal(hostModule.supportsRemotePreparation(snapshot), true);
    for (const name of Object.keys(snapshot.capabilities) as Array<keyof typeof snapshot.capabilities>) {
        assert.equal(hostModule.supportsRemotePreparation({ ...snapshot, capabilities: { ...snapshot.capabilities, [name]: false } }), false);
    }
});

test("Activation is durable before guarded opening and only independent target readiness completes entry", async () => {
    const execute = Reflect.get(hostModule, "executeHostHandoff");
    assert.equal(typeof execute, "function");
    const events: string[] = [];
    const target = { operationId: "a".repeat(32), repositoryId: "33333333-3333-4333-8333-333333333333", originIdentity: "https://dev.azure.com/Synthetic/Project/_git/33333333-3333-4333-8333-333333333333",
        sourceCommit: "b".repeat(40), defaultRef: "refs/heads/main", destination: "/synthetic/prepared", gitCommonDirectory: "/synthetic/prepared/.git",
        branch: "refs/heads/prepared", initialWorktreeFingerprint: "c".repeat(64) };
    const request: HandoffRequest = { attemptId: "d".repeat(32), expectedSource: { sessionId: "source", contextRevision: "original" },
        target, canvasId: "sdd-canvas-direct", instanceId: "target-instance" };
    const activation: WorkspaceActivation = { attemptId: request.attemptId, sessionId: "target", contextRevision: "activated",
        workingDirectory: target.destination, targetKind: "prepared_checkout", targetBranch: target.branch };
    let ready: CanvasReadiness | undefined;
    let verify = true;
    const host: HostHandoffAdapter = {
        inspectCurrent: async () => ({ ...activation, activity: "idle", activityRevision: "idle", capabilityGeneration: "test",
            capabilities: { localCanvas: true, atomicPreparation: true, atomicHandoff: true, targetAcknowledgment: true, handoffReconciliation: true } }),
        admitPreparation: async () => assert.fail("Handoff cannot clone"),
        handoffPrepared: async () => { events.push("workspace_activated"); return { status: "workspace_activated", activation }; },
        getHandoffOutcome: async () => ({ status: "workspace_activated", activation }),
        openCurrentCanvas: async (expected, instanceId) => {
            assert.equal(events.at(-1), "activation_persisted"); assert.equal(expected.contextRevision, activation.contextRevision);
            events.push("guarded_canvas_open");
            if (verify) { events.push("target_verified"); ready = { ...activation, providerId: "project:sdd-canvas", instanceId }; }
            return { ...activation, providerId: "project:sdd-canvas", instanceId };
        }, dispose() {},
    };
    const options = { host, request,
        persistActivation: async (value: WorkspaceActivation) => { assert.deepEqual(value, activation); events.push("activation_persisted"); },
        readReadiness: async () => ready };
    assert.equal((await execute(options)).status, "canvas_ready");
    assert.deepEqual(events, ["workspace_activated", "activation_persisted", "guarded_canvas_open", "target_verified"]);
    events.length = 0; ready = undefined; verify = false;
    await assert.rejects(execute({ ...options, outcome: { status: "workspace_activated", activation } }), { code: "canvas_unavailable" });
    assert.deepEqual(events, ["activation_persisted", "guarded_canvas_open"]);
    events.length = 0;
    const unknown = await execute({ ...options, outcome: { status: "unknown" } });
    assert.equal(unknown.status, "unknown"); assert.deepEqual(events, []);
    let finishActivation: (outcome: { status: "workspace_activated"; activation: WorkspaceActivation }) => void = () => undefined;
    host.handoffPrepared = () => new Promise(resolve => { finishActivation = resolve; });
    const timed = execute({ ...options, timeoutMs: 10 });
    await assert.rejects(timed, { code: "handoff_unknown" });
    finishActivation({ status: "workspace_activated", activation });
    await new Promise<void>(resolve => setImmediate(resolve));
    assert.deepEqual(events, ["activation_persisted"], "Late activation is retained without automatically opening or switching again");
    const originalTimer = globalThis.setTimeout;
    const budgets: number[] = [];
    const timer = mock.method(globalThis, "setTimeout", (callback: () => void, milliseconds?: number) => {
        budgets.push(milliseconds ?? 0);
        return originalTimer(callback, milliseconds === 5000 || milliseconds === 30_000 ? 1 : milliseconds);
    });
    const unavailable = createHostHandoffAdapter({ sessionId: "source", metadata: { snapshot: () => new Promise(() => undefined) } });
    try {
        await assert.rejects(unavailable.inspectCurrent(), { code: "activity_unknown" });
        await assert.rejects(execute(options), { code: "handoff_unknown" });
        assert.ok(budgets.includes(5000)); assert.ok(budgets.includes(30_000));
    } finally { unavailable.dispose(); timer.mock.restore(); }
});