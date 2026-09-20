# Contract: Host Handoff Adapter

**Status: AUTOMATIC HANDOFF REQUIRED, NOT VERIFIED AVAILABLE.** The names below define the entry
layer's proposed adapter semantics. They are not existing Copilot App SDK methods
and must not be called as guessed RPC names. G-HOST remains in ERROR until a
supported host integration implements and demonstrates them.

Implementation inventory rechecked on 2026-09-20 for T003: the App's shipped
public declarations still report CLI 1.0.84-5 and SDK protocol 3. Snapshot/activity
and cwd mutation methods are present; no supported mapping for the complete
atomic admission/activation/readiness/reconciliation contract has been supplied.
This inventory is not native proof and does not enable remote preparation.

## Authorized Clone-Only Path

The user's 2026-09-21 amendment allows standalone cloning before this automatic
handoff contract is available. `supportsRepositoryCloning` accepts the separate
`checkedPreparation` capability or a verified atomic preparation capability.
`supportsRemotePreparation` still requires every automatic-handoff capability;
the default adapter advertises all atomic/handoff capabilities as false.

Default `admitPreparation` performs bounded fresh session/context/activity reads,
checks capability and activity revisions, and consumes each operation ID once.
Context and activity notifications invalidate old observations, and read-time
activity changes become unknown. Busy, unknown and stale checks reject without
queueing. This is observational preflight, not a runtime lock: a new host turn
can race after the check. The isolated clone neither mutates the source checkout
nor changes session cwd, canvas binding, permissions or workspace services.

A completed clone is a successful `prepared` state with its retained destination,
copy control, and no handoff attempt record. Reload/reconnect must not clone or
switch again. Unsupported handoff controls remain hidden. The stronger contract
below applies only to automatic transitions and must not be inferred from this
clone-only capability or its native acceptance.

## Supported Primitives Versus Missing Guarantees

Public extension/session APIs provide `joinSession`, `metadata.snapshot`,
`metadata.activity`, `metadata.isProcessing`, `metadata.setWorkingDirectory`,
session events, and `canvas.open`. These support observations and lower-level
operations. They do not, in the evidence inspected, negotiate an App workspace
activation capability or atomically condition it on idle/source context.

Standalone session creation and CLI TUI foreground selection are not equivalent
to changing the visible Copilot App session. A sequence of an idle read, cwd
mutation, and canvas open is not an implementation of the atomic contract below.

