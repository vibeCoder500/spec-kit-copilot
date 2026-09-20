import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { stageRepositoryCanvas } from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/stage-native.mjs";
import { sourceDigest } from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/build-runtime.mjs";
import * as acceptance from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/stage-clone-acceptance.mjs";

test("Repository source fingerprints are stable across checkout line endings", () => {
    assert.equal(sourceDigest(Buffer.from("first\r\nsecond\r\n")), sourceDigest(Buffer.from("first\nsecond\n")));
    assert.notEqual(sourceDigest(Buffer.from("changed\n")), sourceDigest(Buffer.from("original\n")));
});

test("Native repository staging preserves shipped runtime bytes and isolates its only profile adapter", async () => {
    const record = await stageRepositoryCanvas({ initializeGit: false, profile: { schemaVersion: 1, enabled: true,
        tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222", organization: "Synthetic", project: "Project" } });
    try {
        const extension = join(record.workspace, ".github/extensions/sdd-canvas");
        for (const file of record.runtimeFiles) {
            const path = file.path.slice("extensions/sdd-canvas/".length);
            const bytes = await readFile(join(extension, path));
            assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256);
        }
        const script = await readFile(join(extension, "extension.mjs"), "utf8");
        assert(script.includes('profileStatus: { state: "configured"'));
        assert.equal(record.normalPluginsChanged, false);
        assert.equal(record.sourceCommit, undefined);
        assert.equal(record.privateClone, false);
    } finally { await rm(record.workspace, { recursive: true }); }
});

test("Entry acceptance inventories tracked and untracked source without installing or dispatching", async () => {
    const capture = Reflect.get(acceptance, "captureAcceptanceSnapshot");
    assert.equal(typeof capture, "function");
    const record = await stageRepositoryCanvas({ profile: { schemaVersion: 1, enabled: true,
        tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222", organization: "Synthetic", project: "Project" } });
    try {
        const before = await capture(record.workspace);
        assert.ok(before.tracked.files > 0);
        await writeFile(join(record.workspace, "untracked-draft.md"), "Preserve this synthetic draft");
        const after = await capture(record.workspace);
        assert.deepEqual(after.tracked, before.tracked);
        assert.notEqual(after.untracked.sha256, before.untracked.sha256);
        assert.equal(after.head, before.head);
        assert.equal(after.branchSha256, before.branchSha256);
        assert.doesNotMatch(JSON.stringify(after), /Preserve this|untracked-draft|account|capability|confirmation/);
        await assert.rejects(acceptance.stageCloneAcceptance({ workspacePath: record.workspace, expectedOperationId: "a".repeat(32) }), /supported host/i);
        assert.deepEqual(await capture(record.workspace), after);
        const script = await readFile(new URL("../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/stage-clone-acceptance.mjs", import.meta.url), "utf8");
        assert.doesNotMatch(script, /writeFile|mkdir|\.send\(|Generated Core Command Wrapper/);
    } finally { await rm(record.workspace, { recursive: true }); }
});