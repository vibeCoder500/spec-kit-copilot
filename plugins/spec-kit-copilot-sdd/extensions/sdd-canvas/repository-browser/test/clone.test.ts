import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, realpath, rename, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, isAbsolute, join } from "node:path";
import { mock, test } from "node:test";
import type { RepositoryConnection } from "../src/auth.ts";
import { cloneEnvironment, createCloneService, findGitExecutable, repositoryFolderName, runGit } from "../src/clone.ts";
import * as cloneModule from "../src/clone.ts";
import type { GitExecution } from "../src/clone.ts";
import { parseRepositoryProfile } from "../src/profile.ts";
import type { HostHandoffAdapter, HostWorkspaceSnapshot } from "../src/types.ts";
import { RepositoryError } from "../src/errors.ts";
import { createPreparationStore } from "../src/preparation-store.ts";
import { verifyAppCanvasRepository, verifyPreparedRepository } from "../src/workspace-binding.ts";

const profile = parseRepositoryProfile({ schemaVersion: 1, enabled: true, tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222", organization: "Synthetic", project: "Project" });
const repositoryId = "33333333-3333-4333-8333-333333333333";
const source = { contextId: "context", sourceVersion: "a".repeat(40), generation: 1, repository: { id: repositoryId, name: "Synthetic repository", defaultBranch: "refs/heads/main", operationalState: "active" as const } };

test("Repository folder names retain the exact repo name and reject unsafe or reserved names", () => {
    assert.equal(repositoryFolderName("My Spec-Kit.Repo"), "My Spec-Kit.Repo");
    for (const name of ["../repo", "repo\\child", "repo:stream", "repo.", "repo ", "NUL", "COM1.txt", "a".repeat(32), ""]) {
        assert.throws(() => repositoryFolderName(name), { code: "invalid_repository_name" });
    }
});

test("Real Git clones into the repository-named folder once and reuses dirty local content without Git mutations", async () => {
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-native-reuse-")));
    const seed = join(home, "seed");
    await mkdir(join(seed, ".specify", "memory"), { recursive: true });
    await writeFile(join(seed, ".specify", "memory", "constitution.md"), "# Owned constitution\n");
    const executable = await findGitExecutable(home);
    const git = (args: string[], cwd = seed) => execFileSync(executable, ["-c", "core.autocrlf=false", "-c", "core.hooksPath=",
        "-c", "user.name=Owned Test", "-c", "user.email=owned@example.invalid", ...args],
    { cwd, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }).trim();
    const remote = `https://dev.azure.com/Synthetic/Project/_git/${repositoryId}`;
    const calls: GitExecution[] = [];
    let service: ReturnType<typeof cloneModule.createEntryCloneService> | undefined;
    let blockedRollback: { destination: string; original: string } | undefined;
    try {
        git(["init", "-b", "main"]); git(["add", "."]); git(["commit", "-m", "Owned fixture"]);
        const commit = git(["rev-parse", "HEAD"]);
        const snapshot: HostWorkspaceSnapshot = { sessionId: "source", contextRevision: "source", workingDirectory: home,
            activity: "idle", activityRevision: "idle", capabilityGeneration: "test",
            capabilities: { localCanvas: true, atomicPreparation: true, atomicHandoff: false, targetAcknowledgment: false, handoffReconciliation: false } };
        const host: HostHandoffAdapter = { inspectCurrent: async () => snapshot, admitPreparation: async (_input, start) => start(),
            openCurrentCanvas: async () => assert.fail("Clone does not open canvas"), handoffPrepared: async () => assert.fail("No handoff"),
            getHandoffOutcome: async () => assert.fail("No handoff"), dispose() {} };
        const connection = { snapshot: () => ({ accountLabel: "owned@example.invalid" }), access: async () => ({ accessToken: "synthetic",
            tenantId: profile.tenantId, accountId: "account", connectionId: "connection", generation: 1,
            signal: new AbortController().signal, assertCurrent() {} }) } as unknown as RepositoryConnection;
        service = cloneModule.createEntryCloneService({ host, connection, profile, homeDirectory: home, workspacePath: home, executable,
            readSource: async () => ({ ...source, sourceVersion: commit }),
            runner: async input => {
                calls.push(input);
                if (blockedRollback && input.cwd === blockedRollback.destination && input.args.includes("HEAD")) {
                    await mkdir(blockedRollback.original);
                    await writeFile(join(blockedRollback.original, "collision.txt"), "Preserve rollback collision\n");
                    blockedRollback = undefined;
                    return "b".repeat(40);
                }
                if (input.args.includes("clone")) {
                    const args = [...input.args];
                    args[args.length - 2] = seed;
                    await runGit({ ...input, args: ["-c", "protocol.file.allow=always", ...args] });
                    git(["remote", "set-url", "origin", remote], input.args.at(-1)!);
                    return "";
                }
                return runGit(input);
            } });
        const first = await service.confirm("selection", snapshot);
        assert.equal(basename(first.destination), source.repository.name);
        assert.equal(first.destination, join(home, "SpecKitCanvas", "repositories", source.repository.name));
        await service.start(first.operationId, first.confirmation, "first");
        await service.completion(first.operationId);
        assert.equal(service.status(first.operationId).state, "prepared");
        const store = createPreparationStore({ homeDirectory: home });
        await verifyPreparedRepository({ record: await store.read(first.operationId), homeDirectory: home, executable });
        git(["checkout", "-b", "local-work"], first.destination);
        await writeFile(join(first.destination, "local-committed.txt"), "Local commit\n");
        git(["add", "."], first.destination); git(["commit", "-m", "Local work"], first.destination);
        const localCommit = git(["rev-parse", "HEAD"], first.destination);
        const namedRemote = `https://dev.azure.com/Synthetic/Project/_git/${encodeURIComponent(source.repository.name)}`;
        git(["remote", "set-url", "origin", "https://dev.azure.com/Synthetic/Project/_git/wrong-repository"], first.destination);
        await assert.rejects(service.confirm("selection", snapshot), { code: "existing_repository_conflict" });
        assert.equal(calls.filter(call => call.args.includes("clone")).length, 1);
        assert.equal(git(["rev-parse", "HEAD"], first.destination), localCommit);
        git(["remote", "set-url", "origin", namedRemote], first.destination);
        await writeFile(join(first.destination, "local-notes.txt"), "Uncommitted user content\n");
        const before = git(["status", "--porcelain=v1", "--untracked-files=all"], first.destination);
        const mutations = calls.length;
        const second = await service.confirm("selection", snapshot);
        assert.equal(second.destination, first.destination);
        assert.equal(second.reused, true);
        assert.equal(second.checkoutCommit, localCommit);
        await service.start(second.operationId, second.confirmation, "second");
        await service.completion(second.operationId);
        assert.equal(service.status(second.operationId).state, "prepared");
        assert.equal(calls.filter(call => call.args.includes("clone")).length, 1);
        assert(calls.slice(mutations).every(call => !call.args.some(arg => ["clone", "checkout", "fetch", "reset", "clean"].includes(arg))));
        assert.equal(git(["status", "--porcelain=v1", "--untracked-files=all"], first.destination), before);
        assert.equal(await readFile(join(first.destination, "local-notes.txt"), "utf8"), "Uncommitted user content\n");
        const record = await store.read(second.operationId);
        assert.equal(record.branch, "refs/heads/local-work");
        assert.equal(record.originIdentity, namedRemote);
        await verifyAppCanvasRepository({ record, workspacePath: second.destination, homeDirectory: home, executable });
        assert.equal((await store.list()).items.length, 1);
        const legacyRoot = join(home, "SpecKitCanvas", "repositories", second.operationId);
        const legacyCheckout = join(legacyRoot, "checkout");
        await rename(second.destination, legacyCheckout);
        await writeFile(join(legacyRoot, ".sdd-clone-owner.json"), JSON.stringify({
            kind: "sdd-repository-clone", operationId: second.operationId,
        }));
        await writeFile(join(home, ".speckit-canvas", "preparations", `${second.operationId}.json`),
            JSON.stringify({ ...record, destination: legacyCheckout, gitCommonDirectory: join(legacyCheckout, ".git") }));
        const migration = await service.confirm("selection", snapshot);
        assert.equal(migration.destination, first.destination);
        assert.equal(migration.migrateFrom, legacyCheckout);
        assert.equal(migration.reused, true);
        const holder = process.platform === "win32" ? spawn(process.execPath,
            ["-e", "console.log('ready'); setInterval(() => {}, 1000)"], { cwd: legacyCheckout, stdio: ["ignore", "pipe", "ignore"] }) : undefined;
        if (holder) await new Promise<void>((resolveReady, reject) => { holder.stdout!.once("data", () => resolveReady()); holder.once("error", reject); });
        try {
            await service.start(migration.operationId, migration.confirmation, "migration");
            await service.completion(migration.operationId);
        } finally { holder?.kill(); }
        assert.equal(service.status(migration.operationId).state, "prepared");
        if (holder) assert.equal(await readFile(join(legacyCheckout, "local-notes.txt"), "utf8"), "Uncommitted user content\n");
        else await assert.rejects(readFile(join(legacyCheckout, "local-notes.txt")), { code: "ENOENT" });
        assert.equal(await readFile(join(migration.destination, "local-notes.txt"), "utf8"), "Uncommitted user content\n");
        assert.equal(git(["rev-parse", "HEAD"], migration.destination), localCommit);
        assert.equal(git(["symbolic-ref", "--short", "HEAD"], migration.destination), "local-work");
        assert.equal(git(["status", "--porcelain=v1", "--untracked-files=all"], migration.destination), before);
        assert.equal(calls.filter(call => call.args.includes("clone")).length, 1);
        await verifyAppCanvasRepository({ record: await store.read(migration.operationId),
            workspacePath: migration.destination, homeDirectory: home, executable });
        assert.equal((await store.list()).items.length, 1);
        const changed = await service.confirm("selection", snapshot);
        await writeFile(join(first.destination, "local-notes.txt"), "Changed after review\n");
        await service.start(changed.operationId, changed.confirmation, "changed-after-review");
        await service.completion(changed.operationId);
        assert.equal(service.status(changed.operationId).state, "failed");
        assert.equal(service.status(changed.operationId).error, "clone_identity_changed");
        assert.equal(await readFile(join(first.destination, "local-notes.txt"), "utf8"), "Changed after review\n");
        assert.equal(calls.filter(call => call.args.includes("clone")).length, 1);
        await writeFile(join(first.destination, "local-notes.txt"), "Uncommitted user content\n");
        const requested = await store.requestAppCanvas(migration.operationId, "source");
        await assert.rejects(service.confirm("selection", snapshot), { code: "app_launch_unknown" });
        await store.updateAppLaunch(migration.operationId, requested.appCanvas!.requestId, "failed", "app_launch_failed");
        const rollbackRecord = await store.read(migration.operationId);
        const rollbackRoot = join(home, "SpecKitCanvas", "repositories", migration.operationId);
        const rollbackSource = join(rollbackRoot, "checkout");
        await unlink(join(home, ".speckit-canvas", "preparations", `${second.operationId}.json`));
        await rename(migration.destination, rollbackSource);
        await writeFile(join(rollbackRoot, ".sdd-clone-owner.json"), JSON.stringify({
            kind: "sdd-repository-clone", operationId: migration.operationId,
        }));
        await writeFile(join(home, ".speckit-canvas", "preparations", `${migration.operationId}.json`),
            JSON.stringify({ ...rollbackRecord, destination: rollbackSource, gitCommonDirectory: join(rollbackSource, ".git") }));
        const rollback = await service.confirm("selection", snapshot);
        assert.equal(rollback.migrateFrom, rollbackSource);
        blockedRollback = { destination: rollback.destination, original: rollbackSource };
        await service.start(rollback.operationId, rollback.confirmation, "blocked-rollback");
        await service.completion(rollback.operationId);
        assert.equal(service.status(rollback.operationId).state, "failed");
        assert.equal(service.status(rollback.operationId).error, "clone_migration_recovery_required");
        assert.equal(git(["rev-parse", "HEAD"], rollback.destination), localCommit);
        assert.equal(await readFile(join(rollbackSource, "collision.txt"), "utf8"), "Preserve rollback collision\n");
        assert.equal(calls.filter(call => call.args.includes("clone")).length, 1);
    } finally { service?.dispose(); await service?.settled(); await rm(home, { recursive: true, force: true }); }
});

test("Existing name collisions are preserved and do not trigger a clone", () => entryCloneFixture(async ({ home, service, calls, snapshot }) => {
    const destination = join(home, "SpecKitCanvas", "repositories", source.repository.name);
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, "user.txt"), "Preserve");
    await assert.rejects(service.confirm("context", snapshot()), { code: "existing_repository_conflict" });
    assert.equal(calls.length, 0);
    assert.equal(await readFile(join(destination, "user.txt"), "utf8"), "Preserve");
}));

