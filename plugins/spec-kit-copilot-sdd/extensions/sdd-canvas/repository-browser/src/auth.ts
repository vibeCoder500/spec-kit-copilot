import { randomBytes } from "node:crypto";
import type { AccountInfo, AuthenticationResult, AuthorizationCodeRequest, AuthorizationUrlRequest, SilentFlowRequest } from "@azure/msal-node";
import { RepositoryError, errorEnvelope } from "./errors.ts";
import type { RepositoryErrorCode } from "./errors.ts";
import { startOAuthCallback } from "./oauth-callback.ts";
import { UUID } from "./profile.ts";
import type { RepositoryProfile } from "./profile.ts";

export const ADO_SCOPES = ["https://app.vssps.visualstudio.com/.default"];

export interface IdentityClient {
    getAuthCodeUrl(request: AuthorizationUrlRequest): Promise<string>;
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult>;
    acquireTokenSilent(request: SilentFlowRequest): Promise<AuthenticationResult>;
    clear(): Promise<void>;
}

export interface ConnectionSnapshot {
    state: "disconnected" | "connecting" | "connected" | "failed";
    generation: number;
    connectionId?: string;
    transactionId?: string;
    accountLabel?: string;
    projectLabel: string;
    error?: ReturnType<typeof errorEnvelope>["error"];
}

export interface AuthDependencies {
    createClient(profile: Readonly<RepositoryProfile>, signal: AbortSignal): IdentityClient;
    generatePkce(): Promise<{ challenge: string; verifier: string }>;
    openBrowser(url: string): Promise<void>;
    callback?: typeof startOAuthCallback;
    onChange?(snapshot: ConnectionSnapshot): void;
}

export function authenticationError(error: unknown): RepositoryError {
    if (error instanceof RepositoryError) return error;
    const code = error && typeof error === "object" ? (error as { errorCode?: unknown }).errorCode : undefined;
    let failure: RepositoryErrorCode = "interaction_required";
    if (["unauthorized_client", "access_denied", "blocked_by_conditional_access"].includes(String(code))) failure = "policy_blocked";
    return new RepositoryError(failure);
}

function validateResult(result: AuthenticationResult, profile: Readonly<RepositoryProfile>, expected?: AccountInfo, nonce?: string) {
    const account = result.account;
    const claims = result.idTokenClaims as { nonce?: unknown } | undefined;
    if (!account || account.tenantId.toLowerCase() !== profile.tenantId || result.tenantId.toLowerCase() !== profile.tenantId) {
        throw new RepositoryError("wrong_tenant");
    }
    if (!UUID.test(account.localAccountId) || !account.homeAccountId || !result.accessToken ||
        !result.expiresOn || result.expiresOn.getTime() <= Date.now() ||
        (nonce !== undefined && claims?.nonce !== nonce)) throw new RepositoryError("connection_required");
    if (expected && (account.homeAccountId !== expected.homeAccountId || account.localAccountId !== expected.localAccountId ||
        account.tenantId !== expected.tenantId)) throw new RepositoryError("invalid_context");
    return account;
}

