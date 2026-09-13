import assert from "node:assert/strict";
import { test } from "node:test";

const ids = ["spec-kit-copilot-wizard", "spec-kit-copilot-sdd"];
const unrelated = { "spec-kit-copilot": "0.15.0", "spec-kit-copilot-assess": "0.1.0", "spec-kit-copilot-bugfix": "0.1.0" };
const requirements = ["reader", "artifact-domain", "wizard-workflow", "sdd-workflow", "browser-matrix", "independent-payloads", "performance",
    "native-wizard", "native-sdd", "usability", "live-stage-output", "update-rollback", "notices", "preservation"];

async function validator() {
    const module = await import("../release-metadata.mjs").catch((error) => {
        if (error.code === "ERR_MODULE_NOT_FOUND") assert.fail("T088: release metadata and publication-gate validator is missing");
        throw error;
    });
    return module.validateReleaseMetadata;
}

function fixture() {
    const manifests = Object.fromEntries([...Object.entries(unrelated), ...ids.map((id, index) => [id, `0.${index + 2}.0-fork.1`])]
        .map(([name, version]) => [name, { name, version }]));
    const baselineVersions = { ...unrelated, [ids[0]]: "0.1.1", [ids[1]]: "0.1.0" };
    const metadata = {
        manifests, baselineVersions, baselineMarketplaceVersion: "0.18.1",
        marketplace: { metadata: { version: "0.18.1" }, plugins: Object.values(manifests).map(({ name, version }) => ({ name, version })) },
        readme: `| Plugin | Version |\n| --- | --- |\n${Object.values(manifests).map(({ name, version }) => `| \`${name}\` | ${version} |`).join("\n")}\n`,
    };
    const record = {
        fork: { owner: "example-owner", repository: "example-fork", visibility: "private", supportOwner: "example-team", intendedUsers: "Authorized pilot users",
            publicationAuthority: "example-owner", revision: "1".repeat(40), upstreamBase: "96ed37d9134c63d6cb05236879a8e1dcea010e3f" },
        hostBaseline: { copilotApp: "1.1.20", copilotCli: "1.0.84-4", platform: "Windows fixture" },
        plugins: ids.map((id) => ({ id, version: manifests[id].version, source: `https://github.com/example-owner/example-fork/tree/reviewed/plugins/${id}`,
            payloadSha256: "a".repeat(64), assetManifestSha256: "b".repeat(64), readerBuildHash: `sha256:${"c".repeat(64)}`, providerCount: 1,
            knownGoodRollback: { source: `example-owner/known-good:plugins/${id}`, version: baselineVersions[id], sha256: "d".repeat(64) } })),
        approvals: { sourceReuse: "Independently authored declaration A1", installation: "Operator approval A2", liveWorkflow: "Operator approval A3", publication: "Owner approval A4", forkOwnership: "Owner approval A5" },
        evidence: requirements.map((id) => ({ id, category: id.startsWith("native") ? "app" : id === "usability" ? "usability" : id === "update-rollback" ? "rollback" : "package",
            plugin: "both", status: "pass", commandOrProcedure: `Approved ${id} procedure`, environment: "Synthetic validation record, not actual release evidence",
            resultSummary: "Passed the named gate", artifacts: [{ path: `evidence/${id}.md`, sha256: "e".repeat(64) }],
            sourceBefore: { revision: "1".repeat(40), status: "preserved" }, sourceAfter: { revision: "1".repeat(40), status: "preserved" } })),
        usability: { participants: 10, uncoached: true, reachedSectionWithin30s: 9, artifactNavigationAtLeast4: 9, sectionNavigationAtLeast4: 9, returnNavigationAtLeast4: 9 },
        rollback: { unrelatedStatePreserved: true, rehearsals: [{ passed: true, elapsedMs: 30_000 }, { passed: true, elapsedMs: 45_000 }] },
    };
    return { record, metadata };
}

