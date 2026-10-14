import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { createScaffoldingService, hasPendingScaffolding, mergeRegistryAuthentication, ORGANIZATION_SETUP, parseOrganizationSetup,
    verifyOrganizationArtifacts, versionAtLeast } from "../src/scaffolding.ts";
import type { ScaffoldingService } from "../src/scaffolding.ts";
import { createScaffoldingTestWorkspace, TEST_ARTIFACTS, TEST_BUNDLE, TEST_CATALOG, TEST_REGISTRY_TOKEN, TEST_WORKFLOW } from "./scaffolding-fixture.ts";

async function fixture(run: (workspace: Awaited<ReturnType<typeof createScaffoldingTestWorkspace>>, service: ScaffoldingService) => Promise<void>,
    options: Parameters<typeof createScaffoldingTestWorkspace>[0] = {}) {
    const workspace = await createScaffoldingTestWorkspace(options);
    const service = await createScaffoldingService(workspace.options);
    try { await run(workspace, service); }
    finally { workspace.resumeBundle(); workspace.authenticate(); await service.settled(); service.dispose(); await workspace.cleanup(); }
}

async function waitFor(service: ScaffoldingService, predicate: (state: Awaited<ReturnType<ScaffoldingService["state"]>>) => boolean) {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
        const state = await service.state();
        if (predicate(state)) return state;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail("Synthetic setup did not reach its expected observable state.");
}

test("The live registry contract selects eight default artifacts, not the standalone Squad extension", () => {
    const plan = parseOrganizationSetup(TEST_WORKFLOW, TEST_BUNDLE, TEST_CATALOG);
    assert.equal(plan.minimumVersion, "1.1.0"); assert.equal(plan.version, "1.0.0");
    assert.equal(plan.artifacts.length, 8);
    assert.deepEqual(plan.artifacts.map(({ id }) => id), TEST_ARTIFACTS.map(({ id }) => id));
    assert.equal(plan.artifacts.some(({ id }) => id === "squad"), false);
    assert.equal(ORGANIZATION_SETUP.squadUrl, "https://msft.ghe.com/1eh-msd/msd-speckit-registry/releases/download/v1.0.0/squad-v1.0.0.zip");
    assert.equal(versionAtLeast("0.12.0", plan.minimumVersion), false);
    assert.equal(versionAtLeast("1.1.0", plan.minimumVersion), true);
    assert.equal(versionAtLeast("1.1.3", plan.minimumVersion), true);
    assert.equal(versionAtLeast("1.1", plan.minimumVersion), false);
});

test("Incompatible manifests, duplicate artifacts, unsupported components and non-Copilot initialization fail closed", () => {
    for (const mutate of [
        (bundle: Record<string, unknown>) => { bundle.provides = { workflows: [{ id: "unreviewed" }] }; },
        (bundle: Record<string, unknown>) => { bundle.bundle = { id: "another-bundle", version: "1.0.0" }; },
        (bundle: Record<string, unknown>) => { bundle.provides = { extensions: [{ id: "../outside", version: "1.0.0" }] }; },
        (bundle: Record<string, unknown>) => { bundle.provides = { extensions: [{ id: "duplicate", version: "1.0.0" }, { id: "duplicate", version: "1.0.0" }] }; },
    ]) {
        const bundle: Record<string, unknown> = JSON.parse(TEST_BUNDLE); mutate(bundle);
        assert.throws(() => parseOrganizationSetup(TEST_WORKFLOW, JSON.stringify(bundle), TEST_CATALOG), { code: "scaffolding_registry_invalid" });
    }
    assert.throws(() => parseOrganizationSetup(TEST_WORKFLOW.replace('"copilot"', '"claude"'), TEST_BUNDLE, TEST_CATALOG), { code: "scaffolding_registry_invalid" });
    assert.throws(() => parseOrganizationSetup(TEST_WORKFLOW, TEST_BUNDLE, '{"bundles":{"msd-bundle":{"version":"2.0.0"}}}'), { code: "scaffolding_registry_invalid" });
});

