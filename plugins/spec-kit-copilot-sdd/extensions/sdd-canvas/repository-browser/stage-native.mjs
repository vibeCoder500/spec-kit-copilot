import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createOwnedWorkspace, assertOwnedWorkspace } from "../../../../../scripts/canvas-reader/fixtures/workspace.mjs";
import { stageAppFixture, verifyStagedPlugin } from "../../../../../scripts/canvas-reader/stage-app-fixture.mjs";
import { verifyRepositoryRuntime } from "./build-runtime.mjs";
import { parseRepositoryProfile } from "./src/profile.ts";

export async function stageRepositoryCanvas({ profile, initializeGit = true }) {
    const validated = parseRepositoryProfile(profile);
    if (!validated.enabled) throw new Error("An enabled native test profile is required.");
    await verifyRepositoryRuntime();
    const owner = await createOwnedWorkspace();
    await assertOwnedWorkspace(owner.workspace);
    const staged = join(owner.workspace, "production-payload");
    await stageAppFixture({ workspace: owner.workspace, target: staged, pluginIds: ["spec-kit-copilot-sdd"] });
    const source = join(staged, "spec-kit-copilot-sdd");
    const payload = await verifyStagedPlugin({ pluginRoot: source });
    const extension = join(owner.workspace, ".github/extensions/sdd-canvas");
    await mkdir(join(owner.workspace, ".github/extensions"), { recursive: true });
    await cp(join(source, "extensions/sdd-canvas"), extension, { recursive: true, errorOnExist: true, force: false });
    const original = await readFile(join(extension, "extension.mjs"), "utf8");
    const marker = "entry = await startServer();";
    if (original.split(marker).length !== 2) throw new Error("Native configuration injection site changed; test fixture preserved.");
    const adapter = original.replace(marker, `entry = await startServer({ profileStatus: { state: "configured", profile: ${JSON.stringify(validated)} } });`);
    await writeFile(join(extension, "extension.mjs"), adapter);
    await writeFile(join(owner.workspace, ".gitattributes"), "* -text\n", { flag: "wx" });
    const record = { schemaVersion: 1, kind: "sdd-repository-full-native-fixture", ownerId: owner.id, workspace: owner.workspace,
        runtimePayloadSha256: payload.payloadSha256, readerBuildHash: payload.readerBuildHash,
        adapterSha256: createHash("sha256").update(adapter).digest("hex"),
        adapterDifference: "Only startServer profileStatus is supplied in the isolated test copy.",
        profileLocation: "isolated test extension only", normalPluginsChanged: false, privateClone: false,
        runtimeFiles: payload.files.filter((file) => file.path.startsWith("extensions/sdd-canvas/") && file.path !== "extensions/sdd-canvas/extension.mjs") };
    await writeFile(join(owner.workspace, ".sdd-repository-native-test.json"), JSON.stringify(record, null, 2), { flag: "wx" });
    await rm(staged, { recursive: true });
    if (initializeGit) {
        const options = { cwd: owner.workspace, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true };
        execFileSync("git", ["init", "-b", "main"], options);
        execFileSync("git", ["add", "."], options);
        execFileSync("git", ["-c", "user.name=SDD Synthetic Proof", "-c", "user.email=proof@example.invalid", "-c", "core.hooksPath=", "commit", "-m", "Seed isolated full SDD repository canvas test"], options);
        record.sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], options).trim();
    }
    return record;
}