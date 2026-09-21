import { createHash, randomBytes } from "node:crypto";
import { realpath } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { parseDocument } from "yaml";
import { createAdoClient } from "./ado-client.ts";
import { createCopilotAppLauncher } from "./app-launch.ts";
import type { CopilotAppLauncher } from "./app-launch.ts";
import { createPreparedArtifactClock } from "./artifact-clock.ts";
import { createCloneService, createEntryCloneService } from "./clone.ts";
import type { CloneState, EntryCloneService } from "./clone.ts";
import { createRepositoryConnection } from "./auth.ts";
import type { AuthDependencies } from "./auth.ts";
import { createRepositoryDiscovery } from "./discovery.ts";
import { errorEnvelope, knownRepositoryError, repositoryErrorStatus, RepositoryError } from "./errors.ts";
import { executeHostHandoff, supportsRemotePreparation, supportsRepositoryCloning } from "./host-handoff.ts";
import { nativeAuthDependencies } from "./msal-client.ts";
import { loadRepositoryProfile } from "./profile.ts";
import { createPreparationStore } from "./preparation-store.ts";
import type { ProfileStatus } from "./profile.ts";
import { createRemoteReview } from "./remote-review.ts";
import type { ArtifactRoot, EntryLocalContext, HandoffAttempt, HandoffOutcome, HostHandoffAdapter, HostWorkspaceSnapshot, LocalRepositoryIdentity, PreparedRepositoryRecord, RepositoryEntryPhase, RepositorySelection } from "./types.ts";
import { assertWorkspaceBinding, createWorkflowBinding, inspectCurrentRepository, inspectWorkspaceBinding, verifyPreparedRepository, verifyReadyRepository } from "./workspace-binding.ts";
import type { WorkspaceBinding } from "./workspace-binding.ts";

export { createHostHandoffAdapter } from "./host-handoff.ts";
export { loadEntrySettings } from "./profile.ts";
export { createWorkflowBinding } from "./workspace-binding.ts";

export async function createRepositoryService({ workspacePath, profileStatus, dependencies, request, cloneOptions, bindingOptions, workflowBinding, onChange = () => undefined }: {
    workspacePath: string;
    profileStatus?: ProfileStatus;
    dependencies?: AuthDependencies;
    request?: typeof fetch;
    cloneOptions?: Partial<Pick<Parameters<typeof createCloneService>[0], "homeDirectory" | "runner" | "executable" | "now">>;
    bindingOptions?: Partial<Pick<Parameters<typeof inspectWorkspaceBinding>[0], "homeDirectory" | "runner" | "executable">>;
    workflowBinding?: Awaited<ReturnType<typeof createWorkflowBinding>>;
    onChange?: () => void;
}) {
    const configuration = profileStatus ?? await loadRepositoryProfile();
    const localContextId = `local_${randomBytes(24).toString("base64url")}`;
    let workspaceBinding: WorkspaceBinding = workflowBinding?.preparation ?? await inspectWorkspaceBinding({ workspacePath, ...bindingOptions });
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
    const clones = review && profile && connection ? createCloneService({ readSource: contextId => review.source(contextId), profile, connection, workspacePath, ...cloneOptions, onChange }) : undefined;

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
            await workflowBinding?.verify();
            workspaceBinding = workflowBinding?.preparation ?? await inspectWorkspaceBinding({ workspacePath, ...bindingOptions, previous: workspaceBinding });
            service.assertLocal(contextId);
            assertWorkspaceBinding(workspaceBinding);
        },
        dispose() { disposed = true; connection?.dispose(); discovery?.dispose(); review?.dispose(); clones?.dispose(); },
    };
    return service;
}

export type RepositoryService = Awaited<ReturnType<typeof createRepositoryService>>;

