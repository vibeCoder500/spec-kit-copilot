# SDD Repository Browser

Status: Unreleased development implementation on
`plan/canvas-repository-discovery`. No marketplace update, release, or replacement
of an existing preview ZIP is implied by these instructions.

## Requirements

- GitHub Copilot App with the current SDD canvas payload available in the session.
- A Microsoft account in the configured Entra tenant with access to the configured
  Azure DevOps project/repositories. App consent never grants access to otherwise
  inaccessible repositories.
- Delegated `vso.code` for code reads. Team personalization also uses `vso.project`
  and `vso.work`, readable team settings, and available Code Search indexing.
- A public-client desktop redirect on the existing registration:
  `http://localhost/speckit-canvas/oauth/callback`. Keep existing SPA/broker
  redirects and grants intact. The runtime uses an ephemeral localhost port.
- Existing Git on the App process's trusted PATH for clone preparation. The
  canvas reports missing tools; it does not install them.

Windows App 1.1.20 and its Node 24.20.0 extension runtime were used for native
validation. Other App platforms require their own native acceptance. Tenant
policies, MFA, and Conditional Access remain authoritative.

## Connection Profile

The feature reads the current OS user's
`~/.speckit-canvas/repository-profile.json`. This is a per-user configuration
location, not a repository file. Only these fields are accepted:

| Field | Value |
| --- | --- |
| `schemaVersion` | Number `1` |
| `enabled` | Boolean `true`; `false` disables repository browsing |
| `tenantId` | The existing app registration's tenant UUID |
| `clientId` | The existing app registration's application UUID |
| `organization` | The same Azure DevOps organization configured in EzPzSpec |
| `project` | The same Azure DevOps project name configured in EzPzSpec |

Use an authorized administrator's configuration values. Do not copy the complete
EzPzSpec environment/settings file, a client secret, token, PAT, or credential
cache. Unknown fields and redirected profile paths are rejected. Missing,
disabled, or invalid configuration leaves the local-only canvas available.

After configuring the profile, reopen the canvas in a fresh session. Select
**Connect Microsoft account**. The system browser may reuse Microsoft SSO or ask
for an account/MFA. The canvas displays the connected Microsoft account. It need
not be the same identity as the GitHub account signed into Copilot.

Connection is explicit. Opening the canvas alone does not sign in. Tokens remain
in memory for that canvas instance and are not shared with another canvas or
persisted to disk. Disconnect clears remote content and cancels in-progress
repository work; it does not sign out the system browser, EzPzSpec, or Copilot.

## Search And Browse

An empty query shows **My team repositories**: readable repositories whose
current root metadata matches the connected user's project-team areas. Empty
personalization does not mean that the account has no repository access.

Type a repository name to search all readable, enabled repositories in the
configured project. Search runs after a one-second pause; separate words must
all occur in the repository name. Clearing the query restores the personalized
collection. Load more continues the current collection, not an unrelated query.

Expand a repository directly inside the search dropdown. Expand `.specify` or
`specs`, then folders and files. Selecting a file opens its preview in the canvas.
Arrow keys navigate the tree, Enter selects, and Escape closes the dropdown.
The rail and popup share selection and results; they are not separate accounts
or queries. The rail can be collapsed and becomes an overlay on narrow screens.

Markdown previews show the repository, branch, and fixed commit. References,
history, and tree pages stay on that commit until an explicit Refresh. Supported
text files are displayed literally. The preview rejects binary/unsupported data
and files larger than 5 MiB. Images do not trigger passive remote requests, raw
HTML does not execute, and remote clarification markers do not become actions.

Back to repository restores the dropdown/tree position. Return to local
workspace restores the existing local SDD view and drafts. Remote selection
never changes the current Copilot session's working directory or silently
dispatches a workflow against another repository.

## Prepare And Open

1. Select **Prepare local clone** for the chosen repository. Review the connected
   account, source branch/commit, new local branch, and destination. No Git
   operation occurs until **Confirm clone**.
2. The canvas uses the connected user's delegated credential to prepare a new
   checkout under `~/SpecKitCanvas/repositories/<operation-id>/checkout`. It does
   not use a fallback GCM account, PAT, or credential embedded in a remote URL.
3. Preparation disables hooks, credential-helper fallback, recursive submodules,
   LFS smudge, and arbitrary protocols. It verifies the exact commit, origin,
   and new local branch. Existing working copies are never reused or reset.
4. Wait for **Prepared for manual opening in Copilot App**, then copy the folder
   path. Use the App's **New project or session > Open folder** and create a new
   session for that directory. Process launch alone is not workspace readiness.
5. Open `sdd-canvas` in that session using the approved payload. If the App creates
   its own worktree, the canvas validates the common Git directory and original
   commit rather than requiring an identical path. The source browsing session
   remains on its original local workspace.
6. Existing SDD prerequisites still apply. A cloned project with only older agent
   command files, missing skills, or no installed canvas provider needs separate
   authorized setup. The repository browser does not run `specify init`, install
   skills, or force-reinitialize the project after cloning.
7. Run a chosen local workflow only after binding/prerequisite checks pass. The
   App retains its normal tool/permission prompts. Clone preparation does not
   commit, push, create PRs, deploy, or grant write access. Such later operations
   require their own authorization and repository permissions.

## Failure And Recovery

- Authentication errors: reconnect explicitly. A denied desktop flow may require
  tenant policy review; the canvas does not bypass it or try another credential.
- Empty team rail: explicit project-name search remains available. Code Search
  indexing and root metadata affect personalization, not the user's access grant.
- Expired page/context: refresh the collection/repository. A cursor from another
  account, query, instance, root, or commit is rejected.
- Permission revoked: further requests recheck access and remove unavailable
  state. Previously downloaded local clones cannot be retroactively erased.
- Clone cancellation/failure: only verified owned staging data is eligible for
  cleanup. Unexpected links/files cause preservation for manual review. No
  automatic whole-clone retry or removal of a completed clone occurs.
- Wrong local workspace/source: workflows remain blocked. Open the correct
  prepared checkout; do not bypass the guard with copied metadata or resets.
- Close/reopen: the remote connection is not persisted. Completed clones remain
  user-owned files, and old preview installations are unaffected.

To disable the feature, set `enabled` to `false` and reopen the canvas. Restoring
an older verified plugin payload is a separate installation action. Do not remove
the app's existing SPA/broker redirects or consent grants during rollback.

## Development Checks

The isolated build package is
[repository-browser/package.json](../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/package.json).
Run `npm ci --ignore-scripts`, `npm run typecheck`, `npm run lint`, `npm test`,
`npm run build`, and `npm run verify:package` from that directory.

Then run the shared reader's typecheck, lint, tests, tool tests, package
verification, and browser tests. CI performs these on Windows and Linux using
synthetic provider data. Runtime assets are bundled with hashes/notices; there is
no dependency install when the canvas loads.

For an interactive synthetic preview, run `npm run dev` from the isolated build
package and open the printed loopback URL. Connect and clone controls use test
doubles in this preview: no real Microsoft login, private repository reads, or
native Git clone occurs. Stop the preview with Ctrl+C to clean its owned fixtures.

The existing [read-only preview manual](sdd-markdown-preview-user-manual.md)
continues to describe its exact historical ZIP and checksum only.