import { createHash, randomBytes } from "node:crypto";
import { lstat, mkdir, open, readFile, readdir, realpath, rename, unlink, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { homedir } from "node:os";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { parseDocument } from "yaml";
import { errorEnvelope, knownRepositoryError, RepositoryError, repositoryErrorStatus } from "./errors.ts";
import { findSetupExecutable, redactSetupOutput, runSetupCommand, setupEnvironment, SetupCommandError } from "./setup-process.ts";
import type { SetupCommandResult, SetupCommandRunner, SetupTool } from "./setup-process.ts";
import type { HostHandoffAdapter, HostWorkspaceSnapshot, LocalRepositoryIdentity } from "./types.ts";
import { inspectCurrentRepository } from "./workspace-binding.ts";

export const ORGANIZATION_SETUP = Object.freeze({
    hostname: "msft.ghe.com",
    repository: "1eh-msd/msd-speckit-registry",
    bundleId: "msd-bundle",
    bundleName: "MSD Bundle",
    sourceUrl: "https://msft.ghe.com/1eh-msd/msd-speckit-registry",
    tokenEnvironment: "GH_ENTERPRISE_TOKEN",
    squadUrl: "https://msft.ghe.com/1eh-msd/msd-speckit-registry/releases/download/v1.0.0/squad-v1.0.0.zip",
});
const REGISTRY_HOSTS = ["msft.ghe.com", "raw.msft.ghe.com", "api.msft.ghe.com"];
const CATALOGS = [
    { id: "extension-catalog", group: "extension", name: "MSD Built Extensions", file: "extension-catalogs.yml", source: "extensions.catalog.json" },
    { id: "preset-catalog", group: "preset", name: "MSD Built Presets", file: "preset-catalogs.yml", source: "presets.catalog.json" },
    { id: "bundle-catalog", group: "bundle", name: "MSD Built Bundles", file: "bundle-catalogs.yml", source: "bundles.catalog.json" },
    { id: "workflow-catalog", group: "workflow", name: "MSD Built Workflows", file: "workflow-catalogs.yml", source: "workflows.catalog.json" },
] as const;
export type SetupProgress = "pending" | "loading" | "waiting" | "completed" | "skipped" | "error" | "cancelled";
export interface SetupStep { id: string; label: string; status: SetupProgress; detail?: string; command?: string }
export interface SetupArtifact extends SetupStep { kind: "extension" | "preset"; version: string; priority?: number; strategy?: string }
export interface OrganizationSetupPlan { version: string; minimumVersion: string; artifacts: SetupArtifact[] }
export interface ScaffoldingJob {
    id: string;
    requestId: string;
    status: "running" | "waiting" | "completed" | "error" | "cancelled" | "interrupted";
    startedAt: number;
    finishedAt?: number;
    steps: SetupStep[];
    artifacts: SetupArtifact[];
    bundleVersion?: string;
    errorCode?: string;
    message?: string;
}
interface StoredJob {
    schemaVersion: 1;
    kind: "sdd-organization-scaffolding";
    workspacePath: string;
    pid: number;
    requests: string[];
    job: ScaffoldingJob;
}
interface ActiveJob {
    record: StoredJob;
    controller: AbortController;
    completion: Promise<void>;
    listeners: Set<() => void>;
}
type AutomaticAdmission = { status: "started" | "retained" } | { status: "error"; code: RepositoryError["code"] };
const activeJobs = new Map<string, ActiveJob>();
const STEP_DEFINITIONS = [
    ["github-cli", "GitHub CLI"],
    ["authentication", "Organization sign-in"],
    ["registry-auth", "Spec Kit registry authentication"],
    ["registry", "Recommended organization bundle"],
    ["specify-cli", "Install or update Spec Kit"],
    ["initialize", "Initialize Copilot skills mode"],
    ["extension-catalog", "Extension catalog"],
    ["preset-catalog", "Preset catalog"],
    ["bundle-catalog", "Bundle catalog"],
    ["workflow-catalog", "Workflow catalog"],
    ["bundle", "Install the recommended bundle"],
    ["verify", "Verify installed artifacts"],
    ["skills", "Reload session skills"],
] as const;
const progresses = new Set<SetupProgress>(["pending", "loading", "waiting", "completed", "skipped", "error", "cancelled"]);
const object = (value: unknown): Record<string, unknown> | null =>
    value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const identifier = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
const version = (value: unknown): value is string => typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value);
const initialSteps = (): SetupStep[] => STEP_DEFINITIONS.map(([id, label]) => ({ id, label, status: "pending" }));
const catalogUrl = (source: string) => `https://raw.msft.ghe.com/${ORGANIZATION_SETUP.repository}/main/${source}`;

export function versionAtLeast(installed: string, minimum: string) {
    if (!version(installed) || !version(minimum)) return false;
    const left = installed.split(".").map(Number);
    const right = minimum.split(".").map(Number);
    for (let index = 0; index < 3; index++) {
        if (left[index] !== right[index]) return left[index]! > right[index]!;
    }
    return true;
}

function yamlObject(text: string, code: "scaffolding_registry_invalid" | "scaffolding_storage_invalid" = "scaffolding_storage_invalid") {
    const document = parseDocument(text, { uniqueKeys: true });
    const parsed: unknown = document.toJS();
    const data = object(parsed);
    if (document.errors.length || !data) throw new RepositoryError(code);
    return data;
}

