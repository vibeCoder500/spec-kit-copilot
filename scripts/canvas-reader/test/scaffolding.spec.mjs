import { createRequire } from "node:module";
import { startScaffoldingFixture } from "../fixtures/scaffolding.mjs";

const require = createRequire(new URL("../../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json", import.meta.url));
const { test, expect } = require("@playwright/test");
const SETUP = "Setup Spec Kit with the default organization bundle (recommended)";

test("The production provider starts setup only after target readiness and hands over without a button", async ({ page }) => {
    const fixture = await startScaffoldingFixture({ providerOpen: true, pauseBundle: true });
    try {
        await page.goto(fixture.url);
        await expect(page.locator('[data-step="bundle"]')).toHaveAttribute("data-status", "loading");
        await expect(page.getByRole("button", { name: SETUP, exact: true })).toHaveCount(0);
        expect(fixture.commands().filter(command => command.args[0] === "init")).toHaveLength(1);
        fixture.driver.resumeBundle();
        await expect(page.locator("#description")).toBeVisible();
        expect(fixture.driver.reloadCount()).toBe(1);
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("Verified launch starts setup automatically; refresh and reload never repeat installation or dispatch a prompt", async ({ page }) => {
    const fixture = await startScaffoldingFixture({ pauseBundle: true });
    try {
        await page.goto(fixture.url);
        await expect(page.getByRole("heading", { name: "Setting up this repository", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: SETUP, exact: true })).toHaveCount(0);
        await expect(page.locator('[data-step="bundle"]')).toHaveAttribute("data-status", "loading");
        await expect(page.locator("[data-step]")).toHaveCount(13);
        await expect(page.locator("#description,#cards,.repo-rail,.md-reader")).toHaveCount(0);
        await page.getByRole("button", { name: "Refresh setup state", exact: true }).click();
        await page.reload();
        await expect(page.getByRole("button", { name: SETUP, exact: true })).toHaveCount(0);
        expect(fixture.commands().filter(command => command.args[0] === "init")).toHaveLength(1);
        expect(fixture.commands().filter(command => command.args[0] === "bundle" && command.args[1] === "install")).toHaveLength(1);
        expect(fixture.dispatchCount()).toBe(0);
        fixture.driver.resumeBundle();
        await expect(page.locator("#description")).toBeVisible();
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

for (const width of [360, 1280]) {
    test(`Scaffolding streams component progress and returns to the original dashboard at ${width}`, async ({ page }, testInfo) => {
        const fixture = await startScaffoldingFixture({ bundleDelayMs: 220, oldCli: true });
        const original = await fixture.application();
        const unexpected = [];
        const origin = new URL(fixture.url).origin;
        await page.setViewportSize({ width, height: 900 });
        await page.route("**/*", async route => {
            if (new URL(route.request().url()).origin !== origin) { unexpected.push("external-request"); await route.abort(); }
            else await route.continue();
        });
        try {
            await page.goto(fixture.url);
            await expect(page.getByRole("button", { name: SETUP, exact: true })).toHaveCount(0);
            await expect(page.locator('[data-step="bundle"]')).toHaveAttribute("data-status", "loading");
            await expect(page.locator("[data-artifact]")).toHaveCount(8);
            await expect(page.locator('[data-artifact="bug"]')).toHaveAttribute("data-status", "completed");
            await expect(page.locator('[data-artifact="msd-constitution-sharedlib"]')).toHaveAttribute("data-status", "loading");
            await page.screenshot({ path: testInfo.outputPath(`scaffolding-progress-${width}.png`) });
            await page.reload();
            await expect(page.locator("[data-setup-state]")).toHaveAttribute("data-setup-state", /running|completed/);
            await expect(page.locator("#description")).toBeVisible();
            await expect(page.locator("#repositoryEntry")).toHaveCount(0);
            expect(await fixture.application()).toBe(original);
            expect(fixture.driver.reloadCount()).toBe(1);
            expect(fixture.commands().filter(command => command.args[0] === "init")).toHaveLength(1);
            expect(fixture.commands().filter(command => command.args[1] === "catalog" && command.args[2] === "add")).toHaveLength(4);
            expect(fixture.commands().filter(command => command.args[0] === "tool")).toHaveLength(1);
            expect(fixture.dispatchCount()).toBe(0);
            expect(unexpected).toEqual([]);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await page.screenshot({ path: testInfo.outputPath(`scaffolding-dashboard-${width}.png`) });
        } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
    });
}

test("Rendering alone cannot start setup; verified delayed host admission uses fresh consent without a button", async ({ page }) => {
    let now = Date.now();
    const fixture = await startScaffoldingFixture({ now: () => now, autoStart: false });
    try {
        await page.goto(fixture.url);
        await expect(page.getByRole("heading", { name: "Setting up this repository", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: SETUP, exact: true })).toHaveCount(0);
        await page.getByRole("button", { name: "Refresh setup state", exact: true }).click();
        await page.reload();
        expect(fixture.commands()).toEqual([]);
        now += 120_001;
        expect((await fixture.startAutomatically()).status).toBe("started");
        await expect(page.locator("#description")).toBeVisible();
        expect(fixture.commands().filter(command => command.args[0] === "init")).toHaveLength(1);
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("Automatic admission rejects busy work without queueing and only explicit retry starts setup after recovery", async ({ page }) => {
    const fixture = await startScaffoldingFixture({ busy: true });
    try {
        await page.goto(fixture.url);
        await expect(page.getByRole("button", { name: SETUP, exact: true })).toHaveCount(0);
        await expect(page.locator(".setup-message")).toContainText(/busy/i);
        await expect(page.getByRole("button", { name: "Retry organization setup", exact: true })).toBeDisabled();
        expect(fixture.commands()).toEqual([]);
        fixture.driver.setBusy(false);
        await page.getByRole("button", { name: "Refresh setup state", exact: true }).click();
        await expect(page.getByRole("button", { name: "Retry organization setup", exact: true })).toBeEnabled();
        expect(fixture.commands()).toEqual([]);
        expect((await fixture.state()).job).toBe(null);
        await page.getByRole("button", { name: "Retry organization setup", exact: true }).click();
        await expect(page.locator("#description")).toBeVisible();
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("Automatic setup shows authentication waiting and its one-time code without a Setup button", async ({ page }) => {
    const fixture = await startScaffoldingFixture({ authenticationRequired: true });
    try {
        await page.goto(fixture.url);
        await expect(page.locator('[data-step="authentication"]')).toHaveAttribute("data-status", "waiting");
        await expect(page.locator('[data-step="authentication"]')).toContainText("ABCD-1234");
        await expect(page.getByRole("button", { name: SETUP, exact: true })).toHaveCount(0);
        expect(fixture.commands().some(command => command.args[0] === "init")).toBe(false);
        fixture.driver.authenticate();
        await expect(page.locator("#description")).toBeVisible();
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("A failed component installation is explicit and retry retains completed setup without duplicate init or catalogs", async ({ page }) => {
    const fixture = await startScaffoldingFixture();
    fixture.driver.failBundle();
    try {
        await page.goto(fixture.url);
        await expect(page.locator("[data-setup-state]")).toHaveAttribute("data-setup-state", "error");
        await expect(page.locator('[data-step="bundle"]')).toHaveAttribute("data-status", "error");
        await expect(page.locator("[data-artifact][data-status=error]")).toHaveCount(8);
        expect(await page.locator("body").textContent()).not.toContain("synthetic-registry-token-for-tests");
        await expect(page.locator("#description")).toHaveCount(0);
        const count = fixture.commands().length;
        await page.reload();
        await expect(page.locator("[data-setup-state]")).toHaveAttribute("data-setup-state", "error");
        expect(fixture.commands()).toHaveLength(count);
        await page.getByRole("button", { name: "Retry organization setup", exact: true }).click();
        await expect(page.locator("#description")).toBeVisible();
        expect(fixture.commands().filter(command => command.args[0] === "init")).toHaveLength(1);
        expect(fixture.commands().filter(command => command.args[1] === "catalog" && command.args[2] === "add")).toHaveLength(4);
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("Cancellation remains cancelled on refresh until an explicit retry", async ({ page }) => {
    const fixture = await startScaffoldingFixture({ pauseBundle: true });
    try {
        await page.goto(fixture.url);
        await expect(page.locator('[data-step="bundle"]')).toHaveAttribute("data-status", "loading");
        await page.getByRole("button", { name: "Cancel setup", exact: true }).click();
        await expect(page.locator("[data-setup-state]")).toHaveAttribute("data-setup-state", "cancelled");
        const count = fixture.commands().length;
        await page.getByRole("button", { name: "Refresh setup state", exact: true }).click();
        await expect(page.locator("[data-setup-state]")).toHaveAttribute("data-setup-state", "cancelled");
        expect(fixture.commands()).toHaveLength(count);
        fixture.driver.resumeBundle();
        await page.getByRole("button", { name: "Retry organization setup", exact: true }).click();
        await expect(page.locator("#description")).toBeVisible();
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("Generated skill errors block handover and a successful final retry does not overwrite components", async ({ page }) => {
    const fixture = await startScaffoldingFixture();
    fixture.driver.setReloadErrors(["Synthetic skill failed to load."]);
    try {
        await page.goto(fixture.url);
        await expect(page.locator('[data-step="skills"]')).toHaveAttribute("data-status", "error");
        await expect(page.locator("[data-artifact][data-status=completed]")).toHaveCount(8);
        await expect(page.locator("#description")).toHaveCount(0);
        fixture.driver.setReloadErrors([]);
        await page.getByRole("button", { name: "Retry organization setup", exact: true }).click();
        await expect(page.locator("#description")).toBeVisible();
        expect(fixture.driver.reloadCount()).toBe(2);
        expect(fixture.commands().filter(command => command.args[0] === "init")).toHaveLength(1);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("Setup routes reject forged capabilities, paths, commands, duplicate keys and cross-origin requests", async ({ page }) => {
    const fixture = await startScaffoldingFixture({ autoStart: false });
    try {
        const base = new URL(fixture.url);
        const endpoint = route => { const url = new URL(`/api/scaffolding/${route}`, base); url.searchParams.set("cap", base.searchParams.get("cap")); return url.href; };
        const state = await (await page.request.get(endpoint("state"))).json();
        const valid = { contextId: state.data.contextId, requestId: "synthetic-forged-request" };
        expect((await page.request.get(new URL("/api/scaffolding/state", base).href)).status()).toBe(403);
        expect((await page.request.post(endpoint("start"), { headers: { Origin: base.origin }, data: { ...valid, workspacePath: "C:\\outside", command: "unsafe" } })).status()).toBe(400);
        expect((await page.request.post(endpoint("start"), { headers: { Origin: "https://example.invalid" }, data: valid })).status()).toBe(403);
        expect((await page.request.post(endpoint("start"), { headers: { Origin: base.origin, "Content-Type": "application/json" },
            data: `{"contextId":${JSON.stringify(valid.contextId)},"requestId":"one","requestId":"two"}` })).status()).toBe(400);
        for (const route of ["setup", "run", "clarify"]) {
            const url = new URL(`/api/${route}`, base); url.searchParams.set("cap", base.searchParams.get("cap"));
            expect((await page.request.post(url.href, { headers: { Origin: base.origin }, data: {} })).status()).toBe(409);
        }
        const stateUrl = new URL("/api/state", base); stateUrl.searchParams.set("cap", base.searchParams.get("cap"));
        const originalState = await (await page.request.get(stateUrl.href)).json();
        expect(originalState.projectRoot).toBe(fixture.workspacePath);
        expect(originalState.features).toEqual([]);
        expect(fixture.commands()).toEqual([]);
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});

test("An already-enabled repository bypasses scaffolding and never runs setup commands", async ({ page }) => {
    const fixture = await startScaffoldingFixture({ initialized: true, providerOpen: true });
    try {
        await page.goto(fixture.url);
        await expect(page.locator("#description")).toBeVisible();
        await expect(page.locator("#repositoryEntry,.setup-flow,[data-step]")).toHaveCount(0);
        await expect(page.getByRole("button", { name: SETUP, exact: true })).toHaveCount(0);
        await page.reload();
        await expect(page.locator("#description")).toBeVisible();
        expect(fixture.commands()).toEqual([]);
        expect(fixture.driver.reloadCount()).toBe(0);
        expect(fixture.dispatchCount()).toBe(0);
    } finally { await page.close(); expect((await fixture.stop()).cleaned).toBe(true); }
});
