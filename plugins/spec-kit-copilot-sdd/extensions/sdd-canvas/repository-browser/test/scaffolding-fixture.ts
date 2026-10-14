import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { ORGANIZATION_SETUP } from "../src/scaffolding.ts";
import { createHostHandoffAdapter } from "../src/host-handoff.ts";
import type { SetupCommand, SetupCommandRunner, SetupTool } from "../src/setup-process.ts";
import type { LocalRepositoryIdentity } from "../src/types.ts";

export const TEST_REGISTRY_TOKEN = "synthetic-registry-token-for-tests";
export const TEST_ARTIFACTS = [
    { id: "bug", kind: "extension", version: "1.0.0" },
    { id: "msd-constitution-applicability", kind: "preset", version: "1.0.0", priority: 10, strategy: "wrap" },
    { id: "msd-constitution", kind: "preset", version: "1.0.0", priority: 40, strategy: "replace" },
    ...["api", "frontend", "pipeline", "processor", "sharedlib"].map(scope =>
        ({ id: `msd-constitution-${scope}`, kind: "preset", version: "1.0.0", priority: 20, strategy: "append" })),
];
export const TEST_WORKFLOW = JSON.stringify({
    schema_version: "1.0", requires: { speckit_version: ">=1.1.0" },
    steps: [
        { id: "check-speckit-version", type: "shell", run: "This downloaded text must never execute." },
        { id: "init-project", type: "init", here: true, integration: "copilot", integration_options: "--skills", force: true },
        ...["add-extension-catalog", "add-preset-catalog", "add-bundle-catalog", "install-bundle"].map(id => ({ id, type: "shell" })),
    ],
});
export const TEST_BUNDLE = JSON.stringify({
    schema_version: "1.0", bundle: { id: ORGANIZATION_SETUP.bundleId, version: "1.0.0" }, requires: { speckit_version: ">=1.0.1" },
    provides: {
        extensions: TEST_ARTIFACTS.filter(entry => entry.kind === "extension").map(({ id, version }) => ({ id, version })),
        presets: TEST_ARTIFACTS.filter(entry => entry.kind === "preset").map(({ id, version, priority, strategy }) => ({ id, version, priority, strategy })),
    },
});
export const TEST_CATALOG = JSON.stringify({ bundles: { [ORGANIZATION_SETUP.bundleId]: { version: "1.0.0" } } });
const CORE = ["constitution", "specify", "clarify", "plan", "tasks", "analyze", "checklist", "implement"];