export function parseOrganizationSetup(workflowText: string, bundleText: string, catalogText: string): OrganizationSetupPlan {
    const workflow = yamlObject(workflowText, "scaffolding_registry_invalid");
    const manifest = yamlObject(bundleText, "scaffolding_registry_invalid");
    let catalog: Record<string, unknown> | null;
    try { catalog = object(JSON.parse(catalogText)); }
    catch { throw new RepositoryError("scaffolding_registry_invalid"); }
    const bundle = object(manifest.bundle);
    const catalogBundle = object(object(catalog?.bundles)?.[ORGANIZATION_SETUP.bundleId]);
    const minimum = object(workflow.requires)?.speckit_version;
    const bundleMinimum = object(manifest.requires)?.speckit_version;
    const steps = Array.isArray(workflow.steps) ? workflow.steps.map(object) : [];
    const init = steps.find(step => step?.id === "init-project");
    const required = ["check-speckit-version", "init-project", "add-extension-catalog", "add-preset-catalog", "add-bundle-catalog", "install-bundle"];
    if (manifest.schema_version !== "1.0" || workflow.schema_version !== "1.0" || !bundle || bundle.id !== ORGANIZATION_SETUP.bundleId ||
        !version(bundle.version) || catalogBundle?.version !== bundle.version || typeof minimum !== "string" || !/^>=\d+\.\d+\.\d+$/.test(minimum) ||
        typeof bundleMinimum !== "string" || !/^>=\d+\.\d+\.\d+$/.test(bundleMinimum) || required.some(id => !steps.some(step => step?.id === id)) ||
        init?.type !== "init" || init.here !== true || init.integration !== "copilot" || init.integration_options !== "--skills" || init.force !== true) {
        throw new RepositoryError("scaffolding_registry_invalid");
    }
    const provides = object(manifest.provides);
    if (!provides || Object.entries(provides).some(([kind, values]) => !["extensions", "presets"].includes(kind) &&
        (!Array.isArray(values) || values.length))) throw new RepositoryError("scaffolding_registry_invalid");
    const artifacts: SetupArtifact[] = [];
    for (const [plural, kind] of [["extensions", "extension"], ["presets", "preset"]] as const) {
        const entries = provides[plural] ?? [];
        if (!Array.isArray(entries)) throw new RepositoryError("scaffolding_registry_invalid");
        for (const raw of entries) {
            const entry = object(raw);
            if (!entry || typeof entry.id !== "string" || !/^[a-z][a-z0-9-]{0,100}$/.test(entry.id) || !version(entry.version) ||
                artifacts.some(artifact => artifact.kind === kind && artifact.id === entry.id) ||
                (entry.priority !== undefined && (!Number.isSafeInteger(entry.priority) || Number(entry.priority) < 1)) ||
                (entry.strategy !== undefined && !["replace", "append", "prepend", "wrap"].includes(String(entry.strategy)))) {
                throw new RepositoryError("scaffolding_registry_invalid");
            }
            artifacts.push({ id: entry.id, label: entry.id, kind, version: entry.version, status: "pending",
                ...(typeof entry.priority === "number" ? { priority: entry.priority } : {}),
                ...(typeof entry.strategy === "string" ? { strategy: entry.strategy } : {}) });
        }
    }
    if (!artifacts.length || artifacts.length > 128) throw new RepositoryError("scaffolding_registry_invalid");
    return { version: bundle.version, minimumVersion: versionAtLeast(minimum.slice(2), bundleMinimum.slice(2)) ? minimum.slice(2) : bundleMinimum.slice(2), artifacts };
}

async function safeRead(root: string, segments: string[], maximum = 1_048_576): Promise<string | null> {
    let path = root;
    try {
        const rootInfo = await lstat(root);
        if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink() || await realpath(root) !== resolve(root)) throw new RepositoryError("scaffolding_storage_invalid");
        for (let index = 0; index < segments.length; index++) {
            path = join(path, segments[index]!);
            const info = await lstat(path);
            if (info.isSymbolicLink() || (index === segments.length - 1 ? !info.isFile() || info.size > maximum : !info.isDirectory()) ||
                await realpath(path) !== resolve(path)) throw new RepositoryError("scaffolding_storage_invalid");
        }
        const content = await readFile(path, "utf8");
        if (Buffer.byteLength(content) > maximum) throw new RepositoryError("scaffolding_storage_invalid");
        return content;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
    }
}

async function safeDirectory(parent: string, name: string) {
    const path = join(parent, name);
    await mkdir(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; });
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink() || await realpath(path) !== resolve(path)) throw new RepositoryError("scaffolding_storage_invalid");
    return path;
}

async function atomicWrite(path: string, content: string) {
    const temporary = `${path}.${randomBytes(8).toString("hex")}.tmp`;
    try { await writeFile(temporary, content, { flag: "wx", mode: 0o600 }); await rename(temporary, path); }
    finally { await unlink(temporary).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; }); }
}

async function acquireSetupLock(root: string, segments: string[], jobId: string) {
    const path = join(root, ...segments);
    const previous = await safeRead(root, segments, 1024);
    if (previous !== null) {
        const recoveryPath = `${path}.recovery`;
        const recovery = await open(recoveryPath, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
            if (error.code === "EEXIST") throw new RepositoryError("scaffolding_conflict");
            throw error;
        });
        try {
            const latest = await safeRead(root, segments, 1024);
            if (latest !== previous) throw new RepositoryError("scaffolding_conflict");
            let owner: Record<string, unknown> | null;
            try { owner = object(JSON.parse(latest!)); }
            catch { throw new RepositoryError("scaffolding_storage_invalid"); }
            if (!owner || !Number.isSafeInteger(owner.pid) || Number(owner.pid) < 1 || !identifier(owner.jobId) ||
                processAlive(Number(owner.pid))) throw new RepositoryError("scaffolding_conflict");
            await unlink(path);
        } finally { await recovery.close(); await unlink(recoveryPath); }
    }
    const lock = await open(path, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "EEXIST") throw new RepositoryError("scaffolding_conflict");
        throw error;
    });
    try { await lock.writeFile(JSON.stringify({ pid: process.pid, jobId })); }
    catch (error) { await lock.close(); await unlink(path); throw error; }
    return lock;
}

