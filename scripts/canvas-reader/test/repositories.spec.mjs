import { createRequire } from "node:module";
import { startFixture } from "../serve-fixture.mjs";

const require = createRequire(new URL("../../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json", import.meta.url));
const { test, expect } = require("@playwright/test");

for (const viewport of [{ width: 360, height: 780 }, { width: 768, height: 1024 }, { width: 1280, height: 900 }, { width: 1920, height: 1080 }]) {
    test(`SDD entry opens the current workspace offline at ${viewport.width}`, async ({ page }, testInfo) => {
        const fixture = await startFixture({ canvas: "sdd", repositoryEntry: true });
        const url = new URL(fixture.url); url.searchParams.delete("readerProbe");
        const external = [];
        await page.setViewportSize(viewport);
        await page.route("**/*", async (route) => {
            if (new URL(route.request().url()).origin !== url.origin) { external.push("unexpected-request"); await route.abort(); }
            else await route.continue();
        });
        try {
            await page.goto(url.href, { waitUntil: "domcontentloaded" });
            await expect(page.getByRole("heading", { name: "Choose a repository", exact: true })).toBeVisible();
            await expect(page.getByRole("button", { name: "Use current workspace", exact: true })).toBeEnabled();
            await expect(page.getByRole("combobox", { name: "Search readable project repositories", exact: true })).toBeDisabled();
            await expect(page.locator("#description,.repo-rail,.repo-preview,#artBody")).toHaveCount(0);
            await page.screenshot({ path: testInfo.outputPath(`entry-${viewport.width}.png`) });
            await page.getByRole("button", { name: "Use current workspace", exact: true }).click();
            await expect(page.getByRole("status").filter({ hasText: "canvas opened" })).toBeVisible();
            expect(fixture.entryHost.counts().opens).toBe(1);
            expect(fixture.entryHost.counts().starts).toBe(0);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            expect(fixture.dispatchCount()).toBe(0);
            expect(fixture.blockedWrites()).toBe(0);
            expect(fixture.workspaceChanged()).toBe(false);
            expect(external).toEqual([]);
        } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
    });
}

