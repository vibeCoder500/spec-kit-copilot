import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument, stringify } from "yaml";
import { parseRepositoryProfile } from "./src/profile.ts";
import { inspectWorkspaceBinding } from "./src/workspace-binding.ts";
import { verifyRepositoryRuntime } from "./build-runtime.mjs";

const extensionRoot = fileURLToPath(new URL("../", import.meta.url));
const commands = ["constitution", "specify", "clarify", "plan", "tasks", "analyze", "checklist", "implement"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function trackedAcceptanceFingerprint(workspace) {
    const options = { cwd: workspace, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true };
    const files = execFileSync("git", ["ls-files", "-z", "--", ".github", ".specify", "specs"], options).split("\0").filter(Boolean).sort();
    const records = [];
    for (const path of files) records.push(`${path}\0${hash(await readFile(join(workspace, path)))}`);
    return { files: records.length, sha256: hash(records.join("\n")) };
}

export async function stageCloneAcceptance({ workspacePath, profile, expectedOperationId }) {
    if (!isAbsolute(workspacePath) || !/^[a-f0-9]{32}$/.test(expectedOperationId)) throw new Error("Explicit prepared worktree required.");
    const workspace = resolve(workspacePath);
    const binding = await inspectWorkspaceBinding({ workspacePath: workspace });
    if (binding.state !== "verified" || binding.operationId !== expectedOperationId) throw new Error("Prepared App worktree is not verified.");
    const validated = parseRepositoryProfile(profile);
    await verifyRepositoryRuntime();
    const target = join(workspace, ".github/extensions/sdd-canvas");
    const wrappers = [];
    for (const command of commands) {
        const source = `.github/agents/speckit.${command}.agent.md`;
        const content = await readFile(join(workspace, source), "utf8");
        const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
        const metadata = match ? parseDocument(match[1], { uniqueKeys: true }).toJS() : null;
        if (typeof metadata?.description !== "string" || !metadata.description.trim() || metadata.description.length > 1024) throw new Error("Generated command description is unavailable.");
        const name = `speckit-${command}`;
        const frontmatter = stringify({ name, description: metadata.description, "argument-hint": "Approved local workflow guidance" }).trimEnd();
        const body = `---\n${frontmatter}\n---\n\n# Generated Core Command Wrapper\n\nRead the existing generated command at \`${source}\` from the current repository root and follow its instructions in this same Copilot session. Do not switch agents.\n\nThis temporary native acceptance session authorizes only the requested read-only analyze action. Do not execute extension hooks, initialize the project, install tools, write files, commit, push, or run another workflow. Missing prerequisites must be reported without repair.\n`;
        wrappers.push({ path: `.github/skills/${name}/SKILL.md`, body, source, sourceSha256: hash(content) });
    }
    for (const path of [target, ...wrappers.map((entry) => join(workspace, entry.path)), join(workspace, ".sdd-clone-acceptance.json")]) {
        try { await lstat(path); throw new Error("Acceptance target already exists; preserve it."); }
        catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    const before = await trackedAcceptanceFingerprint(workspace);
    await mkdir(dirname(target), { recursive: true });
    await mkdir(target);
    for (const file of ["extension.mjs", "copilot-extension.json", "sdd.mjs", "artifact-review.mjs", "index.html", "ui", "vendor"]) {
        await cp(join(extensionRoot, file), join(target, file), { recursive: true, force: false, errorOnExist: true });
    }
    const entry = await readFile(join(target, "extension.mjs"), "utf8");
    const marker = "entry = await startServer();";
    if (entry.split(marker).length !== 2) throw new Error("Test configuration site changed; preserve staged files.");
    await writeFile(join(target, "extension.mjs"), entry.replace(marker, `entry = await startServer({ profileStatus: { state: "configured", profile: ${JSON.stringify(validated)} } });`));
    for (const wrapper of wrappers) {
        await mkdir(dirname(join(workspace, wrapper.path)), { recursive: true });
        await writeFile(join(workspace, wrapper.path), wrapper.body, { flag: "wx" });
    }
    const after = await trackedAcceptanceFingerprint(workspace);
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Tracked acceptance sources changed; stop before workflow execution.");
    const record = { schemaVersion: 1, kind: "sdd-clone-acceptance", operationId: expectedOperationId, workspace,
        binding: "verified", trackedSourceFingerprint: before, wrappers: wrappers.map(({ path, source, sourceSha256 }) => ({ path, source, sourceSha256 })),
        generatedCommandsModified: false, projectInitialized: false, privateSourceCommitted: false };
    await writeFile(join(workspace, ".sdd-clone-acceptance.json"), JSON.stringify(record, null, 2), { flag: "wx" });
    return record;
}