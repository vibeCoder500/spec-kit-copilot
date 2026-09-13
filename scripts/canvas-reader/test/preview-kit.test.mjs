import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

async function setup(run) {
    const exporter = await import("../export-preview.mjs").catch((error) => {
        if (error.code === "ERR_MODULE_NOT_FOUND") assert.fail("The existing-repository SDD preview exporter is missing.");
        throw error;
    });
    const root = await mkdtemp(join(tmpdir(), "sdd-shareable-kit-"));
    const outputDirectory = join(root, "kit");
    const workspace = join(root, "existing-project");
    const sources = new Map([
        [".specify/memory/constitution.md", "# Existing constitution\n\nPreserve this project.\n"],
        ["specs/001-existing/spec.md", "# Existing first iteration\n\n## Requirements\n\n[Research](research.md)\n"],
        ["specs/001-existing/research.md", "# Existing research\n\n## Findings\n\nUnchanged source.\n"],
        ["specs/001-existing/tasks.md", "# Existing tasks\n\n- [x] T001 Completed before preview installation.\n"],
        ["specs/002-existing/spec.md", "# Existing second iteration\n\n## Requirements\n\nAnother independent feature.\n"],
    ]);
    try {
        await exporter.exportSddPreview({ outputDirectory });
        await mkdir(join(workspace, ".git"), { recursive: true });
        for (const [file, content] of sources) {
            await mkdir(join(workspace, file, ".."), { recursive: true });
            await writeFile(join(workspace, file), content);
        }
        const installer = await import(pathToFileURL(join(outputDirectory, "preview.mjs")).href);
        await run({ root, outputDirectory, workspace, installer });
        for (const [file, content] of sources) assert.equal(await readFile(join(workspace, file), "utf8"), content, "existing project sources must not change");
        await assert.rejects(readFile(join(workspace, ".speckit-wizard/state.json")), { code: "ENOENT" });
        await assert.rejects(readdir(join(workspace, ".github/skills")), { code: "ENOENT" });
    } finally { await rm(root, { recursive: true, force: true }); }
}

test("SDD preview kit contains only the existing plugin and portable verification/loading material", () => setup(async ({ outputDirectory, installer }) => {
    const verified = await installer.verifyPreview();
    assert.equal(verified.pluginId, "spec-kit-copilot-sdd");
    assert.equal(verified.canvasId, "sdd-canvas");
    assert.match(verified.payloadSha256, /^[a-f0-9]{64}$/);
    const files = (await readFile(join(outputDirectory, "SHA256SUMS.json"), "utf8"));
    assert.ok(!/node_modules|sample-artifacts|\.github\/skills|\.speckit-wizard|specs\/001-existing/.test(files));
    assert.match(await readFile(join(outputDirectory, "README-TESTING.md"), "utf8"), /existing\s+specs/i);
}));

test("preview install requires isolated-provider confirmation, supports dry-run, and removes only owned extension files", () => setup(async ({ workspace, installer }) => {
    await assert.rejects(installer.installPreview({ workspace }), /provider/i);
    const preview = await installer.installPreview({ workspace, isolatedProviderConfirmed: true, dryRun: true });
    assert.equal(preview.status, "dry-run");
    await assert.rejects(readdir(join(workspace, ".github")), { code: "ENOENT" });
    assert.equal((await installer.installPreview({ workspace, isolatedProviderConfirmed: true })).status, "installed");
    const target = join(workspace, ".github/extensions/sdd-canvas");
    assert.equal(JSON.parse(await readFile(join(target, "copilot-extension.json"), "utf8")).name, "sdd-canvas");
    await assert.rejects(installer.installPreview({ workspace, isolatedProviderConfirmed: true }), /already|receipt/i);
    assert.equal((await installer.removePreview({ workspace })).status, "removed");
    await assert.rejects(readdir(target), { code: "ENOENT" });
}));

test("preview replacement restores an existing project-local SDD extension byte-for-byte", () => setup(async ({ workspace, installer }) => {
    const target = join(workspace, ".github/extensions/sdd-canvas");
    await mkdir(target, { recursive: true });
    const original = new Map([["copilot-extension.json", '{"name":"sdd-canvas","version":1}\r\n'], ["extension.mjs", "export const existing = true;\r\n"], ["user-notes.txt", "Keep this existing extension file.\n"]]);
    for (const [file, content] of original) await writeFile(join(target, file), content);
    await assert.rejects(installer.installPreview({ workspace, isolatedProviderConfirmed: true }), /replace-existing/i);
    await installer.installPreview({ workspace, isolatedProviderConfirmed: true, replaceExisting: true });
    await assert.rejects(readFile(join(target, "user-notes.txt")), { code: "ENOENT" });
    assert.equal((await installer.removePreview({ workspace })).status, "restored");
    assert.deepEqual((await readdir(target)).sort(), [...original.keys()].sort());
    for (const [file, content] of original) assert.equal(await readFile(join(target, file), "utf8"), content);
}));