The [native command probe](../evidence/acceptance.md#supplemental-native-host-command-probe)
tested an additional supported route in App 1.1.20: builtin `cwd` (alias `cd`) is
advertised with `allowDuringAgentExecution: false`. `commands.invoke` successfully
changed the session runtime cwd, but the App's own **Show in Explorer** still
selected the original source worktree. The separate `commands.execute` route
returned `No client found for command: cwd`. Neither result satisfies visible
App activation or supplies the remaining admission/reconciliation guarantees.
The owned test session was restored; the production adapter remains unchanged.

## Capability Discovery

The adapter returns a versioned capability result bound to the current App build,
SDK/protocol version, host session, and capability generation. Required behavior:

- Authoritative current-workspace snapshot independent of provider authentication.
- Existing-canvas open/focus in the same verified current session.
- Atomic idle/context admission for starting an extension-owned preparation.
- Atomic idle/context admission and commit for visible repository handoff.
- Host completion of indexing, permissions, extension lifecycle, and workspace UI.
- Separate `workspace_activated` and `canvas_ready` acknowledgments, with
   idempotent lookup of an uncertain handoff attempt.
- Explicit busy, changed-context, rejected, unsupported, and unknown outcomes.

An absent, incompatible, timed-out, or partial automatic-handoff capability keeps
handoff unsupported, not clone-only preparation. **Confirm and clone** requires
its own checked/atomic preparation support plus fresh idle/context observations.
Current-workspace and direct entry remain independent. Automatic compatibility
still requires supported-contract evidence and native proof, not a version guess.

## Logical Adapter Operations

| Operation | Required Input | Required Result |
| --- | --- | --- |
| `inspectCurrent` | Expected joined-session identity, request cancellation | Host session/context revision, canonical cwd, activity/revision, capability generation; unknown on incomplete observation. |
| `openCurrentCanvas` | Fresh source snapshot, allowlisted direct canvas | Acknowledged canvas instance in that same current session; no repository mutation. |
| `admitPreparation` | Operation ID, expected session/context, consent binding | Host-serialized idle/context admission for exactly one Git start, or definite rejection. |
| `handoffPrepared` | Attempt ID, expected source context, verified target, direct canvas identity | Idempotent accepted/rejected operation; emit `workspace_activated`, open the guarded target canvas, then emit `canvas_ready` after target verification. |
| `getHandoffOutcome` | Previously accepted attempt ID, current caller authorization | `not_started`, `rejected`, `in_progress`, `workspace_activated`, `canvas_ready`, or `unknown`; no new transition. |

These are internal TypeScript adapter names; implementation must map them only
to documented, versioned host facilities supplied or approved by the host owner.
The default production adapter exposes read/local-open and checked clone-only
behavior, and returns `host_handoff_unsupported` for automatic handoff and outcome
lookup. Test doubles may
implement the full contract, but must be confined to owned synthetic fixtures.

## Atomic Preparation Admission

The host must serialize authorization against session activity/context changes
until the entry coordinator commits a single Git start or abandons admission.
The contract may use a host-owned bounded reservation, but returning an idle
boolean or an unguarded short-lived token is insufficient.

1. Validate expected source session/context and active-turn/command idle state at
   the serialization point. Include background agents and attached shell work.
2. Commit one start for the consent-bound operation ID; repeated submissions
   cannot create a second child process or checkout.
3. Release admission immediately after start/abort; do not hold the App idle for
   the entire clone. New user work can begin after the clone has started.
4. Any activity/context transition observed during cloning invalidates automatic
   handoff eligibility, even if the session becomes idle again before completion.
5. A busy or unknown result rejects immediately. No host or extension queue,
   delayed start, cancellation of the user's work, or resume-on-idle callback.

Where supported host APIs cannot provide this ordering guarantee, automatic
handoff stays disabled. The explicitly authorized clone-only path uses the
observational checks above. An extension-only mutex does not control host activity.

## Atomic Handoff And Target Acknowledgment

Before submission, the coordinator revalidates delegated repository access and
the retained checkout. The host transition then must:

1. Compare the expected source session/context revision and current idle state
   atomically with accepting and committing the transition. Reject races without
   retargeting any active command.
2. Activate the prepared repository in the visible App. Keeping the conversation
   ID is optional; creating and focusing a new host-managed session is acceptable
   if the original work/session remains accessible.
3. Establish the target host cwd, permissions, indexing, and extension/workspace
   lifecycle. A legitimate App-created worktree is acceptable when it belongs to
   the prepared Git common directory and verified source identity. The host must
   attest whether it activated the original `prepared_checkout` or a distinct
   registered `host_worktree`, plus the actual canonical cwd and full named
   branch ref selected for this attempt; it must not rewrite the original clone's
   recorded branch or files.
4. Emit and durably associate `workspace_activated` with the attempt ID, actual
   target session/context revision, canonical working directory, `targetKind`, and
   `targetBranch`. This host acknowledgment permits opening the target canvas,
   not enabling its workflows.
5. Open the original canvas in a guarded state via the allowlisted direct entry,
   not the chooser. The provider must already be available; do not install plugins
   or regenerate project skills. Opening it MUST NOT wait for `canvas_ready`.
6. The target-side binder reads its own host metadata and Git identity and compares
   them with the activation record using
   [the separate original/target rules](../data-model.md#workspace-identity-validation).
   The original checkout must keep its recorded branch. A registered linked target
   may use a different host-attested named branch at the exact prepared commit;
   it must match the host's branch mapping and have a clean index/worktree. Do not
   require target-branch equality with the prepared branch for this linked case.
   If all checks agree, record `canvas_ready` with the verified session/context,
   cwd, target kind/branch, and canvas provider/instance. Only after `canvas_ready`
   may this instance enable repository workflow actions.

The required order is `workspace_activated` -> guarded canvas open -> target
verification -> `canvas_ready` -> workflow enablement. Missing-provider or target
validation failure after activation leaves workflows blocked and retains the
completed clone. A direct-provider request associated by the host with a pending
handoff cannot bypass this guard; ordinary direct entry in an existing workspace
continues to use its original workspace/prerequisite checks.

An acknowledgment is host/target-originated. A JSON object sent by the entry
browser, a changed heading, a launch request response, or a completed clone is not
proof. Provider callbacks must bind to the correct session even if old panels
remain open; stale-source instances may not dispatch into the newly active target.

## Timing, Failure, And Retry

- Capability/activity requests: 5-second deadline. Any stale observation is only
  informational and cannot override the atomic admission result.
- Target Git verification: 10-second deadline. Missing/changed identity is blocked.
- Final `canvas_ready` acknowledgment: 30-second deadline from accepted handoff.
   `workspace_activated` does not reset that deadline or establish success. On
   timeout, retain the last observed phase and reconcile without a second request.
- Each attempt is idempotent, and its result is queryable across source-extension
  replacement. Persist its ID before submission without host credentials.
- Explicit retry first reconciles the old attempt. Reuse verified `canvas_ready`;
   report in-progress; keep unknown blocked. If `workspace_activated` is confirmed,
   revalidate the current target and resume only guarded canvas opening/verification
   for the same attempt and instance, without another workspace switch or clone.
   A new transition attempt is allowed only after a definite not-started/rejected
   outcome with no activation and fresh access/context/idle checks. A changed
   context after activation blocks recovery; do not silently switch it back.
- If busy during or after clone, wait for idle and a fresh user action. A future
  idle event alone is not consent to resume.
- Disconnect/close never deletes a completed checkout or retries automatically.
  An accepted host transition may finish after the old renderer closes; target
  binding and persisted attempt reconciliation remain necessary.
- Preserve the original workspace and active branch on every path. No automatic
  stash, reset, command abort, or hidden new standalone SDK client.

## Required Host Proof Before Automatic Handoff Enablement

Use owned non-private fixtures first. Record App/SDK versions, source and target
identity, negotiated capabilities, and each ordered result without secrets.

| Probe | Passing Evidence |
| --- | --- |
| Current workspace | Snapshot agrees with actual active App session and Git root. |
| Busy at confirmation | No Git start, checkout, queued work, or host transition. |
| Busy after activity read | Admission rejects when a turn/command wins the race. |
| Context change after consent | Start and handoff reject the stale source epoch. |
| Busy during clone | Clone may finish; becoming idle does not trigger handoff. |
| Foreground activation | Visible App target, host snapshot, and canvas Git identity all agree. |
| Two-stage acknowledgment | `workspace_activated` precedes guarded canvas open; target verification precedes `canvas_ready` and workflow enablement. |
| Activation without canvas readiness | Missing provider, timeout, or failed target validation keeps workflows blocked; explicit recovery reuses the activated attempt without another switch or clone. |
| Host-created worktree | A different host-attested named branch at the prepared commit passes only for the registered linked target; source checkout/branch remain unchanged. |
| Invalid target mapping | Reject arbitrary/unattested branches, detached/prewarm worktrees, missing registration, wrong origin/common directory, changed initial HEAD/files, and stale activation without reset or reclone. |
| Extension replacement | Completed record survives; target loads original canvas without silent installation. |
| Lost/late response | One transition only; reconciliation uses the same attempt ID. |
| Rejection or unsupported host | Original workspace unchanged; clone route cannot start when unsupported. |

G-HOST passes only with supported-contract evidence and these actual-host results.
If the owner cannot supply the required guarantees, leave the gate in ERROR and
report the blocker. The user has not approved manual handoff as a replacement.
