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

// node_modules/lucide/dist/esm/icons/arrow-left.mjs
var ArrowLeft = [
  ["path", { d: "m12 19-7-7 7-7" }],
  ["path", { d: "M19 12H5" }]
];

// node_modules/lucide/dist/esm/icons/check.mjs
var Check = [["path", { d: "M20 6 9 17l-5-5" }]];

// node_modules/lucide/dist/esm/icons/chevron-down.mjs
var ChevronDown = [["path", { d: "m6 9 6 6 6-6" }]];

// node_modules/lucide/dist/esm/icons/chevron-right.mjs
var ChevronRight = [["path", { d: "m9 18 6-6-6-6" }]];

// node_modules/lucide/dist/esm/icons/copy.mjs
var Copy = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
];

// node_modules/lucide/dist/esm/icons/download.mjs
var Download = [
  ["path", { d: "M12 15V3" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
  ["path", { d: "m7 10 5 5 5-5" }]
];

// node_modules/lucide/dist/esm/icons/ellipsis.mjs
var Ellipsis = [
  ["circle", { cx: "12", cy: "12", r: "1" }],
  ["circle", { cx: "19", cy: "12", r: "1" }],
  ["circle", { cx: "5", cy: "12", r: "1" }]
];

// node_modules/lucide/dist/esm/icons/file-text.mjs
var FileText = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
  ["path", { d: "M10 9H8" }],
  ["path", { d: "M16 13H8" }],
  ["path", { d: "M16 17H8" }]
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

// node_modules/lucide/dist/esm/icons/folder.mjs
var Folder = [
  [
    "path",
    {
      d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
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

// node_modules/lucide/dist/esm/icons/panel-left.mjs
var PanelLeft = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
  ["path", { d: "M9 3v18" }]
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
function createRepositoryApi({ document: document2, request = globalThis.fetch }) {
  const base = new URL(document2.location.href);
  const controllers = /* @__PURE__ */ new Set();
  return {
    async call(path, parameters = {}, body, signal) {
      const url = new URL(`/api/repositories/${path}`, base);
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

// src/ui/remote-reader.ts
function createRemoteReader({ container, scrollElement, api, loadReader, onReturn, onDocument = () => void 0, onError = () => void 0 }) {
  let mounted;
  let controller;
  let generation = 0;
  let contextId = "";
  let current;
  let history = [];
  let position = -1;
  const artifacts = /* @__PURE__ */ new Map();
  function clearDocument() {
    mounted?.unmount();
    mounted = void 0;
    container.replaceChildren();
    current = void 0;
  }
  function status(message) {
    clearDocument();
    const text = container.ownerDocument.createElement("p");
    text.className = "repo-preview-status";
    text.setAttribute("role", "status");
    text.textContent = message;
    container.append(text);
  }
  function remember() {
    if (history[position]) history[position].offset = scrollElement.scrollTop;
  }
  async function present(document2, epoch, target, fragment = "") {
    if (epoch !== generation || document2.contextId !== contextId || !container.isConnected) return;
    artifacts.set(document2.artifact.id, document2.artifact);
    if (target !== void 0) position = target;
    else {
      history = history.slice(0, position + 1);
      history.push({ itemId: document2.artifact.id, offset: 0, fragment });
      if (history.length > 50) history.shift();
      position = history.length - 1;
    }
    if (document2.format === "text") {
      clearDocument();
      const source = container.ownerDocument.createElement("div");
      source.className = "repo-text-source";
      source.textContent = `${document2.artifact.relativePath} / Git commit ${document2.source.commit.slice(0, 12)}`;
      const pre = container.ownerDocument.createElement("pre");
      pre.className = "repo-plain-text";
      pre.textContent = document2.content;
      pre.setAttribute("aria-label", document2.artifact.relativePath);
      container.append(source, pre);
    } else {
      const mount = await loadReader();
      if (epoch !== generation || document2.contextId !== contextId || !container.isConnected) return;
      const options = {
        readerId: "sdd-remote-reader",
        state: document2.content.trim() ? "ready" : "empty",
        connectionState: "connected",
        document: document2,
        artifacts: [...artifacts.values()],
        selectedArtifactId: document2.artifact.id,
        scrollElement,
        fragment: fragment || history[position]?.fragment || void 0,
        returnLabel: "Back to repository",
        navigationEnabled: true,
        canNavigateBack: position > 0,
        canNavigateForward: position < history.length - 1,
        onSelectArtifact: (id) => {
          void reader.open(contextId, id);
        },
        onNavigateReference: (target2) => {
          void reader.reference(target2);
        },
        onNavigateHistory: (direction) => {
          void reader.navigate(direction);
        },
        onReturnToWorkflow: onReturn
      };
      clearDocument();
      mounted = mount(container, options);
    }
    current = document2;
    scrollElement.scrollTop = history[position]?.offset ?? 0;
    container.dataset.remoteDocumentState = "ready";
    onDocument(document2);
  }
  async function load(operation, target) {
    remember();
    const epoch = ++generation;
    controller?.abort();
    controller = new AbortController();
    status("Loading artifact...");
    container.dataset.remoteDocumentState = "loading";
    try {
      const result = await operation(controller.signal);
      await present(result.document, epoch, target, result.fragment);
    } catch (error) {
      if (epoch !== generation) return;
      const failure = knownRepositoryError(error?.code);
      status(failure.message);
      container.dataset.remoteDocumentState = "error";
      onError(failure.code);
    }
  }
  const reader = {
    async open(context, itemId, target) {
      if (context !== contextId) {
        reader.clear();
        contextId = context;
      }
      await load(async (signal) => ({ document: await api.call("content", { contextId: context, itemId }, void 0, signal) }), target);
    },
    async reference(target) {
      if (!current) return;
      const itemId = current.artifact.id;
      await load((signal) => api.call("reference", {}, { contextId, itemId, target }, signal));
    },
    async navigate(direction) {
      const target = position + (direction === "back" ? -1 : 1);
      if (target < 0 || target >= history.length) return;
      await reader.open(contextId, history[target].itemId, target);
    },
    clear() {
      generation++;
      controller?.abort();
      controller = void 0;
      contextId = "";
      history = [];
      position = -1;
      artifacts.clear();
      status("No artifact selected.");
      container.dataset.remoteDocumentState = "idle";
    },
    dispose() {
      reader.clear();
      clearDocument();
    }
  };
  return reader;
}

// src/ui/tree.ts
function repositoryKey(id) {
  return `repository:${id}`;
}
function rootKey(id, root) {
  return `${repositoryKey(id)}:${root}`;
}
var order = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
var rank = { enabled: 0, not_enabled: 1, unscannable: 3, unavailable: 4 };
function visibleRepositoryNodes({ repositories, context, roots, expanded, details }) {
  const result = [];
  const sorted = [...repositories].sort((left, right) => (rank[details.get(left.id)?.speckitStatus ?? ""] ?? 2) - (rank[details.get(right.id)?.speckitStatus ?? ""] ?? 2) || order.compare(left.name, right.name) || left.id.localeCompare(right.id, "en"));
  for (const repository of sorted) {
    const key = repositoryKey(repository.id);
    const selected = context?.repository.id === repository.id && expanded.has(key);
    result.push({
      key,
      kind: "repository",
      label: repository.name,
      level: 1,
      expanded: Boolean(selected),
      repository,
      status: details.get(repository.id)?.speckitStatus
    });
    if (!selected) continue;
    for (const root of context.roots) {
      const parent = rootKey(repository.id, root);
      result.push({ key: parent, kind: "root", label: root.slice(1), level: 2, parentKey: key, expanded: expanded.has(parent), repository, root });
      if (!expanded.has(parent)) continue;
      const page = roots.get(root);
      const items = [...page?.items ?? []].sort((left, right) => order.compare(left.path, right.path));
      const parents = /* @__PURE__ */ new Map();
      for (const item of items) {
        const segments = item.path.slice(root.length + 1).split("/");
        for (let depth = 1; depth < segments.length; depth++) {
          const path = `${root}/${segments.slice(0, depth).join("/")}`;
          if (!parents.has(path)) parents.set(path, { id: `folder:${path}`, path, label: segments[depth - 1], kind: "folder", objectId: "" });
        }
        parents.set(item.path, item);
      }
      const rows = [...parents.values()].sort((left, right) => order.compare(left.path, right.path));
      for (const item of rows) {
        const segments = item.path.slice(root.length + 1).split("/");
        let visible = true;
        for (let depth = 1; depth < segments.length; depth++) {
          if (!expanded.has(`${parent}/${segments.slice(0, depth).join("/")}`)) {
            visible = false;
            break;
          }
        }
        if (!visible) continue;
        const nodeKey = `${parent}/${segments.join("/")}`;
        result.push({
          key: nodeKey,
          kind: item.kind,
          label: item.label,
          level: segments.length + 2,
          parentKey: segments.length === 1 ? parent : `${parent}/${segments.slice(0, -1).join("/")}`,
          repository,
          root,
          item,
          ...item.kind === "folder" ? { expanded: expanded.has(nodeKey) } : {}
        });
      }
      if (page?.cursor) result.push({ key: `${parent}:more`, kind: "more", label: "Load more artifacts", level: 3, parentKey: parent, repository, root });
    }
  }
  return result;
}

// src/ui/repository-browser.ts
var emptyCollection = (query = "") => ({ query, initialized: false, loading: false, error: "", items: [], cursor: null, hasMore: false, outcome: "ready" });
var normalize = (query) => query.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
var statusLabels = { enabled: "Spec Kit", not_enabled: "Not configured", unscannable: "No branch", unavailable: "Unavailable" };
async function mountRepositoryBrowser({ container, localHeader, localLayout, loadReader, request, onLocalContext = () => void 0 }) {
  const document2 = container.ownerDocument;
  const window = document2.defaultView;
  const controlApi = createRepositoryApi({ document: document2, request });
  const api = createRepositoryApi({ document: document2, request });
  let snapshot = await controlApi.call("connection");
  onLocalContext(snapshot.configuration === "configured" ? snapshot.localContext.contextId : void 0);
  if (snapshot.configuration !== "configured") {
    container.hidden = true;
    return { receive() {
    }, dispose() {
      api.abort();
      controlApi.abort();
    } };
  }
  container.hidden = false;
  container.className = "repo-browser";
  container.innerHTML = `<div class="repo-toolbar" role="group" aria-label="Repository connection">
        <div class="repo-toolbar-start"></div><div class="repo-search-wrap"><input class="repo-search" type="search" role="combobox" aria-label="Search readable project repositories" aria-autocomplete="none" aria-haspopup="tree" aria-expanded="false" aria-controls="repo-popup-tree" placeholder="Search repositories" autocomplete="off" spellcheck="false" maxlength="256"><span class="repo-search-actions"></span></div>
        <div class="repo-connection-actions"></div><div class="repo-account" aria-label="Microsoft account" role="status"></div>
        </div><div class="repo-workspace"><div class="repo-rail" role="complementary" aria-label="Repository rail"><div class="repo-rail-heading"><strong class="repo-list-title">My team repositories</strong><span class="repo-count"></span></div><div class="repo-rail-tree repo-tree" id="repo-rail-tree" role="tree" aria-label="Repositories"></div><div class="repo-rail-footer"></div></div>
        <div class="repo-main"><div class="repo-local"></div><div class="repo-remote" hidden><div class="repo-remote-heading"><div><h2 class="repo-selected-title">Repository</h2><div class="repo-source-stamp"></div></div><div class="repo-selected-actions"></div></div><div class="repo-preview-scroll"><div class="repo-preview"></div></div></div></div></div>
        <div class="repo-popup" hidden><div class="repo-popup-tree repo-tree" id="repo-popup-tree" role="tree" aria-label="Repository search results"></div><div class="repo-popup-footer"></div></div><div class="repo-message" role="status" aria-live="polite"></div>`;
  const element = (selector) => container.querySelector(selector);
  const search = element(".repo-search");
  const popup = element(".repo-popup");
  const popupTree = element(".repo-popup-tree");
  const railTree = element(".repo-rail-tree");
  const local = element(".repo-local");
  const remote = element(".repo-remote");
  const message = element(".repo-message");
  const preview = element(".repo-preview");
  const previewScroll = element(".repo-preview-scroll");
  local.append(localHeader, localLayout);
  const listeners = [];
  let disposed = false;
  let query = "";
  let pendingSearch = false;
  let personal = emptyCollection();
  let searched = emptyCollection();
  let collectionGeneration = 0;
  let selectionGeneration = 0;
  let context;
  let activeKey = "";
  let popupOpen = false;
  let returnSurface = "popup";
  let returnKey = "";
  let searchTimer;
  let collectionController;
  let nodes = [];
  let statusActive = 0;
  const statusQueue = [];
  const statusRequested = /* @__PURE__ */ new Set();
  const details = /* @__PURE__ */ new Map();
  const roots = /* @__PURE__ */ new Map();
  const expanded = /* @__PURE__ */ new Set();
  const rowMaps = { popup: /* @__PURE__ */ new Map(), rail: /* @__PURE__ */ new Map() };
  const currentCollection = () => query ? searched : personal;
  let cloneOperationId;
  let cloneConfirmation;
  let cloneState;
  let cloneStatusLoading = false;
  let cloneStatusAgain = false;
  function listen(target, type, handler) {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  }
  function button(label, glyph, action, className = "repo-icon-button") {
    const control = document2.createElement("button");
    control.type = "button";
    control.className = className;
    control.title = label;
    control.setAttribute("aria-label", label);
    control.append(createElement(glyph, { width: "16", height: "16", "aria-hidden": "true" }));
    control.addEventListener("click", action);
    return control;
  }
  const toggleRail = button("Toggle repository rail", PanelLeft, () => {
    container.classList.toggle("repo-rail-collapsed");
    container.classList.toggle("repo-rail-mobile-open");
    toggleRail.setAttribute("aria-expanded", String(!container.classList.contains("repo-rail-collapsed")));
  });
  toggleRail.setAttribute("aria-controls", "repo-rail-tree");
  const localButton = button("Return to local workspace", FolderOpen, () => {
    void selectLocal();
  });
  element(".repo-toolbar-start").append(toggleRail, localButton);
  const clear = button("Clear repository search", X, () => {
    search.value = "";
    changeSearch();
    search.focus();
  });
  element(".repo-search-actions").append(createElement(Search, { width: "16", height: "16", "aria-hidden": "true" }), clear);
  const connect = button("Connect Microsoft account", LogIn, () => {
    void connectAccount();
  });
  const disconnect = button("Disconnect Microsoft account", LogOut, () => {
    void disconnectAccount();
  });
  element(".repo-connection-actions").append(connect, disconnect);
  const refreshList = button("Refresh repositories", RefreshCw, () => {
    currentCollection().initialized = false;
    void loadCollection(false);
  });
  element(".repo-rail-heading").append(refreshList);
  const back = button("Back to repository", ArrowLeft, () => returnToRepository());
  const refresh = button("Refresh repository revision", RefreshCw, () => {
    void refreshContext();
  });
  const clone = button("Prepare local clone", Download, () => {
    void confirmClone();
  });
  element(".repo-selected-actions").append(back, refresh, clone);
  const cloneStatus = document2.createElement("div");
  cloneStatus.className = "repo-clone-status";
  cloneStatus.hidden = true;
  cloneStatus.setAttribute("role", "status");
  const cloneText = document2.createElement("span");
  const clonePath = document2.createElement("code");
  const cloneCancel = button("Cancel repository preparation", X, () => {
    if (cloneOperationId) void api.call("clone/cancel", {}, { operationId: cloneOperationId }).then(() => updateClone()).catch(showError);
  });
  const copyPath = button("Copy prepared folder path", Copy, () => {
    if (cloneState?.state === "prepared_for_manual_open") void window.navigator.clipboard.writeText(cloneState.destination).then(() => {
      message.textContent = "Folder path copied.";
    }).catch(showError);
  });
  cloneStatus.append(cloneText, clonePath, cloneCancel, copyPath);
  remote.insertBefore(cloneStatus, previewScroll);
  const dialog = document2.createElement("dialog");
  dialog.className = "repo-clone-dialog";
  dialog.setAttribute("aria-label", "Confirm repository clone");
  const dialogHeading = document2.createElement("h2");
  dialogHeading.textContent = "Prepare local clone";
  const dialogDetails = document2.createElement("dl");
  const dialogActions = document2.createElement("div");
  dialogActions.className = "repo-dialog-actions";
  const decline = button("Cancel clone confirmation", X, () => {
    void dismissClone();
  }, "repo-command");
  decline.append(document2.createTextNode("Cancel"));
  const approve = button("Confirm clone", Check, () => {
    void startClone();
  }, "repo-command");
  approve.append(document2.createTextNode("Confirm clone"));
  dialogActions.append(decline, approve);
  dialog.append(dialogHeading, dialogDetails, dialogActions);
  container.append(dialog);
  listen(dialog, "cancel", (event) => {
    event.preventDefault();
    void dismissClone();
  });
  const reader = createRemoteReader({
    container: preview,
    scrollElement: previewScroll,
    api,
    loadReader,
    onReturn: returnToRepository,
    onDocument: () => {
      back.hidden = false;
    },
    onError: (code) => {
      if (!["resource_unavailable", "invalid_context", "connection_required"].includes(code)) return;
      const id = context?.repository.id;
      context = void 0;
      roots.clear();
      if (id) {
        personal.items = personal.items.filter((item) => item.id !== id);
        searched.items = searched.items.filter((item) => item.id !== id);
        details.delete(id);
      }
      element(".repo-selected-title").textContent = "Repository unavailable";
      element(".repo-source-stamp").textContent = "";
      renderTrees();
    }
  });
  reader.clear();
  function showError(error) {
    message.textContent = knownRepositoryError(error?.code).message;
  }
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
  function setPopup(open) {
    popupOpen = open && snapshot.connection.state === "connected";
    popup.hidden = !popupOpen;
    search.setAttribute("aria-expanded", String(popupOpen));
    if (!popupOpen) search.removeAttribute("aria-activedescendant");
    placePopup();
    renderTrees();
  }
  function paint(tree, surface) {
    const scroll = tree.scrollTop;
    const focused = document2.activeElement instanceof window.HTMLElement && tree.contains(document2.activeElement) ? document2.activeElement.dataset.nodeKey : void 0;
    const maps = rowMaps[surface];
    maps.clear();
    const fragment = document2.createDocumentFragment();
    const start = nodes.length > 200 ? Math.max(0, Math.floor(scroll / 32) - 8) : 0;
    const count = nodes.length > 200 ? Math.min(200, Math.ceil((tree.clientHeight || 400) / 32) + 16) : nodes.length;
    if (start) {
      const spacer = document2.createElement("div");
      spacer.style.height = `${start * 32}px`;
      spacer.setAttribute("role", "presentation");
      fragment.append(spacer);
    }
    for (const node of nodes.slice(start, start + count)) {
      const row = document2.createElement("div");
      row.id = `repo-${surface}-${encodeURIComponent(node.key)}`;
      row.className = "repo-node";
      row.dataset.nodeKey = node.key;
      row.dataset.kind = node.kind;
      row.dataset.status = node.status ?? "";
      row.setAttribute("role", "treeitem");
      row.setAttribute("aria-level", String(node.level));
      row.setAttribute("aria-selected", String(node.key === activeKey));
      if (node.expanded !== void 0) row.setAttribute("aria-expanded", String(node.expanded));
      row.style.paddingLeft = `${8 + Math.min(node.level - 1, 12) * 16}px`;
      row.tabIndex = surface === "rail" && (node.key === activeKey || !activeKey && node === nodes[0]) ? 0 : -1;
      const glyph = node.kind === "repository" ? GitBranch : node.kind === "file" ? FileText : node.kind === "more" ? Ellipsis : node.expanded ? FolderOpen : Folder;
      if (node.expanded !== void 0) row.append(createElement(node.expanded ? ChevronDown : ChevronRight, { width: "12", height: "12", "aria-hidden": "true" }));
      row.append(createElement(glyph, { width: "16", height: "16", "aria-hidden": "true" }));
      const label = document2.createElement("span");
      label.className = "repo-node-label";
      label.textContent = node.label;
      row.append(label);
      row.title = node.label;
      if (node.status) {
        const badge = document2.createElement("small");
        badge.textContent = statusLabels[node.status] ?? "";
        row.append(badge);
      }
      if (surface === "popup") row.addEventListener("mousedown", (event) => event.preventDefault());
      row.addEventListener("click", () => {
        activeKey = node.key;
        void activate(node, surface);
      });
      maps.set(node.key, row);
      fragment.append(row);
    }
    const remaining = nodes.length - start - count;
    if (remaining > 0) {
      const spacer = document2.createElement("div");
      spacer.style.height = `${remaining * 32}px`;
      spacer.setAttribute("role", "presentation");
      fragment.append(spacer);
    }
    tree.replaceChildren(fragment);
    tree.scrollTop = scroll;
    if (focused) maps.get(focused)?.focus({ preventScroll: true });
    if (surface === "popup" && popupOpen) {
      const active = maps.get(activeKey);
      if (active) search.setAttribute("aria-activedescendant", active.id);
      else search.removeAttribute("aria-activedescendant");
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
    paint(railTree, "rail");
    paint(popupTree, "popup");
    element(".repo-list-title").textContent = query ? "Project repositories" : "My team repositories";
    element(".repo-count").textContent = pendingSearch ? "" : String(collection.items.length);
    for (const selector of [".repo-rail-footer", ".repo-popup-footer"]) {
      const footer = element(selector);
      footer.replaceChildren();
      const summary = document2.createElement("span");
      summary.textContent = collectionMessage();
      footer.append(summary);
      if (collection.hasMore || collection.error) {
        const more = button(
          collection.error ? "Retry repository collection" : "Load more repositories",
          collection.error ? RefreshCw : Ellipsis,
          () => {
            void loadCollection(!collection.error && collection.initialized);
          },
          "repo-command"
        );
        const label = document2.createElement("span");
        label.textContent = collection.error ? "Retry" : "Load more";
        more.append(label);
        more.disabled = collection.loading || pendingSearch;
        footer.append(more);
      }
    }
    clear.hidden = !search.value;
    railTree.setAttribute("aria-busy", String(collection.loading || pendingSearch));
    popupTree.setAttribute("aria-busy", String(collection.loading || pendingSearch));
    for (const node of nodes.slice(0, 200)) {
      if (node.kind !== "repository" || details.has(node.repository.id) || statusRequested.has(node.repository.id)) continue;
      statusRequested.add(node.repository.id);
      statusQueue.push(node.repository.id);
    }
    pumpStatuses();
  }
  function pumpStatuses() {
    while (!disposed && statusActive < 4 && statusQueue.length && snapshot.connection.state === "connected") {
      const id = statusQueue.shift();
      const epoch = snapshot.connection.generation;
      statusActive++;
      void api.call("detail", { repositoryId: id }).then((detail) => {
        if (epoch === snapshot.connection.generation && snapshot.connection.state === "connected") details.set(id, detail);
      }).catch(() => void 0).finally(() => {
        statusActive--;
        if (!disposed) renderTrees();
      });
    }
  }
  async function loadCollection(append, automaticPages = 0) {
    if (snapshot.connection.state !== "connected" || pendingSearch) return;
    const collection = currentCollection();
    if (collection.loading) return;
    const epoch = collectionGeneration;
    const account = snapshot.connection.generation;
    collection.loading = true;
    collection.error = "";
    collectionController?.abort();
    collectionController = new AbortController();
    renderTrees();
    try {
      const data = await api.call(query ? "search" : "relevant", { ...query ? { q: query } : {}, ...append && collection.cursor ? { cursor: collection.cursor } : {} }, void 0, collectionController.signal);
      if (epoch !== collectionGeneration || account !== snapshot.connection.generation || disposed) return;
      collection.items = [...new Map([...append ? collection.items : [], ...data.items].map((item) => [item.id, item])).values()];
      collection.cursor = data.cursor;
      collection.hasMore = data.hasMore;
      collection.outcome = data.outcome;
      collection.initialized = true;
    } catch (error) {
      if (epoch === collectionGeneration && account === snapshot.connection.generation) collection.error = knownRepositoryError(error?.code).message;
    } finally {
      collection.loading = false;
      if (epoch === collectionGeneration && account === snapshot.connection.generation) {
        renderTrees();
        if (!query && collection.outcome === "scanning" && collection.hasMore && !collection.error && automaticPages < 2) void loadCollection(true, automaticPages + 1);
      }
    }
  }
  function changeSearch() {
    if (searchTimer !== void 0) window.clearTimeout(searchTimer);
    collectionGeneration++;
    collectionController?.abort();
    pendingSearch = true;
    const normalized = normalize(search.value);
    const commit = () => {
      query = normalized;
      pendingSearch = false;
      if (query && searched.query !== query) searched = emptyCollection(query);
      activeKey = "";
      renderTrees();
      if (!currentCollection().initialized) void loadCollection(false);
    };
    renderTrees();
    setPopup(true);
    if (!normalized || normalized === query) commit();
    else searchTimer = window.setTimeout(commit, 1e3);
  }
  async function loadRoot(root, append = false) {
    if (!context) return;
    const activeContext = context;
    const epoch = selectionGeneration;
    const page = roots.get(root) ?? { items: [], cursor: null, loaded: false, loading: false };
    if (page.loading || page.loaded && !append) return;
    page.loading = true;
    roots.set(root, page);
    message.textContent = "Loading artifact tree...";
    try {
      const data = await api.call("items", { contextId: activeContext.contextId, root, ...append && page.cursor ? { cursor: page.cursor } : {} });
      if (epoch !== selectionGeneration || context?.contextId !== activeContext.contextId || disposed) return;
      page.items = [...new Map([...append ? page.items : [], ...data.items].map((item) => [item.id, item])).values()];
      page.cursor = data.cursor;
      page.loaded = true;
      message.textContent = page.items.length ? "" : "No artifacts in this root.";
    } catch (error) {
      if (epoch === selectionGeneration) showError(error);
    } finally {
      page.loading = false;
      if (epoch === selectionGeneration) renderTrees();
    }
  }
  async function activate(node, surface) {
    message.textContent = "";
    if (node.kind === "repository") {
      if (context?.repository.id === node.repository.id && expanded.has(node.key)) {
        expanded.delete(node.key);
        renderTrees();
        return;
      }
      const epoch = ++selectionGeneration;
      roots.clear();
      reader.clear();
      context = void 0;
      expanded.add(node.key);
      message.textContent = "Opening repository...";
      try {
        const next = await api.call("context", {}, { repositoryId: node.repository.id });
        if (epoch !== selectionGeneration || disposed) return;
        context = next;
        details.set(next.repository.id, next.repository);
        local.hidden = true;
        remote.hidden = false;
        element(".repo-selected-title").textContent = next.repository.name;
        element(".repo-source-stamp").textContent = `${next.repository.defaultBranch?.slice(11)} / ${next.sourceVersion.slice(0, 12)}`;
        message.textContent = next.roots.length ? "" : "Spec Kit is not configured in this repository.";
        renderTrees();
        placePopup();
      } catch (error) {
        if (epoch === selectionGeneration) showError(error);
      }
    } else if (node.kind === "root" || node.kind === "folder") {
      if (expanded.has(node.key)) expanded.delete(node.key);
      else expanded.add(node.key);
      renderTrees();
      if (node.kind === "root" && expanded.has(node.key)) await loadRoot(node.root);
    } else if (node.kind === "more") await loadRoot(node.root, true);
    else if (context && node.item) {
      returnSurface = surface;
      returnKey = node.key;
      setPopup(false);
      local.hidden = true;
      remote.hidden = false;
      container.classList.remove("repo-rail-mobile-open");
      await reader.open(context.contextId, node.item.id);
    }
  }
  function returnToRepository() {
    reader.clear();
    back.hidden = true;
    activeKey = returnKey;
    if (returnSurface === "popup") {
      setPopup(true);
      search.focus();
    } else {
      renderTrees();
      rowMaps.rail.get(returnKey)?.focus({ preventScroll: true });
    }
  }
  async function selectLocal() {
    selectionGeneration++;
    context = void 0;
    roots.clear();
    reader.clear();
    setPopup(false);
    try {
      receive(await controlApi.call("local", {}, {}));
      localHeader.querySelector("h1")?.focus();
    } catch (error) {
      showError(error);
    }
  }
  async function refreshContext() {
    if (!context) return;
    const selected = context.contextId;
    const epoch = ++selectionGeneration;
    reader.clear();
    roots.clear();
    try {
      const next = await api.call("refresh", {}, { contextId: selected });
      if (epoch !== selectionGeneration) return;
      context = next;
      element(".repo-source-stamp").textContent = `${next.repository.defaultBranch?.slice(11)} / ${next.sourceVersion.slice(0, 12)}`;
      renderTrees();
      for (const root of next.roots) if (expanded.has(rootKey(next.repository.id, root))) void loadRoot(root);
    } catch (error) {
      if (epoch === selectionGeneration) showError(error);
    }
  }
  async function confirmClone() {
    if (!context || !snapshot.capabilities.clone) return;
    const selected = context.contextId;
    const epoch = selectionGeneration;
    clone.disabled = true;
    try {
      const confirmation = await api.call("clone/confirm", {}, { contextId: selected });
      if (epoch !== selectionGeneration || context?.contextId !== selected || disposed) return;
      cloneConfirmation = confirmation;
      dialogDetails.replaceChildren();
      for (const [label, value] of [
        ["Repository", confirmation.repositoryName],
        ["Microsoft account", confirmation.accountLabel],
        ["Source branch", confirmation.branch],
        ["Source commit", confirmation.sourceCommit],
        ["New local branch", confirmation.localBranch],
        ["New folder", confirmation.destination]
      ]) {
        const term = document2.createElement("dt");
        term.textContent = label;
        const detail = document2.createElement("dd");
        detail.textContent = value;
        dialogDetails.append(term, detail);
      }
      approve.disabled = false;
      setPopup(false);
      dialog.showModal();
      decline.focus();
    } catch (error) {
      showError(error);
    } finally {
      clone.disabled = false;
    }
  }
  async function dismissClone() {
    const confirmation = cloneConfirmation;
    cloneConfirmation = void 0;
    dialog.close();
    if (confirmation) {
      try {
        await api.call("clone/cancel", {}, { operationId: confirmation.operationId });
      } catch {
        return;
      }
    }
  }
  async function startClone() {
    const confirmation = cloneConfirmation;
    if (!confirmation) return;
    approve.disabled = true;
    try {
      cloneOperationId = confirmation.operationId;
      cloneState = await api.call("clone", {}, { operationId: confirmation.operationId, confirmation: confirmation.confirmation });
      cloneConfirmation = void 0;
      dialog.close();
      showCloneState();
      await updateClone();
    } catch (error) {
      showError(error);
      approve.disabled = false;
    }
  }
  function showCloneState() {
    cloneStatus.hidden = !cloneState;
    if (!cloneState) return;
    const labels = {
      awaiting_confirmation: "Awaiting confirmation",
      preparing: "Cloning repository...",
      verifying: "Verifying source commit...",
      prepared_for_manual_open: "Prepared for manual opening in Copilot App",
      cancelled: "Repository preparation cancelled",
      failed: "Repository preparation failed"
    };
    cloneText.textContent = labels[cloneState.state];
    const prepared = cloneState.state === "prepared_for_manual_open";
    clonePath.textContent = prepared ? cloneState.destination : "";
    copyPath.hidden = !prepared;
    cloneCancel.hidden = !["preparing", "verifying"].includes(cloneState.state);
    clone.disabled = !cloneCancel.hidden;
  }
  async function updateClone() {
    if (!cloneOperationId || snapshot.connection.state !== "connected" || disposed) return;
    if (cloneStatusLoading) {
      cloneStatusAgain = true;
      return;
    }
    const id = cloneOperationId;
    cloneStatusLoading = true;
    try {
      const next = await api.call("clone", { operationId: id });
      if (id !== cloneOperationId || disposed) return;
      cloneState = next;
      showCloneState();
    } catch (error) {
      if (id === cloneOperationId) showError(error);
    } finally {
      cloneStatusLoading = false;
      if (cloneStatusAgain) {
        cloneStatusAgain = false;
        void updateClone();
      }
    }
  }
  async function connectAccount() {
    message.textContent = "";
    try {
      await controlApi.call("connect", {}, {});
      receive(await controlApi.call("connection"));
    } catch (error) {
      showError(error);
    }
  }
  async function disconnectAccount() {
    clearRemoteState();
    try {
      receive(await controlApi.call("disconnect", {}, {}));
    } catch (error) {
      showError(error);
    }
  }
  function clearRemoteState() {
    collectionGeneration++;
    selectionGeneration++;
    api.abort();
    collectionController?.abort();
    if (searchTimer !== void 0) window.clearTimeout(searchTimer);
    reader.clear();
    context = void 0;
    roots.clear();
    details.clear();
    expanded.clear();
    statusQueue.length = 0;
    statusRequested.clear();
    cloneOperationId = void 0;
    cloneConfirmation = void 0;
    cloneState = void 0;
    cloneStatus.hidden = true;
    clonePath.textContent = "";
    dialogDetails.replaceChildren();
    if (dialog.open) dialog.close();
    personal = emptyCollection();
    searched = emptyCollection();
    query = "";
    search.value = "";
    pendingSearch = false;
    activeKey = "";
    element(".repo-selected-title").textContent = "Repository";
    element(".repo-source-stamp").textContent = "";
    setPopup(false);
  }
  function receive(next) {
    if (disposed) return;
    const before = snapshot.connection.state;
    if (next.connection.generation !== snapshot.connection.generation || next.connection.state !== "connected") clearRemoteState();
    snapshot = next;
    onLocalContext(next.localContext.contextId);
    const connected = next.connection.state === "connected";
    container.classList.toggle("repo-connected", connected);
    connect.hidden = connected;
    connect.disabled = next.connection.state === "connecting";
    disconnect.hidden = next.connection.state === "disconnected";
    search.disabled = !connected;
    toggleRail.disabled = !connected;
    refreshList.disabled = !connected;
    element(".repo-account").textContent = connected ? next.connection.accountLabel ?? "Microsoft account" : next.connection.state === "connecting" ? "Connecting Microsoft account..." : "Microsoft account not connected";
    localButton.title = `Local workspace: ${next.localContext.label}`;
    clone.hidden = !next.capabilities.clone;
    local.hidden = next.mode !== "local";
    remote.hidden = next.mode === "local";
    if (next.connection.error) message.textContent = next.connection.error.message;
    renderTrees();
    if (connected && (before !== "connected" || !currentCollection().initialized)) void loadCollection(false);
    if (connected && cloneOperationId) void updateClone();
  }
  function keyboard(event, surface) {
    if (event.key === "Escape" && surface === "popup") {
      event.preventDefault();
      event.stopPropagation();
      setPopup(false);
      return;
    }
    if (surface === "popup" && !popupOpen) {
      if (event.key !== "ArrowDown") return;
      setPopup(true);
    }
    if (!nodes.length || pendingSearch) return;
    const index = nodes.findIndex((node2) => node2.key === activeKey);
    const node = nodes[Math.max(0, index)];
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const target = event.key === "Home" ? 0 : event.key === "End" ? nodes.length - 1 : Math.max(0, Math.min(nodes.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
      activeKey = nodes[target].key;
      const tree = surface === "popup" ? popupTree : railTree;
      if (target * 32 < tree.scrollTop || (target + 1) * 32 > tree.scrollTop + (tree.clientHeight || 400)) tree.scrollTop = Math.max(0, target * 32 - 64);
      paint(tree, surface);
      if (surface === "rail") rowMaps.rail.get(activeKey)?.focus({ preventScroll: true });
    } else if (event.key === "Enter" || event.key === "ArrowRight" && node.expanded === false) {
      event.preventDefault();
      activeKey = node.key;
      void activate(node, surface);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (node.expanded) {
        expanded.delete(node.key);
        renderTrees();
      } else if (node.parentKey) {
        activeKey = node.parentKey;
        renderTrees();
        if (surface === "rail") rowMaps.rail.get(activeKey)?.focus({ preventScroll: true });
      }
    }
  }
  listen(search, "input", () => changeSearch());
  listen(search, "focus", () => setPopup(true));
  listen(search, "click", () => setPopup(true));
  listen(search, "keydown", (event) => keyboard(event, "popup"));
  listen(railTree, "keydown", (event) => keyboard(event, "rail"));
  listen(railTree, "scroll", () => paint(railTree, "rail"));
  listen(popupTree, "scroll", () => paint(popupTree, "popup"));
  listen(document2, "mousedown", (event) => {
    const target = event.target;
    if (target && !popup.contains(target) && !search.parentElement.contains(target)) setPopup(false);
  });
  listen(window, "resize", () => {
    placePopup();
    renderTrees();
  });
  receive(snapshot);
  return { receive, dispose() {
    disposed = true;
    api.abort();
    controlApi.abort();
    collectionController?.abort();
    if (searchTimer !== void 0) window.clearTimeout(searchTimer);
    for (const remove of listeners) remove();
    reader.dispose();
    if (dialog.open) dialog.close();
    container.parentElement?.insertBefore(localHeader, container);
    container.parentElement?.insertBefore(localLayout, container);
    container.replaceChildren();
    container.hidden = true;
  } };
}
export {
  mountRepositoryBrowser
};
/*! Bundled license information:

lucide/dist/esm/defaultAttributes.mjs:
lucide/dist/esm/createElement.mjs:
lucide/dist/esm/icons/arrow-left.mjs:
lucide/dist/esm/icons/check.mjs:
lucide/dist/esm/icons/chevron-down.mjs:
lucide/dist/esm/icons/chevron-right.mjs:
lucide/dist/esm/icons/copy.mjs:
lucide/dist/esm/icons/download.mjs:
lucide/dist/esm/icons/ellipsis.mjs:
lucide/dist/esm/icons/file-text.mjs:
lucide/dist/esm/icons/folder-open.mjs:
lucide/dist/esm/icons/folder.mjs:
lucide/dist/esm/icons/git-branch.mjs:
lucide/dist/esm/icons/log-out.mjs:
lucide/dist/esm/icons/log-in.mjs:
lucide/dist/esm/icons/panel-left.mjs:
lucide/dist/esm/icons/refresh-cw.mjs:
lucide/dist/esm/icons/search.mjs:
lucide/dist/esm/icons/x.mjs:
lucide/dist/esm/lucide.mjs:
  (**
   * @license lucide v1.42.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
