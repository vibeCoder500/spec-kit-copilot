# Contract: Repository Entry Layer

This defines planned user and loopback interfaces for [the feature](../spec.md).
It does not add a public internet API. All proposed implementation names must be
kept distinct from the required, not-yet-available host contract in
[host-handoff.md](host-handoff.md).

## Launch And Ownership

- `sdd-canvas`: normal launch; chooser first when `repositoryEntryEnabled` is
  true, otherwise the existing workflow renderer.
- `sdd-canvas-direct`: separate discoverable launch; original renderer in the
  actual current session regardless of remote settings or entry-layer failure.
- Both workflow paths reuse one set of original handlers, prerequisites, setup,
  artifact review, and command generation. Registration IDs do not create two
  independent workflow engines.
- The entry service owns its own HTML, CSS, controller, state, and disposal.
  Downstream `index.html` has no repository mount, rail, reparenting, or entry
  overlay. No entry CSS or remote auth request is required to use direct entry.
- Router and host-binding code are the only integration surface in the canvas
  registration. Existing scanner/reader/navigation behavior is preserved.

## Visible Behavior

| Situation | Required UI / Action |
| --- | --- |
| Valid current repository | Repository label and **Use current workspace**, available without sign-in. |
| No current repository | Shortcut unavailable with a concise reason; remote search can still be used. |
| Fresh configured entry, disconnected account, generation zero | One automatic connection attempt after the initial state read; no Connect click required. |
| Already connected/connecting, failed, or explicitly disconnected account | No automatic restart; explicit retry remains available when disconnected or failed. |
| Unconfigured, disabled, invalid, or unavailable remote state | No automatic sign-in; local/direct entry remains independent. |
| Empty connected query | Team-linked suggestions inside the dropdown only. |
| Nonblank query | Readable configured-project repository matches after 1-second debounce. |
| Clear query | Restore independent team-suggestion state. |
| Suggestion failure/empty | Separate retry/empty state; search and local continuation still available. |
| Select remote result | Repository/account/ref/full commit/default destination summary; no artifact preview or clone. |
| Current repository selected | Offer current-workspace continuation rather than duplicate preparation. |
| Missing clone-admission support or busy/unknown state | **Confirm and clone** unavailable with a bounded reason; no queued intent. |
| Checked cloning supported, automatic handoff unsupported | Explicit clone is available; confirmation states that the App workspace stays unchanged. |
| Confirm and clone | Exactly one admitted preparation, progress, and explicit cancel. |
| Successful standalone clone | **Clone complete**, retained checkout path and copy control; no handoff request or unsupported retry. |
| Successful automatic handoff | Original target-workspace canvas; entry controls leave the view. |
| Failed handoff | Retained clone, explicit **Retry handoff**, or return to original workspace. |
| Busy after clone | Retained clone; retry enabled only after idle, never auto-invoked. |
| Unknown previous handoff | Explicit reconciliation before another attempt; no blind duplicate transition. |

The dropdown contains repositories only, not artifact roots/files. Use the
existing accessible combobox/list semantics, keyboard selection, Escape, focus
restoration, icon buttons with tooltips, and bounded responsive layout. No
separate repository rail. Do not display provider/raw exception output.

Automatic connection is scoped to the initial server-owned connection generation,
not each renderer mount. Refresh, polling, SSE, and page reload cannot reconnect
after an attempt or explicit Disconnect. The existing bounded PKCE/browser flow,
tenant/account validation, in-memory-only cache, and close/disconnect invalidation
remain unchanged. Browser SSO may avoid prompts; Microsoft consent, account
selection, MFA, and tenant policy remain authoritative. Connection is never clone
consent or authorization to open a different workspace.

## Loopback Security Boundary

Retain the existing exact Host/Origin checks and per-instance capability guard.
All responses are no-store and no-referrer. Mutations require same-origin JSON,
bounded bodies (32 KiB maximum), duplicate-field/query rejection, and exact
allowlisted schemas. Credentials, consent nonces, capabilities, and cursors are
not logged or inserted in durable evidence.

