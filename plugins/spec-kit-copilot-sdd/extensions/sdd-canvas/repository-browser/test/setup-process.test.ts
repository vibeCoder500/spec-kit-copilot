import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { test } from "node:test";
import { findSetupExecutable, redactSetupOutput, runSetupCommand, setupEnvironment } from "../src/setup-process.ts";

test("Setup child environments omit host credentials, arbitrary Python/Node hooks and repository-local PATH entries", async () => {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-setup-env-")));
    const workspace = join(home, "repository"); const trusted = join(home, "trusted");
    try {
        await mkdir(workspace); await mkdir(trusted);
        const env = await setupEnvironment(workspace, { PATH: [workspace, trusted, "."].join(delimiter),
            GH_ENTERPRISE_TOKEN: "inherited-secret", GH_TOKEN: "other-secret", NODE_OPTIONS: "--require injected", PYTHONPATH: workspace,
            UV_DEFAULT_INDEX: "https://unreviewed.invalid", COPILOT_EXTENSION_TOKEN: "host-secret" }, home);
        assert.equal(env.GH_ENTERPRISE_TOKEN, undefined); assert.equal(env.GH_TOKEN, undefined);
        assert.equal(env.NODE_OPTIONS, undefined); assert.equal(env.PYTHONPATH, undefined); assert.equal(env.COPILOT_EXTENSION_TOKEN, undefined);
        assert.equal(env.PATH?.includes(workspace), false);
        assert.equal(env.UV_NO_CONFIG, "1");
        assert.equal(env.UV_DEFAULT_INDEX, "https://packagefeedproxy.microsoft.io/pypi/simple/");
    } finally { await rm(home, { recursive: true, force: true }); }
});

test("Executable resolution cannot select a repository-provided CLI or shell shim", async () => {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-setup-executable-")));
    const workspace = join(home, "repository"); await mkdir(workspace);
    try {
        await writeFile(join(workspace, process.platform === "win32" ? "gh.exe" : "gh"), "MZ synthetic repository executable");
        await writeFile(join(home, "gh.cmd"), "@echo unsafe");
        const selected = await findSetupExecutable("gh", workspace, { homeDirectory: home, environment: { PATH: workspace } });
        assert.equal(selected, undefined);
    } finally { await rm(home, { recursive: true, force: true }); }
});

test("Secrets, authorization headers and terminal control sequences are removed from displayed command output", () => {
    const output = redactSetupOutput("\x1b[31mAuthorization: Bearer synthetic-secret\nGH_ENTERPRISE_TOKEN=synthetic-secret\n" +
        "gho_12345678901234567890 https://user:password@example.invalid/file", ["synthetic-secret"]);
    assert.doesNotMatch(output, /synthetic-secret|gho_123456|user:password|\x1b/);
    assert.match(output, /\[redacted\]/);
});

test("The native runner reports nonzero exits and keeps sensitive output out of progress callbacks", async () => {
    const chunks: string[] = [];
    const result = await runSetupCommand({ executable: process.execPath, args: ["-e", "process.stdout.write('synthetic-secret'); process.exitCode=7;"],
        cwd: tmpdir(), env: process.env, signal: new AbortController().signal, timeoutMs: 10_000, sensitive: true, onOutput: text => chunks.push(text) });
    assert.equal(result.exitCode, 7); assert.equal(result.stdout, "synthetic-secret"); assert.deepEqual(chunks, []);
});

test("Cancellation and timeout wait for the owned native process to stop, without accepting success", async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(runSetupCommand({ executable: process.execPath, args: ["-e", "throw Error('must not execute')"],
        cwd: tmpdir(), env: process.env, signal: controller.signal, timeoutMs: 10_000 }), { reason: "cancelled" });
    await assert.rejects(runSetupCommand({ executable: process.execPath, args: ["-e", "setInterval(()=>{},1000)"],
        cwd: tmpdir(), env: process.env, signal: new AbortController().signal, timeoutMs: 100 }), { reason: "timeout" });
});
