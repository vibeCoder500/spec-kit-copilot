# Data Model: Repository Entry Layer

This is a logical model for [the plan](plan.md), not a database schema. Reuse
existing auth/discovery/clone types where their semantics match. Host-only data
does not become caller-controlled simply because a browser uses an opaque ID.

## Entities

### EntrySettings

| Field | Meaning | Validation / Lifetime |
| --- | --- | --- |
| `schemaVersion` | Settings format, initially 1 | Reject unsupported versions; fall back to safe direct entry on invalid settings. |
| `repositoryEntryEnabled` | Whether normal launch starts at the chooser | Boolean; default true for this feature's delivered version. |

Store separately from the strict remote profile, for example at
`~/.speckit-canvas/entry-settings.json`. No repository-controlled override. Missing
remote profile or disconnected account does not change this setting. The direct
canvas registration is unconditional.

### HostWorkspaceSnapshot

| Field | Meaning | Validation / Lifetime |
| --- | --- | --- |
| `sessionId` | Host-selected active session | Supplied by supported host integration, never accepted from a browser assertion. |
| `contextRevision` | Host epoch for workspace/session changes | Monotonic or otherwise host-comparable; any change invalidates unconsumed consent. |
| `workingDirectory` | Current canonical host directory | Resolve filesystem identity; reject redirected/unavailable paths for entry. |
| `repositoryIdentity` | Git worktree root, common directory, normalized origin, HEAD, branch | Read-only Git inspection, 10-second deadline; distinguish non-Git and unavailable. |
| `activity` | `idle`, `busy`, or `unknown` | Host-reported point-in-time flags; incomplete or read-time-changing activity is unknown and blocks clone admission. |
| `activityRevision` | Observed activity generation | Snapshot and event changes invalidate clone consent; this is not a host-atomic reservation. |
| `capabilities` | Local canvas open, checked/atomic preparation, atomic handoff, acknowledgment, reconciliation | Checked cloning is independent; automatic handoff still requires its complete verified contract. |

Do not use a repository basename as identity. Multiple worktrees may share a
common directory; their specific roots and active branches still differ.
An ordinary current workspace can be dirty and requires no preparation record.
The browser receives a bounded display label and opaque `localContextId`; full
host state stays server-side. Re-read identity at local continuation.

### RepositorySelection

| Field | Meaning | Validation / Lifetime |
| --- | --- | --- |
| `selectionId` | Opaque in-memory selection | Random, bound to one entry instance/generation. |
| `accountKey`, `connectionGeneration` | Bound delegated identity | Never a token; new/disconnected account invalidates selection. |
| `profileFingerprint` | Configured tenant/client/provider/project boundary | Derived from validated configuration, not browser-supplied endpoints. |
| `repositoryId`, `repositoryName` | Authorized candidate | Validated provider identifier and bounded display name. |
| `defaultRef`, `sourceCommit` | Reviewed default branch and exact commit | Current remote metadata; valid ref and full Git object ID. |
| `originIdentity` | Expected normalized source remote | Derive from fixed configured provider/project and repository ID. |
| `sourceContextId`, `sourceContextRevision` | Host workspace at selection | Captured by server, not selected from browser file paths. |
| `matchesCurrentWorkspace` | Whether current Git identity matches candidate | Verified origin/provider identity; name or marker match is insufficient. |

The empty-query collection and typed-query collection are independent. Clearing
search restores suggestions, not a whole-project fallback. Selection fetches
repository/default-ref metadata only, not spec content or a local checkout.

### CloneConfirmation

| Field | Meaning | Validation / Lifetime |
| --- | --- | --- |
| `operationId` | Proposed owned preparation ID | Random, unique; no directory created yet. |
| `selectionId` | Selection being confirmed | Must remain current in the entry instance. |
| `destination` | Proposed managed checkout | Canonical user home plus owned operation directory; never a caller-selected path. |
| `confirmationDigest` | Server-side binding of opaque browser nonce | Timing-safe validation; do not persist nonce or digest after consumption. |
| `binding` | Account generation, profile, repository/ref/commit, destination, source host context, capability generation | All checked again before admission/start. |
| `createdAt`, `expiresAt` | Consent window | 120 seconds; clock injected for tests. |
| `consumedBy` | Idempotent accepted start | A confirmation can authorize only one operation. |

Receiving a preview is not approval. Only the user's **Confirm and clone** action
submits the nonce for start. Busy, unknown, unsupported clone-admission, stale, or expired states
cannot start Git. A default-ref change before start requires a fresh preview and
confirmation. Expiry after admitted start does not cancel that running clone.
Unsupported automatic handoff alone does not prevent checked standalone cloning.

### PreparedRepositoryRecord

