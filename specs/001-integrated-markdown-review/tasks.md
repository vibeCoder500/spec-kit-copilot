# Tasks: Integrated Markdown Artifact Review in Spec Kit Canvases

**Input**: Design documents from `specs/001-integrated-markdown-review/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Focused tests are required by FR-057 and the release matrix. Within each user story, write the listed tests first and confirm they fail for the intended missing behavior before implementation.

**Red-phase evidence**: A task that says `failing` is complete only after its command, expected missing behavior, and observed failure are recorded in `specs/001-integrated-markdown-review/evidence/red/T###.md`. Separate per-task files preserve `[P]` execution.

**Organization**: Tasks are grouped by user story so each behavior can be implemented and validated as an independently reviewable increment. Wizard and SDD are both mandatory for the core release.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other `[P]` tasks in the same phase because it changes different files and has no dependency on their incomplete work.
- **[Story]**: Maps the task to the corresponding user story in [spec.md](spec.md).
- Every task names the exact file or directory it changes or the evidence file it produces.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the isolated reader build, validation tooling, evidence structure, and unchanged-repository baseline without creating a new plugin, canvas, server, or root npm workspace.

- [X] T001 Record the checkout revision, upstream baseline, existing remotes, dirty files, fork ownership fields, support owner field, source-reuse decision, and approval statuses in specs/001-integrated-markdown-review/evidence/implementation-gates.md
- [X] T002 After dependency and license approval, create the locked build-only reader package and scripts in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package-lock.json
- [X] T003 [P] Configure strict reader typechecking and dependency-closed ESM/CSS library output in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/tsconfig.json and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/vite.config.ts
- [X] T004 [P] Create the allowlisted build-copy and verification command surface in scripts/canvas-reader/sync-assets.mjs
- [X] T005 [P] Create owned-fixture staging and actual-shell serving command surfaces in scripts/canvas-reader/stage-app-fixture.mjs and scripts/canvas-reader/serve-fixture.mjs
- [X] T006 [P] Add the focused reader, canvas, browser, package, and Windows validation job skeleton in .github/workflows/canvas-reader-validation.yml
- [X] T007 Define redacted evidence naming, status, environment, artifact-hash, platform-gap, and approval-reference conventions in specs/001-integrated-markdown-review/evidence/README.md
- [X] T008 Verify that no root package workspace, standalone reader plugin, new canvas manifest, fork remote, or EzPzSpec change was introduced and record the baseline in specs/001-integrated-markdown-review/evidence/setup-baseline.md

**Checkpoint**: Build and evidence structure exists; no external approval has been inferred and no production behavior has been broadly implemented.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the secure read primitive, browser mount boundary, deterministic asset distribution, dual-shell harness, and mandatory early App feasibility gate used by every story.

**CRITICAL**: T016 must pass for both existing canvases before secure-domain and user-story implementation. If App loading or single-provider isolation fails, stop and resolve that gate rather than substituting a standalone reader.

### Minimal Probe and Early Gate

- [X] T009 [P] Write failing minimal mount/update/unmount and packaged-probe tests in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/test/mount.test.tsx and record the red run in specs/001-integrated-markdown-review/evidence/red/T009.md
- [X] T010 [P] Write failing allowlisted probe-copy, manifest, notice, unresolved-import, source-map, local-path, and unexpected-file tests in scripts/canvas-reader/test/sync-assets.test.mjs and record the red run in specs/001-integrated-markdown-review/evidence/red/T010.md
- [X] T011 Implement the minimal dependency-closed static reader probe with mount/update/unmount behavior in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/types.ts and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/mount.tsx
- [X] T012 Implement allowlisted probe building, copying, manifest generation, and notices in scripts/canvas-reader/sync-assets.mjs and generate the initial assets in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/vendor/markdown-reader/ and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/vendor/markdown-reader/
- [X] T013 Add the minimal packaged-reader probe to the existing Wizard artifact overlay without changing workflow actions in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/modals.js
- [X] T014 Add capability-gated reader asset serving and the minimal packaged-reader probe to the existing SDD artifact view in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/index.html
- [X] T015 Implement owned synthetic workspace/session fixtures and complete modified-plugin staging for the early gate in scripts/canvas-reader/serve-fixture.mjs, scripts/canvas-reader/stage-app-fixture.mjs, and scripts/canvas-reader/fixtures/
- [X] T016 With explicit App-loading approval, verify the effective workspace prerequisite and execute the six gate conditions for Wizard and SDD, recording packaged loading, invalid-access denial, intended source identity, one provider, return context, and unchanged status in specs/001-integrated-markdown-review/evidence/early-two-canvas-gate.md

