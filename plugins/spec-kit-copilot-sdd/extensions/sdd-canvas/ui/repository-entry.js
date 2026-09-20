// node_modules/lucide/dist/esm/defaultAttributes.mjs
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

// node_modules/lucide/dist/esm/createElement.mjs
var createSVGElement = ([tag, attrs, children]) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs).forEach((name) => {
    element.setAttribute(name, String(attrs[name]));
  });
  if (children?.length) {
    children.forEach((child) => {
      const childElement = createSVGElement(child);
      element.appendChild(childElement);
    });
  }
  return element;
};
var createElement = (iconNode, customAttrs = {}) => {
  const tag = "svg";
  const attrs = {
    ...defaultAttributes,
    ...customAttrs
  };
  return createSVGElement([tag, attrs, iconNode]);
};

// node_modules/lucide/dist/esm/icons/arrow-right.mjs
var ArrowRight = [
  ["path", { d: "M5 12h14" }],
  ["path", { d: "m12 5 7 7-7 7" }]
];

// node_modules/lucide/dist/esm/icons/clipboard-copy.mjs
var ClipboardCopy = [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
  ["path", { d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" }],
  ["path", { d: "M16 4h2a2 2 0 0 1 2 2v4" }],
  ["path", { d: "M21 14H11" }],
  ["path", { d: "m15 10-4 4 4 4" }]
];

// node_modules/lucide/dist/esm/icons/download.mjs
var Download = [
  ["path", { d: "M12 15V3" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
  ["path", { d: "m7 10 5 5 5-5" }]
];

// node_modules/lucide/dist/esm/icons/external-link.mjs
var ExternalLink = [
  ["path", { d: "M15 3h6v6" }],
  ["path", { d: "M10 14 21 3" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]
];

// node_modules/lucide/dist/esm/icons/folder-open.mjs
var FolderOpen = [
  [
    "path",
    {
      d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
    }
  ]
];

// node_modules/lucide/dist/esm/icons/git-branch.mjs
var GitBranch = [
  ["path", { d: "M15 6a9 9 0 0 0-9 9V3" }],
  ["circle", { cx: "18", cy: "6", r: "3" }],
  ["circle", { cx: "6", cy: "18", r: "3" }]
];

// node_modules/lucide/dist/esm/icons/log-out.mjs
var LogOut = [
  ["path", { d: "m16 17 5-5-5-5" }],
  ["path", { d: "M21 12H9" }],
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
];

// node_modules/lucide/dist/esm/icons/log-in.mjs
var LogIn = [
  ["path", { d: "m10 17 5-5-5-5" }],
  ["path", { d: "M15 12H3" }],
  ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }]
];

// node_modules/lucide/dist/esm/icons/refresh-cw.mjs
var RefreshCw = [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }],
  ["path", { d: "M21 3v5h-5" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }],
  ["path", { d: "M8 16H3v5" }]
];

// node_modules/lucide/dist/esm/icons/search.mjs
var Search = [
  ["path", { d: "m21 21-4.34-4.34" }],
  ["circle", { cx: "11", cy: "11", r: "8" }]
];

// node_modules/lucide/dist/esm/icons/square.mjs
var Square = [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]];

// node_modules/lucide/dist/esm/icons/x.mjs
var X = [
  ["path", { d: "M18 6 6 18" }],
  ["path", { d: "m6 6 12 12" }]
];

