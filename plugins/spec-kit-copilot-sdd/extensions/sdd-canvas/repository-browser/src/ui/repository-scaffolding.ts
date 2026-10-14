import { createElement as icon, AlertTriangle, Check, Circle, FolderOpen, LoaderCircle, RefreshCw, Square, X } from "lucide";
import { knownRepositoryError } from "../errors.ts";
import type { ScaffoldingService, SetupArtifact, SetupProgress, SetupStep } from "../scaffolding.ts";
import { createRepositoryApi } from "./api.ts";

type Snapshot = Awaited<ReturnType<ScaffoldingService["state"]>>;
const LABELS: Record<SetupProgress, string> = {
    pending: "Pending", loading: "Loading", waiting: "Waiting for sign-in", completed: "Completed", skipped: "Already ready",
    error: "Error", cancelled: "Cancelled",
};
const GLYPHS = { pending: Circle, loading: LoaderCircle, waiting: LoaderCircle, completed: Check, skipped: Check, error: AlertTriangle, cancelled: X };

export async function mountRepositoryScaffolding({ container, request, onWorkflow }: {
    container: HTMLElement; request?: typeof fetch; onWorkflow?: () => void;
}) {
    const document = container.ownerDocument;
    const window = document.defaultView!;
    const api = createRepositoryApi({ document, request, namespace: "scaffolding" });
    let snapshot: Snapshot | undefined;
    let disposed = false;
    let submitting = false;
    let continuing = false;
    let autoContinued = false;
    let requestError = "";
    let pollTimer: number | undefined;
    let handoverTimer: number | undefined;
    container.className = "entry-flow setup-flow";
    container.innerHTML = `<header class="entry-heading"><div><p class="entry-product">Spec-Driven Development</p><h1>Setting up this repository</h1></div><span class="setup-refresh"></span></header>
        <section class="entry-current" aria-label="Setup repository"><span class="entry-current-icon" aria-hidden="true"></span><div class="entry-current-name"><span class="entry-label">Current repository</span><strong class="setup-repository">Checking workspace...</strong><span class="entry-path setup-path"></span></div></section>
        <section class="setup-recommendation" aria-label="Recommended organization setup"><div class="setup-recommendation-heading"><h2>Default organization bundle</h2><span class="setup-recommended">Recommended</span></div>
            <p>Spec Kit is initialized automatically in Copilot skills mode with the organization's recommended bundle, including its extensions and presets.</p>
            <p class="setup-consent">Repository entry installs or updates local setup tools, opens organization sign-in if needed, configures registry authentication and all four catalogs, and adds Spec Kit-managed files in this checkout. Existing Spec Kit-managed files may be replaced. Application source is not rewritten; nothing is committed, pushed, or deployed.</p>
            <p class="setup-source"></p><div class="setup-actions"></div></section>
        <section class="setup-progress" aria-label="Setup progress"><div class="setup-progress-heading"><h2>Setup progress</h2><span class="setup-count"></span></div><progress class="setup-meter" max="13" value="0" aria-label="Completed setup steps"></progress><ol class="setup-steps"></ol></section>
        <footer class="entry-footer"><div class="setup-message" role="status" aria-live="polite">Loading setup state...</div></footer>`;
    const element = <ElementType extends HTMLElement>(selector: string) => container.querySelector<ElementType>(selector)!;
    const message = element(".setup-message");
    const steps = element(".setup-steps");
    element(".entry-current-icon").append(icon(FolderOpen, { width: "24", height: "24", "aria-hidden": "true" }));
    const requestId = () => `setup-${window.crypto.randomUUID()}`;
    function button(label: string, glyph: Parameters<typeof icon>[0], action: () => void, primary = false) {
        const control = document.createElement("button");
        control.type = "button"; control.className = `entry-command${primary ? " entry-primary" : ""}`;
        control.append(icon(glyph, { width: "18", height: "18", "aria-hidden": "true" }), document.createTextNode(label));
        control.addEventListener("click", action);
        return control;
    }
    const retry = button("Retry organization setup", RefreshCw, () => { void start(); }, true);
    retry.dataset.action = "retry-setup"; retry.hidden = true; retry.disabled = true;
    const cancel = button("Cancel setup", Square, () => { void cancelSetup(); });
    cancel.dataset.action = "cancel-setup"; cancel.hidden = true;
    const proceed = button("Open Spec Kit canvas", Check, () => { void openWorkflow(); });
    proceed.dataset.action = "continue-scaffolding"; proceed.hidden = true;
    const refresh = button("Refresh setup state", RefreshCw, () => { void refreshState(); });
    element(".setup-refresh").append(refresh);
    element(".setup-actions").append(retry, cancel, proceed);
    const safeError = (error: unknown) => knownRepositoryError((error as { code?: unknown })?.code).message;
    const active = () => Boolean(snapshot?.job && ["running", "waiting"].includes(snapshot.job.status));

    function progressRow(step: SetupStep | SetupArtifact, artifact = false) {
        const row = document.createElement("li");
        row.className = "setup-step"; row.dataset.status = step.status;
        row.dataset[artifact ? "artifact" : "step"] = step.id;
        const glyph = icon(GLYPHS[step.status], { width: "18", height: "18", "aria-hidden": "true" });
        glyph.classList.add("setup-step-icon");
        const content = document.createElement("div"); content.className = "setup-step-content";
        const label = document.createElement("strong"); label.textContent = step.label;
        content.append(label);
        if ("kind" in step) {
            const metadata = document.createElement("small");
            metadata.textContent = `${step.kind} / v${step.version}${step.priority ? ` / priority ${step.priority}` : ""}${step.strategy ? ` / ${step.strategy}` : ""}`;
            content.append(metadata);
        }
        if (step.detail) { const detail = document.createElement("p"); detail.textContent = step.detail; content.append(detail); }
        if (step.command) { const command = document.createElement("code"); command.textContent = step.command; content.append(command); }
        const status = document.createElement("span"); status.className = "setup-step-status"; status.textContent = LABELS[step.status];
        row.append(glyph, content, status);
        if (step.id === "bundle" && snapshot?.job?.artifacts.length) {
            const artifacts = document.createElement("ul"); artifacts.className = "setup-artifacts";
            artifacts.setAttribute("aria-label", "Organization bundle artifacts");
            for (const entry of snapshot.job.artifacts) artifacts.append(progressRow(entry, true));
            row.append(artifacts);
        }
        return row;
    }

    function render() {
        if (!snapshot || disposed) return;
        element(".setup-repository").textContent = snapshot.repositoryName;
        element(".setup-path").textContent = snapshot.workspacePath;
        const source = element(".setup-source"); source.replaceChildren();
        const link = document.createElement("a"); link.href = snapshot.recommendation.sourceUrl;
        link.textContent = snapshot.recommendation.bundleName; link.target = "_blank"; link.rel = "noopener noreferrer"; link.referrerPolicy = "no-referrer";
        source.append(document.createTextNode("Organization registry: "), link);
        const job = snapshot.job;
        const entries = job?.steps ?? snapshot.steps;
        const complete = entries.filter(step => ["completed", "skipped"].includes(step.status)).length;
        element(".setup-count").textContent = `${complete} / ${entries.length} ready`;
        const meter = element<HTMLProgressElement>(".setup-meter"); meter.max = entries.length; meter.value = complete;
        steps.replaceChildren(...entries.map(step => progressRow(step)));
        const recoverable = snapshot.automaticStartError || job && ["error", "cancelled", "interrupted"].includes(job.status);
        retry.hidden = !recoverable;
        retry.disabled = submitting || continuing || !snapshot.canStart || job?.status === "completed";
        cancel.hidden = !active(); cancel.disabled = submitting || continuing;
        proceed.hidden = job?.status !== "completed"; proceed.disabled = continuing;
        refresh.disabled = submitting || continuing;
        container.setAttribute("aria-busy", String(submitting || continuing || active() || !job && !snapshot.automaticStartError));
        container.dataset.setupState = job?.status ?? (snapshot.automaticStartError ? "error" : "pending");
        if (!submitting && !continuing) {
            message.textContent = requestError || job?.message || (snapshot.automaticStartError === "session_busy" && snapshot.canStart ?
                "Automatic setup was blocked while this session was busy. It is now idle; choose Retry organization setup to continue." :
                snapshot.automaticStartError ? knownRepositoryError(snapshot.automaticStartError).message :
                job?.status === "waiting" ? "Complete sign-in in the system browser to continue." :
                job?.status === "running" ? "Setup is running in this checkout. Closing the canvas does not cancel it." :
                    snapshot.blockedReason ? knownRepositoryError(snapshot.blockedReason).message : "Preparing automatic organization setup for this repository...");
        }
        if (job?.status === "completed" && !autoContinued) {
            autoContinued = true;
            handoverTimer = window.setTimeout(() => { void openWorkflow(); }, 800);
        }
    }

    function schedulePoll() {
        if (pollTimer !== undefined) window.clearTimeout(pollTimer);
        if (!disposed && !continuing && (active() || !snapshot?.job && !snapshot?.automaticStartError ||
            !snapshot?.canStart && snapshot?.job?.status !== "completed")) {
            pollTimer = window.setTimeout(() => { void refreshState(); }, 1500);
        }
    }
    async function refreshState() {
        try { const next = await api.call<Snapshot>("state"); if (!disposed) { snapshot = next; requestError = ""; render(); } }
        catch (error) { if (!disposed) { requestError = safeError(error); message.textContent = requestError; retry.disabled = true; } }
        finally { schedulePoll(); }
    }
    async function start() {
        if (submitting || continuing || !snapshot?.canStart) return;
        submitting = true; requestError = ""; message.textContent = "Starting the checkout-bound setup job..."; render();
        try {
            snapshot = await api.call<Snapshot>("state");
            if (disposed || snapshot.job?.status === "completed") return;
            if (!snapshot.canStart) throw knownRepositoryError(snapshot.blockedReason);
            const next = await api.call<Snapshot>("start", {}, { contextId: snapshot.contextId, requestId: requestId() });
            if (!disposed) { snapshot = next; autoContinued = false; }
        } catch (error) { if (!disposed) requestError = safeError(error); }
        finally { submitting = false; if (!disposed) { render(); schedulePoll(); } }
    }
    async function cancelSetup() {
        if (submitting || !active() || !snapshot?.job) return;
        submitting = true; requestError = ""; render();
        try { const next = await api.call<Snapshot>("cancel", {}, { jobId: snapshot.job.id, requestId: requestId() }); if (!disposed) snapshot = next; }
        catch (error) { if (!disposed) requestError = safeError(error); }
        finally { submitting = false; if (!disposed) { render(); schedulePoll(); } }
    }
    async function openWorkflow() {
        if (continuing || disposed || snapshot?.job?.status !== "completed") return;
        continuing = true; if (handoverTimer !== undefined) window.clearTimeout(handoverTimer);
        requestError = ""; message.textContent = "Verifying setup and opening the original Spec Kit canvas..."; render();
        try {
            await api.call<{ renderer: "workflow" }>("continue", {}, { requestId: requestId() });
            if (!disposed) { if (onWorkflow) onWorkflow(); else window.location.reload(); }
        } catch (error) { continuing = false; requestError = safeError(error); render(); }
    }
    await refreshState();
    return {
        receive(next: Snapshot) {
            if (disposed) return;
            snapshot = next; render(); schedulePoll();
        },
        refresh: refreshState,
        fail(error: { code?: unknown }) {
            requestError = knownRepositoryError(error.code).message;
            message.textContent = requestError; retry.disabled = true;
        },
        dispose() {
            disposed = true; api.abort();
            if (pollTimer !== undefined) window.clearTimeout(pollTimer);
            if (handoverTimer !== undefined) window.clearTimeout(handoverTimer);
            container.replaceChildren();
        },
    };
}
