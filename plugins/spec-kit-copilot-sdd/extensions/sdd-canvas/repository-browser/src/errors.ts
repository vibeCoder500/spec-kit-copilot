const messages = {
    invalid_request: "The repository request is invalid.",
    connection_required: "Connect a Microsoft account to continue.",
    interaction_required: "Microsoft sign-in is required to continue.",
    wrong_tenant: "Use a Microsoft account from the configured organization.",
    insufficient_scope: "The required delegated permission is unavailable.",
    policy_blocked: "Microsoft sign-in is blocked by organizational policy.",
    resource_unavailable: "The requested repository resource is unavailable.",
    invalid_context: "The repository context is no longer valid.",
    expired_cursor: "The repository page expired. Refresh the collection.",
    source_unavailable: "The selected repository revision is unavailable.",
    unsupported_file: "This artifact cannot be previewed as text.",
    file_too_large: "The artifact exceeds the 5 MiB preview limit.",
    rate_limited: "Azure DevOps is temporarily limiting requests. Try again later.",
    clone_conflict: "The repository preparation cannot proceed in this state.",
    clone_cancelled: "Repository preparation was cancelled.",
    remote_read_only: "Open the repository in a verified local session to run workflows.",
    local_context_mismatch: "The workflow does not match this session's local repository.",
    entry_required: "Choose a repository or continue with the current workspace first.",
    source_changed: "The repository's default revision changed. Select it again before confirming.",
    context_changed: "The active workspace changed. Review the repository selection again.",
    confirmation_expired: "Clone confirmation expired. Review and confirm the selection again.",
    session_busy: "The current session is busy. Wait until it is idle, then try again.",
    clone_identity_changed: "The prepared checkout changed. It has been preserved and handoff is blocked.",
    handoff_in_progress: "The repository handoff is still in progress.",
    handoff_unknown: "The handoff outcome is not confirmed. Check its status before trying again.",
    host_handoff_unsupported: "This Copilot App host does not provide the verified repository handoff capability.",
    activity_unknown: "The host's activity state could not be verified. Repository preparation is blocked.",
    canvas_unavailable: "The original Spec Kit canvas is unavailable in the target session.",
    upstream_unavailable: "The repository service is temporarily unavailable.",
} as const;

export type RepositoryErrorCode = keyof typeof messages;

export function repositoryErrorStatus(code: RepositoryErrorCode): number {
    if (code === "invalid_request") return 400;
    if (code === "resource_unavailable") return 404;
    if (["connection_required", "interaction_required"].includes(code)) return 401;
    if (["wrong_tenant", "insufficient_scope", "policy_blocked"].includes(code)) return 403;
    if (["host_handoff_unsupported", "activity_unknown", "canvas_unavailable"].includes(code)) return 412;
    if (code === "rate_limited") return 429;
    if (code === "upstream_unavailable") return 503;
    return 409;
}

export function knownRepositoryError(code: unknown): RepositoryError {
    return new RepositoryError(typeof code === "string" && Object.hasOwn(messages, code) ? code as RepositoryErrorCode : "upstream_unavailable");
}

export class RepositoryError extends Error {
    readonly code: RepositoryErrorCode;
    readonly retryAfterSeconds?: number;

    constructor(code: RepositoryErrorCode, retryAfterSeconds?: number) {
        super(messages[code]);
        this.name = "RepositoryError";
        this.code = code;
        if (Number.isSafeInteger(retryAfterSeconds) && retryAfterSeconds! > 0) this.retryAfterSeconds = Math.min(retryAfterSeconds!, 3600);
        this.stack = `${this.name}: ${this.message}`;
    }
}

export function errorEnvelope(error: unknown) {
    const failure = error instanceof RepositoryError ? error : new RepositoryError("upstream_unavailable");
    return { ok: false as const, error: {
        code: failure.code, message: failure.message, retryable: ["upstream_unavailable", "rate_limited"].includes(failure.code),
        ...(failure.retryAfterSeconds ? { retryAfterSeconds: failure.retryAfterSeconds } : {}),
    } };
}