// src/errors.ts
var messages = {
  invalid_request: "The repository request is invalid.",
  connection_required: "Connect a Microsoft account to continue.",
  interaction_required: "Microsoft sign-in is required to continue.",
  wrong_tenant: "Use a Microsoft account from the configured organization.",
  insufficient_scope: "The required delegated permission is unavailable.",
  policy_blocked: "Microsoft sign-in is blocked by organizational policy.",
  resource_unavailable: "The requested repository resource is unavailable.",
  invalid_context: "The repository context is no longer valid.",
  expired_cursor: "The repository page expired. Refresh the collection.",
  source_unavailable: "The selected repository revision is unavailable.",
  unsupported_file: "This artifact cannot be previewed as text.",
  file_too_large: "The artifact exceeds the 5 MiB preview limit.",
  rate_limited: "Azure DevOps is temporarily limiting requests. Try again later.",
  clone_conflict: "The repository preparation cannot proceed in this state.",
  clone_cancelled: "Repository preparation was cancelled.",
  remote_read_only: "Open the repository in a verified local session to run workflows.",
  local_context_mismatch: "The workflow does not match this session's local repository.",
  entry_required: "Choose a repository or continue with the current workspace first.",
  source_changed: "The repository's default revision changed. Select it again before confirming.",
  context_changed: "The active workspace changed. Review the repository selection again.",
  confirmation_expired: "Clone confirmation expired. Review and confirm the selection again.",
  session_busy: "The current session is busy. Wait until it is idle, then try again.",
  clone_identity_changed: "The prepared checkout changed. It has been preserved and handoff is blocked.",
  handoff_in_progress: "The repository handoff is still in progress.",
  handoff_unknown: "The handoff outcome is not confirmed. Check its status before trying again.",
  host_handoff_unsupported: "This Copilot App host does not provide the verified repository handoff capability.",
  activity_unknown: "The host's activity state could not be verified. Repository preparation is blocked.",
  canvas_unavailable: "The original Spec Kit canvas is unavailable in the target session.",
  upstream_unavailable: "The repository service is temporarily unavailable."
};
function knownRepositoryError(code) {
  return new RepositoryError(typeof code === "string" && Object.hasOwn(messages, code) ? code : "upstream_unavailable");
}
var RepositoryError = class extends Error {
  code;
  retryAfterSeconds;
  constructor(code, retryAfterSeconds) {
    super(messages[code]);
    this.name = "RepositoryError";
    this.code = code;
    if (Number.isSafeInteger(retryAfterSeconds) && retryAfterSeconds > 0) this.retryAfterSeconds = Math.min(retryAfterSeconds, 3600);
    this.stack = `${this.name}: ${this.message}`;
  }
};

// src/ui/api.ts
function createRepositoryApi({ document: document2, request = globalThis.fetch, namespace = "repositories" }) {
  const base = new URL(document2.location.href);
  const controllers = /* @__PURE__ */ new Set();
  return {
    async call(path, parameters = {}, body, signal) {
      const url = new URL(`/api/${namespace}/${path}`, base);
      const capability = base.searchParams.get("cap");
      if (!capability) throw new RepositoryError("invalid_context");
      url.searchParams.set("cap", capability);
      for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
      const controller = new AbortController();
      controllers.add(controller);
      const combined = AbortSignal.any([controller.signal, AbortSignal.timeout(45e3), ...signal ? [signal] : []]);
      try {
        const response = await request(url, {
          method: body === void 0 ? "GET" : "POST",
          signal: combined,
          headers: body === void 0 ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
          body: body === void 0 ? void 0 : JSON.stringify(body),
          cache: "no-store",
          referrerPolicy: "no-referrer"
        });
        const payload = await response.json();
        if (combined.aborted) throw new RepositoryError("invalid_context");
        if (!response.ok || !payload?.ok) throw knownRepositoryError(payload?.error?.code);
        return payload.data;
      } catch (error) {
        if (error instanceof RepositoryError) throw error;
        throw new RepositoryError(combined.aborted ? "invalid_context" : "upstream_unavailable");
      } finally {
        controllers.delete(controller);
      }
    },
    abort() {
      for (const controller of controllers) controller.abort();
      controllers.clear();
    }
  };
}

