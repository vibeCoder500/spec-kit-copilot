import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assertWorkspaceBinding, inspectWorkspaceBinding } from "../src/workspace-binding.ts";
import * as workspaceModule from "../src/workspace-binding.ts";
import { cloneEnvironment, findGitExecutable, fingerprintCheckout } from "../src/clone.ts";
import { createPreparationStore } from "../src/preparation-store.ts";
import type { HostHandoffAdapter, HostWorkspaceSnapshot, PreparedRepositoryRecord, WorkspaceActivation } from "../src/types.ts";

test("Ordinary workspaces require no preparation marker and trigger no Git execution", async () => {
    const home = await mkdtemp(join(tmpdir(), "sdd-binding-test-"));
    try {
        const state = await inspectWorkspaceBinding({ workspacePath: home, homeDirectory: home, runner: async () => assert.fail("No Git call expected") });
        assert.equal(state.state, "ordinary"); assertWorkspaceBinding(state);
    } finally { await rm(home, { recursive: true }); }
});

test("Prepared clone and App worktree require matching Git identity and initial source", async () => {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-binding-test-")));
    const operationId = "a".repeat(32);
    const checkout = join(home, "SpecKitCanvas", "repositories", operationId, "checkout");
    const common = join(checkout, ".git");
    const registry = join(home, ".speckit-canvas/preparations");
    const source = "b".repeat(40);
    const remote = "https://dev.azure.com/org/project/_git/11111111-1111-4111-8111-111111111111";
    let reportedHead = source;
    let reportedRemote = remote;
    try {
        await mkdir(common, { recursive: true }); await mkdir(registry, { recursive: true });
        await mkdir(join(home, "app-worktree"));
        await writeFile(join(home, "app-worktree/.git"), `gitdir: ${common}\n`);
        await writeFile(join(registry, `${operationId}.json`), JSON.stringify({ schemaVersion: 1, kind: "sdd-prepared-repository", operationId, checkout, gitDirectory: common,
            remote, repositoryId: "11111111-1111-4111-8111-111111111111", initialCommit: source, initialBranch: `speckit/canvas-${operationId}` }));
        const options = { workspacePath: join(home, "app-worktree"), homeDirectory: home, executable: join(home, "git.exe"), runner: async ({ args }: { args: string[] }) => {
            if (args.includes("--git-common-dir")) return common;
            if (args.includes("get-url")) return reportedRemote;
            if (args.includes("symbolic-ref")) return "app-worktree-branch";
            return reportedHead;
        } };
        const verified = await inspectWorkspaceBinding(options);
        assert.equal(verified.state, "verified");
        reportedHead = "c".repeat(40);
        assert.equal((await inspectWorkspaceBinding(options)).state, "mismatch");
        assert.equal((await inspectWorkspaceBinding({ ...options, previous: verified })).state, "verified");
        reportedRemote = "https://dev.azure.com/org/project/_git/other";
        const mismatch = await inspectWorkspaceBinding({ ...options, previous: verified });
        assert.equal(mismatch.state, "mismatch");
        assert.throws(() => assertWorkspaceBinding(mismatch), { code: "local_context_mismatch" });
        await rm(join(registry, `${operationId}.json`));
        assert.equal((await inspectWorkspaceBinding({ ...options, previous: verified })).state, "mismatch");
        const ordinary = await inspectWorkspaceBinding({ workspacePath: home, homeDirectory: home, runner: async () => assert.fail("Unrelated non-Git workspace must not invoke Git") });
        assert.equal(ordinary.state, "ordinary");
    } finally { await rm(home, { recursive: true }); }
});

