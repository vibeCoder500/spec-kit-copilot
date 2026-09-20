# Research: Repository Entry Layer

Date: 2026-09-20. Scope: read-only local code, installed public SDK declarations,
and public SDK documentation. No App mutation, connection, clone, or workflow was
performed for this planning research.

## R1: Supported Host Handoff

**Decision**: The installed host cannot presently be treated as supporting the
required automatic handoff contract. The production adapter defaults to
unsupported; enablement requires capability negotiation and actual-host proof.

**Evidence**:

- The existing SDD extension joins the foreground session and reads
  `session.rpc.metadata.snapshot().workingDirectory`. Its workflow target is
  host-derived, not a browser selection.
- Installed public declarations report CLI 1.0.84-5 and SDK protocol 3. Public
  upstream source inspected during research was ahead at CLI 1.0.87-0, so its
  additions cannot be assumed installed.
- `metadata.setWorkingDirectory()` exists as a public per-session operation. Its
  contract validates/rebases the cwd and emits `session.context_changed`, but
  leaves host effects such as indexing to the host. It does not acknowledge
  visible Copilot App workspace activation or target canvas readiness.
- `canvas.open()` can open/focus a canvas in a correctly bound session. It is not
  itself a repository-switch operation.
- `CopilotClient.setForegroundSessionId()` is documented for CLI TUI
  `--ui-server`; `joinSession()` returns a `CopilotSession`, not that client.
  Standalone create/resume working-directory options do not prove an App session
  switch or grant permission to start another client.

**Rationale**: Selecting a different renderer root would leave agent actions
targeting another workspace. Merely changing session cwd can also leave host UI,
indexing, extensions, or an active command bound to stale state.

**Alternatives considered**: Separate read/activity/set-directory RPC calls;
creating a standalone SDK conversation; sending an agent prompt to change cwd;
manual folder navigation; guessed deep links; private App IPC; native UI
automation. None is accepted as the required production handoff.

**Resolution**: Known external gate G-HOST, not an invented callable API. The
required negotiated behavior is specified in
[host-handoff.md](contracts/host-handoff.md). Public-contract absence is not proof
that the App can never support it, but it is insufficient evidence to enable it.

## R2: Idle Admission And Races

**Decision**: Activity observations drive disabled/loading UI only. Starting a
clone and committing a handoff require host-atomic admission against expected
session/context and authoritative activity, including active commands.

**Evidence**: Public `metadata.activity()` exposes `abortable` and `hasActiveWork`;
`metadata.isProcessing()` describes turns/background continuations. `session.idle`
excludes background agents and attached shell commands, unlike `assistant.idle`.
Command start/completion events exist, but no inspected contract provides an
atomic idle-check-plus-handoff or admission lease with a context revision.

**Rationale**: A user can start another turn between an idle read and a mutation.
Extension-local locks do not serialize host actions. Replaying incomplete event
history cannot establish an authoritative idle snapshot.

**Alternatives considered**: Treat the latest idle event as authorization; use
`isProcessing()` alone; retry automatically after busy. These fail the clarified
no-queue/no-auto-resume rule or the race requirement.

**Resolution**: Unknown activity is treated as unavailable for remote mutations.
Ask the host owner for admission and rejection semantics. A confirmed clone can
finish after the host becomes busy, but handoff then waits for explicit retry.
Current-workspace continuation is read-only and need not wait for idle.

## R3: Ownership And Launch Routing

**Decision**: Add an independent entry renderer/controller within the existing
extension and a second explicit direct-canvas registration. Reuse one workflow
renderer and handler set. Keep a separate per-user entry-enabled setting so a
missing remote profile does not suppress local entry.

**Evidence**: The existing `index.html` mounts repository UI only when configured;
the controller reparents local header/layout nodes into a rail/preview workspace.
The extension currently registers only `sdd-canvas`. Neither behavior meets the
clarified first-screen and independent-current-workspace requirements.

**Rationale**: Source/DOM/route separation preserves canvas-team ownership while
avoiding a new plugin, duplicate runtime, or second workflow implementation.
Removing old mounting must preserve subsequent artifact-reader fixes.

**Alternatives considered**: Keep the old rail behind conditional CSS; iframe or
copy the original workflow; introduce a separately shipped plugin immediately.
Those retain coupling, duplicate state, or add distribution complexity without
solving the required host handoff.

## R4: Discovery And Selection

**Decision**: Reuse the existing delegated Microsoft connection and Azure DevOps
project boundary. Empty-query dropdown uses team-linked suggestions; typed search
uses readable project repositories. Keep query/selection state in the entry
controller; fetch no spec/constitution content before cloning.

**Evidence**: Existing discovery already provides the two collections, signed
account-bound cursors, normalization, authorization revalidation, bounded
personalization, and four-way detail concurrency. Root manifest reads used by
personalization are metadata support, not user-facing pre-clone file browsing.