// src/ui/repository-entry.ts
async function mountRepositoryEntry({ container, request }) {
  const document2 = container.ownerDocument;
  const window = document2.defaultView;
  const api = createRepositoryApi({ document: document2, request, namespace: "entry" });
  const remoteApi = createRepositoryApi({ document: document2, request });
  let snapshot;
  let selection;
  let operation;
  let retained = [];
  let retainedGeneration;
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
  let queryTimer;
  let pollTimer;
  let expiryTimer;
  let discoveryRequest;
  const emptyCollection = () => ({ items: [], cursor: null, hasMore: false, loading: false, loaded: false, error: null, query: "" });
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
  const element = (selector) => container.querySelector(selector);
  const message = element(".entry-message");
  const search = element(".entry-search");
  const popup = element(".entry-popup");
  const results = element("#entry-results");
  const selectionPanel = element(".entry-selection");
  const operationPanel = element(".entry-operation");
  const retainedPanel = element(".entry-retained");
  const requestId = () => `entry-${window.crypto.randomUUID()}`;
  function button(label, glyph, action, command = false) {
    const control = document2.createElement("button");
    control.type = "button";
    control.className = command ? "entry-command" : "entry-icon";
    control.title = label;
    control.setAttribute("aria-label", label);
    control.append(createElement(glyph, { width: "18", height: "18", "aria-hidden": "true" }));
    if (command) control.append(document2.createTextNode(label));
    control.addEventListener("click", action);
    return control;
  }
  function copyCheckoutPath(path) {
    const copy = button("Copy checkout path", ClipboardCopy, () => {
      void window.navigator.clipboard.writeText(path).then(() => {
        if (!disposed) message.textContent = "Checkout path copied.";
      }).catch(() => {
        if (!disposed) message.textContent = "Clipboard unavailable.";
      });
    });
    copy.dataset.action = "copy-checkout-path";
    copy.disabled = typeof window.navigator.clipboard?.writeText !== "function";
    return copy;
  }
  const direct = button("Open canvas directly", ExternalLink, () => {
    void open(true);
  });
  direct.dataset.action = "direct";
  const local = button("Use current workspace", ArrowRight, () => {
    void open(false);
  }, true);
  local.dataset.action = "local";
  local.disabled = true;
  const refresh = button("Refresh entry state", RefreshCw, () => {
    void refreshState();
  });
  const connect = button("Connect Microsoft account", LogIn, () => {
    void changeConnection(true);
  }, true);
  const disconnect = button("Disconnect Microsoft account", LogOut, () => {
    void changeConnection(false);
  });
  const clear = button("Clear search", X, () => {
    search.value = "";
    changedQuery();
    search.focus();
  });
  clear.dataset.action = "clear-search";
  element(".entry-direct").append(direct);
  element(".entry-local-action").append(local);
  element(".entry-refresh").append(refresh);
  element(".entry-connection").append(connect, disconnect);
  element(".entry-clear").append(clear);
  element(".entry-current-icon").append(createElement(FolderOpen, { width: "24", height: "24" }));
  element(".entry-search-icon").append(createElement(Search, { width: "18", height: "18" }));
  element(".entry-discovery-heading h2").prepend(createElement(GitBranch, { width: "18", height: "18", "aria-hidden": "true" }));
  const connected = () => snapshot?.connection.state === "connected";
  const collection = () => search.value.trim() ? matches : suggestions;
  const cloning = () => operation?.state === "preparing" || operation?.state === "verifying";
  const safeError = (error) => knownRepositoryError(error?.code).message;
  function setPopup(value) {
    popupOpen = value && connected() && !selecting && !submitting && !cloning();
    popup.hidden = !popupOpen;
    search.setAttribute("aria-expanded", String(popupOpen));
    if (!popupOpen) {
      activeIndex = -1;
      search.removeAttribute("aria-activedescendant");
    }
  }
  function renderCollection() {
    const current = collection();
    results.replaceChildren();
    current.items.forEach((repository, index) => {
      const option = document2.createElement("div");
      option.className = "entry-option";
      option.id = `entry-option-${index}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(index === activeIndex));
      option.append(createElement(GitBranch, { width: "18", height: "18", "aria-hidden": "true" }));
      const name = document2.createElement("strong");
      name.textContent = repository.name;
      const state = document2.createElement("span");
      state.textContent = repository.operationalState === "maintenance" ? "Maintenance" : "Repository";
      option.append(name, state);
      option.addEventListener("mousedown", (event) => event.preventDefault());
      option.addEventListener("click", () => {
        void selectRepository(repository);
      });
      results.append(option);
    });
    if (activeIndex >= 0 && current.items[activeIndex]) search.setAttribute("aria-activedescendant", `entry-option-${activeIndex}`);
    else search.removeAttribute("aria-activedescendant");
    element(".entry-results-state").textContent = current.loading ? "Loading repositories..." : current.error ?? (!current.items.length && current.loaded ? search.value.trim() ? "No matching repositories." : "No team-linked repositories." : "");
    const actions = element(".entry-results-actions");
    actions.replaceChildren();
    if (current.error) actions.append(button("Retry repository results", RefreshCw, () => {
      void loadCollection();
    }, true));
    else if (current.hasMore) {
      const more = button("More repositories", ArrowRight, () => {
        void loadCollection(true);
      }, true);
      more.disabled = current.loading;
      actions.append(more);
    }
    setPopup(popupOpen);
  }
  async function loadCollection(append = false) {
    if (!connected() || disposed) return;
    const query = search.value.trim();
    const current = query ? matches : suggestions;
    if (current.loading) return;
    discoveryRequest?.abort();
    discoveryRequest = new AbortController();
    const ownGeneration = ++discoveryGeneration;
    current.loading = true;
    current.error = null;
    renderCollection();
    try {
      const parameters = query ? { q: query } : {};
      if (append && current.cursor) parameters.cursor = current.cursor;
      const page = await remoteApi.call(query ? "search" : "relevant", parameters, void 0, discoveryRequest.signal);
      if (disposed || ownGeneration !== discoveryGeneration || query !== search.value.trim()) return;
      const combined = append ? [...current.items, ...page.items] : page.items;
      current.items = [...new Map(combined.map((item) => [item.id, item])).values()];
      current.cursor = page.cursor;
      current.hasMore = page.hasMore;
      current.loaded = true;
    } catch (error) {
      if (!disposed && ownGeneration === discoveryGeneration) current.error = safeError(error);
    } finally {
      current.loading = false;
      if (!disposed && ownGeneration === discoveryGeneration) renderCollection();
    }
  }
  function discardSelection() {
    selectionGeneration++;
    selecting = false;
    selection = void 0;
    if (expiryTimer !== void 0) window.clearTimeout(expiryTimer);
    selectionPanel.hidden = true;
    selectionPanel.replaceChildren();
  }
  function changedQuery() {
    if (queryTimer !== void 0) window.clearTimeout(queryTimer);
    discoveryGeneration++;
    discoveryRequest?.abort();
    suggestions.loading = false;
    matches.loading = false;
    discardSelection();
    activeIndex = -1;
    matches = { ...emptyCollection(), query: search.value.trim() };
    setPopup(true);
    renderCollection();
    render();
    if (search.value.trim()) queryTimer = window.setTimeout(() => {
      void loadCollection();
    }, 1e3);
    else if (!suggestions.loaded) void loadCollection();
  }
  function renderSelection() {
    selectionPanel.hidden = !selection;
    selectionPanel.replaceChildren();
    if (!selection) return;
    const heading = document2.createElement("h3");
    heading.textContent = selection.repository.name;
    const summary = document2.createElement("dl");
    summary.className = "entry-summary";
    for (const [name, value, field] of [
      ["Account", selection.accountLabel, "account"],
      ["Default branch", selection.repository.defaultBranch ?? "Unavailable", "branch"],
      ["Commit", selection.repository.sourceVersion ?? "Unavailable", "commit"],
      ["Destination", selection.destination, "destination"],
      ["App workspace", snapshot?.host.canHandoff ? "Automatic handoff" : "Unchanged", "workspace"]
    ]) {
      const label = document2.createElement("dt");
      label.textContent = name;
      const content = document2.createElement("dd");
      content.textContent = value;
      content.dataset.field = field;
      summary.append(label, content);
    }
    const actions = document2.createElement("div");
    actions.className = "entry-selection-actions";
    if (selection.matchesCurrentWorkspace) actions.append(button("Use current workspace", ArrowRight, () => {
      void open(false);
    }, true));
    else {
      const confirm = button("Confirm and clone", Download, () => {
        void confirmClone();
      }, true);
      confirm.dataset.action = "confirm-clone";
      confirm.classList.add("entry-primary");
      confirm.disabled = submitting || !selection.confirmation || !snapshot?.host.canPrepareRemote || !selection.expiresAt || Date.now() >= selection.expiresAt;
      actions.append(confirm);
    }
    const cancel = button("Cancel selection", X, () => {
      void cancelSelection();
    }, true);
    cancel.dataset.action = "cancel-selection";
    cancel.disabled = submitting;
    actions.append(cancel);
    selectionPanel.append(heading, summary, actions);
    const reason = selection.reason ?? snapshot?.host.reason;
    if (reason && !selection.matchesCurrentWorkspace) {
      const explanation = document2.createElement("p");
      explanation.className = "entry-muted";
      explanation.textContent = knownRepositoryError(reason).message;
      selectionPanel.append(explanation);
    }
  }
  function renderOperation() {
    operationPanel.hidden = !operation;
    operationPanel.replaceChildren();
    if (!operation) return;
    const labels = {
      awaiting_confirmation: "Awaiting confirmation",
      preparing: "Cloning repository...",
      verifying: "Verifying repository...",
      prepared: snapshot?.host.canHandoff ? "Repository prepared. Handoff pending." : "Clone complete.",
      prepared_for_manual_open: "Clone complete.",
      cancelled: "Repository preparation cancelled.",
      failed: "Repository preparation failed."
    };
    const phases = {
      waiting_user: "Repository prepared. Waiting for an explicit handoff.",
      handoff_pending: "Repository handoff is in progress.",
      target_binding: "Verifying target canvas...",
      handoff_failed: "Repository prepared. Handoff failed.",
      handoff_unknown: "Repository prepared. Handoff outcome is not confirmed.",
      validation_blocked: "Repository prepared. Handoff validation is blocked.",
      ready: "Spec Kit canvas ready."
    };
    const status = document2.createElement("p");
    status.setAttribute("role", "status");
    status.textContent = operation.state === "prepared" ? phases[snapshot?.phase ?? "prepared"] ?? labels.prepared : labels[operation.state];
    const destination = document2.createElement("p");
    destination.className = "entry-path";
    destination.textContent = operation.destination ?? "";
    operationPanel.append(status, destination);
    if (operation.state === "prepared") {
      operationPanel.append(copyCheckoutPath(operation.destination));
      if (snapshot?.phase === "prepared" && !snapshot.host.canHandoff) {
        const workspace = document2.createElement("p");
        workspace.className = "entry-muted";
        workspace.textContent = "Current workspace unchanged. Automatic workspace switching is unavailable.";
        operationPanel.append(workspace);
      }
    }
    if (cloning()) {
      const cancel = button("Cancel preparation", Square, () => {
        void cancelClone();
      }, true);
      cancel.disabled = submitting;
      operationPanel.append(cancel);
    } else if (operation.state === "prepared" && snapshot?.host.canHandoff && snapshot.phase !== "ready") {
      const retry = button("Retry handoff", ArrowRight, () => {
        void retryHandoff(operation.operationId);
      }, true);
      retry.disabled = submitting || !snapshot?.host.canRetryHandoff || snapshot.phase === "target_binding";
      operationPanel.append(retry);
    }
    if (operation.error) {
      const error = document2.createElement("p");
      error.textContent = knownRepositoryError(operation.error).message;
      operationPanel.append(error);
    }
  }
  function renderRetained() {
    const items = retained.filter((item) => item.operationId !== operation?.operationId);
    retainedPanel.hidden = !connected() || !items.length || snapshot?.phase === "ready";
    retainedPanel.replaceChildren();
    if (retainedPanel.hidden) return;
    const heading = document2.createElement("h2");
    heading.textContent = "Cloned repositories";
    retainedPanel.append(heading);
    for (const item of items) {
      const row = document2.createElement("div");
      row.className = "entry-retained-row";
      const details = document2.createElement("div");
      const name = document2.createElement("strong");
      name.textContent = item.repositoryName;
      const path = document2.createElement("p");
      path.className = "entry-path";
      path.textContent = item.destination;
      details.append(name, path);
      const actions = document2.createElement("div");
      actions.className = "entry-selection-actions";
      actions.append(copyCheckoutPath(item.destination));
      if (snapshot?.host.canHandoff) {
        const retry = button("Retry handoff", ArrowRight, () => {
          void retryHandoff(item.operationId);
        }, true);
        retry.disabled = submitting || !snapshot.host.canPrepareRemote;
        actions.append(retry);
      }
      row.append(details, actions);
      retainedPanel.append(row);
    }
  }
  function applySnapshot(state) {
    if (snapshot && (snapshot.localContext.contextId !== state.localContext.contextId || snapshot.connection.generation !== state.connection.generation)) {
      discardSelection();
      discoveryGeneration++;
      discoveryRequest?.abort();
      suggestions = emptyCollection();
      matches = emptyCollection();
      if (snapshot.connection.generation !== state.connection.generation) {
        retained = [];
        retainedGeneration = void 0;
      }
    }
    snapshot = state;
    if (selection && !state.host.canPrepareRemote) selection.confirmation = null;
    if (state.operation) {
      operation = state.operation;
      discardSelection();
    }
    if (!connected()) {
      operation = void 0;
      setPopup(false);
    }
  }
  function render() {
    if (disposed) return;
    local.disabled = opening || opened || snapshot?.host.canOpenCurrent !== true;
    direct.disabled = opening;
    refresh.disabled = opening;
    search.disabled = !connected() || opening || submitting || cloning();
    clear.hidden = !search.value;
    clear.disabled = search.disabled;
    connect.hidden = connected();
    disconnect.hidden = !connected();
    connect.disabled = connecting || snapshot?.configuration !== "configured" || snapshot.connection.state === "connecting";
    disconnect.disabled = connecting;
    element(".entry-workspace-label").textContent = snapshot?.localContext.state === "repository" ? snapshot.localContext.label : snapshot?.localContext.state === "not_repository" ? "No repository in this workspace" : "Workspace unavailable";
    element(".entry-connection-state").textContent = connected() ? snapshot.connection.accountLabel ?? "Microsoft account connected." : connecting || snapshot?.connection.state === "connecting" ? "Connecting Microsoft account..." : snapshot?.configuration === "configured" ? "Microsoft account not connected." : "Remote connection is not configured.";
    renderSelection();
    renderOperation();
    renderRetained();
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
      const state = await api.call("state");
      if (disposed || current !== generation) return;
      applySnapshot(state);
    } catch (error) {
      if (disposed || current !== generation) return;
      snapshot = void 0;
      message.textContent = knownRepositoryError(error?.code).message;
    }
    render();
    if (connected() && snapshot.connection.generation !== retainedGeneration) {
      retainedGeneration = snapshot.connection.generation;
      void loadRetained();
    }
    if (pollTimer !== void 0) window.clearTimeout(pollTimer);
    if (!disposed && (snapshot?.connection.state === "connecting" || cloning())) pollTimer = window.setTimeout(() => {
      void refreshState();
    }, 1e3);
  }
  async function loadRetained() {
    const expected = retainedGeneration;
    try {
      const result = await api.call("preparations");
      if (!disposed && connected() && expected === retainedGeneration) {
        retained = result.items;
        renderRetained();
      }
    } catch {
      if (!disposed && expected === retainedGeneration) {
        retained = [];
        renderRetained();
      }
    }
  }
  async function changeConnection(connectingNow) {
    if (disposed || connecting) return;
    connecting = true;
    message.textContent = "";
    render();
    try {
      await remoteApi.call(connectingNow ? "connect" : "disconnect", {}, {});
      if (!connectingNow) {
        discardSelection();
        operation = void 0;
        retained = [];
        retainedGeneration = void 0;
        suggestions = emptyCollection();
        matches = emptyCollection();
      }
      await refreshState();
    } catch (error) {
      if (!disposed) message.textContent = safeError(error);
    } finally {
      connecting = false;
      render();
    }
  }
  async function selectRepository(repository) {
    if (!snapshot || selecting || submitting || cloning() || disposed) return;
    const current = ++selectionGeneration;
    selecting = true;
    setPopup(false);
    message.textContent = "Checking repository...";
    try {
      const result = await api.call("selection", {}, { repositoryId: repository.id, contextId: snapshot.localContext.contextId });
      if (disposed || current !== selectionGeneration) return;
      selection = result;
      operation = void 0;
      message.textContent = "";
      if (expiryTimer !== void 0) window.clearTimeout(expiryTimer);
      if (result.expiresAt) expiryTimer = window.setTimeout(() => {
        if (selection === result) {
          result.confirmation = null;
          message.textContent = "Confirmation expired. Select the repository again.";
          render();
        }
      }, Math.max(0, Math.min(12e4, result.expiresAt - Date.now())));
    } catch (error) {
      if (!disposed && current === selectionGeneration) message.textContent = safeError(error);
    } finally {
      if (current === selectionGeneration) selecting = false;
      render();
    }
  }
  async function confirmClone() {
    if (!selection?.confirmation || !snapshot?.host.canPrepareRemote || submitting || disposed) return;
    const current = selection;
    submitting = true;
    message.textContent = "Starting repository preparation...";
    render();
    try {
      operation = await api.call("clone", {}, { selectionId: current.selectionId, confirmation: current.confirmation, requestId: requestId() });
      if (disposed) return;
      discardSelection();
      message.textContent = "";
      await refreshState();
    } catch (error) {
      if (!disposed) {
        current.confirmation = null;
        message.textContent = safeError(error);
      }
    } finally {
      submitting = false;
      render();
    }
  }
  async function cancelSelection() {
    if (!selection || submitting || disposed) return;
    const current = selection;
    submitting = true;
    render();
    try {
      if (current.expiresAt) await api.call(`operations/${current.operationId}/cancel`, {}, { requestId: requestId() });
      if (disposed) return;
      discardSelection();
    } catch (error) {
      if (!disposed) {
        current.confirmation = null;
        message.textContent = safeError(error);
      }
    } finally {
      submitting = false;
      render();
      if (!selection) {
        search.focus();
        setPopup(true);
        renderCollection();
      }
    }
  }
  async function cancelClone() {
    if (!operation || !cloning() || submitting || disposed) return;
    submitting = true;
    render();
    try {
      operation = await api.call(`operations/${operation.operationId}/cancel`, {}, { requestId: requestId() });
    } catch (error) {
      if (!disposed) message.textContent = safeError(error);
    } finally {
      submitting = false;
      render();
    }
  }
  async function retryHandoff(operationId) {
    if (disposed || submitting || !snapshot?.host.canHandoff || !snapshot.host.canPrepareRemote) return;
    submitting = true;
    message.textContent = "Checking retained preparation...";
    render();
    try {
      await refreshState();
      if (!snapshot?.host.canHandoff || !snapshot.host.canPrepareRemote) return;
      operation = await api.call(`operations/${operationId}/handoff`, {}, { contextId: snapshot.localContext.contextId, requestId: requestId() });
      await refreshState();
    } catch (error) {
      if (!disposed) {
        message.textContent = safeError(error);
        await refreshState();
      }
    } finally {
      submitting = false;
      render();
    }
  }
  async function open(directEntry) {
    if (disposed || opening || !directEntry && (opened || !snapshot?.host.canOpenCurrent)) return;
    opening = true;
    message.textContent = "Opening canvas...";
    render();
    try {
      const body = directEntry ? { requestId: requestId() } : { contextId: snapshot.localContext.contextId, requestId: requestId() };
      await api.call(directEntry ? "direct" : "local", {}, body);
      if (disposed) return;
      opened = true;
    } catch (error) {
      if (!disposed) message.textContent = knownRepositoryError(error?.code).message;
    } finally {
      opening = false;
      render();
    }
  }
  search.addEventListener("input", changedQuery);
  search.addEventListener("focus", () => {
    setPopup(true);
    renderCollection();
    if (!collection().loaded && !collection().loading && !search.value.trim()) void loadCollection();
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setPopup(false);
      return;
    }
    const items = collection().items;
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setPopup(true);
      if (items.length) activeIndex = event.key === "ArrowDown" ? (activeIndex + 1) % items.length : (activeIndex - 1 + items.length) % items.length;
      renderCollection();
      results.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
    } else if (event.key === "Enter" && popupOpen && items[activeIndex]) {
      event.preventDefault();
      void selectRepository(items[activeIndex]);
    }
  });
  const outside = (event) => {
    if (!element(".entry-search-wrap").contains(event.target)) setPopup(false);
  };
  document2.addEventListener("pointerdown", outside);
  await refreshState();
  if (!opening && !opened && snapshot?.configuration === "configured" && snapshot.connection.state === "disconnected" && snapshot.connection.generation === 0) {
    void changeConnection(true);
  }
  return {
    refresh: refreshState,
    receive(state) {
      if (!disposed) {
        generation++;
        applySnapshot(state);
        render();
      }
    },
    dispose() {
      disposed = true;
      generation++;
      selectionGeneration++;
      discoveryGeneration++;
      for (const timer of [queryTimer, pollTimer, expiryTimer]) if (timer !== void 0) window.clearTimeout(timer);
      discoveryRequest?.abort();
      api.abort();
      remoteApi.abort();
      document2.removeEventListener("pointerdown", outside);
      container.replaceChildren();
    }
  };
}
export {
  mountRepositoryEntry
};
/*! Bundled license information:

lucide/dist/esm/defaultAttributes.mjs:
lucide/dist/esm/createElement.mjs:
lucide/dist/esm/icons/arrow-right.mjs:
lucide/dist/esm/icons/clipboard-copy.mjs:
lucide/dist/esm/icons/download.mjs:
lucide/dist/esm/icons/external-link.mjs:
lucide/dist/esm/icons/folder-open.mjs:
lucide/dist/esm/icons/git-branch.mjs:
lucide/dist/esm/icons/log-out.mjs:
lucide/dist/esm/icons/log-in.mjs:
lucide/dist/esm/icons/refresh-cw.mjs:
lucide/dist/esm/icons/search.mjs:
lucide/dist/esm/icons/square.mjs:
lucide/dist/esm/icons/x.mjs:
lucide/dist/esm/lucide.mjs:
  (**
   * @license lucide v1.42.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