test("preview verification rejects tampering and removal preserves locally edited installation files", () => setup(async ({ outputDirectory, workspace, installer }) => {
    const asset = join(outputDirectory, "plugin/extensions/sdd-canvas/vendor/markdown-reader/markdown-reader.js");
    const before = await readFile(asset);
    await writeFile(asset, "tampered synthetic payload");
    await assert.rejects(installer.verifyPreview(), /hash|checksum/i);
    await assert.rejects(installer.installPreview({ workspace, isolatedProviderConfirmed: true }), /hash|checksum/i);
    await writeFile(asset, before);
    await installer.installPreview({ workspace, isolatedProviderConfirmed: true });
    const userEdit = join(workspace, ".github/extensions/sdd-canvas/local-notes.md");
    await writeFile(userEdit, "Preserve this newly added file.");
    await assert.rejects(installer.removePreview({ workspace }), /changed|modified|unexpected/i);
    assert.equal(await readFile(userEdit, "utf8"), "Preserve this newly added file.");
    await rm(userEdit);
    await installer.removePreview({ workspace });
}));

test("preview install rejects redirected project paths before changing external files", () => setup(async ({ root, workspace, installer }) => {
    const outside = join(root, "outside");
    await mkdir(outside);
    const redirect = join(workspace, ".github");
    await symlink(outside, redirect, process.platform === "win32" ? "junction" : "dir");
    try {
        await assert.rejects(installer.installPreview({ workspace, isolatedProviderConfirmed: true }), /[Rr]edirect|unsafe/i);
        assert.deepEqual(await readdir(outside), []);
    } finally { await rm(redirect); }
}));

test("preview removal refuses an altered original backup and preserves it", () => setup(async ({ workspace, installer }) => {
    const target = join(workspace, ".github/extensions/sdd-canvas");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "copilot-extension.json"), '{"name":"sdd-canvas","version":1}');
    await writeFile(join(target, "extension.mjs"), "export const previous = true;\n");
    await installer.installPreview({ workspace, isolatedProviderConfirmed: true, replaceExisting: true });
    const backup = join(workspace, ".github/.sdd-markdown-preview/backup/extension.mjs");
    await writeFile(backup, "Preserve this changed backup.\n");
    await assert.rejects(installer.removePreview({ workspace }), /backup changed/i);
    assert.equal(await readFile(backup, "utf8"), "Preserve this changed backup.\n");
    await writeFile(backup, "export const previous = true;\n");
    await installer.removePreview({ workspace });
}));

test("installed preview reads existing spec iterations and related documents without regeneration or workflow dispatch", () => setup(async ({ workspace, installer }) => {
    await installer.installPreview({ workspace, isolatedProviderConfirmed: true });
    const key = `__previewKit_${randomUUID().replaceAll("-", "")}`;
    let dispatches = 0;
    globalThis[key] = { send: async () => { dispatches++; throw new Error("Workflow calls are not authorized by this test."); },
        log: async () => {}, rpc: { metadata: { snapshot: async () => ({ workingDirectory: workspace }) } } };
    const sdk = `export const createCanvas = definition => definition; export class CanvasError extends Error {} export async function joinSession() { return globalThis[${JSON.stringify(key)}]; }`;
    const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
        if (specifier === "@github/copilot-sdk/extension") return { url: `data:text/javascript,${encodeURIComponent(sdk)}`, shortCircuit: true };
        return nextResolve(specifier, context);
    } });
    let entry;
    try {
        const module = await import(pathToFileURL(join(workspace, ".github/extensions/sdd-canvas/extension.mjs")).href);
        entry = await module.startServer();
    } finally { hooks.deregister(); delete globalThis[key]; }
    const endpoint = (route, parameters = {}) => {
        const url = new URL(entry.url);
        url.pathname = route;
        for (const [name, value] of Object.entries(parameters)) url.searchParams.set(name, value);
        return url;
    };
    try {
        const state = await (await fetch(endpoint("/api/state"))).json();
        assert.deepEqual(state.features.map((feature) => feature.slug).sort(), ["001-existing", "002-existing"]);
        for (const feature of ["001-existing", "002-existing"]) {
            const { data: context } = await (await fetch(endpoint("/api/review/context", { feature, stage: "specify" }))).json();
            const response = await fetch(endpoint("/api/review/content", { context: context.contextId, artifactId: context.primaryArtifactId }));
            assert.equal(response.status, 200);
            const { data: document } = await response.json();
            const expected = await readFile(join(workspace, "specs", feature, "spec.md"));
            assert.equal(document.revision, `sha256:${createHash("sha256").update(expected).digest("hex")}`);
            assert.equal(document.content, expected.toString("utf8"));
            if (feature === "001-existing") assert.ok(context.items.some((item) => item.relativePath.endsWith("/research.md")));
        }
        assert.equal(dispatches, 0);
    } finally {
        clearInterval(entry.timer);
        await new Promise((resolveClose) => { entry.server.close(resolveClose); entry.server.closeAllConnections(); });
        await installer.removePreview({ workspace });
    }
}));