test("SDD direct entry preserves the original canvas and retired repository operations are rejected", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd" });
    try {
        await page.goto(fixture.url);
        await expect(page.locator("#description")).toBeVisible();
        await expect(page.locator("#repositoryEntry,.repo-rail,.repo-preview")).toHaveCount(0);
        const base = new URL(fixture.url);
        for (const path of ["context", "items", "content", "reference", "refresh", "clone", "clone/confirm", "clone/cancel"]) {
            const endpoint = new URL(`/api/repositories/${path}`, base);
            endpoint.searchParams.set("cap", base.searchParams.get("cap"));
            const response = await page.request.get(endpoint.href);
            expect([400, 404]).toContain(response.status());
        }
        expect(fixture.dispatchCount()).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("SDD entry reports no repository without sign-in and retains direct access", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd", repositoryEntry: true, entryRepository: false });
    try {
        await page.goto(fixture.url);
        await expect(page.getByRole("button", { name: "Use current workspace", exact: true })).toBeDisabled();
        await expect(page.getByRole("button", { name: "Open canvas directly", exact: true })).toBeEnabled();
        expect(fixture.entryHost.counts().starts).toBe(0);
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("SDD entry connects automatically once and respects refresh and Disconnect", async ({ page }, testInfo) => {
    const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, cloneOnlyEntryHost: true });
    try {
        await page.goto(fixture.url);
        const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
        await expect(search).toBeEnabled();
        expect(fixture.repositories.browserOpens()).toBe(1);
        await expect(page.getByRole("button", { name: "Connect Microsoft account", exact: true })).toBeHidden();
        await search.focus();
        await expect(page.getByRole("option", { name: /Synthetic repository 1/ })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath("entry-auto-connected.png"), fullPage: true });
        await page.getByRole("button", { name: "Refresh entry state", exact: true }).click();
        await page.reload();
        await expect(search).toBeEnabled();
        expect(fixture.repositories.browserOpens()).toBe(1);
        await page.getByRole("button", { name: "Disconnect Microsoft account", exact: true }).click();
        await expect(search).toBeDisabled();
        await page.getByRole("button", { name: "Refresh entry state", exact: true }).click();
        await page.reload();
        await expect(page.getByRole("button", { name: "Connect Microsoft account", exact: true })).toBeEnabled();
        await expect(search).toBeDisabled();
        expect(fixture.repositories.browserOpens()).toBe(1);
        await page.getByRole("button", { name: "Connect Microsoft account", exact: true }).click();
        await expect(search).toBeEnabled();
        expect(fixture.repositories.browserOpens()).toBe(2);
        expect(fixture.repositories.cloneCount()).toBe(0);
        expect(fixture.entryHost.counts().opens).toBe(0);
        expect(fixture.dispatchCount()).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("SDD entry offers explicit retry after automatic sign-in fails", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, cloneOnlyEntryHost: true });
    let attempts = 0;
    await page.route("**/api/repositories/connect?*", async route => {
        attempts++;
        if (attempts === 1) await route.fulfill({ status: 409, contentType: "application/json",
            body: JSON.stringify({ ok: false, error: { code: "interaction_required", message: "private-provider-diagnostic" } }) });
        else await route.continue();
    });
    try {
        await page.goto(fixture.url);
        const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
        const retry = page.getByRole("button", { name: "Connect Microsoft account", exact: true });
        await expect.poll(() => attempts).toBe(1);
        await expect(page.getByRole("status")).not.toBeEmpty();
        await expect(retry).toBeEnabled();
        await expect(search).toBeDisabled();
        await expect(page.getByRole("button", { name: "Use current workspace", exact: true })).toBeEnabled();
        await expect(page.getByRole("button", { name: "Open canvas directly", exact: true })).toBeEnabled();
        await expect(page.locator("body")).not.toContainText("private-provider-diagnostic");
        await page.getByRole("button", { name: "Refresh entry state", exact: true }).click();
        expect(attempts).toBe(1);
        expect(fixture.repositories.browserOpens()).toBe(0);
        await retry.click();
        await expect(search).toBeEnabled();
        expect(attempts).toBe(2);
        expect(fixture.repositories.browserOpens()).toBe(1);
        expect(fixture.repositories.cloneCount()).toBe(0);
        expect(fixture.dispatchCount()).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

for (const width of [360, 768, 1280, 1920]) {
    test(`SDD dropdown consent prepares one owned repository at ${width}`, async ({ page }, testInfo) => {
        const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, supportedEntryHost: true });
        await page.setViewportSize({ width, height: width === 360 ? 780 : 1000 });
        try {
            await page.goto(fixture.url);
            const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
            await expect(search).toBeEnabled();
            expect(fixture.repositories.browserOpens()).toBe(1);
            await search.focus();
            await expect(page.getByRole("option", { name: /Synthetic repository 1/ })).toBeVisible();
            await search.fill("repository 1");
            await expect(page.getByRole("option", { name: /Synthetic repository 1/ })).toBeVisible();
            await page.getByRole("button", { name: "Clear search", exact: true }).click();
            await expect(page.getByRole("option", { name: /Synthetic repository 1/ })).toBeVisible();
            await page.getByRole("option", { name: /Synthetic repository 1/ }).click();
            await expect(page.getByText("synthetic@example.invalid", { exact: true }).last()).toBeVisible();
            await expect(page.getByText("refs/heads/main", { exact: true })).toBeVisible();
            await expect(page.getByText("a".repeat(40), { exact: true })).toBeVisible();
            await expect(page.locator('[data-field="destination"]')).toContainText("SpecKitCanvas");
            expect(await fixture.repositories.cloneFiles()).toEqual([]);
            expect(fixture.repositories.artifactReads()).toBe(0);
            expect(fixture.repositories.gitCalls()).toBe(0);
            await page.getByRole("button", { name: "Cancel selection", exact: true }).click();
            await expect(search).toBeFocused();
            expect(await fixture.repositories.cloneFiles()).toEqual([]);
            await search.press("ArrowDown"); await search.press("Enter");
            await expect(page.getByRole("button", { name: "Confirm and clone", exact: true })).toBeEnabled();
            await page.screenshot({ path: testInfo.outputPath(`entry-consent-${width}.png`) });
            await page.getByRole("button", { name: "Confirm and clone", exact: true }).click();
            await expect(page.getByRole("status").filter({ hasText: /prepared|handoff|ready/i })).toBeVisible();
            expect(fixture.entryHost.counts().starts).toBe(1);
            expect(fixture.repositories.artifactReads()).toBe(0);
            expect(fixture.dispatchCount()).toBe(0);
            expect(fixture.workspaceChanged()).toBe(false);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await expect(page.locator(".repo-rail,.repo-preview,#description")).toHaveCount(0);
        } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
    });
}

for (const width of [360, 768, 1280, 1920]) {
    test(`SDD clone-only entry completes without switching workspaces at ${width}`, async ({ page }, testInfo) => {
        const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, cloneOnlyEntryHost: true });
        await page.setViewportSize({ width, height: width === 360 ? 780 : 1000 });
        await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(fixture.url).origin });
        try {
            await page.goto(fixture.url);
            const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
            await expect(search).toBeEnabled(); await search.focus();
            expect(fixture.repositories.browserOpens()).toBe(1);
            await page.getByRole("option", { name: /Synthetic repository 1/ }).click();
            await expect(page.locator('[data-field="workspace"]')).toHaveText("Unchanged");
            const destination = await page.locator('[data-field="destination"]').textContent();
            expect(fixture.repositories.gitCalls()).toBe(0);
            expect(await fixture.repositories.cloneFiles()).toEqual([]);
            await page.getByRole("button", { name: "Confirm and clone", exact: true }).click();
            await expect(page.getByRole("status").filter({ hasText: "Clone complete." })).toBeVisible();
            await expect(page.getByText("Current workspace unchanged. Automatic workspace switching is unavailable.", { exact: true })).toBeVisible();
            await expect(page.getByRole("button", { name: "Retry handoff", exact: true })).toHaveCount(0);
            await expect(page.getByRole("button", { name: "Use current workspace", exact: true })).toBeEnabled();
            await page.getByRole("button", { name: "Copy checkout path", exact: true }).click();
            await expect(page.getByRole("status").filter({ hasText: "Checkout path copied." })).toBeVisible();
            expect(await page.evaluate(() => globalThis.navigator.clipboard.readText())).toBe(destination);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await page.screenshot({ path: testInfo.outputPath(`entry-clone-complete-${width}.png`), fullPage: true });
            await page.reload();
            await expect(page.getByRole("status").filter({ hasText: "Clone complete." })).toBeVisible();
            await page.getByRole("button", { name: "Disconnect Microsoft account", exact: true }).click();
            await expect(page.getByRole("button", { name: "Connect Microsoft account", exact: true })).toBeVisible();
            await page.getByRole("button", { name: "Connect Microsoft account", exact: true }).click();
            const retained = page.getByRole("region", { name: "Cloned repositories", exact: true });
            await expect(retained).toBeVisible();
            await expect(retained.locator(".entry-path")).toHaveText(destination);
            await expect(retained.getByRole("button", { name: "Copy checkout path", exact: true })).toBeEnabled();
            await expect(page.getByRole("button", { name: "Retry handoff", exact: true })).toHaveCount(0);
            expect(fixture.appLaunches()).toEqual([]);
            const openCheckout = retained.getByRole("button", { name: "Open in Copilot App", exact: true });
            await expect(openCheckout).toBeEnabled();
            fixture.entryHost.setActivity("busy");
            await page.getByRole("button", { name: "Refresh entry state", exact: true }).click();
            await expect(openCheckout).toBeDisabled();
            fixture.entryHost.setActivity("idle");
            await page.getByRole("button", { name: "Refresh entry state", exact: true }).click();
            await expect(openCheckout).toBeEnabled();
            expect(fixture.appLaunches()).toEqual([]);
            await openCheckout.click();
            await expect(page.getByRole("status").filter({ hasText: "Open request sent to Copilot App." })).toBeVisible();
            expect(fixture.appLaunches()).toEqual([{ destination }]);
            expect(fixture.repositories.cloneCount()).toBe(1);
            expect(fixture.entryHost.counts().starts).toBe(1);
            expect(fixture.entryHost.counts().handoffs).toBe(0);
            expect(fixture.entryHost.counts().reconciliations).toBe(0);
            expect(fixture.entryHost.counts().opens).toBe(0);
            expect(fixture.dispatchCount()).toBe(0);
            expect(fixture.workspaceChanged()).toBe(false);
        } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
    });
}

