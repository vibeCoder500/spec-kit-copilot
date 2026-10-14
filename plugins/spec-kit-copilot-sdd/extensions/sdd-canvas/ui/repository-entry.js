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

// node_modules/lucide/dist/esm/icons/check.mjs
var Check = [["path", { d: "M20 6 9 17l-5-5" }]];

// node_modules/lucide/dist/esm/icons/circle.mjs
var Circle = [["circle", { cx: "12", cy: "12", r: "10" }]];

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

// node_modules/lucide/dist/esm/icons/loader-circle.mjs
var LoaderCircle = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];

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

// node_modules/lucide/dist/esm/icons/triangle-alert.mjs
var TriangleAlert = [
  ["path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }],
  ["path", { d: "M12 9v4" }],
  ["path", { d: "M12 17h.01" }]
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
  existing_repository_conflict: "The destination already exists but is not a matching, verifiable repository. It was preserved; no clone was attempted.",
  invalid_repository_name: "The repository name cannot be used safely as a local folder name.",
  clone_cancelled: "Repository preparation was cancelled.",
  remote_read_only: "Open the repository in a verified local session to run workflows.",
  local_context_mismatch: "The workflow does not match this session's local repository.",
  entry_required: "Choose a repository or continue with the current workspace first.",
  source_changed: "The repository's default revision changed. Select it again before confirming.",
  context_changed: "The active workspace changed. Review the repository selection again.",
  confirmation_expired: "Clone confirmation expired. Review and confirm the selection again.",
  session_busy: "The current session is busy. Wait until it is idle, then try again.",
  clone_identity_changed: "The prepared checkout changed. It has been preserved and handoff is blocked.",
  clone_migration_recovery_required: "Repository migration failed and the original path could not be restored. The named checkout was preserved; review it before trying again.",
  handoff_in_progress: "The repository handoff is still in progress.",
  handoff_unknown: "The handoff outcome is not confirmed. Check its status before trying again.",
  host_handoff_unsupported: "This Copilot App host does not provide the verified repository handoff capability.",
  activity_unknown: "The host's activity state could not be verified. Repository preparation is blocked.",
  canvas_unavailable: "The original Spec Kit canvas is unavailable in the target session.",
  app_launcher_unavailable: "A supported installed Copilot CLI is required to open this checkout in the App.",
  app_launch_failed: "The Copilot App open request failed. The checkout has been preserved.",
  app_launch_unknown: "The App open request could not be confirmed. Check the App before opening again.",
  scaffolding_conflict: "Setup is already running for this checkout. Reopen its canvas to follow progress.",
  scaffolding_not_required: "Spec Kit is already enabled. Open the original canvas.",
  scaffolding_required: "Complete organization setup using the canvas button first.",
  scaffolding_failed: "Organization setup failed. Review the failed step, then explicitly retry.",
  scaffolding_cancelled: "Organization setup was cancelled. Completed artifacts were retained.",
  scaffolding_auth_failed: "Organization registry authentication failed. Complete GitHub Enterprise sign-in and retry.",
  scaffolding_prerequisite_missing: "Install GitHub CLI and uv or pipx, then retry setup. Automatic prerequisite installation requires Windows Package Manager.",
  scaffolding_version_unsupported: "The installed Specify CLI does not meet the organization bootstrap's minimum version.",
  scaffolding_registry_invalid: "The organization bootstrap or bundle metadata is incompatible. No unreviewed registry commands were executed.",
  scaffolding_storage_invalid: "Setup encountered an invalid, redirected, or unwritable configuration path. Existing files were preserved.",
  scaffolding_catalog_conflict: "An existing catalog conflicts with the organization setup. Review its URL and installation policy before retrying.",
  scaffolding_verification_failed: "The required Spec Kit bundle artifacts could not be verified. The workflow canvas remains blocked.",
  skills_reload_unavailable: "This host cannot reload the generated project skills. Reload skills in the App, then retry the final setup step.",
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

// src/ui/repository-scaffolding.ts
var LABELS = {
  pending: "Pending",
  loading: "Loading",
  waiting: "Waiting for sign-in",
  completed: "Completed",
  skipped: "Already ready",
  error: "Error",
  cancelled: "Cancelled"
};
var GLYPHS = { pending: Circle, loading: LoaderCircle, waiting: LoaderCircle, completed: Check, skipped: Check, error: TriangleAlert, cancelled: X };
async function mountRepositoryScaffolding({ container, request, onWorkflow }) {
  const document2 = container.ownerDocument;
  const window = document2.defaultView;
  const api = createRepositoryApi({ document: document2, request, namespace: "scaffolding" });
  let snapshot;
  let disposed = false;
  let submitting = false;
  let continuing = false;
  let autoContinued = false;
  let requestError = "";
  let pollTimer;
  let handoverTimer;
  container.className = "entry-flow setup-flow";
  container.innerHTML = `<header class="entry-heading"><div><p class="entry-product">Spec-Driven Development</p><h1>Setting up this repository</h1></div><span class="setup-refresh"></span></header>
        <section class="entry-current" aria-label="Setup repository"><span class="entry-current-icon" aria-hidden="true"></span><div class="entry-current-name"><span class="entry-label">Current repository</span><strong class="setup-repository">Checking workspace...</strong><span class="entry-path setup-path"></span></div></section>
        <section class="setup-recommendation" aria-label="Recommended organization setup"><div class="setup-recommendation-heading"><h2>Default organization bundle</h2><span class="setup-recommended">Recommended</span></div>
            <p>Spec Kit is initialized automatically in Copilot skills mode with the organization's recommended bundle, including its extensions and presets.</p>
            <p class="setup-consent">Repository entry installs or updates local setup tools, opens organization sign-in if needed, configures registry authentication and all four catalogs, and adds Spec Kit-managed files in this checkout. Existing Spec Kit-managed files may be replaced. Application source is not rewritten; nothing is committed, pushed, or deployed.</p>
            <p class="setup-source"></p><div class="setup-actions"></div></section>
        <section class="setup-progress" aria-label="Setup progress"><div class="setup-progress-heading"><h2>Setup progress</h2><span class="setup-count"></span></div><progress class="setup-meter" max="13" value="0" aria-label="Completed setup steps"></progress><ol class="setup-steps"></ol></section>
        <footer class="entry-footer"><div class="setup-message" role="status" aria-live="polite">Loading setup state...</div></footer>`;
  const element = (selector) => container.querySelector(selector);
  const message = element(".setup-message");
  const steps = element(".setup-steps");
  element(".entry-current-icon").append(createElement(FolderOpen, { width: "24", height: "24", "aria-hidden": "true" }));
  const requestId = () => `setup-${window.crypto.randomUUID()}`;
  function button(label, glyph, action, primary = false) {
    const control = document2.createElement("button");
    control.type = "button";
    control.className = `entry-command${primary ? " entry-primary" : ""}`;
    control.append(createElement(glyph, { width: "18", height: "18", "aria-hidden": "true" }), document2.createTextNode(label));
    control.addEventListener("click", action);
    return control;
  }
  const retry = button("Retry organization setup", RefreshCw, () => {
    void start();
  }, true);
  retry.dataset.action = "retry-setup";
  retry.hidden = true;
  retry.disabled = true;
  const cancel = button("Cancel setup", Square, () => {
    void cancelSetup();
  });
  cancel.dataset.action = "cancel-setup";
  cancel.hidden = true;
  const proceed = button("Open Spec Kit canvas", Check, () => {
    void openWorkflow();
  });
  proceed.dataset.action = "continue-scaffolding";
  proceed.hidden = true;
  const refresh = button("Refresh setup state", RefreshCw, () => {
    void refreshState();
  });
  element(".setup-refresh").append(refresh);
  element(".setup-actions").append(retry, cancel, proceed);
  const safeError = (error) => knownRepositoryError(error?.code).message;
  const active = () => Boolean(snapshot?.job && ["running", "waiting"].includes(snapshot.job.status));
  function progressRow(step, artifact = false) {
    const row = document2.createElement("li");
    row.className = "setup-step";
    row.dataset.status = step.status;
    row.dataset[artifact ? "artifact" : "step"] = step.id;
    const glyph = createElement(GLYPHS[step.status], { width: "18", height: "18", "aria-hidden": "true" });
    glyph.classList.add("setup-step-icon");
    const content = document2.createElement("div");
    content.className = "setup-step-content";
    const label = document2.createElement("strong");
    label.textContent = step.label;
    content.append(label);
    if ("kind" in step) {
      const metadata = document2.createElement("small");
      metadata.textContent = `${step.kind} / v${step.version}${step.priority ? ` / priority ${step.priority}` : ""}${step.strategy ? ` / ${step.strategy}` : ""}`;
      content.append(metadata);
    }
    if (step.detail) {
      const detail = document2.createElement("p");
      detail.textContent = step.detail;
      content.append(detail);
    }
    if (step.command) {
      const command = document2.createElement("code");
      command.textContent = step.command;
      content.append(command);
    }
    const status = document2.createElement("span");
    status.className = "setup-step-status";
    status.textContent = LABELS[step.status];
    row.append(glyph, content, status);
    if (step.id === "bundle" && snapshot?.job?.artifacts.length) {
      const artifacts = document2.createElement("ul");
      artifacts.className = "setup-artifacts";
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
    const source = element(".setup-source");
    source.replaceChildren();
    const link = document2.createElement("a");
    link.href = snapshot.recommendation.sourceUrl;
    link.textContent = snapshot.recommendation.bundleName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.referrerPolicy = "no-referrer";
    source.append(document2.createTextNode("Organization registry: "), link);
    const job = snapshot.job;
    const entries = job?.steps ?? snapshot.steps;
    const complete = entries.filter((step) => ["completed", "skipped"].includes(step.status)).length;
    element(".setup-count").textContent = `${complete} / ${entries.length} ready`;
    const meter = element(".setup-meter");
    meter.max = entries.length;
    meter.value = complete;
    steps.replaceChildren(...entries.map((step) => progressRow(step)));
    const recoverable = snapshot.automaticStartError || job && ["error", "cancelled", "interrupted"].includes(job.status);
    retry.hidden = !recoverable;
    retry.disabled = submitting || continuing || !snapshot.canStart || job?.status === "completed";
    cancel.hidden = !active();
    cancel.disabled = submitting || continuing;
    proceed.hidden = job?.status !== "completed";
    proceed.disabled = continuing;
    refresh.disabled = submitting || continuing;
    container.setAttribute("aria-busy", String(submitting || continuing || active() || !job && !snapshot.automaticStartError));
    container.dataset.setupState = job?.status ?? (snapshot.automaticStartError ? "error" : "pending");
    if (!submitting && !continuing) {
      message.textContent = requestError || job?.message || (snapshot.automaticStartError === "session_busy" && snapshot.canStart ? "Automatic setup was blocked while this session was busy. It is now idle; choose Retry organization setup to continue." : snapshot.automaticStartError ? knownRepositoryError(snapshot.automaticStartError).message : job?.status === "waiting" ? "Complete sign-in in the system browser to continue." : job?.status === "running" ? "Setup is running in this checkout. Closing the canvas does not cancel it." : snapshot.blockedReason ? knownRepositoryError(snapshot.blockedReason).message : "Preparing automatic organization setup for this repository...");
    }
    if (job?.status === "completed" && !autoContinued) {
      autoContinued = true;
      handoverTimer = window.setTimeout(() => {
        void openWorkflow();
      }, 800);
    }
  }
  function schedulePoll() {
    if (pollTimer !== void 0) window.clearTimeout(pollTimer);
    if (!disposed && !continuing && (active() || !snapshot?.job && !snapshot?.automaticStartError || !snapshot?.canStart && snapshot?.job?.status !== "completed")) {
      pollTimer = window.setTimeout(() => {
        void refreshState();
      }, 1500);
    }
  }
  async function refreshState() {
    try {
      const next = await api.call("state");
      if (!disposed) {
        snapshot = next;
        requestError = "";
        render();
      }
    } catch (error) {
      if (!disposed) {
        requestError = safeError(error);
        message.textContent = requestError;
        retry.disabled = true;
      }
    } finally {
      schedulePoll();
    }
  }
  async function start() {
    if (submitting || continuing || !snapshot?.canStart) return;
    submitting = true;
    requestError = "";
    message.textContent = "Starting the checkout-bound setup job...";
    render();
    try {
      snapshot = await api.call("state");
      if (disposed || snapshot.job?.status === "completed") return;
      if (!snapshot.canStart) throw knownRepositoryError(snapshot.blockedReason);
      const next = await api.call("start", {}, { contextId: snapshot.contextId, requestId: requestId() });
      if (!disposed) {
        snapshot = next;
        autoContinued = false;
      }
    } catch (error) {
      if (!disposed) requestError = safeError(error);
    } finally {
      submitting = false;
      if (!disposed) {
        render();
        schedulePoll();
      }
    }
  }
  async function cancelSetup() {
    if (submitting || !active() || !snapshot?.job) return;
    submitting = true;
    requestError = "";
    render();
    try {
      const next = await api.call("cancel", {}, { jobId: snapshot.job.id, requestId: requestId() });
      if (!disposed) snapshot = next;
    } catch (error) {
      if (!disposed) requestError = safeError(error);
    } finally {
      submitting = false;
      if (!disposed) {
        render();
        schedulePoll();
      }
    }
  }
  async function openWorkflow() {
    if (continuing || disposed || snapshot?.job?.status !== "completed") return;
    continuing = true;
    if (handoverTimer !== void 0) window.clearTimeout(handoverTimer);
    requestError = "";
    message.textContent = "Verifying setup and opening the original Spec Kit canvas...";
    render();
    try {
      await api.call("continue", {}, { requestId: requestId() });
      if (!disposed) {
        if (onWorkflow) onWorkflow();
        else window.location.reload();
      }
    } catch (error) {
      continuing = false;
      requestError = safeError(error);
      render();
    }
  }
  await refreshState();
  return {
    receive(next) {
      if (disposed) return;
      snapshot = next;
      render();
      schedulePoll();
    },
    refresh: refreshState,
    fail(error) {
      requestError = knownRepositoryError(error.code).message;
      message.textContent = requestError;
      retry.disabled = true;
    },
    dispose() {
      disposed = true;
      api.abort();
      if (pollTimer !== void 0) window.clearTimeout(pollTimer);
      if (handoverTimer !== void 0) window.clearTimeout(handoverTimer);
      container.replaceChildren();
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
        <p class="entry-muted">Repositories without SDD automatically receive the recommended organization setup before Spec Kit opens. Existing SDD repositories open directly. Setup may install tools, require organization sign-in, and add or replace Spec Kit-managed files; application source is retained.</p>
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
  function openCheckoutButton(operationId, appCanvas) {
    const control = button("Open in Copilot App", ExternalLink, () => {
      void launchCheckout(operationId);
    }, true);
    control.dataset.action = "open-checkout";
    control.disabled = submitting || snapshot?.host.canOpenClone !== true || snapshot.host.activity !== "idle";
    if (appCanvas && appCanvas.launchStatus !== "failed" && appCanvas.canvasStatus !== "failed" && (appCanvas.launchStatus === "unknown" || ["opening", "unknown"].includes(appCanvas.canvasStatus) || appCanvas.expiresAt > Date.now())) control.disabled = true;
    return control;
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
      ["Commit", selection.checkoutCommit ?? selection.repository.sourceVersion ?? "Unavailable", "commit"],
      ["Destination", selection.destination, "destination"],
      ["App workspace", selection.openInApp ? "New session + Spec Kit" : snapshot?.host.canHandoff ? "Automatic handoff" : "Unchanged", "workspace"]
    ]) {
      const label = document2.createElement("dt");
      label.textContent = name;
      const content = document2.createElement("dd");
      content.textContent = value;
      content.dataset.field = field;
      summary.append(label, content);
    }
    if (selection.copyDestination) {
      for (const [name, value, field] of [
        ["Copy destination", selection.copyDestination, "copy-destination"],
        ["Copy commit", selection.repository.sourceVersion ?? "Unavailable", "copy-commit"]
      ]) {
        const label = document2.createElement("dt");
        label.textContent = name;
        const content = document2.createElement("dd");
        content.textContent = value;
        content.dataset.field = field;
        summary.append(label, content);
      }
    }
    const actions = document2.createElement("div");
    actions.className = "entry-selection-actions";
    if (selection.matchesCurrentWorkspace && !selection.reused) actions.append(button("Use current workspace", ArrowRight, () => {
      void open(false);
    }, true));
    else {
      const confirm = button(selection.reused ? selection.openInApp ? "Open existing in new session" : "Open existing Spec Kit repository" : selection.openInApp ? "Clone and open Spec Kit" : "Confirm and clone", selection.reused ? FolderOpen : Download, () => {
        void confirmClone();
      }, true);
      confirm.dataset.action = "confirm-clone";
      confirm.classList.add("entry-primary");
      confirm.disabled = submitting || !selection.confirmation || !snapshot?.host.canPrepareRemote || !selection.expiresAt || Date.now() >= selection.expiresAt;
      actions.append(confirm);
      if (selection.copyDestination) {
        const copy = button("Clone another copy (-Copy)", Download, () => {
          void confirmClone("copy");
        }, true);
        copy.dataset.action = "clone-copy";
        copy.disabled = confirm.disabled;
        actions.append(copy);
      }
    }
    const cancel = button("Cancel selection", X, () => {
      void cancelSelection();
    }, true);
    cancel.dataset.action = "cancel-selection";
    cancel.disabled = submitting;
    actions.append(cancel);
    selectionPanel.append(heading, summary, actions);
    if (selection.migrateFrom) {
      const migration = document2.createElement("p");
      migration.className = "entry-muted";
      migration.textContent = `Migrates the existing legacy checkout from ${selection.migrateFrom} to the repository-named destination shown above. Files, commits and branch are preserved. If an older session locks the folder, a verified local copy is used and the old folder is retained for that session; no remote clone or fetch is performed.`;
      selectionPanel.append(migration);
    }
    if (selection.openInApp) {
      const consent = document2.createElement("p");
      consent.className = "entry-muted";
      consent.textContent = `${selection.reused ? "Uses the existing checkout without fetching or resetting its files" : "Clones once into a repository-named folder"}, requests a new Copilot App session, and automatically sets up the recommended organization bundle if SDD is missing before opening Spec Kit. Setup may install or update local tools, require organization sign-in, configure all four catalogs, and add or replace Spec Kit-managed files. Application source is retained; nothing is committed, pushed, or deployed. The App may ask you to approve opening the folder. Your current session stays unchanged.`;
      selectionPanel.append(consent);
    }
    if (selection.copyDestination) {
      const copyConsent = document2.createElement("p");
      copyConsent.className = "entry-muted";
      copyConsent.textContent = "Alternatively, clone the default-branch commit shown above into the copy destination. The existing checkout, including local changes, stays untouched. Copies use -Copy, then -Copy-2, -Copy-3, and so on; no existing folder is overwritten." + (selection.openInApp ? " The copy also opens in a new session and automatically receives the recommended organization setup if SDD is missing before Spec Kit opens, subject to normal App folder approval." : "");
      selectionPanel.append(copyConsent);
    }
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
      preparing: operation.reused ? "Verifying existing repository..." : "Cloning repository...",
      verifying: "Verifying repository...",
      prepared: snapshot?.host.canHandoff ? "Repository prepared. Handoff pending." : operation.reused ? "Existing repository verified." : "Clone complete.",
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
    if (operation.appCanvas) {
      const request2 = operation.appCanvas;
      status.textContent = request2.canvasStatus === "opened" ? "Spec Kit canvas acknowledged in the new repository session." : request2.canvasStatus === "opening" ? "Opening repository setup or Spec Kit in the new repository session..." : request2.errorCode ? knownRepositoryError(request2.errorCode).message : request2.launchStatus === "requested" ? "Repository ready. App opening requested; waiting for the target canvas." : "Repository ready. Requesting a new Copilot App session...";
    }
    const destination = document2.createElement("p");
    destination.className = "entry-path";
    destination.textContent = operation.destination ?? "";
    operationPanel.append(status, destination);
    if (operation.state === "prepared") {
      const actions = document2.createElement("div");
      actions.className = "entry-selection-actions";
      actions.append(openCheckoutButton(operation.operationId, operation.appCanvas), copyCheckoutPath(operation.destination));
      operationPanel.append(actions);
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
      actions.append(openCheckoutButton(item.operationId, item.appCanvas), copyCheckoutPath(item.destination));
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
  async function confirmClone(mode = "reuse") {
    if (!selection?.confirmation || !snapshot?.host.canPrepareRemote || submitting || disposed) return;
    if (mode === "copy" && !selection.copyDestination) return;
    const current = selection;
    submitting = true;
    message.textContent = "Starting repository preparation...";
    render();
    try {
      operation = await api.call("clone", {}, { selectionId: current.selectionId, confirmation: current.confirmation, requestId: requestId(), mode });
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
  async function launchCheckout(operationId) {
    if (disposed || submitting || !connected() || snapshot?.host.canOpenClone !== true || snapshot.host.activity !== "idle") return;
    submitting = true;
    message.textContent = "Requesting Copilot App opening...";
    render();
    try {
      await api.call(`operations/${operationId}/open`, {}, { contextId: snapshot.localContext.contextId, requestId: requestId() });
      if (!disposed) message.textContent = "Open request sent to Copilot App.";
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
  mountRepositoryEntry,
  mountRepositoryScaffolding
};
/*! Bundled license information:

lucide/dist/esm/defaultAttributes.mjs:
lucide/dist/esm/createElement.mjs:
lucide/dist/esm/icons/arrow-right.mjs:
lucide/dist/esm/icons/check.mjs:
lucide/dist/esm/icons/circle.mjs:
lucide/dist/esm/icons/clipboard-copy.mjs:
lucide/dist/esm/icons/download.mjs:
lucide/dist/esm/icons/external-link.mjs:
lucide/dist/esm/icons/folder-open.mjs:
lucide/dist/esm/icons/git-branch.mjs:
lucide/dist/esm/icons/loader-circle.mjs:
lucide/dist/esm/icons/log-out.mjs:
lucide/dist/esm/icons/log-in.mjs:
lucide/dist/esm/icons/refresh-cw.mjs:
lucide/dist/esm/icons/search.mjs:
lucide/dist/esm/icons/square.mjs:
lucide/dist/esm/icons/triangle-alert.mjs:
lucide/dist/esm/icons/x.mjs:
lucide/dist/esm/lucide.mjs:
  (**
   * @license lucide v1.42.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