export async function createEntryCoordinator({ host, profileStatus, dependencies, request, cloneOptions, handoffOptions, appLauncher = createCopilotAppLauncher(),
    inspectWorkspace = (workspacePath) => inspectCurrentRepository({ workspacePath }), onChange = () => undefined }: {
    host: HostHandoffAdapter;
    profileStatus?: ProfileStatus;
    dependencies?: AuthDependencies;
    request?: typeof fetch;
    cloneOptions?: Partial<Pick<Parameters<typeof createCloneService>[0], "homeDirectory" | "runner" | "executable" | "now">>;
    handoffOptions?: { verifyPrepared?: (record: PreparedRepositoryRecord) => Promise<unknown>; timeoutMs?: number; now?: () => number };
    appLauncher?: CopilotAppLauncher;
    inspectWorkspace?: (workingDirectory: string) => Promise<LocalRepositoryIdentity | null>;
    onChange?: () => void;
}) {
    const configuration = profileStatus ?? await loadRepositoryProfile();
    const profile = configuration.state === "configured" ? configuration.profile : undefined;
    let disposed = false;
    let currentHost: HostWorkspaceSnapshot | undefined;
    let localContextId = `local_${randomBytes(24).toString("base64url")}`;
    let localFingerprint: string | undefined;
    let phase: RepositoryEntryPhase = "chooser";
    let selectionGeneration = 0;
    let selected: { selection: RepositorySelection; snapshot: HostWorkspaceSnapshot; contextId: string;
        preview?: Awaited<ReturnType<EntryCloneService["confirm"]>> } | undefined;
    let clones: EntryCloneService | undefined;
    let activeOperationId: string | undefined;
    let retainedOperation: CloneState | undefined;
    let activeRecord: PreparedRepositoryRecord | undefined;
    let handoffError: string | undefined;
    const automatic = new Map<string, { source: HostWorkspaceSnapshot; eligible: boolean }>();
    const pending = new Set<Promise<void>>();
    const retries = new Map<string, { operationId: string; contextId: string; completion: Promise<CloneState> }>();
    const transitions = new Set<string>();
    const store = createPreparationStore({ homeDirectory: cloneOptions?.homeDirectory });
    const localRequests = new Map<string, { contextId: string; completion: Promise<{ opened: true }> }>();
    const appRequests = new Map<string, { operationId: string; contextId: string; completion: Promise<{ status: "requested" }> }>();
    const adapter = dependencies ?? nativeAuthDependencies();
    const connection = profile ? createRepositoryConnection(profile, { ...adapter, onChange: (snapshot) => {
        if (disposed) return;
        selectionGeneration++; selected = undefined;
        clones?.invalidate();
        for (const eligibility of automatic.values()) eligibility.eligible = false;
        retainedOperation = undefined; activeRecord = undefined; handoffError = undefined;
        activeOperationId = undefined; phase = "chooser";
        discovery?.clear(); adapter.onChange?.(snapshot); onChange();
    } }) : undefined;
    const client = profile && connection ? createAdoClient({ profile, connection, request }) : undefined;
    const discovery = profile && client ? createRepositoryDiscovery({ profile, client }) : undefined;

    function remoteAvailable() {
        if (disposed || !profile || !connection || !discovery) throw new RepositoryError("connection_required");
        return { profile, connection, discovery };
    }

    function remoteReason(snapshot: HostWorkspaceSnapshot) {
        return !supportsRemotePreparation(snapshot) ? "host_handoff_unsupported" : snapshot.activity === "busy" ? "session_busy" :
            snapshot.activity === "unknown" ? "activity_unknown" : null;
    }

    function preparationReason(snapshot: HostWorkspaceSnapshot) {
        return !supportsRepositoryCloning(snapshot) || snapshot.activity === "unknown" ? "activity_unknown" :
            snapshot.activity === "busy" ? "session_busy" : null;
    }

    const accountKey = (access: Awaited<ReturnType<NonNullable<typeof connection>["access"]>>) =>
        createHash("sha256").update(JSON.stringify([access.tenantId, access.accountId])).digest("hex");

    const sameSource = (source: HostWorkspaceSnapshot, current: HostWorkspaceSnapshot) => source.sessionId === current.sessionId &&
        source.contextRevision === current.contextRevision && source.workingDirectory === current.workingDirectory && source.capabilityGeneration === current.capabilityGeneration &&
        source.activityRevision === current.activityRevision && current.activity === "idle";

    function remember(record: PreparedRepositoryRecord, repositoryName?: string) {
        activeRecord = record; activeOperationId = record.operationId;
        retainedOperation = { operationId: record.operationId, state: "prepared", repositoryName: repositoryName ?? retainedOperation?.repositoryName ?? "Prepared repository",
            branch: record.defaultRef, sourceCommit: record.sourceCommit, localBranch: record.branch.slice(11), destination: record.destination };
    }

    function operationView() {
        if (!activeOperationId || connection?.snapshot().state !== "connected") return null;
        let operation = retainedOperation;
        if (!operation && clones) {
            try { operation = clones.status(activeOperationId); } catch { return null; }
        }
        if (!operation || operation.state === "awaiting_confirmation") return null;
        return { ...operation, ...(handoffError ? { error: handoffError } : {}) };
    }

    async function authorizedRecord(operationId: string) {
        try {
            const remote = remoteAvailable();
            const access = await remote.connection.access();
            const record = await store.read(operationId);
            if (record.accountKey !== accountKey(access) || record.profileFingerprint !== createHash("sha256").update(JSON.stringify(remote.profile)).digest("hex")) throw new Error();
            const repository = await remote.discovery.detail(record.repositoryId);
            access.assertCurrent();
            return { record, repository, access };
        } catch { throw new RepositoryError("resource_unavailable"); }
    }

    async function outcomeFor(attemptId: string) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            return await Promise.race([host.getHandoffOutcome(attemptId), new Promise<never>((_resolve, reject) => {
                timer = setTimeout(() => reject(new RepositoryError("handoff_unknown")), 5000);
            })]);
        } catch { throw new RepositoryError("handoff_unknown"); }
        finally { if (timer) clearTimeout(timer); }
    }

    async function performHandoff(operationId: string, expected: HostWorkspaceSnapshot, reconcile: boolean) {
        if (transitions.has(operationId)) throw new RepositoryError("handoff_in_progress");
        transitions.add(operationId);
        let attempt: HandoffAttempt | undefined;
        let submitted = false;
        try {
            const authorized = await authorizedRecord(operationId);
            let record = authorized.record;
            remember(record, authorized.repository.name);
            const reason = remoteReason(await readHost());
            if (reason) throw new RepositoryError(reason);
            let outcome: HandoffOutcome | undefined;
            attempt = record.handoff;
            if (attempt && reconcile) {
                outcome = await outcomeFor(attempt.attemptId);
                if (attempt.activation && !["workspace_activated", "canvas_ready"].includes(outcome.status)) throw new RepositoryError("handoff_unknown");
                if (outcome.status === "unknown" || outcome.status === "in_progress") {
                    record = await store.updateAttempt(operationId, { ...attempt, status: outcome.status });
                    remember(record, authorized.repository.name);
                    phase = outcome.status === "unknown" ? "handoff_unknown" : "handoff_pending";
                    throw new RepositoryError(outcome.status === "unknown" ? "handoff_unknown" : "handoff_in_progress");
                }
                if (outcome.status === "not_started" || outcome.status === "rejected") {
                    record = await store.updateAttempt(operationId, { ...attempt, status: "rejected" });
                    attempt = undefined; outcome = undefined;
                }
            } else if (attempt) throw new RepositoryError("handoff_in_progress");
            if (!record.acceptedTarget) {
                await (handoffOptions?.verifyPrepared ? handoffOptions.verifyPrepared(record) : verifyPreparedRepository({ record, ...cloneOptions }));
            }
            const current = await readHost();
            const currentReason = remoteReason(current);
            if (currentReason) throw new RepositoryError(currentReason);
            if (record.acceptedTarget) await verifyReadyRepository({ record, snapshot: current, providerId: record.acceptedTarget.providerId,
                instanceId: record.acceptedTarget.instanceId, ...cloneOptions });
            if (!attempt) {
                if (!sameSource(expected, current)) throw new RepositoryError("context_changed");
                const attemptId = randomBytes(16).toString("hex");
                attempt = { attemptId, operationId, expectedSource: { sessionId: current.sessionId, contextRevision: current.contextRevision },
                    instanceId: `entry-target-${attemptId}`, status: "requested", createdAt: (handoffOptions?.now ?? Date.now)() };
                record = await store.beginAttempt(operationId, attempt);
            }
            const submittedAttempt = attempt;
            if (automatic.has(operationId)) automatic.get(operationId)!.eligible = false;
            phase = "handoff_pending"; handoffError = undefined; onChange();
            submitted = true;
            const result = await executeHostHandoff({ host, outcome, timeoutMs: handoffOptions?.timeoutMs,
                request: { attemptId: attempt.attemptId, expectedSource: attempt.expectedSource, target: record,
                    canvasId: "sdd-canvas-direct", instanceId: attempt.instanceId },
                persistActivation: async activation => {
                    const latest = await store.read(operationId);
                    if (latest.handoff?.attemptId !== submittedAttempt.attemptId) throw new RepositoryError("context_changed");
                    if (latest.handoff.activation) {
                        if (JSON.stringify(latest.handoff.activation) !== JSON.stringify(activation)) throw new RepositoryError("clone_identity_changed");
                    } else {
                        await store.updateAttempt(operationId, { ...submittedAttempt, status: "workspace_activated", activation });
                    }
                    if (!disposed) { phase = "target_binding"; onChange(); }
                },
                readReadiness: async () => {
                    const latest = await store.read(operationId);
                    return latest.handoff?.attemptId === submittedAttempt.attemptId && latest.handoff.status === "canvas_ready" ? latest.acceptedTarget : undefined;
                } });
            if (result.status !== "canvas_ready") {
                const status = result.status === "not_started" ? "rejected" : result.status;
                await store.updateAttempt(operationId, { ...submittedAttempt, status });
                if (status === "unknown") throw new RepositoryError("handoff_unknown");
                if (status === "in_progress") throw new RepositoryError("handoff_in_progress");
                throw new RepositoryError("canvas_unavailable");
            }
            remember(await store.read(operationId), authorized.repository.name);
            phase = "ready"; handoffError = undefined; onChange();
            return { ...retainedOperation! };
        } catch (error) {
            const failure = knownRepositoryError((error as { code?: unknown })?.code);
            if (attempt) {
                try {
                    const latest = await store.read(operationId);
                    if (latest.handoff?.attemptId === attempt.attemptId && latest.handoff.status !== "canvas_ready") {
                        const definite = ["session_busy", "activity_unknown", "context_changed", "host_handoff_unsupported"].includes(failure.code);
                        const status = latest.handoff.activation ? "workspace_activated" : failure.code === "handoff_unknown" ? "unknown" :
                            failure.code === "handoff_in_progress" ? "in_progress" : latest.handoff.status === "rejected" || definite ? "rejected" :
                                submitted ? "unknown" : latest.handoff.status;
                        remember(await store.updateAttempt(operationId, { ...latest.handoff, status, errorCode: failure.code }));
                    }
                } catch { handoffError = "handoff_unknown"; }
            }
            handoffError ??= failure.code;
            phase = failure.code === "handoff_unknown" ? "handoff_unknown" : failure.code === "handoff_in_progress" ? "handoff_pending" :
                ["clone_identity_changed", "resource_unavailable", "context_changed"].includes(failure.code) ? "validation_blocked" :
                    ["session_busy", "activity_unknown"].includes(failure.code) ? "waiting_user" : "handoff_failed";
            if (!disposed) onChange();
            throw failure;
        } finally { transitions.delete(operationId); }
    }

    function continueAfterPreparation(operationId: string) {
        const job = (async () => {
            await clones!.completion(operationId);
            if (disposed || clones!.status(operationId).state !== "prepared") return;
            const authorized = await authorizedRecord(operationId);
            remember(authorized.record, authorized.repository.name);
            const eligibility = automatic.get(operationId);
            const current = await readHost();
            if (!eligibility || !supportsRemotePreparation(eligibility.source) || !supportsRemotePreparation(current)) {
                phase = "prepared"; handoffError = undefined; onChange(); return;
            }
            if (!eligibility?.eligible || !sameSource(eligibility.source, current)) {
                phase = "waiting_user"; handoffError = remoteReason(current) ?? "context_changed"; onChange(); return;
            }
            await performHandoff(operationId, current, false);
        })().catch(error => {
            if (!disposed && !["handoff_unknown", "handoff_pending", "handoff_failed", "validation_blocked", "waiting_user"].includes(phase)) {
                phase = "validation_blocked"; handoffError = knownRepositoryError((error as { code?: unknown })?.code).code; onChange();
            }
        });
        pending.add(job); void job.finally(() => pending.delete(job));
    }

    async function readSelectionSource(selectionId: string) {
        const remote = remoteAvailable();
        const current = selected;
        if (!current || current.selection.selectionId !== selectionId || current.selection.matchesCurrentWorkspace) throw new RepositoryError("context_changed");
        const access = await remote.connection.access();
        if (accountKey(access) !== current.selection.accountKey || access.generation !== current.selection.connectionGeneration) throw new RepositoryError("invalid_context");
        const repository = await remote.discovery.detail(current.selection.repository.id);
        access.assertCurrent();
        if (selected !== current || !repository.sourceVersion || repository.sourceVersion !== current.selection.repository.sourceVersion ||
            repository.defaultBranch !== current.selection.repository.defaultBranch) throw new RepositoryError("source_changed");
        return { repository, sourceVersion: repository.sourceVersion, generation: access.generation };
    }

    function ensureClones(snapshot: HostWorkspaceSnapshot) {
        const remote = remoteAvailable();
        clones ??= createEntryCloneService({ host, readSource: readSelectionSource, connection: remote.connection, profile: remote.profile,
            workspacePath: snapshot.workingDirectory, ...cloneOptions, onChange: () => {
                if (disposed) return;
                if (activeOperationId) {
                    const state = clones!.status(activeOperationId).state;
                    phase = state === "preparing" || state === "verifying" ? "preparing" : state === "prepared" ? "prepared" :
                        state === "cancelled" ? "cancelled" : state === "failed" ? "failed" : phase;
                }
                onChange();
            } });
        return clones;
    }

    async function readHost() {
        if (disposed) throw new RepositoryError("invalid_context");
        const snapshot = await host.inspectCurrent();
        if (disposed) throw new RepositoryError("invalid_context");
        for (const eligibility of automatic.values()) if (!sameSource(eligibility.source, snapshot)) eligibility.eligible = false;
        if (currentHost && (currentHost.sessionId !== snapshot.sessionId || currentHost.contextRevision !== snapshot.contextRevision ||
            currentHost.workingDirectory !== snapshot.workingDirectory)) localContextId = `local_${randomBytes(24).toString("base64url")}`;
        currentHost = snapshot;
        return snapshot;
    }

    async function readLocal() {
        const snapshot = await readHost();
        const repository = await inspectWorkspace(snapshot.workingDirectory);
        const current = await readHost();
        if (current.sessionId !== snapshot.sessionId || current.contextRevision !== snapshot.contextRevision ||
            current.workingDirectory !== snapshot.workingDirectory) throw new RepositoryError("context_changed");
        const fingerprint = JSON.stringify([current.sessionId, current.contextRevision, current.workingDirectory, repository]);
        if (localFingerprint !== undefined && localFingerprint !== fingerprint) {
            localContextId = `local_${randomBytes(24).toString("base64url")}`;
            if (!activeOperationId) phase = "chooser";
        }
        localFingerprint = fingerprint;
        return { snapshot: current, repository };
    }

    async function openLocal(snapshot: HostWorkspaceSnapshot, instanceId: string) {
        const opened = await host.openCurrentCanvas(snapshot, instanceId);
        const after = await readHost();
        if (disposed || opened.sessionId !== snapshot.sessionId || opened.contextRevision !== snapshot.contextRevision ||
            opened.workingDirectory !== snapshot.workingDirectory || opened.instanceId !== instanceId ||
            after.sessionId !== snapshot.sessionId || after.contextRevision !== snapshot.contextRevision ||
            after.workingDirectory !== snapshot.workingDirectory) throw new RepositoryError("context_changed");
    }

    const service = {
        snapshot() { return { configuration: configuration.state, connection: connection?.snapshot() ?? { state: "disconnected", generation: 0, projectLabel: "" } }; },
        async state() {
            const localContext: EntryLocalContext = { contextId: localContextId, label: "Current workspace", state: "unavailable" };
            let snapshot: HostWorkspaceSnapshot | undefined;
            let appAvailable = false;
            let reason: string | null = null;
            try {
                const local = await readLocal();
                snapshot = local.snapshot;
                const repository = local.repository;
                localContext.contextId = localContextId;
                localContext.state = repository ? "repository" : "not_repository";
                if (repository) localContext.label = basename(repository.worktreeRoot);
                reason = preparationReason(snapshot);
                appAvailable = await appLauncher.available(repository?.worktreeRoot ?? snapshot.workingDirectory).catch(() => false);
            } catch (error) { reason = knownRepositoryError((error as { code?: unknown })?.code).code; }
            return { configuration: configuration.state, connection: connection?.snapshot() ?? { state: "disconnected", generation: 0, projectLabel: "" },
                phase: phase as RepositoryEntryPhase, localContext, host: { activity: snapshot?.activity ?? "unknown", canOpenCurrent: Boolean(snapshot?.capabilities.localCanvas && localContext.state === "repository"),
                    canPrepareRemote: Boolean(snapshot && supportsRepositoryCloning(snapshot) && snapshot.activity === "idle"),
                    canOpenClone: Boolean(appAvailable && snapshot?.activity === "idle"),
                    canHandoff: Boolean(snapshot && supportsRemotePreparation(snapshot)),
                    canRetryHandoff: Boolean(snapshot && supportsRemotePreparation(snapshot) && snapshot.activity === "idle" && activeOperationId &&
                        retainedOperation && !transitions.has(activeOperationId) && !automatic.get(activeOperationId)?.eligible && phase !== "ready"), reason },
                operation: operationView() };
        },
        async local(contextId: string, requestId: string) {
            text(contextId); text(requestId);
            const { snapshot, repository } = await readLocal();
            if (contextId !== localContextId) throw new RepositoryError("context_changed");
            if (!repository) throw new RepositoryError("local_context_mismatch");
            const existing = localRequests.get(requestId);
            if (existing) {
                if (existing.contextId !== contextId) throw new RepositoryError("context_changed");
                return existing.completion;
            }
            if (localRequests.size >= 32) throw new RepositoryError("invalid_context");
            const instanceId = `entry-local-${randomBytes(16).toString("hex")}`;
            const completion = (async () => {
                await openLocal(snapshot, instanceId);
                await readLocal();
                if (contextId !== localContextId) throw new RepositoryError("context_changed");
                phase = "ready"; onChange();
                return { opened: true as const };
            })();
            localRequests.set(requestId, { contextId, completion });
            return completion;
        },
        async direct(requestId: string) {
            text(requestId);
            const snapshot = await readHost();
            await openLocal(snapshot, `entry-direct-${randomBytes(16).toString("hex")}`);
            return { opened: true as const };
        },
        async select(repositoryId: string, contextId: string) {
            text(repositoryId); text(contextId);
            const remote = remoteAvailable();
            if (transitions.size || activeRecord?.handoff && !["rejected", "canvas_ready"].includes(activeRecord.handoff.status)) throw new RepositoryError("handoff_in_progress");
            if (activeOperationId && clones && ["preparing", "verifying"].includes(clones.status(activeOperationId).state)) throw new RepositoryError("clone_conflict");
            activeOperationId = undefined;
            retainedOperation = undefined; activeRecord = undefined; handoffError = undefined;
            const generation = ++selectionGeneration;
            selected = undefined;
            const local = await readLocal();
            if (contextId !== localContextId) throw new RepositoryError("context_changed");
            const access = await remote.connection.access();
            const repository = await remote.discovery.detail(repositoryId);
            access.assertCurrent();
            const after = await readHost();
            if (generation !== selectionGeneration || contextId !== localContextId || after.contextRevision !== local.snapshot.contextRevision ||
                after.sessionId !== local.snapshot.sessionId) throw new RepositoryError("context_changed");
            const originIdentity = `https://dev.azure.com/${[remote.profile.organization, remote.profile.project, "_git", repository.id].map(encodeURIComponent).join("/")}`;
            const namedOrigin = `https://dev.azure.com/${[remote.profile.organization, remote.profile.project, "_git", repository.name].map(encodeURIComponent).join("/")}`;
            const currentOrigin = local.repository?.origin?.replace(/\/$/, "").toLowerCase();
            const matchesCurrentWorkspace = currentOrigin === originIdentity.toLowerCase() || currentOrigin === namedOrigin.toLowerCase();
            const profileFingerprint = createHash("sha256").update(JSON.stringify(remote.profile)).digest("hex");
            const selection: RepositorySelection = { selectionId: `selection_${randomBytes(24).toString("base64url")}`, repository, originIdentity,
                accountKey: accountKey(access), connectionGeneration: access.generation, profileFingerprint, expectedSource: { sessionId: after.sessionId, contextRevision: after.contextRevision }, matchesCurrentWorkspace };
            selected = { selection, snapshot: after, contextId };
            const operationId = randomBytes(16).toString("hex");
            const home = await realpath(cloneOptions?.homeDirectory ?? homedir());
            const reason = preparationReason(after) ?? (!repository.sourceVersion || !repository.defaultBranch || repository.operationalState !== "active" ? "source_unavailable" : null);
            const current = selected;
            if (!matchesCurrentWorkspace && !reason) current.preview = await ensureClones(after).confirm(selection.selectionId, after);
            if (selected !== current || generation !== selectionGeneration) throw new RepositoryError("context_changed");
            phase = "selected"; onChange();
            return { selectionId: selection.selectionId, repository, accountLabel: remote.connection.snapshot().accountLabel ?? "Microsoft account",
                matchesCurrentWorkspace, operationId: current.preview?.operationId ?? operationId,
                destination: current.preview?.destination ?? join(home, "SpecKitCanvas", "repositories", operationId, "checkout"),
                confirmation: current.preview?.confirmation ?? null, expiresAt: current.preview?.expiresAt ?? null, reason };
        },
        async clone(selectionId: string, confirmation: string, requestId: string) {
            text(selectionId); text(confirmation); text(requestId);
            const { snapshot } = await readLocal();
            const reason = preparationReason(snapshot);
            if (reason) throw new RepositoryError(reason);
            const current = selected;
            if (!current || current.selection.selectionId !== selectionId || current.contextId !== localContextId || !current.preview || !clones) throw new RepositoryError("context_changed");
            activeOperationId = current.preview.operationId;
            const first = !automatic.has(activeOperationId);
            if (first) automatic.set(activeOperationId, { source: structuredClone(snapshot), eligible: supportsRemotePreparation(snapshot) });
            try {
                const started = await clones.start(activeOperationId, confirmation, requestId);
                if (first) continueAfterPreparation(activeOperationId);
                return started;
            }
            catch (error) {
                automatic.get(current.preview.operationId)!.eligible = false;
                if (clones.status(current.preview.operationId).state === "awaiting_confirmation") { activeOperationId = undefined; phase = "selected"; onChange(); }
                throw error;
            }
        },
        async operation(operationId: string) {
            text(operationId);
            if (retainedOperation?.operationId === operationId) {
                await authorizedRecord(operationId);
                return { ...retainedOperation, ...(handoffError ? { error: handoffError } : {}) };
            }
            if (clones) return clones.authorized(operationId);
            const authorized = await authorizedRecord(operationId);
            return { operationId, state: "prepared" as const, repositoryName: authorized.repository.name, branch: authorized.record.defaultRef,
                sourceCommit: authorized.record.sourceCommit, localBranch: authorized.record.branch.slice(11), destination: authorized.record.destination };
        },
        async cancel(operationId: string, requestId: string) {
            text(operationId); text(requestId);
            if (!clones) throw new RepositoryError("resource_unavailable");
            const before = await clones.authorized(operationId);
            if (automatic.has(operationId)) automatic.get(operationId)!.eligible = false;
            clones.cancel(operationId);
            if (before.state === "awaiting_confirmation" && selected?.preview?.operationId === operationId) {
                selected = undefined; selectionGeneration++; phase = "chooser"; onChange();
            }
            await clones.completion(operationId);
            return clones.authorized(operationId);
        },
        async handoff(operationId: string, contextId: string, requestId: string) {
            text(operationId); text(contextId); text(requestId);
            const local = await readLocal();
            if (contextId !== localContextId) throw new RepositoryError("context_changed");
            const reason = remoteReason(local.snapshot);
            if (reason) throw new RepositoryError(reason);
            const existing = retries.get(requestId);
            if (existing) {
                if (existing.operationId !== operationId || existing.contextId !== contextId) throw new RepositoryError("context_changed");
                return existing.completion;
            }
            if (retries.size >= 32) throw new RepositoryError("invalid_context");
            if (automatic.has(operationId)) automatic.get(operationId)!.eligible = false;
            const completion = performHandoff(operationId, local.snapshot, true);
            retries.set(requestId, { operationId, contextId, completion });
            return completion;
        },
        async openCheckout(operationId: string, contextId: string, requestId: string) {
            text(operationId); text(contextId); text(requestId);
            const local = await readLocal();
            if (contextId !== localContextId) throw new RepositoryError("context_changed");
            if (local.snapshot.activity !== "idle") throw new RepositoryError(local.snapshot.activity === "busy" ? "session_busy" : "activity_unknown");
            const authorized = await authorizedRecord(operationId);
            const existing = appRequests.get(requestId);
            if (existing) {
                if (existing.operationId !== operationId || existing.contextId !== contextId) throw new RepositoryError("context_changed");
                return existing.completion;
            }
            if (appRequests.size >= 32) throw new RepositoryError("invalid_context");
            if (transitions.size || authorized.record.handoff && !["rejected", "canvas_ready"].includes(authorized.record.handoff.status)) {
                throw new RepositoryError("handoff_in_progress");
            }
            const completion = (async () => {
                await (handoffOptions?.verifyPrepared ? handoffOptions.verifyPrepared(authorized.record) : verifyPreparedRepository({ record: authorized.record, ...cloneOptions }));
                const check = async () => {
                    await (handoffOptions?.verifyPrepared ? handoffOptions.verifyPrepared(authorized.record) : verifyPreparedRepository({ record: authorized.record, ...cloneOptions }));
                    authorized.access.assertCurrent();
                    if (disposed || contextId !== localContextId) throw new RepositoryError("context_changed");
                    const current = await readHost();
                    if (current.activity !== "idle") throw new RepositoryError(current.activity === "busy" ? "session_busy" : "activity_unknown");
                    if (!sameSource(local.snapshot, current)) throw new RepositoryError("context_changed");
                };
                await check();
                return appLauncher.launch(local.repository?.worktreeRoot ?? local.snapshot.workingDirectory, authorized.record.destination, check);
            })().catch(error => { throw knownRepositoryError((error as { code?: unknown })?.code); });
            appRequests.set(requestId, { operationId, contextId, completion });
            return completion;
        },
        async preparations() {
            const remote = remoteAvailable();
            const access = await remote.connection.access();
            const fingerprint = createHash("sha256").update(JSON.stringify(remote.profile)).digest("hex");
            const result = await store.list();
            if (result.hasMore) throw new RepositoryError("clone_conflict");
            const items = [];
            for (const item of result.items) {
                const record = item.record;
                if (!record || record.accountKey !== accountKey(access) || record.profileFingerprint !== fingerprint) continue;
                try {
                    const repository = await remote.discovery.detail(record.repositoryId);
                    access.assertCurrent();
                    items.push({ operationId: record.operationId, repositoryName: repository.name, sourceCommit: record.sourceCommit,
                        destination: record.destination, state: "prepared" as const, handoffState: record.handoff?.status ?? null });
                } catch { access.assertCurrent(); }
            }
            return { items };
        },
        connect() { if (disposed || !connection) throw new RepositoryError("connection_required"); return connection.connect(); },
        disconnect() { connection?.disconnect(); discovery?.clear(); onChange(); },
        search(query: string, cursor?: string) { if (disposed || !discovery) throw new RepositoryError("connection_required"); return discovery.search(query, cursor); },
        relevant(cursor?: string) { if (disposed || !discovery) throw new RepositoryError("connection_required"); return discovery.relevant(cursor); },
        detail(repositoryId: string) { if (disposed || !discovery) throw new RepositoryError("connection_required"); return discovery.detail(repositoryId); },
        async settled() { await clones?.settled(); await Promise.all(pending); },
        dispose() { disposed = true; clones?.dispose(); connection?.dispose(); discovery?.dispose(); host.dispose(); },
    };
    return service;
}