test("Registry authentication covers all three GHES hosts without persisting tokens or changing unrelated providers", () => {
    const unrelated = { hosts: ["github.com", "msft.ghe.com"], provider: "github", auth: "bearer", token_env: "GH_TOKEN" };
    const merged = mergeRegistryAuthentication({ custom: "retained", providers: [unrelated] });
    assert.equal(merged.custom, "retained");
    assert.deepEqual(merged.providers[0], { ...unrelated, hosts: ["github.com"] });
    assert.deepEqual(merged.providers[1], { hosts: ["msft.ghe.com", "raw.msft.ghe.com", "api.msft.ghe.com"],
        provider: "github", auth: "bearer", token_env: "GH_ENTERPRISE_TOKEN" });
    assert.equal(JSON.stringify(merged).includes(TEST_REGISTRY_TOKEN), false);
    assert.deepEqual(mergeRegistryAuthentication(merged), merged);
    assert.throws(() => mergeRegistryAuthentication({ providers: "invalid" }), { code: "scaffolding_storage_invalid" });
});

test("Opening or refreshing scaffolding does not sign in, install tools, write configuration, or initialize the repository", () => fixture(async (workspace, service) => {
    for (let index = 0; index < 3; index++) {
        const state = await service.state();
        assert.equal(state.canStart, true); assert.equal(state.job, null);
    }
    assert.equal(workspace.calls.length, 0);
    assert.equal(existsSync(join(workspace.workspacePath, ".specify")), false);
    assert.equal(existsSync(join(workspace.home, ".specify")), false);
    assert.equal(await hasPendingScaffolding(workspace.workspacePath, workspace.home), false);
}));

test("Verified automatic launch starts one background job without a renderer and reopening never repeats it", () => fixture(async (workspace, service) => {
    workspace.pauseBundle();
    const admissions = await Promise.all(Array.from({ length: 8 }, () => service.startAutomatically()));
    assert.ok(admissions.every(admission => admission.status === "started"));
    const running = await waitFor(service, state => state.job?.steps.some(step => step.id === "bundle" && step.status === "loading") === true);
    const reopened = await createScaffoldingService(workspace.options);
    try {
        assert.deepEqual(await reopened.startAutomatically(), { status: "retained" });
        assert.equal((await reopened.state()).job?.id, running.job?.id);
        workspace.resumeBundle(); await service.settled();
        assert.equal((await service.state()).job?.status, "completed");
        const calls = workspace.calls.length;
        await service.startAutomatically(); await reopened.startAutomatically();
        assert.equal(workspace.calls.length, calls);
        assert.equal(workspace.calls.filter(command => command.args[0] === "init").length, 1);
        assert.equal(workspace.calls.filter(command => command.args[0] === "bundle" && command.args[1] === "install").length, 1);
        const recordPath = join(workspace.home, "SpecKitCanvas", "scaffolding", `${createHash("sha256").update(workspace.workspacePath).digest("hex")}.json`);
        const saved = JSON.parse(await readFile(recordPath, "utf8"));
        assert.equal(saved.requests.length, 1); assert.match(saved.requests[0], /^automatic-/);
    } finally { reopened.dispose(); }
}));

test("Already-initialized repositories do not run automatic setup, authentication or skill reload", () => fixture(async (workspace, service) => {
    assert.deepEqual(await service.startAutomatically(), { status: "retained" });
    assert.equal((await service.state()).job, null);
    assert.deepEqual(workspace.calls, []);
    assert.equal(workspace.reloadCount(), 0);
}, { initialized: true }));

test("Failed automatic admission is visible, never queues on idle recovery, and accepts only an explicit retry", () => fixture(async (workspace, service) => {
    workspace.setBusy(true);
    assert.deepEqual(await service.startAutomatically(), { status: "error", code: "session_busy" });
    assert.equal((await service.state()).automaticStartError, "session_busy");
    assert.deepEqual(workspace.calls, []);
    workspace.setBusy(false);
    await service.startAutomatically();
    const state = await service.state();
    assert.equal(state.job, null); assert.equal(state.canStart, true);
    assert.deepEqual(workspace.calls, []);
    await service.start(state.contextId, "explicit-admission-retry"); await service.settled();
    assert.equal((await service.state()).automaticStartError, null);
    assert.equal((await service.state()).job?.status, "completed");
}));

test("Cancelled automatic setup is retained across reopening until explicit retry", () => fixture(async (workspace, service) => {
    workspace.pauseBundle(); await service.startAutomatically();
    const running = await waitFor(service, state => state.job?.steps.some(step => step.id === "bundle" && step.status === "loading") === true);
    await service.cancel(running.job!.id, "automatic-cancel"); await service.settled();
    const reopened = await createScaffoldingService(workspace.options);
    try {
        const calls = workspace.calls.length;
        assert.deepEqual(await reopened.startAutomatically(), { status: "retained" });
        assert.equal((await reopened.state()).job?.status, "cancelled");
        assert.equal(workspace.calls.length, calls);
        workspace.resumeBundle();
        await reopened.start((await reopened.state()).contextId, "explicit-cancelled-retry"); await reopened.settled();
        assert.equal((await reopened.state()).job?.status, "completed");
    } finally { reopened.dispose(); }
}));