async function fixture(run: (value: { home: string; service: ReturnType<typeof createCloneService>; calls: GitExecution[]; switchAccount(): void; deny(): void }) => Promise<void>) {
    const home = await mkdtemp(join(tmpdir(), "sdd-clone-test-"));
    let generation = 1;
    let denied = false;
    const calls: GitExecution[] = [];
    const connection = { snapshot: () => ({ accountLabel: "synthetic@example.invalid" }), access: async () => ({ accessToken: "synthetic-secret", tenantId: profile.tenantId, accountId: "account", connectionId: "connection", generation, signal: new AbortController().signal, assertCurrent() {} }) } as unknown as RepositoryConnection;
    const readSource = async () => { if (denied) throw new Error("denied"); return source; };
    const service = createCloneService({ readSource, connection, profile, workspacePath: home, homeDirectory: home, executable: join(home, "trusted-git.exe"), runner: async (input) => {
        calls.push({ ...input, env: { ...input.env } });
        if (input.args.includes("clone")) { await mkdir(join(input.args.at(-1)!, ".git"), { recursive: true }); return ""; }
        if (input.args.includes("get-url")) return `https://dev.azure.com/Synthetic/Project/_git/${repositoryId}`;
        if (input.args.includes("symbolic-ref")) {
            const checkout = [...calls].reverse().find(call => call.cwd === input.cwd && call.args.includes("checkout"))!;
            return checkout.args[checkout.args.indexOf("-b") + 1]!;
        }
        if (input.args.includes("HEAD")) return source.sourceVersion;
        if (input.args.includes("--git-common-dir")) return join(input.cwd, ".git");
        return "";
    } });
    try { await run({ home, service, calls, switchAccount() { generation++; }, deny() { denied = true; } }); }
    finally { service.dispose(); await rm(home, { recursive: true, force: true }); }
}

