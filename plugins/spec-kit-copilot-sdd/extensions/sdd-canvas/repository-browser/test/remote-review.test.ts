import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdoClient, AdoOperation } from "../src/ado-client.ts";
import { RepositoryError } from "../src/errors.ts";
import { allowedArtifactPath, createRemoteReview, decodeArtifact } from "../src/remote-review.ts";

const repositoryId = "11111111-1111-4111-8111-111111111111";

function fixture() {
    let epoch = 1;
    let denied = false;
    let head = "a".repeat(40);
    const commits: string[] = [];
    let authorizationChecks = 0;
    const client = {
        async open() { const generation = epoch; return { access: { tenantId: "tenant", accountId: "account", connectionId: "connection", generation,
            assertCurrent() { if (epoch !== generation) throw new RepositoryError("invalid_context"); } }, signal: new AbortController().signal } as AdoOperation; },
        async repository() { authorizationChecks++; if (denied) throw new RepositoryError("resource_unavailable");
            return { id: repositoryId, name: "Synthetic", defaultBranch: "refs/heads/main", operationalState: "active" }; },
        async commit() { return head; },
        async item(_operation: unknown, _id: string, commit: string, path: string) { commits.push(commit);
            return { path, isFolder: path === "/.specify", objectId: "b".repeat(40), contentMetadata: { isBinary: false, encoding: 65001 } }; },
        async tree(_operation: unknown, _id: string, commit: string, root: string) { commits.push(commit);
            return Array.from({ length: 51 }, (_, index) => ({ path: `${root}/artifact-${String(index).padStart(2, "0")}.md`, objectId: "b".repeat(40), isFolder: false })); },
        async blob() { return Buffer.from("# Synthetic\n\n[Next](artifact-01.md)\n"); },
    } as unknown as AdoClient;
    return { review: createRemoteReview({ client }), commits, checks: () => authorizationChecks,
        advanceHead() { head = "c".repeat(40); }, revoke() { denied = true; }, switchAccount() { epoch++; } };
}

test("Remote tree and content stay commit-pinned and reauthorize even cached metadata", async () => {
    const proof = fixture();
    const context = await proof.review.open(repositoryId);
    const first = await proof.review.items(context.contextId, "/specs");
    assert.equal(first.items.length, 50);
    assert(first.cursor);
    proof.advanceHead();
    const second = await proof.review.items(context.contextId, "/specs", first.cursor);
    assert.equal(second.items.length, 1);
    const document = await proof.review.content(context.contextId, first.items[0]!.id);
    assert.equal(document.source.commit, "a".repeat(40));
    assert.equal(document.sourceKind, "git-commit");
    assert.equal(document.format, "markdown");
    assert(proof.commits.every((commit) => commit === "a".repeat(40)));
    assert.equal(proof.checks(), 4);
    const refreshed = await proof.review.refresh(context.contextId);
    assert.equal(refreshed.sourceVersion, "c".repeat(40));
    await assert.rejects(proof.review.content(context.contextId, first.items[0]!.id), { code: "invalid_context" });
});

test("Item IDs, account changes, and revoked access cannot reuse a remote context", async () => {
    const proof = fixture();
    const first = await proof.review.open(repositoryId);
    const page = await proof.review.items(first.contextId, "/specs");
    const second = await proof.review.open(repositoryId);
    await assert.rejects(proof.review.content(second.contextId, page.items[0]!.id), { code: "invalid_context" });
    proof.switchAccount();
    await assert.rejects(proof.review.items(first.contextId, "/specs"), { code: "invalid_context" });
    const current = await proof.review.open(repositoryId);
    const items = await proof.review.items(current.contextId, "/specs");
    proof.revoke();
    await assert.rejects(proof.review.content(current.contextId, items.items[0]!.id), { code: "resource_unavailable" });
    await assert.rejects(proof.review.content(current.contextId, items.items[0]!.id), { code: "invalid_context" });
});

test("Remote references remain inside their repository, roots, and original commit", async () => {
    const proof = fixture();
    const context = await proof.review.open(repositoryId);
    const page = await proof.review.items(context.contextId, "/specs");
    const item = page.items[0]!;
    for (const target of ["https://unexpected.invalid/read", "//unexpected.invalid/read", "../../outside.md", "C:\\outside.md", "artifact-01.md?version=other", "%2e%2e/%2e%2e/outside.md"]) {
        await assert.rejects(proof.review.reference(context.contextId, item.id, target), { code: "invalid_request" });
    }
    const next = await proof.review.reference(context.contextId, item.id, "artifact-01.md#synthetic");
    assert.equal(next.document.artifact.relativePath, "specs/artifact-01.md");
    assert.equal(next.document.source.commit, context.sourceVersion);
    assert.equal(next.fragment, "synthetic");
});

test("Artifact paths and decoders reject unsupported data without silently changing bytes", () => {
    for (const path of ["/other/file.md", "/specs/../file.md", "/specs//file.md", "/specs/file%2emd", "C:/specs/file.md"]) assert.throws(() => allowedArtifactPath(path), { code: "invalid_request" });
    assert.equal(decodeArtifact(Buffer.from("# UTF8"), 1252), "# UTF8");
    assert.equal(decodeArtifact(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("# Unicode", "utf16le")])), "# Unicode");
    assert.throws(() => decodeArtifact(Buffer.from([0xff]), 65001), { code: "unsupported_file" });
    assert.throws(() => decodeArtifact(Buffer.from("text"), "unknown"), { code: "unsupported_file" });
    assert.throws(() => decodeArtifact(Buffer.from("\0binary")), { code: "unsupported_file" });
    assert.throws(() => decodeArtifact(Buffer.from("text"), 65001, true), { code: "unsupported_file" });
    assert.throws(() => decodeArtifact(Buffer.alloc(5_242_881)), { code: "file_too_large" });
});