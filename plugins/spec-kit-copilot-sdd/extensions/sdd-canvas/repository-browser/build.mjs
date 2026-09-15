import { build } from "esbuild";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
const output = join(root, "dist");
const digest = (value) => createHash("sha256").update(value).digest("hex");
const builtins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));

export async function verifyProofBundle() {
    const manifest = JSON.parse(await readFile(join(output, "manifest.json"), "utf8"));
    const expected = ["native-proof.mjs", "xdg-open", "THIRD_PARTY_NOTICES.txt"];
    if (manifest.schemaVersion !== 1 || manifest.purpose !== "isolated-native-auth-proof" ||
        JSON.stringify(manifest.files.map((file) => file.path).sort()) !== JSON.stringify(expected.sort())) throw new Error("Invalid proof asset manifest.");
    const actual = (await readdir(output)).sort();
    if (JSON.stringify(actual) !== JSON.stringify([...expected, "manifest.json"].sort())) throw new Error("Unexpected proof build file.");
    for (const file of manifest.files) {
        const content = await readFile(join(output, file.path));
        if (content.length !== file.bytes || digest(content) !== file.sha256) throw new Error("Proof asset hash mismatch.");
    }
    const loaded = await import(pathToFileURL(join(output, "native-proof.mjs")).href);
    if (typeof loaded.createNativeProofServer !== "function") throw new Error("Proof bundle cannot be imported independently.");
    return { status: "verified", files: manifest.files.length, sourceHash: manifest.sourceHash, dependencies: manifest.dependencies.length };
}

export async function buildProofBundle() {
    const result = await build({ absWorkingDir: root, entryPoints: ["src/native-proof.ts"], outfile: "dist/native-proof.mjs",
        bundle: true, platform: "node", format: "esm", target: "node20", write: false, metafile: true,
        banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' } });
    if (result.metafile.outputs["dist/native-proof.mjs"].imports.some((entry) => !entry.external || !builtins.has(entry.path))) {
        throw new Error("Proof bundle retains a non-builtin runtime dependency.");
    }
    const dependencyRoots = new Set();
    const sources = [];
    for (const input of Object.keys(result.metafile.inputs).sort()) {
        const normalized = input.replaceAll("\\", "/");
        const dependency = /^(.*node_modules\/(?:@[^/]+\/)?[^/]+)/.exec(normalized);
        if (dependency) dependencyRoots.add(dependency[1]);
        else sources.push(`${normalized}\0${digest(await readFile(join(root, input)))}`);
    }
    const dependencies = [];
    const notices = [];
    for (const dependency of [...dependencyRoots].sort()) {
        const directory = join(root, dependency);
        const metadata = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
        let license;
        for (const name of ["LICENSE", "license", "LICENSE.md", "license.md", "LICENSE.txt", "License.txt"]) {
            try { await access(join(directory, name)); license = await readFile(join(directory, name), "utf8"); break; } catch { continue; }
        }
        if (!license) throw new Error(`Dependency license is missing: ${metadata.name}`);
        dependencies.push({ name: metadata.name, version: metadata.version, license: metadata.license });
        notices.push(`${metadata.name}@${metadata.version}\n${license}`);
    }
    const contents = new Map([
        ["native-proof.mjs", result.outputFiles[0].contents],
        ["xdg-open", await readFile(join(root, "node_modules/open/xdg-open"))],
        ["THIRD_PARTY_NOTICES.txt", Buffer.from(notices.join("\n\n"))],
    ]);
    await mkdir(output, { recursive: true });
    const files = [];
    for (const [path, content] of contents) {
        await writeFile(join(output, path), content);
        files.push({ path, bytes: content.length, sha256: digest(content) });
    }
    await writeFile(join(output, "manifest.json"), `${JSON.stringify({ schemaVersion: 1, purpose: "isolated-native-auth-proof",
        sourceHash: digest(sources.join("\n")), dependencies, files }, null, 2)}\n`);
    return verifyProofBundle();
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
    const operation = process.argv.includes("--verify") ? verifyProofBundle : buildProofBundle;
    operation().then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}