# Implementation Plan: Repository Entry Layer

**Branch**: `plan/canvas-repository-discovery` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Clarified specification in `specs/002-repository-entry-flow/spec.md`.

**Status**: Updated on 2026-09-21 for user-authorized standalone cloning. G-HOST
blocks automatic App handoff, not the independent clone action. This plan does
not claim that automatic App handoff has been verified.

## Summary

Replace the embedded rail and remote reader with an optional, separately rendered
repository chooser before the existing SDD canvas. The ordinary `sdd-canvas`
launch shows the chooser when enabled. A separately discoverable direct-canvas
entry always opens the original workflow in the actual current workspace.

Reuse the established Microsoft connection, authorized Azure DevOps discovery,
bounded Git preparation, and workspace verification. Add an entry coordinator
that owns selection, consent, preparation, and acknowledged host handoff. Do not
reparent the workflow DOM, duplicate the workflow engine, or assign the canvas a
different project root while the agent remains in its previous workspace.

The default installed-host adapter exposes `checkedPreparation` for a standalone
clone after fresh context/activity checks. Activity events invalidate old consent;
each operation is admitted once. This is not a host-atomic reservation and does
not prevent a later concurrent turn. Git runs only in its new managed destination;
the current App session and repository remain unchanged. Completion exposes the
retained path and copy control without a handoff error or automatic retry.

Automatic handoff remains disabled until an App-supported contract proves visible
activation, atomic ordering and reconciliation. Public cwd mutation and activity
reads alone do not meet that contract. Current-workspace entry also remains
independent of this gate and of remote authentication.

## Technical Context

**Language/Version**: Existing Node.js ESM entry points; TypeScript 5.9.3 for the
entry-layer package; Node >=24.15.0 build floor. Native verification must record
the actual App runtime rather than infer compatibility from the developer Node.

**Primary Dependencies**: Host-provided `@github/copilot-sdk/extension`; existing
exact pins `@azure/msal-node` 6.0.0, `open` 11.0.2, `yaml` 2.9.0, `lucide` 1.42.0,
and esbuild 0.28.2. No new application framework, authentication stack, bundled
Copilot SDK, or second CLI process. Existing shared reader stays downstream.

**Storage**: In-memory account/token cache, discovery cursors, selection, and
short-lived consent; user-owned profile outside the repository; credential-free
completed-preparation and handoff records under the existing managed user area.
Only confirmed preparation creates a managed checkout. No database is needed.

**Testing**: Existing Node test runner with `tsx`, TypeScript, ESLint, actual-shell
Playwright, source-aware package integrity checks, and Windows native App
acceptance. Keep current SDD and shared-reader regression gates intact.

**Target Platform**: GitHub Copilot App canvas host. Windows is the initial native
acceptance target; existing Windows/Linux package checks remain required. Installed
public declarations inspected during research report CLI 1.0.84-5 and protocol 3;
this is a research scope, not a sufficient handoff compatibility floor.

**Project Type**: Optional entry module and renderer within the existing SDD
extension, with narrow launch routing; not a new canvas workflow implementation,
Spec Kit preset, cloud service, or independent AI client.

**Performance Goals**: Local chooser visible within 2 seconds p95 in the owned
fixture; current-workspace continuation within 2 seconds p95 when local Git and
the host respond; search debounce 1 second; four metadata checks at most in
parallel. These are implementation acceptance targets, not measurements yet.

**Constraints**: Network request deadline 10 seconds; discovery operation deadline
35 seconds; confirmation lifetime 120 seconds; clone deadline 10 minutes; local
identity verification 10 seconds; host capability/activity query deadline 5
seconds; handoff acknowledgment deadline 30 seconds. A timeout means unknown or
incomplete, never ready. Late handoff outcomes require reconciliation before
another attempt. No automatic retry of user-authorized mutations.

**Scale/Scope**: One selected repository, one active preparation, at most 32
in-memory operations, existing 100-result search pages and four-result team
pages, 256 retained-record inspection limit. Preserve discovery's existing
association/verification bounds. New preparation records are bounded to 8 KiB;
existing schema remains readable at its 4 KiB limit. No pre-clone file trees or
Markdown content endpoint in the entry surface.

## Constitution Check

