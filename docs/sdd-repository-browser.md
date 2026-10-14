# SDD Repository Entry

Unreleased SDD 0.3.0 development build on `feat/add-scaffolding-layer`, based on
`plan/canvas-repository-discovery`. Published installations and historical preview
ZIPs are unchanged.

**Current scope (2026-10-12):** **Clone and open Spec Kit** confirms one clone,
requests a new App session, and lets the installed target extension automatically
open the original canvas for that repository. No second chat prompt is sent.
The source session stays unchanged; ordinary App folder approval still applies.
Without the supported launcher, **Confirm and clone** retains the checkout and
copyable path. Atomic in-session handoff remains unverified; launcher completion
and target canvas acknowledgment are separate states. See the
[acceptance report](../specs/002-repository-entry-flow/evidence/acceptance.md).

**2026-10-14 automatic scaffolding amendment:** A verified target without Copilot
skills-mode setup automatically runs the recommended organization bootstrap in
the owned setup layer in that same SDD artifact. There is no initial Setup
button. Repository continuation/clone-and-open discloses the bootstrap effects.
The layer reports each step/component and returns to the original dashboard
after artifact and actual session-skill verification. Already-enabled targets
bypass scaffolding. Source preservation and normal App folder approval remain.

New clones use `~/SpecKitCanvas/repositories/<repository-name>`. If a verified
matching copy exists, the chooser offers two actions:

- **Open existing in new session** (primary): reuse the existing checkout without
  fetching, resetting, or changing local files, commits, or branches. With the
  supported App launcher, this requests a new session even if that managed
  checkout is already current, and the target extension opens the original canvas.
- **Clone another copy (-Copy)** (secondary): clone the reviewed remote
  default-branch commit, not the existing checkout's local changes, into
  `<repository-name>-Copy`. If occupied, use the first available numbered name
  such as `<repository-name>-Copy-2` or `<repository-name>-Copy-3`.

Both destinations and the copy's remote commit are displayed before confirmation.
One confirmation starts only the chosen action; duplicate requests cannot switch
choices or start another clone. If the copy destination becomes occupied after
review, preparation fails without overwriting it or silently choosing a new path.
Reselect the repository to review the next available name. Without the supported
launcher, existing-checkout verification and copy cloning retain their copyable
paths rather than promise a new session.

Unrelated name collisions are rejected, not overwritten. Selection discloses
migration of a verified older UUID/checkout copy to the repository-named folder.
If an older Windows session prevents moving it, a verified local copy is made
without fetching or cloning, retaining the old folder for that session. Subsequent
selection and retained-checkout opening use the named preparation; stale older
operation IDs cannot reopen the superseded path.
**Use current workspace** opens the canvas in the current session without calling
the native launcher or introducing an **Open session?** dialog. The documented App
launcher has no folder-approval suppression or explicit session-title option.
A repository-named directory avoids the generic `checkout` basename. Native
testing verified the repository-named left-rail group and automatic original
canvas opening after App approval. The chat title remains host-controlled
(`CLI Session` in the tested App).

## One-Time Local Setup

Committing this checkout does not update an installed marketplace plugin or an
earlier project-local test copy. Use the following steps to load this exact
development build on Windows. This is a local installation, not a marketplace
release or a push to GitHub.

1. Finish any active App work and close the old SDD canvas. In the App's plugin
   controls, disable any competing SDD provider for this test; keep the core
   Spec Kit skills plugin. Use a normal project without an older
   `.github/extensions/sdd-canvas` copy, because project extensions shadow user
   extensions. Preserve any older copy rather than deleting it blindly.
2. In PowerShell at this repository's root, export the already-built verified
   runtime and install only its extension payload into user scope:

   ```powershell
   $kit = Join-Path $env:TEMP ("speckit-sdd-entry-" + [guid]::NewGuid().ToString("N"))
   node .\scripts\canvas-reader\export-preview.mjs --output $kit
   if ($LASTEXITCODE -ne 0) { throw 'SDD export failed.' }
   node (Join-Path $kit 'preview.mjs') verify
   if ($LASTEXITCODE -ne 0) { throw 'SDD payload verification failed.' }
   $copilotHome = if ($env:COPILOT_HOME) { $env:COPILOT_HOME } else { Join-Path $HOME '.copilot' }
   $target = Join-Path $copilotHome 'extensions\sdd-canvas'
   if (Test-Path -LiteralPath $target) { throw 'An SDD user extension already exists; preserve it before replacing it.' }
   New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
   Copy-Item -LiteralPath (Join-Path $kit 'plugin\extensions\sdd-canvas') -Destination $target -Recurse
   ```

   The exporter does not include build dependencies, private profiles, or test
   adapters. Node 24 and the existing installed build dependencies are needed on
   this development checkout. No extra Copilot SDK is installed.