test("Current repository inspection uses canonical Git identity without modifying dirty files", async () => {
    const inspect = Reflect.get(workspaceModule, "inspectCurrentRepository");
    assert.equal(typeof inspect, "function");
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-current-workspace-")));
    const common = join(home, "repository", ".git");
    const root = join(home, "repository");
    const nested = join(root, "nested");
    const calls: string[][] = [];
    try {
        await mkdir(common, { recursive: true }); await mkdir(nested);
        await writeFile(join(root, "user-draft.txt"), "Keep this uncommitted work");
        const identity = await inspect({ workspacePath: nested, homeDirectory: home, executable: join(home, "synthetic-git"), runner: async ({ args }: { args: string[] }) => {
            calls.push(args);
            if (args.includes("--show-toplevel")) return root;
            if (args.includes("--git-common-dir")) return common;
            if (args.includes("get-url")) return "https://dev.azure.com/Synthetic/Project/_git/repository";
            if (args.includes("symbolic-ref")) return "refs/heads/local-work";
            if (args.includes("HEAD")) return "a".repeat(40);
            assert.fail("Unexpected Git query");
        } });
        assert.deepEqual(identity, { workingDirectory: nested, worktreeRoot: root, gitCommonDirectory: common,
            origin: "https://dev.azure.com/Synthetic/Project/_git/repository", head: "a".repeat(40), branch: "refs/heads/local-work" });
        assert.equal(await readFile(join(root, "user-draft.txt"), "utf8"), "Keep this uncommitted work");
        assert.equal(calls.some(args => args.some(argument => ["clone", "checkout", "reset", "stash", "init", "status"].includes(argument))), false);
        assert.equal(await inspect({ workspacePath: home, homeDirectory: home, runner: async () => assert.fail("Non-repository must not invoke Git") }), null);
    } finally { await rm(home, { recursive: true }); }
});

test("Current linked worktree keeps its branch and refuses redirected or inconsistent roots", async () => {
    const inspect = Reflect.get(workspaceModule, "inspectCurrentRepository");
    assert.equal(typeof inspect, "function");
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-current-worktree-")));
    const root = join(home, "linked");
    const common = join(home, "original", ".git");
    let reportedRoot = root;
    try {
        await mkdir(root); await mkdir(common, { recursive: true });
        await writeFile(join(root, ".git"), `gitdir: ${join(common, "worktrees", "linked")}\n`);
        const options = { workspacePath: root, homeDirectory: home, executable: join(home, "synthetic-git"), runner: async ({ args }: { args: string[] }) => {
            if (args.includes("--show-toplevel")) return reportedRoot;
            if (args.includes("--git-common-dir")) return common;
            if (args.includes("get-url")) return "https://dev.azure.com/Synthetic/Project/_git/repository";
            if (args.includes("symbolic-ref")) return "refs/heads/host-linked";
            return "a".repeat(40);
        } };
        const linked = await inspect(options);
        assert.ok(linked);
        assert.equal(linked.branch, "refs/heads/host-linked");
        reportedRoot = join(home, "original");
        await assert.rejects(inspect(options), { code: "local_context_mismatch" });
        const redirect = join(home, "redirect");
        await symlink(root, redirect, process.platform === "win32" ? "junction" : "dir");
        await assert.rejects(inspect({ ...options, workspacePath: redirect }), { code: "local_context_mismatch" });
        await assert.rejects(inspect({ ...options, workspacePath: join(home, "missing") }), { code: "local_context_mismatch" });
    } finally { await rm(home, { recursive: true }); }
});

