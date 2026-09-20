import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { mock, test } from "node:test";
import type { RepositoryConnection } from "../src/auth.ts";
import { cloneEnvironment, createCloneService, runGit } from "../src/clone.ts";
import * as cloneModule from "../src/clone.ts";
import type { GitExecution } from "../src/clone.ts";
import { parseRepositoryProfile } from "../src/profile.ts";
import type { HostHandoffAdapter, HostWorkspaceSnapshot } from "../src/types.ts";
import { RepositoryError } from "../src/errors.ts";

const profile = parseRepositoryProfile({ schemaVersion: 1, enabled: true, tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222", organization: "Synthetic", project: "Project" });
const repositoryId = "33333333-3333-4333-8333-333333333333";
const source = { contextId: "context", sourceVersion: "a".repeat(40), generation: 1, repository: { id: repositoryId, name: "Synthetic repository", defaultBranch: "refs/heads/main", operationalState: "active" as const } };

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
        if (input.args.includes("symbolic-ref")) return `speckit/canvas-${input.cwd.split(/[\\/]/).at(-2)}`;
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
            if (input.args.includes("symbolic-ref")) return `speckit/canvas-${input.cwd.split(/[\\/]/).at(-2)}`;
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
        await mkdir(dirname(consent.destination), { recursive: true });
        const sentinel = join(dirname(consent.destination), "user-file.txt");
        await writeFile(sentinel, "preserve");
        await assert.rejects(service.start(consent.operationId, consent.confirmation, "occupied"));
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