test("release metadata accepts distinct independently versioned plugins only with complete approval and evidence fields", async () => {
    const validate = await validator();
    const { record, metadata } = fixture();
    const before = structuredClone({ record, metadata });
    assert.deepEqual(await validate(record, metadata), { ok: true, status: "ready", errors: [] });
    assert.deepEqual({ record, metadata }, before);
});

test("release metadata rejects plugin version drift and unrelated manifest changes", async () => {
    const validate = await validator();
    const changes = [
        ({ metadata }) => { metadata.manifests[ids[0]].version = "9.0.0"; },
        ({ metadata }) => { metadata.marketplace.plugins.find((entry) => entry.name === ids[1]).version = "9.0.0"; },
        ({ metadata }) => { metadata.readme = metadata.readme.replace("0.3.0-fork.1", "9.0.0"); },
        ({ metadata }) => { metadata.manifests["spec-kit-copilot-assess"].version = "9.0.0"; },
        ({ metadata }) => { metadata.marketplace.metadata.version = "9.0.0"; },
    ];
    for (const change of changes) {
        const sample = fixture();
        change(sample);
        const result = await validate(sample.record, sample.metadata);
        assert.equal(result.ok, false);
        assert.ok(result.errors.some((error) => /version|unrelated|marketplace/.test(error)));
    }
});

test("release metadata blocks missing ownership, source provenance, approvals, providers, or rollback targets", async () => {
    const validate = await validator();
    const changes = [
        (record) => { delete record.fork.supportOwner; }, (record) => { delete record.fork.intendedUsers; },
        (record) => { record.fork.upstreamBase = "unknown"; }, (record) => { delete record.approvals.publication; },
        (record) => { record.plugins[0].providerCount = 2; }, (record) => { delete record.plugins[1].knownGoodRollback; },
        (record) => { record.plugins[1].readerBuildHash = `sha256:${"f".repeat(64)}`; },
    ];
    for (const change of changes) {
        const { record, metadata } = fixture();
        change(record);
        const result = await validate(record, metadata);
        assert.equal(result.ok, false);
        assert.equal(result.status, "blocked");
    }
});

test("release metadata cannot substitute browser results or absent approval for native and live-workflow evidence", async () => {
    const validate = await validator();
    for (const id of ["native-wizard", "native-sdd", "live-stage-output"]) {
        const { record, metadata } = fixture();
        record.evidence = record.evidence.filter((item) => item.id !== id);
        assert.equal((await validate(record, metadata)).ok, false);
    }
    const { record, metadata } = fixture();
    record.evidence.find((item) => item.id === "native-wizard").category = "browser";
    assert.equal((await validate(record, metadata)).ok, false);
});

test("release metadata enforces participant thresholds and two bounded successful rollback rehearsals", async () => {
    const validate = await validator();
    const changes = [
        (record) => { record.usability.participants = 9; }, (record) => { record.usability.uncoached = false; },
        (record) => { record.usability.reachedSectionWithin30s = 8; }, (record) => { record.usability.returnNavigationAtLeast4 = 8; },
        (record) => { record.rollback.rehearsals.pop(); }, (record) => { record.rollback.rehearsals[0].elapsedMs = 1_800_001; },
        (record) => { record.rollback.unrelatedStatePreserved = false; },
    ];
    for (const change of changes) {
        const { record, metadata } = fixture();
        change(record);
        assert.equal((await validate(record, metadata)).ok, false);
    }
});

test("release metadata rejects failures, platform gaps, and sensitive evidence fields with bounded diagnostics", async () => {
    const validate = await validator();
    for (const value of ["fail", "platform-gap"]) {
        const { record, metadata } = fixture();
        record.evidence[0].status = value;
        assert.equal((await validate(record, metadata)).ok, false);
    }
    const { record, metadata } = fixture();
    record.evidence[0].resultSummary = "SYNTHETIC_PRIVATE_PATH C:/Users/synthetic/private.md ?cap=SYNTHETIC_CAPABILITY";
    const result = await validate(record, metadata);
    assert.equal(result.ok, false);
    assert.ok(!JSON.stringify(result).includes("SYNTHETIC_"));
    assert.equal((await validate(null, metadata)).status, "blocked");
});
