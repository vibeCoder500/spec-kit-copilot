import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { READER_PACKAGE, REPOSITORY_ROOT } from "./sync-assets.mjs";

const require = createRequire(new URL(`../../${READER_PACKAGE}/package.json`, import.meta.url));
const PLUGINS = ["spec-kit-copilot-wizard", "spec-kit-copilot-sdd"];
const BASELINE_VERSIONS = { "spec-kit-copilot": "0.15.0", "spec-kit-copilot-assess": "0.1.0", "spec-kit-copilot-bugfix": "0.1.0",
    "spec-kit-copilot-wizard": "0.1.1", "spec-kit-copilot-sdd": "0.1.0" };
const REQUIRED_EVIDENCE = ["reader", "artifact-domain", "wizard-workflow", "sdd-workflow", "browser-matrix", "independent-payloads", "performance",
    "native-wizard", "native-sdd", "usability", "live-stage-output", "update-rollback", "notices", "preservation"];
const CATEGORIES = new Set(["unit", "service", "security", "browser", "package", "app", "performance", "accessibility", "usability", "update", "rollback"]);
const HASH = /^[a-f0-9]{64}$/;
const REVISION = /^[a-f0-9]{40}$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const text = (value, limit = 2048) => typeof value === "string" && Boolean(value.trim()) && value.length <= limit &&
    !/^(?:unknown|undecided|unassigned|pending|not approved|not run|tbd|todo)(?:\b|$)/i.test(value);