test("SDD checkout open failure preserves the clone and requires an explicit retry", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, cloneOnlyEntryHost: true });
    fixture.setAppLaunchError("app_launch_failed");
    try {
        await page.goto(fixture.url);
        const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
        await expect(search).toBeEnabled(); await search.focus();
        await page.getByRole("option", { name: /Synthetic repository 1/ }).click();
        await page.getByRole("button", { name: "Confirm and clone", exact: true }).click();
        await expect(page.getByRole("status").filter({ hasText: "Clone complete." })).toBeVisible();
        const openCheckout = page.getByRole("button", { name: "Open in Copilot App", exact: true });
        await openCheckout.click();
        await expect(page.getByRole("status").filter({ hasText: "The Copilot App open request failed. The checkout has been preserved." })).toBeVisible();
        await expect(page.getByRole("button", { name: "Copy checkout path", exact: true })).toBeEnabled();
        fixture.setAppLaunchError(undefined);
        await page.getByRole("button", { name: "Refresh entry state", exact: true }).click();
        expect(fixture.appLaunches()).toEqual([]);
        await openCheckout.click();
        await expect(page.getByRole("status").filter({ hasText: "Open request sent to Copilot App." })).toBeVisible();
        expect(fixture.appLaunches()).toHaveLength(1);
        expect(fixture.repositories.cloneCount()).toBe(1);
        expect(fixture.entryHost.counts().handoffs).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("SDD entry cancels only an in-progress owned preparation", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, supportedEntryHost: true });
    fixture.repositories.holdClone();
    try {
        await page.goto(fixture.url);
        const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
        await expect(search).toBeEnabled(); await search.focus();
        await page.getByRole("option", { name: /Synthetic repository 1/ }).click();
        await page.getByRole("button", { name: "Confirm and clone", exact: true }).click();
        await expect(page.getByRole("button", { name: "Cancel preparation", exact: true })).toBeEnabled();
        await page.getByRole("button", { name: "Cancel preparation", exact: true }).click();
        await expect(page.getByRole("status").filter({ hasText: "Repository preparation cancelled." })).toBeVisible();
        expect(fixture.repositories.cloneCount()).toBe(1);
        expect(fixture.entryHost.counts().handoffs).toBe(0);
        expect(fixture.dispatchCount()).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("SDD entry rejects a busy admission race and does not resume on idle", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, supportedEntryHost: true });
    fixture.entryHost.beforeAdmission(() => fixture.entryHost.setActivity("busy"));
    try {
        await page.goto(fixture.url);
        const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
        await expect(search).toBeEnabled(); await search.focus();
        await page.getByRole("option", { name: /Synthetic repository 1/ }).click();
        await page.getByRole("button", { name: "Confirm and clone", exact: true }).click();
        await expect(page.getByRole("status").filter({ hasText: /busy/i })).toBeVisible();
        expect(fixture.repositories.gitCalls()).toBe(0);
        expect(await fixture.repositories.cloneFiles()).toEqual([]);
        fixture.entryHost.setActivity("idle");
        await page.getByRole("button", { name: "Refresh entry state", exact: true }).click();
        await expect(page.getByRole("button", { name: "Confirm and clone", exact: true })).toBeDisabled();
        expect(fixture.repositories.cloneCount()).toBe(0);
        expect(fixture.entryHost.counts().starts).toBe(0);
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

for (const outcome of ["unknown", "in_progress"]) {
    test(`SDD retained preparation reconciles ${outcome} without cloning or switching again`, async ({ page }) => {
        const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, supportedEntryHost: true });
        fixture.entryHost.setOutcome(outcome);
        try {
            await page.goto(fixture.url);
            const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
            await expect(search).toBeEnabled(); await search.focus();
            await page.getByRole("option", { name: /Synthetic repository 1/ }).click();
            await page.getByRole("button", { name: "Confirm and clone", exact: true }).click();
            const retry = page.getByRole("button", { name: "Retry handoff", exact: true });
            await expect(retry).toBeEnabled();
            expect(fixture.repositories.cloneCount()).toBe(1);
            expect(fixture.entryHost.counts().handoffs).toBe(1);
            await retry.click();
            await expect(retry).toBeEnabled();
            expect(fixture.entryHost.counts().reconciliations).toBe(1);
            expect(fixture.entryHost.counts().handoffs).toBe(1);
            expect(fixture.repositories.cloneCount()).toBe(1);
            expect(fixture.dispatchCount()).toBe(0);
            expect(fixture.workspaceChanged()).toBe(false);
            await expect(page.locator("#description")).toHaveCount(0);
        } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
    });
}

