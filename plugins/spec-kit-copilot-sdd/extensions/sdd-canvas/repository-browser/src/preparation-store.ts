import { constants } from "node:fs";
import { link, lstat, mkdir, open, opendir, realpath, rename, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { parseDocument } from "yaml";
import { knownRepositoryError, RepositoryError } from "./errors.ts";
import type { CanvasReadiness, HandoffAttempt, PreparedRepositoryRecord, WorkspaceActivation } from "./types.ts";

const operationPattern = /^[a-f0-9]{32}$/;
const digestPattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{40}$/;
const repositoryPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const fields = ["schemaVersion", "kind", "operationId", "repositoryId", "originIdentity", "defaultRef", "sourceCommit", "destination",
    "gitCommonDirectory", "branch", "initialWorktreeFingerprint", "profileFingerprint", "accountKey", "createdAt", "completedAt"];

function invalid(): never { throw new RepositoryError("invalid_context"); }
function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
    return value as Record<string, unknown>;
}
function safeText(value: unknown, maximum = 4096): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= maximum && !/[\p{Cc}\p{Cf}]/u.test(value);
}
function namedRef(value: unknown): value is string {
    return safeText(value, 1024) && value.startsWith("refs/heads/") && !/[ ~^:?*\[\\]|\.\.|@\{|\/\//.test(value) &&
        value.split("/").every(part => part && !part.startsWith(".") && !part.endsWith(".") && !part.endsWith(".lock"));
}
function origin(value: unknown, repositoryId: unknown): value is string {
    if (!safeText(value) || !safeText(repositoryId, 64)) return false;
    try {
        const url = new URL(value);
        return url.origin === "https://dev.azure.com" && !url.username && !url.password && !url.search && !url.hash &&
            url.pathname.split("/").length === 5 && url.pathname.endsWith(`/_git/${repositoryId}`);
    } catch { return false; }
}

const activationFields = ["attemptId", "sessionId", "contextRevision", "workingDirectory", "targetKind", "targetBranch"];
function validateActivation(input: unknown, attemptId: string, ready = false) {
    const value = object(input);
    const allowed = ready ? [...activationFields, "providerId", "instanceId"] : activationFields;
    if (Object.keys(value).length !== allowed.length || allowed.some(field => !Object.hasOwn(value, field)) || value.attemptId !== attemptId ||
        !safeText(value.sessionId, 256) || !safeText(value.contextRevision, 256) || !safeText(value.workingDirectory) || !isAbsolute(value.workingDirectory) ||
        !["prepared_checkout", "host_worktree"].includes(String(value.targetKind)) || !namedRef(value.targetBranch) ||
        (ready && (!safeText(value.providerId, 256) || !safeText(value.instanceId, 256)))) return invalid();
    return value as unknown as WorkspaceActivation | CanvasReadiness;
}

function validateAttempt(input: unknown, operationId: string): HandoffAttempt {
    const value = object(input);
    const required = ["attemptId", "operationId", "expectedSource", "instanceId", "status", "createdAt"];
    if (required.some(field => !Object.hasOwn(value, field)) || Object.keys(value).some(field => ![...required, "activation", "result", "errorCode"].includes(field)) ||
        !safeText(value.attemptId, 32) || !operationPattern.test(value.attemptId) || value.operationId !== operationId || !safeText(value.instanceId, 256) ||
        !["requested", "in_progress", "workspace_activated", "canvas_ready", "rejected", "unknown"].includes(String(value.status)) ||
        !Number.isSafeInteger(value.createdAt) || Number(value.createdAt) < 0 ||
        (value.errorCode !== undefined && knownRepositoryError(value.errorCode).code !== value.errorCode)) return invalid();
    const source = object(value.expectedSource);
    if (Object.keys(source).length !== 2 || !safeText(source.sessionId, 256) || !safeText(source.contextRevision, 256)) return invalid();
    if (value.activation !== undefined) validateActivation(value.activation, value.attemptId);
    if (value.result !== undefined) {
        const result = validateActivation(value.result, value.attemptId, true) as CanvasReadiness;
        const activation = object(value.activation);
        if (result.instanceId !== value.instanceId || activationFields.some(field => Reflect.get(result, field) !== activation[field])) return invalid();
    }
    if (["workspace_activated", "canvas_ready"].includes(String(value.status)) && !value.activation) return invalid();
    if ((value.status === "canvas_ready") !== Boolean(value.result)) return invalid();
    return structuredClone(value) as unknown as HandoffAttempt;
}

async function regularPath(path: string, directory: boolean) {
    if (!safeText(path) || !isAbsolute(path)) return invalid();
    const resolved = resolve(path);
    let current = resolved;
    for (;;) {
        const info = await lstat(current);
        if (info.isSymbolicLink() || (current !== resolved || directory ? !info.isDirectory() : !info.isFile())) return invalid();
        if (dirname(current) === current) break;
        current = dirname(current);
    }
    return realpath(resolved);
}

async function boundedJson(path: string, maximum: number) {
    await regularPath(path, false);
    const before = await lstat(path);
    if (before.size > maximum) return invalid();
    const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
        const opened = await handle.stat();
        if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino) return invalid();
        const bytes = Buffer.alloc(maximum + 1);
        let count = 0;
        while (count < bytes.length) {
            const read = await handle.read(bytes, count, bytes.length - count, count);
            if (!read.bytesRead) break;
            count += read.bytesRead;
        }
        const after = await handle.stat();
        if (count > maximum || count !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) return invalid();
        const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, count));
        const value = object(JSON.parse(raw));
        if (parseDocument(raw, { schema: "json", uniqueKeys: true }).errors.length) return invalid();
        return value;
    } finally { await handle.close(); }
}

