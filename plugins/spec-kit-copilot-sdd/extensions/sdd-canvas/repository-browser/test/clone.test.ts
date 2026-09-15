import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { test } from "node:test";
import type { RepositoryConnection } from "../src/auth.ts";
import { cloneEnvironment, createCloneService, runGit } from "../src/clone.ts";
import type { GitExecution } from "../src/clone.ts";
import { parseRepositoryProfile } from "../src/profile.ts";
import type { RemoteReview } from "../src/remote-review.ts";

const profile = parseRepositoryProfile({ schemaVersion: 1, enabled: true, tenantId: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222", organization: "Synthetic", project: "Project" });
const repositoryId = "33333333-3333-4333-8333-333333333333";
const source = { contextId: "context", sourceVersion: "a".repeat(40), generation: 1, repository: { id: repositoryId, name: "Synthetic repository", defaultBranch: "refs/heads/main", operationalState: "active" } };

async function fixture(run: (value: { home: string; service: ReturnType<typeof createCloneService>; calls: GitExecution[]; switchAccount(): void; deny(): void }) => Promise<void>) {
    const home = await mkdtemp(join(tmpdir(), "sdd-clone-test-"));
    let generation = 1;
    let denied = false;
    const calls: GitExecution[] = [];
    const connection = { snapshot: () => ({ accountLabel: "synthetic@example.invalid" }), access: async () => ({ accessToken: "synthetic-secret", tenantId: profile.tenantId, accountId: "account", connectionId: "connection", generation, signal: new AbortController().signal, assertCurrent() {} }) } as unknown as RepositoryConnection;
    const review = { source: async () => { if (denied) throw new Error("denied"); return source; } } as unknown as RemoteReview;
    const service = createCloneService({ review, connection, profile, workspacePath: home, homeDirectory: home, executable: join(home, "trusted-git.exe"), runner: async (input) => {
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