test("Clone confirmation performs no writes; confirmed clone is idempotent and pinned", () => fixture(async ({ home, service, calls }) => {
    const confirmation = await service.confirm("context");
    assert.equal((await readdir(home)).length, 0);
    assert.equal(calls.length, 0);
    assert(isAbsolute(confirmation.destination));
    await service.start(confirmation.operationId, confirmation.confirmation);
    await service.completion(confirmation.operationId);
    assert.equal(service.status(confirmation.operationId).state, "prepared_for_manual_open");
    await service.start(confirmation.operationId, confirmation.confirmation);
    assert.equal(calls.filter((call) => call.args.includes("clone")).length, 1);
    assert(calls.some((call) => call.args.includes(source.sourceVersion) && call.args.includes("checkout")));
    assert(calls.every((call) => !call.args.join(" ").includes("synthetic-secret")));
    assert(calls.every((call) => call.env.GIT_CONFIG_VALUE_0 === "AUTHORIZATION: bearer synthetic-secret"));
    assert(calls.every((call) => call.args.includes("credential.helper=")));
    const record = await readFile(join(home, ".speckit-canvas/preparations", `${confirmation.operationId}.json`), "utf8");
    assert(!record.includes("synthetic-secret"));
    assert(record.includes(source.sourceVersion));
    service.cancel(confirmation.operationId);
    assert.equal(service.status(confirmation.operationId).state, "prepared_for_manual_open");
}));

