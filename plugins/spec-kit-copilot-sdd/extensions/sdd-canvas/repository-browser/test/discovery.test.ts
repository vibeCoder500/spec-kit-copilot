import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdoClient, AdoOperation } from "../src/ado-client.ts";
import { areaMatches, boundedMap, createRepositoryDiscovery, manifestArea, matchesSearch, normalizeSearch } from "../src/discovery.ts";
import { RepositoryError } from "../src/errors.ts";
import { parseRepositoryProfile } from "../src/profile.ts";

const profile = parseRepositoryProfile({ schemaVersion: 1, enabled: true,
    tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222",
    organization: "SyntheticOrg", project: "SyntheticProject" });
const repositoryId = "33333333-3333-4333-8333-333333333333";
const manifest = (path = "SyntheticProject\\Owned") => Buffer.from(`schemaVersion: 1.0.0\nproviders:\n- provider: InventoryAsCode\n  metadata:\n    routing:\n      defaultAreaPath:\n        org: SyntheticOrg\n        path: '${path}'\n`);

function fixture({ noAreas = false, denied = false, areaCount = 1, rawCount = 1, scopes = ["vso.code", "vso.project", "vso.work"] } = {}) {
    let account = "account-one";
    let generation = 1;
    let listCalls = 0;
    let searchCalls = 0;
    const operation = { access: { tenantId: profile.tenantId, accountId: account, connectionId: "connection", generation,
        scopes, assertCurrent() {} }, signal: new AbortController().signal,
        async json(segments: string[], _query: unknown, options?: { body?: unknown }) {
            if (segments.at(-1) === "teams") return { value: [{ id: "44444444-4444-4444-8444-444444444444", projectId: "55555555-5555-4555-8555-555555555555" }] };
            if (segments.at(-1) === "teamfieldvalues") return { field: { referenceName: "System.AreaPath" }, values: noAreas ? [] : Array.from({ length: areaCount }, (_, index) => ({ value: index === 0 ? "SyntheticProject\\Owned" : `SyntheticProject\\Area${index}`, includeChildren: true })) };
            assert.equal(segments.at(-1), "codesearchresults");
            searchCalls++;
            assert.deepEqual(_query, { "api-version": "7.1-preview.1" });
            assert.deepEqual((options?.body as { filters: unknown }).filters, { Project: [profile.project] });
            assert.match((options?.body as { searchText: string }).searchText, /^\(.+\) path:"\/es-metadata\.yml"$/);
            return { infoCode: 0, count: rawCount, results: Array.from({ length: rawCount }, (_, index) => ({ path: index === 0 ? "/es-metadata.yml" : "/nested/es-metadata.yml", repository: { id: repositoryId }, project: { name: profile.project } })) };
        },
    } as unknown as AdoOperation;
    const repository = { id: repositoryId, name: "Synthetic Spec Repository", defaultBranch: "refs/heads/main", operationalState: "active" as const };
    const client = {
        async open() { return { ...operation, access: { ...operation.access, accountId: account, generation } }; },
        async list() { listCalls++; return Array.from({ length: 101 }, (_, index) => ({ ...repository, id: `repository-${index.toString().padStart(3, "0")}`, name: `Spec ${index}` })); },
        async repository() { if (denied) throw new RepositoryError("resource_unavailable"); return repository; },
        async commit() { return "a".repeat(40); },
        async item() { return { path: "/es-metadata.yml", objectId: "b".repeat(40) }; },
        async blob() { return manifest(); },
    } as unknown as AdoClient;
    return { service: createRepositoryDiscovery({ client, profile }), lists: () => listCalls, searches: () => searchCalls,
        switchAccount() { account = "account-two"; generation++; } };
}

test("Search uses normalized AND-of-substring tokens and refuses an empty directory request", async () => {
    assert.equal(normalizeSearch("  ＳＰＥＣ \t Service "), "spec service");
    assert(matchesSearch("New-Service-Spec", "spec service"));
    assert(!matchesSearch("SpecOnly", "spec service"));
    assert.throws(() => normalizeSearch("x".repeat(257)), { code: "invalid_request" });
    const proof = fixture();
    await assert.rejects(proof.service.search(" "), { code: "invalid_request" });
    assert.equal(proof.lists(), 0);
    const first = await proof.service.search("spec");
    assert.equal(first.items.length, 100);
    assert(first.cursor);
    const second = await proof.service.search("spec", first.cursor);
    assert.equal(second.items.length, 1);
    assert.equal(second.hasMore, false);
    proof.switchAccount();
    await assert.rejects(proof.service.search("spec", first.cursor), { code: "invalid_context" });
});

