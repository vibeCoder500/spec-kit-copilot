# Research: Integrated Markdown Artifact Review in Spec Kit Canvases

**Date**: 2026-09-09  
**Specification**: [spec.md](spec.md)  
**Upstream evidence baseline**: `96ed37d9134c63d6cb05236879a8e1dcea010e3f`

## Research Outcome

All technical choices needed for Phase 1 design are resolved. Fork ownership, redistribution permission, host loading/isolation, installation, live workflow execution, and publication remain explicit approval gates rather than technical unknowns. No `NEEDS CLARIFICATION` items remain.

## 1. Existing Canvas Ownership

**Decision**: Integrate review through the existing Wizard and SDD canvas identities, preview entry points, loopback servers, SSE streams, and lifecycle callbacks. Add no canvas, extension server, model action, or independent workflow store.

**Rationale**: Wizard already owns artifact opening through `ui/modals.js::openArtifactViewer` and `openCommandViewer`, while SDD owns it through `index.html::viewArtifact`, `openArtifactView`, and `initializeArtifactView`. Both servers already know the authoritative workspace and enforce instance-local access. Ordinary browser navigation requires no model mediation.

**Alternatives considered**:

- A standalone Markdown canvas: rejected because it loses workflow context and violates the core product boundary.
- A new reader HTTP server: rejected because it duplicates lifecycle, authorization, workspace identity, polling, and cleanup.
- New canvas actions for list/open/state: rejected because browser-local review needs no agent turn and existing actions must remain stable.

## 2. Canonical Reader Ownership and Distribution

**Decision**: Keep one canonical TypeScript/React reader build package under the Wizard UI. Build it once and copy only dependency-closed ESM, CSS, a generated manifest, and third-party notices into allowlisted locations in Wizard and SDD. Do not create a root npm workspace or runtime imports between plugins.

**Rationale**: Wizard is the richer first consumer and already has the repository's only package/lockfile boundary. SDD must remain independently installable. Generated duplication inside two installable payloads is acceptable; duplicated handwritten reader source is not.

**Alternatives considered**:

- Root monorepo/workspace: rejected because the repository has no such convention and it broadens unrelated build ownership.
- Runtime import from Wizard into SDD: rejected because independently installed plugins cannot rely on sibling payloads.
- Public npm reader package: rejected as unnecessary release and maintenance surface.
- Two handwritten readers: rejected because behavior and security would drift.

## 3. Rendering Stack and Content Safety

**Decision**: Use React/React DOM 19.1.1, `react-markdown` 10.1.0, `remark-gfm` 4.0.1, one trusted outline-producing remark transform, `mdast-util-to-string` 4.0.0, `unist-util-visit` 5.0.0, and custom trusted components for links, images, headings, footnotes, and Wizard clarification controls. Keep raw HTML disabled, retain `defaultUrlTransform` as a baseline, and apply the stricter product URL policy before navigation.

**Rationale**: Current `react-markdown` documentation states that default rendering is safe, raw HTML is skipped unless explicitly enabled, GFM is supplied through a remark plugin, and custom components can enforce element-specific behavior. It also warns that unsafe URL transforms or plugins can reintroduce cross-site scripting. The selected stack reuses the proven EzPz presentation boundary without importing its application architecture.

**Alternatives considered**:

- Keep the current regex renderers and add a second heading scan: rejected because Markdown/GFM correctness and one-parse outline consistency would remain incomplete.
- Enable `rehype-raw`: rejected because source-controlled HTML is not required and expands the attack surface.
- Load dependencies from a CDN: rejected because preview must be offline-capable, deterministic, and free of passive network fetches.
- Add Mermaid, math, syntax highlighting, or local images: deferred outside the first release because each needs separate content, asset, and security policy.

## 4. Outline and DOM Identity

**Decision**: Derive plain heading text from the Markdown syntax tree, use a fresh stateful `github-slugger` 2.0.0 instance per document for logical fragments, and prefix every rendered heading and footnote DOM ID with a reader-instance namespace. Maintain reader-scoped element maps rather than document-global lookup.

**Rationale**: `github-slugger` tracks every emitted slug, including already suffixed values, and its source loops until an unused result is found. The current EzPz counter can emit a duplicate for `A`, `A`, `A-1`. Logical fragments must remain stable for links, while DOM IDs must not collide between concurrent readers.

**Alternatives considered**:

