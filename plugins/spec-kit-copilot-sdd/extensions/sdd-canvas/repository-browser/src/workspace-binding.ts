import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { cloneEnvironment, findGitExecutable, fingerprintCheckout, runGit } from "./clone.ts";
import type { GitRunner } from "./clone.ts";
import { RepositoryError } from "./errors.ts";
import { createPreparationStore } from "./preparation-store.ts";
import type { HostHandoffAdapter, HostWorkspaceSnapshot, LocalRepositoryIdentity, PreparedRepositoryRecord, WorkspaceActivation } from "./types.ts";

export interface WorkspaceBinding {
    state: "ordinary" | "verified" | "mismatch" | "unavailable";
    operationId?: string;
    repositoryId?: string;
    initialCommit?: string;
    gitDirectory?: string;
}

interface Preparation {
    schemaVersion: 1;
    kind: "sdd-prepared-repository";
    operationId: string;
    gitDirectory: string;
    checkout: string;
    remote: string;
    repositoryId: string;
    initialCommit: string;
    initialBranch: string;
}

function inside(root: string, path: string) { const part = relative(root, path); return part !== ".." && !part.startsWith(`..${sep}`) && !isAbsolute(part); }

export async function inspectCurrentRepository({ workspacePath, homeDirectory = homedir(), runner = runGit, executable, signal: cancellation }: {
    workspacePath: string;
    homeDirectory?: string;
    runner?: GitRunner;
    executable?: string;
    signal?: AbortSignal;
}): Promise<LocalRepositoryIdentity | null> {
    try {
        if (!isAbsolute(workspacePath) || /[\p{Cc}\p{Cf}]/u.test(workspacePath)) throw new Error();
        for (let directory = resolve(workspacePath); ; directory = dirname(directory)) {
            const info = await lstat(directory);
            if (!info.isDirectory() || info.isSymbolicLink()) throw new Error();
            if (dirname(directory) === directory) break;
        }
        const workingDirectory = await realpath(workspacePath);
        let repositoryRoot = workingDirectory;
        for (;;) {
            try {
                const marker = await lstat(join(repositoryRoot, ".git"));
                if (marker.isSymbolicLink() || (!marker.isFile() && !marker.isDirectory())) throw new Error();
                break;
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
                const parent = dirname(repositoryRoot);
                if (parent === repositoryRoot) return null;
                repositoryRoot = parent;
            }
        }
        const home = await realpath(homeDirectory);
        const git = executable ?? await findGitExecutable(workingDirectory);
        const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home, emptyFile: process.platform === "win32" ? "NUL" : "/dev/null" });
        delete env.GIT_CONFIG_KEY_0; delete env.GIT_CONFIG_VALUE_0; env.GIT_CONFIG_COUNT = "0";
        env.GIT_OPTIONAL_LOCKS = "0";
        const signal = AbortSignal.any([AbortSignal.timeout(10_000), ...(cancellation ? [cancellation] : [])]);
        const execute = (args: string[]) => runner({ executable: git, args: ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=", ...args], cwd: workingDirectory, env, signal });
        const root = await execute(["rev-parse", "--path-format=absolute", "--show-toplevel"]);
        const common = await execute(["rev-parse", "--path-format=absolute", "--git-common-dir"]);
        if (!isAbsolute(root) || !isAbsolute(common)) throw new Error();
        const worktreeRoot = await realpath(root);
        const gitCommonDirectory = await realpath(common);
        if (worktreeRoot !== await realpath(repositoryRoot) || !inside(worktreeRoot, workingDirectory)) throw new Error();
        const optional = async (args: string[]) => {
            try { return await execute(args); }
            catch (error) { if (signal.aborted) throw error; return null; }
        };
        const head = await optional(["rev-parse", "--verify", "HEAD"]);
        const branch = await optional(["symbolic-ref", "--quiet", "HEAD"]);
        const rawOrigin = await optional(["remote", "get-url", "origin"]);
        if (head !== null && !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i.test(head)) throw new Error();
        if (branch !== null && (!branch.startsWith("refs/heads/") || branch.length > 1024 || /[\p{Cc}\p{Cf}]/u.test(branch))) throw new Error();
        let origin: string | null = null;
        if (rawOrigin && rawOrigin.length <= 4096 && !/[\p{Cc}\p{Cf}]/u.test(rawOrigin)) {
            try {
                const address = new URL(rawOrigin);
                if (["https:", "ssh:"].includes(address.protocol) && !address.password && !address.search && !address.hash &&
                    (!address.username || address.username === "git")) origin = address.href.replace(/\/$/, "");
            } catch { if (/^git@[a-z0-9.-]+:[^?#\s]+$/i.test(rawOrigin)) origin = rawOrigin; }
        }
        if (signal.aborted) throw new Error();
        return { workingDirectory, worktreeRoot, gitCommonDirectory, origin, head, branch };
    } catch { throw new RepositoryError("local_context_mismatch"); }
}

interface PreparationVerificationOptions {
    record: PreparedRepositoryRecord;
    homeDirectory?: string;
    runner?: GitRunner;
    executable?: string;
    signal?: AbortSignal;
}

async function readOnlyGit(workspacePath: string, options: PreparationVerificationOptions, signal: AbortSignal) {
    const home = await realpath(options.homeDirectory ?? homedir());
    const executable = options.executable ?? await findGitExecutable(workspacePath);
    const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home, emptyFile: process.platform === "win32" ? "NUL" : "/dev/null" });
    delete env.GIT_CONFIG_KEY_0; delete env.GIT_CONFIG_VALUE_0; env.GIT_CONFIG_COUNT = "0"; env.GIT_OPTIONAL_LOCKS = "0";
    return (args: string[]) => (options.runner ?? runGit)({ executable, args: ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=", ...args], cwd: workspacePath, env, signal });
}

export async function verifyPreparedRepository(options: PreparationVerificationOptions) {
    const { record } = options;
    const signal = options.signal ?? AbortSignal.timeout(10_000);
    try {
        await createPreparationStore({ homeDirectory: options.homeDirectory }).verifyOwnership(record);
        const identity = await inspectCurrentRepository({ ...options, workspacePath: record.destination, signal });
        if (!identity || identity.workingDirectory !== record.destination || identity.worktreeRoot !== record.destination || identity.gitCommonDirectory !== record.gitCommonDirectory ||
            identity.origin !== record.originIdentity || identity.head !== record.sourceCommit || identity.branch !== record.branch) throw new Error();
        const execute = await readOnlyGit(record.destination, options, signal);
        if (await execute(["status", "--porcelain=v1", "--untracked-files=all"])) throw new Error();
        if (await fingerprintCheckout(record.destination, signal) !== record.initialWorktreeFingerprint || signal.aborted) throw new Error();
        return identity;
    } catch { throw new RepositoryError("clone_identity_changed"); }
}

export async function verifyActivatedRepository(options: PreparationVerificationOptions & { activation: WorkspaceActivation; snapshot: HostWorkspaceSnapshot }) {
    const { record, activation, snapshot } = options;
    const signal = options.signal ?? AbortSignal.timeout(10_000);
    try {
        if (!activation.attemptId || snapshot.sessionId !== activation.sessionId || snapshot.contextRevision !== activation.contextRevision ||
            snapshot.workingDirectory !== activation.workingDirectory || !activation.targetBranch.startsWith("refs/heads/")) throw new Error();
        const original = await verifyPreparedRepository({ ...options, signal });
        if (activation.targetKind === "prepared_checkout") {
            if (activation.workingDirectory !== record.destination || activation.targetBranch !== record.branch) throw new Error();
            return original;
        }
        if (activation.targetKind !== "host_worktree" || activation.workingDirectory === record.destination) throw new Error();
        const identity = await inspectCurrentRepository({ ...options, workspacePath: activation.workingDirectory, signal });
        if (!identity || identity.workingDirectory !== activation.workingDirectory || identity.worktreeRoot !== activation.workingDirectory ||
            identity.gitCommonDirectory !== record.gitCommonDirectory || identity.origin !== record.originIdentity || identity.head !== record.sourceCommit ||
            identity.branch !== activation.targetBranch) throw new Error();
        const execute = await readOnlyGit(identity.worktreeRoot, options, signal);
        const registrations = (await execute(["worktree", "list", "--porcelain", "-z"])).split("\0\0").map(block => block.split("\0"));
        let matches = 0;
        for (const fields of registrations) {
            const path = fields.find(field => field.startsWith("worktree "))?.slice(9);
            if (!path || !isAbsolute(path)) continue;
            let canonical: string;
            try { canonical = await realpath(path); } catch { continue; }
            if (canonical !== identity.worktreeRoot) continue;
            if (fields.some(field => field === "bare" || field === "detached" || field.startsWith("prunable")) ||
                !fields.includes(`branch ${activation.targetBranch}`) || !fields.includes(`HEAD ${record.sourceCommit}`)) throw new Error();
            matches++;
        }
        if (matches !== 1 || await execute(["status", "--porcelain=v1", "--untracked-files=all"]) ||
            await fingerprintCheckout(identity.worktreeRoot, signal) !== record.initialWorktreeFingerprint || signal.aborted) throw new Error();
        return identity;
    } catch { throw new RepositoryError("clone_identity_changed"); }
}

export async function verifyReadyRepository(options: PreparationVerificationOptions & { snapshot: HostWorkspaceSnapshot; providerId: string; instanceId: string }) {
    const { record, snapshot, providerId, instanceId } = options;
    try {
        const accepted = record.acceptedTarget;
        if (!accepted || record.handoff?.status !== "canvas_ready" || accepted.sessionId !== snapshot.sessionId || accepted.contextRevision !== snapshot.contextRevision ||
            accepted.workingDirectory !== snapshot.workingDirectory || accepted.providerId !== providerId || accepted.instanceId !== instanceId) throw new Error();
        const identity = await inspectCurrentRepository({ ...options, workspacePath: snapshot.workingDirectory });
        if (!identity || identity.worktreeRoot !== accepted.workingDirectory || identity.gitCommonDirectory !== record.gitCommonDirectory || identity.origin !== record.originIdentity) throw new Error();
        return identity;
    } catch { throw new RepositoryError("clone_identity_changed"); }
}

export async function createWorkflowBinding({ host, providerId, instanceId, homeDirectory = homedir(), runner, executable }: {
    host: HostHandoffAdapter;
    providerId: string;
    instanceId: string;
    homeDirectory?: string;
    runner?: GitRunner;
    executable?: string;
}) {
    const initial = await host.inspectCurrent();
    const options = { homeDirectory, runner, executable };
    const store = createPreparationStore({ homeDirectory });
    const identity = await inspectCurrentRepository({ ...options, workspacePath: initial.workingDirectory });
    const records = await store.list();
    if (records.hasMore) throw new RepositoryError("entry_required");
    const candidates = records.items.flatMap(item => item.record &&
        (item.record.gitCommonDirectory === identity?.gitCommonDirectory || item.record.destination === identity?.worktreeRoot ||
            item.record.handoff?.activation?.workingDirectory === initial.workingDirectory) ? [item.record] : []);
    if (candidates.length > 1) throw new RepositoryError("entry_required");
    const prepared = candidates[0];
    const managed = join(await realpath(homeDirectory), "SpecKitCanvas", "repositories");
    if (!prepared && (inside(managed, resolve(initial.workingDirectory)) || identity && inside(managed, identity.gitCommonDirectory))) {
        throw new RepositoryError("entry_required");
    }
    if (prepared && !prepared.acceptedTarget) {
        const attempt = prepared.handoff;
        if (!attempt?.activation || attempt.status !== "workspace_activated" || attempt.instanceId !== instanceId || !providerId) throw new RepositoryError("entry_required");
        await verifyActivatedRepository({ ...options, record: prepared, activation: attempt.activation, snapshot: initial });
        const current = await host.inspectCurrent();
        if (current.sessionId !== initial.sessionId || current.contextRevision !== initial.contextRevision || current.workingDirectory !== initial.workingDirectory) {
            throw new RepositoryError("context_changed");
        }
    }
    return {
        workspacePath: identity?.worktreeRoot ?? initial.workingDirectory,
        operationId: prepared?.operationId,
        preparation: prepared ? { state: "verified" as const, operationId: prepared.operationId, repositoryId: prepared.repositoryId,
            initialCommit: prepared.sourceCommit, gitDirectory: prepared.gitCommonDirectory } : undefined,
        async ready() {
            if (!prepared || prepared.acceptedTarget) return;
            const current = await host.inspectCurrent();
            const latest = await store.read(prepared.operationId);
            const attempt = latest.handoff;
            if (!attempt?.activation || attempt.instanceId !== instanceId || attempt.status !== "workspace_activated") throw new RepositoryError("entry_required");
            await verifyActivatedRepository({ ...options, record: latest, activation: attempt.activation, snapshot: current });
            const after = await host.inspectCurrent();
            if (after.sessionId !== current.sessionId || after.contextRevision !== current.contextRevision || after.workingDirectory !== current.workingDirectory) {
                throw new RepositoryError("context_changed");
            }
            await store.updateAttempt(prepared.operationId, { ...attempt, status: "canvas_ready", result: { ...attempt.activation, providerId, instanceId } });
        },
        async verify() {
            const current = await host.inspectCurrent();
            if (current.sessionId !== initial.sessionId || current.contextRevision !== initial.contextRevision || current.workingDirectory !== initial.workingDirectory) {
                throw new RepositoryError("context_changed");
            }
            const local = await inspectCurrentRepository({ ...options, workspacePath: current.workingDirectory });
            if (identity?.worktreeRoot !== local?.worktreeRoot || identity?.gitCommonDirectory !== local?.gitCommonDirectory || identity?.origin !== local?.origin) {
                throw new RepositoryError("local_context_mismatch");
            }
            if (prepared) {
                const latest = await store.read(prepared.operationId);
                if (!latest.acceptedTarget || latest.handoff?.status !== "canvas_ready" || latest.gitCommonDirectory !== local?.gitCommonDirectory || latest.originIdentity !== local?.origin) {
                    throw new RepositoryError("entry_required");
                }
            }
        },
    };
}

export async function inspectWorkspaceBinding({ workspacePath, homeDirectory = homedir(), runner = runGit, executable, previous }: {
    workspacePath: string;
    homeDirectory?: string;
    runner?: GitRunner;
    executable?: string;
    previous?: WorkspaceBinding;
}): Promise<WorkspaceBinding> {
    let entries;
    const requiresPreparation = previous?.state === "verified" || inside(join(resolve(homeDirectory), "SpecKitCanvas", "repositories"), resolve(workspacePath));
    const unprepared: WorkspaceBinding = { state: requiresPreparation ? "mismatch" : "ordinary" };
    try {
        const gitEntry = await lstat(join(workspacePath, ".git"));
        if (gitEntry.isSymbolicLink() || (!gitEntry.isFile() && !gitEntry.isDirectory())) return { state: "unavailable" };
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return unprepared; return { state: "unavailable" }; }
    const directory = join(homeDirectory, ".speckit-canvas", "preparations");
    try {
        const info = await lstat(directory);
        if (!info.isDirectory() || info.isSymbolicLink()) return { state: "unavailable" };
        entries = await readdir(directory, { withFileTypes: true });
    } catch (error) { return { state: (error as NodeJS.ErrnoException).code === "ENOENT" ? unprepared.state : "unavailable" }; }
    if (entries.length > 256) return { state: "unavailable" };
    const records: Preparation[] = [];
    try {
        const home = await realpath(homeDirectory);
        for (const entry of entries) {
            if (!/^[a-f0-9]{32}\.json$/.test(entry.name) || !entry.isFile() || entry.isSymbolicLink()) continue;
            const file = join(directory, entry.name);
            if ((await lstat(file)).size > 4096) continue;
            const record = JSON.parse(await readFile(file, "utf8")) as Preparation;
            const root = join(home, "SpecKitCanvas", "repositories", entry.name.slice(0, -5));
            if (record.schemaVersion !== 1 || record.kind !== "sdd-prepared-repository" || record.operationId !== entry.name.slice(0, -5) ||
                !/^[a-f0-9]{40}$/.test(record.initialCommit) || record.initialBranch !== `speckit/canvas-${record.operationId}` ||
                !isAbsolute(record.gitDirectory) || !inside(root, record.gitDirectory) || resolve(record.checkout) !== join(root, "checkout")) continue;
            const remote = new URL(record.remote);
            if (remote.origin !== "https://dev.azure.com" || remote.username || remote.password || remote.search || remote.hash ||
                !remote.pathname.endsWith(`/_git/${record.repositoryId}`)) continue;
            records.push(record);
        }
        if (!records.length) return unprepared;
        const git = executable ?? await findGitExecutable(workspacePath);
        const empty = process.platform === "win32" ? "NUL" : "/dev/null";
        const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home, emptyFile: empty });
        delete env.GIT_CONFIG_KEY_0; delete env.GIT_CONFIG_VALUE_0; env.GIT_CONFIG_COUNT = "0";
        const signal = AbortSignal.timeout(10_000);
        const execute = (args: string[]) => runner({ executable: git, args: ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=", ...args], cwd: workspacePath, env, signal });
        const common = await realpath(await execute(["rev-parse", "--path-format=absolute", "--git-common-dir"]));
        const candidates: Preparation[] = [];
        for (const record of records) {
            try { if (await realpath(record.gitDirectory) === common) candidates.push(record); } catch { continue; }
        }
        if (!candidates.length) {
            return requiresPreparation || records.some((record) => inside(record.checkout, resolve(workspacePath))) ? { state: "mismatch" } : { state: "ordinary" };
        }
        if (candidates.length !== 1) return { state: "mismatch" };
        const record = candidates[0]!;
        const remote = await execute(["remote", "get-url", "origin"]);
        const head = await execute(["rev-parse", "HEAD"]);
        const branch = await execute(["symbolic-ref", "--short", "HEAD"]);
        const alreadyAcknowledged = previous?.state === "verified" && previous.operationId === record.operationId && previous.gitDirectory === common;
        if (remote !== record.remote || !/^[a-f0-9]{40}$/.test(head) || !branch || (!alreadyAcknowledged && head !== record.initialCommit)) return { state: "mismatch" };
        return { state: "verified", operationId: record.operationId, repositoryId: record.repositoryId, initialCommit: record.initialCommit, gitDirectory: common };
    } catch { return { state: "unavailable" }; }
}

export function assertWorkspaceBinding(binding: WorkspaceBinding) {
    if (binding.state === "mismatch" || binding.state === "unavailable") throw new RepositoryError("local_context_mismatch");
}