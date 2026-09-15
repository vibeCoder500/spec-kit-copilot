import { createRequire } from "node:module";
import { startFixture } from "../serve-fixture.mjs";

const require = createRequire(new URL("../../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json", import.meta.url));
const { test, expect } = require("@playwright/test");

for (const viewport of [{ width: 360, height: 780 }, { width: 768, height: 1024 }, { width: 1280, height: 900 }, { width: 1920, height: 1080 }]) {
    test(`SDD repository dropdown and pinned preview at ${viewport.width}`, async ({ page }, testInfo) => {
        const fixture = await startFixture({ canvas: "sdd", repositories: true });
        const url = new URL(fixture.url); url.searchParams.delete("readerProbe");
        const external = [];
        await page.setViewportSize(viewport);
        await page.route("**/*", async (route) => {
            if (new URL(route.request().url()).origin !== url.origin) { external.push("unexpected-request"); await route.abort(); }
            else await route.continue();
        });
        try {
            await page.goto(url.href, { waitUntil: "domcontentloaded" });
            await expect(page.getByRole("button", { name: "Connect Microsoft account", exact: true })).toBeVisible();
            expect(fixture.repositories.requests()).toBe(0);
            const draft = page.locator("#description"); await draft.fill("Keep my local draft");
            await page.getByRole("button", { name: "Connect Microsoft account", exact: true }).click();
            const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
            await expect(search).toBeEnabled();
            await expect(page.locator(".repo-account")).toContainText("synthetic@example.invalid");
            await search.click();
            const popup = page.locator(".repo-popup");
            await expect(popup).toBeVisible();
            await popup.locator('[data-kind="repository"]').first().click();
            await expect(popup.locator('[data-kind="root"]')).toHaveCount(2);
            await popup.getByRole("treeitem", { name: "specs", exact: true }).click();
            await popup.getByRole("treeitem", { name: "001-feature", exact: true }).click();
            await popup.getByRole("treeitem", { name: "spec.md", exact: true }).click();
            await expect(popup).toBeHidden();
            await expect(page.getByRole("heading", { name: "Remote specification", exact: true })).toBeVisible();
            await expect(page.getByRole("group", { name: "Artifact source", exact: true })).toContainText("Git commit aaaaaaaaaaaa");
            await expect(page.locator('.repo-preview .md-reader__clarify-button')).toHaveCount(0);
            await page.getByRole("link", { name: "Research", exact: true }).click();
            await expect(page.getByRole("heading", { name: "Remote research", exact: true })).toBeVisible();
            await page.getByRole("button", { name: "Previous artifact", exact: true }).click();
            await expect(page.getByRole("heading", { name: "Remote specification", exact: true })).toBeVisible();
            await page.screenshot({ path: testInfo.outputPath(`repositories-${viewport.width}.png`) });
            await page.locator('.repo-preview').getByRole("button", { name: "Back to repository", exact: true }).click();
            await expect(popup).toBeVisible();
            await expect(search).toBeFocused();
            await search.press("Escape");
            await page.getByRole("button", { name: "Return to local workspace", exact: true }).click();
            await expect(draft).toBeVisible();
            await expect(draft).toHaveValue("Keep my local draft");
            await search.fill("repository 2");
            await expect(popup.locator('[data-kind="repository"]')).toHaveCount(1);
            await expect(popup.locator('[data-kind="repository"]')).toContainText("Synthetic repository 2");
            await search.press("ArrowDown"); await search.press("Enter");
            await expect(popup.locator('[data-kind="root"]')).toHaveCount(2);
            await page.getByRole("button", { name: "Disconnect Microsoft account", exact: true }).click();
            await expect(search).toBeDisabled();
            await expect(draft).toBeVisible();
            await expect(page.locator(".repo-node")).toHaveCount(0);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            expect(fixture.dispatchCount()).toBe(0);
            expect(fixture.blockedWrites()).toBe(0);
            expect(fixture.workspaceChanged()).toBe(false);
            expect(external).toEqual([]);
        } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
    });
}

