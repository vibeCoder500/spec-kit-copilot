import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { createScaffoldingTestWorkspace } from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/test/scaffolding-fixture.ts";
import { REPOSITORY_ROOT } from "../sync-assets.mjs";

export async function startScaffoldingFixture(options = {}) {
    const workspace = await createScaffoldingTestWorkspace(options);
    if (options.pauseBundle) workspace.pauseBundle();
    if (options.busy) workspace.setBusy(true);
    const extension = join(REPOSITORY_ROOT, "plugins", "spec-kit-copilot-sdd", "extensions", "sdd-canvas");
    const id = randomUUID().replaceAll("-", "");
    const key = `__scaffoldingFixture_${id}`;
    let dispatches = 0;
    let stopped = false;
    let entry;
    let provider;
    let providerContext;
    const session = {
        workspace, bindingReady: false,
        send: async () => { dispatches++; throw new Error("Workflow dispatch is not authorized in a scaffolding fixture."); },
        log: async () => {},
        rpc: {
            metadata: {
                snapshot: async () => {
                    const state = await workspace.host.inspectCurrent();
                    return { sessionId: state.sessionId, workingDirectory: state.workingDirectory };
                },
                activity: async () => {
                    const state = await workspace.host.inspectCurrent();
                    return { hasActiveWork: state.activity !== "idle", abortable: state.activity !== "idle" };
                },
            },
            skills: { reload: workspace.options.reloadSkills },
        },
    };
    globalThis[key] = session;
    const sdk = `export const createCanvas = definition => definition;
        export class CanvasError extends Error { constructor(code, message) { super(message); this.code = code; } }
        export async function joinSession({ canvases }) {
            const session = globalThis[${JSON.stringify(key)}]; session.canvases = canvases; return session;
        }`;
    const sdkUrl = `data:text/javascript,${encodeURIComponent(sdk)}`;
    const runtimeUrl = pathToFileURL(join(extension, "vendor", "repository-browser", "server.mjs")).href;
    const isolatedRuntime = `export * from ${JSON.stringify(runtimeUrl)};
        export async function openRequestedAppCanvas() { return { status: "none" }; }
        ${options.providerOpen ? `
        import { createScaffoldingService as createActualScaffolding, createRepositoryService as createActualRepositories } from ${JSON.stringify(runtimeUrl)};
        const fixture = globalThis[${JSON.stringify(key)}];
        export async function createWorkflowBinding() {
            return { verify: async () => {
                if (!fixture.bindingReady) throw new Error("Automatic setup ran before verified target readiness.");
                await fixture.workspace.options.verifyWorkspace();
            }, ready: async () => { fixture.bindingReady = true; } };
        }
        export async function createRepositoryService(options) {
            return createActualRepositories({ ...options, bindingOptions: { ...options.bindingOptions, homeDirectory: fixture.workspace.home } });
        }
        export async function createScaffoldingService(options) {
            fixture.scaffolding = await createActualScaffolding({ ...options,
                homeDirectory: fixture.workspace.home, runner: fixture.workspace.options.runner,
                findExecutable: fixture.workspace.options.findExecutable,
                inspectWorkspace: fixture.workspace.options.inspectWorkspace,
                reloadSkills: fixture.workspace.options.reloadSkills });
            return fixture.scaffolding;
        }` : ""}`;
    const isolatedUrl = `data:text/javascript,${encodeURIComponent(isolatedRuntime)}`;
    const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
        if (specifier === "@github/copilot-sdk/extension") return { url: sdkUrl, shortCircuit: true };
        if (specifier === "./vendor/repository-browser/server.mjs" && context.parentURL?.includes(`scaffolding-fixture=${id}`)) {
            return { url: isolatedUrl, shortCircuit: true };
        }
        return nextResolve(specifier, context);
    } });
    try {
        const module = await import(`${pathToFileURL(join(extension, "extension.mjs")).href}?scaffolding-fixture=${id}`);
        if (options.providerOpen) {
            provider = session.canvases.find(canvas => canvas.id === "sdd-canvas-direct");
            providerContext = { extensionId: "synthetic-provider", canvasId: provider.id, instanceId: `fixture-${id}`,
                sessionId: "synthetic-setup-session", input: { repositorySetup: true } };
            const opened = await provider.open(providerContext);
            entry = { url: opened.url, scaffolding: session.scaffolding };
        } else {
            entry = await module.startServer({ workspacePath: workspace.workspacePath, repositorySetup: true, profileStatus: { state: "unconfigured" },
                verifyWorkspace: workspace.options.verifyWorkspace, bindingOptions: { homeDirectory: workspace.home },
                scaffoldingOptions: workspace.options });
        }
    } catch (error) {
        await workspace.cleanup(); throw error;
    } finally { hooks.deregister(); delete globalThis[key]; }
    const automaticAdmission = options.autoStart === false || options.providerOpen ? undefined : entry.scaffolding?.startAutomatically();
    return {
        url: entry.url, workspacePath: workspace.workspacePath, driver: workspace,
        dispatchCount: () => dispatches,
        commands: () => workspace.calls.map(command => ({ tool: command.executable.split(/[\\/]/).at(-1), args: [...command.args] })),
        application: () => readFile(join(workspace.workspacePath, "application.ts"), "utf8"),
        state: () => entry.scaffolding?.state(),
        startAutomatically: () => entry.scaffolding?.startAutomatically(),
        async stop() {
            if (stopped) return { cleaned: true };
            stopped = true;
            await automaticAdmission;
            const state = await entry.scaffolding?.state();
            if (state?.job && ["running", "waiting"].includes(state.job.status)) await entry.scaffolding.cancel(state.job.id, `cleanup-${id}`);
            workspace.resumeBundle(); workspace.authenticate();
            await entry.scaffolding?.settled();
            if (provider) await provider.onClose(providerContext);
            else {
                for (const client of entry.clients) client.end();
                await new Promise(resolve => { entry.server.close(resolve); entry.server.closeAllConnections(); });
            }
            await workspace.cleanup();
            return { cleaned: true };
        },
    };
}