test("Clone rejects forged confirmation, changed identity, and revoked source before Git", () => fixture(async ({ service, calls, switchAccount }) => {
    const confirmation = await service.confirm("context");
    await assert.rejects(service.start(confirmation.operationId, "forged"), { code: "clone_conflict" });
    switchAccount();
    await assert.rejects(service.start(confirmation.operationId, confirmation.confirmation), { code: "invalid_context" });
    assert.equal(calls.length, 0);
}));

test("Revocation after confirmation cannot clone and preserves unrelated files", () => fixture(async ({ service, calls, deny, home }) => {
    await mkdir(join(home, "existing-user-checkout"));
    const confirmation = await service.confirm("context");
    deny();
    await service.start(confirmation.operationId, confirmation.confirmation);
    await service.completion(confirmation.operationId);
    assert.equal(service.status(confirmation.operationId).state, "failed");
    assert.equal(calls.length, 0);
    assert((await readdir(home)).includes("existing-user-checkout"));
}));

test("Git child environment strips inherited overrides, credentials, tracing and helper state", () => {
    const env = cloneEnvironment({ token: "synthetic", remote: "https://dev.azure.com/org/project/_git/id", home: "/synthetic", emptyFile: "/synthetic/empty",
        signalEnvironment: { PATH: "/trusted/bin", PATHEXT: ".EXE;.CMD", GITHUB_TOKEN: "do-not-inherit", GIT_ASKPASS: "untrusted", GIT_TRACE: "1", GIT_CONFIG_COUNT: "9", NODE_OPTIONS: "untrusted" } });
    assert.equal(env.PATH, "/trusted/bin");
    assert.equal(env.GITHUB_TOKEN, undefined);
    assert.equal(env.GIT_ASKPASS, undefined);
    assert.equal(env.GIT_TRACE, undefined);
    assert.equal(env.NODE_OPTIONS, undefined);
    assert.equal(env.GIT_CONFIG_COUNT, "1");
    assert.equal(env.GIT_TERMINAL_PROMPT, "0");
    assert.equal(env.GIT_CONFIG_NOSYSTEM, "1");
});