- Copy the existing EzPz counter: rejected because its collision defect is confirmed.
- Use the stateless exported `slug()` function: rejected because it deliberately does not track duplicates.
- Use random IDs: rejected because fragments and repeatable navigation would not be stable.
- Use `document.getElementById`: rejected because two reader instances could resolve the wrong heading.

## 5. Reader Mount Boundary

**Decision**: Expose one browser mount function that owns a React root and returns `update` and `unmount`. Inputs include a typed document, reader ID, explicit scroll element, optional fragment, trusted relative-reference callback, rendered acknowledgement callback, and optional validated clarification presentation.

**Rationale**: Existing canvases remain non-React shells. A small imperative boundary lets them host one presentation component without rewriting either application. Explicit update/unmount prevents stale roots when existing callers replace containers with `innerHTML`.

**Alternatives considered**:

- Rewrite Wizard and SDD in React: rejected due to regression cost and unrelated scope.
- Let the reader fetch files or select workflow context: rejected because that would mix presentation with authorization and host state.
- Mount a new nested iframe: rejected because it adds focus, token, CSP, sizing, and lifecycle complexity.

## 6. Additive HTTP Contracts

**Decision**: Keep every legacy route and response shape, and add the same conceptual review routes to each existing server:

- `GET /api/review/artifacts?context=...&cursor=...`
- `GET /api/review/content?context=...&artifactId=...&expectedRevision=...`
- `POST /api/review/resolve-link`

Context keys and artifact IDs are opaque identifiers, not paths or credentials. Every operation resolves current membership server-side.

**Rationale**: Existing artifact endpoints know only primary stage files and have incompatible response shapes. Additive contracts support related files, revisions, and safe references without breaking current consumers or pretending that HTTP routes are canvas actions.

**Alternatives considered**:

- Replace `/api/artifact`: rejected because current callers and tests rely on its existing shape.
- Send absolute paths to the browser: rejected because paths leak information and allow clients to manufacture authority.
- Return every document body in the artifact list: rejected due to memory, disclosure, and freshness cost.

## 7. Bounded File Reads

**Decision**: Implement one dependency-free ESM read helper and package a copy with each plugin. Validate relative syntax, suffix, membership, lexical containment, canonical containment, `.git` exclusion, regular-file type, and link/reparse safety before opening. Enforce the exact 5,242,880-byte cap while reading, compare identity and metadata around the read, decode UTF-8 strictly with optional BOM, reject NUL/binary data, and compute SHA-256 from exact bytes as the working-tree revision. Performance failure at the cap blocks release rather than reducing support.

**Rationale**: Wizard currently provides lexical containment and a 512 KiB limit; SDD currently rejects symlinks but only recognizes primary files and caps full reads at 1 MiB. The feature needs one reviewed behavior while preserving canvas-owned membership rules. Hashing bytes makes revisions truthful for committed, ignored, untracked, and modified files.

**Alternatives considered**:

- Increase existing constants and continue direct `readFile`: rejected because it does not enforce membership, strict encoding, bounded in-read behavior, or replacement detection.
- Depend on Git state: rejected because valid workflow outputs may be untracked or ignored.
- Claim race-proof sandboxing through `realpath`: rejected because same-user malicious code can race parent filesystem objects; the threat model must stay honest.

## 8. Artifact Discovery

**Decision**: Each canvas derives artifact descriptors from its current scanner/workflow state and actual bounded folders. Wizard combines phase targets, extension artifact targets, composition command/template sources, constitution, and actual feature Markdown. SDD combines its selected feature, known stage outputs, constitution, and actual Markdown below bounded feature `checklists/` and `contracts/` folders. Direct safe references are added only after server validation and labeled `reference`.

**Rationale**: Workflow state establishes context and ownership, while actual files establish availability. Expected names are hints, not an exhaustive renderer allowlist or proof that a file exists. Canvas-owned adapters prevent shared presentation code from learning workflow semantics.

**Alternatives considered**:

- Hardcode `spec.md`, `plan.md`, and `tasks.md`: rejected because research, data model, quickstart, custom outputs, checklists, contracts, and `.markdown` are required.
- Recursively index the repository: rejected because this is not a file browser and would weaken performance and authorization boundaries.
- Let the client submit arbitrary paths: rejected because a browser path cannot establish membership.

## 9. Discovery Bounds and Pagination

