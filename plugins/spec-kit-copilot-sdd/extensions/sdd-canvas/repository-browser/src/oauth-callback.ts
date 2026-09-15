import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { RepositoryError } from "./errors.ts";

export const CALLBACK_PATH = "/speckit-canvas/oauth/callback";
const COMPLETION_PATH = "/speckit-canvas/oauth/complete";
const ALLOWED_PARAMETERS = new Set(["code", "state", "error", "error_description", "error_uri", "session_state", "client_info", "clientdata"]);

export interface OAuthCallback {
    redirectUri: string;
    result: Promise<string>;
    close(): void;
}

export async function startOAuthCallback({ state, signal, timeoutMs = 120_000 }: {
    state: string;
    signal?: AbortSignal;
    timeoutMs?: number;
}): Promise<OAuthCallback> {
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(state) || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
        throw new RepositoryError("invalid_request");
    }
    if (signal?.aborted) throw new RepositoryError("connection_required");
    let accept!: (code: string) => void;
    let reject!: (error: RepositoryError) => void;
    const result = new Promise<string>((resolve, fail) => { accept = resolve; reject = fail; });
    void result.catch(() => undefined);
    let settled = false;
    let closed = false;
    let host = "";
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;
    const expectedState = Buffer.from(state);
    const securityHeaders = {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        "Content-Type": "text/plain; charset=utf-8",
        "Connection": "close",
    };

    function respond(res: ServerResponse, status: number) {
        res.writeHead(status, securityHeaders);
        res.end("Sign-in response not accepted.");
    }

    function close() {
        if (closed) return;
        closed = true;
        if (timer) clearTimeout(timer);
        signal?.removeEventListener("abort", cancel);
        if (!settled) {
            settled = true;
            reject(new RepositoryError("connection_required"));
        }
        server.close();
        server.closeAllConnections();
    }

    function cancel() { close(); }

    const server = createServer({ maxHeaderSize: 20_480 }, (req, res) => {
        if (closed || settled || req.method !== "GET" || req.headers.host !== host || !req.url ||
            req.url.length > 16_384 || !req.url.startsWith(`${CALLBACK_PATH}?`)) {
            respond(res, 400);
            return;
        }
        const url = new URL(req.url, `http://${host}`);
        if (url.pathname !== CALLBACK_PATH || url.hash || url.origin !== `http://${host}`) {
            respond(res, 400);
            return;
        }
        for (const key of url.searchParams.keys()) {
            if (!ALLOWED_PARAMETERS.has(key) || url.searchParams.getAll(key).length !== 1) {
                respond(res, 400);
                return;
            }
        }
        const actualState = Buffer.from(url.searchParams.get("state") ?? "");
        if (actualState.length !== expectedState.length || !timingSafeEqual(actualState, expectedState)) {
            respond(res, 400);
            return;
        }
        const code = url.searchParams.get("code");
        const providerError = url.searchParams.get("error");
        if (Boolean(code) === Boolean(providerError) || (code && !/^[A-Za-z0-9._~-]{1,12288}$/.test(code))) {
            respond(res, 400);
            return;
        }
        settled = true;
        const nonce = randomBytes(24).toString("base64");
        res.writeHead(200, {
            ...securityHeaders,
            "Content-Type": "text/html; charset=utf-8",
            "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'`,
        });
        res.once("finish", close);
        res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Microsoft connection</title>` +
            `<script nonce="${nonce}">history.replaceState(null,"","${COMPLETION_PATH}")</script>` +
            "<p>Sign-in response received. Return to the canvas.</p></html>");
        if (code) accept(code);
        else reject(new RepositoryError("interaction_required"));
    });
    server.requestTimeout = 5_000;
    server.headersTimeout = 5_000;
    server.setTimeout(5_000, (socket) => socket.destroy());
    server.maxConnections = 8;
    server.on("clientError", (_error, socket) => socket.destroy());
    await new Promise<void>((resolve, fail) => {
        server.once("error", fail);
        server.listen(0, "127.0.0.1", () => { server.removeListener("error", fail); resolve(); });
    }).catch(() => { close(); throw new RepositoryError("upstream_unavailable"); });
    server.on("error", close);
    const address = server.address();
    if (!address || typeof address === "string") { close(); throw new RepositoryError("upstream_unavailable"); }
    host = `localhost:${address.port}`;
    signal?.addEventListener("abort", cancel, { once: true });
    timer = setTimeout(close, timeoutMs);
    timer.unref();
    if (signal?.aborted) close();
    return { redirectUri: `http://${host}${CALLBACK_PATH}`, result, close };
}