export type EntryCoordinator = Awaited<ReturnType<typeof createEntryCoordinator>>;

function text(input: unknown, maximum = 256): string {
    if (typeof input !== "string" || !input || input.length > maximum || /[\p{Cc}]/u.test(input)) throw new RepositoryError("invalid_request");
    return input;
}

async function requestBody(req: IncomingMessage, strict = false): Promise<Record<string, unknown>> {
    if (!/^application\/json(?:;|$)/i.test(String(req.headers["content-type"] ?? ""))) throw new RepositoryError("invalid_request");
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        size += chunk.length;
        if (size > 32_768) throw new RepositoryError("invalid_request");
        chunks.push(chunk);
    }
    try {
        const raw = strict ? new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)) : Buffer.concat(chunks).toString("utf8");
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        if (strict && parseDocument(raw, { schema: "json", uniqueKeys: true }).errors.length) throw new Error();
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
        const queries: Record<string, string[]> = { connection: [], relevant: ["cursor"], search: ["q", "cursor"], detail: ["repositoryId"] };
        const bodies: Record<string, string[]> = { connect: [], disconnect: [] };
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
        else if (path === "search") data = await service.search(query("q"), cursor);
        else if (path === "relevant") data = await service.relevant(cursor);
        else if (path === "detail") data = await service.detail(query("repositoryId"));
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