test("SDD activation stays guarded until explicit same-target recovery verifies the original canvas", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, supportedEntryHost: true });
    fixture.entryHost.setOutcome("workspace_activated");
    try {
        await page.goto(fixture.url);
        const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
        await expect(search).toBeEnabled(); await search.focus();
        await page.getByRole("option", { name: /Synthetic repository 1/ }).click();
        await page.getByRole("button", { name: "Confirm and clone", exact: true }).click();
        const retry = page.getByRole("button", { name: "Retry handoff", exact: true });
        await expect(retry).toBeEnabled();
        expect(fixture.targetUrl()).toBe(null);
        expect(fixture.entryHost.events()).toEqual(["workspace_activated", "guarded_canvas_open"]);
        const source = new URL(fixture.url);
        const bypass = new URL("/api/entry/direct", source); bypass.searchParams.set("cap", source.searchParams.get("cap"));
        const denied = await page.request.post(bypass.href, { headers: { Origin: source.origin }, data: { requestId: "synthetic-bypass" } });
        expect(denied.ok()).toBe(false);
        fixture.entryHost.setOutcome("canvas_ready");
        await retry.click();
        await expect(page.getByRole("status").filter({ hasText: "Spec Kit canvas ready." })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Choose a repository", exact: true })).toBeHidden();
        expect(fixture.repositories.cloneCount()).toBe(1);
        expect(fixture.entryHost.counts().handoffs).toBe(1);
        expect(fixture.entryHost.counts().reconciliations).toBe(1);
        expect(fixture.entryHost.events()).toEqual(["workspace_activated", "guarded_canvas_open", "guarded_canvas_open", "target_verified", "canvas_ready"]);
        const target = fixture.targetUrl(); expect(target).toBeTruthy();
        await page.goto(target);
        await expect(page.locator("#description")).toBeVisible();
        await expect(page.locator("#repositoryEntry,.repo-rail,.repo-preview")).toHaveCount(0);
        const targetBase = new URL(target);
        const artifact = new URL("/api/artifact", targetBase);
        artifact.searchParams.set("cap", targetBase.searchParams.get("cap")); artifact.searchParams.set("feature", "999-canvas-preview-fixture"); artifact.searchParams.set("stage", "specify");
        const response = await page.request.get(artifact.href);
        expect(response.ok()).toBe(true);
        expect((await response.json()).content).toContain("Canvas review fixture");
        expect(fixture.dispatchCount()).toBe(0); expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});