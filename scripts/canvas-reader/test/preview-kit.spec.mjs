import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire, registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { exportSddPreview } from "../export-preview.mjs";

const require = createRequire(new URL("../../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json", import.meta.url));
const { test, expect } = require("@playwright/test");

test("shareable SDD preview opens existing specs in the installed canvas and restores the project", async ({ page }, testInfo) => {
    const root = await mkdtemp(join(tmpdir(), "sdd-preview-browser-"));
    const workspace = join(root, "existing-project");
    const outputDirectory = process.env.CANVAS_READER_PREVIEW_KIT ? resolve(process.env.CANVAS_READER_PREVIEW_KIT) : join(root, "kit");
    const sources = new Map([
        [".specify/memory/constitution.md", "# Existing constitution\n\nOnly synthetic read-only validation.\n"],
        ["specs/001-existing/spec.md", "# Existing specification\n\n## Requirements\n\nThis iteration existed before the viewer was installed.\n\n## Decisions\n\n[Research](research.md)\n\n| Area | Status |\n| --- | --- |\n| Existing artifacts | Preserved |\n"],
        ["specs/001-existing/research.md", "# Existing research\n\n## Findings\n\nExisting related evidence.\n"],
        ["specs/001-existing/tasks.md", "# Existing tasks\n\n- [x] T001 A previously completed task.\n"],
    ]);
    let installer;
    let entry;
    let installed = false;
    let dispatches = 0;
    const external = [];
    try {
        if (!process.env.CANVAS_READER_PREVIEW_KIT) await exportSddPreview({ outputDirectory });
        await mkdir(join(workspace, ".git"), { recursive: true });
        for (const [path, content] of sources) {
            await mkdir(join(workspace, path, ".."), { recursive: true });
            await writeFile(join(workspace, path), content);
        }
        installer = await import(pathToFileURL(join(outputDirectory, "preview.mjs")).href);
        await installer.installPreview({ workspace, isolatedProviderConfirmed: true });
        installed = true;
        const key = `__previewBrowser_${randomUUID().replaceAll("-", "")}`;
        globalThis[key] = { send: async () => { dispatches++; throw new Error("Workflow dispatch is disabled in this test."); }, log: async () => {},
            rpc: { metadata: { snapshot: async () => ({ workingDirectory: workspace }) } } };
        const sdk = `export const createCanvas = definition => definition; export class CanvasError extends Error {} export async function joinSession() { return globalThis[${JSON.stringify(key)}]; }`;
        const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
            if (specifier === "@github/copilot-sdk/extension") return { url: `data:text/javascript,${encodeURIComponent(sdk)}`, shortCircuit: true };
            return nextResolve(specifier, context);
        } });
        try {
            const module = await import(pathToFileURL(join(workspace, ".github/extensions/sdd-canvas/extension.mjs")).href);
            entry = await module.startServer();
        } finally { hooks.deregister(); delete globalThis[key]; }
        const url = new URL(entry.url);
        await page.route("**/*", async (route) => {
            const target = new URL(route.request().url());
            if (target.origin !== url.origin) { external.push("external"); await route.abort(); }
            else if (route.request().method() !== "GET" && target.pathname !== "/api/review/resolve-link") await route.abort();
            else await route.continue();
        });
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(url.href, { waitUntil: "domcontentloaded" });
        const trigger = page.getByTitle("View spec.md", { exact: true });
        const before = await page.locator("#cards").textContent();
        await trigger.click();
        await expect(page.getByRole("heading", { name: "Existing specification", exact: true })).toBeVisible();
        await expect(page.getByRole("navigation", { name: "Table of contents", exact: true })).toBeVisible();
        await page.getByRole("navigation", { name: "Table of contents", exact: true }).getByRole("button", { name: "Requirements", exact: true }).click();
        await page.locator("#aside").screenshot({ path: testInfo.outputPath("sdd-existing-specs-preview.png") });
        await page.getByRole("link", { name: "Research", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Existing research", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Previous artifact", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Existing specification", exact: true })).toBeVisible();
        await page.locator("#closeArt").click();
        await expect(trigger).toBeFocused();
        expect(await page.locator("#cards").textContent()).toBe(before);
        expect(external).toEqual([]);
        expect(dispatches).toBe(0);
        for (const [path, content] of sources) assert.equal(await readFile(join(workspace, path), "utf8"), content);
    } finally {
        await page.close();
        if (entry) {
            clearInterval(entry.timer);
            await new Promise((resolveClose) => { entry.server.close(resolveClose); entry.server.closeAllConnections(); });
        }
        if (installed) await installer.removePreview({ workspace });
        for (const [path, content] of sources) assert.equal(await readFile(join(workspace, path), "utf8"), content);
        await rm(root, { recursive: true, force: true });
    }
});