The project's constitution is an unfilled template, not a ratified policy. Do not
invent principles from its example text. Apply `AGENTS.md`, the clarified spec,
and the following explicit delivery gates instead.

| Gate | Pre-Research | Post-Design | Enforcement |
| --- | --- | --- | --- |
| G-OWN Canvas ownership | Required | PASS by design | Separate entry renderer; only launch/binding adapters touch the existing canvas; preserve direct entry and workflow behavior. |
| G-SCOPE Repository conventions | Required | PASS by design | No integration-management skill, preset changes, unrelated plugin bump, or second SDK/CLI. |
| G-AUTH Access and credentials | Required | PASS by design | Reuse delegated account boundaries; no token in browser state, records, URLs, or evidence. |
| G-CONSENT Mutation boundaries | Required | PASS by design | No clone on selection; fresh confirmed action and idle admission; no queue or automatic resume. |
| G-HOST Atomic App handoff | Evidence required | **ERROR: blocked** | No automatic handoff enablement until atomic admission, visible activation, binding and reconciliation are proved. The authorized clone-only path is independent. |
| G-COMPAT Existing canvas | Required | Pending implementation | Direct-entry and both successful-entry results must pass the existing canvas tests unchanged. |
| G-NATIVE Actual host proof | Required | Pending implementation | Two real Spec Kit-enabled repositories; current-workspace and clone/handoff journeys; private evidence stays outside Git. |

G-HOST remains required for automatic-handoff claims under FR-010, FR-011 and
SC-003. The explicit 2026-09-21 scope amendment removes it as a prerequisite for
standalone cloning. Report the two outcomes separately; never promote checked
clone admission, manual opening or native UI automation into automatic handoff.

## Project Structure

### Documentation (this feature)

```text
specs/002-repository-entry-flow/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  checklists/requirements.md
  contracts/entry-layer.md
  contracts/host-handoff.md
```

`tasks.md` is generated later by `/speckit.tasks`, not by this planning operation.

### Source Code (repository root)

The following describes proposed implementation placement; new files listed here
are not created by the planning step.

```text
plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/
  extension.mjs                 # Existing registration + narrow launch routing
  index.html                    # Original canvas only; remove embedded repo mount
  entry.html                    # New isolated entry renderer
  sdd.mjs                       # Existing scanner and workflow rules preserved
  repository-browser/
    package.json
    build-runtime.mjs
    src/
      repository-service.ts     # Refactor into entry coordinator
      host-handoff.ts           # New capability adapter; unsupported by default
      preparation-store.ts      # New bounded token-free recovery records
      workspace-binding.ts      # Shared canonical identity checks
      clone.ts                  # Existing bounded Git preparation
      auth.ts                   # Reuse with connection-scope invalidation
      discovery.ts              # Team suggestions + project name search
      ui/repository-entry.ts    # New chooser, no rail or artifact reader
      ui/repository-entry.css
    test/                       # Extend existing focused test homes
  ui/                          # Generated, named entry assets
  vendor/repository-browser/    # Existing dependency-closed server bundle
scripts/canvas-reader/
  fixtures/repositories.mjs
  serve-fixture.mjs
  stage-app-fixture.mjs
  test/repositories.spec.mjs
  test/repository-browser.test.mjs
  test/repository-staging.test.mjs
.github/workflows/canvas-reader-validation.yml
```

**Structure Decision**: Keep the existing build package and security primitives.
Introduce only the renderer, host adapter, and durable-recovery boundary the new
flow needs. Keep ownership separate at source, DOM, route, and lifecycle levels;
a separate distributable plugin is not necessary for this slice. Register
`sdd-canvas-direct` alongside the normal `sdd-canvas` entry using the same workflow
handlers and renderer, not copies. Provider identity remains explicit in action
dispatch and instance lookup.

## Phase 0: Research Decisions

[research.md](research.md) records the evidence, alternatives, and decisions.
All product choices are resolved by the clarified spec. The host gap is a known
external prerequisite with explicit failure behavior, not an assumed API.

1. Keep the current-workspace path usable while disconnected or without a valid
   remote profile. Entry enablement is separate from authentication enablement.
2. Split the UI instead of continuing to mount the old repository browser around
   the workflow DOM. Remove the old rail, pre-clone reader, and manual-open flow
   from the normal entry; do not maintain two competing repository experiences.