**Decision**: Return at most 200 descriptors per page and inspect at most 10,000 entries cumulatively for one cursor chain. Use server-issued opaque cursors bound to context generation and deterministic relative-path ordering. When the inspection cap is reached before discovery completes, return the partial page as `200 OK` with `limitReached=true` and no next cursor; do not return a competing `429` discovery outcome.

**Rationale**: These accepted specification defaults bound latency and memory while allowing large feature folders to remain navigable. Binding cursors to context prevents reuse after a feature or workspace change.

**Alternatives considered**:

- Return all descriptors: rejected because a custom extension could generate an unbounded tree.
- Persist a global index: rejected because it creates a second workflow store and stale authorization state.

## 10. Freshness, Concurrency, and History

**Decision**: The browser adapter keys requests, caches, history, drafts, and rendered acknowledgements by workspace/canvas instance/review context/artifact/revision as applicable. Every selection change increments a generation and aborts older requests. SSE invalidates metadata; it never selects another artifact. Preserve bounded in-memory Back/Forward and per-revision heading/scroll state.

**Rationale**: Same-named files can exist in different features, and slow reads can complete after context changes. Context generation plus revision is the cheapest reliable stale-response discriminator. Keeping history in memory avoids repository or browser persistence side effects.

**Alternatives considered**:

- Key only by filename: rejected because `spec.md` exists in many features.
- Auto-select a newly generated artifact: rejected because refresh must not steal selection.
- Store bodies/history in `localStorage`: rejected because data would outlive the authorized review context.

## 11. Existing Event Streams

**Decision**: Reuse Wizard `/api/events` and SDD `/events`. Extend their state signatures only enough to invalidate active artifact sets and revisions. Do not add a second watcher, polling loop, stream, or document body to event payloads.

**Rationale**: Both canvases already own cleanup and filesystem refresh. A parallel update path risks leaks, duplicate work, and ordering defects.

**Alternatives considered**:

- WebSocket service: rejected because one-way invalidation is sufficient.
- Reader-specific polling: rejected because it duplicates existing watchers.

## 12. Wizard Clarifications

**Decision**: Replace private-use-character and generated-HTML marker substitution with a trusted syntax-tree-to-React adapter. Only validated prose markers with a server-known artifact/command binding become controls. Key drafts by context, artifact, actual command, revision, and question identity. Preserve queue, apply/rerun, automatic all-answered flush, failure recovery, edits during flush, untracked acknowledgement, in-flight close blocking, and discard on Back-to-workflow.

**Rationale**: Raw HTML must remain disabled, and multi-file navigation creates a new risk of dispatching a draft to the wrong command. The current command identity must remain separate from any composite UI key.

**Alternatives considered**:

- Enable raw HTML for current marker buttons: rejected because document content could manufacture controls.
- Flush drafts when switching documents: rejected because a document switch is not workflow return.
- Share batching with SDD: rejected because SDD has a distinct interaction contract.

## 13. SDD Clarifications

**Decision**: Keep `clarificationRun` as an immediate, one-question, index-and-question-validated SDD action against current `spec.md`. The SDD adapter may present validated controls through the reader but does not import Wizard draft queues or batching.

**Rationale**: SDD currently re-reads and validates the question before `session.send`. Preserving that boundary avoids changing constitution, stage gates, overwrite behavior, and task progress while replacing only presentation.

**Alternatives considered**:

- Adopt Wizard batching for consistency: rejected because UI consistency does not justify changing workflow semantics.
- Let supporting documents inherit spec clarification actions: rejected because only an explicit artifact binding can authorize an action.

## 14. Responsive Layout, Scroll, and Focus

**Decision**: Pass the real preview scroller to the reader, preserve the initial 25-percent reading-line behavior, and derive one `wide`/`compact` state from a `ResizeObserver` on the reader container with an initial 820 pixel breakpoint. Wide mode uses a 190-220 pixel outline column; compact mode uses a modal TOC drawer. Close/remove inert before focusing a selected heading, restore trigger focus only on dismissal, preserve prior inert state, and let Escape close the drawer before the outer review.

**Rationale**: The current EzPz hook assumes `.preview-dialog__content` and global IDs, while its drawer uses viewport media queries. Neither assumption holds in a narrow App side panel on a wide display.

**Alternatives considered**:

