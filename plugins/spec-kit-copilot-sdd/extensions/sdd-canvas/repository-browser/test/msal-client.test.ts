import assert from "node:assert/strict";
import { test } from "node:test";
import { createIdentityNetwork, nativeAuthDependencies } from "../src/msal-client.ts";

test("Identity transport only reaches the configured Microsoft authority and rejects redirects", async () => {
    const calls: { url: string; redirect?: RequestRedirect }[] = [];
    const transport = createIdentityNetwork(new AbortController().signal, async (url, options) => {
        calls.push({ url: String(url), redirect: options?.redirect });
        return new Response(JSON.stringify({ synthetic: true }), { status: 200, headers: { "content-type": "application/json" } });
    });
    for (const target of ["https://unexpected.invalid/token", "http://login.microsoftonline.com/token", "https://user@login.microsoftonline.com/token"]) {
        await assert.rejects(transport.sendGetRequestAsync(target), { code: "invalid_request" });
    }
    assert.equal(calls.length, 0);
    const response = await transport.sendGetRequestAsync<{ synthetic: boolean }>("https://login.microsoftonline.com/tenant/metadata");
    assert.equal(response.body.synthetic, true);
    assert.equal(calls[0]?.redirect, "error");
});

test("Identity responses and network errors remain bounded and sanitized", async () => {
    const controller = new AbortController();
    const large = createIdentityNetwork(controller.signal, async () => new Response("x".repeat(1_048_577)));
    await assert.rejects(large.sendGetRequestAsync("https://login.microsoftonline.com/metadata"), { code: "upstream_unavailable" });
    const failed = createIdentityNetwork(controller.signal, async () => { throw new Error("private-provider-error"); });
    await assert.rejects(failed.sendGetRequestAsync("https://login.microsoftonline.com/metadata"), (error: unknown) => {
        assert(!String(error).includes("private-provider-error"));
        return true;
    });
    controller.abort();
    await assert.rejects(failed.sendGetRequestAsync("https://login.microsoftonline.com/metadata"), { code: "invalid_context" });
});

test("MSAL produces PKCE material without opening a browser or acquiring a credential", async () => {
    const material = await nativeAuthDependencies().generatePkce();
    assert.match(material.verifier, /^[A-Za-z0-9_-]{43,128}$/);
    assert.match(material.challenge, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(material.verifier, material.challenge);
});