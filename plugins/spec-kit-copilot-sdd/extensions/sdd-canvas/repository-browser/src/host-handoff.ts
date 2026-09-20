import { randomBytes } from "node:crypto";
import { isAbsolute } from "node:path";
import { knownRepositoryError, RepositoryError } from "./errors.ts";
import type { RepositoryErrorCode } from "./errors.ts";
import type { CanvasReadiness, HandoffOutcome, HandoffRequest, HostActivity, HostCapabilities, HostContextIdentity, HostHandoffAdapter, HostWorkspaceSnapshot, WorkspaceActivation } from "./types.ts";

export interface HostHandoffOptions {
    sessionId: string;
    extensionId?: string;
    metadata: { snapshot(): Promise<unknown>; activity?(): Promise<unknown> };
    canvas?: { open(input: { extensionId?: string; canvasId: string; instanceId: string; input: Record<string, never> }): Promise<unknown> };
    subscribeContextChanged?: (listener: () => void) => () => void;
    subscribeActivityChanged?: (listener: () => void) => () => void;
    timeoutMs?: number;
}

function record(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function identifier(value: unknown, maximum = 256): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= maximum && !/[\p{Cc}\p{Cf}]/u.test(value);
}

export function supportsRepositoryCloning(snapshot: HostWorkspaceSnapshot): boolean {
    return snapshot.capabilities.checkedPreparation === true || snapshot.capabilities.atomicPreparation;
}

export function supportsRemotePreparation(snapshot: HostWorkspaceSnapshot): boolean {
    const capabilities = snapshot.capabilities;
    return capabilities.localCanvas && capabilities.atomicPreparation && capabilities.atomicHandoff &&
        capabilities.targetAcknowledgment && capabilities.handoffReconciliation;
}