| Field | Meaning | Validation / Lifetime |
| --- | --- | --- |
| `schemaVersion` | New record format, version 2 | Existing version 1 records remain read-only inputs; do not rewrite unrelated records. |
| `operationId`, `createdAt`, `completedAt` | Preparation ownership and time | Match owned directory/marker and actual Git result. |
| `profileFingerprint`, `accountKey` | Original authorization boundary | Reconnect must reestablish the same identity boundary before retry. |
| `repositoryId`, `originIdentity`, `defaultRef`, `sourceCommit` | Immutable prepared source | Never replace commit or origin silently during retry. |
| `destination`, `gitCommonDirectory`, `branch` | Original prepared checkout identity | Canonical containment and Git verification; `branch` is the immutable prepared branch, not a host-created target branch. |
| `initialWorktreeFingerprint` | Prepared file-content baseline | Initial validation/retry requires unchanged prepared files and a clean index; exclude Git administrative metadata and checkout path/branch from content comparison. |
| `handoffState`, `lastAttemptId` | Recovery hint | Not proof of active-session binding; must reconcile with host. |
| `acceptedTarget` | Verified target kind, cwd, branch, session/context/instance at `canvas_ready` | Separate from prepared identity; only the host/target binder can establish this mapping. |

Store outside checkout under `~/.speckit-canvas/preparations/`, using owned-path,
regular-file, size, schema, and atomic-write protections. New records are at most
8 KiB; inspect at most 256. Overflow produces a recoverable management error,
not arbitrary deletion. Completed clones have no automatic deletion policy.

Version 1 migration verifies owned destination, common directory, origin, HEAD,
and branch first. Missing origin-account or host state cannot be guessed: show a
non-actionable retained-checkout result until explicit, current authorization
and supported identity validation produce a new recovery binding. Do not treat
the historical manual-open label as a successful automatic handoff.

After first verified `canvas_ready`, ordinary workflow edits and commits are
allowed by the existing canvas; they do not trigger resets or retroactive clone
validation against the initial commit. Initial handoff recovery remains stricter
than subsequent use of an already-active local workspace.

### Workspace Identity Validation

Use separate records for the immutable original preparation and the host-selected
target. Validate branches as canonical full refs; normalize legacy short names
for comparison without rewriting legacy records. Branch names alone, matching
commits alone, or a copied preparation marker never prove a mapping.

| Case | Required Validation | Branch Rule |
| --- | --- | --- |
| Original preparation before activation/retry | Recorded owned destination/common directory/origin, exact prepared `sourceCommit`, unchanged prepared file baseline and clean index | Actual branch must equal recorded `branch`; reject unexpected branch movement without reset. |
| Target is `prepared_checkout` | Host-activated canonical cwd is exactly recorded destination; repeat original-preparation checks at target binding | `targetBranch` must equal recorded `branch` and the target's actual full branch ref. |
| Target is `host_worktree` | Host attests the target cwd for this attempt; Git registers it as a distinct linked worktree of the same canonical common directory; origin and exact `sourceCommit` match; index/worktree are clean with no unexpected untracked content | `targetBranch` may differ from recorded `branch`, but must be the exact valid named ref attested at `workspace_activated` and observed again by the target binder. |
| Already verified local usage | Bind to the accepted target session/context and apply the existing canvas's normal workspace checks | Ordinary subsequent branch/content/commit changes are not compared to the initial preparation or automatically reverted. |

A linked worktree may be under the host's managed worktree location outside the
original clone destination. Validate its canonical path, Git registration, and
attempt-bound host attestation instead of requiring identical checkout paths.
Its `.git` administrative entry and branch are not content-fingerprint equality
inputs; the selected commit, actual tracked files/index, and repository identity
remain mandatory. The original prepared checkout's branch is never rewritten to
the host's branch, and its files must remain unchanged during initial handoff.

An arbitrary different branch, detached HEAD, unreported/prewarm worktree, stale
activation record, changed commit or files, wrong origin/common directory, or
missing Git registration blocks initial readiness. Preserve both checkouts and
report the mismatch; do not fix it by checkout, reset, or another clone. Activation
alone does not relax these initial checks; only verified `canvas_ready` ends the
initial-binding phase.

### HandoffAttempt

| Field | Meaning | Validation / Lifetime |
| --- | --- | --- |
| `attemptId`, `operationId` | Idempotency and retained preparation | One unresolved attempt at a time per preparation. |
| `expectedSource` | Session/context and expected idle admission | Revalidate at host commit point. |
| `target` | Verified retained repository and destination | Derived from server record, not browser path input. |
| `requestedCanvas` | Original workflow provider and fresh instance | Allowlist `sdd-canvas-direct`; no arbitrary provider/action. |
| `status` | `requested`, `in_progress`, `workspace_activated`, `canvas_ready`, `rejected`, `unknown` | Persist before host call; 30-second deadline to final readiness; preserve the last confirmed phase on uncertainty. |
| `activation` | Host-acknowledged target session/context, cwd, `targetKind` (`prepared_checkout` or `host_worktree`), and `targetBranch` | Bound to this attempt at `workspace_activated`; branch mapping is host-owned, never supplied by the entry browser; permits guarded canvas opening only. |
| `result` | Target-verified session/context, cwd, kind/branch mapping, provider/instance | Established at `canvas_ready` only after comparing activation, target metadata, and the applicable workspace-identity rule above. |
| `errorCode` | Bounded recovery category | No raw errors, credentials, prompts, or private command output. |

