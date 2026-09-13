import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, lstat, mkdir, readFile, readdir, realpath, rename, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KIT_ROOT = dirname(fileURLToPath(import.meta.url));
const TARGET = ".github/extensions/sdd-canvas";
const STATE = ".github/.sdd-markdown-preview";
const PAYLOAD = "plugin/extensions/sdd-canvas/";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (first, second) => JSON.stringify(first) === JSON.stringify(second);

function safeRelative(value) {
    return typeof value === "string" && value.length > 0 && value.length <= 2048 && !isAbsolute(value) &&
        !/[\\:\x00-\x1f\x7f]/.test(value) && value.split("/").every((part) => part && part !== "." && part !== ".." && !/[. ]$/.test(part));
}

async function exists(path) {
    try { await lstat(path); return true; }
    catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function ordinaryPath(root, suffix, allowMissing = false) {
    if (suffix && !safeRelative(suffix)) throw new Error("An unsafe preview path was rejected.");
    let current = root;
    for (const part of ["", ...suffix.split("/").filter(Boolean)]) {
        current = join(current, part);
        let entry;
        try { entry = await lstat(current); }
        catch (error) { if (allowMissing && error.code === "ENOENT") return; throw error; }
        if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile())) throw new Error("Redirecting or special paths are not supported.");
    }
}

async function inspectTree(root) {
    await ordinaryPath(root, "");
    const files = [];
    const directories = [];
    let count = 0;
    async function visit(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            if (++count > 2000) throw new Error("Preview tree exceeds the inspection limit.");
            const location = join(directory, entry.name);
            const path = relative(root, location).split(sep).join("/");
            if (!safeRelative(path) || entry.isSymbolicLink()) throw new Error("Preview tree contains an unsafe path.");
            if (entry.isDirectory()) { directories.push(path); await visit(location); }
            else if (entry.isFile()) {
                if ((await lstat(location)).size > 10 * 1024 * 1024) throw new Error("Preview file exceeds the size limit.");
                const bytes = await readFile(location);
                files.push({ path, bytes: bytes.length, sha256: sha256(bytes) });
            } else throw new Error("Preview tree contains a special file.");
        }
    }
    await visit(root);
    return { files: files.sort((left, right) => left.path.localeCompare(right.path, "en")), directories: directories.sort() };
}

async function loadKit() {
    await ordinaryPath(KIT_ROOT, "SHA256SUMS.json");
    const manifestBytes = await readFile(join(KIT_ROOT, "SHA256SUMS.json"));
    if (manifestBytes.length > 1024 * 1024) throw new Error("Checksum manifest exceeds the size limit.");
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files) || manifest.files.length > 1000 ||
        manifest.files.some((file) => !safeRelative(file.path) || !Number.isInteger(file.bytes) || !/^[a-f0-9]{64}$/.test(file.sha256))) throw new Error("Invalid checksum manifest.");
    const tree = await inspectTree(KIT_ROOT);
    const files = tree.files.filter((file) => file.path !== "SHA256SUMS.json");
    if (!same(files, manifest.files)) throw new Error("Preview checksum mismatch or unexpected files. Extract a fresh copy.");
    const information = JSON.parse(await readFile(join(KIT_ROOT, "BUILD-INFO.json"), "utf8"));
    if (information.pluginId !== "spec-kit-copilot-sdd" || information.canvasId !== "sdd-canvas" || information.previewOnly !== true) throw new Error("This is not a recognized SDD preview kit.");
    const pluginFiles = files.filter((file) => file.path.startsWith("plugin/")).map((file) => ({ ...file, path: file.path.slice(7) }));
    const payloadSha256 = sha256(pluginFiles.map((file) => `${file.path}\0${file.sha256}`).join("\n"));
    if (information.payloadSha256 !== payloadSha256) throw new Error("Plugin payload hash mismatch.");
    return { information, files, fingerprint: sha256(manifestBytes) };
}

