import { createElement as icon, ArrowLeft, Check, ChevronDown, ChevronRight, Copy, Download, FileText, Folder, FolderOpen, GitBranch, LogIn, LogOut, MoreHorizontal, PanelLeft, RefreshCw, Search, X } from "lucide";
import type { CloneState } from "../clone.ts";
import { knownRepositoryError } from "../errors.ts";
import type { ArtifactRoot, ItemPage, RepositoryContext, RepositoryDetail, RepositoryPage } from "../types.ts";
import { createRepositoryApi } from "./api.ts";
import type { BrowserSnapshot } from "./api.ts";
import { createRemoteReader } from "./remote-reader.ts";
import type { ReaderMount } from "./remote-reader.ts";
import { rootKey, visibleRepositoryNodes } from "./tree.ts";
import type { BrowserNode, TreePage } from "./tree.ts";

interface Collection extends RepositoryPage { initialized: boolean; loading: boolean; error: string; query: string }
const emptyCollection = (query = ""): Collection => ({ query, initialized: false, loading: false, error: "", items: [], cursor: null, hasMore: false, outcome: "ready" });
const normalize = (query: string) => query.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
const statusLabels: Record<string, string> = { enabled: "Spec Kit", not_enabled: "Not configured", unscannable: "No branch", unavailable: "Unavailable" };