### Post-Gate Secure Foundation

- [X] T017 [P] Write failing tests for bounded reads, strict UTF-8/BOM handling, exact-byte revisions, replacement detection, and ordinary-file containment in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/artifact-read.test.mjs and record the red run in specs/001-integrated-markdown-review/evidence/red/T017.md
- [X] T018 [P] Write failing tests for opaque contexts, descriptor membership, generation-bound cursors, cumulative inspection counts, typed errors, and cross-context rejection in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/artifact-review-context.test.mjs and record the red run in specs/001-integrated-markdown-review/evidence/red/T018.md
- [X] T019 Implement dependency-free lexical/canonical containment, regular-file validation, 5,242,880-byte handle reads, strict UTF-8 decoding, race detection, exact revisions, and the packaged SDD helper in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server/artifact-read.mjs and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/vendor/artifact-read.mjs
- [X] T020 Implement opaque review contexts, artifact descriptors, generation-bound cursors with cumulative inspection counts, typed errors, and current-membership primitives in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server/artifact-review.mjs
- [X] T021 Run the post-gate reader, sync, secure-read, context-domain, Wizard, and SDD focused tests and record commands, red/green evidence references, versions, failures, and repository status in specs/001-integrated-markdown-review/evidence/foundation-validation.md

**Checkpoint**: Secure shared primitives exist and the real host has proven that both modified existing canvases can load, remain isolated, and return to their workflow context.

---

## Phase 3: User Story 1 - Review Artifacts Without Leaving the Workflow (Priority: P1) (MVP)

**Goal**: Open a primary Markdown artifact inside the existing Wizard and SDD previews, keep workflow execution separate, and return to the same feature/stage, scroll position, and invoking control.

**Independent Test**: In each actual canvas shell, select one feature/stage, open its primary artifact, inspect it while execution is unavailable, return to the workflow, and verify unchanged workflow and repository state.

### Tests for User Story 1

- [X] T022 [P] [US1] Write failing Wizard tests for primary-artifact context, same-overlay mounting, execution-unavailable readability, unmount, return focus/scroll, and zero workflow dispatch in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/artifact-review.test.mjs
- [X] T023 [P] [US1] Write failing SDD tests for primary-artifact context, capability-gated assets, execution-unavailable readability, unmount, return focus, and zero workflow dispatch in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/artifact-review.test.mjs
- [X] T024 [P] [US1] Add the failing Wizard primary-artifact and Back-to-workflow Playwright journey in scripts/canvas-reader/test/wizard-shell.spec.mjs
- [X] T025 [P] [US1] Add the failing SDD primary-artifact and Back-to-workflow Playwright journey in scripts/canvas-reader/test/sdd-shell.spec.mjs

### Implementation for User Story 1

- [X] T026 [US1] Implement Wizard primary-artifact review-context creation and additive content handling while retaining legacy artifact responses in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server/artifact-review.mjs and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server.mjs
- [X] T027 [US1] Implement Wizard generation-bound document loading, reader mount/disposal, and read-only callbacks in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/artifact-review.js
- [X] T028 [US1] Route Wizard artifact/command/folder entry points through the adapter and restore feature, stage, pipeline scroll, and invoking focus in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/modals.js, plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/phase-card.js, and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/composition-artifacts.js
- [X] T029 [US1] Implement SDD feature/project review-context creation, primary-artifact reads, and additive capability-gated review/static routes while retaining legacy feature/stage routes in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/artifact-review.mjs and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs
- [X] T030 [US1] Implement the SDD reader adapter and integrate it with `viewArtifact`, `openArtifactView`, and `#artBody` while restoring the originating feature/stage/focus in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/ui/artifact-review.js and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/index.html
- [X] T031 [US1] Run both focused suites and actual-shell journeys and record same-canvas rendering, return state, readable-without-execution, zero dispatch, and zero source mutation in specs/001-integrated-markdown-review/evidence/us1-primary-review.md

**Checkpoint**: The MVP is independently demonstrable in both existing canvases without related-file navigation.

---

## Phase 4: User Story 2 - Navigate Related Artifacts and Sections (Priority: P1)

**Goal**: Discover actual workflow-scoped Markdown, switch files through an Artifacts control, follow safe references, use bounded document history, and preserve per-revision reading position without changing workflow selection.