test("Team-linked candidates require current repository access and current structured metadata", async () => {
    const allowed = fixture();
    const page = await allowed.service.relevant();
    assert.equal(page.items[0]?.id, repositoryId);
    assert.equal(allowed.lists(), 0);
    const denied = fixture({ denied: true });
    assert.equal((await denied.service.relevant()).outcome, "no_linked_repositories");
    assert.equal(denied.lists(), 0);
});

test("Empty or scope-denied personalization never loads the project directory", async () => {
    const empty = fixture({ noAreas: true });
    assert.equal((await empty.service.relevant()).outcome, "no_associations");
    assert.equal(empty.lists(), 0);
    const missing = fixture({ scopes: ["vso.code"] });
    await assert.rejects(missing.service.relevant(), { code: "insufficient_scope" });
    assert.equal(missing.lists(), 0);
    assert.equal((await missing.service.search("spec")).items.length, 100);
});

test("Discarded search hits still consume the per-request raw candidate budget", async () => {
    const proof = fixture({ areaCount: 21, rawCount: 100, denied: true });
    const page = await proof.service.relevant();
    assert.equal(proof.searches(), 1);
    assert.equal(page.outcome, "scanning");
    assert.equal(page.hasMore, true);
    assert(page.cursor);
    assert.equal(proof.lists(), 0);
});

test("Manifest parsing rejects aliases, duplicate keys, multiple documents, invalid routing, and area-prefix collisions", () => {
    assert.equal(manifestArea(manifest(), profile), "syntheticproject\\owned");
    assert.equal(manifestArea(manifest("SyntheticProject\\Owned\\Child"), profile), "syntheticproject\\owned\\child");
    for (const content of [Buffer.from("schemaVersion: 0.0.1\nrouting: &shared {}\nother: *shared\n"),
        Buffer.concat([manifest(), Buffer.from("---\n{}\n")]), Buffer.concat([manifest(), Buffer.from("schemaVersion: 0.0.1\n")]),
        manifest("OtherProject\\Owned"), Buffer.alloc(65_537)]) assert.equal(manifestArea(content, profile), null);
    assert(areaMatches({ path: "project\\area", includeChildren: true }, "project\\area\\child"));
    assert(!areaMatches({ path: "project\\area", includeChildren: true }, "project\\area-other"));
    assert(!areaMatches({ path: "project\\area", includeChildren: false }, "project\\area\\child"));
});

test("Status and candidate verification work never exceeds four concurrent requests", async () => {
    let active = 0;
    let peak = 0;
    const results = await boundedMap(Array.from({ length: 13 }, (_, index) => index), async (index) => {
        active++; peak = Math.max(peak, active);
        await new Promise<void>((resolve) => setImmediate(resolve));
        active--; return index;
    });
    assert.equal(peak, 4);
    assert.equal(results.length, 13);
});

test("Preparation metadata rechecks the default revision without reading repository artifacts", async () => {
    let revision = "a".repeat(40);
    let accessDenied = false;
    const visited: string[] = [];
    const operation = { access: { assertCurrent() {} } } as unknown as AdoOperation;
    const client = {
        open: async () => operation,
        repository: async () => {
            if (accessDenied) throw new RepositoryError("resource_unavailable");
            return { id: repositoryId, name: "Synthetic", defaultBranch: "refs/heads/main", operationalState: "active" };
        },
        commit: async () => revision,
        item: async (_operation: unknown, _repository: string, _commit: string, path: string) => {
            visited.push(path); assert.equal(path, "/.specify"); return { path, isFolder: true };
        },
        blob: async () => assert.fail("Selection metadata must not read content"),
        tree: async () => assert.fail("Selection metadata must not enumerate artifacts"),
    } as unknown as AdoClient;
    const service = createRepositoryDiscovery({ client, profile });
    try {
        assert.equal((await service.detail(repositoryId)).sourceVersion, revision);
        revision = "b".repeat(40);
        assert.equal((await service.detail(repositoryId)).sourceVersion, revision);
        assert.deepEqual(visited, ["/.specify", "/.specify"]);
        accessDenied = true;
        await assert.rejects(service.detail(repositoryId), { code: "resource_unavailable" });
    } finally { service.dispose(); }
});

test("Search does not replace the independent team suggestion collection", async () => {
    const proof = fixture();
    try {
        const initial = await proof.service.relevant();
        const found = await proof.service.search("spec 10");
        assert.ok(found.items.length > 0);
        const restored = await proof.service.relevant();
        assert.deepEqual(restored.items, initial.items);
        assert.equal(proof.lists(), 1);
    } finally { proof.service.dispose(); }
});