export function mergeRegistryAuthentication(existing: unknown): Record<string, unknown> & { providers: Record<string, unknown>[] } {
    const data = existing === null ? {} : object(existing);
    if (!data || (data.providers !== undefined && !Array.isArray(data.providers))) throw new RepositoryError("scaffolding_storage_invalid");
    const providers: Record<string, unknown>[] = [];
    for (const raw of data.providers ?? []) {
        const provider = object(raw);
        if (!provider || !Array.isArray(provider.hosts) || provider.hosts.some(host => typeof host !== "string")) throw new RepositoryError("scaffolding_storage_invalid");
        const hosts = provider.hosts.filter(host => !REGISTRY_HOSTS.includes(String(host).toLowerCase()));
        if (hosts.length) providers.push({ ...provider, hosts });
    }
    providers.push({ hosts: REGISTRY_HOSTS, provider: "github", auth: "bearer", token_env: ORGANIZATION_SETUP.tokenEnvironment });
    return { ...data, providers };
}

async function configureRegistryAuthentication(home: string) {
    await safeDirectory(home, ".specify");
    const path = join(home, ".specify", "auth.json");
    const lockPath = `${path}.sdd-lock`;
    const lock = await acquireSetupLock(home, [".specify", "auth.json.sdd-lock"], randomBytes(16).toString("hex"));
    try {
        const content = await safeRead(home, [".specify", "auth.json"], 65_536);
        let existing: unknown = null;
        try { if (content !== null) existing = JSON.parse(content); }
        catch { throw new RepositoryError("scaffolding_storage_invalid"); }
        const merged = mergeRegistryAuthentication(existing);
        if (JSON.stringify(existing) !== JSON.stringify(merged)) await atomicWrite(path, `${JSON.stringify(merged, null, 2)}\n`);
    } finally { await lock.close(); await unlink(lockPath); }
}

async function verifyManagedPaths(workspacePath: string) {
    let count = 0;
    for (const root of [".specify", ".github"]) {
        const queue = [join(workspacePath, root)];
        while (queue.length) {
            const path = queue.pop()!;
            let info;
            try { info = await lstat(path); }
            catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
            if (++count > 50_000 || info.isSymbolicLink() || await realpath(path) !== resolve(path)) throw new RepositoryError("scaffolding_storage_invalid");
            if (info.isDirectory()) for (const entry of await readdir(path)) queue.push(join(path, entry));
            else if (!info.isFile()) throw new RepositoryError("scaffolding_storage_invalid");
        }
    }
}

async function installedArtifact(workspacePath: string, artifact: SetupArtifact, live = false): Promise<boolean> {
    const plural = artifact.kind === "extension" ? "extensions" : "presets";
    const registryText = await safeRead(workspacePath, [".specify", plural, ".registry"]);
    if (registryText === null) return false;
    let registry: Record<string, unknown> | null;
    try { registry = object(JSON.parse(registryText)); }
    catch (error) { if (live && error instanceof SyntaxError) return false; throw new RepositoryError("scaffolding_storage_invalid"); }
    if (!registry || registry.schema_version !== "1.0" || !object(registry[plural])) throw new RepositoryError("scaffolding_storage_invalid");
    const entry = object(object(registry[plural])?.[artifact.id]);
    if (!entry || entry.version !== artifact.version || entry.enabled === false ||
        (artifact.priority !== undefined && entry.priority !== artifact.priority)) return false;
    const manifestText = await safeRead(workspacePath, [".specify", plural, artifact.id, `${artifact.kind}.yml`]);
    if (manifestText === null) return false;
    const manifest = yamlObject(manifestText);
    const metadata = object(manifest[artifact.kind]) ?? manifest;
    return metadata.id === artifact.id && metadata.version === artifact.version;
}

export async function verifyOrganizationArtifacts(workspacePath: string, plan: OrganizationSetupPlan) {
    for (const artifact of plan.artifacts) if (!await installedArtifact(workspacePath, artifact)) throw new RepositoryError("scaffolding_verification_failed");
    const text = await safeRead(workspacePath, [".specify", "bundle-records.json"]);
    let records: Record<string, unknown> | null = null;
    try { if (text !== null) records = object(JSON.parse(text)); }
    catch { throw new RepositoryError("scaffolding_storage_invalid"); }
    if (records?.schema_version !== "1.0" || !Array.isArray(records.bundles) ||
        !records.bundles.some(raw => object(raw)?.bundle_id === ORGANIZATION_SETUP.bundleId && object(raw)?.version === plan.version)) {
        throw new RepositoryError("scaffolding_verification_failed");
    }
}

function isStoredJob(raw: unknown, workspacePath: string): raw is StoredJob {
    const data = object(raw);
    const job = object(data?.job);
    const validStep = (rawStep: unknown) => {
        const step = object(rawStep);
        return step && identifier(step.id) && typeof step.label === "string" && step.label.length <= 256 &&
            progresses.has(step.status as SetupProgress) && [step.detail, step.command].every(value => value === undefined || typeof value === "string" && value.length <= 4096);
    };
    if (!data || data.schemaVersion !== 1 || data.kind !== "sdd-organization-scaffolding" || data.workspacePath !== workspacePath ||
        !Number.isSafeInteger(data.pid) || Number(data.pid) < 1 || !Array.isArray(data.requests) || data.requests.length > 64 || !data.requests.every(identifier) ||
        !job || !identifier(job.id) || !identifier(job.requestId) || !Number.isSafeInteger(job.startedAt) ||
        !["running", "waiting", "completed", "error", "cancelled", "interrupted"].includes(String(job.status)) ||
        !Array.isArray(job.steps) || job.steps.length !== STEP_DEFINITIONS.length || !job.steps.every(validStep) ||
        !Array.isArray(job.artifacts) || job.artifacts.length > 128 || !job.artifacts.every(artifact =>
            validStep(artifact) && ["extension", "preset"].includes(String(object(artifact)?.kind)) && version(object(artifact)?.version))) {
        return false;
    }
    return true;
}

function storedJob(raw: unknown, workspacePath: string): StoredJob {
    if (!isStoredJob(raw, workspacePath)) throw new RepositoryError("scaffolding_storage_invalid");
    return raw;
}

