import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { delimiter, dirname, join } from "node:path";
import { promisify } from "node:util";
import { CryptoProvider, LogLevel, PublicClientApplication } from "@azure/msal-node";
import type { AccountInfo, AuthenticationResult, Configuration } from "@azure/msal-node";
import open from "open";
import type { AuthDependencies, IdentityClient } from "./auth.ts";
import { RepositoryError } from "./errors.ts";
import type { RepositoryProfile } from "./profile.ts";

const execFileAsync = promisify(execFile);

const WINDOWS_WAM_BROKER_SCRIPT = [
    "import ctypes, json, sys",
    "import msal, pymsalruntime",
    "if sys.platform != 'win32':",
    "    print('broker_required', file=sys.stderr)",
    "    raise SystemExit(1)",
    "parts = [int(p) for p in msal.__version__.split('.')[:2] if p.isdigit()]",
    "if tuple(parts) < (1, 35):",
    "    print('broker_required', file=sys.stderr)",
    "    raise SystemExit(1)",
    "tenant_id, client_id, mode, *scopes = sys.argv[1:]",
    "app = msal.PublicClientApplication(client_id, authority=f'https://login.microsoftonline.com/{tenant_id}', enable_broker_on_windows=True)",
    "hwnd = int(ctypes.windll.user32.GetForegroundWindow() or ctypes.windll.user32.GetDesktopWindow() or 0)",
    "res = app.acquire_token_interactive(scopes=scopes, parent_window_handle=hwnd, prompt='none')",
    "if mode != 'silent' and not (isinstance(res, dict) and res.get('access_token')):",
    "    res = app.acquire_token_interactive(scopes=scopes, parent_window_handle=hwnd)",
    "if not isinstance(res, dict) or not res.get('access_token'):",
    "    err = res.get('error', 'interaction_required') if isinstance(res, dict) else 'interaction_required'",
    "    print(str(err), file=sys.stderr)",
    "    raise SystemExit(1)",
    "if res.get('token_source') != 'broker':",
    "    print('broker_required', file=sys.stderr)",
    "    raise SystemExit(1)",
    "claims = res.get('id_token_claims') or {}",
    "accounts = app.get_accounts()",
    "acct = accounts[0] if accounts else {}",
    "tenant = str(claims.get('tid') or acct.get('realm') or '')",
    "local_id = str(claims.get('oid') or acct.get('local_account_id') or '')",
    "home_id = str(acct.get('home_account_id') or (f'{local_id}.{tenant}' if local_id and tenant else ''))",
    "username = str(acct.get('username') or claims.get('preferred_username') or claims.get('upn') or '')",
    "name = str(claims.get('name') or username or 'Microsoft account')",
    "scopes_out = str(res.get('scope') or '').split() or list(scopes)",
    "print(json.dumps({",
    "    'accessToken': str(res['access_token']),",
    "    'expiresIn': int(res.get('expires_in') or 3600),",
    "    'tenantId': tenant,",
    "    'localAccountId': local_id,",
    "    'homeAccountId': home_id,",
    "    'username': username,",
    "    'name': name,",
    "    'environment': str(acct.get('environment') or 'login.microsoftonline.com'),",
    "    'scopes': scopes_out,",
    "    'tokenSource': str(res.get('token_source')),",
    "}))",
].join("\n");

export type WindowsBrokerRunner = (args: {
    tenantId: string;
    clientId: string;
    scopes: readonly string[];
    mode: "interactive" | "silent";
    signal: AbortSignal;
}) => Promise<string>;

async function resolveWindowsBrokerPython(): Promise<string> {
    const candidates = new Set<string>();
    for (const root of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], "C:\\Program Files", "C:\\Program Files (x86)"]) {
        if (root) candidates.add(join(root, "Microsoft SDKs", "Azure", "CLI2", "python.exe"));
    }
    for (const entry of (process.env.PATH ?? "").split(delimiter)) {
        const trimmed = entry.trim();
        if (!trimmed) continue;
        candidates.add(join(dirname(trimmed), "python.exe"));
    }
    for (const candidate of candidates) {
        try {
            await access(candidate);
            return candidate;
        } catch {
            continue;
        }
    }
    throw new RepositoryError("upstream_unavailable");
}

