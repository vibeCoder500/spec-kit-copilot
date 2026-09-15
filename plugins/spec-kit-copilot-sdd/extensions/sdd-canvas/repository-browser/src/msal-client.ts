import { CryptoProvider, LogLevel, PublicClientApplication } from "@azure/msal-node";
import type { Configuration } from "@azure/msal-node";
import open from "open";
import type { AuthDependencies, IdentityClient } from "./auth.ts";
import { RepositoryError } from "./errors.ts";
import type { RepositoryProfile } from "./profile.ts";

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

export function createMsalClient(profile: Readonly<RepositoryProfile>, signal: AbortSignal): IdentityClient {
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