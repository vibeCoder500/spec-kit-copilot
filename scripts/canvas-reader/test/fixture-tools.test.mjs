import assert from "node:assert/strict";
import { access, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { startFixture } from "../serve-fixture.mjs";
import { stageAppFixture } from "../stage-app-fixture.mjs";
import { createEntryHostFixture } from "../fixtures/repositories.mjs";
import { createOwnedWorkspace } from "../fixtures/workspace.mjs";

async function safeFetch(url, options) {
    try { return await fetch(url, options); }
    catch { throw new Error("Owned fixture HTTP request failed."); }
}

for (const canvas of ["wizard", "sdd"]) {
    test(`${canvas} fixture uses its actual shell and server with only owned synthetic files`, async () => {
        const fixture = await startFixture({ canvas });
        try {
            const url = new URL(fixture.url);
            assert.equal(url.hostname, "127.0.0.1");
            assert.equal(url.searchParams.get("readerProbe"), "1");
            assert.ok(url.searchParams.has(canvas === "wizard" ? "token" : "cap"));
            const response = await safeFetch(url);
            assert.equal(response.status, 200);
            const html = await response.text();
            assert.match(html, canvas === "wizard" ? /phase-artifact-viewer/ : /id="artBody"/);
            const stateUrl = new URL("/api/state", url);
            stateUrl.search = url.search;
            const state = await (await safeFetch(stateUrl)).json();
            assert.equal(canvas === "wizard" ? state.slug : state.features[0].slug, "999-canvas-preview-fixture");
            if (canvas === "wizard") {
                assert.equal(state.boot.phase, "ready");
                assert.ok(state.commands.some((command) => command.id === "specify" && command.artifactPath));
                assert.ok(state.pipeline.every((entry) => typeof entry.id === "string"));
            }
            const denied = new URL("/api/run", url);
            denied.search = url.search;
            assert.equal((await safeFetch(denied, { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } })).status, 403);
            assert.equal(fixture.dispatchCount(), 0);
            assert.equal(fixture.blockedWrites(), 1);
            assert.equal(fixture.workspaceChanged(), false);
        } finally { await fixture.stop(); }
        await assert.rejects(access(fixture.workspace));
    });
}

test("staging copies complete existing plugins without reader development dependencies or overwriting a target", async () => {
    const fixture = await startFixture({ canvas: "wizard" });
    try {
        const target = join(fixture.workspace, ".canvas-reader-stage");
        const result = await stageAppFixture({ workspace: fixture.workspace, target });
        assert.equal(result.plugins.length, 2);
        for (const plugin of result.plugins) {
            const pluginRoot = join(target, plugin.id);
            const manifest = JSON.parse(await readFile(join(pluginRoot, "plugin.json"), "utf8"));
            assert.equal(manifest.name, plugin.id);
            assert.ok(plugin.files.some((file) => file.path.endsWith("markdown-reader.js")));
            assert.ok(plugin.files.some((file) => file.path.endsWith("extension.mjs")));
            assert.ok(plugin.files.every((file) => !file.path.includes("ui/markdown-reader/node_modules")));
            assert.ok(plugin.files.every((file) => !file.path.endsWith(".map")));
        }
        const wizard = result.plugins.find((plugin) => plugin.id === "spec-kit-copilot-wizard");
        assert.ok(wizard.files.some((file) => file.path.includes("node_modules/js-yaml/")));
        await assert.rejects(stageAppFixture({ workspace: fixture.workspace, target }), /exists|overwrite/i);
        await rm(target, { recursive: true });
    } finally { await fixture.stop(); }
});

test("staging refuses an unowned workspace before writing anything", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "speckit-unowned-test-"));
    try {
        await assert.rejects(stageAppFixture({ workspace, target: join(workspace, "staged") }), /owned|fixture/i);
        assert.deepEqual(await readdir(workspace), []);
    } finally { await rm(workspace, { recursive: true, force: true }); }
});

test("fixture cleanup preserves unexpected user files", async () => {
    const fixture = await startFixture({ canvas: "sdd" });
    const unexpected = join(fixture.workspace, "user-notes.txt");
    try {
        await writeFile(unexpected, "Synthetic user edit: keep this file.");
        assert.equal(fixture.workspaceChanged(), true);
        const result = await fixture.stop();
        assert.equal(result.cleaned, false);
        assert.equal(await readFile(unexpected, "utf8"), "Synthetic user edit: keep this file.");
    } finally {
        await fixture.stop();
        await rm(fixture.workspace, { recursive: true, force: true });
    }
});