export function createHostHandoffAdapter(options: HostHandoffOptions): HostHandoffAdapter {
    if (!identifier(options.sessionId) || (options.extensionId !== undefined && !identifier(options.extensionId))) throw new RepositoryError("invalid_context");
    const timeoutMs = options.timeoutMs ?? 5000;
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 5000) throw new RepositoryError("invalid_request");
    const shutdown = new AbortController();
    const capabilities: HostCapabilities = Object.freeze({ localCanvas: typeof options.canvas?.open === "function",
        checkedPreparation: typeof options.metadata.activity === "function",
        atomicPreparation: false, atomicHandoff: false, targetAcknowledgment: false, handoffReconciliation: false });
    const admittedPreparations = new Set<string>();
    const generation = randomBytes(24).toString("base64url");
    let epoch = 0;
    let activityEpoch = 0;
    let contextRevision = randomBytes(24).toString("base64url");
    let activityRevision = randomBytes(24).toString("base64url");
    let lastDirectory: string | undefined;
    let lastActivity: HostActivity | undefined;
    let readSequence = 0;
    let appliedSequence = 0;
    const unsubscribe = options.subscribeContextChanged?.(() => {
        epoch++;
        contextRevision = randomBytes(24).toString("base64url");
    });
    const unsubscribeActivity = options.subscribeActivityChanged?.(() => {
        activityEpoch++;
        activityRevision = randomBytes(24).toString("base64url");
    });

    async function bounded<Result>(operation: () => Promise<Result>, code: RepositoryErrorCode, external?: AbortSignal): Promise<Result> {
        if (shutdown.signal.aborted) throw new RepositoryError("invalid_context");
        const signal = external ? AbortSignal.any([shutdown.signal, external]) : shutdown.signal;
        if (signal.aborted) throw new RepositoryError("invalid_context");
        let timer: ReturnType<typeof setTimeout> | undefined;
        let onAbort: () => void = () => undefined;
        try {
            return await Promise.race([
                Promise.resolve().then(operation).catch(() => { throw new RepositoryError(code); }),
                new Promise<never>((_resolve, reject) => {
                    timer = setTimeout(() => reject(new RepositoryError(code)), timeoutMs);
                    onAbort = () => reject(new RepositoryError("invalid_context"));
                    signal.addEventListener("abort", onAbort, { once: true });
                }),
            ]);
        } finally {
            if (timer) clearTimeout(timer);
            signal.removeEventListener("abort", onAbort);
        }
    }

    async function inspectCurrent(signal?: AbortSignal): Promise<HostWorkspaceSnapshot> {
        const expectedEpoch = epoch;
        const expectedActivityEpoch = activityEpoch;
        const sequence = ++readSequence;
        const [rawSnapshot, rawActivity] = await Promise.all([
            bounded(() => options.metadata.snapshot(), "activity_unknown", signal),
            options.metadata.activity ? bounded(() => options.metadata.activity!(), "activity_unknown", signal).catch(() => undefined) : undefined,
        ]);
        if (shutdown.signal.aborted || signal?.aborted) throw new RepositoryError("invalid_context");
        if (expectedEpoch !== epoch || sequence < appliedSequence) throw new RepositoryError("context_changed");
        const snapshot = record(rawSnapshot);
        if (snapshot.sessionId !== options.sessionId || !identifier(snapshot.workingDirectory, 32768) || !isAbsolute(snapshot.workingDirectory)) {
            throw new RepositoryError("context_changed");
        }
        if (lastDirectory !== undefined && lastDirectory !== snapshot.workingDirectory) {
            epoch++;
            contextRevision = randomBytes(24).toString("base64url");
        }
        lastDirectory = snapshot.workingDirectory;
        appliedSequence = sequence;
        const activityFlags = record(rawActivity);
        const activity: HostActivity = expectedActivityEpoch !== activityEpoch || typeof activityFlags.hasActiveWork !== "boolean" || typeof activityFlags.abortable !== "boolean" ? "unknown" :
            activityFlags.hasActiveWork || activityFlags.abortable ? "busy" : "idle";
        if (activity !== lastActivity) activityRevision = randomBytes(24).toString("base64url");
        lastActivity = activity;
        return { sessionId: options.sessionId, contextRevision, workingDirectory: snapshot.workingDirectory,
            activity, activityRevision, capabilityGeneration: generation, capabilities: { ...capabilities } };
    }

    function sameContext(expected: HostContextIdentity, snapshot: HostWorkspaceSnapshot) {
        if (expected.sessionId !== snapshot.sessionId || expected.contextRevision !== snapshot.contextRevision) throw new RepositoryError("context_changed");
    }

    return {
        inspectCurrent,
        async openCurrentCanvas(expected, instanceId, signal) {
            if (!capabilities.localCanvas) throw new RepositoryError("canvas_unavailable");
            if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(instanceId)) throw new RepositoryError("invalid_request");
            const current = await inspectCurrent(signal);
            sameContext(expected, current);
            const result = record(await bounded(() => options.canvas!.open({ ...(options.extensionId ? { extensionId: options.extensionId } : {}),
                canvasId: "sdd-canvas-direct", instanceId, input: {} }), "canvas_unavailable", signal));
            const verified = await inspectCurrent(signal);
            sameContext(current, verified);
            if (result.canvasId !== "sdd-canvas-direct" || result.instanceId !== instanceId || !identifier(result.extensionId) ||
                (options.extensionId !== undefined && result.extensionId !== options.extensionId)) throw new RepositoryError("canvas_unavailable");
            return { sessionId: verified.sessionId, contextRevision: verified.contextRevision, workingDirectory: verified.workingDirectory,
                providerId: result.extensionId, instanceId };
        },
        async admitPreparation(input, start) {
            if (!/^[a-f0-9]{32}$/.test(input.operationId)) throw new RepositoryError("invalid_request");
            if (!capabilities.checkedPreparation) throw new RepositoryError("activity_unknown");
            if (input.capabilityGeneration !== generation) throw new RepositoryError("context_changed");
            const current = await inspectCurrent();
            sameContext(input.expectedSource, current);
            if (current.activity !== "idle") throw new RepositoryError(current.activity === "busy" ? "session_busy" : "activity_unknown");
            if (input.activityRevision !== undefined && input.activityRevision !== current.activityRevision) throw new RepositoryError("context_changed");
            if (admittedPreparations.has(input.operationId) || admittedPreparations.size >= 32) throw new RepositoryError("clone_conflict");
            admittedPreparations.add(input.operationId);
            return start();
        },
        async handoffPrepared() { throw new RepositoryError("host_handoff_unsupported"); },
        async getHandoffOutcome() { throw new RepositoryError("host_handoff_unsupported"); },
        dispose() { shutdown.abort(); unsubscribe?.(); unsubscribeActivity?.(); },
    };
}