function processAlive(pid: number) {
    try { process.kill(pid, 0); return true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ESRCH") return false; throw new RepositoryError("scaffolding_conflict"); }
}

export async function hasPendingScaffolding(workspacePath: string, homeDirectory = homedir()) {
    const workspace = await realpath(workspacePath);
    const active = activeJobs.get(workspace);
    if (active) return active.record.job.status !== "completed";
    const home = await realpath(homeDirectory);
    const key = createHash("sha256").update(workspace).digest("hex");
    const text = await safeRead(home, ["SpecKitCanvas", "scaffolding", `${key}.json`], 131_072);
    if (text === null) return false;
    let raw: unknown;
    try { raw = JSON.parse(text); }
    catch { throw new RepositoryError("scaffolding_storage_invalid"); }
    return storedJob(raw, workspace).job.status !== "completed";
}

export interface ScaffoldingOptions {
    workspacePath: string;
    host: HostHandoffAdapter;
    verifyWorkspace: () => Promise<void>;
    setupRequired: () => boolean;
    reloadSkills: () => Promise<{ warnings: string[]; errors: string[] }>;
    onContinue: () => void;
    onChange?: () => void;
    homeDirectory?: string;
    environment?: NodeJS.ProcessEnv;
    platform?: NodeJS.Platform;
    runner?: SetupCommandRunner;
    findExecutable?: (tool: SetupTool) => Promise<string | undefined>;
    inspectWorkspace?: (path: string) => Promise<LocalRepositoryIdentity | null>;
    now?: () => number;
}

async function reloadSetupSkills(reload: ScaffoldingOptions["reloadSkills"], signal: AbortSignal) {
    if (signal.aborted) throw new RepositoryError("scaffolding_cancelled");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let aborted: () => void = () => undefined;
    try {
        return await Promise.race([Promise.resolve().then(reload), new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new RepositoryError("skills_reload_unavailable")), 30_000);
            aborted = () => reject(new RepositoryError("scaffolding_cancelled"));
            signal.addEventListener("abort", aborted, { once: true });
        })]);
    } finally { if (timer) clearTimeout(timer); signal.removeEventListener("abort", aborted); }
}