**Independent Test**: From one selected feature, visit existing primary/supporting/custom/checklist/contract/constitution/command/reference documents, use Back/Forward, revisit unchanged content, and return to the original stage with absent expected files never shown as readable.

### Tests for User Story 2

- [X] T032 [P] [US2] Write failing Wizard discovery, 200-item pagination, cumulative 10,000-entry partial-`200` with `limitReached=true` and no next cursor, expected-file, custom-suffix, command-source, reference, and context-isolation tests in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/artifact-review.test.mjs
- [X] T033 [P] [US2] Write failing SDD discovery, checklist/contract, constitution, custom-suffix, pagination, cumulative 10,000-entry partial-`200` with `limitReached=true` and no next cursor, reference, and feature-isolation tests in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/artifact-review.test.mjs
- [X] T034 [P] [US2] Add failing Wizard Artifacts-selector, safe-link, Back/Forward, per-revision-position, and no-stage-change journeys in scripts/canvas-reader/test/wizard-shell.spec.mjs
- [X] T035 [P] [US2] Add failing SDD Artifacts-selector, safe-link, Back/Forward, per-revision-position, and no-stage-change journeys in scripts/canvas-reader/test/sdd-shell.spec.mjs

### Implementation for User Story 2

- [X] T036 [US2] Derive Wizard primary/supporting/command artifact descriptors from phase targets, extension targets, composition sources, constitution, and bounded feature folders in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/project-scanner/artifact-review.mjs and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/project-scanner.mjs
- [X] T037 [US2] Implement Wizard artifact-list pagination with cumulative inspection counts and terminal partial-`200` limit responses plus revision-checked relative Markdown/fragment routes in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server/artifact-review.mjs and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server.mjs
- [X] T038 [US2] Implement Wizard artifact selection, 50-entry Back/Forward history, revision-scoped position restoration, and reference labeling in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/artifact-review.js and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/styles/artifact-review.css
- [X] T039 [US2] Expose related navigation consistently from Wizard phase, composition, command, and folder callers without changing active stage in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/phase-card.js, plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/composition-artifacts.js, and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/modals.js
- [X] T040 [US2] Derive SDD primary/supporting/constitution/checklist/contract descriptors and bounded direct references without extending the stage enum in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/artifact-review.mjs and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/sdd.mjs
- [X] T041 [US2] Implement SDD artifact-list pagination with cumulative inspection counts and terminal partial-`200` limit responses plus revision-checked relative Markdown/fragment routes in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs
- [X] T042 [US2] Implement SDD artifact selection, 50-entry Back/Forward history, revision-scoped position restoration, and reference labeling in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/ui/artifact-review.js and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/index.html
- [X] T043 [US2] Run related-artifact suites and shell journeys and record complete scoped discovery, absent-file handling, safe references, history restoration, and unchanged workflow selection in specs/001-integrated-markdown-review/evidence/us2-artifact-navigation.md

**Checkpoint**: File navigation is complete and independently testable; table-of-contents depth and accessibility are completed in User Story 3.

---

## Phase 5: User Story 3 - Read Safe and Accessible Markdown (Priority: P1)

**Goal**: Render required Markdown/GFM from one parse, produce collision-safe reader-scoped heading/footnote targets, and provide accessible pointer/keyboard TOC behavior in wide and compact containers.

**Independent Test**: Render the fixed syntax/safety fixture in two simultaneous readers at every required width and 200-percent zoom, then verify correct output, unique targets, inert unsafe content, TOC focus behavior, and contained wide content.

### Tests for User Story 3

- [X] T044 [P] [US3] Write failing one-pass outline tests for ATX/Setext, duplicate, pre-suffixed, empty, punctuation-only, Unicode, code/comment exclusion, and reader namespaces in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/test/markdown-outline.test.ts
- [X] T045 [P] [US3] Write failing Markdown/GFM, footnote, raw-HTML, image-placeholder, URL-policy, task-state, table, list, code, quote, and two-reader tests in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/test/markdown-reader.test.tsx
- [X] T046 [P] [US3] Write failing active-heading, explicit-scroll-root, 25-percent reading-line, container-resize, focus-trap, inert, Escape, destination-focus, and cleanup tests in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/test/markdown-table-of-contents.test.tsx
- [X] T047 [P] [US3] Add failing 360/480/640/820/1,024-pixel, wide-shell, 200-percent-zoom, keyboard, reduced-motion, wide-table/code, and no-network Playwright checks in scripts/canvas-reader/test/reader-accessibility.spec.mjs