export async function createScaffoldingTestWorkspace({ bundleDelayMs = 0, authenticationRequired = false, oldCli = false, mirrorVersion, delayedHost = false, initialized = false, now = Date.now }: {
    bundleDelayMs?: number; authenticationRequired?: boolean; oldCli?: boolean; mirrorVersion?: string; delayedHost?: boolean; initialized?: boolean; now?: () => number;
} = {}) {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-scaffolding-test-")));
    const workspacePath = join(home, "repository");
    await mkdir(join(workspacePath, ".git"), { recursive: true });
    await writeFile(join(workspacePath, "application.ts"), "export const application = 'preserve me';\n");
    await writeFile(join(home, ".sdd-scaffolding-test-owner"), "owned-synthetic-scaffolding-test\n");
    const identity: LocalRepositoryIdentity = { workingDirectory: workspacePath, worktreeRoot: workspacePath,
        gitCommonDirectory: join(workspacePath, ".git"), origin: "https://example.invalid/synthetic", head: "a".repeat(40), branch: "refs/heads/main" };
    let currentDirectory = workspacePath;
    let busy = false;
    let cliVersion = oldCli ? "0.12.0" : "1.1.3";
    let signedIn = !authenticationRequired;
    let authenticationReleased = false;
    let failure: string | undefined;
    let reloadErrors: string[] = [];
    let pausedBundle = false;
    let releaseBundle: (() => void) | undefined;
    let releaseAuthentication: (() => void) | undefined;
    let reloads = 0;
    let continuations = 0;
    const calls: SetupCommand[] = [];
    let hostReads = 0;
    const host = createHostHandoffAdapter({ sessionId: "synthetic-setup-session", metadata: {
        snapshot: async () => {
            if (delayedHost) await new Promise(resolve => setTimeout(resolve, ++hostReads % 2 ? 15 : 1));
            return { sessionId: "synthetic-setup-session", workingDirectory: currentDirectory };
        },
        activity: async () => ({ hasActiveWork: busy, abortable: busy }),
    } });
    const save = async (segments: string[], value: unknown) => {
        const path = join(workspacePath, ...segments);
        await mkdir(join(workspacePath, ...segments.slice(0, -1)), { recursive: true });
        await writeFile(path, JSON.stringify(value));
    };
    const initialize = async () => {
        await save([".specify", "init-options.json"], { integration: "copilot", integration_options: "--skills" });
        for (const name of CORE) {
            const path = join(workspacePath, ".github", "skills", `speckit-${name}`);
            await mkdir(path, { recursive: true });
            await writeFile(join(path, "SKILL.md"), `---\nname: speckit-${name}\ndescription: Synthetic test skill; never execute.\n---\n\n# ${name}\n`);
        }
        await mkdir(join(workspacePath, ".specify", "memory"), { recursive: true });
        await writeFile(join(workspacePath, ".specify", "memory", "constitution.md"), "# Synthetic constitution template\n");
    };
    if (initialized) await initialize();
    const registry = async (plural: string): Promise<Record<string, unknown>> => {
        try { return JSON.parse(await readFile(join(workspacePath, ".specify", plural, ".registry"), "utf8"))[plural]; }
        catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return {}; throw error; }
    };
    const runner: SetupCommandRunner = async command => {
        if (command.signal.aborted) throw new Error("Synthetic setup command cancelled before execution.");
        calls.push({ ...command, env: { ...command.env } });
        const tool = basename(command.executable) as SetupTool;
        const args = command.args;
        const output = (stdout: string) => ({ exitCode: 0, stdout, stderr: "" });
        if (tool === "gh") {
            assert.equal(command.env.GH_ENTERPRISE_TOKEN, undefined);
            if (args[0] === "auth" && args[1] === "status") return signedIn ? output("Authenticated using the credential store.") :
                { exitCode: 1, stdout: "", stderr: "Not authenticated." };
            if (args[0] === "auth" && args[1] === "login") {
                assert.equal(command.input, "\n");
                command.onOutput?.("Copy your one-time code: ABCD-1234");
                if (!authenticationReleased) await new Promise<void>((resolve, reject) => {
                        releaseAuthentication = () => { command.signal.removeEventListener("abort", abort); resolve(); };
                        const abort = () => { releaseAuthentication = undefined; reject(new Error("Synthetic sign-in cancelled.")); };
                        command.signal.addEventListener("abort", abort, { once: true });
                    });
                signedIn = true; return output("Sign-in completed.");
            }
            if (args[0] === "auth" && args[1] === "token") { assert.equal(command.sensitive, true); return output(TEST_REGISTRY_TOKEN); }
            if (args[0] === "api") {
                const resource = args.find(arg => arg.startsWith("repos/"));
                if (resource?.endsWith("workflow.yml")) return output(TEST_WORKFLOW);
                if (resource?.endsWith("bundles.catalog.json")) return output(TEST_CATALOG);
                if (resource?.endsWith("bundle.yml")) return output(TEST_BUNDLE);
            }
        }
        if (tool === "uv") {
            assert.deepEqual(args, ["tool", "install", "--upgrade", "--force", "specify-cli"]);
            assert.equal(command.cwd, home);
            assert.ok(["https://packagefeedproxy.microsoft.io/pypi/simple/", "https://pypi.org/simple/"].includes(command.env.UV_DEFAULT_INDEX!));
            cliVersion = command.env.UV_DEFAULT_INDEX === "https://pypi.org/simple/" ? "1.1.3" : mirrorVersion ?? "1.1.3";
            return output("Installed Specify.");
        }
        if (tool === "specify") {
            if (args[0] === "--version") return output(`specify ${cliVersion}`);
            assert.equal(command.cwd, workspacePath); assert.equal(command.env.GH_ENTERPRISE_TOKEN, TEST_REGISTRY_TOKEN);
            if (args[0] === "init") {
                assert.deepEqual(args, ["init", "--here", "--force", "--integration", "copilot", "--integration-options=--skills",
                    "--script", process.platform === "win32" ? "ps" : "sh", "--ignore-agent-tools"]);
                await initialize();
                return output("Initialized Copilot skills mode.");
            }
            if (args[1] === "catalog" && args[2] === "add") {
                if (args[0] === "workflow") {
                    assert.equal(args.includes("--priority"), false);
                    assert.equal(args.includes("--install-allowed"), false);
                }
                const url = args[3]!;
                const name = args[args.indexOf(args[0] === "bundle" ? "--id" : "--name") + 1];
                const entry = args[0] === "bundle" ? { id: name, url, priority: 1, install_policy: "install-allowed" } :
                    { name, url, priority: 1, install_allowed: args.includes("--install-allowed") };
                await save([".specify", `${args[0]}-catalogs.yml`], { catalogs: [entry] });
                return output("Catalog added.");
            }
            if (args[0] === "bundle" && args[1] === "install") {
                assert.deepEqual(args, ["bundle", "install", ORGANIZATION_SETUP.bundleId]);
                if (pausedBundle) await new Promise<void>((resolve, reject) => {
                    releaseBundle = () => { command.signal.removeEventListener("abort", abort); resolve(); };
                    const abort = () => { releaseBundle = undefined; reject(new Error("Synthetic bundle command cancelled.")); };
                    command.signal.addEventListener("abort", abort, { once: true });
                });
                if (failure === "bundle") {
                    failure = undefined;
                    return { exitCode: 1, stdout: "", stderr: `Synthetic bundle download failed. Authorization: Bearer ${TEST_REGISTRY_TOKEN}` };
                }
                for (const artifact of TEST_ARTIFACTS) {
                    if (command.signal.aborted) throw new Error("Synthetic bundle command cancelled.");
                    const plural = artifact.kind === "extension" ? "extensions" : "presets";
                    const existing = await registry(plural);
                    if (!existing[artifact.id]) {
                        await save([".specify", plural, artifact.id, `${artifact.kind}.yml`], {
                            schema_version: "1.0", [artifact.kind]: { id: artifact.id, version: artifact.version },
                        });
                        await save([".specify", plural, ".registry"], { schema_version: "1.0",
                            [plural]: { ...existing, [artifact.id]: { version: artifact.version, enabled: true, priority: artifact.priority ?? 10 } } });
                    }
                    if (bundleDelayMs) await new Promise(resolve => setTimeout(resolve, bundleDelayMs));
                }
                await save([".specify", "bundle-records.json"], { schema_version: "1.0", bundles: [{ bundle_id: ORGANIZATION_SETUP.bundleId, version: "1.0.0" }] });
                return output("Bundle installed.");
            }
        }
        assert.fail(`Unexpected synthetic setup command: ${tool} ${args.join(" ")}`);
    };
    const options = {
        workspacePath, homeDirectory: home, host, now, verifyWorkspace: async () => {
            if (currentDirectory !== workspacePath) throw Object.assign(new Error("Synthetic workspace changed."), { code: "context_changed" });
        },
        setupRequired: () => !existsSync(join(workspacePath, ".github", "skills", "speckit-implement", "SKILL.md")),
        reloadSkills: async () => { reloads++; return { warnings: [], errors: reloadErrors }; },
        onContinue: () => { continuations++; },
        inspectWorkspace: async () => ({ ...identity }), runner,
        findExecutable: async (tool: SetupTool) => ["gh", "specify", "uv"].includes(tool) ? join(home, "trusted-tools", tool) : undefined,
    };
    return {
        home, workspacePath, identity, host, options, calls,
        setBusy(value: boolean) { busy = value; },
        changeWorkspace() { currentDirectory = home; },
        changeIdentity() { identity.head = "b".repeat(40); },
        pauseBundle() { pausedBundle = true; },
        resumeBundle() { pausedBundle = false; releaseBundle?.(); },
        authenticate() { authenticationReleased = true; releaseAuthentication?.(); },
        failBundle() { failure = "bundle"; },
        setReloadErrors(errors: string[]) { reloadErrors = errors; },
        reloadCount: () => reloads, continuationCount: () => continuations,
        async cleanup() {
            host.dispose();
            assert.equal(await readFile(join(home, ".sdd-scaffolding-test-owner"), "utf8"), "owned-synthetic-scaffolding-test\n");
            await rm(home, { recursive: true, force: true });
        },
    };
}
