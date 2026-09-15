# Canvas Repository Discovery Implementation Plan

Date: 2026-09-14

Branch: `plan/canvas-repository-discovery`

Status: Implementation authorized on 2026-09-14. The separate desktop redirect,
isolated native proof, and read-only reference checks were explicitly approved.
Implementation and scoped Windows native acceptance are complete: authentication,
personalized rail, repository dropdown, commit-pinned Markdown, confirmed clone,
verified App worktree binding, and one separately approved read-only analyze run.
See [full native acceptance](evidence/native-repository-acceptance-2026-09-14.md)
and the earlier [connection proof](evidence/native-repository-connection-2026-09-14.md).
The change remains unreleased and uncommitted; remote CI and other native App
platforms have not been executed.

## Recommendation

Add an SDD-owned repository browser to the existing canvas. Preserve EzPzSpec's
delegated Azure DevOps discovery rules, but put expandable Spec Kit artifact
trees inside a compact search dropdown and retain a personalized repository rail.
Use Microsoft Entra browser SSO through the existing application registration.
Keep tokens in the extension process, not in the canvas or an agent prompt.

GitHub Copilot sign-in is not an Azure DevOps delegation grant. The inspected
extension API provides a session connection and workspace metadata, not a
documented Entra token bridge. Consequently, this design does not depend on
exporting Copilot credentials. A connected Microsoft account, explicitly shown
in the canvas, is the authority for repository access. It is not inferred from
the Copilot account's name or email.

Remote selection remains read-only. An explicit clone operation prepares a new
local checkout, after which the user opens that folder in a new Copilot App
session. SDD workflows use that session's verified local workspace, never a
remote selection substituted into the existing session's project root.

## Decisions

| ID | Resolved Choice |
| --- | --- |
| DEC-01 | Azure DevOps only, using the same configured organization/project as EzPzSpec. No GitHub provider or project picker in this implementation. |
| DEC-02 | SDD canvas only. Include browsing, explicit cloning, App folder opening, and subsequent local SDD workflows. |
| DEC-03 | The search dropdown contains repository results and expandable file trees. Selecting a file opens the canvas preview. |
| DEC-04 | Reuse Microsoft browser SSO when available; interactive authentication is permitted when required. Show the actual connected Entra account. |
| DEC-05 | Plan a dedicated desktop redirect on the existing registration and use MSAL Node. Do not add a Windows broker dependency. The registration change needs separate implementation-time approval. |
| DEC-06 | Browse only `/.specify/` and `/specs/`, not the entire source tree. Root `es-metadata.yml` is read internally for personalization, not exposed as an arbitrary-file API. |
| DEC-07 | A guided manual App folder selection is acceptable. Automatic App workspace switching and invented launch URIs are excluded. |

The native acceptance target is Windows GitHub Copilot App. Other App platforms
are not claimed supported until tested. Ordinary portable unit/package tests
continue to run on the repository's existing CI platforms.

Only this document is changed during planning. No application implementation,
deployment, app registration mutation, dependency installation, private clone,
plugin installation, App restart, commit, or push is part of this turn.

## Evidence

### Reference Implementation

Reference root: `C:/Users/tussinghal/repos/EzPzSpec`. Paths in this table are
relative to that separate, read-only checkout.

| Source | Deciding Behavior To Reuse |
| --- | --- |
| `frontend/src/screens/RepositoryExplorerScreen/RepositorySearch/RepositorySearch.tsx` | Search input, clear action, status announcements, and keyboard focus behavior. This component is not currently a dropdown. |
| `frontend/src/screens/RepositoryExplorerScreen/RepositoryExplorerScreen.tsx` | 1,000 ms debounce, separate draft/committed queries, selected-repository reauthorization, stale-request protection, and preview/selection state. |
| `frontend/src/screens/RepositoryExplorerScreen/RepositoryRail/RepositoryRail.tsx` | Separate personalized and explicit-search collections; initial personalized page size 4, search page size 100, scanning continuation, and focus/scroll preservation. |
| `frontend/src/screens/RepositoryExplorerScreen/hooks/useRepositoryStatusQueue.ts` | Four concurrent repository-status requests; prioritize selection and reuse already requested status. |
| `frontend/src/screens/RepositoryExplorerScreen/utils/buildRepositoryTree.ts` | Build the artifact tree from repository item metadata. |
| `frontend/src/screens/RepositoryExplorerScreen/utils/orderRepositories.ts` | Status-aware, natural repository ordering. Preserve focus when status changes reorder rows. |
| `frontend/src/store/api/repositoriesApi.ts` | Distinct detail, `.specify` items, `specs` items, selected-file, and provenance operations; deduplicate paginated results. |
| `frontend/src/auth/msal.ts` | Browser MSAL, tenant-bound account selection, session-storage cache, and Azure DevOps `.default` scope. |
| `frontend/src/store/api/baseApi.ts` | Acquire the user's Azure DevOps token and attach it to same-origin backend requests. |
| `backend/src/middleware/requireAccessToken.ts` | Validate token signature, issuer, audience, tenant, user object ID, expiry, and `vso.code`; personalized access also requires `vso.project` and `vso.work`. Unsafe web requests require the configured Origin. |
| `backend/src/services/repositoryBrowserService.ts` | `listRepositoryPage`, `getRepositoryDetail`, `listSpecifyItemPage`, `listSpecItemPage`, and `getSelectedFile`; current access checks and commit-pinned reads. |
| `backend/src/utils/repositorySearch.ts` | NFKC normalization, trimming, whitespace collapse, case folding, maximum 256 normalized JavaScript string code units, and AND-of-substring query tokens. |
| `backend/src/services/userAssociationsService.ts` | `resolveUserAssociations` and `mergeTeamAreas`: requesting-user teams, owned `System.AreaPath` values, and effective child-area ownership. |
| `backend/src/services/relevantRepositoriesService.ts` | `listRelevantRepositoryPage`, bounded candidate search/verification, association fingerprints, and meaningful empty/scanning outcomes. |
| `backend/src/services/repositoryManifestService.ts` | `parseRepositoryManifest` and `areaContains`: strict structured YAML, supported manifest layouts, no aliases/custom tags/merge keys, and segment-boundary area matching. |
| `backend/src/clients/azureDevOpsClient.ts` | Encoded ADO 7.1 URLs, bounded responses, request deadlines, retries, error normalization, and current repository checks. |
| `backend/src/utils/continuationToken.ts` | Signed, typed continuations bound to their source query/context. Adapt the binding for the canvas's connection and instance. |
| `scripts/preflight/auth-environment.ps1` | Read-only settings, registration, delegated permission, and consent checks. Executed successfully during this investigation. |

