import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { cloneEnvironment, findGitExecutable } from "./src/clone.ts";
import { supportsRemotePreparation } from "./src/host-handoff.ts";
import { createPreparationStore } from "./src/preparation-store.ts";
import { inspectCurrentRepository, verifyReadyRepository } from "./src/workspace-binding.ts";
import { verifyRepositoryRuntime } from "./build-runtime.mjs";
import { verifyStagedPlugin } from "../../../../../scripts/canvas-reader/stage-app-fixture.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function captureAcceptanceSnapshot(workspacePath) {
    try {
        if (!isAbsolute(workspacePath)) throw new Error();
        const identity = await inspectCurrentRepository({ workspacePath });
        if (!identity) throw new Error();
        const workspace = identity.worktreeRoot;
        const executable = await findGitExecutable(workspace);
        const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home: workspace, emptyFile: process.platform === "win32" ? "NUL" : "/dev/null" });
        delete env.GIT_CONFIG_KEY_0; delete env.GIT_CONFIG_VALUE_0; env.GIT_CONFIG_COUNT = "0"; env.GIT_OPTIONAL_LOCKS = "0";
        const options = { cwd: workspace, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true, timeout: 10_000, maxBuffer: 4_194_304 };
        const git = args => execFileSync(executable, ["-c", "core.hooksPath=", "-c", "core.fsmonitor=false", ...args], options);
        let bytes = 0;
        async function inventory(args) {
            const files = [...new Set(git(["ls-files", "-z", ...args]).split("\0").filter(Boolean))].sort();
            if (files.length > 100_000) throw new Error();
            const records = [];
            for (const file of files) {
                const path = resolve(workspace, file);
                const within = relative(workspace, path);
                if (!within || isAbsolute(within) || within === ".." || within.startsWith(`..${sep}`) || file.includes("\ufffd")) throw new Error();
                let current = workspace;
                for (const segment of within.split(sep)) {
                    current = join(current, segment);
                    try { if ((await lstat(current)).isSymbolicLink()) throw new Error(); }
                    catch (error) { if (error.code !== "ENOENT") throw error; }
                }
                let info;
                try { info = await lstat(path); }
                catch (error) { if (error.code !== "ENOENT") throw error; records.push(`${file}\0missing`); continue; }
                if (!info.isFile() || await realpath(path) !== path || (bytes += info.size) > 268_435_456) throw new Error();
                const content = await readFile(path);
                const after = await lstat(path);
                if (after.size !== info.size || after.mtimeMs !== info.mtimeMs || content.length !== info.size) throw new Error();
                records.push(`${file}\0${info.mode & 0o111}\0${hash(content)}`);
            }
            return { files: records.length, sha256: hash(records.join("\n")) };
        }
        const tracked = await inventory(["--cached"]);
        const untracked = await inventory(["--others", "--exclude-standard"]);
        const statusSha256 = hash(git(["status", "--porcelain=v1", "-z", "--untracked-files=all"]));
        const after = await inspectCurrentRepository({ workspacePath });
        if (JSON.stringify(identity) !== JSON.stringify(after)) throw new Error();
        return { schemaVersion: 1, repositoryIdentity: hash(identity.origin ?? identity.gitCommonDirectory), rootSha256: hash(workspace),
            commonDirectorySha256: hash(identity.gitCommonDirectory), head: identity.head, branchSha256: hash(identity.branch ?? "detached"), tracked, untracked, statusSha256 };
    } catch { throw new Error("Acceptance source inventory could not be verified; no files were changed."); }
}

export async function trackedAcceptanceFingerprint(workspace) {
    return (await captureAcceptanceSnapshot(workspace)).tracked;
}

export async function stageCloneAcceptance({ workspacePath, sourceWorkspacePath, expectedOperationId, host, providerId, instanceId, pluginRoot, expectedPayloadSha256, homeDirectory }) {
    if (!host || !supportsRemotePreparation(await host.inspectCurrent())) throw new Error("A supported host proof is required before entry acceptance; legacy manual staging is retired.");
    if (!isAbsolute(workspacePath) || !isAbsolute(sourceWorkspacePath) || !/^[a-f0-9]{32}$/.test(expectedOperationId) ||
        !/^[a-f0-9]{64}$/.test(expectedPayloadSha256)) throw new Error("Explicit verified source, target and payload identities are required.");
    await verifyRepositoryRuntime();
    const payload = await verifyStagedPlugin({ pluginRoot });
    if (payload.payloadSha256 !== expectedPayloadSha256) throw new Error("The on-disk acceptance payload does not match the approved payload.");
    const record = await createPreparationStore({ homeDirectory }).read(expectedOperationId);
    const snapshot = await host.inspectCurrent();
    if (await realpath(workspacePath) !== snapshot.workingDirectory) throw new Error("The target is not the host's current workspace.");
    await verifyReadyRepository({ record, snapshot, providerId, instanceId, homeDirectory });
    const source = await captureAcceptanceSnapshot(sourceWorkspacePath);
    const target = await captureAcceptanceSnapshot(workspacePath);
    if (source.repositoryIdentity === target.repositoryIdentity) throw new Error("Two distinct repositories are required for entry acceptance.");
    return { schemaVersion: 2, kind: "sdd-entry-acceptance-observation", operationId: expectedOperationId, payloadSha256: payload.payloadSha256,
        source, target, hostSessionSha256: hash(snapshot.sessionId), hostContextSha256: hash(snapshot.contextRevision),
        targetKind: record.acceptedTarget.targetKind, hostTargetBranchSha256: hash(record.acceptedTarget.targetBranch),
        preparationBranchSha256: hash(record.branch), providerSha256: hash(providerId), instanceSha256: hash(instanceId),
        workflowDispatches: 0, filesWritten: 0, installations: 0, completedCloneRetained: true, nativeAcceptance: "requires_separate_visible_app_evidence" };
}