import assert from "node:assert/strict";
import { test } from "node:test";
import { repositoryKey, rootKey, visibleRepositoryNodes } from "../src/ui/tree.ts";
import type { RepositoryContext, RepositoryDetail } from "../src/types.ts";

const repository = { id: "synthetic-repo", name: "Repository 10", defaultBranch: "refs/heads/main", operationalState: "active" as const };
const context: RepositoryContext = { contextId: "synthetic-context", repository: { ...repository, sourceVersion: "a".repeat(40), speckitStatus: "enabled" }, sourceVersion: "a".repeat(40), generation: 1, roots: ["/specs"] };

test("Dropdown tree expands only selected repository roots and explicitly expanded folders", () => {
    const roots = new Map([["/specs" as const, { loaded: true, loading: false, cursor: "next-page", items: [
        { id: "file-one", path: "/specs/001-feature/spec.md", label: "spec.md", kind: "file" as const, objectId: "blob" },
    ] }]]);
    const expanded = new Set<string>();
    const options = { repositories: [repository], context, roots, expanded, details: new Map<string, RepositoryDetail>() };
    assert.equal(visibleRepositoryNodes(options).length, 1);
    expanded.add(repositoryKey(repository.id));
    assert.equal(visibleRepositoryNodes(options).length, 2);
    expanded.add(rootKey(repository.id, "/specs"));
    const collapsed = visibleRepositoryNodes(options);
    assert.deepEqual(collapsed.map((node) => node.kind), ["repository", "root", "folder", "more"]);
    const folder = collapsed.find((node) => node.kind === "folder")!;
    expanded.add(folder.key);
    const nodes = visibleRepositoryNodes(options);
    assert.equal(nodes.find((node) => node.kind === "file")?.parentKey, folder.key);
    assert.equal(nodes.find((node) => node.kind === "file")?.item?.id, "file-one");
});

test("Repository ordering is natural and status-aware without changing stable row keys", () => {
    const other = { ...repository, id: "other", name: "Repository 2" };
    const details = new Map<string, RepositoryDetail>();
    const options = { repositories: [repository, other], roots: new Map(), expanded: new Set<string>(), details };
    const before = visibleRepositoryNodes(options);
    assert.equal(before[0]?.repository.id, other.id);
    details.set(repository.id, context.repository);
    const after = visibleRepositoryNodes(options);
    assert.equal(after[0]?.key, before[1]?.key);
});