# SDD Repository Entry

Unreleased development build on `plan/canvas-repository-discovery`. Marketplace
versions and historical preview ZIPs are unchanged.

**Current scope:** **Confirm and clone** can create a checkout independently of
automatic workspace switching, as requested on 2026-09-21. The current App
workspace stays unchanged; completion shows a copyable checkout path. Automatic
handoff remains unavailable because the installed App's supported workspace
activation contract is unverified. Clone completion is not handoff evidence. See the
[acceptance report](../specs/002-repository-entry-flow/evidence/acceptance.md).

## Open The Current Workspace

1. Ask Copilot to **Open Spec-Driven Development** (`sdd-canvas`). The normal
   enabled launch opens a separate repository chooser.
2. Select **Use current workspace**. The extension rechecks the session's actual
   Git identity and opens the original canvas in that session. This does not
   require a connection profile, Microsoft sign-in, cloning, or remote handoff.
3. Alternatively, ask for **Spec-Driven Development (Current Workspace)**
   (`sdd-canvas-direct`). This always offers the original canvas directly,
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

Reopen the chooser after configuration and select **Connect Microsoft account**.
The system browser may reuse Microsoft SSO or request account selection/MFA.
GitHub Copilot sign-in is not an Azure DevOps token. Tokens stay in memory for the
entry instance and are discarded on disconnect/close. Disconnect does not sign out
the browser, EzPzSpec, or Copilot, and never removes a completed clone.

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
6. To work in the checkout now, open that path using the App's normal **Open folder**
   action and open the original Spec Kit canvas there. This is an explicit manual
   action, not an automatic handoff or a workflow started by the entry layer.

Clone-only admission is a checked preflight, not an atomic host reservation: the
App may start unrelated work after the observation. The clone is isolated from
the active repository and never retargets that work. No atomic capability is
advertised and no App activity is cancelled or paused.

## Automatic Handoff

Automatic switching remains gated by
[G-HOST](../specs/002-repository-entry-flow/contracts/host-handoff.md). It requires
`workspace_activated`, guarded target-canvas opening, independent identity
verification and `canvas_ready`. An attested registered linked worktree may use a
different branch while preserving the original preparation. Unsupported hosts
show no **Retry handoff** action and do not attempt any workspace mutation.

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