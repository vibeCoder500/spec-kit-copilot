import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createPreparedArtifactClock } from "../src/artifact-clock.ts";

test("Only verified clones use committed times, and only for blob-matching artifacts", async () => {
    const root = await realpath(await mkdtemp(join(tmpdir(), "sdd-artifact-clock-")));
    try {
        await mkdir(join(root, "specs/001-feature"), { recursive: true });
        const content = Buffer.from("# Original\n");
        const blob = createHash("sha1").update(`blob ${content.length}\0`).update(content).digest("hex");
        const path = join(root, "specs/001-feature/spec.md");
        await writeFile(path, content);
        const options = { workspacePath: root, homeDirectory: root, executable: process.execPath,
            runner: async ({ args }: { args: string[] }) => args.includes("ls-tree") ? `100644 blob ${blob}\tspecs/001-feature/spec.md\0` : "123" };
        assert.equal(await createPreparedArtifactClock({ ...options, binding: { state: "ordinary" } }), undefined);
        const clock = await createPreparedArtifactClock({ ...options, binding: { state: "verified" } });
        assert(clock);
        assert.equal(clock("specs/001-feature/spec.md", 999_000), 123_000);
        await writeFile(path, "# Original\r\n");
        assert.equal(clock("specs/001-feature/spec.md", 999_000), 123_000);
        await writeFile(path, "# Locally changed\n");
        assert.equal(clock("specs/001-feature/spec.md", 999_000), 999_000);
        assert.equal(clock("../outside/spec.md", 999_000), 999_000);
    } finally { await rm(root, { recursive: true }); }
});