import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { openRequestedAppCanvas } from "../src/app-canvas.ts";
import { RepositoryError } from "../src/errors.ts";
import { createHostHandoffAdapter } from "../src/host-handoff.ts";
import { createPreparationStore } from "../src/preparation-store.ts";
import type { PreparedRepositoryRecord } from "../src/types.ts";

async function fixture(run: (proof: {
    home: string; record: PreparedRepositoryRecord; store: ReturnType<typeof createPreparationStore>;
}) => Promise<void>) {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-app-canvas-")));
    const operationId = "a".repeat(32);
    const root = join(home, "SpecKitCanvas", "repositories", operationId);
    const destination = join(root, "checkout");
    await mkdir(join(destination, ".git"), { recursive: true });
    await writeFile(join(root, ".sdd-clone-owner.json"), JSON.stringify({ kind: "sdd-repository-clone", operationId }));
    const record: PreparedRepositoryRecord = { schemaVersion: 2, kind: "sdd-prepared-repository", operationId,
        repositoryId: "33333333-3333-4333-8333-333333333333",
        originIdentity: "https://dev.azure.com/Synthetic/Project/_git/33333333-3333-4333-8333-333333333333",
        defaultRef: "refs/heads/main", sourceCommit: "b".repeat(40), destination, gitCommonDirectory: join(destination, ".git"),
        branch: `refs/heads/speckit/canvas-${operationId}`, initialWorktreeFingerprint: "c".repeat(64),
        profileFingerprint: "d".repeat(64), accountKey: "e".repeat(64), createdAt: 1000, completedAt: 2000 };
    const store = createPreparationStore({ homeDirectory: home });
    try {
        await store.write(record);
        await store.requestAppCanvas(operationId, "source", 3000);
        await run({ home, record, store });
    } finally { await rm(home, { recursive: true, force: true }); }
}

function targetHost(directory: string, { sessionId = "target", busy = false, open = async (input: { instanceId: string }) =>
    ({ extensionId: "sdd", canvasId: "sdd-canvas-direct", instanceId: input.instanceId }) } = {}) {
    return createHostHandoffAdapter({ sessionId, extensionId: "sdd", metadata: {
        snapshot: async () => ({ sessionId, workingDirectory: directory }),
        activity: async () => ({ hasActiveWork: busy, abortable: busy }),
    }, canvas: { open } });
}

test("A new target session opens the original canvas once without a model prompt", () => fixture(async ({ home, record, store }) => {
    let opens = 0;
    let verifications = 0;
    const host = targetHost(record.destination, { open: async input => {
        opens++;
        assert.equal((await store.read(record.operationId)).appCanvas?.canvasStatus, "opening");
        return { extensionId: "sdd", canvasId: "sdd-canvas-direct", instanceId: input.instanceId };
    } });
    try {
        const options = { host, homeDirectory: home, now: () => 4000, verifyPrepared: async () => { verifications++; } };
        assert.equal((await openRequestedAppCanvas(options)).status, "opened");
        const saved = await store.read(record.operationId);
        assert.equal(saved.appCanvas?.canvasStatus, "opened");
        assert.equal(saved.appCanvas?.acknowledgment?.sessionId, "target");
        assert.equal(saved.handoff, undefined);
        assert.equal(saved.acceptedTarget, undefined);
        assert.equal((await openRequestedAppCanvas(options)).status, "none");
        assert.equal(opens, 1); assert.equal(verifications, 2);
    } finally { host.dispose(); }
}));

test("Source, unrelated, expired and failed-launch sessions never consume an App canvas request", () => fixture(async ({ home, record, store }) => {
    for (const [directory, sessionId, time] of [[record.destination, "source", 4000], [home, "target", 4000], [record.destination, "target", 603000]] as const) {
        const host = targetHost(directory, { sessionId });
        try { assert.equal((await openRequestedAppCanvas({ host, homeDirectory: home, now: () => time })).status, "none"); }
        finally { host.dispose(); }
    }
    const saved = await store.read(record.operationId);
    await store.updateAppLaunch(record.operationId, saved.appCanvas!.requestId, "failed", "app_launch_failed");
    const host = targetHost(record.destination);
    try { assert.equal((await openRequestedAppCanvas({ host, homeDirectory: home, now: () => 4000 })).status, "none"); }
    finally { host.dispose(); }
    assert.equal((await store.read(record.operationId)).appCanvas?.canvasStatus, "pending");
}));

test("Busy or changed checkouts do not open a target canvas", () => fixture(async ({ home, record, store }) => {
    const busy = targetHost(record.destination, { busy: true });
    try { await assert.rejects(openRequestedAppCanvas({ host: busy, homeDirectory: home, now: () => 4000 }), { code: "session_busy" }); }
    finally { busy.dispose(); }
    const host = targetHost(record.destination);
    try {
        await assert.rejects(openRequestedAppCanvas({ host, homeDirectory: home, now: () => 4000,
            verifyPrepared: async () => { throw new RepositoryError("clone_identity_changed"); } }), { code: "clone_identity_changed" });
        assert.equal((await store.read(record.operationId)).appCanvas?.canvasStatus, "pending");
    } finally { host.dispose(); }
}));

test("Uncertain canvas responses stay uncertain and never auto-repeat", () => fixture(async ({ home, record, store }) => {
    let opens = 0;
    const host = targetHost(record.destination, { open: async () => { opens++; throw new Error("Lost response"); } });
    try {
        const options = { host, homeDirectory: home, now: () => 4000, verifyPrepared: async () => undefined };
        await assert.rejects(openRequestedAppCanvas(options), { code: "canvas_unavailable" });
        assert.equal((await store.read(record.operationId)).appCanvas?.canvasStatus, "unknown");
        assert.equal((await openRequestedAppCanvas(options)).status, "none");
        assert.equal(opens, 1);
    } finally { host.dispose(); }
}));

test("Target activity invalidation between verification and opening rejects without submitting a canvas", () => fixture(async ({ home, record, store }) => {
    let opens = 0;
    const host = targetHost(record.destination, { open: async input => {
        opens++; return { extensionId: "sdd", canvasId: "sdd-canvas-direct", instanceId: input.instanceId };
    } });
    const inspect = host.inspectCurrent;
    let reads = 0;
    host.inspectCurrent = async () => ({ ...await inspect(), activityRevision: ++reads === 1 ? "original" : "changed" });
    try {
        await assert.rejects(openRequestedAppCanvas({ host, homeDirectory: home, now: () => 4000, verifyPrepared: async () => undefined }), { code: "context_changed" });
        assert.equal(opens, 0);
        assert.equal((await store.read(record.operationId)).appCanvas?.canvasStatus, "failed");
    } finally { host.dispose(); }
}));

test("Only one target process can claim a persisted request", () => fixture(async ({ home, record, store }) => {
    const requestId = (await store.read(record.operationId)).appCanvas!.requestId;
    const results = await Promise.allSettled([
        store.claimAppCanvas(record.operationId, requestId, "first", 4000),
        createPreparationStore({ homeDirectory: home }).claimAppCanvas(record.operationId, requestId, "second", 4000),
    ]);
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(results.filter(result => result.status === "rejected").length, 1);
}));