export async function handleEntryRequest(req: IncomingMessage, res: ServerResponse, url: URL, entry: {
    state(): Promise<unknown>;
    local(contextId: string, requestId: string): Promise<unknown>;
    direct?(requestId: string): Promise<unknown>;
    select?(repositoryId: string, contextId: string): Promise<unknown>;
    clone?(selectionId: string, confirmation: string, requestId: string): Promise<unknown>;
    operation?(operationId: string): Promise<unknown>;
    cancel?(operationId: string, requestId: string): Promise<unknown>;
    preparations?(): Promise<unknown>;
    handoff?(operationId: string, contextId: string, requestId: string): Promise<unknown>;
    openCheckout?(operationId: string, contextId: string, requestId: string): Promise<unknown>;
}) {
    function json(status: number, payload: unknown) {
        res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" });
        res.end(JSON.stringify(payload));
    }
    try {
        if (!url.pathname.startsWith("/api/entry/") || !["GET", "POST"].includes(req.method ?? "")) throw new RepositoryError("invalid_request");
        if (req.method === "POST" && req.headers.origin !== url.origin) throw new RepositoryError("invalid_request");
        const path = url.pathname.slice("/api/entry/".length);
        const operation = /^operations\/([a-f0-9]{32})(?:\/(cancel|handoff|open))?$/.exec(path);
        const route = operation ? operation[2] ? `operation-${operation[2]}` : "operation" : path;
        const queries = new Map<string, string[]>([["state", []], ["operation", []], ["preparations", []]]);
        const bodies = new Map<string, string[]>([["local", ["contextId", "requestId"]], ["direct", ["requestId"]],
            ["selection", ["repositoryId", "contextId"]], ["clone", ["selectionId", "confirmation", "requestId"]], ["operation-cancel", ["requestId"]],
            ["operation-handoff", ["contextId", "requestId"]], ["operation-open", ["contextId", "requestId"]]]);
        const allowed = (req.method === "GET" ? queries : bodies).get(route);
        if (!allowed) throw new RepositoryError("invalid_request");
        for (const key of url.searchParams.keys()) {
            if (key !== "cap" || url.searchParams.getAll(key).length !== 1) throw new RepositoryError("invalid_request");
        }
        const body = req.method === "POST" ? await requestBody(req, true) : {};
        if (Object.keys(body).some((key) => !allowed.includes(key))) throw new RepositoryError("invalid_request");
        let data: unknown;
        let status = 200;
        if (route === "state") data = await entry.state();
        else if (route === "direct") {
            if (!entry.direct) throw new RepositoryError("canvas_unavailable");
            data = await entry.direct(text(body.requestId));
        } else if (route === "selection" && entry.select) data = await entry.select(text(body.repositoryId), text(body.contextId));
        else if (route === "clone" && entry.clone) { data = await entry.clone(text(body.selectionId), text(body.confirmation), text(body.requestId)); status = 202; }
        else if (route === "operation" && entry.operation) data = await entry.operation(operation![1]!);
        else if (route === "operation-cancel" && entry.cancel) data = await entry.cancel(operation![1]!, text(body.requestId));
        else if (route === "operation-handoff" && entry.handoff) data = await entry.handoff(operation![1]!, text(body.contextId), text(body.requestId));
        else if (route === "operation-open" && entry.openCheckout) { data = await entry.openCheckout(operation![1]!, text(body.contextId), text(body.requestId)); status = 202; }
        else if (route === "preparations" && entry.preparations) data = await entry.preparations();
        else if (route === "local") data = await entry.local(text(body.contextId), text(body.requestId));
        else throw new RepositoryError("invalid_request");
        json(status, { ok: true, data });
    } catch (error) {
        const envelope = errorEnvelope(error);
        json(repositoryErrorStatus(envelope.error.code), envelope);
    }
}