test("entry host fixture is owned, unsupported by default, and has explicit race controls", async () => {
    const source = await createOwnedWorkspace();
    const host = await createEntryHostFixture({ workspace: source.workspace });
    const supported = await createEntryHostFixture({ workspace: source.workspace, supported: true });
    try {
        const initial = await host.adapter.inspectCurrent();
        assert.notEqual(host.sourceDirectory, host.targetDirectory);
        assert.equal(initial.capabilities.atomicHandoff, false);
        let starts = 0;
        await assert.rejects(host.adapter.admitPreparation({ operationId: "operation", expectedSource: initial, capabilityGeneration: initial.capabilityGeneration },
            async () => { starts++; }), { code: "host_handoff_unsupported" });
        assert.equal(starts, 0);
        const ready = await supported.adapter.inspectCurrent();
        supported.beforeAdmission(() => supported.setActivity("busy"));
        await assert.rejects(supported.adapter.admitPreparation({ operationId: "race", expectedSource: ready, capabilityGeneration: ready.capabilityGeneration },
            async () => { starts++; }), { code: "session_busy" });
        assert.equal(starts, 0);
        supported.beforeAdmission(() => undefined);
        supported.setActivity("idle");
        const input = { operationId: "one-start", expectedSource: ready, capabilityGeneration: ready.capabilityGeneration };
        await supported.adapter.admitPreparation(input, async () => { starts++; return "prepared"; });
        await supported.adapter.admitPreparation(input, async () => { starts++; return "duplicate"; });
        assert.equal(starts, 1);
        assert.equal(supported.counts().starts, 1);
        assert.equal(source.changed(), false);
    } finally {
        assert.equal((await host.cleanup()).cleaned, true);
        assert.equal((await supported.cleanup()).cleaned, true);
        assert.equal((await source.cleanup()).cleaned, true);
    }
});

test("entry host fixture refuses an unowned source before staging a target", async () => {
    const root = await mkdtemp(join(tmpdir(), "unowned-entry-test-"));
    try {
        await assert.rejects(createEntryHostFixture({ workspace: root }), /owned reader fixture/);
        assert.deepEqual(await readdir(root), []);
    } finally { await rm(root, { recursive: true, force: true }); }
});

test("clone-only fixture uses production admission without enabling handoff", async () => {
    const source = await createOwnedWorkspace();
    const host = await createEntryHostFixture({ workspace: source.workspace, cloneOnly: true });
    try {
        const initial = await host.adapter.inspectCurrent();
        assert.equal(initial.capabilities.checkedPreparation, true);
        assert.equal(initial.capabilities.atomicPreparation, false);
        assert.equal(initial.capabilities.atomicHandoff, false);
        const admission = { operationId: "a".repeat(32), expectedSource: initial,
            capabilityGeneration: initial.capabilityGeneration, activityRevision: initial.activityRevision };
        assert.equal(await host.adapter.admitPreparation(admission, async () => "prepared"), "prepared");
        await assert.rejects(host.adapter.admitPreparation(admission, async () => assert.fail("Duplicate clone")), { code: "clone_conflict" });
        host.setActivity("busy");
        await assert.rejects(host.adapter.admitPreparation({ ...admission, operationId: "b".repeat(32) }, async () => assert.fail("Busy clone")), { code: "session_busy" });
        assert.equal(host.counts().starts, 1);
        assert.equal(host.counts().handoffs, 0);
        assert.equal(host.counts().opens, 0);
        assert.equal(source.changed(), false);
    } finally {
        assert.equal((await host.cleanup()).cleaned, true);
        assert.equal((await source.cleanup()).cleaned, true);
    }
});

test("SDD entry coordination is opt-in and both fixture defaults remain non-mutating", async () => {
    const legacy = await startFixture({ canvas: "sdd" });
    const isolated = await startFixture({ canvas: "sdd", repositoryEntry: true });
    try {
        for (const [fixture, expectedStatus] of [[legacy, 404], [isolated, 200]]) {
            const source = new URL(fixture.url);
            const endpoint = new URL("/api/entry/state", source);
            endpoint.searchParams.set("cap", source.searchParams.get("cap"));
            const response = await safeFetch(endpoint);
            assert.equal(response.status, expectedStatus);
            if (expectedStatus === 200) {
                const payload = await response.json();
                assert.equal(payload.data.configuration, "unconfigured");
                assert.equal(payload.data.host.canPrepareRemote, false);
                assert.equal(payload.data.host.reason, "activity_unknown");
                assert.equal(fixture.entryHost.counts().starts, 0);
                assert.equal(fixture.entryHost.counts().handoffs, 0);
            }
            assert.equal(fixture.repositories, null);
            assert.equal(fixture.dispatchCount(), 0);
            assert.equal(fixture.workspaceChanged(), false);
        }
        assert.equal(legacy.entryHost, null);
    } finally {
        assert.equal((await isolated.stop()).cleaned, true);
        assert.equal((await legacy.stop()).cleaned, true);
    }
});