### Implementation for User Story 3

- [X] T048 [US3] Implement one-pass outline generation with plain heading text, a fresh stateful slugger, `section` fallback, and reader-scoped heading/footnote IDs in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/markdownOutline.ts
- [X] T049 [US3] Implement safe Markdown/GFM rendering, trusted link components, external-user-action signaling, raw-HTML exclusion, and accessible non-loading image placeholders in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/MarkdownReader.tsx
- [X] T050 [US3] Implement hierarchical wide-sidebar and compact-drawer TOC rendering with distinct artifact/section navigation semantics in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/MarkdownTableOfContents/MarkdownTableOfContents.tsx
- [X] T051 [US3] Implement explicit-scroll-root heading caching, observer/animation-frame cleanup, reading-line selection, scoped lookup, and focused-section navigation in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/useActiveMarkdownHeading.ts
- [X] T052 [US3] Complete mount option validation, state rendering, current-generation rendered events, idempotent unmount, and reader-root test attributes in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/mount.tsx
- [X] T053 [US3] Implement host-tokenized typography, 190-220-pixel wide outline, 820-pixel container layout, compact drawer, contained table/code overflow, focus visibility, and reduced motion in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/reader.css
- [X] T054 [US3] Integrate the reader's Artifacts control, TOC state, revision label, and all defined presentation states without workflow ownership in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/MarkdownReader.tsx
- [X] T055 [US3] Rebuild and verify identical dependency-closed reader assets and notices in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/vendor/markdown-reader/ and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/vendor/markdown-reader/
- [X] T056 [US3] Run reader and accessibility suites and record target uniqueness, no passive requests, keyboard/focus behavior, required widths/zoom, and overflow screenshots in specs/001-integrated-markdown-review/evidence/us3-safe-accessible-reader.md

**Checkpoint**: The common reader is safe, accessible, and independently testable in both host shells.

---

## Phase 6: User Story 4 - See Current and Truthful Artifact State (Priority: P1)

**Goal**: Present exact idle/loading/ready/changed/missing/deleted/unsupported/empty/no-heading/error/disconnected states and ensure new, changed, deleted, or delayed artifacts cannot steal selection or overwrite current context.

**Independent Test**: Against an owned synthetic context, create, modify, atomically replace, delete, disconnect, and delay reads across two same-named features while verifying latest-context wins and every state matches the specification table.

### Tests for User Story 4

- [X] T057 [P] [US4] Write failing tests for all reader base states, orthogonal disconnected notice, stale-content labeling, empty/no-heading behavior, and invalid state/document combinations in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/test/reader-states.test.tsx
- [X] T058 [P] [US4] Write failing Wizard create/change/replace/delete, new-artifact, delayed-response, generation, revision, and no-selection-theft tests in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/artifact-review.test.mjs
- [X] T059 [P] [US4] Write failing SDD create/change/replace/delete, new-artifact, delayed-response, generation, revision, and no-selection-theft tests in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/artifact-review.test.mjs
- [X] T060 [P] [US4] Add failing dual-shell mutation, reconnect, same-filename/different-feature, selected-file deletion, and stale-render-callback journeys in scripts/canvas-reader/test/freshness.spec.mjs

### Implementation for User Story 4

- [X] T061 [US4] Implement exact state-trigger presentation and disconnected overlay behavior in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/MarkdownReader.tsx
- [X] T062 [US4] Implement Wizard request cancellation, context generation, expected-revision refresh, changed-before-current handling, anchor validation, and stable selection in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/artifact-review.js
- [X] T063 [US4] Extend Wizard's existing watcher/signature and SSE payload only with scoped artifact-set/revision invalidations in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/canvas-runtime/watchers.mjs and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server.mjs
- [X] T064 [US4] Implement SDD request cancellation, context generation, expected-revision refresh, changed-before-current handling, anchor validation, and stable selection in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/ui/artifact-review.js
- [X] T065 [US4] Extend SDD's existing state signature, poller, and event payload only with scoped artifact-set/revision invalidations in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/sdd.mjs and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs
- [X] T066 [US4] Run freshness suites and performance measurements, record a 100-KiB render within 1 second, a 5,242,880-byte render within 5 seconds, at least 19 of 20 visible section/artifact responses within 200 milliseconds, zero silent truncations, release-blocking failures, state truthfulness, latest-context behavior, stable selection, and hardware in specs/001-integrated-markdown-review/evidence/us4-freshness-performance.md