test("SDD clone requires explicit confirmation and reports manual-open readiness truthfully", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd", repositories: true });
    const url = new URL(fixture.url); url.searchParams.delete("readerProbe");
    try {
        await page.goto(url.href);
        await page.getByRole("button", { name: "Connect Microsoft account", exact: true }).click();
        const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
        await expect(search).toBeEnabled(); await search.click();
        await page.locator('.repo-popup [data-kind="repository"]').first().click();
        await expect(page.locator(".repo-selected-title")).toHaveText("Synthetic repository 1");
        await page.getByRole("button", { name: "Prepare local clone", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Confirm repository clone", exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("synthetic@example.invalid");
        await expect(dialog).toContainText("a".repeat(40));
        expect(fixture.repositories.gitCalls()).toBe(0);
        await dialog.getByRole("button", { name: "Cancel clone confirmation", exact: true }).click();
        await expect(dialog).toBeHidden();
        expect(fixture.repositories.gitCalls()).toBe(0);
        await page.getByRole("button", { name: "Prepare local clone", exact: true }).click();
        await dialog.getByRole("button", { name: "Confirm clone", exact: true }).click();
        await expect(page.locator(".repo-clone-status")).toContainText("Prepared for manual opening in Copilot App");
        await expect(page.getByRole("button", { name: "Copy prepared folder path", exact: true })).toBeVisible();
        expect(fixture.repositories.gitCalls()).toBeGreaterThan(0);
        expect(fixture.dispatchCount()).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("SDD browses distinct repository specs over HTTP without a clone request, Git call, or clone-directory write", async ({ page }) => {
    const fixture = await startFixture({ canvas: "sdd", repositories: true });
    const url = new URL(fixture.url); url.searchParams.delete("readerProbe");
    const repositoryRequests = [];
    const remoteDocuments = [];
    page.on("request", (request) => {
        const path = new URL(request.url()).pathname;
        if (path.startsWith("/api/repositories/")) repositoryRequests.push({ method: request.method(), path });
    });
    try {
        await page.goto(url.href);
        await page.getByRole("button", { name: "Connect Microsoft account", exact: true }).click();
        const search = page.getByRole("combobox", { name: "Search readable project repositories", exact: true });
        await expect(search).toBeEnabled();
        for (const [number, heading] of [[1, "Remote specification"], [2, "Second repository specification"]]) {
            await search.fill(`repository ${number}`);
            const popup = page.locator(".repo-popup");
            const repository = popup.locator('[data-kind="repository"]');
            await expect(repository).toHaveCount(1);
            await expect(repository).toContainText(`Synthetic repository ${number}`);
            await repository.click();
            await popup.getByRole("treeitem", { name: "specs", exact: true }).click();
            await popup.getByRole("treeitem", { name: "001-feature", exact: true }).click();
            const contentResponse = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/repositories/content");
            await popup.getByRole("treeitem", { name: "spec.md", exact: true }).click();
            const payload = await (await contentResponse).json();
            await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
            await expect(page.getByRole("group", { name: "Artifact source", exact: true })).toContainText(`Synthetic repository ${number}`);
            expect(payload.data.sourceKind).toBe("git-commit");
            remoteDocuments.push({ repositoryId: payload.data.source.repositoryId, revision: payload.data.revision });
            expect(fixture.repositories.gitCalls()).toBe(0);
            expect(await fixture.repositories.cloneFiles()).toEqual([]);
        }
        expect(new Set(remoteDocuments.map((document) => document.repositoryId)).size).toBe(2);
        expect(new Set(remoteDocuments.map((document) => document.revision)).size).toBe(2);
        expect(repositoryRequests.filter((request) => request.path.includes("/clone"))).toEqual([]);
        expect(repositoryRequests.filter((request) => request.path.endsWith("/content"))).toHaveLength(2);
        expect(fixture.dispatchCount()).toBe(0);
        expect(fixture.workspaceChanged()).toBe(false);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});