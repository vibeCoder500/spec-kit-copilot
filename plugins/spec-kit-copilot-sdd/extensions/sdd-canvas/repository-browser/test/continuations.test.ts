import assert from "node:assert/strict";
import { test } from "node:test";
import { createContinuations } from "../src/continuations.ts";

const binding = { tenant: "synthetic-tenant", account: "synthetic-user", generation: 1, query: "search", pageSize: 100, fingerprint: "directory-revision" };

test("Continuations bind kind, identity, query, page size, generation, source, and instance", () => {
    const service = createContinuations();
    const cursor = service.issue("search", binding, 100);
    assert.equal(service.verify(cursor, "search", binding), 100);
    for (const replacement of [{ account: "other-user" }, { tenant: "other-tenant" }, { generation: 2 }, { query: "other-search" },
        { pageSize: 50 }, { fingerprint: "changed-directory" }]) {
        assert.throws(() => service.verify(cursor, "search", { ...binding, ...replacement }), { code: "invalid_context" });
    }
    assert.throws(() => service.verify(cursor, "items", binding), { code: "invalid_context" });
    assert.throws(() => createContinuations().verify(cursor, "search", binding), { code: "invalid_context" });
    assert.throws(() => service.verify(`${cursor.slice(0, 10)}x${cursor.slice(11)}`, "search", binding), { code: "invalid_context" });
    assert.throws(() => service.verify("invalid", "search", binding), { code: "invalid_context" });
    service.dispose();
    assert.throws(() => service.verify(cursor, "search", binding), { code: "invalid_context" });
});

test("Expired continuations require explicit collection refresh", () => {
    let time = 1000;
    const service = createContinuations({ now: () => time, ttlMs: 10 });
    const cursor = service.issue("items", { ...binding, commit: "fixed-source" }, 50);
    time = 1010;
    assert.throws(() => service.verify(cursor, "items", { ...binding, commit: "fixed-source" }), { code: "expired_cursor" });
});