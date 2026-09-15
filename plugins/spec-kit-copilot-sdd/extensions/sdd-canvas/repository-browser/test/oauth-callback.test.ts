import assert from "node:assert/strict";
import { request } from "node:http";
import { test } from "node:test";
import { errorEnvelope } from "../src/errors.ts";
import { CALLBACK_PATH, startOAuthCallback } from "../src/oauth-callback.ts";

const state = "synthetic-callback-state-not-a-credential-12345";

function callbackRequest(redirectUri: string, path: string, host?: string, method = "GET") {
    const url = new URL(redirectUri);
    return new Promise<{ status: number; body: string; headers: import("node:http").IncomingHttpHeaders }>((resolve, reject) => {
        const outgoing = request({ hostname: "127.0.0.1", port: url.port, path, method,
            headers: { Host: host ?? url.host } }, (response) => {
            const chunks: Buffer[] = [];
            response.on("data", (chunk: Buffer) => chunks.push(chunk));
            response.on("end", () => resolve({ status: response.statusCode!, body: Buffer.concat(chunks).toString(), headers: response.headers }));
            response.on("error", reject);
        });
        outgoing.on("error", reject);
        outgoing.end();
    });
}

test("OAuth accepts the exact state once and never reflects the code into its response", async () => {
    const callback = await startOAuthCallback({ state, timeoutMs: 2_000 });
    try {
        assert.match(callback.redirectUri, /^http:\/\/localhost:\d+\/speckit-canvas\/oauth\/callback$/);
        const response = await callbackRequest(callback.redirectUri, `${CALLBACK_PATH}?state=${state}&code=synthetic-code&client_info=synthetic-client-info&clientdata=synthetic-client-data`);
        assert.equal(response.status, 200);
        assert.equal(await callback.result, "synthetic-code");
        assert.equal(response.headers["cache-control"], "no-store");
        assert.equal(response.headers["referrer-policy"], "no-referrer");
        assert.match(response.body, /history.replaceState/);
        assert(!response.body.includes("synthetic-code"));
        assert(!response.body.includes("synthetic-client-info"));
        assert(!response.body.includes("synthetic-client-data"));
        await assert.rejects(callbackRequest(callback.redirectUri, `${CALLBACK_PATH}?state=${state}&code=replay`));
    } finally { callback.close(); }
});

test("OAuth rejects forged, duplicate, wrong-host, wrong-path, and ambiguous requests without consuming the transaction", async () => {
    const callback = await startOAuthCallback({ state, timeoutMs: 2_000 });
    try {
        const attempts: [string, string?, string?][] = [
            [`${CALLBACK_PATH}?state=wrong&code=synthetic-code`],
            [`${CALLBACK_PATH}?state=${state}&state=${state}&code=synthetic-code`],
            [`${CALLBACK_PATH}?state=${state}&code=synthetic-code&clientdata=first&clientdata=second`],
            [`${CALLBACK_PATH}?state=${state}&code=synthetic-code&error=denied`],
            [`${CALLBACK_PATH}?state=${state}&code=synthetic-code&extra=ignored`],
            [`${CALLBACK_PATH}?state=${state}&code=synthetic-code`, "attacker.invalid"],
            [`${CALLBACK_PATH}?state=${state}&code=synthetic-code`, undefined, "POST"],
            [`/other?state=${state}&code=synthetic-code`],
            [`${CALLBACK_PATH}?state=${state}&code=${"a".repeat(12_289)}`],
        ];
        for (const [path, host, method] of attempts) {
            const response = await callbackRequest(callback.redirectUri, path, host, method);
            assert.equal(response.status, 400);
            assert.equal(response.body, "Sign-in response not accepted.");
        }
        await callbackRequest(callback.redirectUri, `${CALLBACK_PATH}?state=${state}&code=valid`);
        assert.equal(await callback.result, "valid");
    } finally { callback.close(); }
});

test("OAuth provider errors are sanitized and close the transaction", async () => {
    const callback = await startOAuthCallback({ state, timeoutMs: 2_000 });
    try {
        const response = await callbackRequest(callback.redirectUri, `${CALLBACK_PATH}?state=${state}&error=access_denied&error_description=private-detail`);
        await assert.rejects(callback.result, { code: "interaction_required" });
        assert(!response.body.includes("private-detail"));
        assert(!response.body.includes("access_denied"));
    } finally { callback.close(); }
});

test("OAuth abort and timeout release the listener without provider material", async () => {
    const controller = new AbortController();
    const callback = await startOAuthCallback({ state, signal: controller.signal });
    controller.abort("private-abort-reason");
    await assert.rejects(callback.result, { code: "connection_required" });
    await assert.rejects(callbackRequest(callback.redirectUri, CALLBACK_PATH));
    callback.close();
    await assert.rejects(startOAuthCallback({ state, signal: controller.signal }), { code: "connection_required" });
    const expiring = await startOAuthCallback({ state, timeoutMs: 1 });
    await assert.rejects(expiring.result, { code: "connection_required" });
    expiring.close();
});

test("Error envelopes do not disclose raw upstream errors", () => {
    const payload = errorEnvelope(new Error("private-upstream-value"));
    assert.equal(payload.error.code, "upstream_unavailable");
    assert(!JSON.stringify(payload).includes("private-upstream-value"));
});