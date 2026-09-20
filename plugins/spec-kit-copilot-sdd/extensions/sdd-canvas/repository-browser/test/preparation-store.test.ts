import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createPreparationStore } from "../src/preparation-store.ts";
import type { HandoffAttempt, PreparedRepositoryRecord, WorkspaceActivation } from "../src/types.ts";

async function fixture(run: (input: { home: string; record: PreparedRepositoryRecord; store: ReturnType<typeof createPreparationStore> }) => Promise<void>) {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-preparation-store-")));
    const operationId = "a".repeat(32);
    const root = join(home, "SpecKitCanvas", "repositories", operationId);
    const destination = join(root, "checkout");
    await mkdir(join(destination, ".git"), { recursive: true });
    await writeFile(join(root, ".sdd-clone-owner.json"), JSON.stringify({ kind: "sdd-repository-clone", operationId }));
    const record: PreparedRepositoryRecord = { schemaVersion: 2, kind: "sdd-prepared-repository", operationId,
        repositoryId: "33333333-3333-4333-8333-333333333333", originIdentity: "https://dev.azure.com/Synthetic/Project/_git/33333333-3333-4333-8333-333333333333",
        defaultRef: "refs/heads/main", sourceCommit: "b".repeat(40), destination, gitCommonDirectory: join(destination, ".git"),
        branch: `refs/heads/speckit/canvas-${operationId}`, initialWorktreeFingerprint: "c".repeat(64),
        profileFingerprint: "d".repeat(64), accountKey: "e".repeat(64), createdAt: 1000, completedAt: 2000 };
    try { await run({ home, record, store: createPreparationStore({ homeDirectory: home }) }); }
    finally { await rm(home, { recursive: true, force: true }); }
}

test("Preparation completion is atomic, credential-free, and immutable across store replacement", () => fixture(async ({ home, record, store }) => {
    await store.write(record);
    const directory = join(home, ".speckit-canvas", "preparations");
    assert.deepEqual(await readdir(directory), [`${record.operationId}.json`]);
    assert.deepEqual(await createPreparationStore({ homeDirectory: home }).read(record.operationId), record);
    await store.write({ ...record });
    for (const changed of [{ accountKey: "f".repeat(64) }, { sourceCommit: "f".repeat(40) }, { branch: "refs/heads/other" },
        { accessToken: "private-token" }, { confirmation: "private-consent" }]) {
        await assert.rejects(store.write({ ...record, ...changed }));
    }
    const raw = await readFile(join(directory, `${record.operationId}.json`), "utf8");
    assert.ok(Buffer.byteLength(raw) <= 8192);
    assert.doesNotMatch(raw, /private-token|private-consent|accessToken|confirmation/);
    assert.deepEqual(await store.read(record.operationId), record);
}));

test("Preparation inspection is bounded and legacy records remain read-only and non-actionable", () => fixture(async ({ home, record, store }) => {
    const directory = join(home, ".speckit-canvas", "preparations");
    await mkdir(directory, { recursive: true });
    const legacyId = record.operationId;
    const legacy = JSON.stringify({ schemaVersion: 1, operationId: legacyId, kind: "sdd-prepared-repository",
        gitDirectory: record.gitCommonDirectory, checkout: record.destination, remote: record.originIdentity,
        repositoryId: record.repositoryId, initialCommit: record.sourceCommit, initialBranch: record.branch.slice(11), createdAt: new Date(1000).toISOString() });
    await writeFile(join(directory, `${legacyId}.json`), legacy);
    await assert.rejects(store.read(legacyId), { code: "invalid_context" });
    const initial = await store.list();
    assert.equal(initial.items[0]?.legacy, true);
    assert.equal(initial.items[0]?.actionable, false);
    assert.equal(await readFile(join(directory, `${legacyId}.json`), "utf8"), legacy);
    for (let index = 0; index < 257; index++) await writeFile(join(directory, `${index.toString(16).padStart(32, "0")}.json`), "{}");
    const bounded = await store.list();
    assert.equal(bounded.inspected, 256);
    assert.equal(bounded.hasMore, true);
    assert.equal((await readdir(directory)).length, 258);
}));

