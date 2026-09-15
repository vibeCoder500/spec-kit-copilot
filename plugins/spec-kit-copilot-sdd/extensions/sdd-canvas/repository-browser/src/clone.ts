import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { delimiter, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { RepositoryConnection } from "./auth.ts";
import { RepositoryError } from "./errors.ts";
import type { RepositoryProfile } from "./profile.ts";
import type { RemoteReview } from "./remote-review.ts";
import type { RepositoryContext } from "./types.ts";

export interface CloneState {
    operationId: string;
    state: "awaiting_confirmation" | "preparing" | "verifying" | "prepared_for_manual_open" | "cancelled" | "failed";
    repositoryName: string;
    branch: string;
    sourceCommit: string;
    localBranch: string;
    destination: string;
    error?: string;
}

interface Operation {
    public: CloneState;
    source: RepositoryContext;
    contextId: string;
    confirmation: string;
    account: string;
    expiresAt: number;
    controller?: AbortController;
    completion?: Promise<void>;
    root?: string;
}

export interface GitExecution {
    executable: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
    signal: AbortSignal;
}

export type GitRunner = (input: GitExecution) => Promise<string>;
const COMMIT = /^[a-f0-9]{40}$/;
const operationIdPattern = /^[a-f0-9]{32}$/;

export async function runGit({ executable, args, cwd, env, signal }: GitExecution): Promise<string> {
    if (signal.aborted) throw new RepositoryError("clone_cancelled");
    return new Promise<string>((resolveResult, reject) => {
        const child = spawn(executable, args, { cwd, env, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
        const chunks: Buffer[] = [];
        let bytes = 0;
        let excessive = false;
        let settled = false;
        let spawnFailed = false;
        let terminating = false;
        let termination: Promise<void> = Promise.resolve();
        const terminate = () => {
            if (terminating || !child.pid || child.exitCode !== null) return;
            terminating = true;
            if (process.platform === "win32") {
                const systemRoot = env.SystemRoot ?? env.SYSTEMROOT ?? process.env.SystemRoot ?? process.env.SYSTEMROOT;
                if (!systemRoot || !isAbsolute(systemRoot)) { child.kill("SIGTERM"); return; }
                termination = new Promise<void>((resolveTermination) => {
                    const killer = spawn(join(systemRoot, "System32", "taskkill.exe"), ["/PID", String(child.pid), "/T", "/F"],
                        { windowsHide: true, shell: false, stdio: "ignore" });
                    killer.once("error", () => { child.kill("SIGTERM"); resolveTermination(); });
                    killer.once("close", () => resolveTermination());
                });
            } else {
                try { process.kill(-child.pid, "SIGTERM"); } catch { child.kill("SIGTERM"); }
            }
        };
        const finish = (failure?: RepositoryError) => {
            if (settled) return;
            settled = true;
            signal.removeEventListener("abort", terminate);
            if (failure) reject(failure); else resolveResult(Buffer.concat(chunks).toString("utf8").trim());
        };
        child.stdout.on("data", (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > 1_048_576) { excessive = true; terminate(); } else chunks.push(chunk);
        });
        child.stderr.on("data", (chunk: Buffer) => { bytes += chunk.length; if (bytes > 1_048_576) { excessive = true; terminate(); } });
        child.once("error", () => { spawnFailed = true; if (!child.pid) finish(new RepositoryError("clone_conflict")); });
        child.once("close", (code) => { void termination.then(() => finish(signal.aborted ? new RepositoryError("clone_cancelled") : code !== 0 || excessive || spawnFailed ? new RepositoryError("clone_conflict") : undefined)); });
        signal.addEventListener("abort", terminate, { once: true });
        if (signal.aborted) terminate();
    });
}

function inside(root: string, target: string) {
    const path = relative(root, target);
    return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

export async function findGitExecutable(workspacePath: string, environment: NodeJS.ProcessEnv = process.env): Promise<string> {
    const filename = process.platform === "win32" ? "git.exe" : "git";
    for (const directory of (environment.PATH ?? environment.Path ?? "").split(delimiter)) {
        if (!directory || !isAbsolute(directory) || inside(resolve(workspacePath), resolve(directory))) continue;
        const candidate = join(directory, filename);
        try {
            const info = await lstat(candidate);
            if (info.isFile() && !info.isSymbolicLink()) return await realpath(candidate);
        } catch { continue; }
    }
    throw new RepositoryError("clone_conflict");
}

export function cloneEnvironment({ token, remote, home, emptyFile, signalEnvironment = process.env }: {
    token: string; remote: string; home: string; emptyFile: string; signalEnvironment?: NodeJS.ProcessEnv;
}) {
    const env: NodeJS.ProcessEnv = {};
    const allow = new Set(["path", "pathext", "systemroot", "windir", "comspec", "temp", "tmp"]);
    for (const [name, value] of Object.entries(signalEnvironment)) if (allow.has(name.toLowerCase())) env[name] = value;
    Object.assign(env, { HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: home, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: emptyFile,
        GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never", GIT_LFS_SKIP_SMUDGE: "1", GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: `http.${remote}.extraHeader`, GIT_CONFIG_VALUE_0: `AUTHORIZATION: bearer ${token}` });
    return env;
}

async function ensureParents(path: string) {
    const parents: string[] = [];
    for (let current = resolve(path); ; current = dirname(current)) { parents.push(current); if (dirname(current) === current) break; }
    for (const parent of parents.reverse()) {
        try {
            const info = await lstat(parent);
            if (!info.isDirectory() || info.isSymbolicLink()) throw new RepositoryError("clone_conflict");
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
            await mkdir(parent);
        }
    }
}

async function removeOwnedStage(root: string, operationId: string) {
    try {
        const marker = JSON.parse(await readFile(join(root, ".sdd-clone-owner.json"), "utf8"));
        if (marker.operationId !== operationId || marker.kind !== "sdd-repository-clone") return;
        const children = await readdir(root, { withFileTypes: true });
        if (children.some((child) => ![".sdd-clone-owner.json", "config", "checkout"].includes(child.name) || child.isSymbolicLink())) return;
        const queue = [root];
        let count = 0;
        while (queue.length) {
            const directory = queue.pop()!;
            if ((await lstat(directory)).isSymbolicLink()) return;
            for (const entry of await readdir(directory, { withFileTypes: true })) {
                if (++count > 100_000 || entry.isSymbolicLink()) return;
                if (entry.isDirectory()) queue.push(join(directory, entry.name));
                else if (!entry.isFile()) return;
            }
        }
        await rm(root, { recursive: true });
    } catch { return; }
}

export function createCloneService({ review, connection, profile, workspacePath, homeDirectory = homedir(), runner = runGit, executable, onChange = () => undefined, now = Date.now }: {
    review: RemoteReview;
    connection: RepositoryConnection;
    profile: Readonly<RepositoryProfile>;
    workspacePath: string;
    homeDirectory?: string;
    runner?: GitRunner;
    executable?: string;
    onChange?: () => void;
    now?: () => number;
}) {
    const operations = new Map<string, Operation>();
    let active: Operation | undefined;
    let disposed = false;

    const identity = (access: Awaited<ReturnType<RepositoryConnection["access"]>>) => JSON.stringify([access.tenantId, access.accountId, access.connectionId, access.generation]);

    function update(operation: Operation, state: CloneState["state"], error?: string) {
        operation.public = { ...operation.public, state, ...(error ? { error } : {}) };
        onChange();
    }

    async function prepare(operation: Operation) {
        const controller = operation.controller!;
        const deadline = AbortSignal.timeout(600_000);
        let environment: NodeJS.ProcessEnv | undefined;
        try {
            const source = await review.source(operation.contextId);
            const access = await connection.access();
            if (disposed || operation.account !== identity(access) || source.sourceVersion !== operation.source.sourceVersion || source.repository.id !== operation.source.repository.id) throw new RepositoryError("invalid_context");
            access.assertCurrent();
            const signal = AbortSignal.any([controller.signal, access.signal, deadline]);
            const git = executable ?? await findGitExecutable(workspacePath);
            if (!isAbsolute(git)) throw new RepositoryError("clone_conflict");
            const canonicalHome = await realpath(homeDirectory);
            const parent = join(canonicalHome, "SpecKitCanvas", "repositories");
            await ensureParents(parent);
            const root = join(parent, operation.public.operationId);
            await mkdir(root);
            operation.root = root;
            await writeFile(join(root, ".sdd-clone-owner.json"), JSON.stringify({ kind: "sdd-repository-clone", operationId: operation.public.operationId }), { flag: "wx" });
            const config = join(root, "config"); await mkdir(config);
            const hooks = join(config, "hooks"); await mkdir(hooks);
            const emptyFile = join(config, "empty"); await writeFile(emptyFile, "", { flag: "wx" });
            const remote = `https://dev.azure.com/${[profile.organization, profile.project, "_git", source.repository.id].map(encodeURIComponent).join("/")}`;
            environment = cloneEnvironment({ token: access.accessToken, remote, home: config, emptyFile });
            const policy = ["-c", "credential.helper=", "-c", "credential.interactive=false", "-c", `core.hooksPath=${hooks}`,
                "-c", `core.attributesFile=${emptyFile}`, "-c", `init.templateDir=${hooks}`, "-c", "protocol.allow=never",
                "-c", "protocol.https.allow=always", "-c", "http.followRedirects=false", "-c", "core.symlinks=false",
                "-c", "submodule.recurse=false", "-c", "gc.auto=0"];
            const gitCommand = async (args: string[], cwd = root) => {
                access.assertCurrent(); if (signal.aborted) throw new RepositoryError("clone_cancelled");
                return runner({ executable: git, args: [...policy, ...args], cwd, env: environment!, signal });
            };
            update(operation, "preparing");
            await gitCommand(["clone", "--no-checkout", "--no-recurse-submodules", "--single-branch", "--branch", source.repository.defaultBranch!.slice(11), "--", remote, operation.public.destination]);
            update(operation, "verifying");
            try { await gitCommand(["cat-file", "-e", `${source.sourceVersion}^{commit}`], operation.public.destination); }
            catch {
                if (signal.aborted) throw new RepositoryError("clone_cancelled");
                await gitCommand(["fetch", "--no-tags", "--no-recurse-submodules", "origin", source.sourceVersion], operation.public.destination);
                await gitCommand(["cat-file", "-e", `${source.sourceVersion}^{commit}`], operation.public.destination);
            }
            await gitCommand(["checkout", "--no-recurse-submodules", "-b", operation.public.localBranch, source.sourceVersion, "--"], operation.public.destination);
            const head = await gitCommand(["rev-parse", "HEAD"], operation.public.destination);
            const origin = await gitCommand(["remote", "get-url", "origin"], operation.public.destination);
            const branch = await gitCommand(["symbolic-ref", "--short", "HEAD"], operation.public.destination);
            if (head !== source.sourceVersion || origin !== remote || branch !== operation.public.localBranch) throw new RepositoryError("clone_conflict");
            const common = await gitCommand(["rev-parse", "--path-format=absolute", "--git-common-dir"], operation.public.destination);
            const gitDirectory = await realpath(common);
            if (!inside(root, gitDirectory)) throw new RepositoryError("clone_conflict");
            const metadataDirectory = join(canonicalHome, ".speckit-canvas", "preparations");
            await ensureParents(metadataDirectory);
            access.assertCurrent(); if (signal.aborted) throw new RepositoryError("clone_cancelled");
            await writeFile(join(metadataDirectory, `${operation.public.operationId}.json`), JSON.stringify({ schemaVersion: 1, operationId: operation.public.operationId,
                kind: "sdd-prepared-repository", gitDirectory, checkout: operation.public.destination, remote, repositoryId: source.repository.id,
                initialCommit: head, initialBranch: branch, createdAt: new Date(now()).toISOString() }), { flag: "wx" });
            update(operation, "prepared_for_manual_open");
        } catch (error) {
            const cancelled = controller.signal.aborted || deadline.aborted || (error as { code?: unknown })?.code === "clone_cancelled";
            update(operation, cancelled ? "cancelled" : "failed", cancelled ? "clone_cancelled" : "clone_conflict");
            if (operation.root) await removeOwnedStage(operation.root, operation.public.operationId);
        } finally {
            if (environment) { delete environment.GIT_CONFIG_VALUE_0; delete environment.GIT_CONFIG_KEY_0; }
            if (active === operation) active = undefined;
        }
    }

    return {
        async confirm(contextId: string) {
            if (disposed || active) throw new RepositoryError("clone_conflict");
            const source = await review.source(contextId);
            if (!COMMIT.test(source.sourceVersion) || !source.repository.defaultBranch || source.repository.operationalState !== "active") throw new RepositoryError("source_unavailable");
            const access = await connection.access();
            if (source.generation !== access.generation) throw new RepositoryError("invalid_context");
            const canonicalHome = await realpath(homeDirectory);
            const operationId = randomBytes(16).toString("hex");
            const confirmation = randomBytes(32).toString("base64url");
            const state: CloneState = { operationId, state: "awaiting_confirmation", repositoryName: source.repository.name,
                sourceCommit: source.sourceVersion, branch: source.repository.defaultBranch, localBranch: `speckit/canvas-${operationId}`,
                destination: join(canonicalHome, "SpecKitCanvas", "repositories", operationId, "checkout") };
            for (const [key, operation] of operations) if (!operation.completion && operation.expiresAt <= now()) operations.delete(key);
            if (operations.size >= 32) throw new RepositoryError("clone_conflict");
            operations.set(operationId, { public: state, source, contextId, confirmation, account: identity(access), expiresAt: now() + 120_000 });
            return { ...state, confirmation, accountLabel: connection.snapshot().accountLabel ?? "Microsoft account" };
        },
        async start(operationId: string, confirmation: string) {
            if (disposed || !operationIdPattern.test(operationId)) throw new RepositoryError("clone_conflict");
            const operation = operations.get(operationId);
            if (!operation || confirmation !== operation.confirmation) throw new RepositoryError("clone_conflict");
            const access = await connection.access();
            if (operation.account !== identity(access)) throw new RepositoryError("invalid_context");
            if (operation.completion) return { ...operation.public };
            if (active || operation.expiresAt <= now()) throw new RepositoryError("clone_conflict");
            operation.controller = new AbortController(); active = operation;
            update(operation, "preparing");
            operation.completion = prepare(operation);
            return { ...operation.public };
        },
        status(operationId: string) {
            const operation = operations.get(operationId);
            if (!operation) throw new RepositoryError("invalid_context");
            return { ...operation.public };
        },
        async completion(operationId: string) { await operations.get(operationId)?.completion; },
        cancel(operationId: string) {
            const operation = operations.get(operationId);
            if (!operation) throw new RepositoryError("invalid_context");
            if (operation.public.state === "prepared_for_manual_open") return;
            operation.controller?.abort();
            if (!operation.completion) { operations.delete(operationId); onChange(); }
        },
        clear() { active?.controller?.abort(); operations.clear(); },
        dispose() { disposed = true; active?.controller?.abort(); operations.clear(); },
    };
}

export type CloneService = ReturnType<typeof createCloneService>;