3. Configure the user-local repository profile described in
   [Remote Connection](#remote-connection), using the same approved tenant, public
   client registration, organization, and project used for repository testing.
   Set `enabled` to `true`. Do not put a token, password, or client secret in it.
   The earlier isolated test profile is not the normal user profile.
4. Restart the App normally or ask it to reload extensions, then start a fresh
   session in a normal local repository. This user-scoped installation will also
   be available in the newly opened clone.

## End-To-End Use

The normal launch request is **"Open Spec-Driven Development"**. Copilot discovers
the canvas by its name; users do not need provider IDs, canvas IDs, or JSON input.
Opening the canvas does not itself run setup or a workflow.

1. In GitHub Copilot App, choose **New project or session > Open folder** and
   select your starting repository. This is the desktop App, not the plain CLI.
2. Say **"Open Spec-Driven Development"**. With repository entry enabled, the first
   screen says **Choose a repository**. If the canvas is missing or an older copy
   opens, check the installation and competing providers, not the prompt wording.
3. For the existing repository, choose **Use current workspace** and proceed
   directly to its dashboard. This route does not wait for remote authentication.
4. For a remote repository, let the fresh chooser start Microsoft sign-in.
   Complete account selection, consent, or MFA if requested, then return to the
   App and wait for search to become enabled. After cancellation, failure, or
   Disconnect, use **Connect Microsoft account** for an explicit retry.
5. Focus the empty search box for team suggestions, or type a repository name
   and pause for one second. Select the intended result from the configured
   Azure DevOps project. Selection alone does not clone anything.
6. Review the account, default branch, full commit, destination, and disclosed
   **New session + Spec Kit** outcome, including automatic setup if SDD is missing.
   When idle, choose **Clone and open
   Spec Kit** once. The source session and its files stay unchanged.
7. In the App's **Open session?** dialog, verify
   the folder and choose **Allow**. The App opens a new session for the checkout;
   the previous session remains available. A restart is not normally required.
8. The target extension verifies the checkout or registered App worktree and
   opens the SDD artifact directly. An enabled repository shows the original
   dashboard; a repository without setup shows the scaffolding layer. Do not send another **"Open
   Spec-Driven Development"** prompt. If the target extension is missing or opening
   is blocked, the retained checkout remains available for explicit recovery.
9. If setup is missing, the background job starts automatically. Follow loading,
   authentication waiting, completed, skipped, and error states in the canvas.
   Complete normal browser consent/MFA if needed. Refresh/reopen attaches to the
   same job; use **Cancel setup** or explicit **Retry organization setup**, never
   another clone, for setup recovery.
10. On verified completion the same artifact returns to the original dashboard.
   Select an existing feature and its **View** action to read the specification,
   plan, tasks, or constitution; then use **New feature** and the normal
   Specify, Clarify, Plan, Tasks, Analyze, Checklist, and Implement controls.
   Automatic setup does not run feature workflows; those Run actions retain
   their normal separate approvals.

If **Open in Copilot App** is disabled, wait for idle and refresh entry state.
If the installed native Copilot CLI is unavailable to the extension, use **Copy
checkout path**, then the App's ordinary **Open folder** action and step 8.
The [synthetic preview](#validation-and-preview) tests the UI only; it never signs
in, clones a private repository, or launches the real App.

## Open The Current Workspace

1. Ask Copilot to **Open Spec-Driven Development**. The normal
   enabled launch opens a separate repository chooser.
2. Select **Use current workspace**. The extension rechecks the session's actual
   Git identity and opens Spec Kit in that session, automatically bootstrapping
   the recommended bundle if SDD is missing. Entry does not require an Azure
   DevOps profile/sign-in, cloning, or remote handoff; bootstrap may separately
   need network access and GHES sign-in. Already-enabled repositories work offline.
3. Alternatively, say **"Open Spec-Driven Development (Current Workspace)"**.
   This always offers the original canvas directly,
   independently of remote configuration or chooser-controller failure.

Existing dirty files, untracked work, branches and drafts are not reset or stashed.
The local shortcut is unavailable when the session has no verified repository.
Explicit direct entry preserves the original dashboard and read-only artifact
preview, including in projects whose stage execution is gated. Repository-chooser
continuation and prepared targets automatically start the organization setup
when core setup is missing. An already-started, incomplete job remains gated
across reopening; direct entry cannot bypass its mutation protection. Ordinary
direct read-only preview never initializes a project; neither entry runs a
feature workflow.

## Organization Bootstrap

The
[MSD registry README](https://msft.ghe.com/1eh-msd/msd-speckit-registry)
defines the standard bootstrap. The canvas fetches its workflow and bundle
metadata, checks compatibility, then executes the supported primitives
individually to report progress without the workflow's terminal-only error gates:

1. Find GitHub CLI or install it using Windows Package Manager; verify GHES
   authentication and open `gh auth login --hostname msft.ghe.com --web
   --git-protocol https` only when needed.
2. Merge the README's provider for `msft.ghe.com`, `raw.msft.ghe.com`, and
   `api.msft.ghe.com` into user `~/.specify/auth.json`. Preserve unrelated
   providers. Obtain the credential from GitHub CLI and supply
   `GH_ENTERPRISE_TOKEN` only to setup child processes; do not store the token in
   progress, repository files, or a persistent user environment variable.
3. Verify the live minimum (currently >= 1.1.0); install/update latest
   `specify-cli` from PyPI with uv or pipx and the recommended Microsoft package
   index if needed. No pinned Git tag or second Copilot SDK/agent is installed.
   If a successful mirror install still verifies below the live minimum, the job
   explains the stale mirror and retries official PyPI once, then verifies again.
   A failed installer/network request remains an explicit error.
4. Run `specify init --here --force --integration copilot
   --integration-options=--skills --script ps --ignore-agent-tools` on Windows
   (`sh` elsewhere), unless the core prerequisites already verify.
5. Register extension, preset, bundle, and workflow catalogs. Retain
   already-correct entries; incompatible existing installation policies are
   reported instead of overwritten.
6. Run `specify bundle install msd-bundle` through the normal bundle machinery.
   Its current eight components are extension `bug` and seven constitution
   presets, including conditional applicability layers. Show each installed
   manifest/registry's state rather than guessing from a successful exit.
7. Verify core prerequisites and bundle provenance, reload and verify the
   session's project skills through the supported SDK, then open the original
   dashboard without dispatching an agent prompt.

Setup writes only CLI-managed scaffolding; it does not create a feature,
ratify a constitution, commit, push, or deploy. `--force` may replace existing
Spec Kit-managed paths, as disclosed before repository continuation. Existing application files,
branches and dirty work are not reset or stashed.

The documented
`specify extension add squad --from https://msft.ghe.com/1eh-msd/msd-speckit-registry/releases/download/v1.0.0/squad-v1.0.0.zip`
is a separate direct extension install. It is not an alias for `msd-bundle` and
is not silently added by the recommended setup.

Progress and per-checkout process locks are bounded and user-local under
`~/SpecKitCanvas/scaffolding/`. Interrupted jobs never auto-resume. Required browser
consent/MFA, App folder approval, and unsupported-host limits remain visible.
See the [scaffolding implementation plan](../specs/003-repository-scaffolding/plan.md).

## Entry Settings

The chooser is enabled by default. To disable only the chooser, use the current
OS user's `~/.speckit-canvas/entry-settings.json`:

```json
{"schemaVersion": 1, "repositoryEntryEnabled": false}
```

Only those two fields are accepted. Malformed settings fall back to direct entry.
The runtime does not create or rewrite settings. Repository-controlled overrides
are not supported. This setting is separate from remote connection configuration.

## Remote Connection

Remote discovery requires a Microsoft account with access to the configured Azure
DevOps project. Delegated `vso.code` permits code reads; team suggestions also use
`vso.project`, `vso.work`, readable team settings and Code Search indexing. Consent
does not grant access to otherwise inaccessible repositories.

The existing public-client registration needs the desktop redirect
`http://localhost/speckit-canvas/oauth/callback`; the runtime uses an ephemeral
localhost port. Keep existing SPA/broker redirects, grants and tenant policies.
MFA and Conditional Access remain authoritative. Do not introduce a client secret.

Configure `~/.speckit-canvas/repository-profile.json` outside the repository:

| Field | Value |
| --- | --- |
| `schemaVersion` | Number `1` |
| `enabled` | Boolean; `false` disables remote discovery, not local entry |
| `tenantId` | Existing registration tenant UUID |
| `clientId` | Existing public-client application UUID |
| `organization` | Approved Azure DevOps organization |
| `project` | Approved Azure DevOps project |

Unknown fields, oversized files and redirected paths are rejected. Missing or
invalid remote configuration does not block current-workspace or direct entry.
Do not copy a complete environment file, token, PAT, secret, or credential cache.

Open a fresh chooser after configuration. It starts Microsoft sign-in once,
without requiring **Connect Microsoft account**. The system browser may reuse
Microsoft SSO or request account selection, consent, or MFA. Current-workspace and
direct entry remain available while connection is pending or fails.

Refresh, state events, and page reload do not restart an attempted connection.
After a failure or **Disconnect Microsoft account**, use **Connect Microsoft
account** to retry explicitly. Closing the canvas and opening a new entry session
permits a new automatic attempt. Unconfigured, disabled, or invalid profiles never
start sign-in.

GitHub Copilot sign-in is not an Azure DevOps token. Tokens stay in memory for the
entry instance and are discarded on disconnect/close; no persistent credential
cache is added. Disconnect does not sign out the browser, EzPzSpec, or Copilot,
and never removes a completed clone.

## Search And Select

Focus the empty search field for readable team-linked suggestions inside the
dropdown. Type a repository name to search readable enabled repositories in the
configured project after a one-second pause. All words must occur in the name.
Clear search to restore the independent suggestions; **More repositories** stays
within the current collection. Empty or failed suggestions never trigger a whole
project fallback. Explicit search and local entry remain available.

Use arrow keys and Enter to select; Escape closes the dropdown. Selection displays
the account, repository, current default branch, full commit, managed destination
and whether the App workspace will remain unchanged.
There is no separate rail, artifact tree, or pre-clone document preview. If the
selected repository is already the actual current repository, use local entry.

## Guarded Preparation

Cloning does not require automatic App handoff. It uses the current Microsoft
connection, the existing guarded native Git engine, and a separate managed path.

1. Review the selection and choose **Clone and open Spec Kit** explicitly when
   available, or **Confirm and clone** on unsupported hosts. A preview or
   cancelled selection creates no checkout. Consent expires after 120 seconds;
   changed account, source revision, context or capabilities require reconfirmation.
2. The extension rereads the actual session context and activity before admission.
   Busy, unknown or stale observations reject without queueing or automatic resume.
   Intervening activity events invalidate the consent even if the next read is idle.
3. The managed destination is
   `~/SpecKitCanvas/repositories/<repository-name>`. A new preparation branch
   pins the reviewed commit. A matching existing checkout is instead verified
   and reused without Git mutations; review displays its local commit and
   preserves its branch and dirty files. Identity or content changes after
   review require a new confirmation. Wrong-origin collisions and unsafe names
   stop explicitly without modifying the existing directory.
4. Native Git runs without a shell, fallback credentials, hooks, recursive
   submodules or LFS smudge. Credentials are not placed in Git arguments or remote
   URLs. Progress is bounded and **Cancel preparation** stops only owned work.
5. A completed clone shows **Clone complete**, the destination, and **Copy checkout
   path**. The current workspace stays unchanged. Reconnecting lists the retained
   checkout under **Cloned repositories** without cloning again.
6. With clone-and-open consent, successful cloning automatically requests
   **Open in Copilot App** once while the original idle/context checks still match. If
   the App shows **Open session?**, verify the folder and select **Allow**. This
   opens a new App session for that checkout; the previous session is retained.
   The target extension automatically opens the original Spec Kit canvas.
   Retained checkouts also offer an explicit **Open in Copilot App** recovery
   action; no recovery action clones again.

Clone-only admission is a checked preflight, not an atomic host reservation: the
App may start unrelated work after the observation. The clone is isolated from
the active repository and never retargets that work. No atomic capability is
advertised and no App activity is cancelled or paused.

## Open In Copilot App

This action, automatic after disclosed clone-and-open consent or explicit for a
retained checkout, uses the existing native Copilot CLI's documented
[`copilot app` command](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#command-line-commands)
with the verified checkout as its working directory. It works with an already
running App and can start the App when closed. The button never quits or restarts
the App itself, and never starts a CLI conversation, model prompt, or workflow.

An installed native Copilot CLI with the `app` subcommand must be discoverable on
the extension's PATH, directly or through its npm installation. No CLI is
installed or updated automatically. Windows native validation used CLI 1.0.83
and Copilot App 1.1.21. macOS uses the same documented command but has not been
verified natively here; other platforms leave the button unavailable.

The backend accepts only the retained operation ID and opaque context/request
IDs. It rechecks account access, owned checkout identity, and idle source context;
the browser cannot submit a path, URL, executable, or command arguments. Changed
checkouts are preserved and rejected, not reset. The child gets no bearer tokens
or SDK session variables. Busy/unknown state disables opening without queueing.

**Open request sent** means the launcher accepted the request, not that the App
approved it. The App may show an external-link approval or its download page if
no handler is available. **Original Spec Kit canvas acknowledged in the new repository
session** means that the
target session acknowledged the original canvas RPC, not that desktop visibility
or atomic activation was independently observed. Failure or uncertain completion
retains the checkout and copy control; unknown submitted outcomes block duplicate
launches rather than blindly retrying. **Copy checkout
path** and the App's ordinary **Open folder** remain available as manual fallbacks.

An explicitly opened managed clone, including a registered App worktree, uses
local workspace/Git verification without a fabricated `workspace_activated` or
`canvas_ready` record. Normal later local edits are retained. Pending automatic
handoffs still require their own guarded binding and cannot use this route as a
bypass.

The launch intent expires after ten minutes and is persisted separately from
atomic handoff records. Only one target process can claim it. The source session,
unrelated repositories, failed launches, expired requests, busy targets, and
changed checkout contents cannot consume it. Linked targets must share the
canonical Git common directory, be registered named worktrees at the reviewed
commit, and match the initial file fingerprint. Target session identifiers never
reach the browser state. The same development extension must already be installed
in the new session; entry does not install it or send a model prompt.

## Automatic Handoff

Automatic switching remains gated by
[G-HOST](../specs/002-repository-entry-flow/contracts/host-handoff.md). It requires
`workspace_activated`, guarded target-canvas opening, independent identity
verification and `canvas_ready`. An attested registered linked worktree may use a
different branch while preserving the original preparation. Unsupported hosts
show no **Retry handoff** action. Clone-and-open uses a separate native launch
request and target extension bootstrap, not an atomic switch of the source session.

Changing only a canvas heading or working-directory variable, manual folder
selection, a separate SDK client, private IPC, or a sequence of idle-read/cwd-write
calls is not automatic handoff. No such fallback is enabled.

## Recovery And Boundaries

- Busy during preparation: a clone already started may finish. On a clone-only
   host it remains a successful checkout, not a handoff error; becoming idle starts
   no additional action. A supported handoff requires a fresh explicit retry.
- Unknown result: retry queries the same attempt first. It cannot blindly create
  another transition. Activation-only recovery opens/verifies the same target.
- Missing provider or changed access/identity: retain the checkout and block
  readiness. Do not install a provider, copy markers, reset files or clone again.
- Disconnect/close: cancel only incomplete owned work. Completed records survive
   process replacement; reconnecting shows their paths without automatically
   cloning, switching or running a workflow.
- Completed records contain no tokens, capabilities or consent. Version-2 records
  are limited to 8 KiB and 256 inspected entries. Overflow or an interrupted locked
  update requires review; records are not deleted to make room. Legacy records are
  read-only and cannot authorize automatic recovery by themselves.
- Existing prerequisites and permission prompts still apply. The verified target
  automatically receives the disclosed organization bootstrap if SDD is missing.
  Search, selection, clone-only and ordinary direct read-only previews never run
  setup. No feature workflow, Copilot plugin installation, commit, push or
  deployment is implicit.

## Validation And Preview

Use the [validation guide](../specs/002-repository-entry-flow/quickstart.md) and
[isolated build package](../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/package.json).
Install locked dependencies only when necessary with lifecycle scripts disabled.
Typecheck, lint, unit tests, generated-payload verification, original canvas tests
and browser journeys are required. CI is configured for Windows/Linux; local
Windows results are not a claim that hosted CI or native App acceptance ran.

For the interactive synthetic chooser, run `npm run dev` from the isolated build
package and open the printed loopback URL. Its authentication, Git and host are
test doubles; it never signs into Microsoft, reads a private repository or clones
from the network. Stop it with Ctrl+C to clean owned fixtures.

The existing [read-only preview manual](sdd-markdown-preview-user-manual.md) applies
only to its historical ZIP/checksum. The earlier manual-open validation is not
acceptance evidence for this replacement entry flow.