export async function createScaffoldingService(options: ScaffoldingOptions) {
    const home = await realpath(options.homeDirectory ?? homedir());
    const workspacePath = await realpath(options.workspacePath);
    const key = createHash("sha256").update(workspacePath).digest("hex");
    const directory = join(home, "SpecKitCanvas", "scaffolding");
    const recordPath = join(directory, `${key}.json`);
    const lockPath = join(directory, `${key}.lock`);
    const now = options.now ?? Date.now;
    const inspect = options.inspectWorkspace ?? (path => inspectCurrentRepository({ workspacePath: path, homeDirectory: home }));
    const initial = await options.host.inspectCurrent();
    let consent: { id: string; host: HostWorkspaceSnapshot; identity: LocalRepositoryIdentity | null; expiresAt: number } | undefined;
    let contextTail: Promise<void> = Promise.resolve();
    let automaticAdmission: Promise<AutomaticAdmission> | undefined;
    let automaticStartError: RepositoryError["code"] | null = null;
    const listener = options.onChange ?? (() => undefined);
    activeJobs.get(workspacePath)?.listeners.add(listener);

    async function readRecord() {
        const active = activeJobs.get(workspacePath);
        if (active) return active.record;
        const text = await safeRead(home, ["SpecKitCanvas", "scaffolding", `${key}.json`], 131_072);
        if (text === null) return null;
        let parsed: unknown;
        try { parsed = JSON.parse(text); }
        catch { throw new RepositoryError("scaffolding_storage_invalid"); }
        const record = storedJob(parsed, workspacePath);
        if (["running", "waiting"].includes(record.job.status) && !processAlive(record.pid)) {
            record.job.status = "interrupted";
            record.job.message = "The setup process ended before completion. Review the completed steps, then explicitly retry setup.";
            for (const step of [...record.job.steps, ...record.job.artifacts]) if (["loading", "waiting"].includes(step.status)) {
                step.status = "error"; step.detail = "Interrupted; completion has not been verified.";
            }
        }
        return record;
    }

    async function inspectContext(requireIdle: boolean) {
        await options.verifyWorkspace();
        const host = await options.host.inspectCurrent();
        if (host.sessionId !== initial.sessionId || host.contextRevision !== initial.contextRevision ||
            host.workingDirectory !== initial.workingDirectory || host.capabilityGeneration !== initial.capabilityGeneration) throw new RepositoryError("context_changed");
        if (requireIdle && host.activity !== "idle") throw new RepositoryError(host.activity === "busy" ? "session_busy" : "activity_unknown");
        const identity = await inspect(workspacePath);
        const directory = await realpath(host.workingDirectory);
        const part = relative(workspacePath, directory);
        if (part === ".." || part.startsWith(`..${sep}`) || isAbsolute(part) || identity && identity.worktreeRoot !== workspacePath) {
            throw new RepositoryError("local_context_mismatch");
        }
        return { host, identity };
    }

    function context(requireIdle = false) {
        const observation = contextTail.then(() => inspectContext(requireIdle));
        contextTail = observation.then(() => undefined, () => undefined);
        return observation;
    }

    function sameIdentity(left: LocalRepositoryIdentity | null, right: LocalRepositoryIdentity | null) {
        return left !== null && right !== null && ["worktreeRoot", "gitCommonDirectory", "origin", "head", "branch"].every(field =>
            left[field as keyof LocalRepositoryIdentity] === right[field as keyof LocalRepositoryIdentity]);
    }

    const service = {
        async state() {
            const current = await context();
            const saved = await readRecord();
            if (!consent || consent.expiresAt <= now() || consent.host.activityRevision !== current.host.activityRevision ||
                !sameIdentity(consent.identity, current.identity)) {
                consent = { id: `setup_${randomBytes(24).toString("base64url")}`, ...current, expiresAt: now() + 120_000 };
            }
            const active = saved && ["running", "waiting"].includes(saved.job.status);
            return { renderer: "scaffolding" as const, contextId: consent.id, repositoryName: basename(workspacePath), workspacePath,
                recommendation: ORGANIZATION_SETUP, setupRequired: options.setupRequired(), steps: initialSteps(),
                runtime: { node: process.version, platform: process.platform },
                canStart: Boolean(current.identity) && current.host.activity === "idle" && !active,
                blockedReason: !current.identity ? "local_context_mismatch" : current.host.activity !== "idle" ?
                    current.host.activity === "busy" ? "session_busy" : "activity_unknown" : active ? "scaffolding_conflict" : null,
                automaticStartError: saved && ["running", "waiting", "completed"].includes(saved.job.status) ? null : automaticStartError,
                job: saved ? structuredClone(saved.job) : null };
        },
        startAutomatically(): Promise<AutomaticAdmission> {
            automaticAdmission ??= (async () => {
                try {
                    const state = await service.state();
                    if (!options.setupRequired() || state.job && state.job.status !== "completed") return { status: "retained" as const };
                    await service.start(state.contextId, `automatic-${randomBytes(16).toString("hex")}`);
                    return { status: "started" as const };
                } catch (error) {
                    automaticStartError = knownRepositoryError(object(error)?.code).code;
                    console.error(`SDD automatic setup admission failed: ${automaticStartError}`);
                    listener();
                    return { status: "error" as const, code: automaticStartError };
                }
            })();
            return automaticAdmission;
        },
        async start(contextId: string, requestId: string) {
            if (!identifier(requestId) || !consent || contextId !== consent.id) throw new RepositoryError("invalid_context");
            const saved = await readRecord();
            if (saved?.requests.includes(requestId)) return service.state();
            if (saved && ["running", "waiting"].includes(saved.job.status)) throw new RepositoryError("scaffolding_conflict");
            const current = await context(true);
            if (consent.expiresAt <= now() || consent.host.activityRevision !== current.host.activityRevision ||
                !sameIdentity(consent.identity, current.identity)) throw new RepositoryError("context_changed");
            if (!options.setupRequired() && saved?.job.status !== "error" && saved?.job.status !== "cancelled" && saved?.job.status !== "interrupted") {
                throw new RepositoryError("scaffolding_not_required");
            }
            await verifyManagedPaths(workspacePath);
            const env = await setupEnvironment(workspacePath, options.environment, home);
            await safeDirectory(await safeDirectory(home, "SpecKitCanvas"), "scaffolding");
            const record: StoredJob = { schemaVersion: 1, kind: "sdd-organization-scaffolding", workspacePath, pid: process.pid,
                requests: [...(saved?.requests ?? []).slice(-63), requestId],
                job: { id: randomBytes(16).toString("hex"), requestId, status: "running", startedAt: now(), steps: initialSteps(), artifacts: [] } };
            const lock = await acquireSetupLock(home, ["SpecKitCanvas", "scaffolding", `${key}.lock`], record.job.id);
            const active: ActiveJob = { record, controller: new AbortController(), completion: Promise.resolve(),
                listeners: new Set([...(activeJobs.get(workspacePath)?.listeners ?? []), listener]) };
            automaticStartError = null;
            activeJobs.set(workspacePath, active);
            const secrets: string[] = [];
            let saving = Promise.resolve();
            const publish = () => {
                const copy = structuredClone(record);
                const auth = copy.job.steps.find(step => step.id === "authentication");
                if (auth?.status === "waiting") auth.detail = "Complete organization authentication in the system browser.";
                else if (auth?.detail) auth.detail = auth.detail.replace(/\b[A-Z0-9]{4}-[A-Z0-9]{4}\b/g, "[device code omitted]");
                if (copy.job.message) copy.job.message = copy.job.message.replace(/\b[A-Z0-9]{4}-[A-Z0-9]{4}\b/g, "[device code omitted]");
                saving = saving.then(() => atomicWrite(recordPath, `${JSON.stringify(copy)}\n`));
                return saving.then(() => { for (const notify of active.listeners) notify(); });
            };
            try { await publish(); }
            catch (error) { activeJobs.delete(workspacePath); await lock.close(); await unlink(lockPath); throw error; }
            const admittedIdentity = current.identity!;
            const guard = async (mutation = false) => {
                if (active.controller.signal.aborted) throw new RepositoryError("scaffolding_cancelled");
                const latest = await context(mutation);
                if (!sameIdentity(admittedIdentity, latest.identity)) throw new RepositoryError("local_context_mismatch");
                if (mutation) await verifyManagedPaths(workspacePath);
            };
            const update = async (id: string, status: SetupProgress, detail?: string, command?: string) => {
                const step = record.job.steps.find(step => step.id === id)!;
                step.status = status; step.detail = detail; step.command = command ?? step.command;
                await publish();
            };
            const runner = options.runner ?? runSetupCommand;
            const find = options.findExecutable ?? (tool => findSetupExecutable(tool, workspacePath, {
                environment: { ...(options.environment ?? process.env), PATH: env.PATH }, homeDirectory: home, platform: options.platform,
            }));
            const platform = options.platform ?? process.platform;
            const execute = (executable: string, args: string[], extra: Partial<Parameters<SetupCommandRunner>[0]> = {}) =>
                runner({ executable, args, cwd: workspacePath, env, signal: active.controller.signal, timeoutMs: 120_000, secrets, ...extra });
            const successful = (result: SetupCommandResult, fallback = "The setup command failed.") => {
                if (result.exitCode !== 0) throw new Error(redactSetupOutput(result.stderr || result.stdout || fallback, secrets).trim().slice(-2000));
                return result.stdout;
            };
            let plan: OrganizationSetupPlan | undefined;
            let gh: string | undefined;
            let specify: string | undefined;
            let token = "";
            const step = async (id: string, run: () => Promise<void>, mutation = false) => {
                await guard(mutation);
                await update(id, "loading");
                await run();
                await guard();
                if (record.job.steps.find(step => step.id === id)?.status === "loading") await update(id, "completed");
            };
            active.completion = (async () => {
                try {
                    await step("github-cli", async () => {
                        gh = await find("gh");
                        if (gh) { await update("github-cli", "skipped", "An installed GitHub CLI is available."); return; }
                        const winget = platform === "win32" ? await find("winget") : undefined;
                        if (!winget) throw new RepositoryError("scaffolding_prerequisite_missing");
                        await update("github-cli", "loading", "Installing GitHub CLI with Windows Package Manager.", "winget install --id GitHub.cli --exact");
                        successful(await execute(winget, ["install", "--id", "GitHub.cli", "--exact", "--source", "winget",
                            "--accept-package-agreements", "--accept-source-agreements", "--silent", "--disable-interactivity"], { cwd: home, timeoutMs: 600_000 }));
                        gh = await find("gh");
                        if (!gh) throw new RepositoryError("scaffolding_prerequisite_missing");
                    }, true);
                    await step("authentication", async () => {
                        const status = await execute(gh!, ["auth", "status", "--hostname", ORGANIZATION_SETUP.hostname], { cwd: home });
                        if (status.exitCode !== 0) {
                            let loginOutput = "";
                            record.job.status = "waiting";
                            await update("authentication", "waiting", "Complete organization sign-in in the browser. MFA or consent may be required.",
                                `gh auth login --hostname ${ORGANIZATION_SETUP.hostname} --web --git-protocol https`);
                            const result = await execute(gh!, ["auth", "login", "--hostname", ORGANIZATION_SETUP.hostname, "--web", "--git-protocol", "https"],
                                { cwd: home, input: "\n", timeoutMs: 900_000, onOutput: text => {
                                    loginOutput = (loginOutput + text).slice(-4096);
                                    const code = /\b[A-Z0-9]{4}-[A-Z0-9]{4}\b/.exec(loginOutput)?.[0];
                                    if (code) {
                                        const auth = record.job.steps.find(step => step.id === "authentication")!;
                                        auth.detail = `Open https://${ORGANIZATION_SETUP.hostname}/login/device and enter ${code}. Complete browser sign-in.`;
                                        for (const notify of active.listeners) notify();
                                    }
                                } });
                            successful(result);
                            record.job.status = "running";
                        }
                        successful(await execute(gh!, ["auth", "status", "--hostname", ORGANIZATION_SETUP.hostname], { cwd: home }));
                        const result = await execute(gh!, ["auth", "token", "--hostname", ORGANIZATION_SETUP.hostname], { cwd: home, sensitive: true });
                        if (result.exitCode !== 0) throw new RepositoryError("scaffolding_auth_failed");
                        token = result.stdout.trim();
                        if (!token || token.length > 4096 || /\s/.test(token)) throw new RepositoryError("scaffolding_auth_failed");
                        secrets.push(token);
                        await update("authentication", "completed", "Organization authentication verified. Credentials remain in GitHub CLI's credential store.");
                    });
                    await step("registry-auth", () => configureRegistryAuthentication(home), true);
                    await step("registry", async () => {
                        const contents = async (path: string) => successful(await execute(gh!, ["api", "--hostname", ORGANIZATION_SETUP.hostname,
                            `repos/${ORGANIZATION_SETUP.repository}/contents/${path}`, "-H", "Accept: application/vnd.github.raw+json"], { cwd: home }));
                        const workflow = await contents("workflows/bootstrap/workflow.yml");
                        const catalog = await contents("bundles.catalog.json");
                        const manifest = await contents(`bundles/${ORGANIZATION_SETUP.bundleId}/bundle.yml`);
                        plan = parseOrganizationSetup(workflow, manifest, catalog);
                        record.job.artifacts = plan.artifacts;
                        record.job.bundleVersion = plan.version;
                        await update("registry", "completed", `${ORGANIZATION_SETUP.bundleName} ${plan.version}: ${plan.artifacts.length} components; Spec Kit >= ${plan.minimumVersion}.`);
                    });
                    await step("specify-cli", async () => {
                        specify = await find("specify");
                        if (specify) {
                            const check = await execute(specify, ["--version"]);
                            const installed = /(?<!\d)(\d+\.\d+\.\d+)(?!\d)/.exec(check.stdout)?.[1];
                            if (check.exitCode === 0 && installed && versionAtLeast(installed, plan!.minimumVersion)) {
                                await update("specify-cli", "skipped", `Spec Kit ${installed} meets the registry requirement.`); return;
                            }
                        }
                        let uv = await find("uv");
                        const pipx = uv ? undefined : await find("pipx");
                        if (!uv && !pipx && platform === "win32") {
                            const winget = await find("winget");
                            if (winget) {
                                successful(await execute(winget, ["install", "--id", "astral-sh.uv", "--exact", "--source", "winget", "--scope", "user",
                                    "--accept-package-agreements", "--accept-source-agreements", "--silent", "--disable-interactivity"], { cwd: home, timeoutMs: 600_000 }));
                                uv = await find("uv");
                            }
                        }
                        if (!uv && !pipx) throw new RepositoryError("scaffolding_prerequisite_missing");
                        const args = uv ? ["tool", "install", "--upgrade", "--force", "specify-cli"] : ["install", "--force", "specify-cli"];
                        await update("specify-cli", "loading", "Installing the latest Specify CLI from PyPI using the organization package index.",
                            `${uv ? "uv" : "pipx"} ${args.join(" ")}`);
                        successful(await execute((uv ?? pipx)!, args, { cwd: home, timeoutMs: 600_000 }));
                        specify = await find("specify");
                        if (!specify) throw new RepositoryError("scaffolding_prerequisite_missing");
                        let installed = /(?<!\d)(\d+\.\d+\.\d+)(?!\d)/.exec(successful(await execute(specify, ["--version"])))?.[1];
                        if (installed && !versionAtLeast(installed, plan!.minimumVersion)) {
                            await guard(true);
                            await update("specify-cli", "loading",
                                `The organization mirror supplied ${installed}, below ${plan!.minimumVersion}. Installing the latest official PyPI release instead.`,
                                `${uv ? "UV_DEFAULT_INDEX" : "PIP_INDEX_URL"}=https://pypi.org/simple/ ${uv ? "uv" : "pipx"} ${args.join(" ")}`);
                            successful(await execute((uv ?? pipx)!, args, { cwd: home, timeoutMs: 600_000,
                                env: { ...env, UV_DEFAULT_INDEX: "https://pypi.org/simple/", PIP_INDEX_URL: "https://pypi.org/simple/" } }));
                            specify = await find("specify");
                            if (!specify) throw new RepositoryError("scaffolding_prerequisite_missing");
                            installed = /(?<!\d)(\d+\.\d+\.\d+)(?!\d)/.exec(successful(await execute(specify, ["--version"])))?.[1];
                        }
                        if (!installed || !versionAtLeast(installed, plan!.minimumVersion)) throw new RepositoryError("scaffolding_version_unsupported");
                        await update("specify-cli", "completed", `Spec Kit ${installed} is ready.`);
                    }, true);
                    const specifyCommand = async (id: string, args: string[], timeoutMs = 120_000, onOutput?: (text: string) => void) => {
                        await update(id, "loading", undefined, `specify ${args.map(arg => /\s/.test(arg) ? JSON.stringify(arg) : arg).join(" ")}`);
                        return successful(await execute(specify!, args, { env: { ...env, GH_ENTERPRISE_TOKEN: token }, timeoutMs, onOutput }));
                    };
                    await step("initialize", async () => {
                        if (!options.setupRequired()) { await update("initialize", "skipped", "Core Copilot skills are already initialized; existing artifacts were retained."); return; }
                        await specifyCommand("initialize", ["init", "--here", "--force", "--integration", "copilot", "--integration-options=--skills",
                            "--script", platform === "win32" ? "ps" : "sh", "--ignore-agent-tools"]);
                        if (options.setupRequired()) throw new RepositoryError("scaffolding_verification_failed");
                    }, true);
                    for (const catalog of CATALOGS) await step(catalog.id, async () => {
                        const content = await safeRead(workspacePath, [".specify", catalog.file]);
                        const configuration = content === null ? {} : yamlObject(content);
                        if (configuration.catalogs !== undefined && !Array.isArray(configuration.catalogs)) throw new RepositoryError("scaffolding_storage_invalid");
                        const entries = (Array.isArray(configuration.catalogs) ? configuration.catalogs : []).map(object);
                        if (entries.some(entry => !entry)) throw new RepositoryError("scaffolding_storage_invalid");
                        const match = entries.find(entry => entry?.url === catalogUrl(catalog.source));
                        if (match) {
                            if (catalog.group === "bundle" ? match.install_policy !== "install-allowed" :
                                catalog.group !== "workflow" && match.install_allowed !== true) throw new RepositoryError("scaffolding_catalog_conflict");
                            await update(catalog.id, "skipped", "The organization catalog is already registered; existing configuration was retained."); return;
                        }
                        if (entries.some(entry => entry?.name === catalog.name || entry?.id === catalog.name)) throw new RepositoryError("scaffolding_catalog_conflict");
                        const args: string[] = [catalog.group, "catalog", "add", catalogUrl(catalog.source)];
                        if (catalog.group === "bundle") args.push("--id", catalog.name, "--priority", "1", "--policy", "install-allowed");
                        else if (catalog.group === "workflow") args.push("--name", catalog.name);
                        else args.push("--name", catalog.name, "--priority", "1", "--install-allowed");
                        await specifyCommand(catalog.id, args);
                        const written = await safeRead(workspacePath, [".specify", catalog.file]);
                        const registered = written === null ? [] : yamlObject(written).catalogs;
                        if (!Array.isArray(registered) || !registered.some(entry => object(entry)?.url === catalogUrl(catalog.source))) {
                            throw new RepositoryError("scaffolding_verification_failed");
                        }
                    }, true);
                    await step("bundle", async () => {
                        for (const artifact of record.job.artifacts) {
                            artifact.status = await installedArtifact(workspacePath, artifact) ? "skipped" : "loading";
                            artifact.detail = artifact.status === "skipped" ? "Already installed and verified." : "Waiting for the bundle installer.";
                        }
                        await publish();
                        let checking: Promise<void> | undefined;
                        let progressError: unknown;
                        const refresh = async () => {
                            let changed = false;
                            for (const artifact of record.job.artifacts) if (artifact.status === "loading" && await installedArtifact(workspacePath, artifact, true)) {
                                artifact.status = "completed"; artifact.detail = "Installed manifest and registry verified."; changed = true;
                            }
                            if (changed) await publish();
                        };
                        const timer = setInterval(() => {
                            if (!checking) checking = refresh().catch(error => { progressError = error; }).finally(() => { checking = undefined; });
                        }, 500);
                        try {
                            await specifyCommand("bundle", ["bundle", "install", ORGANIZATION_SETUP.bundleId], 600_000);
                            if (checking) await checking;
                            if (progressError) throw progressError;
                            await verifyOrganizationArtifacts(workspacePath, plan!);
                            await refresh();
                        } finally { clearInterval(timer); if (checking) await checking; }
                    }, true);
                    await step("verify", async () => {
                        if (options.setupRequired()) throw new RepositoryError("scaffolding_verification_failed");
                        await verifyOrganizationArtifacts(workspacePath, plan!);
                        for (const artifact of record.job.artifacts) {
                            if (!await installedArtifact(workspacePath, artifact)) throw new RepositoryError("scaffolding_verification_failed");
                            if (artifact.status !== "skipped") artifact.status = "completed";
                        }
                        await publish();
                    });
                    await step("skills", async () => {
                        const diagnostics = await reloadSetupSkills(options.reloadSkills, active.controller.signal);
                        if (diagnostics.errors.length) throw new Error(redactSetupOutput(diagnostics.errors.join("\n"), secrets).slice(0, 2000));
                        await update("skills", "completed", diagnostics.warnings.length ?
                            `Session skills reloaded with ${diagnostics.warnings.length} warning(s).` : "Session skills reloaded. The original Spec Kit canvas is ready.");
                    }, true);
                    record.job.status = "completed"; record.job.finishedAt = now();
                    record.job.message = "Organization setup is complete. Opening the original Spec Kit canvas.";
                    await publish();
                } catch (error) {
                    const cancelled = active.controller.signal.aborted || error instanceof SetupCommandError && error.reason === "cancelled";
                    record.job.status = cancelled ? "cancelled" : "error"; record.job.finishedAt = now();
                    const code = knownRepositoryError(object(error)?.code).code;
                    record.job.errorCode = cancelled ? "scaffolding_cancelled" : error instanceof RepositoryError ? error.code :
                        code === "upstream_unavailable" ? "scaffolding_failed" : code;
                    record.job.message = cancelled ? "Setup cancelled. Completed artifacts were retained; retry is explicit." :
                        redactSetupOutput(error instanceof Error ? error.message : "The setup command failed.", secrets).slice(0, 2000);
                    if (!record.job.steps.some(item => ["loading", "waiting"].includes(item.status))) {
                        const blocked = record.job.steps.find(item => item.status === "pending");
                        if (blocked) blocked.status = "loading";
                    }
                    for (const item of record.job.steps) if (["loading", "waiting"].includes(item.status)) {
                        item.status = cancelled ? "cancelled" : "error"; item.detail = record.job.message;
                    }
                    for (const artifact of record.job.artifacts) {
                        let installed = false;
                        try { installed = await installedArtifact(workspacePath, artifact); }
                        catch (failure) {
                            if (!(failure instanceof RepositoryError)) throw failure;
                            artifact.detail = failure.message;
                        }
                        artifact.status = installed ? "completed" : cancelled ? "cancelled" : "error";
                        artifact.detail ??= installed ? "Installed artifact retained and verified." : "Not installed or rolled back by the bundle installer.";
                    }
                    await publish();
                } finally { token = ""; secrets.length = 0; await lock.close(); await unlink(lockPath); }
            })();
            void active.completion.catch(error => {
                record.job.status = "error"; record.job.errorCode = "scaffolding_storage_invalid";
                record.job.message = "Setup progress could not be saved. No successful completion is claimed.";
                for (const notify of active.listeners) notify();
                console.error(`SDD scaffolding storage failure: ${error instanceof RepositoryError ? error.code : "write_failed"}`);
            });
            return service.state();
        },
        async cancel(jobId: string, requestId: string) {
            if (!identifier(requestId)) throw new RepositoryError("invalid_request");
            await context();
            const active = activeJobs.get(workspacePath);
            if (!active || active.record.job.id !== jobId) throw new RepositoryError("scaffolding_conflict");
            if (["running", "waiting"].includes(active.record.job.status)) active.controller.abort();
            return service.state();
        },
        async continue(requestId: string) {
            if (!identifier(requestId)) throw new RepositoryError("invalid_request");
            await context(true);
            const saved = await readRecord();
            if (!saved || saved.job.status !== "completed" || options.setupRequired() || !saved.job.bundleVersion) throw new RepositoryError("scaffolding_verification_failed");
            await verifyOrganizationArtifacts(workspacePath, { version: saved.job.bundleVersion, minimumVersion: "1.1.0", artifacts: saved.job.artifacts });
            options.onContinue();
            return { renderer: "workflow" as const };
        },
        async settled() { await automaticAdmission; await activeJobs.get(workspacePath)?.completion; },
        dispose() { activeJobs.get(workspacePath)?.listeners.delete(listener); },
    };
    return service;
}

