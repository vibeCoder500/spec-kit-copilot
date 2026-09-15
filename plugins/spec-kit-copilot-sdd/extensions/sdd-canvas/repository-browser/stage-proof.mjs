import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createOwnedWorkspace, assertOwnedWorkspace } from "../../../../../scripts/canvas-reader/fixtures/workspace.mjs";
import { verifyProofBundle } from "./build.mjs";

const bundleRoot = fileURLToPath(new URL("./dist/", import.meta.url));

export async function stageNativeProof({ profile, repositoryName }) {
    const { parseRepositoryProfile } = await import("./src/profile.ts");
    const validated = parseRepositoryProfile(profile);
    if (!validated.enabled || typeof repositoryName !== "string" || !/^[A-Za-z0-9._-]{1,128}$/.test(repositoryName)) throw new Error("Explicit proof profile and approved repository are required.");
    await verifyProofBundle();
    const owned = await createOwnedWorkspace();
    await assertOwnedWorkspace(owned.workspace);
    const directory = join(owned.workspace, ".github/extensions/sdd-canvas");
    await mkdir(directory, { recursive: true });
    for (const filename of ["native-proof.mjs", "xdg-open", "THIRD_PARTY_NOTICES.txt", "manifest.json"]) {
        await copyFile(join(bundleRoot, filename), join(directory, filename));
    }
    const extension = `import { joinSession, createCanvas } from "@github/copilot-sdk/extension";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createNativeProofServer } from "./native-proof.mjs";
const profile = ${JSON.stringify(validated)};
const repositoryName = ${JSON.stringify(repositoryName)};
const expectedOwner = ${JSON.stringify(owned.id)};
const entries = new Map();
let workspaceAcknowledged = false;
const canvas = createCanvas({ id: "sdd-canvas", displayName: "SDD Repository Connection Proof",
    description: "Isolated approved Microsoft connection and read-only artifact proof. No setup, cloning or workflows.",
    inputSchema: { type: "object", additionalProperties: false },
    actions: [{ name: "proof_status", description: "Return only sanitized connection, runtime and read-check status.", handler: async () => [...entries.values()].map((entry) => {
        const state = entry.snapshot(); return { connection: state.connection.state, error: state.connection.error?.code,
            runtime: state.runtime, readOutcome: state.readOutcome }; }) }],
    open: async (context) => { if (!workspaceAcknowledged) throw new Error("Owned proof workspace not acknowledged.");
        let entry = entries.get(context.instanceId); if (!entry) { entry = await createNativeProofServer({ profile, repositoryName, workspaceAcknowledged }); entries.set(context.instanceId, entry); }
        return { title: "SDD Repository Connection Proof", status: "Isolated read-only proof", url: entry.url }; },
    onClose: async (context) => { const entry = entries.get(context.instanceId); if (entry) { entries.delete(context.instanceId); await entry.close(); } }
});
const session = await joinSession({ canvases: [canvas] });
const metadata = await session.rpc.metadata.snapshot();
if (typeof metadata.workingDirectory === "string") {
    try { const owner = JSON.parse(await readFile(join(metadata.workingDirectory, ".canvas-reader-fixture.json"), "utf8")); workspaceAcknowledged = owner.id === expectedOwner; } catch {}
}
await session.log("SDD repository connection proof ready. No setup, clone or workflow execution is authorized.", { ephemeral: true });
`;
    await writeFile(join(directory, "extension.mjs"), extension, { flag: "wx" });
    await writeFile(join(directory, "copilot-extension.json"), JSON.stringify({ name: "sdd-canvas", version: 1 }), { flag: "wx" });
    await writeFile(join(owned.workspace, ".gitattributes"), "* -text\n", { flag: "wx" });
    const gitOptions = { cwd: owned.workspace, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true };
    execFileSync("git", ["init", "-b", "main"], gitOptions);
    execFileSync("git", ["add", "."], gitOptions);
    execFileSync("git", ["-c", "user.name=SDD Synthetic Proof", "-c", "user.email=proof@example.invalid", "-c", "core.hooksPath=", "commit", "-m", "Seed isolated synthetic repository proof"], gitOptions);
    const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], gitOptions).trim();
    const bundleHash = createHash("sha256").update(await readFile(join(directory, "native-proof.mjs"))).digest("hex");
    return { schemaVersion: 1, kind: "sdd-repository-native-proof", workspace: owned.workspace, ownerId: owned.id,
        sourceCommit, bundleHash, normalPluginsChanged: false, liveAuthentication: "not_started", privateClone: false };
}