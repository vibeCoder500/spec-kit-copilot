import { build } from "esbuild";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
const extension = dirname(root.slice(0, -1));
const digest = (value) => createHash("sha256").update(value).digest("hex");
export const sourceDigest = (value) => digest(Buffer.from(value).toString("utf8").replace(/\r\n?/g, "\n"));
const builtin = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
const prefix = "vendor/repository-browser";
export const RUNTIME_FILES = [`${prefix}/server.mjs`, `${prefix}/xdg-open`, `${prefix}/THIRD_PARTY_NOTICES.txt`, "ui/repository-entry.js", "ui/repository-entry.css"];

export async function verifyRepositoryRuntime() {
    const manifest = JSON.parse(await readFile(join(extension, prefix, "manifest.json"), "utf8"));
    if (manifest.schemaVersion !== 1 || manifest.kind !== "sdd-repository-browser" ||
        JSON.stringify(manifest.files.map((file) => file.path).sort()) !== JSON.stringify([...RUNTIME_FILES].sort())) throw new Error("Invalid repository runtime manifest.");
    if (!Array.isArray(manifest.sources) || !manifest.sources.length) throw new Error("Repository source provenance is missing.");
    const sourceRows = [];
    for (const source of manifest.sources) {
        if (!/^(?:src\/[A-Za-z0-9_/-]+\.(?:ts|css)|package-lock\.json|build-runtime\.mjs)$/.test(source.path)) throw new Error("Unexpected repository source path.");
        const bytes = await readFile(join(root, source.path));
        if (sourceDigest(bytes) !== source.sha256) throw new Error("Repository source changed since its runtime build.");
        sourceRows.push(`${source.path}\0${source.sha256}`);
    }
    if (digest(sourceRows.join("\n")) !== manifest.sourceHash) throw new Error("Repository source hash mismatch.");
    const actual = (await readdir(join(extension, prefix))).sort();
    if (JSON.stringify(actual) !== JSON.stringify(["server.mjs", "xdg-open", "THIRD_PARTY_NOTICES.txt", "manifest.json"].sort())) throw new Error("Unexpected repository runtime file.");
    for (const file of manifest.files) {
        const bytes = await readFile(join(extension, file.path));
        if (bytes.length !== file.bytes || digest(bytes) !== file.sha256) throw new Error("Repository runtime asset hash mismatch.");
    }
    const expectedBuildHash = digest(manifest.files.map((file) => `${file.path}\0${file.sha256}`).join("\n"));
    if (manifest.buildHash !== expectedBuildHash) throw new Error("Repository runtime build hash mismatch.");
    const notices = await readFile(join(extension, prefix, "THIRD_PARTY_NOTICES.txt"), "utf8");
    if (!manifest.dependencies.length || manifest.dependencies.some((dependency) => !dependency.license || !notices.includes(`${dependency.name}@${dependency.version}`))) throw new Error("Repository runtime notices are incomplete.");
    const runtime = await import(pathToFileURL(join(extension, prefix, "server.mjs")).href);
    const service = await runtime.createRepositoryService({ workspacePath: "/synthetic", profileStatus: { state: "unconfigured" } });
    if (service.snapshot().configuration !== "unconfigured") throw new Error("Runtime offline default failed.");
    service.dispose();
    return { status: "verified", files: manifest.files.length, dependencies: manifest.dependencies.length, buildHash: manifest.buildHash };
}

export async function buildRepositoryRuntime() {
    const server = await build({ absWorkingDir: root, entryPoints: ["src/repository-service.ts"], outfile: "server.mjs", bundle: true, platform: "node", format: "esm", target: "node20", write: false, metafile: true,
        banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' } });
    const entryBrowser = await build({ absWorkingDir: root, entryPoints: ["src/ui/repository-entry.ts"], outfile: "repository-entry.js", bundle: true, platform: "browser", format: "esm", target: "es2022", write: false, metafile: true });
    if (Object.values(server.metafile.outputs).some((output) => output.imports.some((entry) => !entry.external || !builtin.has(entry.path))) ||
        Object.values(entryBrowser.metafile.outputs).some((output) => output.imports.length)) throw new Error("Repository runtime has unresolved dependencies.");
    const dependencyPaths = new Set();
    const sourceFiles = new Set(["package-lock.json", "build-runtime.mjs", "src/ui/repository-entry.css"]);
    for (const input of [...Object.keys(server.metafile.inputs), ...Object.keys(entryBrowser.metafile.inputs)]) {
        const normalized = input.replaceAll("\\", "/");
        const match = /^(.*node_modules\/(?:@[^/]+\/)?[^/]+)/.exec(normalized);
        if (match) dependencyPaths.add(match[1]); else sourceFiles.add(normalized);
    }
    const dependencies = [];
    const notices = [];
    for (const path of [...dependencyPaths].sort()) {
        const directory = join(root, path);
        const metadata = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
        let license;
        for (const filename of ["LICENSE", "license", "LICENSE.md", "license.md", "LICENSE.txt", "License.txt"]) {
            try { license = await readFile(join(directory, filename), "utf8"); break; } catch { continue; }
        }
        if (!license || !metadata.license) throw new Error(`Missing dependency license: ${metadata.name}`);
        dependencies.push({ name: metadata.name, version: metadata.version, license: metadata.license });
        notices.push(`${metadata.name}@${metadata.version}\n${license}`);
    }
    const contents = new Map([
        [`${prefix}/server.mjs`, server.outputFiles[0].contents],
        [`${prefix}/xdg-open`, await readFile(join(root, "node_modules/open/xdg-open"))],
        [`${prefix}/THIRD_PARTY_NOTICES.txt`, Buffer.from(notices.join("\n\n"))],
        ["ui/repository-entry.js", entryBrowser.outputFiles[0].contents],
        ["ui/repository-entry.css", Buffer.from((await readFile(join(root, "src/ui/repository-entry.css"), "utf8")).replace(/\r\n?/g, "\n"))],
    ]);
    const files = [];
    for (const [path, content] of contents) {
        await mkdir(dirname(join(extension, path)), { recursive: true });
        await writeFile(join(extension, path), content);
        files.push({ path, bytes: content.length, sha256: digest(content) });
    }
    files.sort((left, right) => left.path.localeCompare(right.path, "en"));
    const sources = [];
    for (const path of [...sourceFiles].sort()) sources.push({ path, sha256: sourceDigest(await readFile(join(root, path))) });
    await writeFile(join(extension, prefix, "manifest.json"), `${JSON.stringify({ schemaVersion: 1, kind: "sdd-repository-browser",
        sourceHash: digest(sources.map((source) => `${source.path}\0${source.sha256}`).join("\n")), buildHash: digest(files.map((file) => `${file.path}\0${file.sha256}`).join("\n")), sources, dependencies, files }, null, 2)}\n`);
    return verifyRepositoryRuntime();
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
    const action = process.argv.includes("--verify") ? verifyRepositoryRuntime : buildRepositoryRuntime;
    action().then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}