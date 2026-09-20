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

for (const route of ["current", "prepared"]) {
    test(`SDD ${route} entry preserves original workflow controls and artifact navigation`, async ({ page }) => {
        const baseline = await startFixture({ canvas: "sdd" });
        const fixture = await startFixture({ canvas: "sdd", repositoryEntry: true, repositories: route === "prepared", supportedEntryHost: route === "prepared" });
        try {
            await page.goto(baseline.url);
            await expect(page.getByTitle("View spec.md", { exact: true })).toBeVisible();
            const expected = await page.locator("#cards").textContent();
            await page.goto(fixture.url);
            if (route === "current") {
                await page.getByRole("button", { name: "Use current workspace", exact: true }).click();
                await expect(page.getByRole("status").filter({ hasText: "canvas opened" })).toBeVisible();
                expect(fixture.currentUrl()).toBeTruthy();
                await page.goto(fixture.currentUrl());
            } else {
                await page.getByRole("button", { name: "Connect Microsoft account", exact: true }).click();
                const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
                await expect(search).toBeEnabled(); await search.focus();
                await page.getByRole("option", { name: /Synthetic repository 1/ }).click();
                await page.getByRole("button", { name: "Confirm and clone", exact: true }).click();
                await expect(page.getByRole("status").filter({ hasText: "Spec Kit canvas ready." })).toBeVisible();
                expect(fixture.targetUrl()).toBeTruthy();
                await page.goto(fixture.targetUrl());
            }
            await expect(page.getByTitle("View spec.md", { exact: true })).toBeVisible();
            expect(await page.locator("#cards").textContent()).toBe(expected);
            await expect(page.locator('#repositoryEntry,.entry-flow,.repo-rail,link[href*="repository-entry"]')).toHaveCount(0);
            await page.getByTitle("View spec.md", { exact: true }).click();
            await expect(page.getByRole("heading", { name: "Canvas review fixture", exact: true })).toBeVisible();
            await page.getByRole("combobox", { name: "Artifacts", exact: true }).selectOption({ label: "research.md" });
            await expect(page.getByRole("heading", { name: "Fixture research", exact: true })).toBeVisible();
            await page.locator("#closeArt").click();
            expect(await page.locator("#cards").textContent()).toBe(expected);
            expect(fixture.dispatchCount()).toBe(0); expect(fixture.workspaceChanged()).toBe(false);
            if (route === "current") expect(fixture.entryHost.counts().starts).toBe(0);
            else expect(fixture.repositories.cloneCount()).toBe(1);
        } finally {
            await page.close(); expect((await baseline.stop()).cleaned).toBe(true); expect((await fixture.stop()).cleaned).toBe(true);
        }
    });
}