async function preparedFixture(run: (proof: { home: string; record: PreparedRepositoryRecord; linked: string; activation: WorkspaceActivation; host: HostWorkspaceSnapshot;
    git(args: string[], cwd?: string): string }) => Promise<void>) {
    assert.equal(typeof Reflect.get(workspaceModule, "verifyPreparedRepository"), "function");
    assert.equal(typeof Reflect.get(workspaceModule, "verifyActivatedRepository"), "function");
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-prepared-identity-")));
    const operationId = "a".repeat(32);
    const root = join(home, "SpecKitCanvas", "repositories", operationId);
    const checkout = join(root, "checkout");
    const linked = join(home, "host-linked");
    await mkdir(checkout, { recursive: true });
    const executable = await findGitExecutable(home);
    const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home, emptyFile: process.platform === "win32" ? "NUL" : "/dev/null" });
    delete env.GIT_CONFIG_KEY_0; delete env.GIT_CONFIG_VALUE_0; env.GIT_CONFIG_COUNT = "0";
    const git = (args: string[], cwd = checkout) => execFileSync(executable, ["-c", "core.hooksPath=", "-c", "core.fsmonitor=false", "-c", "init.templateDir=",
        "-c", "user.name=SDD Owned Test", "-c", "user.email=owned@example.invalid", ...args], { cwd, env, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }).trim();
    try {
        git(["init", "-b", `speckit/canvas-${operationId}`]);
        await writeFile(join(checkout, "spec.md"), "# Owned repository\n");
        git(["add", "spec.md"]); git(["commit", "-m", "Owned identity fixture"]);
        const origin = "https://dev.azure.com/Synthetic/Project/_git/33333333-3333-4333-8333-333333333333";
        git(["remote", "add", "origin", origin]); git(["worktree", "add", "-b", "host-target", linked]);
        await writeFile(join(root, ".sdd-clone-owner.json"), JSON.stringify({ kind: "sdd-repository-clone", operationId }));
        const record: PreparedRepositoryRecord = { schemaVersion: 2, kind: "sdd-prepared-repository", operationId, repositoryId: "33333333-3333-4333-8333-333333333333",
            originIdentity: origin, defaultRef: "refs/heads/main", sourceCommit: git(["rev-parse", "HEAD"]), destination: checkout, gitCommonDirectory: join(checkout, ".git"),
            branch: `refs/heads/speckit/canvas-${operationId}`, initialWorktreeFingerprint: await fingerprintCheckout(checkout, new AbortController().signal),
            profileFingerprint: "b".repeat(64), accountKey: "c".repeat(64), createdAt: 1000, completedAt: 2000 };
        const activation: WorkspaceActivation = { attemptId: "d".repeat(32), sessionId: "target", contextRevision: "activated", workingDirectory: linked,
            targetKind: "host_worktree", targetBranch: "refs/heads/host-target" };
        const host: HostWorkspaceSnapshot = { ...activation, activity: "idle", activityRevision: "idle", capabilityGeneration: "test",
            capabilities: { localCanvas: true, atomicPreparation: true, atomicHandoff: true, targetAcknowledgment: true, handoffReconciliation: true } };
        await run({ home, record, linked, activation, host, git });
    } finally { await rm(home, { recursive: true, force: true }); }
}

test("Prepared identity accepts only an attested registered linked branch and preserves the original", () => preparedFixture(async ({ home, record, activation, host, git }) => {
    await workspaceModule.verifyPreparedRepository({ record, homeDirectory: home });
    await workspaceModule.verifyActivatedRepository({ record, activation, snapshot: host, homeDirectory: home });
    assert.equal(git(["symbolic-ref", "HEAD"]), record.branch);
    assert.equal(git(["rev-parse", "HEAD"]), record.sourceCommit);
    const original = { ...activation, workingDirectory: record.destination, targetKind: "prepared_checkout" as const, targetBranch: record.branch };
    await workspaceModule.verifyActivatedRepository({ record, activation: original, snapshot: { ...host, workingDirectory: record.destination }, homeDirectory: home });
    for (const changed of [{ targetBranch: record.branch }, { targetKind: "prepared_checkout" as const }, { contextRevision: "stale" }, { sessionId: "another-session" }]) {
        await assert.rejects(workspaceModule.verifyActivatedRepository({ record, activation: { ...activation, ...changed }, snapshot: host, homeDirectory: home }), { code: "clone_identity_changed" });
    }
}));

test("Initial handoff rejects unregistered, dirty, detached, moved or wrong-origin worktrees without repairing them", () => preparedFixture(async ({ home, record, linked, activation, host, git }) => {
    const verify = () => workspaceModule.verifyActivatedRepository({ record, activation, snapshot: host, homeDirectory: home });
    await writeFile(join(linked, "untracked.txt"), "preserve");
    await assert.rejects(verify(), { code: "clone_identity_changed" });
    assert.equal(await readFile(join(linked, "untracked.txt"), "utf8"), "preserve");
    await rm(join(linked, "untracked.txt"));
    git(["checkout", "--detach", record.sourceCommit], linked);
    await assert.rejects(verify(), { code: "clone_identity_changed" });
    git(["checkout", "host-target"], linked);
    const unregistered = join(home, "unregistered-copy");
    await mkdir(unregistered);
    await writeFile(join(unregistered, ".git"), await readFile(join(linked, ".git")));
    await writeFile(join(unregistered, "spec.md"), await readFile(join(linked, "spec.md")));
    await assert.rejects(workspaceModule.verifyActivatedRepository({ record, activation: { ...activation, workingDirectory: unregistered },
        snapshot: { ...host, workingDirectory: unregistered }, homeDirectory: home }), { code: "clone_identity_changed" });
    git(["remote", "set-url", "origin", "https://dev.azure.com/Synthetic/Project/_git/44444444-4444-4444-8444-444444444444"]);
    await assert.rejects(verify(), { code: "clone_identity_changed" });
    git(["remote", "set-url", "origin", record.originIdentity]);
    git(["commit", "--allow-empty", "-m", "Changed target commit"], linked);
    await assert.rejects(verify(), { code: "clone_identity_changed" });
    git(["update-index", "--assume-unchanged", "spec.md"]);
    await writeFile(join(record.destination, "spec.md"), "# Changed despite a clean status\n");
    assert.equal(git(["status", "--porcelain=v1"]), "");
    await assert.rejects(workspaceModule.verifyPreparedRepository({ record, homeDirectory: home }), { code: "clone_identity_changed" });
    assert.equal(await readFile(join(record.destination, "spec.md"), "utf8"), "# Changed despite a clean status\n");
}));

