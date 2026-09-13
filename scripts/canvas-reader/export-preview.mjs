import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, lstat, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createOwnedWorkspace } from "./fixtures/workspace.mjs";
import { stageAppFixture, verifyStagedPlugin } from "./stage-app-fixture.mjs";
import { REPOSITORY_ROOT, verifyReaderAssets } from "./sync-assets.mjs";
import { syncDomain } from "./sync-domain.mjs";

const TEMPLATES = fileURLToPath(new URL("./preview-kit/", import.meta.url));
const sha256 = (content) => createHash("sha256").update(content).digest("hex");

export async function exportSddPreview({ outputDirectory } = {}) {
    if (typeof outputDirectory !== "string" || !isAbsolute(outputDirectory)) throw new Error("An absolute new output directory is required.");
    const output = resolve(outputDirectory);
    for (let location = output; ; location = dirname(location)) {
        try {
            const entry = await lstat(location);
            if (location === output) throw new Error("Preview output already exists; overwriting is refused.");
            if (entry.isSymbolicLink() || !entry.isDirectory()) throw new Error("Preview output has a redirecting parent.");
        } catch (error) { if (error.code !== "ENOENT") throw error; }
        if (dirname(location) === location) break;
    }
    await verifyReaderAssets();
    await syncDomain({ verify: true });
    const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPOSITORY_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error("Cannot identify the source checkpoint.");
    const owner = await createOwnedWorkspace();
    const stage = join(owner.workspace, "sdd-preview-stage");
    let created = false;
    try {
        await stageAppFixture({ workspace: owner.workspace, target: stage, pluginIds: ["spec-kit-copilot-sdd"] });
        const pluginRoot = join(stage, "spec-kit-copilot-sdd");
        const plugin = await verifyStagedPlugin({ pluginRoot });
        await mkdir(dirname(output), { recursive: true });
        await mkdir(output);
        created = true;
        const records = [];
        for (const file of plugin.files) {
            const target = join(output, "plugin", file.path);
            await mkdir(dirname(target), { recursive: true });
            await copyFile(join(pluginRoot, file.path), target);
            records.push({ ...file, path: `plugin/${file.path}` });
        }
        for (const name of ["preview.mjs", "README-TESTING.md"]) {
            const content = await readFile(join(TEMPLATES, name));
            await writeFile(join(output, name), content, { flag: "wx" });
            records.push({ path: name, bytes: content.length, sha256: sha256(content) });
        }
        const information = { schemaVersion: 1, previewOnly: true, pluginId: plugin.id, canvasId: "sdd-canvas", existingPluginVersion: plugin.version,
            sourceCommit, sourceKind: "verified-working-tree-payload", payloadSha256: plugin.payloadSha256, assetManifestSha256: plugin.assetManifestSha256,
            readerBuildHash: plugin.readerBuildHash, builtAt: new Date().toISOString(), exportNode: process.versions.node,
            purpose: "Read existing SDD specs through a temporary project-local replacement canvas; no initialization or workflow execution.",
            nativeBaseline: "Windows Copilot App 1.1.20 for earlier TOC build; this payload requires native tester acceptance." };
        const content = Buffer.from(`${JSON.stringify(information, null, 2)}\n`);
        await writeFile(join(output, "BUILD-INFO.json"), content, { flag: "wx" });
        records.push({ path: "BUILD-INFO.json", bytes: content.length, sha256: sha256(content) });
        records.sort((left, right) => left.path.localeCompare(right.path, "en"));
        await writeFile(join(output, "SHA256SUMS.json"), `${JSON.stringify({ schemaVersion: 1, files: records }, null, 2)}\n`, { flag: "wx" });
        const { verifyPreview } = await import(pathToFileURL(join(output, "preview.mjs")).href);
        await verifyPreview();
        return { status: "exported", directory: output, sourceCommit, payloadSha256: plugin.payloadSha256, files: records.length + 1, previewOnly: true };
    } catch (error) {
        if (created) await rm(output, { recursive: true, force: true });
        throw error;
    } finally {
        await rm(stage, { recursive: true, force: true });
        if (!(await owner.cleanup()).cleaned) throw new Error("Owned exporter fixture changed unexpectedly and was preserved.");
    }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === "--help") console.log("Usage: node scripts/canvas-reader/export-preview.mjs --output <new-directory>");
    else if (args.length !== 2 || args[0] !== "--output") { console.error("An explicit --output <new-directory> is required."); process.exitCode = 1; }
    else exportSddPreview({ outputDirectory: resolve(args[1]) }).then((result) => console.log(JSON.stringify(result))).catch(() => {
        console.error("Preview export failed. Check the new output path and run the reader build/package verification first.");
        process.exitCode = 1;
    });
}
