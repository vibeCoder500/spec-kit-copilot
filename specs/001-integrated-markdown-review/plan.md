# Implementation Plan: Integrated Markdown Artifact Review in Spec Kit Canvases

**Branch**: `main` (no feature branch created) | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-integrated-markdown-review/spec.md`

**Planning baseline**: Upstream `github/spec-kit-copilot` commit `96ed37d9134c63d6cb05236879a8e1dcea010e3f`, reconciled with the current local checkout without resetting later changes.

## Summary

Enhance the existing Spec Kit Wizard and Spec-Driven Development (SDD) artifact previews with one safe, accessible Markdown/GFM reader, related-artifact navigation, a hierarchical table of contents, revision-aware refresh, and preserved workflow context. The Wizard owns the canonical TypeScript/React reader source and build-only dependencies; deterministic generated JavaScript/CSS and notices are copied into both existing plugin payloads. Each canvas keeps its current identity, loopback server, lifecycle, workflow actions, and clarification semantics. Canvas-specific adapters derive authorized artifact context, call additive review routes on the existing server, mount the shared browser bundle, and restore the originating workflow state.

Delivery is through an approved independently maintained fork. Fork ownership, redistribution rights, App loading/isolation, installation, live workflow actions, and publication remain approval gates. The implementation does not add a canvas, plugin, server, model action, preset, root npm workspace, runtime renderer installation, or EzPzSpec application change.

## Technical Context

**Language/Version**: Existing extension and server code remains JavaScript ES modules on the observed Node.js 24.19.0 development baseline; the new browser reader uses TypeScript 5.x and React/React DOM 19.1.1 and emits browser ESM.

**Primary Dependencies**: Build-only reader dependencies are `react-markdown` 10.1.0, `remark-gfm` 4.0.1, `mdast-util-to-string` 4.0.0, `unist-util-visit` 5.0.0, `github-slugger` 2.0.0, `lucide-react` 1.32.0, and Vite 8.0.16. The Vite security patch from 8.0.10 was explicitly approved during T002 after the dependency audit. Exact direct and transitive versions are locked in the reader package. The Wizard's existing `js-yaml` 5.2.3 runtime dependency and host-supplied `@github/copilot-sdk/extension` remain unchanged; neither enters the browser bundle.

**Storage**: Existing authorized working-tree files are read-only source data. Review context, bounded document history, revisions, and clarification presentation state are held in memory per canvas instance. Existing Wizard persistence and SDD workflow files remain unchanged; no new durable store, browser local storage, or document cache is introduced.

**Testing**: Existing `node:test` suites for Wizard and SDD; scoped TypeScript typecheck and lint; reader unit/component fixtures; Playwright journeys through the actual Wizard and SDD UI shells with synthetic services; independent staged-payload checks; Windows path/junction coverage; and separately approved real GitHub Copilot App acceptance.

**Target Platform**: Existing GitHub Copilot App Wizard and SDD canvases using their host-provided SDK, extension-owned Node loopback server, and embedded browser view. Automated browser checks cover 360, 480, 640, 820, and 1,024 pixel reader widths plus 200-percent zoom. Windows is mandatory for platform-specific filesystem acceptance; portable behavior remains cross-platform.

**Project Type**: Two independently versioned Copilot App canvas plugins with Node server adapters and embedded browser UIs, sharing build output but not runtime imports.

**Performance Goals**: A representative 100 KiB document is readable within 1 second after receipt; a 5,242,880-byte document within 5 seconds; at least 19 of 20 section or artifact interactions at the limit visibly respond within 200 milliseconds. Failure blocks release rather than reducing the supported limit. Discovery returns at most 200 descriptors per page and inspects at most 10,000 entries per pass.

**Constraints**: Preserve existing plugin/canvas identities, action contracts, server lifecycles, loopback capability/Host/Origin checks, and legacy route response shapes. Raw HTML, image requests, arbitrary paths, unsafe schemes, runtime dependency installation, model submission, and workflow mutation are forbidden during review. Reads are strict UTF-8 with optional BOM and an exact 5,242,880-byte hard cap; every read revalidates membership and path safety. Generated assets must be dependency-closed, independently packaged, reproducible or hash-verifiable, and free of source maps containing local paths.

**Scale/Scope**: Core release changes two existing plugins and one canonical reader package. It covers feature/project contexts, primary and supporting Markdown, direct safe references, bounded per-document history, and concurrent canvas instances. Assessment and Bug Fix adapters are a later tranche; general repository browsing, editing, remote providers, diagrams, math, highlighting, and local images are excluded.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository constitution remains an unratified placeholder and therefore defines no enforceable project principles. The pre-design gate applies the accepted specification and repository maintainer guidance instead.

| Gate | Pre-design result | Evidence |
| --- | --- | --- |
| Preserve Copilot integration boundaries | PASS | Changes stay inside the existing Wizard and SDD plugins; no core skill, integration-management skill, preset, bundle, or standalone reader plugin is introduced. |
| Preserve existing canvas ownership | PASS | Each current server, lifecycle, canvas ID, preview entry point, and workflow action remains authoritative; the design adds adapters and review routes only. |
| Keep independently versioned payloads | PASS | Wizard and SDD receive their own version and marketplace/README updates only when they ship; unrelated plugins and marketplace metadata are not forced to match. |
| Avoid runtime coupling and setup side effects | PASS | One build source emits complete assets into each plugin. Preview opening does not install packages, initialize Spec Kit, start another server, or call the model. |
| Protect workspace and untrusted content | PASS | Membership-aware bounded reads, strict UTF-8, safe-link policy, disabled raw HTML/images, scoped DOM IDs, and existing local authorization are mandatory. |
| Preserve workflow-specific behavior | PASS | Wizard batching remains Wizard-owned; SDD keeps immediate single-question validation. Reading never advances either workflow. |
| Keep approvals explicit | PASS FOR PLANNING | Fork ownership, source reuse, host isolation, installation, live stage execution, and publication are stop gates, not inferred approvals. |

**Post-design re-check**: PASS.

- [data-model.md](data-model.md) keeps all review/history/draft state bounded and in memory, separates workflow authority from browser presentation, and defines revision-aware stale suppression.
- [artifact-review-http.md](contracts/artifact-review-http.md) is additive, preserves legacy routes, reuses existing local authorization, and forbids model/setup/write side effects.
- [markdown-reader-mount.md](contracts/markdown-reader-mount.md) keeps one presentation-only bundle with explicit mount/update/unmount and canvas-owned workflow semantics.
- [release-evidence.md](contracts/release-evidence.md) preserves independent plugin versions, package boundaries, one-provider isolation, approvals, provenance, and rollback.
- [quickstart.md](quickstart.md) requires both existing-shell and real-App journeys, independent package checks, Windows security coverage, and unchanged original repositories.

No design artifact introduces a constitution or maintainer-guidance violation. External approvals remain stop gates and do not block completion of planning; they block the corresponding implementation, installation, live-action, or publication step.

## Project Structure

### Documentation (this feature)

```text
specs/001-integrated-markdown-review/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   ├── artifact-review-http.md
│   ├── markdown-reader-mount.md
│   └── release-evidence.md
├── evidence/
│   ├── README.md
│   ├── red/T###.md
│   ├── implementation-gates.md
│   ├── setup-baseline.md
│   ├── early-two-canvas-gate.md
│   ├── foundation-validation.md
│   ├── us1-primary-review.md
│   ├── us2-artifact-navigation.md
│   ├── us3-safe-accessible-reader.md
│   ├── us4-freshness-performance.md
│   ├── us5-clarifications.md
│   ├── us6-security.md
│   ├── independent-payloads.md
│   ├── real-app-acceptance.md
│   ├── live-stage-output.md
│   ├── usability-study.md
│   ├── update-rollback.md
│   ├── fork-release-record.json
│   ├── us7-release-readiness.md
│   ├── post-release-verification.md
│   ├── final-validation.md
│   ├── preservation-audit.md
│   └── requirements-traceability.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
plugins/
├── spec-kit-copilot-wizard/
│   ├── plugin.json
│   └── extensions/speckit-wizard-canvas/
│       ├── README.md
│       ├── extension.mjs
│       ├── server.mjs
│       ├── canvas-runtime/
│       │   └── watchers.mjs
│       ├── server/
│       │   ├── artifact-read.mjs
│       │   └── artifact-review.mjs
│       ├── project-scanner/
│       │   └── artifact-review.mjs
│       ├── ui/
│       │   ├── modals.js
│       │   ├── phase-card.js
│       │   ├── composition-artifacts.js
│       │   ├── phase-runtime.js
│       │   ├── artifact-review.js
│       │   ├── styles/
│       │   │   └── artifact-review.css
│       │   ├── markdown-reader/
│       │   │   ├── package.json
│       │   │   ├── package-lock.json
│       │   │   ├── tsconfig.json
│       │   │   ├── vite.config.ts
│       │   │   ├── src/
│       │   │   │   ├── mount.tsx
│       │   │   │   ├── types.ts
│       │   │   │   └── MarkdownReader/
│       │   │   │       ├── MarkdownReader.tsx
│       │   │   │       ├── markdownOutline.ts
│       │   │   │       ├── useActiveMarkdownHeading.ts
│       │   │   │       ├── MarkdownTableOfContents/
│       │   │   │       │   └── MarkdownTableOfContents.tsx
│       │   │   │       └── reader.css
│       │   │   └── test/
│       │   │       ├── mount.test.tsx
│       │   │       ├── markdown-outline.test.ts
│       │   │       ├── markdown-reader.test.tsx
│       │   │       ├── markdown-table-of-contents.test.tsx
│       │   │       ├── reader-states.test.tsx
│       │   │       ├── clarifications.test.tsx
│       │   │       └── content-security.test.tsx
│       │   └── vendor/markdown-reader/
│       │       ├── markdown-reader.js
│       │       ├── markdown-reader.css
│       │       ├── manifest.json
│       │       └── THIRD_PARTY_NOTICES.txt
│       └── test/
│           ├── artifact-read.test.mjs
│           ├── artifact-review-context.test.mjs
│           ├── artifact-review.test.mjs
│           ├── modals.test.mjs
│           ├── server-integration.test.mjs
│           └── state-and-scanner.test.mjs
└── spec-kit-copilot-sdd/
    ├── plugin.json
    └── extensions/sdd-canvas/
    ├── README.md
        ├── extension.mjs
        ├── sdd.mjs
        ├── index.html
        ├── artifact-review.mjs
        ├── vendor/
        │   ├── artifact-read.mjs
        │   └── markdown-reader/
        │       ├── markdown-reader.js
        │       ├── markdown-reader.css
        │       ├── manifest.json
        │       └── THIRD_PARTY_NOTICES.txt
        ├── ui/artifact-review.js
        └── tests/
            ├── artifact-review.test.mjs
            └── sdd.test.mjs