test("Preparation records reject oversized, duplicate, redirected, and unowned paths", () => fixture(async ({ home, record, store }) => {
    const directory = join(home, ".speckit-canvas", "preparations");
    await mkdir(directory, { recursive: true });
    const filename = join(directory, `${record.operationId}.json`);
    for (const raw of [" ".repeat(8193), JSON.stringify(record).replace('"schemaVersion":2', '"schemaVersion":2,"schemaVersion":2')]) {
        await writeFile(filename, raw);
        await assert.rejects(store.read(record.operationId), { code: "invalid_context" });
    }
    await rm(filename);
    await assert.rejects(store.write({ ...record, destination: home }));
    const redirected = join(home, "redirected");
    await symlink(join(home, "SpecKitCanvas"), redirected, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(store.write({ ...record, destination: join(redirected, "repositories", record.operationId, "checkout") }));
    await rm(join(home, "SpecKitCanvas", "repositories", record.operationId, ".sdd-clone-owner.json"));
    await assert.rejects(store.write(record));
}));

test("Handoff attempts persist before submission and only one unresolved attempt can exist", () => fixture(async ({ home, record, store }) => {
    assert.equal(typeof Reflect.get(store, "beginAttempt"), "function");
    await store.write(record);
    const attempt: HandoffAttempt = { attemptId: "f".repeat(32), operationId: record.operationId, expectedSource: { sessionId: "source", contextRevision: "original" },
        instanceId: "target-instance", status: "requested", createdAt: 3000 };
    await store.beginAttempt(record.operationId, attempt);
    const reopened = createPreparationStore({ homeDirectory: home });
    assert.deepEqual((await reopened.read(record.operationId)).handoff, attempt);
    await assert.rejects(reopened.beginAttempt(record.operationId, { ...attempt, attemptId: "0".repeat(32) }), { code: "handoff_in_progress" });
    await reopened.updateAttempt(record.operationId, { ...attempt, status: "unknown", errorCode: "handoff_unknown" });
    assert.equal((await store.read(record.operationId)).handoff?.status, "unknown");
    for (const changed of [{ operationId: "0".repeat(32) }, { instanceId: "other-instance" }, { expectedSource: { sessionId: "other", contextRevision: "original" } },
        { confirmation: "never-persist" }]) {
        await assert.rejects(reopened.updateAttempt(record.operationId, { ...attempt, ...changed, status: "in_progress" }));
    }
    assert.equal((await store.read(record.operationId)).accountKey, record.accountKey);
    assert.equal((await store.read(record.operationId)).sourceCommit, record.sourceCommit);
}));

test("Activation survives an interrupted binding and readiness records a separate verified target", () => fixture(async ({ home, record, store }) => {
    assert.equal(typeof Reflect.get(store, "beginAttempt"), "function");
    await store.write(record);
    const attempt: HandoffAttempt = { attemptId: "f".repeat(32), operationId: record.operationId, expectedSource: { sessionId: "source", contextRevision: "original" },
        instanceId: "target-instance", status: "requested", createdAt: 3000 };
    const activation: WorkspaceActivation = { attemptId: attempt.attemptId, sessionId: "target", contextRevision: "activated", workingDirectory: record.destination,
        targetKind: "prepared_checkout", targetBranch: record.branch };
    await store.beginAttempt(record.operationId, attempt);
    await store.updateAttempt(record.operationId, { ...attempt, status: "workspace_activated", activation });
    await store.updateAttempt(record.operationId, { ...attempt, status: "unknown", errorCode: "handoff_unknown" });
    const interrupted = await createPreparationStore({ homeDirectory: home }).read(record.operationId);
    assert.equal(interrupted.handoff?.status, "workspace_activated");
    assert.deepEqual(interrupted.handoff?.activation, activation);
    const result = { ...activation, instanceId: attempt.instanceId, providerId: "project:sdd-canvas" };
    await store.updateAttempt(record.operationId, { ...interrupted.handoff!, status: "canvas_ready", result });
    const ready = await store.read(record.operationId);
    assert.deepEqual(ready.acceptedTarget, result);
    assert.equal(ready.branch, record.branch);
    assert.equal(ready.sourceCommit, record.sourceCommit);
    await assert.rejects(store.updateAttempt(record.operationId, { ...attempt, status: "rejected" }));
    const raw = await readFile(join(home, ".speckit-canvas", "preparations", `${record.operationId}.json`), "utf8");
    assert.ok(Buffer.byteLength(raw) <= 8192);
    assert.doesNotMatch(raw, /accessToken|confirmation|capability|never-persist/);
}));