- Use `window.matchMedia`: rejected because window width does not represent embedded panel width.
- Recreate EzPz dialog classes: rejected because selectors would hide a wrong ownership assumption.
- Always show the sidebar: rejected because it would compress content at narrow widths and high zoom.

## 15. Build and Asset Verification

**Decision**: Use Vite 8.0.16 library mode to emit a named browser ESM file and one CSS file. The user approved this patch during T002 after audit found Windows disclosure advisories in the originally planned 8.0.10 release. Bundle all reader runtime dependencies; externalize none. A repository-owned synchronization script copies only allowlisted files to each plugin, writes source/build hashes and notices, and has a verify mode that fails on stale copies, unexpected imports, source maps, local paths, credentials, or missing assets.

**Rationale**: Current Vite documentation supports explicit library entry, output file names, and CSS file naming. Neither canvas may install or compile dependencies when a preview opens. The installed subtree must be complete on its own.

**Alternatives considered**:

- Commit `node_modules`: rejected for size, provenance, and platform reasons.
- Build only in CI without delivering outputs: rejected because plugin installation uses repository subtrees.
- Externalize React or Markdown dependencies: rejected because the host does not promise those browser globals.

## 16. Test Strategy

**Decision**: Retain Node's built-in test runner for existing ESM services and scanner logic; add reader typecheck, scoped lint, pure transform/component fixtures, and Playwright integrated-shell journeys. Stage Wizard and SDD separately in empty temporary roots for import-closure and side-effect checks. Run Windows-specific path/junction cases explicitly, perform separately approved real App journeys in both canvases, and run the specification's standardized uncoached study with at least 10 representative participants.

**Rationale**: Unit tests alone cannot prove host shell, focus, static assets, capability gates, or return context. Browser tests cannot prove App loading or provider isolation. Real App tests must not replace deterministic security and stale-response coverage, and technical checks cannot establish first-use completion time or perceived clarity.

**Alternatives considered**:

- Component-only story/demo: rejected as insufficient integration evidence.
- Repository-wide coverage or TDD mandate: rejected as disproportionate and explicitly out of scope.
- Use original EzPzSpec checkout for destructive tests: rejected; an owned disposable worktree is required.

## 17. Versioning, Fork Provenance, and Rollback

**Decision**: Version Wizard and SDD independently only when each ships. Apply each release-candidate version to its plugin manifest, corresponding marketplace entry, and README note before final real-App acceptance so evidence identifies the exact candidate. Record fork owner/support owner, fork revision, upstream base, plugin versions, host baseline, generated asset hashes, notices, installation source, one-provider evidence, and known-good rollback. Rehearse update and rollback twice before intended-user release.

**Rationale**: Plugin versions are independent of Specify CLI, marketplace metadata, Wizard's private package version, and extension schema version. A different marketplace name alone does not isolate matching plugin identities.

**Alternatives considered**:

- Bump every repository plugin together: rejected by repository guidance.
- Wait for upstream review or official marketplace release: rejected because the accepted delivery model is fork-owned.
- Assume branch or tag syntax for fork-subdirectory installation: rejected until the exact host demonstrates a supported pinning method.

## 18. Source Reuse and Licensing

**Decision**: Reuse only the EzPz Markdown presentation slice after explicit redistribution approval, retaining applicable notices. If approval is not granted, implement the researched behavior independently from public library documentation and tests. Never copy Azure authorization, RTK Query, repository navigation, native handoff, dialog shell, or application deployment code.

**Rationale**: The inspected EzPz checkout is private and has no root license file. Technical access does not establish redistribution rights. The target repository is MIT, while `github-slugger` is ISC and all bundled dependencies need notices.

**Alternatives considered**:

- Treat the private frontend's package metadata as permission: rejected because it grants no redistribution right.
- Port the whole preview dialog: rejected because it imports unrelated application architecture and authorization.

## 19. Approval Gates Versus Technical Decisions

**Decision**: Represent fork ownership, destination access, source reuse, App loading/isolation, plugin installation, live workflow action, and publication as named stop gates in plan, tasks, quickstart, and release evidence. Do not encode guessed values or mark synthetic checks as approval.

**Rationale**: Every technical design question has a chosen path, but these operations affect external systems, private source, or installed user state and require scoped authority.

**Alternatives considered**:

- Leave them as open technical clarifications: rejected because no design answer can supply authorization.
- Assume local clone ownership implies fork/publication permission: rejected because checkout access and distribution authority are different facts.