export async function verifyPreview() {
    const { information } = await loadKit();
    return { status: "verified", pluginId: information.pluginId, canvasId: information.canvasId, payloadSha256: information.payloadSha256,
        sourceCommit: information.sourceCommit, previewOnly: true };
}

async function workspaceRoot(input, requireSdd = true) {
    if (typeof input !== "string" || !isAbsolute(input)) throw new Error("Provide the absolute effective Copilot App workspace path.");
    await ordinaryPath(resolve(input), "");
    const root = await realpath(input);
    await ordinaryPath(root, ".git");
    if (requireSdd) {
        for (const suffix of [".specify", "specs"]) {
            await ordinaryPath(root, suffix);
            if (!(await lstat(join(root, suffix))).isDirectory()) throw new Error("Use an existing SDD-enabled repository.");
        }
        const features = await readdir(join(root, "specs"), { withFileTypes: true });
        let found = false;
        for (const feature of features.slice(0, 1000)) {
            if (!feature.isDirectory() || feature.isSymbolicLink()) continue;
            const source = `specs/${feature.name}/spec.md`;
            if (await exists(join(root, source))) {
                await ordinaryPath(root, source);
                if ((await lstat(join(root, source))).isFile()) { found = true; break; }
            }
        }
        if (!found) throw new Error("No existing specs/<feature>/spec.md was found; this kit never initializes Spec Kit.");
    }
    await ordinaryPath(root, TARGET, true);
    await ordinaryPath(root, STATE, true);
    return root;
}

export async function installPreview({ workspace, isolatedProviderConfirmed = false, replaceExisting = false, dryRun = false } = {}) {
    if (!isolatedProviderConfirmed) throw new Error("Confirm one isolated sdd-canvas provider with --isolated-provider-confirmed; disable any competing installed provider first.");
    const kit = await loadKit();
    const root = await workspaceRoot(workspace);
    const target = join(root, TARGET);
    const state = join(root, STATE);
    if (await exists(state)) throw new Error("A preview receipt already exists. Remove or recover that installation first.");
    const hadOriginal = await exists(target);
    let original = null;
    if (hadOriginal) {
        if (!replaceExisting) throw new Error("A project-local SDD extension exists. Use --replace-existing to back it up and replace it explicitly.");
        const manifest = JSON.parse(await readFile(join(target, "copilot-extension.json"), "utf8"));
        if (manifest.name !== "sdd-canvas") throw new Error("The existing target is not the SDD canvas; it will not be replaced.");
        original = await inspectTree(target);
    }
    if (dryRun) return { status: "dry-run", action: hadOriginal ? "replace-with-backup" : "install", target: TARGET, specsModified: false };
    const createdDirectories = [];
    for (const directory of [".github", ".github/extensions"]) {
        if (!await exists(join(root, directory))) { await mkdir(join(root, directory)); createdDirectories.push(directory); }
    }
    await mkdir(state);
    const staged = join(state, "staged");
    await mkdir(staged);
    let originalMoved = false;
    try {
        for (const file of kit.files.filter((entry) => entry.path.startsWith(PAYLOAD))) {
            const destination = join(staged, file.path.slice(PAYLOAD.length));
            await mkdir(dirname(destination), { recursive: true });
            await copyFile(join(KIT_ROOT, file.path), destination, constants.COPYFILE_EXCL);
        }
        const installed = await inspectTree(staged);
        const expected = await inspectTree(join(KIT_ROOT, "plugin/extensions/sdd-canvas"));
        if (!same(installed, expected)) throw new Error("Installed payload checksum mismatch.");
        const receipt = { schemaVersion: 1, kind: "sdd-markdown-preview", kitFingerprint: kit.fingerprint, workspaceHash: sha256(root),
            original, installed, createdDirectories };
        await writeFile(join(state, "receipt.json"), JSON.stringify(receipt, null, 2), { flag: "wx" });
        if (hadOriginal) { await rename(target, join(state, "backup")); originalMoved = true; }
        await rename(staged, target);
    } catch {
        if (originalMoved && !await exists(target)) await rename(join(state, "backup"), target);
        throw new Error("Preview installation did not finish. Keep the local preview state for recovery; no specs were modified.");
    }
    return { status: "installed", target: TARGET, originalBackedUp: hadOriginal, specsModified: false, restartRequired: true };
}

