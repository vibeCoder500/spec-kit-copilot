import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assertWorkspaceBinding, inspectWorkspaceBinding } from "../src/workspace-binding.ts";

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