# sdd-canvas

A GitHub Copilot **canvas extension** that wraps the Spec Kit core
**Spec-Driven Development** workflow — the pipeline that takes a feature from an
idea to shipped code:

```
constitution → specify → clarify → plan → tasks → analyze → checklist → implement
```

The canvas gives that workflow a side-panel UI: it lists every feature under
`specs/<feature>/`, shows which stages are done, previews each Markdown
artifact, and drives the pipeline by invoking the generated core `speckit-*`
skills through the agent.

![The spec-driven development canvas showing a ratified constitution and three features across specify → clarify → plan → tasks → analyze → checklist → implement, with an active feature and implementation progress](../../../../docs/images/sdd-canvas.png)

## Quickstart

> This is a **canvas extension** — it opens in the **GitHub Copilot app** side
> panel, not the terminal CLI. There is no slash command or menu entry.

1. Register the marketplace and install it (see [Install](#install)):

   ```bash
   copilot plugin marketplace add OWNER/spec-kit-copilot
   copilot plugin install spec-kit-copilot-sdd@spec-kit-marketplace
   ```
2. Ask Copilot in chat: **"Open Spec-Driven Development"**.

The development build opens a repository chooser first. Choose **Use current
workspace**, or ask for **Spec-Driven Development (Current Workspace)** to open
the original dashboard directly without remote authentication. See
[Opening the dashboard](#opening-the-dashboard) for details.

## What it does

- **Pipeline overview** — a live count of how many features have reached each
  primary milestone (`specify` / `plan` / `tasks` / `implement`).
- **Project constitution** — a top-level card showing whether the project
  constitution (`.specify/memory/constitution.md`) is missing, still a template,
  or ratified, with one-click **Create / update** and **View**.
- **Per-feature cards** — title, feature slug, an **active** badge for the
  feature recorded in `.specify/feature.json`, `clarified` / checklist badges, a
  task-completion progress bar, a pill per stage (done / next / available /
  stale / pending), and a **Run &lt;next stage&gt;** button.
- **Full core flow, essential and optional** — every card exposes all eight
  commands: the essential spine (**specify → plan → tasks → implement**) plus the
  optional quality gates **clarify** (before plan), **analyze** (after tasks),
  and **checklist**.
- **Correct ordering, enforced** — clarify/plan/checklist need a current
  `spec.md`, tasks needs `plan.md`, analyze/implement need `tasks.md`. The rules
  are enforced both in the UI and server-side.
- **Rerun with overwrite** — rerunning `plan` or `tasks` explicitly authorizes
  overwrite, uses the existing artifact as context, preserves still-valid
  content, and marks later artifacts stale until rerun.
- **Analyze is honest about state** — `analyze` is read-only and writes no file,
  so it is always available once `tasks.md` exists but never shows a persistent
  "done" badge.
- **Rendered artifact preview** — view `spec.md`, `plan.md`, `tasks.md`, and the
  constitution as formatted headings, lists, code, blockquotes, and tables in a
  dedicated full-width canvas view with a **Back to dashboard** control.
- **Targeted clarification** — `[NEEDS CLARIFICATION: …]` markers in a spec render
  a **Clarify** action. The canvas requires an answer in a confirmation dialog
  before it sends a validated `clarify` run for that feature to the agent.
- **New feature → specify** — describe what you want to build and kick off
  `speckit-specify`, which creates the feature spec under `specs/`.
- **Guided prerequisite setup** — when Spec Kit is not initialized in Copilot
  skills mode, the canvas makes setup the first step and sends the required
  setup work to the agent instead of forwarding an unavailable command.
- **Live updates** — the panel refreshes automatically (SSE) as the core
  commands write new artifacts.

Artifact browsing never writes spec files. Repository entry does not initialize
projects or dispatch workflows. Workflow edits still run through the original
core commands and the current Copilot session's permissions.

## Repository Entry

Normal `sdd-canvas` launch is chooser-first. **Use current workspace** verifies the
actual local repository and opens the original canvas without a connection
profile, sign-in, clone, or supported remote handoff. The unconditional
`sdd-canvas-direct` provider retains the original canvas and explicit prerequisites.
Separate user-local entry settings can disable the chooser; invalid settings fall
back to direct entry. Remote configuration never controls the local route.

Configured Azure DevOps discovery offers team suggestions and typed project
search inside one dropdown, without an embedded rail or pre-clone artifact
reader. A fresh configured chooser starts delegated Microsoft sign-in once through
the system browser. Existing browser SSO may complete it without a prompt; account
selection, consent, or MFA may still be required. Disconnect, refresh, and page
reload do not repeat the attempt; the Connect control remains for explicit retry.
GitHub Copilot sign-in is not reused as an Azure DevOps token. Tokens stay in
memory and are discarded on disconnect or close; no persistent cache is added.

**Cloning is independent of automatic handoff.** Explicit **Confirm and clone**
creates one checkout at the displayed managed destination after fresh account,
source, workspace and activity checks. These are observations, not an atomic App
reservation. Busy, unknown or stale observations reject without queued retry.
Completion shows **Clone complete** and a copyable path; completed checkouts
remain available after reconnecting. The current App workspace is not changed.

Automatic switching remains blocked because the installed public SDK does not
supply the verified App activation and reconciliation contract. Unsupported
handoff controls are hidden. Manual opening, private IPC or cwd-only mutation
does not count as `workspace_activated` or independently verified `canvas_ready`.

See the [repository entry guide](../../../../docs/sdd-repository-browser.md),
[validation guide](../../../../specs/002-repository-entry-flow/quickstart.md), and
[acceptance report](../../../../specs/002-repository-entry-flow/evidence/acceptance.md)
for configuration, recovery, exact results and blocked requirements.

The entry build ships five manifest-verified runtime files: the server bundle,
its browser-opening helper and notices, and the named entry JavaScript/CSS.
The separate `entry.html` is staged with the unchanged downstream canvas.
Obsolete embedded browser assets, build sources, test adapters, private profiles,
and a second SDK are excluded from installable output.

## Feature targeting

Because `speckit-specify` auto-generates the feature directory (e.g.
`specs/003-user-auth`), downstream commands are told which feature to operate on
by exporting `SPECIFY_FEATURE_DIRECTORY=specs/<feature>` in the prompt the canvas
sends. This matches Spec Kit's own feature-resolution order (explicit
`SPECIFY_FEATURE_DIRECTORY`, then `.specify/feature.json`).

## Opening the dashboard

This is a **canvas extension**, so it renders in the **GitHub Copilot app** side
panel — not in the plain terminal CLI. Installing the plugin only *registers* the
canvas; nothing opens automatically.

To open it, ask Copilot in chat, e.g. **"Open Spec-Driven Development"** (or "open
the SDD dashboard"). The agent matches your request to this canvas
(`id: sdd-canvas`, displayName **"Spec-Driven Development"**) and opens it in a
side panel. In this development build it opens the chooser; continue locally or
request `sdd-canvas-direct` for the original dashboard. There is no slash command or menu entry — discovery is the agent
matching the canvas name/description.

Once the original dashboard is open you can drive it two ways:

- **Click the panel** — the constitution card, the New feature → specify form,
  and each card's stage pills, Run/Rerun, and Clarify buttons.
- **Ask the agent** — the canvas also exposes agent-callable actions
  (`list_features`, `setup_sdd`, `run_stage`, `clarify_item`).

If the project isn't set up for Spec Kit in Copilot skills mode, the canvas
shows a setup step first.

## How it drives the pipeline

Buttons in the canvas POST to a loopback HTTP endpoint, which calls
`session.send({ prompt: "/skill:speckit-<command> …" })`. The skill runs in your
normal chat session — watch the transcript for the agent's work and any prompts
(e.g. URL-fetch approval).

Each open canvas gets a random capability token. The loopback server requires
that token and its canonical Host/Origin on UI, API, and event-stream requests.

Commands are restricted to the eight core `speckit-*` skills and feature slugs
are normalized to `[a-z0-9-]`, so the canvas can only trigger core SDD stages.

## Agent-callable actions

- `list_features` — returns all features with per-stage progress, clarify /
  checklist gate status, implementation task progress, the active feature, and
  the project constitution status.
- `setup_sdd` — asks the agent to initialize Spec Kit in Copilot skills mode.
- `clarify_item` — validates a clarification by feature/index/question, captures
  the user's answer, and runs `clarify` for that feature.
- `run_stage` — runs or reruns a command
  (`{ key, feature?, description?, instructions?, overwrite? }`). Use
  `key: "specify"` with a `description` to create a feature; other keys operate
  on an existing feature slug. Rerunning `plan` / `tasks` requires
  `overwrite: true`.

## Install

**Via marketplace (recommended):**

```bash
copilot plugin marketplace add OWNER/spec-kit-copilot
copilot plugin install spec-kit-copilot-sdd@spec-kit-marketplace
```

The plugin manifest lives at `plugins/spec-kit-copilot-sdd/plugin.json` and
declares this directory through its `extensions/` component path.

**Anywhere else (gist):** share it as a private gist
("Share extension as gist…" in the command palette, or the `share_extension`
tool), then install with "Install extension from gist…" into
`~/.copilot/extensions/` so it follows you across projects. The bundled
`copilot-extension.json` manifest is what makes the gist install flow recognize
it.

## Requirements

The canvas detects whether the project is initialized and whether the core
spec-driven skills are installed. If either prerequisite is missing, it presents
a setup action before the new-feature form. Features are written under
`specs/<feature>/`; the constitution under `.specify/memory/constitution.md`.

## Files

| File | Purpose |
|------|---------|
| `extension.mjs` | SDK wiring: per-instance loopback server, HTTP + SSE endpoints, canvas actions, `session.send` driving with `SPECIFY_FEATURE_DIRECTORY` targeting. |
| `sdd.mjs` | Filesystem scan: project-root resolution, per-feature stage/gate detection, task-progress and constitution status, safe artifact reads. |
| `index.html` | The dashboard UI (served to the canvas iframe). |
| `copilot-extension.json` | Manifest for gist share/install. |