test("One explicit job upgrades an old CLI, bootstraps skills, configures four catalogs, verifies every artifact and hands back once", () => fixture(async (workspace, service) => {
    const before = await readFile(join(workspace.workspacePath, "application.ts"));
    const state = await service.state();
    const admitted = await service.start(state.contextId, "request-1");
    assert.equal(admitted.job?.status, "running");
    await service.settled();
    const finished = await service.state();
    assert.equal(finished.job?.status, "completed");
    assert.equal(finished.job?.steps.length, 13);
    assert.ok(finished.job?.steps.every(step => ["completed", "skipped"].includes(step.status)));
    assert.equal(finished.job?.artifacts.length, 8);
    assert.ok(finished.job?.artifacts.every(artifact => artifact.status === "completed"));
    assert.equal(workspace.reloadCount(), 1);
    assert.equal(workspace.calls.filter(command => command.args[0] === "init").length, 1);
    assert.equal(workspace.calls.filter(command => command.args[1] === "catalog" && command.args[2] === "add").length, 4);
    assert.equal(workspace.calls.filter(command => command.args[0] === "tool").length, 1);
    assert.equal(workspace.calls.some(command => command.args.includes("--from")), false);
    assert.deepEqual(await readFile(join(workspace.workspacePath, "application.ts")), before);
    const auth = await readFile(join(workspace.home, ".specify", "auth.json"), "utf8");
    assert.equal(auth.includes(TEST_REGISTRY_TOKEN), false);
    const progress = join(workspace.home, "SpecKitCanvas", "scaffolding");
    for (const filename of await readdir(progress)) assert.equal((await readFile(join(progress, filename), "utf8")).includes(TEST_REGISTRY_TOKEN), false);
    assert.equal(await hasPendingScaffolding(workspace.workspacePath, workspace.home), false);
    assert.deepEqual(await service.continue("open-1"), { renderer: "workflow" });
    assert.equal(workspace.continuationCount(), 1);
    await verifyOrganizationArtifacts(workspace.workspacePath, parseOrganizationSetup(TEST_WORKFLOW, TEST_BUNDLE, TEST_CATALOG));
}, { oldCli: true }));

test("Duplicate requests and another canvas attach to the same background job without repeating installation", () => fixture(async (workspace, service) => {
    workspace.pauseBundle();
    const state = await service.state();
    await service.start(state.contextId, "request-once");
    await waitFor(service, state => state.job?.steps.some(step => step.id === "bundle" && step.status === "loading") === true);
    const duplicate = await service.start(state.contextId, "request-once");
    const another = await createScaffoldingService(workspace.options);
    try {
        assert.equal((await another.state()).job?.id, duplicate.job?.id);
        await assert.rejects(service.start(state.contextId, "request-other"), { code: "scaffolding_conflict" });
        assert.equal(workspace.calls.filter(command => command.args[0] === "init").length, 1);
    } finally { another.dispose(); workspace.resumeBundle(); }
    await service.settled();
    const count = workspace.calls.length;
    await service.start((await service.state()).contextId, "request-once");
    assert.equal(workspace.calls.length, count);
}));

test("An out-of-date organization mirror cannot satisfy the live minimum; official PyPI is retried and independently verified", () => fixture(async (workspace, service) => {
    await service.start((await service.state()).contextId, "mirror-fallback"); await service.settled();
    const state = await service.state();
    assert.equal(state.job?.status, "completed");
    const installs = workspace.calls.filter(command => command.args[0] === "tool");
    assert.equal(installs.length, 2);
    assert.equal(installs[0]!.env.UV_DEFAULT_INDEX, "https://packagefeedproxy.microsoft.io/pypi/simple/");
    assert.equal(installs[1]!.env.UV_DEFAULT_INDEX, "https://pypi.org/simple/");
    assert.equal(installs[1]!.env.GH_ENTERPRISE_TOKEN, undefined);
    assert.match(state.job!.steps.find(step => step.id === "specify-cli")!.detail!, /1\.1\.3/);
}, { oldCli: true, mirrorVersion: "1.0.13" }));