test("Verified readiness permits later local edits and branches without reapplying the initial clone baseline", () => preparedFixture(async ({ home, record, linked, activation, host, git }) => {
    await workspaceModule.verifyActivatedRepository({ record, activation, snapshot: host, homeDirectory: home });
    const acceptedTarget = { ...activation, providerId: "project:sdd-canvas", instanceId: "ready-instance" };
    const ready: PreparedRepositoryRecord = { ...record, acceptedTarget, handoff: { attemptId: activation.attemptId, operationId: record.operationId,
        expectedSource: { sessionId: "source", contextRevision: "original" }, instanceId: acceptedTarget.instanceId, createdAt: 3000,
        status: "canvas_ready", activation, result: acceptedTarget } };
    git(["checkout", "-b", "normal-local-work"], linked);
    await writeFile(join(linked, "spec.md"), "# Normal workflow edit\n");
    await writeFile(join(linked, "draft.txt"), "Keep local untracked work\n");
    await workspaceModule.verifyReadyRepository({ record: ready, snapshot: host, providerId: acceptedTarget.providerId, instanceId: acceptedTarget.instanceId, homeDirectory: home });
    assert.equal(git(["symbolic-ref", "HEAD"], linked), "refs/heads/normal-local-work");
    assert.equal(await readFile(join(linked, "draft.txt"), "utf8"), "Keep local untracked work\n");
    assert.equal(git(["symbolic-ref", "HEAD"]), record.branch);
    await assert.rejects(workspaceModule.verifyReadyRepository({ record: ready, snapshot: { ...host, contextRevision: "changed" },
        providerId: acceptedTarget.providerId, instanceId: acceptedTarget.instanceId, homeDirectory: home }), { code: "clone_identity_changed" });
}));

test("Target binder rejects direct bypass and records readiness only for the independently verified instance", () => preparedFixture(async ({ home, record, activation, host: initial }) => {
    const bind = Reflect.get(workspaceModule, "createWorkflowBinding");
    assert.equal(typeof bind, "function");
    const store = createPreparationStore({ homeDirectory: home });
    await store.write(record);
    const attempt = { attemptId: activation.attemptId, operationId: record.operationId, instanceId: "guarded-target", expectedSource: { sessionId: "source", contextRevision: "original" },
        status: "requested" as const, createdAt: 3000 };
    await store.beginAttempt(record.operationId, attempt);
    await store.updateAttempt(record.operationId, { ...attempt, status: "workspace_activated", activation });
    let snapshot = initial;
    const host: HostHandoffAdapter = { inspectCurrent: async () => snapshot,
        openCurrentCanvas: async () => assert.fail("Binder cannot open a canvas"), admitPreparation: async () => assert.fail("Binder cannot clone"),
        handoffPrepared: async () => assert.fail("Binder cannot switch workspaces"), getHandoffOutcome: async () => assert.fail("Binder cannot submit recovery"), dispose() {} };
    await assert.rejects(bind({ host, providerId: "project:sdd-canvas", instanceId: "bypass-instance", homeDirectory: home }), { code: "entry_required" });
    assert.equal((await store.read(record.operationId)).acceptedTarget, undefined);
    const binding = await bind({ host, providerId: "project:sdd-canvas", instanceId: "guarded-target", homeDirectory: home });
    assert.equal((await store.read(record.operationId)).acceptedTarget, undefined);
    await assert.rejects(binding.verify(), { code: "entry_required" });
    await binding.ready();
    assert.equal((await store.read(record.operationId)).handoff?.status, "canvas_ready");
    await binding.verify();
    snapshot = { ...initial, contextRevision: "changed" };
    await assert.rejects(binding.verify(), { code: "context_changed" });
}));