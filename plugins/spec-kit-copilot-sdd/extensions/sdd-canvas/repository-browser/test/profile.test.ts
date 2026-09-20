import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadRepositoryProfile, parseRepositoryProfile } from "../src/profile.ts";
import * as profileModule from "../src/profile.ts";

export const profile = { schemaVersion: 1, enabled: true,
    tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222",
    organization: "SyntheticOrg", project: "SyntheticProject" };

test("Repository profiles accept only explicit tenant-bound configuration", () => {
    assert.deepEqual(parseRepositoryProfile(profile), profile);
    for (const invalid of [null, [], { ...profile, enabled: "true" }, { ...profile, tenantId: "common" },
        { ...profile, organization: "../other" }, { ...profile, project: "unsafe?query" },
        { ...profile, clientSecret: "not-accepted" }, { ...profile, apiUrl: "https://unexpected.invalid" }]) {
        assert.throws(() => parseRepositoryProfile(invalid), { code: "invalid_request" });
    }
});

test("Missing and disabled profiles require no setup and leave local-only behavior intact", async () => {
    const home = await mkdtemp(join(tmpdir(), "sdd-profile-test-"));
    try {
        assert.deepEqual(await loadRepositoryProfile(home), { state: "unconfigured" });
        await mkdir(join(home, ".speckit-canvas"));
        const filename = join(home, ".speckit-canvas/repository-profile.json");
        await writeFile(filename, JSON.stringify({ ...profile, enabled: false }));
        assert.deepEqual(await loadRepositoryProfile(home), { state: "disabled" });
        await writeFile(filename, JSON.stringify(profile));
        assert.equal((await loadRepositoryProfile(home)).state, "configured");
        await writeFile(filename, "x".repeat(16_385));
        assert.deepEqual(await loadRepositoryProfile(home), { state: "invalid" });
    } finally { await rm(home, { recursive: true }); }
});

test("Entry settings default on independently of invalid or missing remote configuration", async () => {
    const loadEntry = Reflect.get(profileModule, "loadEntrySettings");
    assert.equal(typeof loadEntry, "function");
    const home = await mkdtemp(join(tmpdir(), "sdd-entry-settings-"));
    try {
        assert.deepEqual(await loadEntry(home), { state: "enabled", settings: { schemaVersion: 1, repositoryEntryEnabled: true } });
        await mkdir(join(home, ".speckit-canvas"));
        await writeFile(join(home, ".speckit-canvas/repository-profile.json"), "invalid remote configuration");
        assert.equal((await loadRepositoryProfile(home)).state, "invalid");
        assert.equal((await loadEntry(home)).state, "enabled");
        const filename = join(home, ".speckit-canvas/entry-settings.json");
        await writeFile(filename, '{"schemaVersion":1,"repositoryEntryEnabled":false}');
        assert.deepEqual(await loadEntry(home), { state: "disabled", settings: { schemaVersion: 1, repositoryEntryEnabled: false } });
        for (const invalid of ['{}', '[]', 'invalid', '{"schemaVersion":1,"repositoryEntryEnabled":"true"}',
            '{"schemaVersion":1,"repositoryEntryEnabled":true,"workspacePath":"untrusted"}',
            '{"schemaVersion":1,"repositoryEntryEnabled":true,"repositoryEntryEnabled":false}', 'x'.repeat(4097)]) {
            await writeFile(filename, invalid);
            assert.deepEqual(await loadEntry(home), { state: "invalid", settings: { schemaVersion: 1, repositoryEntryEnabled: false } });
        }
    } finally { await rm(home, { recursive: true }); }
});