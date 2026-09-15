import assert from "node:assert/strict";
import { test } from "node:test";
import type { RepositoryConnection } from "../src/auth.ts";
import { createAdoClient, readRepositoryProof } from "../src/ado-client.ts";
import { parseRepositoryProfile } from "../src/profile.ts";

const profile = parseRepositoryProfile({ schemaVersion: 1, enabled: true,
    tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222",
    organization: "SyntheticOrg", project: "SyntheticProject" });
const repositoryId = "33333333-3333-4333-8333-333333333333";
const sourceVersion = "a".repeat(40);

function accessConnection() {
    const controller = new AbortController();
    return { access: async () => ({ accessToken: "synthetic-token", generation: 1, signal: controller.signal,
        assertCurrent() { if (controller.signal.aborted) throw new Error("stale"); } }) } as unknown as RepositoryConnection;
}

test("Native proof uses delegated requests and pins the allowed artifact to the resolved commit", async () => {
    const requests: URL[] = [];
    const responses = [
        { id: repositoryId, name: "SyntheticRepo", defaultBranch: "refs/heads/main", project: { name: profile.project } },
        { value: [{ name: "refs/heads/main", objectId: sourceVersion }] },
        { path: "/.specify/memory/constitution.md", objectId: "b".repeat(40), contentMetadata: { isBinary: false }, content: "# Synthetic\n" },
    ];
    const proof = await readRepositoryProof({ profile, connection: accessConnection(), repositoryName: "SyntheticRepo", request: async (target, options) => {
        requests.push(new URL(String(target)));
        assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer synthetic-token");
        assert.equal(options?.redirect, "error");
        return new Response(JSON.stringify(responses.shift()));
    } });
    assert.equal(requests.length, 3);
    assert(requests.every((url) => url.origin === "https://dev.azure.com"));
    assert.equal(requests[2]?.searchParams.get("versionDescriptor.version"), sourceVersion);
    assert.equal(proof.content, "# Synthetic\n");
    assert.match(proof.revision, /^sha256:[a-f0-9]{64}$/);
});

test("Proof never falls back to another identity or a project-wide list after denial", async () => {
    let calls = 0;
    await assert.rejects(readRepositoryProof({ profile, connection: accessConnection(), repositoryName: "SyntheticRepo", request: async () => {
        calls++; return new Response("private-response", { status: 403 });
    } }), { code: "resource_unavailable" });
    assert.equal(calls, 1);
});

test("Production requests share a two-retry budget and honor bounded Retry-After", async () => {
    let calls = 0;
    const pauses: number[] = [];
    const client = createAdoClient({ profile, connection: accessConnection(), pause: async (milliseconds) => { pauses.push(milliseconds); },
        request: async (_target, options) => { calls++; assert.equal(options?.redirect, "error");
            return new Response("{}", { status: 429, headers: { "Retry-After": "1" } }); } });
    const operation = await client.open();
    await assert.rejects(operation.json([profile.project, "_apis", "git", "repositories"]), { code: "rate_limited" });
    assert.equal(calls, 3);
    assert.deepEqual(pauses, [1000, 1000]);
    await assert.rejects(operation.json([profile.project, "_apis", "git", "repositories"]), { code: "rate_limited" });
    assert.equal(calls, 4);
    await assert.rejects(operation.json(["..", "repositories"]), { code: "invalid_request" });
    assert.equal(calls, 4);
});

test("Production listing excludes disabled repositories and validates the configured project", async () => {
    const values = [
        { id: repositoryId, name: "Visible", project: { name: profile.project }, defaultBranch: "refs/heads/main" },
        { id: "44444444-4444-4444-8444-444444444444", name: "Disabled", project: { name: profile.project }, isDisabled: true },
    ];
    const client = createAdoClient({ profile, connection: accessConnection(), request: async () => new Response(JSON.stringify({ value: values })) });
    const repositories = await client.list(await client.open());
    assert.equal(repositories.length, 1);
    assert.equal(repositories[0]?.name, "Visible");
    values[0]!.project.name = "AnotherProject";
    await assert.rejects(client.list(await client.open()), { code: "resource_unavailable" });
});