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
- **Organization scaffolding** — a verified repository without Copilot skills-mode
  setup automatically starts the owned background job in the same artifact,
  without an initial Setup button, for sign-in, tool installation or
  upgrade, all four MSD catalogs, and the default `msd-bundle`. The canvas shows
  each step and component, supports cancellation/explicit retry, verifies the
  files, and reloads the session's project skills before opening the original
  workflow. It does not send a setup prompt to another agent.
- **Live updates** — the panel refreshes automatically (SSE) as the core
  commands write new artifacts.

Artifact browsing never writes spec files. Repository search, selection and
clone-only never initialize projects or dispatch workflows. Verified repository
continuation discloses automatic organization setup when SDD is missing;
already-enabled repositories open the original canvas directly. Ordinary direct
read-only previews remain non-mutating. Workflow edits still run through the
original commands and the current session's permissions.

## Recommended Organization Setup

The development build uses the
[MSD registry](https://msft.ghe.com/1eh-msd/msd-speckit-registry) as its source of
truth. The current recommended `msd-bundle` installs the `bug` extension and seven
MSD constitution presets. The fetched bootstrap determines the minimum CLI
version (currently 1.1.0); the installed CLI is not hard-pinned.
If the recommended organization mirror successfully installs an older release,
the job discloses that mismatch and retries official PyPI once. It never treats
an out-of-date CLI or failed installation as ready.

The job reuses GitHub CLI's credential store or opens its ordinary GHES browser
login. MFA/consent remain interactive when required. It merges a non-secret
three-host provider into `~/.specify/auth.json`; the token goes only to setup
child processes, never canvas state, repository files, or persistent user
environment variables. No App restart is required to pick up that token.

Setup runs in the verified current worktree with Copilot `--skills` and explicit
platform scripts. Existing catalogs and installed components are retained on
retry. CLI exit alone is not completion: component manifests/registries, bundle
provenance, core prerequisites and the actual session skill catalog must verify.
While setup is active or incomplete, workflow mutation APIs/actions are blocked.

Closing the canvas does not cancel the job. Refresh/reopen follows the existing
job; cancellation, failure, or interruption requires an explicit retry. Bounded,
credential-free progress and locks live under `~/SpecKitCanvas/scaffolding/`,
outside Git. Automatic prerequisite installation on Windows uses `winget` when
GitHub CLI or uv is missing; otherwise use an existing uv or pipx installation.
Missing installers, incompatible configuration, or failed sign-in are visible
errors, not silently skipped prerequisites.

The registry's
[`squad-v1.0.0.zip`](https://msft.ghe.com/1eh-msd/msd-speckit-registry/releases/download/v1.0.0/squad-v1.0.0.zip)
is a separate direct extension install, not the published default bundle. The
recommended button does not silently add Squad.

## Repository Entry

Normal `sdd-canvas` launch is chooser-first. **Use current workspace** verifies the
actual local repository and opens the original canvas without a connection
profile, sign-in, clone, or supported remote handoff. The unconditional
`sdd-canvas-direct` provider retains the original canvas and explicit prerequisites.
Separate user-local entry settings can disable the chooser; invalid settings fall
back to direct entry. Remote configuration never controls the local route.
The local route does not invoke `copilot app` or request a new session, so it does
not introduce the App's folder-opening permission dialog.

Configured Azure DevOps discovery offers team suggestions and typed project
search inside one dropdown, without an embedded rail or pre-clone artifact
reader. A fresh configured chooser starts delegated Microsoft sign-in once through
the system browser. Existing browser SSO may complete it without a prompt; account
selection, consent, or MFA may still be required. Disconnect, refresh, and page
reload do not repeat the attempt; the Connect control remains for explicit retry.
GitHub Copilot sign-in is not reused as an Azure DevOps token. Tokens stay in
memory and are discarded on disconnect or close; no persistent cache is added.

**Cloning is independent of atomic handoff.** **Clone and open Spec Kit**
creates one checkout and requests a new App session after fresh account,
source, workspace and activity checks. These are observations, not an atomic App
reservation. Busy, unknown or stale observations reject without queued retry.
Completion shows **Clone complete** and a copyable path; completed checkouts
remain available after reconnecting. The current App workspace is not changed.

New clones use `~/SpecKitCanvas/repositories/<repository-name>`. A matching copy
already in the managed root offers a primary **Open existing in new session**
action, preserving local commits, branch and dirty files without fetching or
resetting. It requests a new session even when the managed checkout is current;
**Use current workspace** remains the separate same-session shortcut.

The secondary **Clone another copy (-Copy)** action clones the reviewed remote
default-branch commit into `<repository-name>-Copy`, then the first available
numbered name (`-Copy-2`, `-Copy-3`, ...). The chooser displays the exact copy
destination and remote commit before consent. Local changes in the original are
not copied or modified. One consent authorizes only the chosen action; replaying
it with a different choice is rejected. A destination occupied after review
rejects without overwriting or renumbering behind the user's back. Both actions
use the same guarded automatic target-canvas opening when the App launcher is
available; otherwise they retain the verified/prepared path.

Wrong-origin collisions and changed-after-review content
are rejected without repair. Selection discloses migration of verified older
UUID/checkout copies into repository-named folders. A Windows-locked older
checkout is copied locally and reverified, preserving the old session's folder
without remote clone/fetch. Later selections prefer the named preparation,
and superseded operation IDs cannot reopen the old UUID path.

The selection discloses **New session + original canvas** before confirmation.
It uses an already-installed native `copilot app` launcher, preserving the source
session. Confirm the folder in the App's **Open session?** prompt when shown.
The target extension claims a short-lived persisted request once, verifies the
checkout or registered App worktree, and opens `sdd-canvas-direct` automatically:
no second **"Open Spec-Driven Development"** prompt or chooser. The same extension
must already be installed in the target session. Launcher acceptance and target
canvas acknowledgment are separate states; neither claims atomic App activation.
Unsupported launchers retain **Confirm and clone** and the copy-path fallback.
Completed checkouts offer **Open in Copilot App** for explicit recovery, with
unknown submitted outcomes blocking duplicate requests. No restart, model prompt,
workflow, or implicit installation occurs.
The public launcher cannot suppress approval for another folder or explicitly
set the chat title. Native testing has verified repository-named rail groups and
automatic original canvas opening after App approval; neither is atomic handoff.

Atomic switching of the source session remains blocked because the public SDK does not
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

The exception is a confirmed clone-and-open request: when its new repository
session loads this extension, the original dashboard opens without another chat
request. A normal session without such a request retains the existing launch UX.

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