**Rationale**: No new permission grant, hosted proxy, persistent token cache, or
authentication migration is necessary. Local entry must not depend on successful
suggestions, profile parsing, remote login, or provider availability.

**Alternatives considered**: A persistent rail; suggestions requiring a full
project fallback; cloned files as the discovery source. These contradict the
clarifications or increase the mutation/access surface.

## R5: Confirmed Clone And Durable Recovery

**Decision**: Reuse the bounded native Git preparation and managed destination,
but decouple it from remote-review contexts. Add a source/session-bound
confirmation and bounded credential-free recovery store. Reuse completed clones
on handoff retry; never silently reclone, reset, or remove them.

**Evidence**:

- Existing `clone.ts` uses a 120-second consent lifetime, 10-minute deadline,
  one active clone, 32 operations, shell-free Git arguments, isolated credential
  environment, and a new per-operation checkout.
- Existing state is `prepared_for_manual_open`; it writes a token-free completion
  record but has no retained-clone handoff retry or host acknowledgment.
- Confirmation checks account/repository/commit, not current host context/activity.
  Its remote-review source is already pinned, so source-ref movement needs a new
  direct check before clone start.
- `clear()`/`dispose()` drop in-memory operations; disconnect/close therefore
  cannot be the only home of completed-retry state.
- Existing workspace binding checks Git common directory, origin, initial HEAD,
  and the presence of a named target branch; it permits App-created worktrees
  without requiring target-branch equality with the original prepared branch.
  The replacement needs separate original-checkout verification and an explicit
  attempt-bound host mapping for linked targets, not a blanket same-branch check.
  Ordinary current repositories also need identity beyond `basename(workspacePath)`.

**Rationale**: Handoff can replace the extension process. Durable completion must
precede it, and retained records are hints to revalidate rather than authorization
or evidence that a clone is safe to overwrite.

**Identity refinement**: Preserve the managed clone's recorded branch/commit/files.
Accept a distinct registered linked target on a different named branch only when
the host attests its canonical path/branch for this attempt and the target verifies
the same repository, exact prepared commit, and clean index/worktree. Do not
replace the prepared identity with the target mapping. Keep initial checks in
force after `workspace_activated`; ordinary local-edit semantics begin only after
verified `canvas_ready`. See [the validation rules](data-model.md#workspace-identity-validation).

**Alternatives considered**: Delete and reclone on failure; persist tokens or
consent; accept a copied marker as binding; trust path/repository name alone.
Reject all four. Existing 4 KiB records are read-only migration inputs; use a new
bounded versioned record for host handoff metadata without changing older data.

## R6: Bounds And Verification

**Decision**: Retain existing discovery/clone limits and add explicit bounded
host checks. Use 5 seconds for capability/activity reads, 30 seconds for handoff
completion at `canvas_ready`, and 10 seconds for canonical Git verification.
Intermediate `workspace_activated` does not reset the completion deadline or
enable workflows. No UI timer starts a mutation. Retain clones on uncertain
outcomes and reconcile by attempt identity without repeating an activated switch.

**Rationale**: Network/host failure must terminate the wait without becoming false
success or authorizing a second transition. These bounds are planned defaults and
must be measured in implementation; a longer clone does not extend confirmation
because confirmation is consumed when start is admitted.

**Alternatives considered**: Unbounded spinners; repeated background retry;
deleting completed checkouts on timeout. These obscure uncertainty or violate
the user's recovery decision.

**Validation**: Reuse existing unit/controller/browser/staging test homes. Prove
the offline local path, direct-entry equivalence, zero pre-consent clones,
host-state races, source movement, target identity mismatch, retained-clone retry,
disconnect/close, and no auto-resume. Native remote testing is gated by host proof;
synthetic handoff never substitutes for actual App acceptance.

## Sources

- [SDK extension lifecycle](https://github.com/github/copilot-sdk/blob/main/nodejs/docs/extensions.md)
- [joinSession implementation](https://github.com/github/copilot-sdk/blob/main/nodejs/src/extension.ts)
- [Canvas declarations and lifecycle](https://github.com/github/copilot-sdk/blob/main/nodejs/src/canvas.ts)
- [Generated session RPC contract](https://github.com/github/copilot-sdk/blob/main/nodejs/src/generated/rpc.ts)
- [Session event contract](https://github.com/github/copilot-sdk/blob/main/nodejs/src/generated/session-events.ts)
- [SDK session configuration types](https://github.com/github/copilot-sdk/blob/main/nodejs/src/types.ts)
- [Local canvas registration and host binding](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs)
- [Existing repository service](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/repository-service.ts)
- [Existing clone lifecycle](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/clone.ts)
- [Existing workspace verification](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/workspace-binding.ts)
- [Existing repository UI](../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/ui/repository-browser.ts)

Installed public declarations were inspected from the App's shipped
`copilot-sdk` directory; machine-specific installation paths, account values,
session identifiers, and private repository inventory are intentionally omitted.
