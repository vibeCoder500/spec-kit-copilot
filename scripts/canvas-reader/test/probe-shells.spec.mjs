import { createRequire } from "node:module";
import { startFixture } from "../serve-fixture.mjs";

const require = createRequire(new URL("../../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json", import.meta.url));
const { test, expect } = require("@playwright/test");

for (const canvas of ["wizard", "sdd"]) {
    for (const width of [1280, 360]) {
        test(`${canvas} packaged probe opens and returns in its existing shell at ${width}px`, async ({ page }, testInfo) => {
            const fixture = await startFixture({ canvas });
            const origin = new URL(fixture.url).origin;
            const externalRequests = [];
            const pageErrors = [];
            page.on("pageerror", (error) => pageErrors.push(error.name));
            await page.route("**/*", async (route) => {
                const url = new URL(route.request().url());
                if (url.origin !== origin) {
                    externalRequests.push(url.hostname);
                    await route.abort();
                } else await route.continue();
            });
            try {
                await page.setViewportSize({ width, height: 900 });
                try { await page.goto(fixture.url, { waitUntil: "domcontentloaded" }); }
                catch { throw new Error("Owned probe browser navigation failed."); }
                if (canvas === "wizard") await page.locator('[data-tab="phases"]').click();
                const trigger = canvas === "wizard" ? page.locator('#phase-card [data-phase-action="view"]') : page.getByTitle("View spec.md", { exact: true });
                await expect(trigger).toBeVisible();
                const workflow = page.locator(canvas === "wizard" ? "#phase-card" : "#cards");
                const before = await workflow.textContent();
                await trigger.click();
                await expect(page.locator("[data-reader-id]")).toHaveAttribute("data-reader-state", "ready");
                await expect(page.locator("[data-reader-id]")).toHaveAttribute("data-revision", /^sha256:[0-9a-f]{64}$/);
                await expect(page.locator(".md-reader__identity")).toBeVisible();
                await expect(page.locator(".md-reader__identity")).toContainText("specs/999-canvas-preview-fixture/spec.md");
                await expect(page.locator(".md-reader__identity")).toContainText("Working-tree revision");
                await expect(page.locator(".md-reader__article").getByRole("heading", { name: "Canvas review fixture", exact: true })).toBeVisible();
                await expect(page.locator(".md-reader__article img, .md-reader__article script")).toHaveCount(0);
                const preview = page.locator(canvas === "wizard" ? "#phase-artifact-viewer" : "#aside");
                await preview.screenshot({ path: testInfo.outputPath(`${canvas}-${width}-probe.png`) });
                await page.locator(canvas === "wizard" ? ".artifact-viewer-back" : "#closeArt").click();
                await expect(page.locator("[data-reader-id]")).toHaveCount(0);
                await expect(trigger).toBeFocused();
                expect(await workflow.textContent()).toBe(before);
                expect(externalRequests).toEqual([]);
                expect(pageErrors).toEqual([]);
                expect(fixture.dispatchCount()).toBe(0);
                expect(fixture.blockedWrites()).toBe(0);
                expect(fixture.workspaceChanged()).toBe(false);
            } finally {
                await page.close();
                const result = await fixture.stop();
                expect(result.cleaned).toBe(true);
            }
        });
    }
}