test("Native process adapter waits for cancellation and rejects oversized output without disclosing it", async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(runGit({ executable: process.execPath, args: [], cwd: process.cwd(), env: {}, signal: controller.signal }), { code: "clone_cancelled" });
    await assert.rejects(runGit({ executable: process.execPath, args: ["-e", "process.stdout.write('x'.repeat(1048577))"], cwd: process.cwd(), env: { SystemRoot: process.env.SystemRoot }, signal: new AbortController().signal }), { code: "clone_conflict" });
});

async function entryCloneFixture(run: (fixture: {
    service: ReturnType<typeof cloneModule.createEntryCloneService>;
    home: string; snapshot: () => HostWorkspaceSnapshot; calls: GitExecution[];
    changeContext(): void; changeSource(): void; changeAccount(): void; expire(): void; raceBusy(): void;
    changeCapabilities(): void; setBusy(): void; setUnknown(): void; holdClone(): void; cloning: Promise<void>;
}) => Promise<void>) {
    const createEntryClone = Reflect.get(cloneModule, "createEntryCloneService");
    assert.equal(typeof createEntryClone, "function");
    const home = await realpath(await mkdtemp(join(tmpdir(), "sdd-entry-clone-")));
    let generation = 1;
    let context = "first";
    let revision = "a".repeat(40);
    let time = 1000;
    let busyRace = false;
    let capabilityGeneration = "approved-test-capability";
    let activity: HostWorkspaceSnapshot["activity"] = "idle";
    let held = false;
    let beganClone: () => void = () => undefined;
    const cloning = new Promise<void>(resolve => { beganClone = resolve; });
    const calls: GitExecution[] = [];
    const snapshot = (): HostWorkspaceSnapshot => ({ sessionId: "owned", contextRevision: context, workingDirectory: home,
        activity, activityRevision: "first", capabilityGeneration,
        capabilities: { localCanvas: true, atomicPreparation: true, atomicHandoff: true, targetAcknowledgment: true, handoffReconciliation: true } });
    const host: HostHandoffAdapter = {
        inspectCurrent: async () => snapshot(),
        openCurrentCanvas: async () => assert.fail("Clone preparation cannot open a canvas"),
        admitPreparation: async (input, start) => {
            if (busyRace) throw new RepositoryError("session_busy");
            assert.equal(input.expectedSource.contextRevision, context);
            return start();
        },
        handoffPrepared: async () => assert.fail("Clone primitive cannot switch sessions"),
        getHandoffOutcome: async () => assert.fail("Clone primitive cannot query handoffs"), dispose() {},
    };
    const connection = { snapshot: () => ({ accountLabel: "synthetic@example.invalid" }), access: async () => ({ accessToken: "synthetic-secret",
        tenantId: profile.tenantId, accountId: "synthetic-account", connectionId: "connected", generation,
        signal: new AbortController().signal, assertCurrent() {} }) } as unknown as RepositoryConnection;
    const service = createEntryClone({ host, connection, profile, workspacePath: home, homeDirectory: home, now: () => time,
        readSource: async () => ({ sourceVersion: revision, generation, repository: { ...source.repository } }), executable: join(home, "trusted-git"),
        runner: async (input: GitExecution) => {
            calls.push({ ...input, env: { ...input.env } });
            if (input.args.includes("clone")) {
                await mkdir(join(input.args.at(-1)!, ".git"), { recursive: true }); beganClone();
                if (held) await new Promise<void>((_resolve, reject) => {
                    const cancel = () => reject(new RepositoryError("clone_cancelled"));
                    if (input.signal.aborted) cancel(); else input.signal.addEventListener("abort", cancel, { once: true });
                });
                return "";
            }
            if (input.args.includes("get-url")) return `https://dev.azure.com/Synthetic/Project/_git/${repositoryId}`;
            if (input.args.includes("symbolic-ref")) {
                const checkout = [...calls].reverse().find(call => call.cwd === input.cwd && call.args.includes("checkout"))!;
                return checkout.args[checkout.args.indexOf("-b") + 1]!;
            }
            if (input.args.includes("--git-common-dir")) return join(input.cwd, ".git");
            if (input.args.includes("HEAD")) return revision;
            return "";
        },
    });
    try { await run({ service, home, snapshot, calls,
        changeContext() { context = "changed"; }, changeSource() { revision = "b".repeat(40); },
        changeAccount() { generation++; }, expire() { time += 120_001; }, raceBusy() { busyRace = true; },
        changeCapabilities() { capabilityGeneration = "changed"; }, setBusy() { activity = "busy"; }, setUnknown() { activity = "unknown"; },
        holdClone() { held = true; }, cloning }); }
    finally { service.dispose(); await service.settled(); await rm(home, { recursive: true, force: true }); }
}