export async function mountRepositoryBrowser({ container, localHeader, localLayout, loadReader, request, onLocalContext = () => undefined }: {
    container: HTMLElement;
    localHeader: HTMLElement;
    localLayout: HTMLElement;
    loadReader: () => Promise<ReaderMount>;
    request?: typeof fetch;
    onLocalContext?: (id: string | undefined) => void;
}) {
    const document = container.ownerDocument;
    const window = document.defaultView!;
    const controlApi = createRepositoryApi({ document, request });
    const api = createRepositoryApi({ document, request });
    let snapshot = await controlApi.call<BrowserSnapshot>("connection");
    onLocalContext(snapshot.configuration === "configured" ? snapshot.localContext.contextId : undefined);
    if (snapshot.configuration !== "configured") {
        container.hidden = true;
        return { receive() {}, dispose() { api.abort(); controlApi.abort(); } };
    }
    container.hidden = false;
    container.className = "repo-browser";
    container.innerHTML = `<div class="repo-toolbar" role="group" aria-label="Repository connection">
        <div class="repo-toolbar-start"></div><div class="repo-search-wrap"><input class="repo-search" type="search" role="combobox" aria-label="Search readable project repositories" aria-autocomplete="none" aria-haspopup="tree" aria-expanded="false" aria-controls="repo-popup-tree" placeholder="Search repositories" autocomplete="off" spellcheck="false" maxlength="256"><span class="repo-search-actions"></span></div>
        <div class="repo-connection-actions"></div><div class="repo-account" aria-label="Microsoft account" role="status"></div>
        </div><div class="repo-workspace"><div class="repo-rail" role="complementary" aria-label="Repository rail"><div class="repo-rail-heading"><strong class="repo-list-title">My team repositories</strong><span class="repo-count"></span></div><div class="repo-rail-tree repo-tree" id="repo-rail-tree" role="tree" aria-label="Repositories"></div><div class="repo-rail-footer"></div></div>
        <div class="repo-main"><div class="repo-local"></div><div class="repo-remote" hidden><div class="repo-remote-heading"><div><h2 class="repo-selected-title">Repository</h2><div class="repo-source-stamp"></div></div><div class="repo-selected-actions"></div></div><div class="repo-preview-scroll"><div class="repo-preview"></div></div></div></div></div>
        <div class="repo-popup" hidden><div class="repo-popup-tree repo-tree" id="repo-popup-tree" role="tree" aria-label="Repository search results"></div><div class="repo-popup-footer"></div></div><div class="repo-message" role="status" aria-live="polite"></div>`;
    const element = <ElementType extends HTMLElement>(selector: string) => container.querySelector<ElementType>(selector)!;
    const search = element<HTMLInputElement>(".repo-search");
    const popup = element<HTMLElement>(".repo-popup");
    const popupTree = element<HTMLElement>(".repo-popup-tree");
    const railTree = element<HTMLElement>(".repo-rail-tree");
    const local = element<HTMLElement>(".repo-local");
    const remote = element<HTMLElement>(".repo-remote");
    const message = element<HTMLElement>(".repo-message");
    const preview = element<HTMLElement>(".repo-preview");
    const previewScroll = element<HTMLElement>(".repo-preview-scroll");
    local.append(localHeader, localLayout);
    const listeners: (() => void)[] = [];
    let disposed = false;
    let query = "";
    let pendingSearch = false;
    let personal = emptyCollection();
    let searched = emptyCollection();
    let collectionGeneration = 0;
    let selectionGeneration = 0;
    let context: RepositoryContext | undefined;
    let activeKey = "";
    let popupOpen = false;
    let returnSurface: "popup" | "rail" = "popup";
    let returnKey = "";
    let searchTimer: number | undefined;
    let collectionController: AbortController | undefined;
    let nodes: BrowserNode[] = [];
    let statusActive = 0;
    const statusQueue: string[] = [];
    const statusRequested = new Set<string>();
    const details = new Map<string, RepositoryDetail>();
    const roots = new Map<ArtifactRoot, TreePage>();
    const expanded = new Set<string>();
    const rowMaps = { popup: new Map<string, HTMLElement>(), rail: new Map<string, HTMLElement>() };
    const currentCollection = () => query ? searched : personal;
    let cloneOperationId: string | undefined;
    let cloneConfirmation: (CloneState & { confirmation: string; accountLabel: string }) | undefined;
    let cloneState: CloneState | undefined;
    let cloneStatusLoading = false;
    let cloneStatusAgain = false;

    function listen(target: EventTarget, type: string, handler: EventListener) {
        target.addEventListener(type, handler);
        listeners.push(() => target.removeEventListener(type, handler));
    }

    function button(label: string, glyph: Parameters<typeof icon>[0], action: () => void, className = "repo-icon-button") {
        const control = document.createElement("button");
        control.type = "button"; control.className = className; control.title = label; control.setAttribute("aria-label", label);
        control.append(icon(glyph, { width: "16", height: "16", "aria-hidden": "true" }));
        control.addEventListener("click", action);
        return control;
    }

    const toggleRail = button("Toggle repository rail", PanelLeft, () => {
        container.classList.toggle("repo-rail-collapsed"); container.classList.toggle("repo-rail-mobile-open");
        toggleRail.setAttribute("aria-expanded", String(!container.classList.contains("repo-rail-collapsed")));
    });
    toggleRail.setAttribute("aria-controls", "repo-rail-tree");
    const localButton = button("Return to local workspace", FolderOpen, () => { void selectLocal(); });
    element(".repo-toolbar-start").append(toggleRail, localButton);
    const clear = button("Clear repository search", X, () => { search.value = ""; changeSearch(); search.focus(); });
    element(".repo-search-actions").append(icon(Search, { width: "16", height: "16", "aria-hidden": "true" }), clear);
    const connect = button("Connect Microsoft account", LogIn, () => { void connectAccount(); });
    const disconnect = button("Disconnect Microsoft account", LogOut, () => { void disconnectAccount(); });
    element(".repo-connection-actions").append(connect, disconnect);
    const refreshList = button("Refresh repositories", RefreshCw, () => { currentCollection().initialized = false; void loadCollection(false); });
    element(".repo-rail-heading").append(refreshList);
    const back = button("Back to repository", ArrowLeft, () => returnToRepository());
    const refresh = button("Refresh repository revision", RefreshCw, () => { void refreshContext(); });
    const clone = button("Prepare local clone", Download, () => { void confirmClone(); });
    element(".repo-selected-actions").append(back, refresh, clone);
    const cloneStatus = document.createElement("div"); cloneStatus.className = "repo-clone-status"; cloneStatus.hidden = true; cloneStatus.setAttribute("role", "status");
    const cloneText = document.createElement("span");
    const clonePath = document.createElement("code");
    const cloneCancel = button("Cancel repository preparation", X, () => { if (cloneOperationId) void api.call("clone/cancel", {}, { operationId: cloneOperationId }).then(() => updateClone()).catch(showError); });
    const copyPath = button("Copy prepared folder path", Copy, () => {
        if (cloneState?.state === "prepared_for_manual_open") void window.navigator.clipboard.writeText(cloneState.destination).then(() => { message.textContent = "Folder path copied."; }).catch(showError);
    });
    cloneStatus.append(cloneText, clonePath, cloneCancel, copyPath); remote.insertBefore(cloneStatus, previewScroll);
    const dialog = document.createElement("dialog"); dialog.className = "repo-clone-dialog"; dialog.setAttribute("aria-label", "Confirm repository clone");
    const dialogHeading = document.createElement("h2"); dialogHeading.textContent = "Prepare local clone";
    const dialogDetails = document.createElement("dl");
    const dialogActions = document.createElement("div"); dialogActions.className = "repo-dialog-actions";
    const decline = button("Cancel clone confirmation", X, () => { void dismissClone(); }, "repo-command"); decline.append(document.createTextNode("Cancel"));
    const approve = button("Confirm clone", Check, () => { void startClone(); }, "repo-command"); approve.append(document.createTextNode("Confirm clone"));
    dialogActions.append(decline, approve); dialog.append(dialogHeading, dialogDetails, dialogActions); container.append(dialog);
    listen(dialog, "cancel", (event) => { event.preventDefault(); void dismissClone(); });

    const reader = createRemoteReader({ container: preview, scrollElement: previewScroll, api, loadReader,
        onReturn: returnToRepository,
        onDocument: () => { back.hidden = false; },
        onError: (code) => {
            if (!["resource_unavailable", "invalid_context", "connection_required"].includes(code)) return;
            const id = context?.repository.id;
            context = undefined; roots.clear();
            if (id) { personal.items = personal.items.filter((item) => item.id !== id); searched.items = searched.items.filter((item) => item.id !== id); details.delete(id); }
            element(".repo-selected-title").textContent = "Repository unavailable";
            element(".repo-source-stamp").textContent = "";
            renderTrees();
        },
    });
    reader.clear();

    function showError(error: unknown) { message.textContent = knownRepositoryError((error as { code?: unknown })?.code).message; }

    function placePopup() {
        if (!popupOpen) return;
        const bounds = search.getBoundingClientRect();
        const width = Math.min(560, window.innerWidth - 16);
        const top = Math.max(8, Math.min(bounds.bottom + 4, window.innerHeight - 120));
        popup.style.width = `${width}px`;
        popup.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8))}px`;
        popup.style.top = `${top}px`;
        popup.style.maxHeight = `${Math.max(80, Math.min(window.innerHeight * 0.6, window.innerHeight - top - 8))}px`;
    }

    function setPopup(open: boolean) {
        popupOpen = open && snapshot.connection.state === "connected";
        popup.hidden = !popupOpen; search.setAttribute("aria-expanded", String(popupOpen));
        if (!popupOpen) search.removeAttribute("aria-activedescendant");
        placePopup(); renderTrees();
    }

    function paint(tree: HTMLElement, surface: "popup" | "rail") {
        const scroll = tree.scrollTop;
        const focused = document.activeElement instanceof window.HTMLElement && tree.contains(document.activeElement) ? document.activeElement.dataset.nodeKey : undefined;
        const maps = rowMaps[surface]; maps.clear();
        const fragment = document.createDocumentFragment();
        const start = nodes.length > 200 ? Math.max(0, Math.floor(scroll / 32) - 8) : 0;
        const count = nodes.length > 200 ? Math.min(200, Math.ceil((tree.clientHeight || 400) / 32) + 16) : nodes.length;
        if (start) { const spacer = document.createElement("div"); spacer.style.height = `${start * 32}px`; spacer.setAttribute("role", "presentation"); fragment.append(spacer); }
        for (const node of nodes.slice(start, start + count)) {
            const row = document.createElement("div");
            row.id = `repo-${surface}-${encodeURIComponent(node.key)}`;
            row.className = "repo-node"; row.dataset.nodeKey = node.key; row.dataset.kind = node.kind;
            row.dataset.status = node.status ?? "";
            row.setAttribute("role", "treeitem"); row.setAttribute("aria-level", String(node.level));
            row.setAttribute("aria-selected", String(node.key === activeKey));
            if (node.expanded !== undefined) row.setAttribute("aria-expanded", String(node.expanded));
            row.style.paddingLeft = `${8 + Math.min(node.level - 1, 12) * 16}px`;
            row.tabIndex = surface === "rail" && (node.key === activeKey || (!activeKey && node === nodes[0])) ? 0 : -1;
            const glyph = node.kind === "repository" ? GitBranch : node.kind === "file" ? FileText : node.kind === "more" ? MoreHorizontal : node.expanded ? FolderOpen : Folder;
            if (node.expanded !== undefined) row.append(icon(node.expanded ? ChevronDown : ChevronRight, { width: "12", height: "12", "aria-hidden": "true" }));
            row.append(icon(glyph, { width: "16", height: "16", "aria-hidden": "true" }));
            const label = document.createElement("span"); label.className = "repo-node-label"; label.textContent = node.label;
            row.append(label); row.title = node.label;
            if (node.status) { const badge = document.createElement("small"); badge.textContent = statusLabels[node.status] ?? ""; row.append(badge); }
            if (surface === "popup") row.addEventListener("mousedown", (event) => event.preventDefault());
            row.addEventListener("click", () => { activeKey = node.key; void activate(node, surface); });
            maps.set(node.key, row); fragment.append(row);
        }
        const remaining = nodes.length - start - count;
        if (remaining > 0) { const spacer = document.createElement("div"); spacer.style.height = `${remaining * 32}px`; spacer.setAttribute("role", "presentation"); fragment.append(spacer); }
        tree.replaceChildren(fragment); tree.scrollTop = scroll;
        if (focused) maps.get(focused)?.focus({ preventScroll: true });
        if (surface === "popup" && popupOpen) {
            const active = maps.get(activeKey);
            if (active) search.setAttribute("aria-activedescendant", active.id); else search.removeAttribute("aria-activedescendant");
        }
    }

    function collectionMessage() {
        const collection = currentCollection();
        if (snapshot.connection.state !== "connected") return "Microsoft account not connected.";
        if (pendingSearch) return "Waiting for typing to pause...";
        if (collection.loading && !collection.items.length) return query ? "Searching repositories..." : "Finding team repositories...";
        if (collection.error) return collection.error;
        if (collection.items.length) return "";
        if (collection.outcome === "no_associations") return "No team-owned areas.";
        if (collection.outcome === "no_linked_repositories") return "No team-linked repositories.";
        if (collection.outcome === "scanning") return "Checking team-linked repositories...";
        return query ? "No matching repositories." : "No team repositories loaded.";
    }

    function renderTrees() {
        if (disposed) return;
        const collection = currentCollection();
        nodes = pendingSearch ? [] : visibleRepositoryNodes({ repositories: collection.items, context, roots, expanded, details });
        paint(railTree, "rail"); paint(popupTree, "popup");
        element(".repo-list-title").textContent = query ? "Project repositories" : "My team repositories";
        element(".repo-count").textContent = pendingSearch ? "" : String(collection.items.length);
        for (const selector of [".repo-rail-footer", ".repo-popup-footer"]) {
            const footer = element(selector); footer.replaceChildren();
            const summary = document.createElement("span"); summary.textContent = collectionMessage(); footer.append(summary);
            if (collection.hasMore || collection.error) {
                const more = button(collection.error ? "Retry repository collection" : "Load more repositories", collection.error ? RefreshCw : MoreHorizontal,
                    () => { void loadCollection(!collection.error && collection.initialized); }, "repo-command");
                const label = document.createElement("span"); label.textContent = collection.error ? "Retry" : "Load more"; more.append(label);
                more.disabled = collection.loading || pendingSearch; footer.append(more);
            }
        }
        clear.hidden = !search.value;
        railTree.setAttribute("aria-busy", String(collection.loading || pendingSearch));
        popupTree.setAttribute("aria-busy", String(collection.loading || pendingSearch));
        for (const node of nodes.slice(0, 200)) {
            if (node.kind !== "repository" || details.has(node.repository.id) || statusRequested.has(node.repository.id)) continue;
            statusRequested.add(node.repository.id); statusQueue.push(node.repository.id);
        }
        pumpStatuses();
    }

    function pumpStatuses() {
        while (!disposed && statusActive < 4 && statusQueue.length && snapshot.connection.state === "connected") {
            const id = statusQueue.shift()!;
            const epoch = snapshot.connection.generation;
            statusActive++;
            void api.call<RepositoryDetail>("detail", { repositoryId: id }).then((detail) => {
                if (epoch === snapshot.connection.generation && snapshot.connection.state === "connected") details.set(id, detail);
            }).catch(() => undefined).finally(() => { statusActive--; if (!disposed) renderTrees(); });
        }
    }

    async function loadCollection(append: boolean, automaticPages = 0) {
        if (snapshot.connection.state !== "connected" || pendingSearch) return;
        const collection = currentCollection();
        if (collection.loading) return;
        const epoch = collectionGeneration;
        const account = snapshot.connection.generation;
        collection.loading = true; collection.error = "";
        collectionController?.abort(); collectionController = new AbortController();
        renderTrees();
        try {
            const data = await api.call<RepositoryPage>(query ? "search" : "relevant", { ...(query ? { q: query } : {}), ...(append && collection.cursor ? { cursor: collection.cursor } : {}) }, undefined, collectionController.signal);
            if (epoch !== collectionGeneration || account !== snapshot.connection.generation || disposed) return;
            collection.items = [...new Map([...(append ? collection.items : []), ...data.items].map((item) => [item.id, item])).values()];
            collection.cursor = data.cursor; collection.hasMore = data.hasMore; collection.outcome = data.outcome; collection.initialized = true;
        } catch (error) {
            if (epoch === collectionGeneration && account === snapshot.connection.generation) collection.error = knownRepositoryError((error as { code?: unknown })?.code).message;
        } finally {
            collection.loading = false;
            if (epoch === collectionGeneration && account === snapshot.connection.generation) {
                renderTrees();
                if (!query && collection.outcome === "scanning" && collection.hasMore && !collection.error && automaticPages < 2) void loadCollection(true, automaticPages + 1);
            }
        }
    }

    function changeSearch() {
        if (searchTimer !== undefined) window.clearTimeout(searchTimer);
        collectionGeneration++; collectionController?.abort(); pendingSearch = true;
        const normalized = normalize(search.value);
        const commit = () => {
            query = normalized; pendingSearch = false;
            if (query && searched.query !== query) searched = emptyCollection(query);
            activeKey = ""; renderTrees();
            if (!currentCollection().initialized) void loadCollection(false);
        };
        renderTrees(); setPopup(true);
        if (!normalized || normalized === query) commit(); else searchTimer = window.setTimeout(commit, 1000);
    }

    async function loadRoot(root: ArtifactRoot, append = false) {
        if (!context) return;
        const activeContext = context;
        const epoch = selectionGeneration;
        const page = roots.get(root) ?? { items: [], cursor: null, loaded: false, loading: false };
        if (page.loading || (page.loaded && !append)) return;
        page.loading = true; roots.set(root, page); message.textContent = "Loading artifact tree...";
        try {
            const data = await api.call<ItemPage>("items", { contextId: activeContext.contextId, root, ...(append && page.cursor ? { cursor: page.cursor } : {}) });
            if (epoch !== selectionGeneration || context?.contextId !== activeContext.contextId || disposed) return;
            page.items = [...new Map([...(append ? page.items : []), ...data.items].map((item) => [item.id, item])).values()];
            page.cursor = data.cursor; page.loaded = true; message.textContent = page.items.length ? "" : "No artifacts in this root.";
        } catch (error) { if (epoch === selectionGeneration) showError(error); }
        finally { page.loading = false; if (epoch === selectionGeneration) renderTrees(); }
    }

    async function activate(node: BrowserNode, surface: "popup" | "rail") {
        message.textContent = "";
        if (node.kind === "repository") {
            if (context?.repository.id === node.repository.id && expanded.has(node.key)) { expanded.delete(node.key); renderTrees(); return; }
            const epoch = ++selectionGeneration;
            roots.clear(); reader.clear(); context = undefined; expanded.add(node.key);
            message.textContent = "Opening repository...";
            try {
                const next = await api.call<RepositoryContext>("context", {}, { repositoryId: node.repository.id });
                if (epoch !== selectionGeneration || disposed) return;
                context = next; details.set(next.repository.id, next.repository);
                local.hidden = true; remote.hidden = false;
                element(".repo-selected-title").textContent = next.repository.name;
                element(".repo-source-stamp").textContent = `${next.repository.defaultBranch?.slice(11)} / ${next.sourceVersion.slice(0, 12)}`;
                message.textContent = next.roots.length ? "" : "Spec Kit is not configured in this repository.";
                renderTrees(); placePopup();
            } catch (error) { if (epoch === selectionGeneration) showError(error); }
        } else if (node.kind === "root" || node.kind === "folder") {
            if (expanded.has(node.key)) expanded.delete(node.key); else expanded.add(node.key);
            renderTrees();
            if (node.kind === "root" && expanded.has(node.key)) await loadRoot(node.root!);
        } else if (node.kind === "more") await loadRoot(node.root!, true);
        else if (context && node.item) {
            returnSurface = surface; returnKey = node.key; setPopup(false);
            local.hidden = true; remote.hidden = false; container.classList.remove("repo-rail-mobile-open");
            await reader.open(context.contextId, node.item.id);
        }
    }

    function returnToRepository() {
        reader.clear(); back.hidden = true; activeKey = returnKey;
        if (returnSurface === "popup") { setPopup(true); search.focus(); }
        else { renderTrees(); rowMaps.rail.get(returnKey)?.focus({ preventScroll: true }); }
    }

    async function selectLocal() {
        selectionGeneration++; context = undefined; roots.clear(); reader.clear(); setPopup(false);
        try { receive(await controlApi.call<BrowserSnapshot>("local", {}, {})); localHeader.querySelector<HTMLElement>("h1")?.focus(); }
        catch (error) { showError(error); }
    }

    async function refreshContext() {
        if (!context) return;
        const selected = context.contextId;
        const epoch = ++selectionGeneration;
        reader.clear(); roots.clear();
        try {
            const next = await api.call<RepositoryContext>("refresh", {}, { contextId: selected });
            if (epoch !== selectionGeneration) return;
            context = next; element(".repo-source-stamp").textContent = `${next.repository.defaultBranch?.slice(11)} / ${next.sourceVersion.slice(0, 12)}`;
            renderTrees();
            for (const root of next.roots) if (expanded.has(rootKey(next.repository.id, root))) void loadRoot(root);
        } catch (error) { if (epoch === selectionGeneration) showError(error); }
    }

    async function confirmClone() {
        if (!context || !snapshot.capabilities.clone) return;
        const selected = context.contextId;
        const epoch = selectionGeneration;
        clone.disabled = true;
        try {
            const confirmation = await api.call<CloneState & { confirmation: string; accountLabel: string }>("clone/confirm", {}, { contextId: selected });
            if (epoch !== selectionGeneration || context?.contextId !== selected || disposed) return;
            cloneConfirmation = confirmation; dialogDetails.replaceChildren();
            for (const [label, value] of [["Repository", confirmation.repositoryName], ["Microsoft account", confirmation.accountLabel],
                ["Source branch", confirmation.branch], ["Source commit", confirmation.sourceCommit], ["New local branch", confirmation.localBranch], ["New folder", confirmation.destination]]) {
                const term = document.createElement("dt"); term.textContent = label!;
                const detail = document.createElement("dd"); detail.textContent = value!; dialogDetails.append(term, detail);
            }
            approve.disabled = false; setPopup(false); dialog.showModal(); decline.focus();
        } catch (error) { showError(error); }
        finally { clone.disabled = false; }
    }

    async function dismissClone() {
        const confirmation = cloneConfirmation; cloneConfirmation = undefined; dialog.close();
        if (confirmation) { try { await api.call("clone/cancel", {}, { operationId: confirmation.operationId }); } catch { return; } }
    }

    async function startClone() {
        const confirmation = cloneConfirmation;
        if (!confirmation) return;
        approve.disabled = true;
        try {
            cloneOperationId = confirmation.operationId;
            cloneState = await api.call<CloneState>("clone", {}, { operationId: confirmation.operationId, confirmation: confirmation.confirmation });
            cloneConfirmation = undefined; dialog.close(); showCloneState(); await updateClone();
        } catch (error) { showError(error); approve.disabled = false; }
    }

    function showCloneState() {
        cloneStatus.hidden = !cloneState;
        if (!cloneState) return;
        const labels: Record<CloneState["state"], string> = { awaiting_confirmation: "Awaiting confirmation", preparing: "Cloning repository...", verifying: "Verifying source commit...",
            prepared_for_manual_open: "Prepared for manual opening in Copilot App", cancelled: "Repository preparation cancelled", failed: "Repository preparation failed" };
        cloneText.textContent = labels[cloneState.state];
        const prepared = cloneState.state === "prepared_for_manual_open";
        clonePath.textContent = prepared ? cloneState.destination : ""; copyPath.hidden = !prepared;
        cloneCancel.hidden = !["preparing", "verifying"].includes(cloneState.state);
        clone.disabled = !cloneCancel.hidden;
    }

    async function updateClone() {
        if (!cloneOperationId || snapshot.connection.state !== "connected" || disposed) return;
        if (cloneStatusLoading) { cloneStatusAgain = true; return; }
        const id = cloneOperationId;
        cloneStatusLoading = true;
        try {
            const next = await api.call<CloneState>("clone", { operationId: id });
            if (id !== cloneOperationId || disposed) return;
            cloneState = next; showCloneState();
        } catch (error) { if (id === cloneOperationId) showError(error); }
        finally { cloneStatusLoading = false; if (cloneStatusAgain) { cloneStatusAgain = false; void updateClone(); } }
    }

    async function connectAccount() {
        message.textContent = "";
        try { await controlApi.call("connect", {}, {}); receive(await controlApi.call<BrowserSnapshot>("connection")); }
        catch (error) { showError(error); }
    }

    async function disconnectAccount() {
        clearRemoteState();
        try { receive(await controlApi.call<BrowserSnapshot>("disconnect", {}, {})); }
        catch (error) { showError(error); }
    }

    function clearRemoteState() {
        collectionGeneration++; selectionGeneration++; api.abort(); collectionController?.abort();
        if (searchTimer !== undefined) window.clearTimeout(searchTimer);
        reader.clear(); context = undefined; roots.clear(); details.clear(); expanded.clear(); statusQueue.length = 0; statusRequested.clear();
        cloneOperationId = undefined; cloneConfirmation = undefined; cloneState = undefined; cloneStatus.hidden = true;
        clonePath.textContent = ""; dialogDetails.replaceChildren(); if (dialog.open) dialog.close();
        personal = emptyCollection(); searched = emptyCollection(); query = ""; search.value = ""; pendingSearch = false; activeKey = "";
        element(".repo-selected-title").textContent = "Repository"; element(".repo-source-stamp").textContent = "";
        setPopup(false);
    }

    function receive(next: BrowserSnapshot) {
        if (disposed) return;
        const before = snapshot.connection.state;
        if (next.connection.generation !== snapshot.connection.generation || next.connection.state !== "connected") clearRemoteState();
        snapshot = next;
        onLocalContext(next.localContext.contextId);
        const connected = next.connection.state === "connected";
        container.classList.toggle("repo-connected", connected);
        connect.hidden = connected; connect.disabled = next.connection.state === "connecting";
        disconnect.hidden = next.connection.state === "disconnected";
        search.disabled = !connected; toggleRail.disabled = !connected; refreshList.disabled = !connected;
        element(".repo-account").textContent = connected ? next.connection.accountLabel ?? "Microsoft account" : next.connection.state === "connecting" ? "Connecting Microsoft account..." : "Microsoft account not connected";
        localButton.title = `Local workspace: ${next.localContext.label}`;
        clone.hidden = !next.capabilities.clone;
        local.hidden = next.mode !== "local"; remote.hidden = next.mode === "local";
        if (next.connection.error) message.textContent = next.connection.error.message;
        renderTrees();
        if (connected && (before !== "connected" || !currentCollection().initialized)) void loadCollection(false);
        if (connected && cloneOperationId) void updateClone();
    }

    function keyboard(event: KeyboardEvent, surface: "popup" | "rail") {
        if (event.key === "Escape" && surface === "popup") { event.preventDefault(); event.stopPropagation(); setPopup(false); return; }
        if (surface === "popup" && !popupOpen) { if (event.key !== "ArrowDown") return; setPopup(true); }
        if (!nodes.length || pendingSearch) return;
        const index = nodes.findIndex((node) => node.key === activeKey);
        const node = nodes[Math.max(0, index)]!;
        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const target = event.key === "Home" ? 0 : event.key === "End" ? nodes.length - 1 : Math.max(0, Math.min(nodes.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
            activeKey = nodes[target]!.key;
            const tree = surface === "popup" ? popupTree : railTree;
            if (target * 32 < tree.scrollTop || (target + 1) * 32 > tree.scrollTop + (tree.clientHeight || 400)) tree.scrollTop = Math.max(0, target * 32 - 64);
            paint(tree, surface); if (surface === "rail") rowMaps.rail.get(activeKey)?.focus({ preventScroll: true });
        } else if (event.key === "Enter" || (event.key === "ArrowRight" && node.expanded === false)) {
            event.preventDefault(); activeKey = node.key; void activate(node, surface);
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (node.expanded) { expanded.delete(node.key); renderTrees(); }
            else if (node.parentKey) { activeKey = node.parentKey; renderTrees(); if (surface === "rail") rowMaps.rail.get(activeKey)?.focus({ preventScroll: true }); }
        }
    }

    listen(search, "input", () => changeSearch());
    listen(search, "focus", () => setPopup(true));
    listen(search, "click", () => setPopup(true));
    listen(search, "keydown", (event) => keyboard(event as KeyboardEvent, "popup"));
    listen(railTree, "keydown", (event) => keyboard(event as KeyboardEvent, "rail"));
    listen(railTree, "scroll", () => paint(railTree, "rail"));
    listen(popupTree, "scroll", () => paint(popupTree, "popup"));
    listen(document, "mousedown", (event) => { const target = event.target as Node | null; if (target && !popup.contains(target) && !search.parentElement!.contains(target)) setPopup(false); });
    listen(window, "resize", () => { placePopup(); renderTrees(); });
    receive(snapshot);
    return { receive, dispose() {
        disposed = true; api.abort(); controlApi.abort(); collectionController?.abort();
        if (searchTimer !== undefined) window.clearTimeout(searchTimer);
        for (const remove of listeners) remove(); reader.dispose();
        if (dialog.open) dialog.close();
        container.parentElement?.insertBefore(localHeader, container);
        container.parentElement?.insertBefore(localLayout, container);
        container.replaceChildren(); container.hidden = true;
    } };
}