export function createRepositoryConnection(profile: Readonly<RepositoryProfile>, dependencies: AuthDependencies) {
    let generation = 0;
    let disposed = false;
    let active: { client: IdentityClient; controller: AbortController; account: AccountInfo; connectionId: string } | undefined;
    let pending: { id: string; controller: AbortController; client: IdentityClient; completion: Promise<void> } | undefined;
    let snapshot: ConnectionSnapshot = { state: "disconnected", generation, projectLabel: `${profile.organization}/${profile.project}` };

    function publish(next: Omit<ConnectionSnapshot, "generation" | "projectLabel">) {
        snapshot = { ...next, generation, projectLabel: `${profile.organization}/${profile.project}` };
        try { dependencies.onChange?.({ ...snapshot }); } catch {}
    }

    function invalidate() {
        generation++;
        const previousPending = pending;
        const previousActive = active;
        pending = undefined;
        active = undefined;
        previousPending?.controller.abort();
        previousActive?.controller.abort();
        if (previousPending) void previousPending.client.clear().catch(() => undefined);
        if (previousActive) void previousActive.client.clear().catch(() => undefined);
    }

    function current(epoch: number, signal: AbortSignal) {
        if (disposed || epoch !== generation || signal.aborted) throw new RepositoryError("invalid_context");
    }

    async function perform(client: IdentityClient, controller: AbortController, epoch: number) {
        const state = randomBytes(32).toString("base64url");
        const nonce = randomBytes(32).toString("base64url");
        const timeout = setTimeout(() => controller.abort(), 120_000);
        timeout.unref();
        let callback: Awaited<ReturnType<typeof startOAuthCallback>> | undefined;
        try {
            const codes = await dependencies.generatePkce();
            current(epoch, controller.signal);
            callback = await (dependencies.callback ?? startOAuthCallback)({ state, signal: controller.signal });
            const authorizationUrl = await client.getAuthCodeUrl({ scopes: [...ADO_SCOPES], redirectUri: callback.redirectUri,
                codeChallenge: codes.challenge, codeChallengeMethod: "S256", responseMode: "query", state, nonce });
            current(epoch, controller.signal);
            const url = new URL(authorizationUrl);
            if (url.origin !== "https://login.microsoftonline.com" || url.pathname !== `/${profile.tenantId}/oauth2/v2.0/authorize` ||
                url.username || url.password || url.hash) throw new RepositoryError("invalid_request");
            await dependencies.openBrowser(url.href);
            const code = await callback.result;
            current(epoch, controller.signal);
            const result = await client.acquireTokenByCode({ code, scopes: [...ADO_SCOPES], redirectUri: callback.redirectUri,
                codeVerifier: codes.verifier, nonce });
            current(epoch, controller.signal);
            const account = validateResult(result, profile, undefined, nonce);
            const accountLabel = (account.username || account.name || "Microsoft account").replace(/[\p{Cc}\p{Cf}]/gu, "").slice(0, 256);
            const connectionId = randomBytes(24).toString("base64url");
            pending = undefined;
            active = { client, controller, account, connectionId };
            publish({ state: "connected", accountLabel, connectionId });
        } catch (error) {
            controller.abort();
            await client.clear().catch(() => undefined);
            const failure = authenticationError(error);
            if (!disposed && epoch === generation) {
                pending = undefined;
                publish({ state: "failed", error: errorEnvelope(failure).error });
            }
            throw failure;
        } finally {
            clearTimeout(timeout);
            callback?.close();
        }
    }

    return {
        snapshot: () => ({ ...snapshot }),
        connect() {
            if (disposed || !profile.enabled) throw new RepositoryError("connection_required");
            if (pending) return { transactionId: pending.id, completion: pending.completion };
            invalidate();
            const epoch = generation;
            const id = randomBytes(24).toString("base64url");
            const controller = new AbortController();
            const client = dependencies.createClient(profile, controller.signal);
            publish({ state: "connecting", transactionId: id });
            const completion = perform(client, controller, epoch);
            void completion.catch(() => undefined);
            pending = { id, client, controller, completion };
            return { transactionId: id, completion };
        },
        async access() {
            const bound = active;
            const epoch = generation;
            if (!bound || disposed) throw new RepositoryError("connection_required");
            try {
                const result = await bound.client.acquireTokenSilent({ account: bound.account, scopes: [...ADO_SCOPES] });
                current(epoch, bound.controller.signal);
                validateResult(result, profile, bound.account);
                return { accessToken: result.accessToken, tenantId: profile.tenantId, accountId: bound.account.localAccountId,
                    connectionId: bound.connectionId, generation: epoch, signal: bound.controller.signal, scopes: result.scopes,
                    assertCurrent: () => current(epoch, bound.controller.signal) };
            } catch (error) {
                const failure = authenticationError(error);
                if (!disposed && generation === epoch) {
                    invalidate();
                    publish({ state: "failed", error: errorEnvelope(failure).error });
                }
                throw failure;
            }
        },
        disconnect() { invalidate(); publish({ state: "disconnected" }); },
        dispose() { disposed = true; invalidate(); publish({ state: "disconnected" }); },
    };
}

export type RepositoryConnection = ReturnType<typeof createRepositoryConnection>;