test("Entry clone consumes one context-bound consent and persists credential-free version two completion", () => entryCloneFixture(async ({ service, home, snapshot, calls }) => {
    const consent = await service.confirm("selection", snapshot());
    assert.deepEqual(await readdir(home), []);
    await service.start(consent.operationId, consent.confirmation, "explicit-request");
    await service.completion(consent.operationId);
    assert.equal(service.status(consent.operationId).state, "prepared");
    await service.start(consent.operationId, consent.confirmation, "explicit-request");
    assert.equal(calls.filter(call => call.args.includes("clone")).length, 1);
    const raw = await readFile(join(home, ".speckit-canvas", "preparations", `${consent.operationId}.json`), "utf8");
    assert.equal(JSON.parse(raw).schemaVersion, 2);
    assert.doesNotMatch(raw, /synthetic-secret|confirmation|accessToken/);
    assert.ok(calls.every(call => !call.args.join(" ").includes("synthetic-secret")));
}));

for (const mutation of ["changeContext", "changeSource", "changeAccount", "expire", "raceBusy", "changeCapabilities", "setBusy", "setUnknown"] as const) {
    test(`Entry clone rejects ${mutation} before any directory or Git mutation`, () => entryCloneFixture(async (fixture) => {
        const consent = await fixture.service.confirm("selection", fixture.snapshot());
        fixture[mutation]();
        await assert.rejects(fixture.service.start(consent.operationId, consent.confirmation, "blocked-request"));
        assert.equal(fixture.calls.length, 0);
        assert.deepEqual(await readdir(fixture.home), []);
    }));
}