Lost response is `unknown`, not failure authorization for another transition.
Explicit retry first queries the old attempt. Reconcile `canvas_ready` as complete;
observe an in-progress attempt without reissuing it. A confirmed
`workspace_activated` result resumes only guarded opening/verification in that
same target context and instance after fresh checks; it never switches or clones
again. Only a definitely rejected/not-started attempt with no activation permits
fresh host admission. If the activated target context changed, block recovery.

## Relationships

- One entry instance has one host workspace snapshot and at most one selection.
- A selection can issue one unconsumed confirmation at a time. Replacement or
  account/source-context change invalidates the prior one.
- A consumed confirmation creates at most one preparation operation; retries of
  the same accepted request return its state without spawning Git again.
- A completed preparation may have several sequential explicit handoff attempts,
  but at most one unresolved attempt. It is never recloned by a handoff retry.
- A ready original canvas is bound to one actual host session/context and one
  canonical local worktree. Entry choice IDs are not workflow authorization.

## Entry State Transitions

| State / Event | Guard | Next State And Side Effect |
| --- | --- | --- |
| Launch normal entry | Entry enabled | `chooser`; read host state; remote auth remains optional. |
| Launch direct / entry disabled | Original provider available | `local_ready`; no repository service dependency or auth prompt. |
| Choose current workspace | Fresh local host/Git identity valid | Open original canvas in that session; no Git mutation. |
| Type or clear query | Connected account for remote discovery | Update corresponding dropdown collection; no clone/content read. |
| Select remote candidate | Readable repository and current default branch | `selected`; show destination and consent preview where allowed. |
| Selected candidate is current repo | Canonical origin/repository identity matches | Offer local continuation; no duplicate clone. |
| Confirm clone | Fresh consent + checked/atomic preparation capability + current idle/context observations | `preparing`; consume once and start one owned Git operation without changing the source workspace. |
| Confirm while busy/unknown/unsupported/stale | Guard fails | Remain blocked/selected; no queue, auto retry, or clone. |
| Clone completes | Git/source/ownership verified | Persist record, enter `prepared`; clone-only completion exposes a copyable path, while handoff requires full verified capabilities and uninterrupted eligibility. |
| Host becomes busy/context changes during clone | Change observed | Finish or explicitly cancel owned clone; clone-only completion stays `prepared`; supported handoff enters `waiting_user`, never automatically resuming after idle. |
| Handoff admitted | Atomic host guard succeeds | `handoff_pending`; no workflow enabled yet. |
| `workspace_activated` acknowledgment | Host confirms the attempt's active target session/context/cwd | `target_binding`; open the original canvas guarded, without waiting for `canvas_ready` or enabling workflows. |
| `canvas_ready` acknowledgment | Opened target canvas independently verifies activation, host/Git identity, and provider/instance | `ready`; leave entry view and enable original workflow actions. |
| Handoff rejects/fails | Definite result | `handoff_failed`; retain clone, allow explicit revalidated retry. |
| Handoff deadline/connection loss | Outcome not established | `handoff_unknown`; retain clone and reconcile before retry. |
| Explicit handoff retry | Same account/access, retained clone identity, current source, idle admission valid | Retry/reconcile handoff only; no clone call. |
| Revalidation fails | Access, ownership, contents, or identity mismatch | `validation_blocked`; preserve clone and source workspace. |
| Disconnect/close before completion | Owned clone still incomplete | Cancel owned process; remove only provably owned incomplete staging; no workflow. |
| Disconnect/close after completion | Completed record durable | Retain checkout and record; no auto-resume on reopen/reconnect. |
| Extension replaced during accepted handoff | Host owns accepted transition | Target binder completes/reconciles durable attempt; disposal does not delete completed clone. |

## Invariants

1. `ready` requires actual host and Git identity, never a browser-assigned root.
  `workspace_activated` is insufficient: open and verify the guarded target
  canvas first, then record `canvas_ready` before enabling workflow actions.
2. There are zero clone directory writes before explicit admitted confirmation.
3. Unknown activity/capability/outcome never authorizes a mutation.
4. Idle, auth-success, progress, and SSE events cannot submit user commands.
5. Existing workspace dirty files/branch are preserved. No automatic stash,
   reset, checkout of an existing user directory, setup, commit, push, or workflow.
6. Tokens, auth codes, PKCE verifiers, local HTTP capabilities, and consent nonces
   never enter durable records, logs, screenshots, or documentation.
7. Completed-clone identity is checked before retry and again at target binding;
  copied markers and matching names provide no trust. An attested linked target
  branch can differ, but cannot overwrite the immutable prepared branch record.
