import assert from "node:assert/strict";
import { test } from "node:test";
import { acquireWindowsBrokerToken, createIdentityNetwork, createMsalClient, nativeAuthDependencies } from "../src/msal-client.ts";
import { parseRepositoryProfile } from "../src/profile.ts";

const profile = parseRepositoryProfile({
    schemaVersion: 1,
    enabled: true,
    tenantId: "11111111-1111-4111-8111-111111111111",
    clientId: "22222222-2222-4222-8222-222222222222",
    organization: "SyntheticOrg",
    project: "SyntheticProject",
});

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

test("Windows WAM broker enforces broker tokenSource, caches valid tokens, and blocks loopback fallback", async () => {
    const controller = new AbortController();
    let runnerCalls = 0;
    const brokerPayload = (tokenSource = "broker") => JSON.stringify({
        accessToken: "synthetic-broker-access-token",
        expiresIn: 3600,
        tenantId: profile.tenantId,
        localAccountId: "33333333-3333-4333-8333-333333333333",
        homeAccountId: `33333333-3333-4333-8333-333333333333.${profile.tenantId}`,
        username: "synthetic@example.invalid",
        name: "Synthetic User",
        environment: "login.microsoftonline.com",
        scopes: ["vso.code", "vso.project", "vso.work"],
        tokenSource,
    });
    await assert.rejects(
        acquireWindowsBrokerToken({
            profile,
            scopes: ["https://app.vssps.visualstudio.com/.default"],
            signal: controller.signal,
            runner: async () => brokerPayload("identity_provider"),
        }),
        { code: "policy_blocked" },
    );
    const client = createMsalClient(profile, controller.signal, {
        platform: "win32",
        brokerRunner: async () => {
            runnerCalls++;
            return brokerPayload("broker");
        },
    });
    assert.equal(typeof client.acquireTokenBroker, "function");
    await assert.rejects(
        client.getAuthCodeUrl({ scopes: ["https://app.vssps.visualstudio.com/.default"], redirectUri: "http://localhost/speckit-canvas/oauth/callback" }),
        { code: "policy_blocked" },
    );
    const interactive = await client.acquireTokenBroker!({
        scopes: ["https://app.vssps.visualstudio.com/.default"],
        signal: controller.signal,
    });
    assert.equal(runnerCalls, 1);
    assert.equal(interactive.accessToken, "synthetic-broker-access-token");
    const silent = await client.acquireTokenSilent({
        account: interactive.account!,
        scopes: ["https://app.vssps.visualstudio.com/.default"],
    });
    assert.equal(runnerCalls, 1);
    assert.equal(silent.accessToken, "synthetic-broker-access-token");
    await client.clear();
    await client.acquireTokenSilent({
        account: interactive.account!,
        scopes: ["https://app.vssps.visualstudio.com/.default"],
    });
    assert.equal(runnerCalls, 2);
});