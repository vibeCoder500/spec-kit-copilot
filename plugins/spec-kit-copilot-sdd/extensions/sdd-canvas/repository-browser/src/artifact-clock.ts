import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { cloneEnvironment, findGitExecutable, runGit } from "./clone.ts";
import type { GitRunner } from "./clone.ts";
import type { WorkspaceBinding } from "./workspace-binding.ts";

const ARTIFACT = /^specs\/[a-z0-9][a-z0-9-]*\/(?:spec|plan|tasks)\.md$/;
const blobHash = (bytes: Buffer) => createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");

export async function createPreparedArtifactClock({ workspacePath, binding, executable, runner = runGit, homeDirectory = homedir() }: {
    workspacePath: string;
    binding: WorkspaceBinding;
    executable?: string;
    runner?: GitRunner;
    homeDirectory?: string;
}) {
    const entries = new Map<string, { objectId: string; committedAt: number }>();
    if (binding.state !== "verified") return undefined;
    const root = await realpath(workspacePath);
    try {
        const git = executable ?? await findGitExecutable(root);
        const empty = process.platform === "win32" ? "NUL" : "/dev/null";
        const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home: homeDirectory, emptyFile: empty });
        delete env.GIT_CONFIG_KEY_0; delete env.GIT_CONFIG_VALUE_0; env.GIT_CONFIG_COUNT = "0";
        const signal = AbortSignal.timeout(15_000);
        const execute = (args: string[]) => runner({ executable: git, args: ["-c", "core.hooksPath=", "-c", "core.fsmonitor=false", ...args], cwd: root, env, signal });
        const tree = await execute(["ls-tree", "-rz", "HEAD", "--", "specs"]);
        const candidates = tree.split("\0").flatMap((row) => {
            const match = /^100(?:644|755) blob ([a-f0-9]{40})\t(.+)$/.exec(row);
            return match && ARTIFACT.test(match[2]!) ? [{ objectId: match[1]!, path: match[2]! }] : [];
        });
        if (candidates.length > 300) return undefined;
        for (const entry of candidates) {
            const timestamp = await execute(["log", "-1", "--format=%ct", "HEAD", "--", entry.path]);
            if (!/^\d{1,12}$/.test(timestamp)) return undefined;
            entries.set(entry.path, { objectId: entry.objectId, committedAt: Number(timestamp) * 1000 });
        }
    } catch { return undefined; }
    return (relativePath: string, filesystemTime: number): number => {
        const entry = entries.get(relativePath);
        if (!entry || !ARTIFACT.test(relativePath)) return filesystemTime;
        try {
            let path = root;
            for (const segment of relativePath.split("/")) {
                path = join(path, segment);
                if (lstatSync(path).isSymbolicLink()) return filesystemTime;
            }
            const actual = realpathSync(path);
            const within = relative(root, actual);
            if (isAbsolute(within) || within === ".." || within.startsWith(`..${sep}`) || actual !== resolve(path)) return filesystemTime;
            const stat = lstatSync(path);
            if (!stat.isFile() || stat.size > 1_048_576) return filesystemTime;
            const bytes = readFileSync(path);
            if (bytes.length > 1_048_576) return filesystemTime;
            if (blobHash(bytes) === entry.objectId) return entry.committedAt;
            const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
            const normalized = Buffer.from(text.replace(/\r\n/g, "\n"));
            return blobHash(normalized) === entry.objectId ? entry.committedAt : filesystemTime;
        } catch { return filesystemTime; }
    };
}