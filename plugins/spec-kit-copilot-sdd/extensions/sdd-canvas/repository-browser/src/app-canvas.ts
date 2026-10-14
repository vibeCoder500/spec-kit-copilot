import { resolve } from "node:path";
import { knownRepositoryError, RepositoryError } from "./errors.ts";
import { createPreparationStore } from "./preparation-store.ts";
import { inspectCurrentRepository, verifyAppCanvasRepository } from "./workspace-binding.ts";
import type { HostHandoffAdapter, LocalRepositoryIdentity, PreparedRepositoryRecord } from "./types.ts";

export async function openRequestedAppCanvas({ host, homeDirectory, verifyPrepared,
    inspectWorkspace = workspacePath => inspectCurrentRepository({ workspacePath, homeDirectory }), now = Date.now }: {
    host: HostHandoffAdapter;
    homeDirectory?: string;
    verifyPrepared?: (record: PreparedRepositoryRecord) => Promise<unknown>;
    inspectWorkspace?: (path: string) => Promise<LocalRepositoryIdentity | null>;
    now?: () => number;
}) {
    const current = await host.inspectCurrent();
    const store = createPreparationStore({ homeDirectory });
    const listed = await store.list();
    if (listed.hasMore) throw new RepositoryError("clone_conflict");
    const pending = listed.items.flatMap(item => item.record ? [item.record] : []).filter(record =>
        record.appCanvas?.sourceSessionId !== current.sessionId &&
        record.appCanvas?.canvasStatus === "pending" && record.appCanvas.launchStatus !== "failed" && record.appCanvas.expiresAt > now());
    if (!pending.length) return { status: "none" as const };
    const identity = pending.some(record => record.destination === resolve(current.workingDirectory)) ? undefined : await inspectWorkspace(current.workingDirectory);
    const candidates = pending.filter(record => record.destination === resolve(current.workingDirectory) || record.gitCommonDirectory === identity?.gitCommonDirectory);
    if (!candidates.length) return { status: "none" as const };
    if (candidates.length !== 1) throw new RepositoryError("clone_conflict");
    if (current.activity !== "idle") throw new RepositoryError(current.activity === "busy" ? "session_busy" : "activity_unknown");
    const record = candidates[0]!;
    const requestId = record.appCanvas!.requestId;
    const verify = () => verifyPrepared ? verifyPrepared(record) :
        verifyAppCanvasRepository({ record, workspacePath: current.workingDirectory, homeDirectory });
    await verify();
    await store.claimAppCanvas(record.operationId, requestId, current.sessionId, now(), current.workingDirectory);
    let submitted = false;
    try {
        await verify();
        const latest = await host.inspectCurrent();
        if (latest.sessionId !== current.sessionId || latest.contextRevision !== current.contextRevision ||
            latest.workingDirectory !== current.workingDirectory || latest.activityRevision !== current.activityRevision ||
            latest.capabilityGeneration !== current.capabilityGeneration) throw new RepositoryError("context_changed");
        if (latest.activity !== "idle") throw new RepositoryError(latest.activity === "busy" ? "session_busy" : "activity_unknown");
        submitted = true;
        const acknowledgment = await host.openCurrentCanvas(current, `entry-app-${requestId}`, undefined, { repositorySetup: true });
        await store.finishAppCanvas(record.operationId, requestId, current.sessionId, acknowledgment);
        return { status: "opened" as const, acknowledgment };
    } catch (error) {
        const failure = knownRepositoryError((error as { code?: unknown })?.code);
        await store.finishAppCanvas(record.operationId, requestId, current.sessionId, { errorCode: failure.code, unknown: submitted });
        throw failure;
    }
}
