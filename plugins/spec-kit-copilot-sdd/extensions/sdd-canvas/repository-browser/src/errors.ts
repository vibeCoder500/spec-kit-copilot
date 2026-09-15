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
    upstream_unavailable: "The repository service is temporarily unavailable.",
} as const;

export type RepositoryErrorCode = keyof typeof messages;

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