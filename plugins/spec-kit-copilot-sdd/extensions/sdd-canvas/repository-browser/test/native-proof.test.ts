import assert from "node:assert/strict";
import { test } from "node:test";
import { createNativeProofServer } from "../src/native-proof.ts";
import * as nativeProof from "../src/native-proof.ts";

test("Native proof starts offline and guards every request with its own capability and origin", async () => {
    let attemptedAuth = 0;
    const proof = await createNativeProofServer({ workspaceAcknowledged: true, repositoryName: "SyntheticRepo",
        profile: { schemaVersion: 1, enabled: true, tenantId: "11111111-1111-4111-8111-111111111111",
            clientId: "22222222-2222-4222-8222-222222222222", organization: "SyntheticOrg", project: "SyntheticProject" },
        dependencies: {
            createClient() { attemptedAuth++; throw new Error("Unexpected authentication"); },
            generatePkce: async () => ({ verifier: "unused", challenge: "unused" }),
            openBrowser: async () => { throw new Error("Unexpected browser launch"); },
        },
    });
    try {
        const root = new URL(proof.url);
        const route = (path: string) => { const url = new URL(path, root); url.search = root.search; return url; };
        const missing = await fetch(new URL("/api/state", root));
        assert.equal(missing.status, 403);
        const foreign = await fetch(route("/api/state"), { headers: { Origin: "https://unexpected.invalid" } });
        assert.equal(foreign.status, 403);
        const duplicate = route("/api/state");
        duplicate.searchParams.append("cap", "other");
        assert.equal((await fetch(duplicate)).status, 403);
        const state = await (await fetch(route("/api/state"))).json();
        assert.equal(state.data.connection.state, "disconnected");
        assert.equal(state.data.runtime.workspaceAcknowledged, true);
        assert.equal(state.data.readOutcome, "not_run");
        assert.equal(attemptedAuth, 0);
        const untrusted = await fetch(route("/api/connect"), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        assert.equal(untrusted.status, 400);
        assert.equal(attemptedAuth, 0);
        const read = await fetch(route("/api/read"), { method: "POST", headers: { "Content-Type": "application/json", Origin: root.origin }, body: "{}" });
        assert.equal((await read.json()).error.code, "connection_required");
        assert.equal(attemptedAuth, 0);
        const document = await (await fetch(proof.url)).text();
        assert(document.includes("SDD Repository Connection Proof"));
        assert(!document.includes("accessToken"));
    } finally { await proof.close(); }
});

test("Entry evidence cannot promote synthetic or manual opening to native automatic acceptance", () => {
    const summarize = Reflect.get(nativeProof, "summarizeEntryAcceptance");
    assert.equal(typeof summarize, "function");
    const report = { schemaVersion: 1, scope: "synthetic", hostProof: "synthetic", appVersion: "1.1.20", sdkProtocol: 3, payloadSha256: "a".repeat(64),
        current: { repositoryIdentity: "b".repeat(64), viewed: true, cloneCount: 0, workflowCount: 0, sourcePreserved: true },
        clone: { repositoryIdentity: "c".repeat(64), beforeConsentWrites: 0, cloneCount: 1, retryCloneCount: 0, workflowCount: 0,
            sourcePreserved: true, originalBranchPreserved: true, targetVerified: true,
            phases: ["workspace_activated", "guarded_canvas_open", "target_verified", "canvas_ready"] } };
    assert.equal(summarize(report).nativeAcceptance, "blocked");
    assert.equal(summarize({ ...report, scope: "native", hostProof: "manual" }).nativeAcceptance, "blocked");
    assert.equal(summarize({ ...report, scope: "native", hostProof: "verified-native" }).nativeAcceptance, "passed");
    for (const clone of [{ ...report.clone, phases: ["workspace_activated", "canvas_ready"] }, { ...report.clone, retryCloneCount: 1 },
        { ...report.clone, sourcePreserved: false }, { ...report.clone, beforeConsentWrites: 1 }, { ...report.clone, repositoryIdentity: report.current.repositoryIdentity }]) {
        assert.equal(summarize({ ...report, scope: "native", hostProof: "verified-native", clone }).nativeAcceptance, "failed");
    }
    for (const secret of [{ accessToken: "synthetic-secret" }, { capability: "synthetic-secret" }, { confirmation: "synthetic-secret" },
        { screenshotUrl: "http://localhost/?cap=synthetic-secret" }, { clone: { ...report.clone, privatePath: "C:/private" } }]) {
        assert.throws(() => summarize({ ...report, ...secret }), error => {
            assert.doesNotMatch(String(error), /synthetic-secret|C:\/private/); return true;
        });
    }
});