**Checkpoint**: Working-tree changes are represented truthfully and stale asynchronous work cannot corrupt the active review.

---

## Phase 7: User Story 5 - Preserve Clarification Workflows (Priority: P1)

**Goal**: Preserve all Wizard queue/apply/rerun/failure/in-flight/discard semantics with artifact/revision isolation while retaining SDD's immediate current-question behavior and stage gates.

**Independent Test**: Use validated prose markers and inert code/comment examples across multiple artifacts, then exercise switching, editing during submission, failure, stale revision, unsafe close, workflow return, and SDD immediate clarification.

### Tests for User Story 5

- [X] T067 [P] [US5] Extend failing Wizard tests for artifact/command/revision/question draft keys, cross-file preservation, automatic flush, edits during flight, failure, stale source, unsafe close/switch, untracked acknowledgement, and Back discard in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/modals.test.mjs
- [X] T068 [P] [US5] Extend failing SDD tests for prose-only marker matching, current index/question/revision validation, immediate submission, supporting-document inertness, constitution/stage/overwrite/task preservation, and no batching in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/sdd.test.mjs and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/artifact-review.test.mjs
- [X] T069 [P] [US5] Write failing trusted clarification-descriptor rendering tests that keep code/comment/unbound markers inert and prevent source-controlled callback properties in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/test/clarifications.test.tsx

### Implementation for User Story 5

- [X] T070 [US5] Implement trusted syntax-tree-to-control clarification presentation matched to current artifact/revision descriptors in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/src/MarkdownReader/MarkdownReader.tsx
- [X] T071 [US5] Extend Wizard draft storage with context/artifact/actual-command/revision/question identity and edit-version transitions without changing dispatch command names in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/phase-runtime.js
- [X] T072 [US5] Integrate Wizard clarification descriptors, cross-artifact draft restoration, source revalidation, apply/rerun, automatic flush, failure recovery, and stale recovery in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/artifact-review.js and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/modals.js
- [X] T073 [US5] Enforce Wizard in-flight close/context blocking and completion ownership so one submission cannot close or update another artifact in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/modals.js and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/phase-runtime.js
- [X] T074 [US5] Map only current SDD spec question descriptors into the reader and keep supporting artifacts inert in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/ui/artifact-review.js and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/index.html
- [X] T075 [US5] Revalidate SDD feature, source revision, clarification index, and exact question before the existing immediate `session.send` path in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/artifact-review.mjs and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs
- [X] T076 [US5] Run Wizard and SDD clarification suites and record batching isolation, stale blocking, failure/in-flight behavior, discard semantics, SDD immediacy, and unchanged gates in specs/001-integrated-markdown-review/evidence/us5-clarifications.md

**Checkpoint**: Existing clarification behavior is preserved and multi-artifact review cannot misapply answers.

---

## Phase 8: User Story 6 - Keep Review Read-Only and Workspace-Bounded (Priority: P1)

**Goal**: Reject unauthorized paths, content, identities, and cross-instance requests; preserve existing loopback protections; and prove ordinary reading has no network, model, setup, install, command, Git, or write side effects.

**Independent Test**: Run the complete malicious-content, unsafe-path, auth, cross-context, replacement, and side-effect corpus on Windows and record every skipped platform case as a release-blocking gap or explicitly narrowed claim.

### Tests for User Story 6

- [X] T077 [P] [US6] Add failing Windows traversal, encoded traversal, absolute, drive-relative, UNC, device, ADS, control-character, `.git`, directory, special-file, symlink, junction, reparse, cap-boundary, encoding, NUL, and race tests in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/artifact-read.test.mjs
- [X] T078 [P] [US6] Add failing Wizard and SDD missing/wrong capability, Host, Origin, context, generation, cursor, body-size, static-asset, and cross-instance route tests in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/server-integration.test.mjs and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/artifact-review.test.mjs
- [X] T079 [P] [US6] Add failing unsafe scheme, protocol-relative URL, raw HTML, remote/local image, instruction-like source, and zero-passive-request tests in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/test/content-security.test.tsx
- [X] T080 [P] [US6] Add failing packaged-preview assertions for zero npm/Specify/Git/shell/setup/model/write calls and redacted diagnostics in scripts/canvas-reader/test/package-security.test.mjs

### Implementation for User Story 6