3. Require a supported host contract for foreground activation and authoritative,
   atomic idle/context admission. Observe activity for UI feedback only; it is not
   sufficient authorization for a later mutation.
4. Reuse completed clones after handoff failure and revalidate them without
   cloning, resetting, changing branches, or deleting user changes.
5. Retain existing bounds and introduce explicit host timeouts; no unbounded
   polling, unsolicited reconnection, new grants, or current-session cancellation.

## Phase 1: Design

### Entry And Canvas Ownership

- Add a per-user entry preference `repositoryEntryEnabled` in an entry-specific
  settings file, defaulting to true for this feature's delivery. Keep the existing
  remote profile's strict schema unchanged. Invalid/missing remote configuration
  only disables remote discovery, never the current-workspace shortcut.
- Normal launch routes to entry when enabled; direct launch and disabled entry
  use the original renderer. Recoverable entry startup failure offers direct
  opening, not a blank canvas. Direct entry remains discoverable even if the
  entry service fails.
- Prepare the coordinator without altering the existing normal-launch UI/router.
  Switch to the chooser, reject retired repository routes, migrate obsolete tests,
  and regenerate assets in one coordinated changeset validated by T022. Do not
  retire routes while the old mounted UI still calls them, or expose the new
  chooser with legacy routes that bypass its gates. Remote behavior stays blocked
  until its implementation and G-HOST pass; later cleanup removes dead assets only.
- Local continuation re-reads the host's current session metadata, canonicalizes
  its Git worktree, and opens the original canvas in that same session. This is
  read-only and remains available during a busy turn; it neither starts a clone
  nor changes the session repository.
- Entry pages contain only connection, current-workspace identity, dropdown
  suggestions/search, selection summary, consent, progress, and recovery controls.
  Preserve keyboard navigation, visible focus, loading/error/empty states, and
  360/768/1280/1920 px layout coverage using existing fonts and icon conventions.
- Bind each workflow instance to its host session and context revision. The
  current process-global `PROJECT_ROOT` must not be retargeted to a selection.
  After `workspace_activated`, prefer host-reloaded extension instances; if a
  supported host keeps the process, close stale instance services and construct
  fresh ones from new host metadata. Open the target canvas guarded, verify its
  binding, then record `canvas_ready` before exposing workflow actions.

### Preparation And Handoff

- Build selection from authorized repository metadata, not a remote-reader
  context. Reuse auth/discovery and the bounded Git runner; detach clone inputs
  from `RemoteReview` so no artifact fetch is needed to prepare a repository.
- Bind confirmation to account generation, repository, current default ref and
  full commit, canonical proposed destination, source session/context revision,
  and capability generation. Revalidate the current default ref at start; a
  changed revision requires a fresh confirmation, not silently cloning the old
  cached review snapshot.
- Clone once under the existing user-managed operation directory. At completion
  persist an owned, token-free record before requesting host transition, because
  the old extension may terminate during session replacement.
- Attempt handoff automatically only within the still-valid, uninterrupted
  confirmed flow and after a host-atomic idle/context check. A busy observation,
  failed transition, or timeout invalidates automatic progression. Retain the
  clone and require explicit handoff-only retry after revalidation.
- Handoff retry rechecks current remote access, immutable prepared revision,
  canonical Git common directory/origin/HEAD/branch, and the applicable current
  host context: the source before activation, or the attested target after it.
  It never calls clone start or deletes the retained checkout.
  Default-branch advances after completed preparation do not silently replace
  the prepared revision; show and verify the recorded revision.
  Reconcile the prior attempt before another transition: confirmed
  `workspace_activated` resumes only guarded canvas opening/verification in that
  current target context, while `canvas_ready` is final verified success. Unknown
  outcomes or a changed activated context remain blocked, never switched again.
- Close/disconnect cancels only an owned in-flight clone and cleans only its
  provably owned incomplete staging. Completed checkouts/records survive. There
  is no automatic resume when a page reopens, auth returns, or the host becomes
  idle. Recovery is shown only for validated, locally owned completed records.
