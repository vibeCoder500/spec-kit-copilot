import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import type { AuthenticationResult } from "@azure/msal-node";
import { createRepositoryService, handleRepositoryRequest } from "../src/repository-service.ts";
import { parseRepositoryProfile } from "../src/profile.ts";

const profile = parseRepositoryProfile({ schemaVersion: 1, enabled: true, tenantId: "11111111-1111-4111-8111-111111111111",
    clientId: "22222222-2222-4222-8222-222222222222", organization: "Synthetic", project: "Project" });
const repositoryId = "33333333-3333-4333-8333-333333333333";

test("Unconfigured service stays offline and preserves legacy local workflow requests", async () => {
    let calls = 0;
    const service = await createRepositoryService({ workspacePath: "/synthetic", profileStatus: { state: "unconfigured" },
        request: async () => { calls++; throw new Error("Unexpected network"); } });
    assert.equal(service.snapshot().configuration, "unconfigured");
    service.assertLocal();
    await service.verifyLocal();
    assert.throws(() => service.assertLocal("another-context"), { code: "local_context_mismatch" });
    assert.throws(() => service.connect(), { code: "connection_required" });
    assert.equal(calls, 0);
    service.dispose();
});

test("Remote selection blocks workflows until explicit local selection and context match", async () => {
    const result = (nonce?: string) => ({ accessToken: "synthetic-token", tenantId: profile.tenantId, scopes: ["vso.code"], expiresOn: new Date(Date.now() + 600_000), idTokenClaims: { nonce },
        account: { tenantId: profile.tenantId, localAccountId: repositoryId, homeAccountId: "synthetic-account", username: "synthetic@example.invalid" } }) as AuthenticationResult;
    const service = await createRepositoryService({ workspacePath: "/synthetic", profileStatus: { state: "configured", profile }, dependencies: {
        createClient: () => ({ getAuthCodeUrl: async () => `https://login.microsoftonline.com/${profile.tenantId}/oauth2/v2.0/authorize`,
            acquireTokenByCode: async (request) => result(request.nonce), acquireTokenSilent: async () => result(), clear: async () => undefined }),
        generatePkce: async () => ({ verifier: "synthetic", challenge: "synthetic" }), openBrowser: async () => undefined,
        callback: async () => ({ redirectUri: "http://localhost:32100/speckit-canvas/oauth/callback", result: Promise.resolve("synthetic-code"), close() {} }),
    }, request: async (input) => {
        const url = new URL(String(input));
        const value = url.pathname.endsWith("/refs") ? { value: [{ name: "refs/heads/main", objectId: "a".repeat(40) }] } :
            url.pathname.endsWith("/items") ? { path: "/.specify", isFolder: true } :
                { id: repositoryId, name: "Synthetic", defaultBranch: "refs/heads/main", project: { name: profile.project } };
        return new Response(JSON.stringify(value));
    } });
    const local = service.snapshot().localContext.contextId;
    assert.throws(() => service.assertLocal(), { code: "local_context_mismatch" });
    service.assertLocal(local);
    await service.connect().completion;
    const context = await service.context(repositoryId);
    assert.equal(service.snapshot().selectedContextId, context.contextId);
    assert.throws(() => service.assertLocal(local), { code: "remote_read_only" });
    await assert.rejects(service.verifyLocal(local), { code: "remote_read_only" });
    service.selectLocal();
    service.assertLocal(local);
    const late = service.context(repositoryId);
    service.selectLocal();
    await assert.rejects(late, { code: "invalid_context" });
    assert.equal(service.snapshot().mode, "local");
    service.disconnect();
    assert.equal(service.snapshot().connection.state, "disconnected");
    assert.equal(service.snapshot().selectedContextId, null);
    service.dispose();
});

test("Repository routes enforce methods, origin, duplicate parameters, body shape, and safe errors", async () => {
    const service = await createRepositoryService({ workspacePath: "/synthetic", profileStatus: { state: "unconfigured" } });
    let origin = "";
    const server = createServer((req, res) => { void handleRepositoryRequest(req, res, new URL(req.url!, origin), service); });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    try {
        const endpoint = (path: string) => `${origin}/api/repositories/${path}`;
        assert.equal((await fetch(endpoint("connection"))).status, 200);
        assert.equal((await fetch(endpoint("connection?cap=first&cap=second"))).status, 400);
        assert.equal((await fetch(endpoint("connection?unknown=field"))).status, 400);
        assert.equal((await fetch(endpoint("connect"), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 400);
        for (const body of ["[]", '{"unexpected":true}', "invalid", `{"value":"${"x".repeat(32_769)}"}`]) {
            assert.equal((await fetch(endpoint("connect"), { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body })).status, 400);
        }
        const response = await fetch(endpoint("connect"), { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: "{}" });
        assert.equal(response.status, 401);
        assert.equal((await response.json()).error.code, "connection_required");
    } finally { service.dispose(); await new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections(); }); }
});