- [X] T081 [US6] Complete path syntax, one-time decode, `.git`, lexical/canonical containment, regular-file, symlink/junction/reparse, and platform-gap handling in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server/artifact-read.mjs
- [X] T082 [US6] Complete bounded-handle reads, before/after identity checks, exact cap, strict UTF-8/BOM/NUL handling, stable errors, and exact-byte revision hashing in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server/artifact-read.mjs
- [X] T083 [US6] Apply membership revalidation, body bounds, typed redacted errors, no-store/no-referrer/nosniff headers, and existing capability/Host/Origin guards to all Wizard review routes/assets in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server/artifact-review.mjs and plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/server.mjs
- [X] T084 [US6] Apply the packaged read helper, membership revalidation, body bounds, typed redacted errors, security headers, and existing capability/Host/Origin guards to all SDD review routes/assets in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/vendor/artifact-read.mjs, plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/artifact-review.mjs, and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/extension.mjs
- [X] T085 [US6] Remove document bodies, capabilities, absolute paths, credentials, OAuth fragments, private fixture data, and clarification answers from browser/server diagnostics in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/artifact-review.js and plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/ui/artifact-review.js
- [X] T086 [US6] Run the Windows security and no-side-effect matrix and record passes, platform gaps, narrowed claims, and the same-user filesystem threat-model boundary in specs/001-integrated-markdown-review/evidence/us6-security.md

**Checkpoint**: Every read and navigation path is workspace-bounded and read-only, with no unsupported security claim.

---

## Phase 9: User Story 7 - Adopt and Recover the Maintained Fork (Priority: P2)

**Goal**: Produce independently installable Wizard and SDD fork payloads with identifiable source/version/hashes, prove real App journeys, and demonstrate deliberate update plus known-good rollback without altering unrelated state.

**Independent Test**: In an approved isolated scope, validate Wizard alone and SDD alone, verify one intended provider per canvas, complete both real App journeys, meet usability thresholds, update deliberately, and restore both known-good versions twice within the required time.

### Tests for User Story 7

- [X] T087 [P] [US7] Extend failing package-verification tests for independent empty-root payloads, import closure, identical reader hashes, notices, concurrent instances, forbidden files, and sibling-checkout denial in scripts/canvas-reader/test/sync-assets.test.mjs
- [X] T088 [P] [US7] Add failing release-metadata tests for independent plugin versions, manifest/marketplace/README agreement, unchanged unrelated versions, upstream/fork provenance, one-provider evidence, approvals, and rollback fields in scripts/canvas-reader/test/release-metadata.test.mjs

### Implementation and Validation for User Story 7

- [X] T089 [US7] Complete deterministic payload staging, independent handler/static tests, hash verification, notice checks, and source-path/import closure in scripts/canvas-reader/stage-app-fixture.mjs and scripts/canvas-reader/sync-assets.mjs
- [X] T090 [US7] Complete the focused CI sequence for reader typecheck/lint/build/tests, Wizard/SDD suites, asset verification, browser shells, Windows coverage, and release metadata in .github/workflows/canvas-reader-validation.yml
- [X] T091 [US7] Stage Wizard and SDD separately in empty owned roots and record independent operation, concurrent-instance isolation, complete assets, no sibling access, and zero preview-time side effects in specs/001-integrated-markdown-review/evidence/independent-payloads.md
- [ ] T092 [US7] Resolve and record fork owner, repository, visibility, intended users, support owner, publication authority, installation scope, and source-reuse approval or independently-authored decision in specs/001-integrated-markdown-review/evidence/implementation-gates.md
- [ ] T093 [US7] After T092 approval, choose and update the Wizard fork version in plugins/spec-kit-copilot-wizard/plugin.json, .github/plugin/marketplace.json, and README.md without changing unrelated plugin versions
- [ ] T094 [US7] After T092 approval, choose and update the SDD fork version in plugins/spec-kit-copilot-sdd/plugin.json, .github/plugin/marketplace.json, and README.md without changing unrelated plugin versions
- [ ] T095 [US7] With approved App loading and an owned fixture, complete the real Wizard and SDD feature-to-artifact-to-related-files/TOC-to-same-stage journeys and record host versions, source/hashes, provider counts, revisions, screenshots, and status in specs/001-integrated-markdown-review/evidence/real-app-acceptance.md
- [ ] T096 [US7] With separate live-action approval, run one stage-output create/update refresh and record it distinctly from simulated writes, or record `not run - approval absent` without claiming FR-059 in specs/001-integrated-markdown-review/evidence/live-stage-output.md
- [ ] T097 [US7] Run the standardized uncoached study with at least 10 representative participants and record anonymous evidence that at least 9 reach the named section within 30 seconds and at least 9 rate artifact navigation, section navigation, and workflow return 4 of 5 or better in specs/001-integrated-markdown-review/evidence/usability-study.md
- [ ] T098 [US7] With installation approval, rehearse deliberate update and known-good rollback twice, verify exact installed source/version/hashes and one provider per canvas, finish within 30 minutes total, and record unchanged unrelated state in specs/001-integrated-markdown-review/evidence/update-rollback.md
- [ ] T099 [US7] Assemble the fork owner/support, upstream base, fork revision, host baseline, plugin versions, payload/asset hashes, notices, approvals, evidence links, provider counts, and rollback targets in specs/001-integrated-markdown-review/evidence/fork-release-record.json
- [ ] T100 [US7] Run release-metadata and publication-gate validation and record every required check as pass/fail/platform-gap with disposition in specs/001-integrated-markdown-review/evidence/us7-release-readiness.md
- [ ] T101 [US7] After fork-owner publication approval and all required gates pass, publish the two enhanced existing-plugin payloads through the approved fork source and append the release/source/install verification to specs/001-integrated-markdown-review/evidence/fork-release-record.json
- [ ] T102 [US7] Verify the published fork build installs with one intended provider per canvas, completes both core App journeys, and restores the known-good versions without changing official plugins or project artifacts, then record the result in specs/001-integrated-markdown-review/evidence/post-release-verification.md