function validateRecord(input: unknown): PreparedRepositoryRecord {
    const value = object(input);
    if (Object.keys(value).some(field => ![...fields, "handoff", "acceptedTarget"].includes(field)) || fields.some(field => !Object.hasOwn(value, field))) return invalid();
    if (value.schemaVersion !== 2 || value.kind !== "sdd-prepared-repository" || !safeText(value.operationId, 32) || !operationPattern.test(value.operationId) ||
        !safeText(value.repositoryId, 36) || !repositoryPattern.test(value.repositoryId) || !origin(value.originIdentity, value.repositoryId) ||
        !safeText(value.sourceCommit, 40) || !commitPattern.test(value.sourceCommit) || !namedRef(value.defaultRef) ||
        value.branch !== `refs/heads/speckit/canvas-${value.operationId}` ||
        ![value.initialWorktreeFingerprint, value.profileFingerprint, value.accountKey].every(item => safeText(item, 64) && digestPattern.test(item)) ||
        ![value.createdAt, value.completedAt].every(time => Number.isSafeInteger(time) && Number(time) >= 0) || Number(value.completedAt) < Number(value.createdAt) ||
        !safeText(value.destination) || !safeText(value.gitCommonDirectory)) return invalid();
    const handoff = value.handoff === undefined ? undefined : validateAttempt(value.handoff, value.operationId);
    if (handoff && handoff.createdAt < Number(value.completedAt)) return invalid();
    if ((handoff?.status === "canvas_ready") !== Boolean(value.acceptedTarget)) return invalid();
    if (value.acceptedTarget !== undefined && JSON.stringify(value.acceptedTarget) !== JSON.stringify(handoff?.result)) return invalid();
    if (Buffer.byteLength(JSON.stringify(value)) > 8192) return invalid();
    return structuredClone(value) as unknown as PreparedRepositoryRecord;
}