export async function executeHostHandoff({ host, request, outcome, persistActivation, readReadiness, timeoutMs = 30_000 }: {
    host: HostHandoffAdapter;
    request: HandoffRequest;
    outcome?: HandoffOutcome;
    persistActivation: (activation: WorkspaceActivation) => Promise<void>;
    readReadiness: () => Promise<CanvasReadiness | undefined>;
    timeoutMs?: number;
}): Promise<HandoffOutcome> {
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30_000 || request.canvasId !== "sdd-canvas-direct") throw new RepositoryError("invalid_request");
    const deadline = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const matchesActivation = (activation: WorkspaceActivation, current: HostWorkspaceSnapshot) =>
        current.sessionId === activation.sessionId && current.contextRevision === activation.contextRevision && current.workingDirectory === activation.workingDirectory;
    const verifyReady = (ready: CanvasReadiness, activation: WorkspaceActivation) => {
        if (ready.instanceId !== request.instanceId || !identifier(ready.providerId) || ready.attemptId !== request.attemptId ||
            ready.sessionId !== activation.sessionId || ready.contextRevision !== activation.contextRevision || ready.workingDirectory !== activation.workingDirectory ||
            ready.targetKind !== activation.targetKind || ready.targetBranch !== activation.targetBranch) throw new RepositoryError("clone_identity_changed");
        return { status: "canvas_ready" as const, activation, result: ready };
    };
    const execute = async (): Promise<HandoffOutcome> => {
        const received = outcome ?? await host.handoffPrepared(request);
        if (!["workspace_activated", "canvas_ready"].includes(received.status)) return received;
        const activation = received.activation;
        if (!activation || activation.attemptId !== request.attemptId || !identifier(activation.sessionId) || !identifier(activation.contextRevision) ||
            !identifier(activation.workingDirectory, 32768) || !isAbsolute(activation.workingDirectory) ||
            !["prepared_checkout", "host_worktree"].includes(activation.targetKind) || !activation.targetBranch.startsWith("refs/heads/")) throw new RepositoryError("clone_identity_changed");
        await persistActivation(activation);
        if (deadline.signal.aborted) throw new RepositoryError("handoff_unknown");
        const current = await host.inspectCurrent(deadline.signal);
        if (!matchesActivation(activation, current)) throw new RepositoryError("context_changed");
        if (!supportsRemotePreparation(current)) throw new RepositoryError("host_handoff_unsupported");
        const existing = await readReadiness();
        if (existing) return verifyReady(existing, activation);
        if (current.activity !== "idle") throw new RepositoryError(current.activity === "busy" ? "session_busy" : "activity_unknown");
        const opened = await host.openCurrentCanvas(activation, request.instanceId, deadline.signal);
        if (deadline.signal.aborted) throw new RepositoryError("handoff_unknown");
        if (opened.sessionId !== activation.sessionId || opened.contextRevision !== activation.contextRevision || opened.workingDirectory !== activation.workingDirectory ||
            opened.instanceId !== request.instanceId) throw new RepositoryError("context_changed");
        const ready = await readReadiness();
        if (!ready) throw new RepositoryError("canvas_unavailable");
        if (ready.providerId !== opened.providerId) throw new RepositoryError("canvas_unavailable");
        return verifyReady(ready, activation);
    };
    try {
        return await Promise.race([execute(), new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => { deadline.abort(); reject(new RepositoryError("handoff_unknown")); }, timeoutMs);
        })]);
    } catch (error) { throw knownRepositoryError((error as { code?: unknown })?.code); }
    finally { if (timer) clearTimeout(timer); }
}