The browser may submit opaque context/selection/operation IDs but not a workspace
path, arbitrary remote URL, provider name, Git arguments, host session binding,
target kind/branch mapping, capability assertion, or acknowledgment. Lookup and
validate all of those on the server. Service ports remain loopback-only; no
external CORS or bearer API.

## Planned Route Surface

Reuse the connection/discovery handlers where applicable. Entry operations use a
separate namespace so the retired embedded clone/read APIs cannot bypass its
consent or host gates. Methods below are the new local adapter surface, not SDK
RPC method names.

| Method / Route | Input | Result / Guards |
| --- | --- | --- |
| `GET /api/entry/state` | Instance capability only | Entry settings, safe connection/workspace state, independent `canPrepareRemote` and `canHandoff` flags, retry eligibility and operation status. |
| `GET /api/repositories/connection` | Existing capability | Safe remote-connection snapshot; no token. |
| `POST /api/repositories/connect` | Empty JSON | Explicit existing MSAL transaction; no clone or workflow. |
| `POST /api/repositories/disconnect` | Empty JSON | Clear auth/transient selection, cancel incomplete owned prep, retain completed checkout/record. |
| `GET /api/repositories/relevant` | Optional signed cursor | Readable team suggestions using existing paging/authorization limits. |
| `GET /api/repositories/search` | Nonblank query, optional signed cursor | Readable configured-project matches; existing normalization and page bounds. |
| `GET /api/repositories/detail` | Repository ID | Revalidated status/default ref; metadata only. |
| `POST /api/entry/local` | Expected opaque local context ID, request ID | Re-read current host/Git identity and open original canvas in the same session; no remote auth dependency. |
| `POST /api/entry/selection` | Repository ID, expected local context ID | Readable selection and destination preview; short-lived confirmation only when prerequisites allow it. No directory creation. |
| `POST /api/entry/clone` | Selection ID, opaque confirmation, request ID | Revalidate full consent/current ref and checked clone admission (or verified atomic admission); 202 for one accepted operation. Duplicate accepted request returns its state. |
| `GET /api/entry/operations/{id}` | Owned operation ID | Safe progress/recovery status; no raw Git output, credentials, or automatic mutation. |
| `POST /api/entry/operations/{id}/cancel` | Request ID | Cancel only the incomplete owned preparation; completed clones remain. |
| `GET /api/entry/preparations` | Current profile/account authorization when connected | Bounded validated retained-completion summaries; no unauthorized inventory. |
| `POST /api/entry/operations/{id}/handoff` | Expected local context ID, request ID | Explicit recovery: reconcile last attempt, recheck access/clone/host; if already activated, finish guarded canvas binding in that target without another switch; never call clone start. |

Server-side initial successful clone completion may request handoff only when
the full host capability was present at confirmation and remains verified under
the same uninterrupted explicit confirmation. Clone-only hosts stop successfully
at `prepared`, retain the path, and never create a handoff attempt. It does not call a browser click
handler. Busy/failure/unknown/context changes consume that automatic eligibility;
subsequent transition requires the explicit handoff route and fresh validation.