**Checkpoint**: The approved fork release is identifiable, independently installable, validated in both existing canvases, and recoverable. Upstream contribution remains outside this task list.

---

## Phase 10: Polish and Cross-Cutting Concerns

**Purpose**: Complete documentation, traceability, preservation, and the full feature validation without expanding into deferred canvases or optional upstream work.

- [ ] T103 [P] Document Wizard review behavior, safe-link/image policy, no-runtime-install boundary, troubleshooting, and fork support ownership in plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/README.md
- [ ] T104 [P] Document SDD review behavior, distinct clarification semantics, asset packaging, troubleshooting, and fork support ownership in plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/README.md
- [ ] T105 [P] Document the shared threat model, working-tree revision meaning, measured limits, known gaps, and maintenance/update procedure in docs/integrated-markdown-artifact-review.md
- [ ] T106 Re-execute every applicable command and procedure in specs/001-integrated-markdown-review/quickstart.md as a final integrated replay, reference prior evidence without overwriting it, and record only final commands, environment, timing, screenshots, gaps, and changed outcomes in specs/001-integrated-markdown-review/evidence/final-validation.md
- [ ] T107 Audit that no standalone plugin/canvas, root npm workspace, runtime reader install, Assessment/Bug Fix version change, upstream PR dependency, original EzPzSpec change, handoff-helper change, or secret/private artifact entered the release in specs/001-integrated-markdown-review/evidence/preservation-audit.md
- [ ] T108 Map FR-001 through FR-062 and SC-001 through SC-014 to passing task/evidence IDs, identify any blocked approval gate without marking it complete, and record final core-release disposition in specs/001-integrated-markdown-review/evidence/requirements-traceability.md

**Final Checkpoint**: All selected core-release stories are complete, independently evidenced, and consistent with the approved fork scope. Assessment/Bug Fix integration and optional upstream contribution require separate future planning.

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 - Setup**: No dependencies; starts immediately.
- **Phase 2 - Foundational**: Depends on Phase 1. T016 is the mandatory real-host stop gate; only T009-T015 may precede it, and T017-T021 plus all story work require it to pass.
- **Phase 3 - US1**: Depends on Phase 2 and delivers the MVP vertical slice in both existing canvases.
- **Phase 4 - US2**: Depends on the US1 adapters and context route from Phase 3.
- **Phase 5 - US3**: Depends on the foundational mount/build boundary; its reader implementation can proceed in parallel with US1/US2 after T016 and the post-gate foundation, then integrate through their adapters.
- **Phase 6 - US4**: Depends on US1 document loading and US2 artifact discovery/history.
- **Phase 7 - US5**: Depends on US1 integration, US2 multi-artifact context, and US3 trusted reader components.
- **Phase 8 - US6**: Depends only on the post-gate read/context primitives and can proceed in parallel with UI-focused stories after T021; all security checks must pass before release.
- **Phase 9 - US7**: Depends on US1-US6 and every named approval required for the operation being performed.
- **Phase 10 - Polish**: Depends on all stories selected for the core fork release.