The existing frontend uses React/RTK Query. Reuse its behavior and contracts, not
its entire application/store or deployment topology. Adapt the reference's pure
logic into SDD-owned modules with synthetic parity tests. Do not copy private
configuration, repository inventories, source documents, or internal evidence
into a distributable plugin. Source reuse/publication rights must be cleared
before copying reference implementation text into a public distribution.

The existing authenticated [EzPzSpec page](https://red-field-024a6870f.7.azurestaticapps.net/)
was inspected without navigation, sign-out, storage access, or changing its
selection. Its visible search labels differ from the current checkout. The
checkout is the implementation reference; this plan does not assert that its
newer personalized rail is already deployed.

### Canvas And Registration Findings

- [The SDD server](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs#L250)
  already enforces loopback Host, Origin, and a per-instance capability.
- [The host binding](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs#L569)
  calls `session.rpc.metadata.snapshot()` and derives `PROJECT_ROOT` from
  `metadata.workingDirectory`. Preserve this authoritative relationship.
- [The local review service](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/artifact-review.mjs#L45)
  is deliberately filesystem/workspace-bound. Do not widen it into an arbitrary
  URL, path, or remote-repository reader.
- [Reader types](../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/types.ts#L15)
  and [mount validation](../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/mount.tsx#L22)
  currently accept only `sourceKind: "working-tree"`, `sha256:` revisions, and
  documents of at most 5,242,880 bytes.
- [The rendered source label](../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/MarkdownReader.tsx#L184)
  currently says "Working-tree revision". Remote documents require an honest,
  separate source label as well as a type change.
- The existing auth preflight passed all checks, including configured delegated
  `vso.code`, `vso.project`, `vso.work`, and consent grants. This is configuration
  evidence, not proof of a newly authenticated canvas user's effective access.
- A separate read-only registration query confirmed single-tenant
  `AzureADMyOrg`, two SPA redirects, no web redirects,
  `isFallbackPublicClient: false`, and one desktop broker redirect. There is no
  desktop HTTP loopback redirect. No registration values were changed.
- Current public SDK documentation exposes `joinSession`, canvas lifecycle,
  session RPC, and opt-in environment-variable requests. It does not document an
  Entra identity bridge or App workspace-open acknowledgement. No installed App
  credential store or token was inspected; no new native host test was run.

## Architecture

Use the following explicit boundaries:

1. The existing SDD HTML shell owns the repository control and rail. A bundled
   controller maintains dropdown, request-generation, and selection state.
2. Its browser requests go only to the canvas's existing capability-protected
   loopback origin. The browser receives bounded repository DTOs, never tokens.
3. A per-canvas repository service owns its Microsoft connection, ADO requests,
   continuations, remote contexts, and authorized clone operations.
4. A separate short-lived loopback listener accepts only the OAuth callback.
   It is not a new exception to the ordinary canvas Origin/capability checks.
5. The Node service calls fixed Entra and Azure DevOps endpoints directly using
   delegated user credentials. Do not proxy the hosted EzPzSpec APIs, spoof their
   Origin, broaden their CORS policy, or introduce a hosted backend dependency.
6. The existing Markdown renderer consumes a separately validated commit-source
   document contract. Its local filesystem review backend remains unchanged.
7. A clone service uses native Git only after explicit confirmation. A new App
   session's host metadata and Git identity establish its local workflow context.

Keep the current SDD imperative shell; do not add Redux or replace the workflow
screen with the EzPzSpec application. New provider/controller source may use
TypeScript, built to dependency-closed assets. The GitHub SDK remains
host-provided; do not bundle a second CLI/SDK or start a standalone AI client.

### Configuration And Lifetime

- Read a trusted per-user profile from
  `~/.speckit-canvas/repository-profile.json`, not from the selected Git repository.
  Fields: `schemaVersion: 1`, `enabled`, `tenantId`, `clientId`, `organization`,
  and `project`. Validate UUIDs and single organization/project segments.
- Populate the initial profile with the existing EzPzSpec configuration through
  a documented, allowlisted setup step. Never copy its entire environment or
  local settings file. Client/tenant IDs are configuration, not client secrets.
- Missing/disabled/invalid configuration leaves the existing local SDD flow
  usable and performs no authentication, network discovery, or installation.
  A valid profile exposes Connect; merely opening the canvas does not sign in.
- Clone destinations are newly allocated under
  `~/SpecKitCanvas/repositories/<operation-id>/`. Names and paths supplied by
  repository content cannot select a destination. Version one does not reuse
  or mutate an existing user checkout.
- Each canvas instance owns an independent connection epoch and in-memory token
  cache. Do not persist OAuth tokens or borrow the browser's MSAL cache, Copilot
  credentials, Azure CLI cache, GCM accounts, or another canvas's connection.
- Closing the canvas or replacing its session aborts requests, closes the OAuth
  listener, releases timers, and discards credentials and remote content caches.
  Verified completed clones are user files and must not be deleted on disconnect.

## Authentication

### Registration Change

After the registration owner approves the implementation-time change, append
`http://localhost/speckit-canvas/oauth/callback` as a **Mobile and desktop
applications / public-client** redirect on the existing app registration.
Keep both SPA redirects, the broker redirect, existing grants, single-tenant
audience, and `isFallbackPublicClient: false` unchanged. Add no application
secret, application permission, or service-principal repository access.

The runtime uses
`http://localhost:<ephemeral-port>/speckit-canvas/oauth/callback`, with the listener
bound only to `127.0.0.1`. Entra ignores localhost ports when matching redirects,
but distinguishes their paths. A distinct path avoids ambiguity with the SPA's
localhost-root redirect. Verify this exact native redirect classification and
port-independent match before proceeding to native feature acceptance.

### Token Flow

1. Connect starts one transaction for the canvas instance and launches the
   system browser through a validated browser opener. Reuse its Microsoft SSO
   session; do not force a login prompt on every acquisition or promise zero
   prompts when MFA, account selection, or Conditional Access requires one.
2. Use MSAL Node `PublicClientApplication`, tenant-specific authority, and
   `https://app.vssps.visualstudio.com/.default`. Use `getAuthCodeUrl` and
   `acquireTokenByCode` with MSAL-generated PKCE/S256 values, a random state,
   nonce, and the exact callback URI. Use this documented two-leg flow rather
   than assuming `acquireTokenInteractive` supports a custom callback-path hook.
3. The callback listener accepts only the expected method/path/Host and one
   pending transaction. Validate state before redemption, reject duplicate or
   oversized parameters and replay, and enforce a 120-second transaction limit.
   Allow Microsoft's observed optional `client_info` and `clientdata` fields as
   unused metadata; never treat their values as identity or reflect them.
   Handle provider errors without echoing their raw body. Close the listener
   after completion, cancellation, timeout, or an unrecoverable error.
4. Keep authorization codes in the OAuth callback only. Never put codes or
   tokens in the canvas URL, browser storage, DOM, prompts, artifacts, or logs.
   Serve a minimal no-store/no-referrer completion response and remove the
   callback query from the completion URL. Do not reflect raw callback errors.
5. Bind the result to the configured tenant and the account identity returned by
   MSAL, including tenant/local account ID. A wrong-tenant result is discarded.
   Display the connected account. A matching GitHub email is neither proof nor
   a requirement of this separately approved Microsoft connection.
6. Use `acquireTokenSilent` for that bound account thereafter. Treat the ADO
   access token as a resource credential, not an application session token or
   an identity object to expose to the renderer. ADO is authoritative for its
   effective permissions. No client-credentials, PAT, device-code, broker, or
   alternate-account fallback is automatic.
7. Missing code-read access blocks discovery. Missing personalization scopes
   disables only the personalized collection when ordinary delegated search
   remains permitted. Token/consent/Conditional Access failures produce explicit
   connection states, never a broader-account directory or stale cached view.
8. Account change/disconnect increments the connection epoch before asynchronous
   cleanup. Abort requests and clones in progress, discard remote contexts and
   cached content, and ignore late completions from the old epoch. Canvas
   disconnect must not sign the user out of the system browser, EzPzSpec, or
   Copilot, or claim to cancel AI work already running in another session.

## Repository Behavior

### Search And Personalized Rail

- Empty query loads **My team repositories**, initially four at a time. Resolve
  requesting-user teams using `$mine=true`, page/deduplicate them, and load
  effective `System.AreaPath` ownership. Exact matches qualify; descendants
  qualify only at a path-segment boundary with `includeChildren` enabled.
- Discover candidates through project/root-path-constrained Code Search of
  `/es-metadata.yml`. Revalidate repository access, default branch, operational
  state, manifest bytes, and association before returning a candidate. Team
  association is relevance, never an authorization grant.
- Preserve strict YAML parsing and both supported reference manifest layouts.
  Use the established 64 KiB manifest limit; reject aliases, custom tags, merge
  keys, ambiguous multi-document input, and invalid organization/project paths.
- Nonempty search covers all currently readable, enabled repositories in the
  configured project, including repositories without Spec Kit. Preserve the
  reference normalization and AND-of-substring tokens, 256-code-unit limit,
  1,000 ms debounce, and page size 100. Do not invent an upstream ADO repository
  name-filter parameter: the reference lists readable repositories, then filters.
- A new committed search clears previous-query rows before fetching. Clearing
  search restores the separate personalized collection. Never use a failed or
  empty personalized result to trigger an unfiltered project load.
- Keep the selected repository separately from current result membership, but
  reauthorize it before expansion, preview, or clone. A failed access check
  removes its retained row, tree, preview, and related client cache entries.
- Preserve status-aware natural ordering and focus/scroll during row movement.
  Queue status checks for visible rows and selected repositories, not every
  repository in the project; cap status requests at four concurrent operations.
- Distinguish no team areas, no linked repositories, no name matches, scanning,
  unavailable personalization, and authentication failure. Code Search's
  eventual consistency and fork omissions are limitations of personalization;
  explicit repository-name search remains available.

### Bounds, Continuations, And Authorization

- Use ADO REST 7.1 with fixed configured organization/project routing. Allow
  only `dev.azure.com` and the required organization-scoped
  `almsearch.dev.azure.com` search endpoint for repository data. Entra authority
  and authentication endpoints are separately allowlisted. Reject redirects to
  unexpected hosts rather than forwarding credentials.
- Preserve the reference limits: 10-second individual HTTP timeout, at most two
  transient retries, 35-second overall discovery deadline, 25 MiB JSON ceiling,
  four concurrent association/candidate verifications, 20 search terms per
  expression, 100 associations/candidates per request, and 1,000 effective areas.
  Honor `Retry-After` within the deadline; do not sleep or retry indefinitely.
- Load at most three empty scanning continuation pages automatically per rail
  activation, then require Load more. Never repeat a continuation automatically
  after its failure. This additionally bounds unattended background work.
- Use signed, expiring continuations with a per-instance random signing key and
  10-minute TTL. Bind kind, profile, tenant/account, connection epoch, query,
  page size, ordering, and last key. Personalized cursors also bind the current
  association fingerprint. Tree cursors bind repository ID, root, commit, and
  parent context. Reject altered, expired, wrong-kind, or cross-context cursors.
- Do not copy indefinite RTK Query caches into the authorization design.
  Reauthorize on new list requests, selection, every tree/file/reference request,
  and clone confirmation. UI status caches are hints, not access grants. Clear
  them on access failure, reconnect, explicit refresh, and canvas close.
- ADO can revoke permission after a response. Promise permission enforcement on
  requests, not retroactive erasure of files the user legitimately downloaded.
  Already created clones are governed by local access and existing App policy.

## Dropdown And Rail

- Add a compact repository search control to the existing SDD header, with the
  current local-workspace identity and Microsoft connection visible. Preserve
  the existing design language; do not add a landing screen or redesign SDD.
- The search field is an accessible combobox with a tree popup, not a listbox
  containing interactive controls. Repository nodes expand into `.specify` and
  `specs`, then folder/file nodes. Clone/refresh commands belong in the selected
  repository toolbar, outside tree items.
- Keep the same selected repository and request state in the popup and rail.
  The rail retains the personalized list when search is empty and matching
  results while a committed search is active. Do not mount a second, independent
  query collection for the popup.
- Fetch metadata only after expansion/selection. Preserve 50-item tree pages,
  commit identity, ID-based deduplication, and per-repository/root expansion
  state. Render only loaded nodes; use bounded visible rows/windowing when a
  loaded tree grows beyond 200 nodes. Never preload file contents for rows.
- Repositories without `.specify` remain discoverable and cloneable when they
  have a readable commit; show their not-configured state. A missing `specs`
  root is an empty artifact collection. Disabled repositories are excluded;
  maintenance or branchless/empty repositories cannot be prepared as a pinned
  workflow checkout in this first implementation.
- Up/Down move active items; Right expands; Left collapses/returns to the parent;
  Enter selects; Escape closes. Maintain `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, tree levels, selected state, and loading announcements.
  Scope shortcuts to the canvas, never the App's composer.
- File selection closes the popup and opens the preview. Preserve its query,
  active item, expansions, rail scroll, and preview history. Return restores the
  repository control/item, not an unrelated local workflow element.
- Use stable dimensions: desktop rail 260 px with collapse support, popup width
  at most 560 px and viewport-constrained height at most 60 vh. Below 768 px,
  use a single content column and an overlay rail; at narrow widths keep the
  popup within 8 px viewport margins. Long names wrap/truncate without moving
  controls; accessible labels retain the complete name.
- Keep explicit loading, pagination, empty, unsupported, denied/unavailable,
  rate-limited, reconnect, retry, cancellation, and failure states. A stale
  request may not overwrite a newer query, account, repository, or document.

## Remote Documents

1. Expand `MarkdownDocument` into a discriminated local/commit-source contract.
   Keep existing working-tree fields unchanged. A `git-commit` document adds
   validated provider/repository identity, branch, full 40-hex source commit,
   blob object ID, and path. Do not invent a working-tree modification time.
2. Retain the renderer's `sha256:<64 hex>` content revision and 5 MiB byte limit.
   A Git commit/blob ID is not a substitute for the content revision. Use the
   existing safe rendering, links, tables, code blocks, TOC, and history behavior.
3. Add an explicit source label showing repository, branch, and short commit.
   Keep the full commit available through accessible metadata. Add a backwards-
   compatible return-label option so remote views say Back to repository.
4. Create a separate remote review controller/service. Its opaque context/item
   IDs bind account epoch, repository, allowed roots, and commit. Preserve the
   current local `/api/review/*` workspace/path allowlists without broadening them.
5. Resolve the selected repository's default branch once into a browsing context.
   All tree pages, file content, and relative Markdown links use that commit.
   Explicit Refresh creates a new context and invalidates old cursors/history
   positions as appropriate; never silently mix branch-head versions.
6. Bound and validate paths with structured URL/path handling. Reject traversal,
   absolute/drive/UNC paths, control characters, ambiguous encoding, unexpected
   roots, repository mismatches, and caller-selected arbitrary URLs. Relative
   links cannot escape the two permitted artifact roots or cross repositories.
7. Markdown uses the renderer. Supported non-Markdown text under those roots
   uses a bounded literal-text view, not HTML interpretation or code execution.
   Preserve the reference decoder's supported-encoding checks. Binary, oversized,
   unsupported encoding, and unavailable-source states remain explicit.
8. Remote content is untrusted data. Do not fetch external images automatically,
   execute embedded HTML/scripts, follow submodules/LFS pointers, load remote
   skills/instructions, or send browsed files to an agent merely for preview.
9. Omit remote clarification/answer actions and enforce that restriction in the
   renderer contract and server. Editing, setup, clarification, and SDD commands
   require the separately verified local workflow context.

The renderer is shared with Wizard. Its backwards-compatible source-contract
extension and generated asset refresh are the only permitted Wizard-side
impact; no repository UI, authentication, or clone feature is added to Wizard.
Run its regression checks and version any actually changed shipped component
independently rather than forcing all plugin versions to match.

## Clone And Workflow Handoff

### Prepare A New Checkout

1. Clone is a separate user command, never a side effect of search or expansion.
   Show the repository, branch, pinned commit, connected account, new destination,
   and intended local-work branch. Require confirmation of that exact selection.
2. Issue a short-lived, single-use confirmation handle bound to the connection,
   canvas, repository, commit, destination, and operation ID. Reauthorize and
   validate the source before starting. Duplicate submissions return the same
   operation, not a second clone. Allow one clone operation per canvas.
3. Require an existing trusted Git executable. Report missing/incompatible tools;
   do not install them or use the agent as an implicit shell. Construct the HTTPS
   remote from the verified configured ADO identity; reject SSH, file/ext protocols,
   credential-bearing URLs, unexpected redirects, or user-supplied remotes.
4. Spawn Git with argument arrays and a sanitized, child-only environment. Use
   the same bound Entra credential for ADO Git access, through scoped transient
   Git HTTP configuration in the child's environment, not command-line arguments,
   prompts, persisted Git configuration, a PAT, or a fallback GCM account. Disable
   credential-helper fallback, tracing, and inherited Git override variables.
5. Clone with no initial checkout into a new, ownership-checked staging directory.
   Disable system/global config for this operation, hooks, recursive submodules,
   external protocols, and LFS smudge. Never run repository scripts or filters.
   Apply the same Git policy to fetch, verification, and checkout subcommands.
6. Verify the requested commit is available and matches the confirmed source.
   If fetching that exact commit is required and fails, report source unavailable;
   do not silently use a newer default branch. Check it out onto a new local
   `speckit/canvas-<operation-id>` branch and verify HEAD and origin identity.
7. Use a ten-minute overall clone deadline, cancellable process ownership, bounded
   sanitized progress, and no automatic whole-clone retry. A refreshed token may
   be acquired only for the same account, never by opening a surprise login during
   Git execution. Authentication failure requires reconnect and reconfirmation.
8. Record token-free operation metadata outside the Git checkout under the user's
   owned canvas state directory. On failure, remove only a verified owned staging
   directory; preserve anything with unexpected contents/links for explicit
   recovery. Never reset, stash, clean, overwrite, pull into, or delete an existing
   user checkout. Completed clones are retained.

### Open And Bind The App Session

1. Report `prepared_for_manual_open` with the exact folder. Provide copy-path and
   documented manual App folder-selection guidance. Do not invent a `copilot://`
   route, use UI automation as production integration, silently launch VS Code/CLI,
   or call a process-start result "workspace ready".
2. The user creates a new App session for that folder and opens `sdd-canvas`.
   The new extension obtains its working directory from `metadata.snapshot()`.
   Canonicalize it and verify Git common directory, origin identity, HEAD, and
   working branch against the prepared operation.
3. Support the App creating its own worktree: an exact clone-root path is not
   required when the actual host worktree has the same verified Git common
   directory and confirmed source. Initial HEAD must match the prepared commit.
   After acknowledgement, ordinary explicit workflow edits/commits may advance
   that local branch; do not keep resetting it to the initial snapshot.
4. Operation metadata is a handoff hint, not an authorization grant. The actual
   host session, Git identity, and user's folder selection establish the context.
   A similarly named folder or a copied marker is insufficient.
5. Issue a local context ID bound to session/workspace identity. All new workflow
   requests carry that ID. Guard both HTTP routes and canvas actions for setup,
   run-stage, and clarification. A remote-active or mismatched context returns a
   clear conflict before `session.send` can run. Preserve legacy local behavior
   when repository browsing is disabled; do not retarget `PROJECT_ROOT` on search.
6. Existing SDD prerequisite ordering, overwrite confirmations, skills reload,
   and command allowlists remain authoritative. Initialization needs its own
   explicit approval and stays Copilot skills mode. Do not automatically force
   initialization into an existing Spec Kit setup or run workflows on clone.
   Native acceptance exposed checkout timestamps that falsely marked unchanged
   artifacts stale. In verified prepared workspaces only, the implemented
   `artifact-clock.ts` uses committed modification times for blob-matching
   spec/plan/task files. Locally changed files retain filesystem freshness; no
   file contents or timestamps are rewritten.
7. No commit, push, remote branch creation, PR, or deployment is automated by this
   feature. Subsequent workflow actions retain normal Copilot permissions and
   user approvals. Returning to the old App session must leave its original
   working directory and workflow state unchanged.

## API Contract

All routes below are relative to the existing SDD loopback origin and pass its
Host, Origin, instance-capability, and method checks. Require JSON for mutations,
strict request schemas, an at-most-32-KiB body, and no duplicate query parameters.
The separate OAuth callback is not an ordinary canvas route.

| Route | Contract |
| --- | --- |
| `GET /api/repositories/connection` | Connection state, opaque connection ID, generation, safe account label, configured project label, and supported capabilities; no credentials. |
| `POST /api/repositories/connect` | Start one user-requested transaction; return 202 and an opaque transaction ID. Connection completion is delivered through a scoped SSE event. |
| `POST /api/repositories/disconnect` | Invalidate the epoch first, cancel work, clear remote state, and return disconnected. |
| `GET /api/repositories/relevant` | Page size 4 by default; signed cursor; items, `hasMore`, next cursor, and explicit personalized/scanning outcome. |
| `GET /api/repositories/search` | Required normalized nonempty `q`, page size 100, query-bound cursor; readable repository summaries only. Empty input is not an all-repositories request. |
| `POST /api/repositories/context` | Reauthorize a repository ID, resolve the default branch, and issue a commit-pinned context with status and permitted artifact roots. |
| `GET /api/repositories/items` | Context, allowed root, page size 50, and optional cursor; metadata only, including opaque item IDs. |
| `GET /api/repositories/content` | Context and item ID; reauthorize, validate commit/path/blob, and return a bounded remote document or literal-text payload. |
| `POST /api/repositories/reference` | Resolve a Markdown reference within the same commit, repository, and permitted roots; never fetch a caller-supplied host. |
| `POST /api/repositories/refresh` | Reauthorize and create a new source context; previous commit identifiers are not silently overwritten. |
| `POST /api/repositories/clone/confirm` | Reauthorize and return the precise token-free confirmation summary and expiring confirmation handle. |
| `POST /api/repositories/clone` | Consume the confirmed handle idempotently; return an operation ID and initial state. |
| `GET /api/repositories/clone` | Instance-bound operation state/progress; completed folder only after verified preparation. |
| `POST /api/repositories/clone/cancel` | Cancel only the owned operation; preserve completed clones and unrelated files. |

Success responses use `{ ok: true, data }`. Failures use
`{ ok: false, error: { code, message, retryable, retryAfterSeconds? } }`.
Use fixed safe messages, not upstream exception text. Repository summaries contain
only ID, name, validated branch/operational status, and necessary display metadata.

Required error codes: `invalid_request`, `connection_required`,
`interaction_required`, `wrong_tenant`, `insufficient_scope`, `policy_blocked`,
`resource_unavailable`, `invalid_context`, `expired_cursor`, `source_unavailable`,
`unsupported_file`, `file_too_large`, `rate_limited`, `upstream_unavailable`,
`clone_conflict`, `clone_cancelled`, `remote_read_only`, and
`local_context_mismatch`. Conceal unauthorized repository existence; distinguish
authentication recovery from transient service retry. Every asynchronous response
is bound to the current connection and selection generation.

## Implementation Sequence

### Phase 0: Authorization And Proof Harness

1. Obtain implementation approval, including the separate scoped registration
   update. Save a redacted registration baseline and add only the dedicated native
   callback. Rerun the existing EzPzSpec auth preflight to prove its SPA configuration
   and grants are unchanged. Do not deploy or edit the hosted application.
2. Create an isolated synthetic workspace and new SDD-only test payload using
   the repository's existing owned-fixture utilities. Record the actual App/CLI
   and extension runtime versions. Leave normal installations/sessions alone.
3. Prove the MSAL flow in that real extension runtime with the dedicated callback,
   account/tenant validation, cancellation, and sanitized status-only reporting.
   Prove availability of host workspace metadata. Stop native delivery if either
   proof fails; mock-based feature development does not waive these gates.

### Phase 1: Provider And Identity Foundation

4. Add the SDD-owned build package, trusted profile loader, auth/callback service,
   error contract, DTOs, connection epochs, and disposal. Add tests before wiring
   real provider calls. Depends on the Phase 0 contract; synthetic tests need no
   live authentication or registration mutation.
5. Implement the bounded ADO client, discovery/personalization parity, signed
   continuations, and commit-pinned artifact operations. Use synthetic permission,
   pagination, manifest, and stale-source fixtures. Depends on step 4.

### Phase 2: Dropdown, Rail, And Preview

6. Implement the dropdown/rail controller against mocked DTOs. This can proceed
   in parallel with step 5 once step 4's contract is fixed. Preserve SDD layout,
   keyboard behavior, stale-request guards, and no-load-before-connect behavior.
7. Extend the reader's source contract, validator, source label, and return label;
   add the separate remote controller. This can proceed in parallel with steps
   5-6 against synthetic commit documents. Keep the local review backend intact.
8. Integrate the UI and provider through the guarded SDD routes. Verify the actual
   SDD shell, not merely a component harness. Depends on steps 5-7.

### Phase 3: Clone And Local Workflow Binding

9. Implement confirmation/idempotency, safe Git process handling, exact-commit
   checkout, ownership checks, cancellation, and recovery. Depends on step 5's
   authorization/source context; it can run in parallel with steps 6-7.
10. Implement the manual handoff status and new-session/worktree acknowledgement.
    Add a shared local-context guard at every workflow-dispatch entry point.
    Depends on steps 8-9. Test that the old session cannot be retargeted.

### Phase 4: Independent Package And Native Acceptance

11. Extend build/staging/import-closure checks for explicit new runtime assets and
    notices. Exclude build source, configuration, credentials, auth/clone state,
    source maps, tests, and dependency directories from the SDD payload. Depends
    on steps 8-10. Never relax the verifier into accepting arbitrary imports.
12. Run focused unit/browser checks and the existing shared-reader/Wizard
    regression gates. Then perform the real Windows App acceptance journey with
    an approved test repository and clone root. Record sanitized evidence only.
13. Update the SDD manual, plugin README, security/connection notes, and any
    actually changed plugin/marketplace/version metadata together. The historical
    read-only preview ZIPs and published repository remain untouched. Publishing,
    a new release number/tag, and any upstream submission require separate
    approval after the release gates below; there is no automatic release here.

## File Map

Development root:
`C:/Users/tussinghal/repos/spec-kit-copilot-markdown`.

Existing files to extend are linked below. New paths are proposed files, not
files created during planning.

| Location | Responsibility |
| --- | --- |
| [SDD extension](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs#L250) | Construct/dispose per-instance repository services; strict new routes; SSE connection/operation events; immutable host-root binding; workflow guards. |
| [SDD shell](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/index.html) | Search/popup/rail mount points, connected-account display, local/remote navigation, and context-aware workflow requests. |
| [Existing review controller](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/ui/artifact-review.js#L10) | Keep local behavior stable; share only renderer loading/return conventions where this removes real duplication. Do not redirect its local endpoints. |
| [Reader contract](../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/types.ts#L15) | Backwards-compatible discriminated commit-source document and return-label option. |
| [Reader mount](../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/mount.tsx#L9) | Validate both document kinds, content hashes, bounds, and remote read-only constraints. |
| [Reader view](../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/MarkdownReader.tsx#L184) | Honest local/remote source labels and correct return destination. |
| [Staging and closure verifier](../../scripts/canvas-reader/stage-app-fixture.mjs#L15) | Explicit new assets/imports/helpers/notices; exclude the new build-source directory. Preserve independent payload checks. |
| [Existing exporter](../../scripts/canvas-reader/export-preview.mjs#L14) | For a separately approved future artifact, accurately describe repository/clone capabilities and the feature set; never overwrite old outputs or retain a misleading read-only claim. |
| [Package security tests](../../scripts/canvas-reader/test/package-security.test.mjs) | Configuration/token/state exclusions, import closure, unexpected-file rejection, and tampering tests for the new payload. |
| [SDD browser tests](../../scripts/canvas-reader/test/sdd-shell.spec.mjs) | Actual-shell regressions and local workflow preservation. |
| [Reader browser tests](../../scripts/canvas-reader/test/reader-accessibility.spec.mjs) | Source/return semantics, keyboard behavior, and local/remote reader accessibility. |
| [SDD manual](../../docs/sdd-markdown-preview-user-manual.md) | Connection configuration, permissions, account identity, clone consent, manual folder opening, recovery, and limitations. |

Create an isolated build package at
`plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/`:

- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`,
  and `build.mjs`: build-only tooling and explicit asset manifest generation.
- `src/profile.ts`, `src/auth.ts`, `src/oauth-callback.ts`: trusted configuration,
  connection lifecycle, and narrowly bounded callback transport.
- `src/ado-client.ts`, `src/discovery.ts`, `src/continuations.ts`: bounded ADO
  transport, personalization/search, and context-bound paging.
- `src/remote-review.ts`, `src/clone.ts`, `src/workspace-binding.ts`,
  and `src/repository-service.ts`: remote document contexts, local preparation,
  session acknowledgement, and the owning orchestration API.
- `src/ui/repository-browser.ts`, `src/ui/remote-review.ts`, and
  `src/ui/repository-browser.css`: existing-shell controllers and scoped styling.
- `test/auth.test.ts`, `test/discovery.test.ts`, `test/remote-review.test.ts`,
  `test/clone.test.ts`, and `test/workspace-binding.test.ts`: synthetic provider,
  Git, and host-boundary tests.

Generated runtime assets belong under the SDD extension's
`vendor/repository-browser/` and `ui/`, with an exact manifest and third-party
notices. No runtime install is permitted. Audit package-relative non-code helpers
used by the browser opener and include only required, hashed helper files; do
not assume JavaScript bundling alone closes those dependencies.

Pin direct dependencies verified from package metadata on 2026-09-14:
`@azure/msal-node@6.0.0`, `open@11.0.2`, `yaml@2.9.0`, and `lucide@1.42.0`.
Use `esbuild@0.28.2` for the new bundle and the existing repository's pinned
TypeScript/test/lint tool versions. The registry's YAML latest tag currently
points to a prerelease; do not use it. MSAL/open advertise Node >=20, but the
actual App runtime remains a required compatibility test, not an engines-only
assumption. Do not add `@azure/functions`, MSAL broker extensions, a new React
runtime, or a second SDK to the new feature package.

## Verification

### Focused Automated Acceptance

1. **Authentication:** wrong state/nonce/tenant; duplicate/replayed callback;
   missing/oversized parameters; callback port conflict; timeout/cancel/close;
   silent refresh; consent/MFA/Conditional Access states; account switch during
   each operation; no credential or OAuth callback material in DTOs/logs/assets.
2. **Authorization:** synthetic users with disjoint readable sets; cross-account,
   cross-instance, cross-query and cross-commit cursor/context reuse; revocation
   after listing but before expansion/read/clone; no fallback account or all-repo
   load; API/UI caches cleared before late results can appear.
3. **Discovery:** query normalization/token parity including Unicode/whitespace
   and length bounds; paging/dedup/order/focus; disabled/maintenance/branchless
   cases; missing Spec Kit; exact/child area matching; manifest abuse; empty and
   partially scanned personalization; four-worker limits and deadline/retry caps.
4. **Documents:** same-commit tree/file/link reads; changed/deleted commit;
   path/URL/encoding attacks; 5 MiB boundary; binary/unsupported text; malicious
   HTML, Markdown, images, and instructions; independent content SHA-256;
   correct source/return labels and no remote clarification/workflow dispatch.
5. **Clone:** zero writes before confirmation; idempotency; verified HTTPS identity;
   no secrets in args/config/logs; no helper-account fallback; hooks/filters/LFS/
   submodules disabled; exact commit/branch; cancellation and bounded cleanup;
   existing checkout and configuration preservation; no automatic init or push.
6. **Host binding:** correct clone, legitimate App worktree, wrong common directory,
   misleading remote/name, copied marker, wrong initial HEAD, and old-session
   context. Verify both HTTP and canvas-action workflow guards before dispatch.
7. **UI:** real SDD shell at 360x780, 768x1024, 1280x900, and 1920x1080; keyboard
   tree/combobox interaction; long names; zoom; popup clipping; no layout overlap;
   loading/empty/error/retry states; focus/scroll/history return; response races.
   Capture synthetic screenshots, never a private repository inventory.
8. **Packaging:** independently extracted SDD payload; no undeclared imports or
   missing opener helpers/notices; no profile, auth cache, clone metadata, source
   maps, test data, build-source folders, or dependency installation at startup.
   Default/no-profile operation must preserve the existing no-external-network
   reader behavior. Connected-mode egress must match its explicit allowlist.

### Commands And Required Gates

Define `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and
`npm run verify:package` in the new isolated build package. Its test command must
run the focused files listed above with no live credentials. Add actual-shell
coverage in `scripts/canvas-reader/test/repositories.spec.mjs` using the existing
owned fixture/server infrastructure.

Run the focused new package test first after each implementation change. Then run
the touched reader tests and `node --test` over the existing SDD
`tests/*.test.mjs`. Because the reader contract and payload are shared, the final
required gates from the existing reader build package are `npm run typecheck`,
`npm run lint`, `npm test`, `npm run test:tools`, `npm run build`,
`npm run verify:package`, and `npm run test:browser`. Run the Wizard's existing
`npm test` when its shipped shared reader assets are regenerated.

### Native Acceptance Journey

Use an explicitly approved test repository, owned fresh clone root, isolated
plugin payload, and actual Windows App. Record host/runtime versions and
sanitized outcomes, not tokens, account identifiers, callback URLs, or private
source contents. The previously tested App baseline was 1.1.20; it was not
relaunched or revalidated for this feature during planning.

Connect through browser SSO; verify the displayed Microsoft account and readable
results; expand both artifact roots from the dropdown; open/navigate a pinned
document; handle a denied source; confirm and prepare a clone; manually open it
in a new App session; verify host/Git context; run one explicitly approved SDD
action there; return to the original session and prove its workspace/files are
unchanged. Also verify disconnect/cancel and the no-profile local-only path.

## Release Gates

These are explicit future pass/fail conditions, not unresolved design choices
or claims that live validation has already passed.

| Gate | Owner | Pass Condition / Failure Behavior |
| --- | --- | --- |
| RG-01 Registration | Registration owner | Dedicated public-client callback works at an ephemeral port; existing SPA/broker settings and grants remain intact. Otherwise Connect remains unavailable. |
| RG-02 Runtime auth | Feature implementer and native tester | MSAL, browser opening, cancellation, account binding, and ADO delegated access work inside the actual packaged extension runtime. No token/cache extraction workaround. |
| RG-03 Permission isolation | Feature implementer | Automated disjoint-user/revocation/cursor tests pass; approved native permission checks match the connected user. Any cross-context data appearance blocks delivery. |
| RG-04 Workspace handoff | Native tester | Prepared clone or legitimate host-created worktree is acknowledged through actual metadata and Git identity before dispatch; old session remains unchanged. Otherwise report prepared-for-manual-open, not ready. |
| RG-05 Safety and UX | Feature implementer | Clone safeguards, all error states, responsive/keyboard checks, and shared-reader/Wizard regressions pass. No suppression of failing security tests. |
| RG-06 Independent payload | Maintainer | Fresh extraction runs without installs, hidden dependencies, private configuration, or stale capability descriptions; manifests, notices, and hashes verify. |
| RG-07 Publication | Source/release owner | Reuse rights, scope-accurate documentation, component versions, and publication destination are approved. No release or push without that separate approval. |

Rollback disables the trusted profile's repository feature and restores the
previous verified plugin payload through the established installer recovery
path. Preserve user clones and existing projects. Removing only the new Entra
redirect is a separate owner-approved action; never remove existing SPA/broker
redirects or revoke the app's existing grants as a feature rollback shortcut.

## Completion

Planning produced this document on the separate branch. The reference code,
current canvas control paths, live UI metadata, registration configuration,
official SDK contracts, and dependency metadata were inspected. The reference
authentication preflight passed. The seven user decisions above close the
product/authentication/handoff choices.

The planning phase performed no implementation or live changes. After separate
approval, implementation and the native end-to-end acceptance described above
were completed. One isolated private clone and one read-only analyze action were
explicitly authorized and verified; 171 tracked configuration/spec files and all
tracked clone files remained unchanged. The original EzPzSpec checkout remained
clean. Test connections were disconnected and the completed clone was retained.

The final Code Search request matches the reference's `7.1-preview.1` contract
and root-path search expression. The corrected native personalized rail returned
four verified rows; no additional API permissions were required. The desktop
callback addition was the only registration change.

RG-01 through RG-06 have scoped local/synthetic and Windows native evidence, not
universal platform or tenant-policy approval. RG-07 remains release-only: no
component version bump, tag, commit, push, marketplace update, or deployment was
made. CI is wired for Windows/Linux, but hosted runners and non-Windows App
acceptance remain unexecuted. Temporary profile adapters and skill wrappers used
in native test worktrees are recorded separately and are not shipped.

Primary public API references:

- [Copilot extension lifecycle and environment access](https://github.com/github/copilot-sdk/blob/main/nodejs/docs/extensions.md)
- [Copilot joinSession implementation](https://github.com/github/copilot-sdk/blob/main/nodejs/src/extension.ts)
- [MSAL Node authorization code requests](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/request.md)
- [MSAL Node interactive request type](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/src/request/InteractiveRequest.ts)
- [Entra localhost redirect matching and platform restrictions](https://learn.microsoft.com/entra/identity-platform/reply-url#supported-schemes)
- [Entra SPA versus native authorization-code flow](https://learn.microsoft.com/entra/identity-platform/v2-oauth2-auth-code-flow#redirect-uris-for-single-page-apps-spas)