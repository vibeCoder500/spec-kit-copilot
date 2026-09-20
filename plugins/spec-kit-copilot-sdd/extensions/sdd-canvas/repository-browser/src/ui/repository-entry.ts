import { createElement as icon, ArrowRight, ClipboardCopy, Download, ExternalLink, FolderOpen, GitBranch, LogIn, LogOut, RefreshCw, Search, Square, X } from "lucide";
import { knownRepositoryError } from "../errors.ts";
import type { EntryCoordinator } from "../repository-service.ts";
import type { RepositoryPage, RepositorySummary } from "../types.ts";
import { createRepositoryApi } from "./api.ts";

export type EntrySnapshot = Awaited<ReturnType<EntryCoordinator["state"]>>;
type Selection = Awaited<ReturnType<EntryCoordinator["select"]>>;
type Operation = Awaited<ReturnType<EntryCoordinator["operation"]>>;
type Retained = Awaited<ReturnType<EntryCoordinator["preparations"]>>["items"];
type Collection = { items: RepositorySummary[]; cursor: string | null; hasMore: boolean; loading: boolean; loaded: boolean; error: string | null; query: string };

export async function mountRepositoryEntry({ container, request }: { container: HTMLElement; request?: typeof fetch }) {
    const document = container.ownerDocument;
    const window = document.defaultView!;
    const api = createRepositoryApi({ document, request, namespace: "entry" });
    const remoteApi = createRepositoryApi({ document, request });
    let snapshot: EntrySnapshot | undefined;
    let selection: Selection | undefined;
    let operation: Operation | undefined;
    let retained: Retained = [];
    let retainedGeneration: number | undefined;
    let disposed = false;
    let opening = false;
    let opened = false;
    let generation = 0;
    let selectionGeneration = 0;
    let discoveryGeneration = 0;
    let activeIndex = -1;
    let popupOpen = false;
    let selecting = false;
    let submitting = false;
    let connecting = false;
    let queryTimer: number | undefined;
    let pollTimer: number | undefined;
    let expiryTimer: number | undefined;
    let discoveryRequest: AbortController | undefined;
    const emptyCollection = (): Collection => ({ items: [], cursor: null, hasMore: false, loading: false, loaded: false, error: null, query: "" });
    let suggestions = emptyCollection();
    let matches = emptyCollection();
    container.className = "entry-flow";
    container.innerHTML = `<header class="entry-heading"><div><p class="entry-product">Spec-Driven Development</p><h1>Choose a repository</h1></div><span class="entry-direct"></span></header>
        <section class="entry-current" aria-label="Current workspace"><span class="entry-current-icon" aria-hidden="true"></span><div class="entry-current-name"><span class="entry-label">Current workspace</span><strong class="entry-workspace-label">Checking workspace...</strong></div><span class="entry-local-action"></span></section>
        <section class="entry-discovery" aria-label="Repository selection"><div class="entry-discovery-heading"><h2>Repositories</h2><span class="entry-connection"></span></div>
        <div class="entry-search-wrap"><span class="entry-search-icon" aria-hidden="true"></span><input class="entry-search" type="search" role="combobox" aria-label="Search readable project repositories" aria-haspopup="listbox" aria-autocomplete="list" aria-expanded="false" aria-controls="entry-results" placeholder="Search repositories" maxlength="256" spellcheck="false" autocomplete="off" disabled><span class="entry-clear"></span>
        <div class="entry-popup" hidden><div id="entry-results" role="listbox" aria-label="Repository search results"></div><div class="entry-results-state"></div><div class="entry-results-actions"></div></div></div>
        <p class="entry-connection-state">Checking connection...</p><div class="entry-selection" hidden></div><div class="entry-operation" hidden></div></section>
        <section class="entry-retained" aria-label="Cloned repositories" hidden></section>
        <footer class="entry-footer"><div class="entry-message" role="status" aria-live="polite"></div><span class="entry-refresh"></span></footer>`;
    const element = <ElementType extends HTMLElement>(selector: string) => container.querySelector<ElementType>(selector)!;
    const message = element(".entry-message");
    const search = element<HTMLInputElement>(".entry-search");
    const popup = element(".entry-popup");
    const results = element("#entry-results");
    const selectionPanel = element(".entry-selection");
    const operationPanel = element(".entry-operation");
    const retainedPanel = element(".entry-retained");
    const requestId = () => `entry-${window.crypto.randomUUID()}`;
    function button(label: string, glyph: Parameters<typeof icon>[0], action: () => void, command = false) {
        const control = document.createElement("button");
        control.type = "button"; control.className = command ? "entry-command" : "entry-icon";
        control.title = label; control.setAttribute("aria-label", label);
        control.append(icon(glyph, { width: "18", height: "18", "aria-hidden": "true" }));
        if (command) control.append(document.createTextNode(label));
        control.addEventListener("click", action);
        return control;
    }

    function copyCheckoutPath(path: string) {
        const copy = button("Copy checkout path", ClipboardCopy, () => {
            void window.navigator.clipboard.writeText(path).then(() => {
                if (!disposed) message.textContent = "Checkout path copied.";
            }).catch(() => { if (!disposed) message.textContent = "Clipboard unavailable."; });
        });
        copy.dataset.action = "copy-checkout-path";
        copy.disabled = typeof window.navigator.clipboard?.writeText !== "function";
        return copy;
    }

    const direct = button("Open canvas directly", ExternalLink, () => { void open(true); }); direct.dataset.action = "direct";
    const local = button("Use current workspace", ArrowRight, () => { void open(false); }, true); local.dataset.action = "local"; local.disabled = true;
    const refresh = button("Refresh entry state", RefreshCw, () => { void refreshState(); });
    const connect = button("Connect Microsoft account", LogIn, () => { void changeConnection(true); }, true);
    const disconnect = button("Disconnect Microsoft account", LogOut, () => { void changeConnection(false); });
    const clear = button("Clear search", X, () => { search.value = ""; changedQuery(); search.focus(); }); clear.dataset.action = "clear-search";
    element(".entry-direct").append(direct); element(".entry-local-action").append(local); element(".entry-refresh").append(refresh);
    element(".entry-connection").append(connect, disconnect);
    element(".entry-clear").append(clear);
    element(".entry-current-icon").append(icon(FolderOpen, { width: "24", height: "24" }));
    element(".entry-search-icon").append(icon(Search, { width: "18", height: "18" }));
    element(".entry-discovery-heading h2").prepend(icon(GitBranch, { width: "18", height: "18", "aria-hidden": "true" }));

    const connected = () => snapshot?.connection.state === "connected";
    const collection = () => search.value.trim() ? matches : suggestions;
    const cloning = () => operation?.state === "preparing" || operation?.state === "verifying";
    const safeError = (error: unknown) => knownRepositoryError((error as { code?: unknown })?.code).message;

    function setPopup(value: boolean) {
        popupOpen = value && connected() && !selecting && !submitting && !cloning();
        popup.hidden = !popupOpen; search.setAttribute("aria-expanded", String(popupOpen));
        if (!popupOpen) { activeIndex = -1; search.removeAttribute("aria-activedescendant"); }
    }

    function renderCollection() {
        const current = collection();
        results.replaceChildren();
        current.items.forEach((repository, index) => {
            const option = document.createElement("div"); option.className = "entry-option"; option.id = `entry-option-${index}`;
            option.setAttribute("role", "option"); option.setAttribute("aria-selected", String(index === activeIndex));
            option.append(icon(GitBranch, { width: "18", height: "18", "aria-hidden": "true" }));
            const name = document.createElement("strong"); name.textContent = repository.name;
            const state = document.createElement("span"); state.textContent = repository.operationalState === "maintenance" ? "Maintenance" : "Repository";
            option.append(name, state);
            option.addEventListener("mousedown", event => event.preventDefault());
            option.addEventListener("click", () => { void selectRepository(repository); });
            results.append(option);
        });
        if (activeIndex >= 0 && current.items[activeIndex]) search.setAttribute("aria-activedescendant", `entry-option-${activeIndex}`);
        else search.removeAttribute("aria-activedescendant");
        element(".entry-results-state").textContent = current.loading ? "Loading repositories..." : current.error ??
            (!current.items.length && current.loaded ? search.value.trim() ? "No matching repositories." : "No team-linked repositories." : "");
        const actions = element(".entry-results-actions"); actions.replaceChildren();
        if (current.error) actions.append(button("Retry repository results", RefreshCw, () => { void loadCollection(); }, true));
        else if (current.hasMore) {
            const more = button("More repositories", ArrowRight, () => { void loadCollection(true); }, true);
            more.disabled = current.loading; actions.append(more);
        }
        setPopup(popupOpen);
    }

    async function loadCollection(append = false) {
        if (!connected() || disposed) return;
        const query = search.value.trim();
        const current = query ? matches : suggestions;
        if (current.loading) return;
        discoveryRequest?.abort(); discoveryRequest = new AbortController();
        const ownGeneration = ++discoveryGeneration;
        current.loading = true; current.error = null; renderCollection();
        try {
            const parameters: Record<string, string> = query ? { q: query } : {};
            if (append && current.cursor) parameters.cursor = current.cursor;
            const page = await remoteApi.call<RepositoryPage>(query ? "search" : "relevant", parameters, undefined, discoveryRequest.signal);
            if (disposed || ownGeneration !== discoveryGeneration || query !== search.value.trim()) return;
            const combined = append ? [...current.items, ...page.items] : page.items;
            current.items = [...new Map(combined.map(item => [item.id, item])).values()];
            current.cursor = page.cursor; current.hasMore = page.hasMore; current.loaded = true;
        } catch (error) { if (!disposed && ownGeneration === discoveryGeneration) current.error = safeError(error); }
        finally { current.loading = false; if (!disposed && ownGeneration === discoveryGeneration) renderCollection(); }
    }

    function discardSelection() {
        selectionGeneration++; selecting = false; selection = undefined;
        if (expiryTimer !== undefined) window.clearTimeout(expiryTimer);
        selectionPanel.hidden = true; selectionPanel.replaceChildren();
    }

    function changedQuery() {
        if (queryTimer !== undefined) window.clearTimeout(queryTimer);
        discoveryGeneration++; discoveryRequest?.abort();
        suggestions.loading = false; matches.loading = false;
        discardSelection(); activeIndex = -1;
        matches = { ...emptyCollection(), query: search.value.trim() };
        setPopup(true); renderCollection(); render();
        if (search.value.trim()) queryTimer = window.setTimeout(() => { void loadCollection(); }, 1000);
        else if (!suggestions.loaded) void loadCollection();
    }

    function renderSelection() {
        selectionPanel.hidden = !selection;
        selectionPanel.replaceChildren();
        if (!selection) return;
        const heading = document.createElement("h3"); heading.textContent = selection.repository.name;
        const summary = document.createElement("dl"); summary.className = "entry-summary";
        for (const [name, value, field] of [["Account", selection.accountLabel, "account"], ["Default branch", selection.repository.defaultBranch ?? "Unavailable", "branch"],
            ["Commit", selection.repository.sourceVersion ?? "Unavailable", "commit"], ["Destination", selection.destination, "destination"],
            ["App workspace", snapshot?.host.canHandoff ? "Automatic handoff" : "Unchanged", "workspace"]]) {
            const label = document.createElement("dt"); label.textContent = name!;
            const content = document.createElement("dd"); content.textContent = value!; content.dataset.field = field;
            summary.append(label, content);
        }
        const actions = document.createElement("div"); actions.className = "entry-selection-actions";
        if (selection.matchesCurrentWorkspace) actions.append(button("Use current workspace", ArrowRight, () => { void open(false); }, true));
        else {
            const confirm = button("Confirm and clone", Download, () => { void confirmClone(); }, true); confirm.dataset.action = "confirm-clone";
            confirm.classList.add("entry-primary");
            confirm.disabled = submitting || !selection.confirmation || !snapshot?.host.canPrepareRemote || !selection.expiresAt || Date.now() >= selection.expiresAt;
            actions.append(confirm);
        }
        const cancel = button("Cancel selection", X, () => { void cancelSelection(); }, true);
        cancel.dataset.action = "cancel-selection"; cancel.disabled = submitting; actions.append(cancel);
        selectionPanel.append(heading, summary, actions);
        const reason = selection.reason ?? snapshot?.host.reason;
        if (reason && !selection.matchesCurrentWorkspace) {
            const explanation = document.createElement("p"); explanation.className = "entry-muted"; explanation.textContent = knownRepositoryError(reason).message;
            selectionPanel.append(explanation);
        }
    }

    function renderOperation() {
        operationPanel.hidden = !operation;
        operationPanel.replaceChildren();
        if (!operation) return;
        const labels: Record<Operation["state"], string> = { awaiting_confirmation: "Awaiting confirmation", preparing: "Cloning repository...", verifying: "Verifying repository...",
            prepared: snapshot?.host.canHandoff ? "Repository prepared. Handoff pending." : "Clone complete.",
            prepared_for_manual_open: "Clone complete.", cancelled: "Repository preparation cancelled.", failed: "Repository preparation failed." };
        const phases: Partial<Record<EntrySnapshot["phase"], string>> = { waiting_user: "Repository prepared. Waiting for an explicit handoff.",
            handoff_pending: "Repository handoff is in progress.", target_binding: "Verifying target canvas...", handoff_failed: "Repository prepared. Handoff failed.",
            handoff_unknown: "Repository prepared. Handoff outcome is not confirmed.", validation_blocked: "Repository prepared. Handoff validation is blocked.", ready: "Spec Kit canvas ready." };
        const status = document.createElement("p"); status.setAttribute("role", "status"); status.textContent =
            operation.state === "prepared" ? phases[snapshot?.phase ?? "prepared"] ?? labels.prepared : labels[operation.state];
        const destination = document.createElement("p"); destination.className = "entry-path"; destination.textContent = operation.destination ?? "";
        operationPanel.append(status, destination);
        if (operation.state === "prepared") {
            operationPanel.append(copyCheckoutPath(operation.destination));
            if (snapshot?.phase === "prepared" && !snapshot.host.canHandoff) {
                const workspace = document.createElement("p"); workspace.className = "entry-muted";
                workspace.textContent = "Current workspace unchanged. Automatic workspace switching is unavailable.";
                operationPanel.append(workspace);
            }
        }
        if (cloning()) {
            const cancel = button("Cancel preparation", Square, () => { void cancelClone(); }, true); cancel.disabled = submitting;
            operationPanel.append(cancel);
        } else if (operation.state === "prepared" && snapshot?.host.canHandoff && snapshot.phase !== "ready") {
            const retry = button("Retry handoff", ArrowRight, () => { void retryHandoff(operation!.operationId); }, true);
            retry.disabled = submitting || !snapshot?.host.canRetryHandoff || snapshot.phase === "target_binding";
            operationPanel.append(retry);
        }
        if (operation.error) {
            const error = document.createElement("p"); error.textContent = knownRepositoryError(operation.error).message; operationPanel.append(error);
        }
    }

    function renderRetained() {
        const items = retained.filter(item => item.operationId !== operation?.operationId);
        retainedPanel.hidden = !connected() || !items.length || snapshot?.phase === "ready";
        retainedPanel.replaceChildren();
        if (retainedPanel.hidden) return;
        const heading = document.createElement("h2"); heading.textContent = "Cloned repositories"; retainedPanel.append(heading);
        for (const item of items) {
            const row = document.createElement("div"); row.className = "entry-retained-row";
            const details = document.createElement("div");
            const name = document.createElement("strong"); name.textContent = item.repositoryName;
            const path = document.createElement("p"); path.className = "entry-path"; path.textContent = item.destination;
            details.append(name, path);
            const actions = document.createElement("div"); actions.className = "entry-selection-actions";
            actions.append(copyCheckoutPath(item.destination));
            if (snapshot?.host.canHandoff) {
                const retry = button("Retry handoff", ArrowRight, () => { void retryHandoff(item.operationId); }, true);
                retry.disabled = submitting || !snapshot.host.canPrepareRemote;
                actions.append(retry);
            }
            row.append(details, actions); retainedPanel.append(row);
        }
    }

    function applySnapshot(state: EntrySnapshot) {
        if (snapshot && (snapshot.localContext.contextId !== state.localContext.contextId || snapshot.connection.generation !== state.connection.generation)) {
            discardSelection(); discoveryGeneration++; discoveryRequest?.abort(); suggestions = emptyCollection(); matches = emptyCollection();
            if (snapshot.connection.generation !== state.connection.generation) { retained = []; retainedGeneration = undefined; }
        }
        snapshot = state;
        if (selection && !state.host.canPrepareRemote) selection.confirmation = null;
        if (state.operation) { operation = state.operation; discardSelection(); }
        if (!connected()) { operation = undefined; setPopup(false); }
    }

    function render() {
        if (disposed) return;
        local.disabled = opening || opened || snapshot?.host.canOpenCurrent !== true;
        direct.disabled = opening;
        refresh.disabled = opening;
        search.disabled = !connected() || opening || submitting || cloning();
        clear.hidden = !search.value; clear.disabled = search.disabled;
        connect.hidden = connected(); disconnect.hidden = !connected();
        connect.disabled = connecting || snapshot?.configuration !== "configured" || snapshot.connection.state === "connecting";
        disconnect.disabled = connecting;
        element(".entry-workspace-label").textContent = snapshot?.localContext.state === "repository" ? snapshot.localContext.label :
            snapshot?.localContext.state === "not_repository" ? "No repository in this workspace" : "Workspace unavailable";
        element(".entry-connection-state").textContent = connected() ? snapshot!.connection.accountLabel ?? "Microsoft account connected." :
            connecting || snapshot?.connection.state === "connecting" ? "Connecting Microsoft account..." : snapshot?.configuration === "configured" ? "Microsoft account not connected." : "Remote connection is not configured.";
        renderSelection(); renderOperation(); renderRetained();
        const targetReady = operation?.state === "prepared" && snapshot?.phase === "ready";
        element(".entry-current").hidden = targetReady;
        element(".entry-discovery").hidden = targetReady;
        element(".entry-heading").hidden = targetReady;
        if (targetReady) message.textContent = "Spec Kit canvas ready.";
        if (opened) message.textContent = "Spec Kit canvas opened.";
    }

    async function refreshState() {
        const current = ++generation;
        try {
            const state = await api.call<EntrySnapshot>("state");
            if (disposed || current !== generation) return;
            applySnapshot(state);
        } catch (error) {
            if (disposed || current !== generation) return;
            snapshot = undefined; message.textContent = knownRepositoryError((error as { code?: unknown })?.code).message;
        }
        render();
        if (connected() && snapshot!.connection.generation !== retainedGeneration) {
            retainedGeneration = snapshot!.connection.generation;
            void loadRetained();
        }
        if (pollTimer !== undefined) window.clearTimeout(pollTimer);
        if (!disposed && (snapshot?.connection.state === "connecting" || cloning())) pollTimer = window.setTimeout(() => { void refreshState(); }, 1000);
    }

    async function loadRetained() {
        const expected = retainedGeneration;
        try {
            const result = await api.call<{ items: Retained }>("preparations");
            if (!disposed && connected() && expected === retainedGeneration) { retained = result.items; renderRetained(); }
        } catch { if (!disposed && expected === retainedGeneration) { retained = []; renderRetained(); } }
    }

    async function changeConnection(connectingNow: boolean) {
        if (disposed || connecting) return;
        connecting = true; message.textContent = ""; render();
        try {
            await remoteApi.call(connectingNow ? "connect" : "disconnect", {}, {});
            if (!connectingNow) { discardSelection(); operation = undefined; retained = []; retainedGeneration = undefined; suggestions = emptyCollection(); matches = emptyCollection(); }
            await refreshState();
        } catch (error) { if (!disposed) message.textContent = safeError(error); }
        finally { connecting = false; render(); }
    }

    async function selectRepository(repository: RepositorySummary) {
        if (!snapshot || selecting || submitting || cloning() || disposed) return;
        const current = ++selectionGeneration; selecting = true; setPopup(false); message.textContent = "Checking repository...";
        try {
            const result = await api.call<Selection>("selection", {}, { repositoryId: repository.id, contextId: snapshot.localContext.contextId });
            if (disposed || current !== selectionGeneration) return;
            selection = result; operation = undefined; message.textContent = "";
            if (expiryTimer !== undefined) window.clearTimeout(expiryTimer);
            if (result.expiresAt) expiryTimer = window.setTimeout(() => {
                if (selection === result) { result.confirmation = null; message.textContent = "Confirmation expired. Select the repository again."; render(); }
            }, Math.max(0, Math.min(120_000, result.expiresAt - Date.now())));
        } catch (error) { if (!disposed && current === selectionGeneration) message.textContent = safeError(error); }
        finally { if (current === selectionGeneration) selecting = false; render(); }
    }

    async function confirmClone() {
        if (!selection?.confirmation || !snapshot?.host.canPrepareRemote || submitting || disposed) return;
        const current = selection;
        submitting = true; message.textContent = "Starting repository preparation..."; render();
        try {
            operation = await api.call<Operation>("clone", {}, { selectionId: current.selectionId, confirmation: current.confirmation, requestId: requestId() });
            if (disposed) return;
            discardSelection(); message.textContent = "";
            await refreshState();
        } catch (error) { if (!disposed) { current.confirmation = null; message.textContent = safeError(error); } }
        finally { submitting = false; render(); }
    }

    async function cancelSelection() {
        if (!selection || submitting || disposed) return;
        const current = selection;
        submitting = true; render();
        try {
            if (current.expiresAt) await api.call(`operations/${current.operationId}/cancel`, {}, { requestId: requestId() });
            if (disposed) return;
            discardSelection();
        } catch (error) { if (!disposed) { current.confirmation = null; message.textContent = safeError(error); } }
        finally { submitting = false; render(); if (!selection) { search.focus(); setPopup(true); renderCollection(); } }
    }

    async function cancelClone() {
        if (!operation || !cloning() || submitting || disposed) return;
        submitting = true; render();
        try { operation = await api.call<Operation>(`operations/${operation.operationId}/cancel`, {}, { requestId: requestId() }); }
        catch (error) { if (!disposed) message.textContent = safeError(error); }
        finally { submitting = false; render(); }
    }

    async function retryHandoff(operationId: string) {
        if (disposed || submitting || !snapshot?.host.canHandoff || !snapshot.host.canPrepareRemote) return;
        submitting = true; message.textContent = "Checking retained preparation..."; render();
        try {
            await refreshState();
            if (!snapshot?.host.canHandoff || !snapshot.host.canPrepareRemote) return;
            operation = await api.call<Operation>(`operations/${operationId}/handoff`, {}, { contextId: snapshot.localContext.contextId, requestId: requestId() });
            await refreshState();
        } catch (error) {
            if (!disposed) { message.textContent = safeError(error); await refreshState(); }
        } finally { submitting = false; render(); }
    }

    async function open(directEntry: boolean) {
        if (disposed || opening || (!directEntry && (opened || !snapshot?.host.canOpenCurrent))) return;
        opening = true; message.textContent = "Opening canvas..."; render();
        try {
            const body = directEntry ? { requestId: requestId() } : { contextId: snapshot!.localContext.contextId, requestId: requestId() };
            await api.call(directEntry ? "direct" : "local", {}, body);
            if (disposed) return;
            opened = true;
        } catch (error) { if (!disposed) message.textContent = knownRepositoryError((error as { code?: unknown })?.code).message; }
        finally { opening = false; render(); }
    }

    search.addEventListener("input", changedQuery);
    search.addEventListener("focus", () => {
        setPopup(true); renderCollection();
        if (!collection().loaded && !collection().loading && !search.value.trim()) void loadCollection();
    });
    search.addEventListener("keydown", event => {
        if (event.key === "Escape") { event.preventDefault(); setPopup(false); return; }
        const items = collection().items;
        if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault(); setPopup(true);
            if (items.length) activeIndex = event.key === "ArrowDown" ? (activeIndex + 1) % items.length : (activeIndex - 1 + items.length) % items.length;
            renderCollection(); results.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
        } else if (event.key === "Enter" && popupOpen && items[activeIndex]) {
            event.preventDefault(); void selectRepository(items[activeIndex]!);
        }
    });
    const outside = (event: Event) => { if (!element(".entry-search-wrap").contains(event.target as Node)) setPopup(false); };
    document.addEventListener("pointerdown", outside);

    await refreshState();
    if (!opening && !opened && snapshot?.configuration === "configured" && snapshot.connection.state === "disconnected" && snapshot.connection.generation === 0) {
        void changeConnection(true);
    }
    return {
        refresh: refreshState,
        receive(state: EntrySnapshot) { if (!disposed) { generation++; applySnapshot(state); render(); } },
        dispose() {
            disposed = true; generation++; selectionGeneration++; discoveryGeneration++;
            for (const timer of [queryTimer, pollTimer, expiryTimer]) if (timer !== undefined) window.clearTimeout(timer);
            discoveryRequest?.abort(); api.abort(); remoteApi.abort(); document.removeEventListener("pointerdown", outside); container.replaceChildren();
        },
    };
}