export function createPreparationStore({ homeDirectory = homedir() }: { homeDirectory?: string } = {}) {
    async function home() { return regularPath(homeDirectory, true); }
    async function directory(create = false) {
        let path = await home();
        for (const name of [".speckit-canvas", "preparations"]) {
            path = join(path, name);
            if (create) {
                try { await mkdir(path, { mode: 0o700 }); }
                catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
            }
            await regularPath(path, true);
        }
        return path;
    }
    async function ownership(operationId: string, destination: string, gitCommonDirectory: string) {
        const root = join(await home(), "SpecKitCanvas", "repositories", operationId);
        if (destination !== join(root, "checkout") || gitCommonDirectory !== join(destination, ".git")) return invalid();
        if (await regularPath(destination, true) !== destination || await regularPath(gitCommonDirectory, true) !== gitCommonDirectory) return invalid();
        const marker = await boundedJson(join(root, ".sdd-clone-owner.json"), 1024);
        if (Object.keys(marker).length !== 2 || marker.kind !== "sdd-repository-clone" || marker.operationId !== operationId) return invalid();
    }
    async function read(operationId: string) {
        if (!operationPattern.test(operationId)) return invalid();
        try {
            const record = validateRecord(await boundedJson(join(await directory(), `${operationId}.json`), 8192));
            if (record.operationId !== operationId) return invalid();
            await ownership(record.operationId, record.destination, record.gitCommonDirectory);
            return record;
        } catch { return invalid(); }
    }
    async function change(operationId: string, update: (record: PreparedRepositoryRecord) => PreparedRepositoryRecord) {
        if (!operationPattern.test(operationId)) return invalid();
        const parent = await directory();
        const lockPath = join(parent, `.${operationId}.lock`);
        const lock = await open(lockPath, "wx", 0o600).catch(error => {
            if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new RepositoryError("handoff_in_progress");
            return invalid();
        });
        let temporary: string | undefined;
        try {
            const previous = await read(operationId);
            const next = validateRecord(update(structuredClone(previous)));
            if (fields.some(field => Reflect.get(next, field) !== Reflect.get(previous, field))) return invalid();
            if (JSON.stringify(next) === JSON.stringify(previous)) return previous;
            temporary = join(parent, `.${operationId}-${randomBytes(12).toString("hex")}.tmp`);
            const handle = await open(temporary, "wx", 0o600);
            try { await handle.writeFile(JSON.stringify(next)); await handle.sync(); }
            finally { await handle.close(); }
            await regularPath(parent, true);
            if (JSON.stringify(await read(operationId)) !== JSON.stringify(previous)) throw new RepositoryError("handoff_in_progress");
            await rename(temporary, join(parent, `${operationId}.json`)); temporary = undefined;
            return next;
        } catch (error) { if (error instanceof RepositoryError) throw error; return invalid(); }
        finally {
            if (temporary) await unlink(temporary).catch(() => undefined);
            await lock.close(); await unlink(lockPath).catch(() => undefined);
        }
    }
    const store = {
        read,
        async verifyOwnership(input: PreparedRepositoryRecord) {
            try {
                const record = validateRecord(input);
                await ownership(record.operationId, record.destination, record.gitCommonDirectory);
                return record;
            } catch { return invalid(); }
        },
        async beginAttempt(operationId: string, input: HandoffAttempt) {
            const attempt = validateAttempt(input, operationId);
            if (attempt.status !== "requested" || attempt.activation || attempt.result || attempt.errorCode) return invalid();
            return change(operationId, record => {
                if (record.handoff?.attemptId === attempt.attemptId) {
                    if (["operationId", "instanceId", "createdAt"].some(field => Reflect.get(record.handoff!, field) !== Reflect.get(attempt, field)) ||
                        JSON.stringify(record.handoff.expectedSource) !== JSON.stringify(attempt.expectedSource)) return invalid();
                    return record;
                }
                if (record.acceptedTarget || (record.handoff && (record.handoff.status !== "rejected" || record.handoff.activation))) throw new RepositoryError("handoff_in_progress");
                return { ...record, handoff: attempt };
            });
        },
        async updateAttempt(operationId: string, input: HandoffAttempt) {
            const incoming = validateAttempt(input, operationId);
            return change(operationId, record => {
                const previous = record.handoff;
                if (!previous || ["attemptId", "operationId", "instanceId", "createdAt"].some(field => Reflect.get(incoming, field) !== Reflect.get(previous, field)) ||
                    JSON.stringify(incoming.expectedSource) !== JSON.stringify(previous.expectedSource)) return invalid();
                if (previous.status === "canvas_ready") {
                    if (incoming.status !== "canvas_ready" || JSON.stringify(incoming.result) !== JSON.stringify(previous.result)) return invalid();
                    return record;
                }
                if (incoming.status === "requested") return invalid();
                if (incoming.status === "canvas_ready" && !previous.activation) return invalid();
                if (previous.activation && incoming.activation && JSON.stringify(previous.activation) !== JSON.stringify(incoming.activation)) return invalid();
                if (previous.activation && incoming.status === "rejected") return invalid();
                const next: HandoffAttempt = { ...incoming, ...(previous.activation ? { activation: previous.activation } : {}) };
                if (previous.activation && ["unknown", "in_progress"].includes(next.status)) next.status = "workspace_activated";
                if (next.status === "canvas_ready") delete next.errorCode;
                return { ...record, handoff: next, ...(next.result ? { acceptedTarget: next.result } : {}) };
            });
        },
        async write(input: PreparedRepositoryRecord) {
            let temporary: string | undefined;
            try {
                const record = validateRecord(input);
                if (record.handoff || record.acceptedTarget) return invalid();
                await ownership(record.operationId, record.destination, record.gitCommonDirectory);
                const parent = await directory(true);
                const filename = join(parent, `${record.operationId}.json`);
                try {
                    await lstat(filename);
                    if (JSON.stringify(await read(record.operationId)) !== JSON.stringify(record)) return invalid();
                    return;
                } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
                temporary = join(parent, `.${record.operationId}-${randomBytes(12).toString("hex")}.tmp`);
                const handle = await open(temporary, "wx", 0o600);
                try { await handle.writeFile(JSON.stringify(record)); await handle.sync(); }
                finally { await handle.close(); }
                await regularPath(parent, true);
                try { await link(temporary, filename); }
                catch (error) {
                    if ((error as NodeJS.ErrnoException).code !== "EEXIST" || JSON.stringify(await read(record.operationId)) !== JSON.stringify(record)) throw error;
                }
            } catch { return invalid(); }
            finally { if (temporary) await unlink(temporary).catch(() => undefined); }
        },
        async list() {
            const items: Array<{ operationId: string; destination: string; legacy: boolean; actionable: boolean; record?: PreparedRepositoryRecord }> = [];
            let inspected = 0;
            let hasMore = false;
            try {
                const parent = await directory();
                for await (const entry of await opendir(parent)) {
                    if (inspected >= 256) { hasMore = true; break; }
                    inspected++;
                    if (!/^[a-f0-9]{32}\.json$/.test(entry.name) || !entry.isFile() || entry.isSymbolicLink()) continue;
                    const operationId = entry.name.slice(0, -5);
                    try {
                        const input = await boundedJson(join(parent, entry.name), 8192);
                        if (input.schemaVersion === 2) {
                            const record = await read(operationId);
                            items.push({ operationId, destination: record.destination, legacy: false, actionable: false, record });
                        } else if (input.schemaVersion === 1) {
                            const legacy = await boundedJson(join(parent, entry.name), 4096);
                            const legacyFields = ["schemaVersion", "operationId", "kind", "gitDirectory", "checkout", "remote", "repositoryId", "initialCommit", "initialBranch", "createdAt"];
                            if (Object.keys(legacy).length !== legacyFields.length || legacyFields.some(field => !Object.hasOwn(legacy, field)) ||
                                legacy.operationId !== operationId || legacy.kind !== "sdd-prepared-repository" || !origin(legacy.remote, legacy.repositoryId) ||
                                !safeText(legacy.initialCommit, 40) || !commitPattern.test(legacy.initialCommit) || legacy.initialBranch !== `speckit/canvas-${operationId}` ||
                                !safeText(legacy.createdAt, 64) || !Number.isFinite(Date.parse(legacy.createdAt)) || !safeText(legacy.checkout) || !safeText(legacy.gitDirectory)) continue;
                            await ownership(operationId, legacy.checkout, legacy.gitDirectory);
                            items.push({ operationId, destination: legacy.checkout, legacy: true, actionable: false });
                        }
                    } catch { continue; }
                }
            } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") return invalid(); }
            return { items, inspected, hasMore };
        },
    };
    return store;
}

export type PreparationStore = ReturnType<typeof createPreparationStore>;