const defaultWindowsBrokerRunner: WindowsBrokerRunner = async ({ tenantId, clientId, scopes, mode, signal }) => {
    if (signal.aborted) throw new RepositoryError("invalid_context");
    const pythonPath = await resolveWindowsBrokerPython();
    try {
        const { stdout } = await execFileAsync(
            pythonPath,
            ["-I", "-c", WINDOWS_WAM_BROKER_SCRIPT, tenantId, clientId, mode, ...scopes],
            { windowsHide: true, maxBuffer: 262_144, timeout: 90_000, signal },
        );
        return stdout;
    } catch (error) {
        if (signal.aborted) throw new RepositoryError("invalid_context");
        const stderr = error && typeof error === "object" && "stderr" in error ? String((error as { stderr?: unknown }).stderr ?? "") : "";
        if (/unauthorized_client|access_denied|blocked_by_conditional_access|broker_required/i.test(stderr)) {
            throw new RepositoryError("policy_blocked");
        }
        throw new RepositoryError("interaction_required");
    }
};

export async function acquireWindowsBrokerToken({
    profile,
    scopes,
    mode = "interactive",
    signal,
    runner = defaultWindowsBrokerRunner,
}: {
    profile: Readonly<RepositoryProfile>;
    scopes: readonly string[];
    mode?: "interactive" | "silent";
    signal: AbortSignal;
    runner?: WindowsBrokerRunner;
}): Promise<AuthenticationResult> {
    if (signal.aborted) throw new RepositoryError("invalid_context");
    const raw = await runner({ tenantId: profile.tenantId, clientId: profile.clientId, scopes, mode, signal });
    if (signal.aborted) throw new RepositoryError("invalid_context");
    let parsed: Record<string, unknown>;
    try {
        const json: unknown = JSON.parse(raw);
        if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error();
        parsed = json as Record<string, unknown>;
    } catch {
        throw new RepositoryError("interaction_required");
    }
    if (parsed.tokenSource !== "broker") throw new RepositoryError("policy_blocked");
    const tenantId = typeof parsed.tenantId === "string" ? parsed.tenantId : "";
    const localAccountId = typeof parsed.localAccountId === "string" ? parsed.localAccountId : "";
    const homeAccountId = typeof parsed.homeAccountId === "string" ? parsed.homeAccountId : "";
    const username = typeof parsed.username === "string" ? parsed.username : "";
    const name = typeof parsed.name === "string" ? parsed.name : username;
    const environment = typeof parsed.environment === "string" && parsed.environment ? parsed.environment : "login.microsoftonline.com";
    const accessToken = typeof parsed.accessToken === "string" ? parsed.accessToken : "";
    const expiresIn = typeof parsed.expiresIn === "number" && Number.isFinite(parsed.expiresIn) && parsed.expiresIn > 0 ? parsed.expiresIn : 3600;
    const grantedScopes = Array.isArray(parsed.scopes) && parsed.scopes.every((item) => typeof item === "string")
        ? (parsed.scopes as string[])
        : [...scopes];
    const account: AccountInfo = {
        homeAccountId,
        environment,
        tenantId,
        username,
        localAccountId,
        name,
    };
    return {
        authority: `https://login.microsoftonline.com/${profile.tenantId}`,
        uniqueId: localAccountId,
        tenantId,
        scopes: grantedScopes,
        account,
        idToken: "",
        idTokenClaims: {},
        accessToken,
        fromCache: false,
        expiresOn: new Date(Date.now() + expiresIn * 1000),
        tokenType: "Bearer",
        correlationId: "",
    } as AuthenticationResult;
}

