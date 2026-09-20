export interface RepositorySummary {
    id: string;
    name: string;
    defaultBranch: string | null;
    operationalState: "active" | "maintenance";
}

export interface RepositoryDetail extends RepositorySummary {
    sourceVersion: string | null;
    speckitStatus: "enabled" | "not_enabled" | "unscannable" | "unavailable";
}

export type ArtifactRoot = "/.specify" | "/specs";

export interface RepositoryItem {
    id: string;
    path: string;
    label: string;
    kind: "folder" | "file";
    objectId: string;
}

export interface RepositoryContext {
    contextId: string;
    repository: RepositoryDetail;
    sourceVersion: string;
    generation: number;
    roots: ArtifactRoot[];
}

export interface RepositoryPage {
    items: RepositorySummary[];
    hasMore: boolean;
    cursor: string | null;
    outcome: "ready" | "scanning" | "no_associations" | "no_linked_repositories";
}

export interface ItemPage {
    items: RepositoryItem[];
    hasMore: boolean;
    cursor: string | null;
    contextId: string;
    sourceVersion: string;
}

export interface RemoteDocument {
    artifact: { id: string; relativePath: string; label: string; role: "reference"; availability: "available" };
    revision: string;
    content: string;
    byteSize: number;
    sourceKind: "git-commit";
    source: { provider: "azure-devops"; repositoryId: string; repositoryName: string; branch: string; commit: string; objectId: string };
    format: "markdown" | "text";
    contextId: string;
    generation: number;
}

export interface EntrySettings {
    schemaVersion: 1;
    repositoryEntryEnabled: boolean;
}

export type EntrySettingsStatus = "enabled" | "disabled" | "invalid";
export type HostActivity = "idle" | "busy" | "unknown";

export interface HostCapabilities {
    localCanvas: boolean;
    checkedPreparation?: boolean;
    atomicPreparation: boolean;
    atomicHandoff: boolean;
    targetAcknowledgment: boolean;
    handoffReconciliation: boolean;
}

export interface HostWorkspaceSnapshot {
    sessionId: string;
    contextRevision: string;
    workingDirectory: string;
    activity: HostActivity;
    activityRevision: string;
    capabilityGeneration: string;
    capabilities: HostCapabilities;
}

export interface LocalRepositoryIdentity {
    workingDirectory: string;
    worktreeRoot: string;
    gitCommonDirectory: string;
    origin: string | null;
    head: string | null;
    branch: string | null;
}

export interface HostContextIdentity {
    sessionId: string;
    contextRevision: string;
}

export interface LocalCanvasAcknowledgment extends HostContextIdentity {
    workingDirectory: string;
    providerId: string;
    instanceId: string;
}

export interface PreparedTarget {
    operationId: string;
    repositoryId: string;
    originIdentity: string;
    defaultRef: string;
    sourceCommit: string;
    destination: string;
    gitCommonDirectory: string;
    branch: string;
    initialWorktreeFingerprint: string;
}

export interface WorkspaceActivation extends HostContextIdentity {
    attemptId: string;
    workingDirectory: string;
    targetKind: "prepared_checkout" | "host_worktree";
    targetBranch: string;
}

export interface CanvasReadiness extends WorkspaceActivation {
    providerId: string;
    instanceId: string;
}

export type HandoffStatus = "requested" | "in_progress" | "workspace_activated" | "canvas_ready" | "rejected" | "unknown";

export interface HandoffAttempt {
    attemptId: string;
    operationId: string;
    expectedSource: HostContextIdentity;
    instanceId: string;
    status: HandoffStatus;
    createdAt: number;
    activation?: WorkspaceActivation;
    result?: CanvasReadiness;
    errorCode?: string;
}

export interface PreparedRepositoryRecord extends PreparedTarget {
    schemaVersion: 2;
    kind: "sdd-prepared-repository";
    profileFingerprint: string;
    accountKey: string;
    createdAt: number;
    completedAt: number;
    handoff?: HandoffAttempt;
    acceptedTarget?: CanvasReadiness;
}

export interface RepositorySelection {
    selectionId: string;
    accountKey: string;
    connectionGeneration: number;
    profileFingerprint: string;
    repository: RepositoryDetail;
    originIdentity: string;
    expectedSource: HostContextIdentity;
    matchesCurrentWorkspace: boolean;
}

export interface CloneConfirmation {
    operationId: string;
    selectionId: string;
    destination: string;
    confirmationDigest: string;
    sourceCommit: string;
    defaultRef: string;
    capabilityGeneration: string;
    createdAt: number;
    expiresAt: number;
    consumedBy?: string;
}

export interface PreparationAdmission {
    operationId: string;
    expectedSource: HostContextIdentity;
    capabilityGeneration: string;
    activityRevision?: string;
}

export interface HandoffRequest {
    attemptId: string;
    expectedSource: HostContextIdentity;
    target: PreparedTarget;
    canvasId: "sdd-canvas-direct";
    instanceId: string;
}

export interface HandoffOutcome {
    status: Exclude<HandoffStatus, "requested"> | "not_started";
    activation?: WorkspaceActivation;
    result?: CanvasReadiness;
}

export interface HostHandoffAdapter {
    inspectCurrent(signal?: AbortSignal): Promise<HostWorkspaceSnapshot>;
    openCurrentCanvas(expected: HostContextIdentity, instanceId: string, signal?: AbortSignal): Promise<LocalCanvasAcknowledgment>;
    admitPreparation<Result>(input: PreparationAdmission, start: () => Promise<Result>): Promise<Result>;
    handoffPrepared(input: HandoffRequest): Promise<HandoffOutcome>;
    getHandoffOutcome(attemptId: string): Promise<HandoffOutcome>;
    dispose(): void;
}

export type RepositoryEntryPhase = "chooser" | "selected" | "preparing" | "prepared" | "waiting_user" |
    "handoff_pending" | "target_binding" | "ready" | "handoff_failed" | "handoff_unknown" | "validation_blocked" | "cancelled" | "failed";

export interface EntryLocalContext {
    contextId: string;
    label: string;
    state: "repository" | "not_repository" | "unavailable";
}

export interface EntryHostStatus {
    activity: HostActivity;
    canOpenCurrent: boolean;
    canPrepareRemote: boolean;
    canHandoff: boolean;
    reason: string | null;
}