const sensitive = (value) => /(?:[?&](?:token|cap|code|access_token|id_token)=)|(?<![A-Za-z0-9])[A-Za-z]:[\\/]|file:\/\/|\/(?:Users|home)\/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/i.test(value);
const safeRelative = (value) => text(value) && !isAbsolute(value) && !/[\\:?#]/.test(value) && value.split("/").every((part) => part && part !== "." && part !== ".." && part !== ".git");

function readmeVersions(markdown) {
    const { unified } = require("unified");
    const remarkParse = require("remark-parse").default;
    const remarkGfm = require("remark-gfm").default;
    const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
    const versions = new Map();
    const content = (node) => typeof node.value === "string" ? node.value : (node.children ?? []).map(content).join("");
    for (const table of tree.children.filter((node) => node.type === "table")) {
        for (const row of table.children) {
            const values = row.children.map(content);
            if (values.length >= 2 && Object.hasOwn(BASELINE_VERSIONS, values[0])) {
                if (versions.has(values[0])) versions.set(values[0], null);
                else versions.set(values[0], values[1]);
            }
        }
    }
    return versions;
}

export async function validateReleaseMetadata(record, metadata = {}) {
    const errors = new Set();
    const fail = (code) => errors.add(code);
    const result = () => ({ ok: errors.size === 0, status: errors.size ? "blocked" : "ready", errors: [...errors].sort() });
    if (!record || typeof record !== "object" || Array.isArray(record)) { fail("release_record_missing_or_invalid"); return result(); }
    let serialized;
    try { serialized = JSON.stringify(record); } catch { fail("release_record_invalid"); return result(); }
    if (serialized.length > 1024 * 1024 || sensitive(serialized)) fail("release_record_sensitive_or_oversized");
    const fork = record.fork ?? {};
    for (const key of ["owner", "repository", "supportOwner", "intendedUsers", "publicationAuthority"]) if (!text(fork[key])) fail(`fork_${key}_missing`);
    if (!["public", "private", "internal"].includes(fork.visibility)) fail("fork_visibility_missing");
    if (!REVISION.test(fork.revision ?? "") || !REVISION.test(fork.upstreamBase ?? "")) fail("fork_revision_invalid");
    for (const key of ["copilotApp", "copilotCli", "platform"]) if (!text(record.hostBaseline?.[key])) fail("host_baseline_incomplete");
    for (const key of ["sourceReuse", "installation", "liveWorkflow", "publication", "forkOwnership"]) if (!text(record.approvals?.[key])) fail(`approval_${key}_missing`);

    const plugins = Array.isArray(record.plugins) ? record.plugins : [];
    if (plugins.length !== 2 || new Set(plugins.map((plugin) => plugin?.id)).size !== 2 || plugins.some((plugin) => !PLUGINS.includes(plugin?.id))) fail("plugin_identities_invalid");
    let readme;
    try { readme = readmeVersions(metadata.readme ?? ""); } catch { readme = new Map(); fail("readme_versions_invalid"); }
    for (const id of PLUGINS) {
        const plugin = plugins.find((item) => item?.id === id);
        if (!plugin) { fail("plugin_record_missing"); continue; }
        const manifest = metadata.manifests?.[id];
        const marketplace = metadata.marketplace?.plugins?.filter((entry) => entry.name === id) ?? [];
        if (!VERSION.test(plugin.version ?? "") || plugin.version === metadata.baselineVersions?.[id] || manifest?.name !== id || manifest?.version !== plugin.version) fail("plugin_manifest_version_mismatch");
        if (marketplace.length !== 1 || marketplace[0].version !== plugin.version) fail("marketplace_plugin_version_mismatch");
        if (readme.get(id) !== plugin.version) fail("readme_plugin_version_mismatch");
        if (!text(plugin.source) || !HASH.test(plugin.payloadSha256 ?? "") || !HASH.test(plugin.assetManifestSha256 ?? "") ||
            !/^sha256:[a-f0-9]{64}$/.test(plugin.readerBuildHash ?? "")) fail("plugin_provenance_incomplete");
        if (plugin.providerCount !== 1) fail("plugin_provider_count_invalid");
        const rollback = plugin.knownGoodRollback;
        if (!rollback || !text(rollback.source) || !VERSION.test(rollback.version ?? "") || !HASH.test(rollback.sha256 ?? "")) fail("plugin_rollback_target_incomplete");
    }
    if (new Set(plugins.map((plugin) => plugin?.readerBuildHash)).size !== 1) fail("reader_build_hash_mismatch");
    for (const [id, version] of Object.entries(metadata.baselineVersions ?? {})) {
        if (PLUGINS.includes(id)) continue;
        const entries = metadata.marketplace?.plugins?.filter((entry) => entry.name === id) ?? [];
        if (metadata.manifests?.[id]?.version !== version || entries.length !== 1 || entries[0].version !== version || readme.get(id) !== version) fail("unrelated_plugin_version_changed");
    }
    if (!metadata.baselineMarketplaceVersion || metadata.marketplace?.metadata?.version !== metadata.baselineMarketplaceVersion) fail("unrelated_marketplace_version_changed");

    const evidence = Array.isArray(record.evidence) ? record.evidence : [];
    if (new Set(evidence.map((item) => item?.id)).size !== evidence.length) fail("evidence_ids_ambiguous");
    for (const id of REQUIRED_EVIDENCE) {
        const item = evidence.find((entry) => entry?.id === id);
        if (!item) { fail(`evidence_${id}_missing`); continue; }
        if (item.status !== "pass") fail(`evidence_${id}_not_passed`);
        if (!CATEGORIES.has(item.category) || ![...PLUGINS, "wizard", "sdd", "both", "reader"].includes(item.plugin) ||
            !text(item.commandOrProcedure) || !item.environment || !text(item.resultSummary) || !item.sourceBefore || !item.sourceAfter) fail("evidence_fields_incomplete");
        if (id.startsWith("native-") && item.category !== "app") fail("native_evidence_cannot_be_substituted");
        if (!Array.isArray(item.artifacts) || !item.artifacts.length || item.artifacts.some((artifact) => !safeRelative(artifact.path) || !HASH.test(artifact.sha256 ?? ""))) fail("evidence_artifacts_incomplete");
    }
    if (evidence.some((item) => item?.status !== "pass")) fail("release_has_unresolved_evidence");
    const study = record.usability;
    if (!study || !Number.isInteger(study.participants) || study.participants < 10 || study.uncoached !== true ||
        ["reachedSectionWithin30s", "artifactNavigationAtLeast4", "sectionNavigationAtLeast4", "returnNavigationAtLeast4"].some((field) =>
            !Number.isInteger(study[field]) || study[field] < 9 || study[field] > study.participants)) fail("usability_threshold_not_met");
    const rehearsals = record.rollback?.rehearsals;
    if (record.rollback?.unrelatedStatePreserved !== true || !Array.isArray(rehearsals) || rehearsals.length !== 2 ||
        rehearsals.some((item) => item.passed !== true || !Number.isFinite(item.elapsedMs) || item.elapsedMs <= 0) ||
        rehearsals.reduce((total, item) => total + item.elapsedMs, 0) > 1_800_000) fail("rollback_rehearsals_incomplete");
    return result();
}

async function existingMetadata(repositoryRoot) {
    const manifests = {};
    for (const id of Object.keys(BASELINE_VERSIONS)) {
        manifests[id] = JSON.parse(await readFile(join(repositoryRoot, id === "spec-kit-copilot" ? "plugin.json" : `plugins/${id}/plugin.json`), "utf8"));
    }
    return { manifests, baselineVersions: BASELINE_VERSIONS, baselineMarketplaceVersion: "0.18.1",
        marketplace: JSON.parse(await readFile(join(repositoryRoot, ".github/plugin/marketplace.json"), "utf8")),
        readme: await readFile(join(repositoryRoot, "README.md"), "utf8") };
}

async function verifyEvidenceFiles(record, repositoryRoot) {
    for (const item of record.evidence) {
        for (const artifact of item.artifacts) {
            if (!safeRelative(artifact.path)) throw new Error("Evidence path is invalid.");
            const target = resolve(repositoryRoot, artifact.path);
            let current = repositoryRoot;
            for (const part of relative(repositoryRoot, target).split(sep)) {
                current = join(current, part);
                if ((await lstat(current)).isSymbolicLink()) throw new Error("Evidence path redirects.");
            }
            const bytes = await readFile(target);
            if (createHash("sha256").update(bytes).digest("hex") !== artifact.sha256) throw new Error("Evidence artifact hash mismatch.");
        }
    }
}

export async function runCommand(args) {
    if (args.length === 1 && args[0] === "--help") {
        console.log("Usage: node scripts/canvas-reader/release-metadata.mjs [--if-present]");
        console.log("Checks recorded approvals and evidence; never grants authority or publishes.");
        return;
    }
    if (args.some((value) => value !== "--if-present") || args.length > 1) throw new Error("Unsupported release-validation option.");
    const repositoryRoot = resolve(REPOSITORY_ROOT);
    let record;
    try { record = JSON.parse(await readFile(join(repositoryRoot, "specs/001-integrated-markdown-review/evidence/fork-release-record.json"), "utf8")); }
    catch (error) {
        if (error.code === "ENOENT" && args.includes("--if-present")) {
            console.log(JSON.stringify({ ok: false, status: "not-requested", publicationReady: false, errors: ["release_record_absent"] }));
            return;
        }
        console.log(JSON.stringify({ ok: false, status: "blocked", errors: ["release_record_missing_or_invalid"] }));
        process.exitCode = 1;
        return;
    }
    const result = await validateReleaseMetadata(record, await existingMetadata(repositoryRoot));
    if (result.ok) {
        try { await verifyEvidenceFiles(record, repositoryRoot); }
        catch { result.ok = false; result.status = "blocked"; result.errors.push("evidence_file_verification_failed"); }
    }
    console.log(JSON.stringify(result));
    if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    runCommand(process.argv.slice(2)).catch(() => {
        console.error(JSON.stringify({ ok: false, status: "blocked", errors: ["release_validation_failed"] }));
        process.exitCode = 1;
    });
}
