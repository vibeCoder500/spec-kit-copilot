import assert from "node:assert/strict";
import { test } from "node:test";
import type { AuthenticationResult, AuthorizationCodeRequest, AuthorizationUrlRequest } from "@azure/msal-node";
import { createRepositoryConnection } from "../src/auth.ts";
import type { IdentityClient } from "../src/auth.ts";
import { parseRepositoryProfile } from "../src/profile.ts";

const profile = parseRepositoryProfile({ schemaVersion: 1, enabled: true,
    tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222",
    organization: "SyntheticOrg", project: "SyntheticProject" });

function fixture({ tenantId = profile.tenantId, deferred = false, silentFailure = false } = {}) {
    let released!: () => void;
    const exchange = new Promise<void>((resolve) => { released = resolve; });
    const requests: AuthorizationUrlRequest[] = [];
    const snapshots: unknown[] = [];
    let clearCount = 0;
    let browserCount = 0;
    const result = (nonce?: string) => ({ accessToken: "synthetic-access-token", scopes: ["vso.code"], tenantId,
        expiresOn: new Date(Date.now() + 600_000), idTokenClaims: { nonce },
        account: { tenantId, localAccountId: "33333333-3333-4333-8333-333333333333", homeAccountId: "synthetic-home-account",
            username: "synthetic@example.invalid", environment: "login.microsoftonline.com" },
    }) as AuthenticationResult;
    const client: IdentityClient = {
        async getAuthCodeUrl(request) { requests.push(request); return `https://login.microsoftonline.com/${profile.tenantId}/oauth2/v2.0/authorize`; },
        async acquireTokenByCode(request: AuthorizationCodeRequest) { if (deferred) await exchange; return result(request.nonce); },
        async acquireTokenSilent() { if (silentFailure) throw new Error("private-provider-detail"); return result(); },
        async clear() { clearCount++; },
    };
    const connection = createRepositoryConnection(profile, {
        createClient: () => client,
        generatePkce: async () => ({ verifier: "synthetic-pkce-verifier", challenge: "synthetic-pkce-challenge" }),
        callback: async () => ({ redirectUri: "http://localhost:32101/speckit-canvas/oauth/callback", result: Promise.resolve("synthetic-code"), close() {} }),
        openBrowser: async () => { browserCount++; },
        onChange: (snapshot) => snapshots.push(snapshot),
    });
    return { connection, requests, snapshots, release: () => released(), cleared: () => clearCount, browsers: () => browserCount };
}

test("Connection requires user action, uses PKCE and nonce, and exposes no token in status", async () => {
    const proof = fixture();
    assert.equal(proof.browsers(), 0);
    await assert.rejects(proof.connection.access(), { code: "connection_required" });
    const first = proof.connection.connect();
    const repeated = proof.connection.connect();
    assert.equal(first.transactionId, repeated.transactionId);
    await first.completion;
    assert.equal(proof.browsers(), 1);
    assert.equal(proof.requests[0]?.codeChallengeMethod, "S256");
    assert(proof.requests[0]?.nonce);
    assert(proof.requests[0]?.state);
    assert.equal(proof.connection.snapshot().state, "connected");
    const access = await proof.connection.access();
    assert.equal(access.accessToken, "synthetic-access-token");
    assert(!JSON.stringify(proof.snapshots).includes("synthetic-access-token"));
    proof.connection.disconnect();
    assert.throws(access.assertCurrent, { code: "invalid_context" });
    assert.equal(proof.connection.snapshot().state, "disconnected");
});

test("Wrong-tenant sign-in is rejected without persisting an account", async () => {
    const proof = fixture({ tenantId: "44444444-4444-4444-8444-444444444444" });
    await assert.rejects(proof.connection.connect().completion, { code: "wrong_tenant" });
    assert.equal(proof.connection.snapshot().error?.code, "wrong_tenant");
    assert.equal(proof.connection.snapshot().accountLabel, undefined);
    assert(proof.cleared() > 0);
    proof.connection.dispose();
});

test("A late token response cannot reconnect a disconnected canvas", async () => {
    const proof = fixture({ deferred: true });
    const started = proof.connection.connect();
    await new Promise<void>((resolve) => setImmediate(resolve));
    proof.connection.disconnect();
    proof.release();
    await assert.rejects(started.completion, { code: "invalid_context" });
    assert.equal(proof.connection.snapshot().state, "disconnected");
    assert.equal(proof.connection.snapshot().accountLabel, undefined);
});

test("Silent acquisition failure invalidates the connection and sanitizes provider details", async () => {
    const proof = fixture({ silentFailure: true });
    await proof.connection.connect().completion;
    const epoch = proof.connection.snapshot().generation;
    await assert.rejects(proof.connection.access(), { code: "interaction_required" });
    assert(proof.connection.snapshot().generation > epoch);
    assert.equal(proof.connection.snapshot().state, "failed");
    assert(!JSON.stringify(proof.snapshots).includes("private-provider-detail"));
    proof.connection.dispose();
    assert.throws(() => proof.connection.connect(), { code: "connection_required" });
});