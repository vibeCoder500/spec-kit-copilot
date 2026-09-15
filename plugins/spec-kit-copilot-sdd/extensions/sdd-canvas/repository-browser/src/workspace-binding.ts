import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { cloneEnvironment, findGitExecutable, runGit } from "./clone.ts";
import type { GitRunner } from "./clone.ts";
import { RepositoryError } from "./errors.ts";

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