export type ScaffoldingService = Awaited<ReturnType<typeof createScaffoldingService>>;

export async function handleScaffoldingRequest(req: IncomingMessage, res: ServerResponse, url: URL, service: ScaffoldingService) {
    const json = (status: number, payload: unknown) => {
        res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" });
        res.end(JSON.stringify(payload));
    };
    try {
        const route = url.pathname.slice("/api/scaffolding/".length);
        const allowed = route === "state" && req.method === "GET" ? [] :
            req.method === "POST" ? { start: ["contextId", "requestId"], cancel: ["jobId", "requestId"], continue: ["requestId"] }[route] : undefined;
        if (!allowed || [...url.searchParams.keys()].some(key => key !== "cap" || url.searchParams.getAll(key).length !== 1)) throw new RepositoryError("invalid_request");
        let body: Record<string, unknown> = {};
        if (req.method === "POST") {
            if (req.headers.origin !== url.origin || !/^application\/json(?:;|$)/i.test(String(req.headers["content-type"] ?? ""))) throw new RepositoryError("invalid_request");
            const chunks: Buffer[] = [];
            let bytes = 0;
            for await (const chunk of req) { bytes += chunk.length; if (bytes > 4096) throw new RepositoryError("invalid_request"); chunks.push(chunk); }
            const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
            const document = parseDocument(text, { schema: "json", uniqueKeys: true });
            const parsed: unknown = JSON.parse(text);
            if (document.errors.length || !object(parsed)) throw new RepositoryError("invalid_request");
            body = object(parsed)!;
            if (Object.keys(body).some(key => !allowed.includes(key)) || allowed.some(key => typeof body[key] !== "string")) throw new RepositoryError("invalid_request");
        }
        const data = route === "state" ? await service.state() : route === "start" ? await service.start(String(body.contextId), String(body.requestId)) :
            route === "cancel" ? await service.cancel(String(body.jobId), String(body.requestId)) : await service.continue(String(body.requestId));
        json(route === "start" ? 202 : 200, { ok: true, data });
    } catch (error) {
        const failure = error instanceof SyntaxError || error instanceof TypeError ? new RepositoryError("invalid_request") : error;
        const envelope = errorEnvelope(failure);
        json(repositoryErrorStatus(envelope.error.code), envelope);
    }
}
