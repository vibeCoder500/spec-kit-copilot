import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import { cp, lstat, mkdir, open, readFile, readdir, realpath, rename, rm, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, delimiter, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { RepositoryConnection } from "./auth.ts";
import { knownRepositoryError, RepositoryError } from "./errors.ts";
import type { RepositoryProfile } from "./profile.ts";
import { supportsRepositoryCloning } from "./host-handoff.ts";
import { createPreparationStore } from "./preparation-store.ts";
import type { HostHandoffAdapter, HostWorkspaceSnapshot, PreparedTarget, RepositorySummary } from "./types.ts";

export interface PreparationSource {
    sourceVersion: string;
    generation: number;
    repository: RepositorySummary;
}

export type CloneMode = "reuse" | "copy";

export interface CloneState {
    operationId: string;
    state: "awaiting_confirmation" | "preparing" | "verifying" | "prepared_for_manual_open" | "prepared" | "cancelled" | "failed";
    repositoryName: string;
    branch: string;
    sourceCommit: string;
    localBranch: string;
    destination: string;
    error?: string;
    appCanvas?: import("./types.ts").AppCanvasState;
    reused?: boolean;
    checkoutCommit?: string;
    migrateFrom?: string;
    copyDestination?: string;
}

interface Operation {
    public: CloneState;
    source: PreparationSource;
    contextId: string;
    confirmation: string;
    account: string;
    expiresAt: number;
    controller?: AbortController;
    completion?: Promise<void>;
    root?: string;
    durable?: boolean;
    existing?: { head: string; branch: string; origin: string; fingerprint: string };
    checkoutCreated?: boolean;
    migrated?: boolean;
    mode?: CloneMode;
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
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const sameSecret = (value: string, expected: string) => typeof value === "string" && value.length <= 256 &&
    timingSafeEqual(Buffer.from(digest(value), "hex"), Buffer.from(expected, "hex"));

export function repositoryFolderName(name: string) {
    if (!name || name.length > 120 || /[<>:"/\\|?*\p{Cc}\p{Cf}]/u.test(name) || /[. ]$/.test(name) ||
        name === "." || name === ".." || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name) ||
        /^[a-f0-9]{32}$/i.test(name)) throw new RepositoryError("invalid_repository_name");
    return name;
}

async function availableCopyDestination(parent: string, folder: string) {
    const entries = await readdir(parent);
    if (entries.length > 100_000) throw new RepositoryError("clone_conflict");
    const occupied = new Set(entries.map(name => name.toLowerCase()));
    let index = 1;
    let name = `${folder}-Copy`;
    while (occupied.has(name.toLowerCase())) name = `${folder}-Copy-${++index}`;
    return join(parent, name);
}

async function existingCheckout(destination: string, remote: string, namedRemote: string, git: string, runner: GitRunner, home: string) {
    try {
        for (const path of [destination, join(destination, ".git")]) {
            const info = await lstat(path);
            if (!info.isDirectory() || info.isSymbolicLink() || await realpath(path) !== resolve(path)) throw new Error();
        }
        const env = cloneEnvironment({ token: "", remote, home, emptyFile: process.platform === "win32" ? "NUL" : "/dev/null" });
        delete env.GIT_CONFIG_KEY_0; delete env.GIT_CONFIG_VALUE_0;
        env.GIT_CONFIG_COUNT = "0"; env.GIT_OPTIONAL_LOCKS = "0";
        const signal = AbortSignal.timeout(10_000);
        const execute = (args: string[]) => runner({ executable: git, args: ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=", ...args], cwd: destination, env, signal });
        const origin = await execute(["remote", "get-url", "origin"]);
        if (![remote, namedRemote].some(value => value.toLowerCase() === origin.replace(/\/$/, "").toLowerCase())) throw new Error();
        const head = await execute(["rev-parse", "HEAD"]);
        const branch = await execute(["symbolic-ref", "--short", "HEAD"]);
        const common = await execute(["rev-parse", "--path-format=absolute", "--git-common-dir"]);
        if (!COMMIT.test(head) || !branch || await realpath(common) !== join(destination, ".git")) throw new Error();
        return { head, branch, origin, fingerprint: await fingerprintCheckout(destination, signal) };
    } catch { throw new RepositoryError("existing_repository_conflict"); }
}

export async function fingerprintCheckout(checkout: string, signal: AbortSignal): Promise<string> {
    const root = await realpath(checkout);
    if ((await lstat(checkout)).isSymbolicLink()) throw new RepositoryError("clone_identity_changed");
    const queue = [root];
    const files: string[] = [];
    let count = 0;
    while (queue.length) {
        if (signal.aborted) throw new RepositoryError("clone_cancelled");
        const directory = queue.pop()!;
        if ((await lstat(directory)).isSymbolicLink()) throw new RepositoryError("clone_identity_changed");
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            if (directory === root && entry.name === ".git") continue;
            if (++count > 100_000 || entry.isSymbolicLink()) throw new RepositoryError("clone_identity_changed");
            const path = join(directory, entry.name);
            if (entry.isDirectory()) queue.push(path);
            else if (entry.isFile()) files.push(path);
            else throw new RepositoryError("clone_identity_changed");
        }
    }
    const hash = createHash("sha256");
    for (const path of files.sort()) {
        if (signal.aborted) throw new RepositoryError("clone_cancelled");
        const before = await lstat(path);
        if (!before.isFile() || before.isSymbolicLink() || await realpath(path) !== path) throw new RepositoryError("clone_identity_changed");
        const handle = await open(path, "r");
        const content = createHash("sha256");
        try {
            const opened = await handle.stat();
            if (!opened.isFile() || opened.ino !== before.ino || opened.dev !== before.dev) throw new RepositoryError("clone_identity_changed");
            const buffer = Buffer.alloc(65_536);
            let position = 0;
            for (;;) {
                if (signal.aborted) throw new RepositoryError("clone_cancelled");
                const result = await handle.read(buffer, 0, buffer.length, position);
                if (!result.bytesRead) break;
                content.update(buffer.subarray(0, result.bytesRead)); position += result.bytesRead;
            }
            const after = await handle.stat();
            if (position !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) throw new RepositoryError("clone_identity_changed");
        } finally { await handle.close(); }
        hash.update(relative(root, path).split(sep).join("/")); hash.update("\0"); hash.update(String(before.mode & 0o111)); hash.update("\0"); hash.update(content.digest());
    }
    return hash.digest("hex");
}

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

async function removeOwnedStage(root: string, operationId: string, ownedCheckout?: string) {
    try {
        const marker = JSON.parse(await readFile(join(root, ".sdd-clone-owner.json"), "utf8"));
        if (marker.operationId !== operationId || marker.kind !== "sdd-repository-clone") return;
        if (ownedCheckout && (marker.destination !== ownedCheckout || dirname(ownedCheckout) !== dirname(root))) return;
        const children = await readdir(root, { withFileTypes: true });
        if (children.some((child) => ![".sdd-clone-owner.json", "config", "checkout"].includes(child.name) || child.isSymbolicLink())) return;
        const queue = [root, ...(ownedCheckout ? [ownedCheckout] : [])];
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
        if (ownedCheckout) await rm(ownedCheckout, { recursive: true });
        await rm(root, { recursive: true });
    } catch { return; }
}

export function createCloneService({ readSource, connection, profile, workspacePath, homeDirectory = homedir(), runner = runGit, executable,
    onPrepared, onChange = () => undefined, now = Date.now }: {
    readSource: (contextId: string) => Promise<PreparationSource>;
    connection: RepositoryConnection;
    profile: Readonly<RepositoryProfile>;
    workspacePath: string;
    homeDirectory?: string;
    runner?: GitRunner;
    executable?: string;
    onChange?: () => void;
    now?: () => number;
    onPrepared?: (target: PreparedTarget) => Promise<void>;
}) {
    const operations = new Map<string, Operation>();
    const pending = new Set<Promise<void>>();
    let active: Operation | undefined;
    let disposed = false;

    const identity = (access: Awaited<ReturnType<RepositoryConnection["access"]>>) => JSON.stringify([access.tenantId, access.accountId, access.connectionId, access.generation]);

    function update(operation: Operation, state: CloneState["state"], error?: string) {
        operation.public = { ...operation.public, state, ...(error ? { error } : {}) };
        try { onChange(); } catch { return; }
    }

    async function prepare(operation: Operation) {
        const controller = operation.controller!;
        const deadline = AbortSignal.timeout(600_000);
        let environment: NodeJS.ProcessEnv | undefined;
        try {
            const source = await readSource(operation.contextId);
            const access = await connection.access();
            if (disposed || operation.account !== identity(access) || source.sourceVersion !== operation.source.sourceVersion || source.repository.id !== operation.source.repository.id ||
                source.repository.defaultBranch !== operation.source.repository.defaultBranch) throw new RepositoryError("invalid_context");
            access.assertCurrent();
            const signal = AbortSignal.any([controller.signal, access.signal, deadline]);
            if (signal.aborted) throw new RepositoryError("clone_cancelled");
            const git = executable ?? await findGitExecutable(workspacePath);
            if (!isAbsolute(git)) throw new RepositoryError("clone_conflict");
            const canonicalHome = await realpath(homeDirectory);
            const parent = join(canonicalHome, "SpecKitCanvas", "repositories");
            await ensureParents(parent);
            const root = join(parent, operation.public.operationId);
            await mkdir(root);
            operation.root = root;
            await writeFile(join(root, ".sdd-clone-owner.json"), JSON.stringify({ kind: "sdd-repository-clone", operationId: operation.public.operationId,
                destination: operation.public.destination }), { flag: "wx" });
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
            if (operation.existing) {
                const namedRemote = `https://dev.azure.com/${[profile.organization, profile.project, "_git", source.repository.name].map(encodeURIComponent).join("/")}`;
                const current = await existingCheckout(operation.public.migrateFrom ?? operation.public.destination, remote, namedRemote, git, runner, canonicalHome);
                if (JSON.stringify(current) !== JSON.stringify(operation.existing)) throw new RepositoryError("clone_identity_changed");
                if (operation.public.migrateFrom) {
                    const lockPath = join(parent, `.migration-${digest(operation.public.destination)}.lock`);
                    const lock = await open(lockPath, "wx");
                    try {
                        try { await lstat(operation.public.destination); throw new RepositoryError("existing_repository_conflict"); }
                        catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
                        access.assertCurrent(); if (signal.aborted) throw new RepositoryError("clone_cancelled");
                        try {
                            await rename(operation.public.migrateFrom, operation.public.destination);
                            operation.migrated = true;
                        } catch (error) {
                            if (!["EPERM", "EBUSY", "EACCES"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
                            await mkdir(operation.public.destination);
                            operation.checkoutCreated = true;
                            let copied = 0;
                            const copyOptions = {
                                recursive: true, force: false, errorOnExist: true, preserveTimestamps: true,
                                filter: async (path: string) => {
                                    if (signal.aborted) throw new RepositoryError("clone_cancelled");
                                    const info = await lstat(path);
                                    if (++copied > 100_000 || info.isSymbolicLink() || (!info.isFile() && !info.isDirectory())) {
                                        throw new RepositoryError("clone_identity_changed");
                                    }
                                    return true;
                                },
                            };
                            for (const entry of await readdir(operation.public.migrateFrom)) {
                                await cp(join(operation.public.migrateFrom, entry), join(operation.public.destination, entry), copyOptions);
                            }
                        }
                    } finally { await lock.close(); await unlink(lockPath); }
                }
            } else {
                try { await lstat(operation.public.destination); throw new RepositoryError("existing_repository_conflict"); }
                catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
                await mkdir(operation.public.destination);
                operation.checkoutCreated = true;
                await gitCommand(["clone", "--no-checkout", "--no-recurse-submodules", "--single-branch", "--branch", source.repository.defaultBranch!.slice(11), "--", remote, operation.public.destination]);
            }
            update(operation, "verifying");
            if (!operation.existing) {
                try { await gitCommand(["cat-file", "-e", `${source.sourceVersion}^{commit}`], operation.public.destination); }
                catch {
                    if (signal.aborted) throw new RepositoryError("clone_cancelled");
                    await gitCommand(["fetch", "--no-tags", "--no-recurse-submodules", "origin", source.sourceVersion], operation.public.destination);
                    await gitCommand(["cat-file", "-e", `${source.sourceVersion}^{commit}`], operation.public.destination);
                }
                await gitCommand(["checkout", "--no-recurse-submodules", "-b", operation.public.localBranch, source.sourceVersion, "--"], operation.public.destination);
            }
            const head = await gitCommand(["rev-parse", "HEAD"], operation.public.destination);
            const origin = await gitCommand(["remote", "get-url", "origin"], operation.public.destination);
            const branch = await gitCommand(["symbolic-ref", "--short", "HEAD"], operation.public.destination);
            if (head !== (operation.existing?.head ?? source.sourceVersion) || origin !== (operation.existing?.origin ?? remote) ||
                branch !== operation.public.localBranch) throw new RepositoryError("clone_conflict");
            const common = await gitCommand(["rev-parse", "--path-format=absolute", "--git-common-dir"], operation.public.destination);
            const gitDirectory = await realpath(common);
            if (gitDirectory !== join(operation.public.destination, ".git")) throw new RepositoryError("clone_conflict");
            access.assertCurrent(); if (signal.aborted) throw new RepositoryError("clone_cancelled");
            if (onPrepared) {
                if (!operation.existing && await gitCommand(["status", "--porcelain=v1", "--untracked-files=all"], operation.public.destination)) throw new RepositoryError("clone_identity_changed");
                const initialWorktreeFingerprint = await fingerprintCheckout(operation.public.destination, signal);
                if (operation.existing && initialWorktreeFingerprint !== operation.existing.fingerprint) throw new RepositoryError("clone_identity_changed");
                access.assertCurrent(); if (signal.aborted) throw new RepositoryError("clone_cancelled");
                await onPrepared({ operationId: operation.public.operationId, repositoryId: source.repository.id, originIdentity: origin,
                    defaultRef: source.repository.defaultBranch!, sourceCommit: head, destination: await realpath(operation.public.destination),
                    gitCommonDirectory: gitDirectory, branch: `refs/heads/${branch}`, initialWorktreeFingerprint,
                    ...(operation.existing ? { reused: true } : {}) });
            } else {
                const metadataDirectory = join(canonicalHome, ".speckit-canvas", "preparations");
                await ensureParents(metadataDirectory);
                await writeFile(join(metadataDirectory, `${operation.public.operationId}.json`), JSON.stringify({ schemaVersion: 1, operationId: operation.public.operationId,
                    kind: "sdd-prepared-repository", gitDirectory, checkout: operation.public.destination, remote, repositoryId: source.repository.id,
                    initialCommit: head, initialBranch: branch, createdAt: new Date(now()).toISOString() }), { flag: "wx" });
            }
            operation.durable = true;
            update(operation, onPrepared ? "prepared" : "prepared_for_manual_open");
        } catch (error) {
            if (operation.migrated && !operation.durable) {
                try { await rename(operation.public.destination, operation.public.migrateFrom!); }
                catch {
                    update(operation, "failed", "clone_migration_recovery_required");
                    return;
                }
                operation.migrated = false;
            }
            const cancelled = controller.signal.aborted || deadline.aborted || (error as { code?: unknown })?.code === "clone_cancelled";
            update(operation, cancelled ? "cancelled" : "failed", cancelled ? "clone_cancelled" : error instanceof RepositoryError ? error.code : "clone_conflict");
            if (operation.root && !operation.durable) await removeOwnedStage(operation.root, operation.public.operationId,
                operation.checkoutCreated && dirname(operation.public.destination) === dirname(operation.root) ? operation.public.destination : undefined);
        } finally {
            if (environment) { delete environment.GIT_CONFIG_VALUE_0; delete environment.GIT_CONFIG_KEY_0; }
            if (active === operation) active = undefined;
        }
    }

    return {
        async confirm(contextId: string) {
            if (disposed || active) throw new RepositoryError("clone_conflict");
            const source = await readSource(contextId);
            if (!COMMIT.test(source.sourceVersion) || !source.repository.defaultBranch || source.repository.operationalState !== "active") throw new RepositoryError("source_unavailable");
            const access = await connection.access();
            if (source.generation !== access.generation) throw new RepositoryError("invalid_context");
            const canonicalHome = await realpath(homeDirectory);
            const operationId = randomBytes(16).toString("hex");
            const folder = repositoryFolderName(source.repository.name);
            const parent = join(canonicalHome, "SpecKitCanvas", "repositories");
            const destination = onPrepared ? join(parent, folder) : join(parent, operationId, "checkout");
            const records = await createPreparationStore({ homeDirectory }).list();
            if (records.hasMore) throw new RepositoryError("clone_conflict");
            const matchingRecords = records.items.filter(item => item.record?.repositoryId === source.repository.id &&
                item.record.profileFingerprint === digest(JSON.stringify(profile)) &&
                item.record.accountKey === digest(JSON.stringify([access.tenantId, access.accountId])));
            const named = matchingRecords.filter(item => item.destination === destination);
            const matching = named.length ? named : matchingRecords.filter(item => basename(item.destination) === "checkout" &&
                operationIdPattern.test(basename(dirname(item.destination))) && dirname(dirname(item.destination)) === parent);
            if (matching.length > 1) throw new RepositoryError("existing_repository_conflict");
            let migrateFrom: string | undefined;
            if (onPrepared && matching[0] && matching[0].destination !== destination) {
                const previous = matching[0].destination;
                if (basename(previous) !== "checkout" || !operationIdPattern.test(basename(dirname(previous))) ||
                    dirname(dirname(previous)) !== parent) throw new RepositoryError("existing_repository_conflict");
                try { await lstat(destination); }
                catch (error) {
                    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
                    migrateFrom = previous;
                }
            }
            let existing: Operation["existing"];
            try {
                await lstat(migrateFrom ?? destination);
                const remote = `https://dev.azure.com/${[profile.organization, profile.project, "_git", source.repository.id].map(encodeURIComponent).join("/")}`;
                const namedRemote = `https://dev.azure.com/${[profile.organization, profile.project, "_git", source.repository.name].map(encodeURIComponent).join("/")}`;
                existing = await existingCheckout(migrateFrom ?? destination, remote, namedRemote, executable ?? await findGitExecutable(workspacePath), runner, canonicalHome);
                const request = matching[0]?.record?.appCanvas;
                if (request && request.launchStatus !== "failed" && request.canvasStatus !== "failed" &&
                    (request.launchStatus === "unknown" || ["opening", "unknown"].includes(request.canvasStatus) ||
                        request.canvasStatus !== "opened" && request.expiresAt > now())) throw new RepositoryError("app_launch_unknown");
            } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
            const confirmation = randomBytes(32).toString("base64url");
            const state: CloneState = { operationId, state: "awaiting_confirmation", repositoryName: source.repository.name,
                sourceCommit: source.sourceVersion, branch: source.repository.defaultBranch, localBranch: existing?.branch ?? `speckit/canvas-${operationId}`,
                destination, ...(migrateFrom ? { migrateFrom } : {}), ...(existing ? { reused: true, checkoutCommit: existing.head,
                    ...(onPrepared ? { copyDestination: await availableCopyDestination(parent, folder) } : {}) } : {}) };
            for (const [key, operation] of operations) if (!operation.completion && operation.expiresAt <= now()) operations.delete(key);
            if (operations.size >= 32) throw new RepositoryError("clone_conflict");
            operations.set(operationId, { public: state, source, contextId, confirmation: digest(confirmation), account: identity(access), expiresAt: now() + 120_000, existing });
            return { ...state, confirmation, accountLabel: connection.snapshot().accountLabel ?? "Microsoft account" };
        },
        async start(operationId: string, confirmation: string, mode: CloneMode = "reuse") {
            if (disposed || !operationIdPattern.test(operationId)) throw new RepositoryError("clone_conflict");
            const operation = operations.get(operationId);
            if (!operation || !sameSecret(confirmation, operation.confirmation)) throw new RepositoryError("clone_conflict");
            if (mode !== "reuse" && mode !== "copy") throw new RepositoryError("invalid_request");
            const access = await connection.access();
            if (operation.account !== identity(access)) throw new RepositoryError("invalid_context");
            if (operation.completion) {
                if (operation.mode !== mode) throw new RepositoryError("clone_conflict");
                return { ...operation.public };
            }
            if (operation.public.state === "cancelled") throw new RepositoryError("clone_cancelled");
            if (active || operation.expiresAt <= now()) throw new RepositoryError("clone_conflict");
            if (mode === "copy") {
                if (!operation.existing || !operation.public.copyDestination) throw new RepositoryError("invalid_request");
                operation.public = { ...operation.public, destination: operation.public.copyDestination, localBranch: `speckit/canvas-${operationId}` };
                delete operation.public.reused; delete operation.public.checkoutCommit; delete operation.public.migrateFrom;
                operation.existing = undefined;
            }
            operation.mode = mode;
            delete operation.public.copyDestination;
            operation.controller = new AbortController(); active = operation;
            update(operation, "preparing");
            operation.completion = prepare(operation);
            pending.add(operation.completion);
            void operation.completion.finally(() => pending.delete(operation.completion!));
            return { ...operation.public };
        },
        status(operationId: string) {
            const operation = operations.get(operationId);
            if (!operation) throw new RepositoryError("invalid_context");
            return { ...operation.public };
        },
        async completion(operationId: string) { await operations.get(operationId)?.completion; },
        async settled() { await Promise.all(pending); },
        cancel(operationId: string) {
            const operation = operations.get(operationId);
            if (!operation) throw new RepositoryError("invalid_context");
            if (operation.durable) return;
            operation.controller?.abort();
            if (!operation.completion) update(operation, "cancelled", "clone_cancelled");
        },
        clear() { active?.controller?.abort(); operations.clear(); },
        dispose() { disposed = true; active?.controller?.abort(); operations.clear(); },
    };
}

export type CloneService = ReturnType<typeof createCloneService>;

export function createEntryCloneService({ host, readSource, connection, profile, workspacePath, homeDirectory = homedir(), now = Date.now, ...options }: {
    host: HostHandoffAdapter;
    readSource: (selectionId: string) => Promise<PreparationSource>;
    connection: RepositoryConnection;
    profile: Readonly<RepositoryProfile>;
    workspacePath: string;
    homeDirectory?: string;
    now?: () => number;
    runner?: GitRunner;
    executable?: string;
    onChange?: () => void;
}) {
    type Consent = { selectionId: string; source: PreparationSource; expected: HostWorkspaceSnapshot; account: string; accountKey: string;
        digest: string; createdAt: number; expiresAt: number; requestId?: string; mode?: CloneMode; start?: Promise<CloneState>; revoked: boolean };
    const consents = new Map<string, Consent>();
    const store = createPreparationStore({ homeDirectory });
    const profileFingerprint = digest(JSON.stringify(profile));
    let disposed = false;
    let starting: string | undefined;
    const identity = (access: Awaited<ReturnType<RepositoryConnection["access"]>>) => JSON.stringify([access.tenantId, access.accountId, access.connectionId, access.generation]);
    const accountKey = (access: Awaited<ReturnType<RepositoryConnection["access"]>>) => digest(JSON.stringify([access.tenantId, access.accountId]));
    function guard(snapshot: HostWorkspaceSnapshot, expected: HostWorkspaceSnapshot) {
        if (disposed) throw new RepositoryError("invalid_context");
        if (!supportsRepositoryCloning(snapshot)) throw new RepositoryError("activity_unknown");
        if (snapshot.activity !== "idle") throw new RepositoryError(snapshot.activity === "busy" ? "session_busy" : "activity_unknown");
        if (snapshot.sessionId !== expected.sessionId || snapshot.contextRevision !== expected.contextRevision || snapshot.workingDirectory !== expected.workingDirectory ||
            snapshot.capabilityGeneration !== expected.capabilityGeneration || snapshot.activityRevision !== expected.activityRevision) throw new RepositoryError("context_changed");
    }
    const core = createCloneService({ ...options, readSource, connection, profile, workspacePath, homeDirectory, now,
        onPrepared: async target => {
            const consent = consents.get(target.operationId);
            if (!consent) throw new RepositoryError("invalid_context");
            const previous = (await store.list()).items.flatMap(item => item.record?.destination === target.destination ? [item.record.completedAt] : []);
            await store.write({ ...target, schemaVersion: 2, kind: "sdd-prepared-repository", profileFingerprint, accountKey: consent.accountKey,
                createdAt: consent.createdAt, completedAt: Math.max(now(), ...previous.map(time => time + 1)) });
        } });
    return {
        async confirm(selectionId: string, expected: HostWorkspaceSnapshot) {
            guard(await host.inspectCurrent(), expected);
            if (starting || consents.size >= 32) throw new RepositoryError("clone_conflict");
            const source = await readSource(selectionId);
            const access = await connection.access();
            const preview = await core.confirm(selectionId);
            access.assertCurrent(); guard(await host.inspectCurrent(), expected);
            if (source.generation !== access.generation || source.sourceVersion !== preview.sourceCommit || source.repository.defaultBranch !== preview.branch) throw new RepositoryError("source_changed");
            for (const consent of consents.values()) if (!consent.start) consent.revoked = true;
            const createdAt = now();
            consents.set(preview.operationId, { selectionId, source, expected: structuredClone(expected), account: identity(access), accountKey: accountKey(access),
                digest: digest(preview.confirmation), createdAt, expiresAt: createdAt + 120_000, revoked: false });
            return { ...preview, expiresAt: createdAt + 120_000 };
        },
        async start(operationId: string, confirmation: string, requestId: string, mode: CloneMode = "reuse") {
            const consent = consents.get(operationId);
            if (disposed || !consent || !requestId || requestId.length > 256 || !sameSecret(confirmation, consent.digest)) throw new RepositoryError("clone_conflict");
            if (mode !== "reuse" && mode !== "copy") throw new RepositoryError("invalid_request");
            if (mode === "copy" && !consent.start && !core.status(operationId).copyDestination) throw new RepositoryError("invalid_request");
            const access = await connection.access();
            if (identity(access) !== consent.account) throw new RepositoryError("invalid_context");
            if (consent.start) {
                if (consent.requestId !== requestId || consent.mode !== mode) throw new RepositoryError("clone_conflict");
                await consent.start;
                return core.status(operationId);
            }
            if (consent.revoked || now() >= consent.expiresAt) throw new RepositoryError("confirmation_expired");
            if (starting) throw new RepositoryError("clone_conflict");
            starting = operationId; consent.requestId = requestId; consent.mode = mode;
            consent.start = (async () => {
                try {
                    const source = await readSource(consent.selectionId);
                    access.assertCurrent();
                    if (source.sourceVersion !== consent.source.sourceVersion || source.repository.id !== consent.source.repository.id ||
                        source.repository.defaultBranch !== consent.source.repository.defaultBranch || source.generation !== consent.source.generation) throw new RepositoryError("source_changed");
                    const snapshot = await host.inspectCurrent(); guard(snapshot, consent.expected);
                    if (now() >= consent.expiresAt) throw new RepositoryError("confirmation_expired");
                    const state = await host.admitPreparation({ operationId, expectedSource: { sessionId: snapshot.sessionId, contextRevision: snapshot.contextRevision },
                        capabilityGeneration: snapshot.capabilityGeneration, activityRevision: snapshot.activityRevision }, async () => {
                        access.assertCurrent();
                        if (disposed || consent.revoked) throw new RepositoryError("confirmation_expired");
                        return core.start(operationId, confirmation, mode);
                    });
                    return state;
                } catch (error) { consent.revoked = true; throw knownRepositoryError((error as { code?: unknown })?.code); }
                finally { if (starting === operationId) starting = undefined; }
            })();
            return consent.start;
        },
        status: core.status,
        completion: core.completion,
        settled: core.settled,
        cancel(operationId: string) {
            const consent = consents.get(operationId);
            if (consent) consent.revoked = true;
            core.cancel(operationId);
        },
        async authorized(operationId: string) {
            const consent = consents.get(operationId);
            if (disposed || !consent) throw new RepositoryError("resource_unavailable");
            try { if (accountKey(await connection.access()) !== consent.accountKey) throw new Error(); }
            catch { throw new RepositoryError("resource_unavailable"); }
            return core.status(operationId);
        },
        invalidate() {
            if (disposed) return;
            for (const [operationId, consent] of consents) {
                consent.revoked = true;
                if (["preparing", "verifying"].includes(core.status(operationId).state)) core.cancel(operationId);
            }
        },
        dispose() { disposed = true; core.dispose(); },
    };
}

export type EntryCloneService = ReturnType<typeof createEntryCloneService>;