test("Sign-in is visible as waiting; the device code is transient and credentials never enter saved progress", () => fixture(async (workspace, service) => {
    await service.start((await service.state()).contextId, "auth-request");
    const waiting = await waitFor(service, state => state.job?.status === "waiting" &&
        state.job.steps.find(step => step.id === "authentication")?.detail?.includes("ABCD-1234") === true);
    assert.match(waiting.job!.steps.find(step => step.id === "authentication")!.detail!, /ABCD-1234/);
    const directory = join(workspace.home, "SpecKitCanvas", "scaffolding");
    const saved = await readFile(join(directory, (await readdir(directory)).find(name => name.endsWith(".json"))!), "utf8");
    assert.doesNotMatch(saved, /ABCD-1234|synthetic-registry-token-for-tests/);
    workspace.authenticate(); await service.settled();
    assert.equal((await service.state()).job?.status, "completed");
}, { authenticationRequired: true }));

test("Busy, stale and changed repository admission rejects without queued setup or native commands", () => fixture(async (workspace, service) => {
    const state = await service.state();
    workspace.setBusy(true);
    await assert.rejects(service.start(state.contextId, "busy-request"), { code: "session_busy" });
    workspace.setBusy(false);
    await assert.rejects(service.start(state.contextId, "stale-request"), { code: "context_changed" });
    const fresh = await service.state();
    workspace.changeIdentity();
    await assert.rejects(service.start(fresh.contextId, "changed-repository"), { code: "context_changed" });
    assert.equal(workspace.calls.length, 0);
    assert.equal(existsSync(join(workspace.workspacePath, ".specify")), false);
}));

test("Failure is explicit and an explicit retry preserves initialization and catalogs while completing the default bundle", () => fixture(async (workspace, service) => {
    workspace.failBundle();
    await service.start((await service.state()).contextId, "failed-request"); await service.settled();
    const failure = await service.state();
    assert.equal(failure.job?.status, "error");
    assert.equal(failure.job?.steps.find(step => step.id === "bundle")?.status, "error");
    assert.ok(failure.job?.artifacts.every(artifact => artifact.status === "error"));
    assert.doesNotMatch(failure.job?.message ?? "", /synthetic-registry-token-for-tests/);
    assert.equal(await hasPendingScaffolding(workspace.workspacePath, workspace.home), true);
    await assert.rejects(service.continue("not-ready"), { code: "scaffolding_verification_failed" });
    await service.start(failure.contextId, "explicit-retry"); await service.settled();
    assert.equal((await service.state()).job?.status, "completed");
    assert.equal(workspace.calls.filter(command => command.args[0] === "init").length, 1);
    assert.equal(workspace.calls.filter(command => command.args[1] === "catalog" && command.args[2] === "add").length, 4);
    assert.equal(workspace.calls.filter(command => command.args[0] === "bundle" && command.args[1] === "install").length, 2);
}));

test("Cancellation stops the admitted command, retains completed steps and never automatically resumes", () => fixture(async (workspace, service) => {
    workspace.pauseBundle();
    await service.start((await service.state()).contextId, "cancel-request");
    const running = await waitFor(service, state => state.job?.steps.some(step => step.id === "bundle" && step.status === "loading") === true);
    await service.cancel(running.job!.id, "cancel-1"); await service.settled();
    const cancelled = await service.state();
    assert.equal(cancelled.job?.status, "cancelled");
    assert.equal(cancelled.job?.steps.find(step => step.id === "initialize")?.status, "completed");
    const count = workspace.calls.length;
    await service.state(); await service.state();
    assert.equal(workspace.calls.length, count);
    workspace.resumeBundle();
    await service.start(cancelled.contextId, "explicit-cancel-retry"); await service.settled();
    assert.equal((await service.state()).job?.status, "completed");
}));

test("Artifact verification and skill reload errors block dashboard handover; retry reloads without overwriting existing components", () => fixture(async (workspace, service) => {
    workspace.setReloadErrors(["Synthetic generated skill failed to load."]);
    await service.start((await service.state()).contextId, "reload-error"); await service.settled();
    const failed = await service.state();
    assert.equal(failed.job?.status, "error"); assert.equal(failed.job?.steps.find(step => step.id === "skills")?.status, "error");
    await assert.rejects(service.continue("not-loaded"), { code: "scaffolding_verification_failed" });
    workspace.setReloadErrors([]);
    await service.start(failed.contextId, "reload-retry"); await service.settled();
    const completed = await service.state();
    assert.equal(completed.job?.status, "completed");
    assert.ok(completed.job?.artifacts.every(artifact => artifact.status === "skipped"));
    await writeFile(join(workspace.workspacePath, ".specify", "presets", ".registry"), '{"schema_version":"1.0","presets":{}}');
    await assert.rejects(service.continue("changed-artifacts"), { code: "scaffolding_verification_failed" });
    assert.equal(workspace.continuationCount(), 0);
}));

