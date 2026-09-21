# SDD Repository Entry

Unreleased development build on `plan/canvas-repository-discovery`. Marketplace
versions and historical preview ZIPs are unchanged.

**Current scope:** **Confirm and clone** can create a checkout independently of
automatic workspace switching, as requested on 2026-09-21. The current App
workspace stays unchanged; completion shows a copyable checkout path. Automatic
handoff remains unavailable because the installed App's supported workspace
activation contract is unverified. Clone completion is not handoff evidence. See the
[acceptance report](../specs/002-repository-entry-flow/evidence/acceptance.md).

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
6. Review the account, default branch, full commit, and destination. When the
   session is idle, choose **Confirm and clone** once and wait for **Clone
   complete**. The source workspace and its files stay unchanged.
7. Choose **Open in Copilot App**. In the App's **Open session?** dialog, verify
   the folder and choose **Allow**. The App opens a new session for the checkout;
   the previous session remains available. A restart is not normally required.
8. In that new session, say **"Open Spec-Driven Development"** again, then choose
   **Use current workspace**. The original dashboard opens against the cloned
   repository.
9. Select an existing feature and its **View** action to read the specification,
   plan, tasks, or constitution. To start new work, intentionally complete the
   dashboard's setup step if shown, then use **New feature** and the normal
   Specify, Clarify, Plan, Tasks, Analyze, Checklist, and Implement controls.
   Setup and Run actions are separate approvals; launching, cloning, and opening
   the canvas do not run those workflows for you.

If **Open in Copilot App** is disabled, wait for idle and refresh entry state.
If the installed native Copilot CLI is unavailable to the extension, use **Copy
checkout path**, then the App's ordinary **Open folder** action and step 8.
The [synthetic preview](#validation-and-preview) tests the UI only; it never signs
in, clones a private repository, or launches the real App.

## Open The Current Workspace

1. Ask Copilot to **Open Spec-Driven Development**. The normal
   enabled launch opens a separate repository chooser.
2. Select **Use current workspace**. The extension rechecks the session's actual
   Git identity and opens the original canvas in that session. This does not
   require a connection profile, Microsoft sign-in, cloning, or remote handoff.
3. Alternatively, say **"Open Spec-Driven Development (Current Workspace)"**.
   This always offers the original canvas directly,
   independently of remote configuration or chooser-controller failure.

Existing dirty files, untracked work, branches and drafts are not reset or stashed.
The local shortcut is unavailable when the session has no verified repository.
Direct entry retains the canvas's original explicit setup behavior for a project
that is not initialized; opening a canvas does not run setup or a workflow.

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

1. Review the selection and choose **Confirm and clone** explicitly. A preview or
   cancelled selection creates no checkout. Consent expires after 120 seconds;
   changed account, source revision, context or capabilities require reconfirmation.
2. The extension rereads the actual session context and activity before admission.
   Busy, unknown or stale observations reject without queueing or automatic resume.
   Intervening activity events invalidate the consent even if the next read is idle.
3. The managed destination is
   `~/SpecKitCanvas/repositories/<operation-id>/checkout`. A new preparation branch
   pins the reviewed commit. Existing checkouts are never reused or overwritten.
4. Native Git runs without a shell, fallback credentials, hooks, recursive
   submodules or LFS smudge. Credentials are not placed in Git arguments or remote
   URLs. Progress is bounded and **Cancel preparation** stops only owned work.
5. A completed clone shows **Clone complete**, the destination, and **Copy checkout
   path**. The current workspace stays unchanged. Reconnecting lists the retained
   checkout under **Cloned repositories** without cloning again.
6. Choose **Open in Copilot App** beside the completed or retained checkout. If
   the App shows **Open session?**, verify the folder and select **Allow**. This
   opens a new App session for that checkout; the previous session is retained.
   Open the original Spec Kit canvas in that new session when ready.

Clone-only admission is a checked preflight, not an atomic host reservation: the
App may start unrelated work after the observation. The clone is isolated from
the active repository and never retargets that work. No atomic capability is
advertised and no App activity is cancelled or paused.

## Open In Copilot App

This explicit action uses the existing native Copilot CLI's documented
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
no handler is available. Failure or uncertain completion retains the checkout and
copy control; inspect the App before explicitly trying again. **Copy checkout
path** and the App's ordinary **Open folder** remain available as manual fallbacks.

An explicitly opened managed clone, including a registered App worktree, uses
local workspace/Git verification without a fabricated `workspace_activated` or
`canvas_ready` record. Normal later local edits are retained. Pending automatic
handoffs still require their own guarded binding and cannot use this route as a
bypass.

## Automatic Handoff

Automatic switching remains gated by
[G-HOST](../specs/002-repository-entry-flow/contracts/host-handoff.md). It requires
`workspace_activated`, guarded target-canvas opening, independent identity
verification and `canvas_ready`. An attested registered linked worktree may use a
different branch while preserving the original preparation. Unsupported hosts
show no **Retry handoff** action. The separate **Open in Copilot App** button is
an explicit launch request, not automatic switching after clone completion.

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
- Existing canvas prerequisites and permission prompts still apply. No implicit
  `specify init`, skill/plugin installation, workflow, commit, push or deployment
  occurs during entry or acceptance checks.

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