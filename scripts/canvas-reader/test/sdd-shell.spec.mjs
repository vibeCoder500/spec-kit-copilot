import { createRequire } from "node:module";
import { startFixture } from "../serve-fixture.mjs";

const require = createRequire(new URL("../../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json", import.meta.url));
const { test, expect } = require("@playwright/test");

test("SDD primary review stays in its artifact view and restores its feature", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd" });
    const url = new URL(fixture.url);
    url.searchParams.delete("readerProbe");
    const external = [];
    await page.route("**/*", async (route) => {
        if (new URL(route.request().url()).origin !== url.origin) { external.push("external"); await route.abort(); }
        else await route.continue();
    });
    try {
        await page.goto(url.href, { waitUntil: "domcontentloaded" });
        const trigger = page.getByTitle("View spec.md", { exact: true });
        await expect(trigger).toBeVisible();
        const before = await page.locator("#cards").textContent();
        await trigger.click();
        const preview = page.locator("#aside");
        await expect(preview.locator("[data-review-context]")).toHaveAttribute("data-review-context", /^ctx_/, { timeout: 3000 });
        await expect(preview.locator("[data-reader-id]")).toHaveAttribute("data-revision", /^sha256:[a-f0-9]{64}$/);
        await expect(preview.getByRole("heading", { name: "Canvas review fixture", exact: true })).toBeVisible();
        await page.locator("#closeArt").click();
        await expect(page.locator("[data-reader-id]")).toHaveCount(0);
        await expect(trigger).toBeFocused();
        expect(await page.locator("#cards").textContent()).toBe(before);
        expect(fixture.dispatchCount()).toBe(0);
        expect(fixture.blockedWrites()).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
        expect(external).toEqual([]);
    } finally {
        await page.close();
        expect((await fixture.stop()).cleaned).toBe(true);
    }
});

test("SDD related artifacts, references, and history preserve the selected feature", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd" });
    const url = new URL(fixture.url);
    url.searchParams.delete("readerProbe");
    try {
        await page.goto(url.href, { waitUntil: "domcontentloaded" });
        const trigger = page.getByTitle("View spec.md", { exact: true });
        await expect(trigger).toBeVisible();
        const before = await page.locator("#cards").textContent();
        await trigger.click();
        const selector = page.getByRole("combobox", { name: "Artifacts", exact: true });
        await expect(selector).toBeVisible({ timeout: 3000 });
        await selector.selectOption({ label: "research.md" });
        await expect(page.getByRole("heading", { name: "Fixture research", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Previous artifact", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Canvas review fixture", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Next artifact", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Fixture research", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Previous artifact", exact: true }).click();
        await page.getByRole("link", { name: "Research", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Fixture research", exact: true })).toBeVisible();
        await page.locator("#closeArt").click();
        expect(await page.locator("#cards").textContent()).toBe(before);
        await expect(trigger).toBeFocused();
        expect(fixture.dispatchCount()).toBe(0);
        expect(fixture.blockedWrites()).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});