test("Redirected managed paths and conflicting catalog policy are not overwritten", () => fixture(async (workspace, service) => {
    const outside = join(workspace.home, "outside"); await mkdir(outside);
    await symlink(outside, join(workspace.workspacePath, ".github"), process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(service.start((await service.state()).contextId, "redirect-request"), { code: "scaffolding_storage_invalid" });
    assert.equal(workspace.calls.length, 0); assert.deepEqual(await readdir(outside), []);
}));

test("Dead setup lock recovery is explicit and never overwrites a live owner's lock", () => fixture(async (workspace, service) => {
    const directory = join(workspace.home, "SpecKitCanvas", "scaffolding"); await mkdir(directory, { recursive: true });
    const key = createHash("sha256").update(workspace.workspacePath).digest("hex");
    const lock = join(directory, `${key}.lock`);
    await writeFile(lock, JSON.stringify({ pid: process.pid, jobId: "a".repeat(32) }));
    await assert.rejects(service.start((await service.state()).contextId, "live-lock"), { code: "scaffolding_conflict" });
    assert.equal(workspace.calls.length, 0);
    await writeFile(lock, JSON.stringify({ pid: 2147483640, jobId: "a".repeat(32) }));
    await service.start((await service.state()).contextId, "dead-lock-retry"); await service.settled();
    assert.equal((await service.state()).job?.status, "completed");
    assert.equal(existsSync(lock), false);
}));

test("A workspace change during an admitted job stops later mutations and preserves completed setup", () => fixture(async (workspace, service) => {
    workspace.pauseBundle();
    await service.start((await service.state()).contextId, "context-change");
    await waitFor(service, state => state.job?.steps.some(step => step.id === "bundle" && step.status === "loading") === true);
    workspace.changeWorkspace(); workspace.resumeBundle();
    await service.settled();
    const directory = join(workspace.home, "SpecKitCanvas", "scaffolding");
    const stored = JSON.parse(await readFile(join(directory, (await readdir(directory)).find(name => name.endsWith(".json"))!), "utf8"));
    assert.equal(stored.job.status, "error"); assert.equal(stored.job.errorCode, "context_changed");
    assert.equal(workspace.reloadCount(), 0); assert.equal(workspace.continuationCount(), 0);
}));

test("Cancelling a pending skill reload stops the job without claiming that the host RPC completed", async () => {
    const workspace = await createScaffoldingTestWorkspace();
    let resolveReload: ((value: { warnings: string[]; errors: string[] }) => void) | undefined;
    const service = await createScaffoldingService({ ...workspace.options, reloadSkills: () => new Promise(resolve => { resolveReload = resolve; }) });
    try {
        await service.start((await service.state()).contextId, "pending-reload");
        const state = await waitFor(service, state => state.job?.steps.some(step => step.id === "skills" && step.status === "loading") === true);
        await service.cancel(state.job!.id, "cancel-reload"); await service.settled();
        assert.equal((await service.state()).job?.status, "cancelled");
        assert.equal(workspace.continuationCount(), 0);
    } finally {
        resolveReload?.({ warnings: [], errors: [] }); await service.settled(); service.dispose(); await workspace.cleanup();
    }
});

test("Native-latency progress observations cannot invalidate the admitted job's fresh workspace checks", async () => {
    const workspace = await createScaffoldingTestWorkspace({ delayedHost: true });
    const observations: Promise<unknown>[] = [];
    const failures: unknown[] = [];
    const service = await createScaffoldingService({ ...workspace.options,
        verifyWorkspace: async () => { await workspace.host.inspectCurrent(); },
        onChange: () => { observations.push(service.state().catch(error => { failures.push(error); })); },
    });
    try {
        await service.start((await service.state()).contextId, "native-latency");
        await service.settled(); await Promise.all(observations);
        assert.equal((await service.state()).job?.status, "completed");
        assert.deepEqual(failures, []);
    } finally { service.dispose(); await workspace.cleanup(); }
});