`workspace_activated` permits opening the original target canvas in a guarded
state. Its binder applies [the original/linked-target identity rules](../data-model.md#workspace-identity-validation),
including the host-attested target branch, then records `canvas_ready`;
only this final phase completes entry and enables workflows. Missing provider or
failed validation after activation retains the clone and the activation record.
Recovery must not repeat workspace activation, and a direct-provider call tied by
the host to the pending attempt cannot bypass target validation. Ordinary direct
entry in an existing workspace remains independent of remote entry services.

Retire the old embedded `/api/repositories/clone*` and remote-artifact
context/items/content/reference/refresh routes in the same validated changeset
that switches normal launch from the old mounted UI to the chooser. Foundational
work leaves the current UI/router paired; test the isolated new coordinator
without exposing it at normal launch. The migration must include replacement
controller/browser expectations, legacy-route rejection, regenerated assets, and
original direct-canvas checks before exposure or release (T015, T019-T022).
After that boundary, legacy routes must not remain alternate mutation or pre-clone
browsing paths. Later removal of dead assets cannot defer route rejection. Keep
the original local artifact-review routes and their existing guards unchanged.

## Response And Error Semantics

Reuse `{ ok: true, data }` / `{ ok: false, error: { code, message, retryable } }`.
Return only safe allowlisted messages. Suggested categories to add to the current
repository error vocabulary:

| Status | Codes | User Recovery |
| --- | --- | --- |
| 400 | `invalid_request` | Correct input; never pass through raw parser errors. |
| 401/403 | Existing connection/scope/policy categories | Explicit sign-in or access correction; local continuation remains usable. |
| 404 | `resource_unavailable` | Repository/operation is unavailable; do not reveal unauthorized existence. |
| 409 | `source_changed`, `context_changed`, `confirmation_expired`, `session_busy`, `clone_identity_changed` | Refresh/reconfirm or wait and explicitly retry; no automatic mutation. |
| 409 | `handoff_in_progress`, `handoff_unknown` | Reconcile the same attempt; do not start another clone or transition. |
| 412 | `activity_unknown` | Reject clone admission before start; direct/current-workspace path stays available where valid. |
| 412 | `host_handoff_unsupported`, `canvas_unavailable` | Block the unavailable handoff/canvas operation; retain completed clones. Unsupported handoff does not disable checked cloning. |
| 429/503 | Existing rate-limit/upstream categories | Bounded read retry only; explicit user retry for mutations. |

SSE may refresh safe state and invalidate stale controls. It may not start a clone,
resume a handoff, confirm consent, or open workflows on an idle/account event.
Do not expose full host snapshots or remote credentials through event payloads.

## Idempotency And Lifecycle

- Only one active preparation per coordinator. Request IDs are scoped to the
  instance/account/source context; duplicate accepted starts return that operation.
- Invalidate stale confirmation on account, source ref, selection, host context,
  or capability change. Busy rejection requires new explicit action, not queueing.
- Persist completed preparation and attempt ID before handoff. A renderer closing
  during accepted host transition cannot erase recovery information.
- Persist `workspace_activated` separately from `canvas_ready`; an activation-only
  record is not successful entry. After a lost response, query the same attempt
  before deciding whether to complete canvas binding or request a new transition.
- Entry close/disconnect cancels only its own incomplete Git process and staging.
  Completed records remain; reopening/reconnecting shows recovery but never runs it.
- Direct workflow actions always bind to their own session/context. A source
  instance cannot dispatch against a cloned target merely by changing a variable.
- Normal-entry workflow actions reject with `entry_required` until that instance
  has completed verified local entry or target binding at `canvas_ready`. A target
  direct-canvas instance opened during handoff also remains guarded until that
  phase. Ordinary direct-canvas actions retain their existing prerequisites and
  workspace checks. The entry service itself never calls `session.send` to emulate
  a host transition or run a workflow.

## Requirement Coverage

| Requirements | Contract / Planned Proof |
| --- | --- |
| FR-001, FR-014, FR-015, FR-016 | Separate launch/renderer ownership; direct-entry equivalence; no rail or DOM reparenting. |
| FR-002, FR-003, FR-019 | Actual local identity; offline local action; current-repository selection avoids cloning. |
| FR-004, FR-005 | Authorized independent dropdown collections; selection-only metadata and no mutation. |
| FR-006, FR-007, FR-008, FR-009 | Visible consent/default destination, current-source binding, one admitted clone, cancel/progress. |
| FR-010, FR-011, FR-012 | Independent checked cloning and capability-negotiated automatic handoff; unsupported handoff leaves the workspace unchanged. |
| FR-013 | Retain completed clone, revalidate recovery, reconcile late result, never reclone on retry. |
| FR-017, FR-018, FR-021 | No implicit workflow/setup; checked clone admission, atomic handoff guards, original-workspace preservation. |
| FR-020 | In-memory tokens, exact loopback boundary, sanitized errors and private evidence. |
| FR-022, FR-023 | Automated + actual App matrix; truthful blocked/not-run reporting. |

Validation scenarios and runnable commands are in [quickstart.md](../quickstart.md).