### User Story Dependencies

- **US1 (P1)**: First independently testable product increment after the foundation; no dependency on another story.
- **US2 (P1)**: Extends US1's adapters but is independently testable as a multi-document navigation journey.
- **US3 (P1)**: Uses only the foundational mount boundary for component tests and joins US1/US2 for shell acceptance.
- **US4 (P1)**: Uses US1 loading and US2 discovery/history to test truthful live changes.
- **US5 (P1)**: Uses the US3 trusted component boundary and US2 artifact identity to preserve clarification behavior.
- **US6 (P1)**: Hardens the shared foundation independently of UI story order; release depends on its complete matrix.
- **US7 (P2)**: Packages and releases only after all six P1 stories pass and external approvals are recorded.

### Within Each User Story

- Add the story's tests first and verify the intended failures.
- Implement server/domain ownership before browser adapters that consume it.
- Rebuild and synchronize generated assets after canonical reader changes.
- Run focused tests before the story evidence task.
- Do not mark an approval-dependent task complete when approval is absent; record the blocked state instead.

---

## Parallel Opportunities

### Setup and Foundation

- T003-T006 can proceed in parallel after T002 defines the package boundary.
- T009 and T010 can proceed in parallel; T011 starts only after both tasks record their intended failing results.
- T017 and T018 can proceed in parallel after T016 passes; T019 follows T017 and T020 follows T018.

### User Story 1

```text
T022 Wizard primary-review tests
T023 SDD primary-review tests
T024 Wizard shell journey
T025 SDD shell journey
```

### User Story 2

```text
T032 Wizard discovery tests
T033 SDD discovery tests
T034 Wizard navigation journey
T035 SDD navigation journey
```

### User Story 3

```text
T044 Outline tests
T045 Markdown renderer tests
T046 TOC/focus tests
T047 Responsive browser checks
```

### User Story 4

```text
T057 Reader-state tests
T058 Wizard freshness tests
T059 SDD freshness tests
T060 Dual-shell mutation journey
```

### User Story 5

```text
T067 Wizard clarification tests
T068 SDD clarification tests
T069 Trusted-control rendering tests
```

### User Story 6

```text
T077 Windows filesystem tests
T078 Route authorization tests
T079 Content safety tests
T080 Packaged no-side-effect tests
```

### User Story 7

```text
T087 Independent payload tests
T088 Release metadata tests
```

### Polish

```text
T103 Wizard documentation
T104 SDD documentation
T105 Security and maintenance documentation
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 setup without assuming approvals.
2. Complete Phase 2 and pass the mandatory early host gate in both existing canvases.
3. Complete Phase 3 (US1) for primary in-context review and return behavior in Wizard and SDD.
4. Stop and validate [us1-primary-review.md](evidence/us1-primary-review.md) before adding related navigation.

### Incremental Delivery

1. **MVP**: US1 proves the two existing preview surfaces and workflow return.
2. **Navigation**: US2 adds actual related artifacts, references, and bounded history.
3. **Reader quality**: US3 completes safe Markdown/GFM, TOC, responsive layout, and accessibility.
4. **Truthful updates**: US4 adds explicit states, refresh, revisions, and stale suppression.
5. **Workflow parity**: US5 preserves Wizard and SDD clarification semantics.
6. **Security completion**: US6 closes the full Windows/auth/content/no-side-effect matrix.
7. **Fork adoption**: US7 packages, validates, versions, releases, and rehearses rollback only under recorded approvals.

### Parallel Team Strategy

After T016 and the post-gate foundation pass:

- **Reader track**: US3 canonical reader and accessibility.
- **Wizard track**: US1 then US2 Wizard adapter/domain work.
- **SDD track**: US1 then US2 SDD adapter/domain work.
- **Security track**: US6 shared read/auth fixtures and hardening.

Merge at US4 freshness integration, then complete US5 clarification parity and US7 release work.

## Notes

- `[P]` means same-phase parallelism only; tasks touching a shared file are intentionally sequential.
- Generated reader assets are committed package payloads, but canonical handwritten reader source exists only under the Wizard UI.
- Wizard and SDD clarification state must never be unified: Wizard batches drafts; SDD submits one revalidated answer immediately.
- External approvals are deliverable gates, not facts that implementation can manufacture.
- Do not add tasks for Assessment/Bug Fix integration or an upstream proposal to this core task list.
