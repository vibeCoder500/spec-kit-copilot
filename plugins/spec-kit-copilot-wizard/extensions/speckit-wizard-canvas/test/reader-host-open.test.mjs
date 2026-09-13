import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("Wizard host opening enables the reader probe only for an explicit boolean input", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "wizard-reader-host-"));
    const holder = {
        canvases: [],
        session: {
            rpc: { metadata: { snapshot: async () => ({ workingDirectory: workspace }) } },
            send: async () => assert.fail("Host probe must not dispatch a workflow."),
            log: async () => {},
        },
    };
    globalThis.__wizardReaderHostTest = holder;
    const mocks = new Map([
        ["@github/copilot-sdk/extension", "export const createCanvas = definition => definition; export async function joinSession(options) { const state = globalThis.__wizardReaderHostTest; state.canvases = options.canvases; return state.session; }"],
        ["./env/deps-check.mjs", "export async function checkDeps() { throw new Error('Boot intentionally disabled in host-open test.'); } export function getExtensionDir() { return ''; } export function installDeps() { throw new Error('Installation is forbidden.'); }"],
        ["./canvas-runtime/watchers.mjs", "export async function startStateWatcher() {} export async function startArtifactWatcher() {} export function stopStateWatcher() {} export function stopArtifactWatcher() {}"],
    ]);
    const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
        if (context.parentURL?.includes("/extension.mjs?reader-host-test") && mocks.has(specifier)) {
            return { url: `data:text/javascript,${encodeURIComponent(mocks.get(specifier))}`, shortCircuit: true };
        }
        return nextResolve(specifier, context);
    } });
    let canvas;
    try {
        await import("../extension.mjs?reader-host-test");
        canvas = holder.canvases[0];
        assert.equal(canvas.id, "speckit-wizard");
        const normal = new URL((await canvas.open({ instanceId: "reader-host" })).url);
        const probe = new URL((await canvas.open({ instanceId: "reader-host", input: { readerProbe: true } })).url);
        assert.equal(normal.searchParams.has("readerProbe"), false);
        assert.equal(probe.searchParams.get("readerProbe"), "1", "App canvas opening must expose the opt-in packaged reader probe.");
        assert.equal(canvas.inputSchema.properties.readerProbe.type, "boolean");
        const reopened = new URL((await canvas.open({ instanceId: "reader-host", input: { readerProbe: "true" } })).url);
        assert.equal(reopened.searchParams.has("readerProbe"), false);
        assert.equal(probe.origin, normal.origin);
        assert.equal(probe.searchParams.get("token"), normal.searchParams.get("token"));
        assert.deepEqual(await readdir(workspace), []);
    } finally {
        if (canvas) await canvas.onClose({ instanceId: "reader-host" });
        hooks.deregister();
        delete globalThis.__wizardReaderHostTest;
        await rm(workspace, { recursive: true, force: true });
    }
});