- Handoff has two acknowledgments. The host emits `workspace_activated` with the
  attempt and actual target session/context/cwd/kind/branch, permitting a guarded
  canvas to open. Its target-side binder applies the separate original-checkout
  and linked-worktree rules in [data-model.md](data-model.md#workspace-identity-validation)
  before recording `canvas_ready`. Only final readiness enables workflow actions;
  it is never a prerequisite for opening the guarded canvas that establishes it.
  The requesting browser cannot author either acknowledgment or branch mapping.
- The original managed clone retains its recorded branch/commit/files throughout
  initial handoff. A distinct App-attested, Git-registered linked target may use a
  different named branch at that exact commit, provided its actual branch matches
  the host mapping, origin/common directory agree, and its index/worktree are
  clean. Do not compare that target branch to the original clone's branch or
  overwrite the source record with it. Unattested, detached/prewarm, wrong-identity,
  changed-initial-content, or stale-context targets fail closed without repair.

### Contracts And State

[data-model.md](data-model.md) defines identities, consent, retained preparation,
handoff attempts, and transitions. [entry-layer.md](contracts/entry-layer.md)
defines the user-facing routes, action guards, and renderer boundary.
[host-handoff.md](contracts/host-handoff.md) is a required adapter contract, not a
claim that named methods already exist in Copilot App.

## Phase 2: Implementation Sequence

1. **Host proof first**: obtain the supported capability and admission contract;
   record installed App/SDK versions and prove visible target activation, idle
   rejection, and source-context race rejection in an owned fixture. No live
   private clone until this gate passes. If it fails, keep G-HOST in ERROR.
2. **Baseline and current workspace**: snapshot the existing direct canvas tests,
   add chooser-first/direct-entry registration and offline local continuation.
   Keep renderer, workflow prerequisites, artifact navigation, and ordinary
   worktree behavior unchanged. Preserve later canvas-team changes during any
  removal of old repository-specific mounting. Pair the new launch renderer with
  old-route rejection, migrated tests, and regenerated assets in the same T022
  validation boundary; foundational work leaves existing routing untouched.
3. **Chooser and discovery**: implement only dropdown suggestions/project search,
   selection summary, account status, and deterministic errors. No rail or remote
   artifact content fetch. Unsupported hosts may search but cannot confirm clone.
4. **Consent and preparation**: add host-context and current-ref revalidation,
   atomic idle admission, idempotent confirmed start, existing clone protections,
   cancellation, and versioned preparation records.
5. **Handoff and recovery**: implement the proved host adapter, `workspace_activated`
  followed by guarded canvas open and verified `canvas_ready`, source preservation,
  retained-clone recovery, late-result reconciliation, and no automatic resume
  after busy/failure.
6. **Integration and packaging**: verify routes already retired at the coordinated
  launch migration remain rejected; remove leftover unreachable embedded assets
  only after replacement coverage passes. Regenerate the dependency-closed bundle,
  exact asset manifest, notices, staging rules, and CI filters. Keep the shared
  reader unchanged unless a test demonstrates a required integration fix.
7. **Native acceptance and report**: follow [quickstart.md](quickstart.md). Verify
   actual current-workspace and confirmed-clone paths, one cancelled confirmation,
   no second clone on handoff retry, and unchanged source workspace. Separate
   synthetic, native, and hosted-CI results; no publication or push is implied.

Each implementation slice must run its focused test immediately after editing.
Broaden to the existing canvas/package gates before native acceptance. Partial
local-entry delivery cannot be reported as the complete feature while G-HOST or
G-NATIVE remains unmet.

## Planning Execution Notes

- The required setup script ran successfully. Its branch helper relies on
  `SPECIFY_FEATURE`; the setup call temporarily supplied the verified current Git
  branch and restored the prior environment without editing the helper.
- The generated `update-agent-context.ps1` helper is absent from this project's
  installed script set and integration manifest. It could not be run. Equivalent
  scoped context was added manually in
  [repository-entry.instructions.md](../../.github/instructions/repository-entry.instructions.md),
  preserving the maintainer-owned `AGENTS.md` and installed agent commands.
- No runtime implementation, App mutation, live clone, workflow, commit, or push
  is performed by this planning step. Private acceptance for the prior design
  does not establish acceptance of this replacement flow.

## Complexity Tracking

No constitution violation is being waived. The additional host adapter and
preparation store are necessary to avoid hidden workspace retargeting and losing
consent/recovery across extension replacement. The missing host capability is an
external blocking dependency, not justification for an unsupported workaround.