test("Entry clone preserves an occupied destination and cancels only its incomplete stage", async () => {
    await entryCloneFixture(async ({ service, snapshot, calls }) => {
        const consent = await service.confirm("selection", snapshot());
        await mkdir(consent.destination, { recursive: true });
        const sentinel = join(consent.destination, "user-file.txt");
        await writeFile(sentinel, "preserve");
        await service.start(consent.operationId, consent.confirmation, "occupied");
        await service.completion(consent.operationId);
        assert.equal(service.status(consent.operationId).error, "existing_repository_conflict");
        assert.equal(calls.length, 0);
        assert.equal(await readFile(sentinel, "utf8"), "preserve");
    });
    await entryCloneFixture(async ({ service, home, snapshot, holdClone, cloning }) => {
        const consent = await service.confirm("selection", snapshot());
        holdClone();
        await service.start(consent.operationId, consent.confirmation, "cancelled");
        await cloning;
        service.cancel(consent.operationId);
        await service.completion(consent.operationId);
        assert.equal(service.status(consent.operationId).state, "cancelled");
        assert.deepEqual(await readdir(join(home, "SpecKitCanvas", "repositories")), []);
    });
});

test("Completed entry preparation survives invalidation and coordinator disposal", () => entryCloneFixture(async ({ service, home, snapshot }) => {
    const consent = await service.confirm("selection", snapshot());
    await service.start(consent.operationId, consent.confirmation, "durable-request");
    await service.completion(consent.operationId);
    service.invalidate();
    service.cancel(consent.operationId);
    assert.equal(service.status(consent.operationId).state, "prepared");
    service.dispose();
    await service.settled();
    const record = JSON.parse(await readFile(join(home, ".speckit-canvas", "preparations", `${consent.operationId}.json`), "utf8"));
    assert.equal(record.schemaVersion, 2);
    assert.ok((await readdir(consent.destination)).includes(".git"));
}));

test("Cancelled selection revokes its consent without creating a checkout", () => entryCloneFixture(async ({ service, home, snapshot, calls }) => {
    const consent = await service.confirm("selection", snapshot());
    service.cancel(consent.operationId);
    await assert.rejects(service.start(consent.operationId, consent.confirmation, "cancelled-consent"), { code: "confirmation_expired" });
    assert.equal(calls.length, 0);
    assert.deepEqual(await readdir(home), []);
}));

test("The configured ten-minute clone deadline aborts only owned preparation", async () => {
    const original = AbortSignal.timeout;
    const deadline = new AbortController();
    const budgets: number[] = [];
    const mocked = mock.method(AbortSignal, "timeout", (milliseconds: number) => {
        budgets.push(milliseconds); return milliseconds === 600_000 ? deadline.signal : original(milliseconds);
    });
    try {
        await entryCloneFixture(async ({ service, snapshot, holdClone, cloning, home }) => {
            const consent = await service.confirm("selection", snapshot()); holdClone();
            await service.start(consent.operationId, consent.confirmation, "deadline-request");
            await cloning; deadline.abort();
            await service.completion(consent.operationId);
            assert.equal(service.status(consent.operationId).state, "cancelled");
            assert.deepEqual(await readdir(join(home, "SpecKitCanvas", "repositories")), []);
        });
        assert.ok(budgets.includes(600_000));
    } finally { mocked.mock.restore(); }
});