scripts/canvas-reader/
├── sync-assets.mjs
├── stage-app-fixture.mjs
├── serve-fixture.mjs
├── fixtures/                  # Owned synthetic workspace/session data
└── test/
    ├── sync-assets.test.mjs
    ├── wizard-shell.spec.mjs
    ├── sdd-shell.spec.mjs
    ├── reader-accessibility.spec.mjs
    ├── freshness.spec.mjs
    ├── package-security.test.mjs
    └── release-metadata.test.mjs

.github/workflows/
└── canvas-reader-validation.yml

.github/plugin/
└── marketplace.json

docs/
└── integrated-markdown-artifact-review.md

README.md
```

**Structure Decision**: Keep the canonical reader source and its isolated lockfile under the Wizard UI, the first and richest consumer. Build once and copy only named generated outputs, hashes, and notices into allowlisted Wizard and SDD destinations. Canvas-specific discovery, workflow context, clarification behavior, and server routing remain in each plugin. A small repository script coordinates asset synchronization and staged-package/browser validation without creating a root npm workspace or runtime sibling imports.

## Architecture

### Runtime Boundaries

1. The existing canvas extension resolves the authoritative workspace and starts its existing authenticated loopback server.
2. The canvas-specific artifact adapter creates a server-validated review context from current scanner or workflow state; browser-supplied paths never establish authority.
3. Additive review routes list descriptors, read one bounded document with a content revision, and resolve one direct relative Markdown link. Legacy artifact routes and response shapes remain intact.
4. The browser adapter owns context selection, request cancellation, stale-generation suppression, document history, return focus/scroll, and workflow-specific clarification callbacks.
5. The generated reader owns only Markdown parsing/rendering, one-pass outline extraction, reader-scoped IDs, active-heading behavior, responsive TOC presentation, and mount/update/unmount lifecycle.
6. Existing SSE streams invalidate scoped metadata. They do not carry document bodies, select another artifact, or authorize reads.

### Security Model

- Treat Markdown, filenames, metadata, links, and browser inputs as untrusted.
- Resolve membership server-side on every operation, then validate suffix, lexical containment, canonical containment, ordinary-file type, no `.git` component, and no symbolic-link/junction/reparse escape before a bounded handle read.
- Enforce the 5 MiB cap during the read, decode UTF-8 strictly, reject NUL/binary data, compare identity/metadata around the read, and hash the exact bytes for the working-tree revision.
- Reuse each server's capability, Host, Origin, body-limit, no-store, no-referrer, and nosniff protections for routes and static assets. Add no CORS wildcard, proxy, bearer value in content IDs, or second port.
- Keep `react-markdown` raw HTML disabled, retain its safe default URL transform as a baseline, and apply a stricter product link policy through trusted components. Replace every image with an accessible placeholder and never auto-fetch external content.
- Namespace headings and footnotes by reader instance. Use reader-scoped lookups and an explicit scroll root; never use document-global heading resolution.
- The filesystem design protects against hostile content, unsafe paths, accidental cross-context access, and ordinary replacement races. It does not claim an operating-system sandbox against malicious same-user code racing filesystem operations.

## Delivery Sequence

### Gate 0 - Ownership and Two-Canvas Host Probe

- Record current checkout/base, preserve existing remotes and changes, and obtain decisions for fork owner, destination, visibility, support, and EzPz source reuse before any publication.
- Verify the effective App workspace as a prerequisite, then build the smallest dependency-closed reader probe and load it through the actual existing Wizard and SDD artifact views in an approved isolated App scope.
- For both canvases, record the six gate conditions: packaged artifact-view loading, invalid-access denial, intended source identity, exactly one provider, return context, and unchanged repository status. Stop broad implementation if either canvas or single-provider isolation fails.

### Phase 1 - Canonical Reader

- Establish the Wizard-owned build package, pinned lockfile, mount/update/unmount contract, and deterministic asset manifest.
- Port only the EzPz presentation slice when redistribution is approved; otherwise implement the same documented behavior independently.
- Generate the outline in the rendering parse, use a fresh stateful slugger per document, namespace heading/footnote DOM IDs, and support safe Markdown/GFM without raw HTML or image requests.
- Implement explicit scroll-root active-heading behavior, container-measured wide/compact layout, drawer focus/inert rules, and scoped cleanup.

### Phase 2 - Secure Artifact Domain

- Add the shared dependency-free bounded read helper and canvas-owned context/discovery adapters.
- Implement additive list/content/link contracts, typed stable errors, revision checks, lazy discovery, current-context revalidation, and partial `200` discovery responses with `limitReached=true` when the 10,000-entry inspection cap is reached.
- Extend existing watched metadata only enough to invalidate the selected context and discover new supporting artifacts; retain one poll/watch path per canvas.

### Phase 3 - Wizard Integration

- Route `openArtifactViewer`, `openCommandViewer`, folder selections, phase cards, and composition sources through one artifact-review adapter while preserving existing non-Markdown/catalog previews.
- Add related-artifact selection, document Back/Forward, per-revision reading position, loading/change/error states, request cancellation, Back-to-workflow focus/scroll restoration, and explicit unmount before container replacement.
- Replace clarification HTML placeholders with trusted node-to-control rendering. Key drafts by context/artifact/command/revision/question while preserving the actual dispatch command and all current queue/apply/rerun/failure/in-flight/discard behavior.
- Remove the handwritten Markdown path only after every caller and regression test has migrated.

### Phase 4 - SDD Integration

- Serve allowlisted reader assets through the existing SDD capability gate and mount them at the current artifact view.
- Add SDD-owned feature/artifact context, supporting-document discovery, document history, refresh states, and return focus without changing the SDD stage enum.
- Preserve constitution/feature/task state, overwrite gates, current-question matching, and immediate one-question clarification; do not import Wizard batching or runtime modules.
- Retain all legacy `feature`/`stage` artifact and clarification contracts.

### Phase 5 - Package and Browser Validation

- Build once, copy named assets into both payloads, generate notices and source/build hashes, and fail verification on stale or missing copies, unresolved browser imports, local source paths, source maps, credentials, or unintended dependencies.
- Run existing Node suites, reader typecheck/lint/tests, service/security fixtures, and Playwright journeys in the actual Wizard and SDD shells at every required width and zoom.
- Stage each plugin in an otherwise empty temporary root and verify independent operation, no sibling checkout access, no preview-time install/setup/model call, and concurrent instance isolation.

### Phase 6 - Real App Acceptance and Fork Release

- Use an owned disposable EzPzSpec worktree or already authorized alternative. Verify effective App workspace before staging anything and preserve original repositories and the installed handoff helper.
- Independently choose and apply the Wizard and SDD release-candidate versions before final acceptance so every result identifies the exact candidate under test.
- Complete feature to artifact to related files/TOC to same-stage journeys in both existing canvases. Record revisions, screenshots, return state, host versions, redacted failures, and before/after status.
- Run one standardized, uncoached acceptance study with at least 10 representative participants. Require at least 9 to open an artifact and reach a named section within 30 seconds and at least 9 to rate artifact navigation, section navigation, and workflow return at least 4 out of 5.
- Run a live stage-output refresh only under separate approval and record it separately from simulated writes.
- Verify installation source and one provider per canvas, rehearse deliberate update and known-good rollback twice, then publish only with fork-owner and reuse approval.

## Approval and Stop Gates

| Gate | Required before | Stop condition |
| --- | --- | --- |
| Fork owner, destination, visibility, and support owner | Hosted remote, push, or release metadata | Any field is unapproved or destination access is unverified. |
| EzPz source redistribution | Copying implementation or adapted CSS into a distributable payload | No explicit owner authorization; use an independently authored implementation instead. |
| App development loading and identity isolation | Gate 0 host probe | The host cannot load both modified existing canvases in an isolated scope with one intended provider each. |
| Dependency and license review | Installing reader dependencies or publishing generated assets | Lockfile, lifecycle scripts, or bundled notices are unreviewed. |
| Disposable fixture ownership | Real App artifact test | Effective workspace or fixture ownership is unknown. |
| Live workflow execution | Stage-generated refresh test | Explicit action approval is absent; retain synthetic evidence only. |
| Fork installation and publication | Release rehearsal and rollout | Source pinning, installed revision, provider count, or known-good restore cannot be verified. |

No constitution violation or design exception requires complexity justification. The shared reader exists because two mandatory consumers need identical rendering behavior; all workflow and authorization behavior remains local to its owning plugin.

## Planning Execution Note

The required agent-context update was checked after Phase 1. This Spec Kit 0.12.0 skills-mode initialization contains no `update-agent-context` script or equivalent under `.specify/`; only `check-prerequisites.ps1`, `common.ps1`, `create-new-feature.ps1`, `setup-plan.ps1`, and `setup-tasks.ps1` are generated. No replacement script was invented and the repository's hand-maintained `AGENTS.md` was left unchanged. The implementation agent must read this plan, the specification, and `AGENTS.md` directly.