export async function removePreview({ workspace, dryRun = false } = {}) {
    const kit = await loadKit();
    const root = await workspaceRoot(workspace, false);
    const target = join(root, TARGET);
    const state = join(root, STATE);
    await ordinaryPath(root, `${STATE}/receipt.json`);
    const receipt = JSON.parse(await readFile(join(state, "receipt.json"), "utf8"));
    if (receipt.schemaVersion !== 1 || receipt.kind !== "sdd-markdown-preview" || receipt.kitFingerprint !== kit.fingerprint || receipt.workspaceHash !== sha256(root) ||
        !Array.isArray(receipt.createdDirectories) || receipt.createdDirectories.some((path) => ![".github", ".github/extensions"].includes(path))) throw new Error("Preview receipt does not match this kit and workspace.");
    if (!same(await inspectTree(target), receipt.installed)) throw new Error("Installed preview files changed or unexpected files were added. Preserve those edits before removal.");
    const expectedEntries = receipt.original ? ["backup", "receipt.json"] : ["receipt.json"];
    if (!same((await readdir(state)).sort(), expectedEntries.sort())) throw new Error("Preview state changed; automatic removal was refused.");
    if (receipt.original && !same(await inspectTree(join(state, "backup")), receipt.original)) throw new Error("The original extension backup changed; automatic restoration was refused.");
    if (dryRun) return { status: "dry-run", action: receipt.original ? "restore" : "remove", specsModified: false };
    const removing = join(state, "removing");
    await rename(target, removing);
    try { if (receipt.original) await rename(join(state, "backup"), target); }
    catch { await rename(removing, target); throw new Error("The original extension could not be restored; the preview was retained."); }
    await rm(removing, { recursive: true });
    await rm(join(state, "receipt.json"));
    await rmdir(state);
    for (const directory of [...receipt.createdDirectories].reverse()) {
        if (await exists(join(root, directory)) && (await readdir(join(root, directory))).length === 0) await rmdir(join(root, directory));
    }
    return { status: receipt.original ? "restored" : "removed", specsModified: false, restartRequired: true };
}

export async function runCommand(args) {
    const [command, ...flags] = args;
    if (command === "help" || !command || command === "--help") {
        console.log("node preview.mjs verify");
        console.log("node preview.mjs install --workspace <absolute-app-worktree> --isolated-provider-confirmed [--replace-existing] [--dry-run]");
        console.log("node preview.mjs remove --workspace <absolute-app-worktree> [--dry-run]");
        return;
    }
    const options = {};
    const seen = new Set();
    for (let index = 0; index < flags.length; index++) {
        const flag = flags[index];
        if (seen.has(flag)) throw new Error("Duplicate preview option.");
        seen.add(flag);
        if (flag === "--workspace" && flags[index + 1] && !flags[index + 1].startsWith("--")) options.workspace = resolve(flags[++index]);
        else if (flag === "--isolated-provider-confirmed") options.isolatedProviderConfirmed = true;
        else if (flag === "--replace-existing") options.replaceExisting = true;
        else if (flag === "--dry-run") options.dryRun = true;
        else throw new Error("Unknown or incomplete preview option.");
    }
    if (command === "verify" && !flags.length) console.log(JSON.stringify(await verifyPreview()));
    else if (command === "install") console.log(JSON.stringify(await installPreview(options)));
    else if (command === "remove") console.log(JSON.stringify(await removePreview(options)));
    else throw new Error("Use verify, install, or remove.");
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    runCommand(process.argv.slice(2)).catch((error) => {
        console.error(error.code ? "Preview operation could not access the required local paths. No workflow was run." : error.message);
        process.exitCode = 1;
    });
}