export function createIdentityNetwork(signal: AbortSignal, request = fetch): NonNullable<NonNullable<Configuration["system"]>["networkClient"]> {
    async function send<ResponseBody>(target: string, method: "GET" | "POST", options?: { headers?: Record<string, string>; body?: string }) {
        const url = new URL(target);
        if (url.origin !== "https://login.microsoftonline.com" || url.username || url.password || url.hash) {
            throw new RepositoryError("invalid_request");
        }
        if (signal.aborted) throw new RepositoryError("invalid_context");
        try {
            const response = await request(url, { method, headers: options?.headers, body: method === "POST" ? options?.body : undefined,
                redirect: "error", signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) });
            if (Number(response.headers.get("content-length")) > 1_048_576 || !response.body) throw new RepositoryError("upstream_unavailable");
            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let size = 0;
            try {
                while (true) {
                    const part = await reader.read();
                    if (part.done) break;
                    size += part.value.length;
                    if (size > 1_048_576) { await reader.cancel(); throw new RepositoryError("upstream_unavailable"); }
                    chunks.push(part.value);
                }
            } finally { reader.releaseLock(); }
            if (signal.aborted) throw new RepositoryError("invalid_context");
            return { status: response.status, headers: Object.fromEntries(response.headers.entries()),
                body: JSON.parse(Buffer.concat(chunks).toString("utf8")) as ResponseBody };
        } catch (error) {
            if (error instanceof RepositoryError) throw error;
            throw new RepositoryError(signal.aborted ? "invalid_context" : "upstream_unavailable");
        }
    }
    return {
        sendGetRequestAsync: (url, options) => send(url, "GET", options),
        sendPostRequestAsync: (url, options) => send(url, "POST", options),
    };
}

export function createMsalClient(
    profile: Readonly<RepositoryProfile>,
    signal: AbortSignal,
    options?: { platform?: NodeJS.Platform; brokerRunner?: WindowsBrokerRunner },
): IdentityClient {
    const platform = options?.platform ?? process.platform;
    if (platform === "win32") {
        let cachedResult: AuthenticationResult | undefined;
        return {
            async acquireTokenBroker({ scopes, signal: requestSignal }) {
                const combinedSignal = AbortSignal.any([signal, requestSignal]);
                const result = await acquireWindowsBrokerToken({
                    profile,
                    scopes,
                    mode: "interactive",
                    signal: combinedSignal,
                    runner: options?.brokerRunner,
                });
                cachedResult = result;
                return result;
            },
            async getAuthCodeUrl() {
                throw new RepositoryError("policy_blocked");
            },
            async acquireTokenByCode() {
                throw new RepositoryError("policy_blocked");
            },
            async acquireTokenSilent(request) {
                if (signal.aborted) throw new RepositoryError("invalid_context");
                if (
                    cachedResult?.account &&
                    cachedResult.expiresOn &&
                    cachedResult.expiresOn.getTime() - Date.now() > 60_000 &&
                    cachedResult.account.homeAccountId === request.account.homeAccountId &&
                    cachedResult.account.localAccountId === request.account.localAccountId
                ) {
                    return cachedResult;
                }
                const refreshed = await acquireWindowsBrokerToken({
                    profile,
                    scopes: request.scopes,
                    mode: "silent",
                    signal,
                    runner: options?.brokerRunner,
                });
                cachedResult = refreshed;
                return refreshed;
            },
            async clear() {
                cachedResult = undefined;
            },
        };
    }
    const client = new PublicClientApplication({
        auth: { clientId: profile.clientId, authority: `https://login.microsoftonline.com/${profile.tenantId}` },
        system: { networkClient: createIdentityNetwork(signal), disableInternalRetries: true,
            loggerOptions: { piiLoggingEnabled: false, logLevel: LogLevel.Error, loggerCallback: () => undefined } },
    });
    return {
        getAuthCodeUrl: (request) => client.getAuthCodeUrl(request),
        acquireTokenByCode: (request) => client.acquireTokenByCode(request),
        acquireTokenSilent: (request) => client.acquireTokenSilent(request),
        async clear() {
            const cache = client.getTokenCache();
            for (const account of await cache.getAllAccounts()) await cache.removeAccount(account);
        },
    };
}

export function nativeAuthDependencies(onChange?: AuthDependencies["onChange"]): AuthDependencies {
    return {
        createClient: createMsalClient,
        generatePkce: () => new CryptoProvider().generatePkceCodes(),
        openBrowser: async (url) => { await open(url); },
        onChange,
    };
}