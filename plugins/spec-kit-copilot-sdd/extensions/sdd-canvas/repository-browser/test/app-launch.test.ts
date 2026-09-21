import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { test } from "node:test";
import { appLaunchEnvironment, createCopilotAppLauncher, findCopilotExecutable } from "../src/app-launch.ts";
import type { AppCommandRunner } from "../src/app-launch.ts";
import { RepositoryError } from "../src/errors.ts";

async function fixture() {
    const root = await realpath(await mkdtemp(join(tmpdir(), "sdd-app-launch-test-")));
    const workspace = join(root, "workspace");
    const destination = join(root, "checkout with spaces & symbols");
    const tools = join(root, "tools");
    for (const directory of [workspace, destination, tools]) await mkdir(directory);
    const binary = join(tools, "copilot.exe");
    await writeFile(binary, "MZsynthetic-native-test-not-executable");
    return { root, workspace, destination, tools, binary, cleanup: () => rm(root, { recursive: true, force: true }) };
}

test("App launcher locates a native CLI outside the workspace without executing wrappers", async () => {
    const proof = await fixture();
    try {
        await writeFile(join(proof.workspace, "copilot.exe"), "MZuntrusted-workspace");
        assert.equal(await findCopilotExecutable(proof.workspace, { PATH: [proof.workspace, proof.tools].join(delimiter) }, "win32"), proof.binary);
        await writeFile(proof.binary, "#!/usr/bin/env node\nthrow Error('wrapper')");
        assert.equal(await findCopilotExecutable(proof.workspace, { PATH: proof.tools }, "win32"), undefined);
    } finally { await proof.cleanup(); }
});

test("App launcher opens only the fixed checkout with no credentials, prompts or updates", async () => {
    const proof = await fixture();
    const commands: Parameters<AppCommandRunner>[0][] = [];
    try {
        const launcher = createCopilotAppLauncher({ platform: "win32", environment: { PATH: [proof.workspace, proof.tools, proof.destination, "."].join(delimiter), USERPROFILE: proof.root,
            COPILOT_GITHUB_TOKEN: "private", SESSION_ID: "private", NODE_OPTIONS: "private", GIT_CONFIG_COUNT: "private" },
            runner: async command => { commands.push(command); return command.args.includes("--help") ? "Usage: copilot app [options]" : "Opened"; } });
        assert.equal(await launcher.available(proof.workspace), true);
        assert.equal(commands.length, 0);
        assert.deepEqual(await launcher.launch(proof.workspace, proof.destination), { status: "requested" });
        assert.deepEqual(commands.map(command => command.args), [["--no-auto-update", "app", "--help"], ["--no-auto-update", "app"]]);
        for (const command of commands) {
            assert.equal(command.executable, proof.binary);
            assert.equal(command.cwd, proof.destination);
            assert.deepEqual(command.env, { PATH: proof.tools, USERPROFILE: proof.root, COPILOT_AUTO_UPDATE: "false" });
        }
    } finally { await proof.cleanup(); }
});

test("App launcher refuses missing support and invalid targets before an open request", async () => {
    const proof = await fixture();
    let calls = 0;
    try {
        const runner: AppCommandRunner = async () => { calls++; return "Usage: copilot [options]"; };
        const launcher = createCopilotAppLauncher({ platform: "win32", environment: { PATH: proof.tools }, runner });
        await assert.rejects(launcher.launch(proof.workspace, "relative-path"), { code: "invalid_request" });
        assert.equal(calls, 0);
        await assert.rejects(launcher.launch(proof.workspace, proof.destination), { code: "app_launcher_unavailable" });
        assert.equal(calls, 1);
        const unavailable = createCopilotAppLauncher({ platform: "linux", environment: { PATH: proof.tools }, runner });
        assert.equal(await unavailable.available(proof.workspace), false);
        await assert.rejects(unavailable.launch(proof.workspace, proof.destination), { code: "app_launcher_unavailable" });
        assert.equal(calls, 1);
    } finally { await proof.cleanup(); }
});

test("App launcher preserves unknown and failed open outcomes without retrying", async () => {
    const proof = await fixture();
    try {
        for (const code of ["app_launch_failed", "app_launch_unknown"] as const) {
            let calls = 0;
            const launcher = createCopilotAppLauncher({ platform: "win32", environment: { PATH: proof.tools }, runner: async command => {
                calls++;
                if (command.args.includes("--help")) return "Usage: copilot app [options]";
                throw new RepositoryError(code);
            } });
            await assert.rejects(launcher.launch(proof.workspace, proof.destination), { code });
            assert.equal(calls, 2);
        }
        assert.deepEqual(appLaunchEnvironment({ PATH: proof.tools, COPILOT_HOME: "private", GH_TOKEN: "private", LD_PRELOAD: "private" }),
            { PATH: proof.tools, COPILOT_AUTO_UPDATE: "false" });
    } finally { await proof.cleanup(); }
});

test("The final before-open guard can reject after launcher discovery without opening the App", async () => {
    const proof = await fixture();
    let commands = 0;
    try {
        const launcher = createCopilotAppLauncher({ platform: "win32", environment: { PATH: proof.tools }, runner: async () => {
            commands++; return "Usage: copilot app [options]";
        } });
        await assert.rejects(launcher.launch(proof.workspace, proof.destination, async () => { throw new RepositoryError("context_changed"); }), { code: "context_changed" });
        assert.equal(commands, 1);
    } finally { await proof.cleanup(); }
});