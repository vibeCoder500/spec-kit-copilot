# Feature Specification: Integrated Markdown Artifact Review in Spec Kit Canvases

**Feature Branch**: Not created (no `before_specify` branch hook is configured)

**Feature Identifier**: `001-integrated-markdown-review`

**Created**: 2026-09-09

**Status**: Draft

**Input**: Add safe, navigable Markdown artifact review to the existing Spec Kit Wizard and Spec-Driven Development canvases, preserve workflow context and clarification behavior, and deliver the enhanced existing plugins through an approved maintained fork.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Artifacts Without Leaving the Workflow (Priority: P1)

A person working through a Spec Kit feature opens an artifact from the selected stage and reads it inside the same Wizard or Spec-Driven Development (SDD) canvas. The person can return to the same workflow context without losing progress, selection, position, or focus.

**Why this priority**: In-context review in both existing canvases is the core product outcome. A separate reader or support for only one canvas would not solve the stated problem.

**Independent Test**: Use one owned feature with an available stage artifact in each existing canvas. Open the artifact, inspect it, and return to the workflow. This delivers useful in-place review even before related-file navigation or live updates are exercised.

**Acceptance Scenarios**:

1. **Given** a selected Wizard feature and stage with a readable Markdown artifact, **When** the user opens its existing artifact link, **Then** the enhanced preview appears inside the Wizard and retains the selected feature and originating stage.
2. **Given** a selected SDD feature and stage with a readable Markdown artifact, **When** the user opens its existing artifact link, **Then** the same review experience appears inside SDD and retains the selected feature and originating stage.
3. **Given** an artifact preview opened from either canvas, **When** the user returns to the workflow, **Then** the canvas restores the originating feature, stage, workflow scroll position, and invoking control focus.
4. **Given** workflow execution is unavailable but an artifact is readable, **When** the user opens the artifact, **Then** review remains available without bypassing or changing execution authorization.
5. **Given** a user only opens, reads, or navigates an artifact, **When** the review session ends, **Then** no workflow stage has run, advanced, or been marked complete and no project file has changed.

---

### User Story 2 - Navigate Related Artifacts and Sections (Priority: P1)

While reviewing a feature or stage, the user switches among the actual Markdown artifacts associated with that workflow context and navigates headings within the selected document. File navigation and section navigation remain distinct and predictable.

**Why this priority**: Spec Kit decisions span multiple artifacts. In-place rendering has limited value if users still need to leave the canvas to compare the specification, research, plan, tasks, checklists, contracts, governance, and valid supporting documents.

**Independent Test**: Open a feature containing several primary and supporting Markdown files, visit multiple files and headings, use document history, and return to the originating stage while verifying that workflow state never changes.

**Acceptance Scenarios**:

1. **Given** a selected feature with actual spec, plan, tasks, research, data-model, quickstart, checklist, contract, constitution, composed-command, custom, or referenced Markdown, **When** the user opens the Artifacts selector, **Then** every eligible in-context file that exists is available and an expected file that does not exist is not presented as readable.
2. **Given** an artifact with nested headings, **When** the user uses the table of contents, **Then** focus and reading position move to the chosen section within the current document without switching files.
3. **Given** the user switches among related artifacts, **When** the user revisits a file whose content has not changed, **Then** its prior reading position or active section is restored.
4. **Given** the user has visited several artifacts, **When** the user uses document Back or Forward, **Then** navigation follows file history without changing the selected workflow feature or stage.
5. **Given** an artifact contains a valid relative link to another eligible Markdown document or a heading fragment, **When** the user follows it, **Then** the target opens in the same review context and the originating workflow remains selected.
6. **Given** an associated custom artifact uses a supported Markdown suffix or letter case, **When** artifacts are discovered, **Then** it is handled consistently with standard named artifacts rather than excluded by a fixed filename list.

---

### User Story 3 - Read Safe and Accessible Markdown (Priority: P1)

The user reads common Markdown and GitHub Flavored Markdown (GFM), including familiar additions such as tables, task lists, strikethrough, and automatic web links, navigates a hierarchical table of contents with a pointer or keyboard, and can use the review experience in both wide and narrow canvas panels.

**Why this priority**: The preview must make real specification artifacts legible without allowing document content to execute or making narrow embedded panels unusable.

**Independent Test**: Review a fixed Markdown fixture containing all supported constructs, difficult headings, unsafe content, and wide content at the required panel widths and zoom level using pointer and keyboard navigation.

**Acceptance Scenarios**:

1. **Given** a supported document containing headings, tables, nested lists, task states, links, code, blockquotes, strikethrough, autolinks, and footnotes, **When** it is reviewed, **Then** each construct has readable text without clipping or overlap, table and code overflow remains contained, and the table of contents matches the rendered heading hierarchy.
2. **Given** duplicate, pre-suffixed, empty, punctuation-only, or Unicode headings, **When** the document is reviewed, **Then** every navigable heading has a unique stable target and each table-of-contents item reaches the intended heading.
3. **Given** two open review instances contain identical headings or footnotes, **When** either user navigates within one instance, **Then** focus and navigation remain scoped to that instance.
4. **Given** Markdown contains raw HTML, remote images, executable or unsupported links, or instruction-like prose, **When** it is reviewed, **Then** none executes or loads automatically; images have accessible placeholders and unsupported links are inert.
5. **Given** a narrow review panel or 200-percent zoom, **When** the user opens the table of contents and navigates by keyboard, **Then** controls remain visible, focus stays within the open drawer, Escape closes the correct layer, and selecting a section focuses the destination.
6. **Given** a wide table, code block, long path, or long word, **When** it is displayed at any supported panel size, **Then** it remains contained without overlapping review controls or causing page-level horizontal overflow.

---

### User Story 4 - See Current and Truthful Artifact State (Priority: P1)

The user can distinguish current content from loading, changed, unavailable, unsupported, empty, disconnected, and error states. Changes to related artifacts appear without unexpectedly moving the user to another file.

**Why this priority**: Workflow artifacts are generated and revised during use. Presenting stale bytes as current or switching selection during refresh can cause incorrect review decisions.

**Independent Test**: Create, modify, replace, and delete files in an owned workflow fixture while delaying older reads. Verify explicit states, truthful revisions, stable selection, and latest-context behavior.

**Acceptance Scenarios**:

1. **Given** a new eligible artifact is created within the selected workflow context, **When** scoped artifact state refreshes, **Then** the artifact becomes available without replacing the user's current selection.
2. **Given** the selected artifact changes while open, **When** its state refreshes, **Then** the user sees that the source changed before replacement content is treated as current and navigation is restored only where still valid.
3. **Given** the selected artifact is deleted or becomes unreadable, **When** the change is detected, **Then** an explicit unavailable state is shown while other eligible artifacts remain usable.
4. **Given** a slow response for a previously selected file or feature completes after a new selection, **When** it arrives, **Then** it cannot overwrite or acknowledge the current selection.
5. **Given** a file is empty, has no headings, is too large, has invalid encoding, or is unsupported, **When** the user opens it, **Then** the preview reports the precise bounded state and never silently truncates or substitutes content.
6. **Given** working-tree content is displayed, **When** its identity is shown, **Then** it is described as a working-tree revision and never represented as a Git commit.

---

### User Story 5 - Preserve Clarification Workflows (Priority: P1)

A Wizard user can review and answer eligible clarification markers across related artifacts without drafts leaking to the wrong file or command. An SDD user retains SDD's existing single-question clarification and stage behavior.

**Why this priority**: Replacing the preview must not regress workflow actions that are already embedded in artifact review, and the new multi-file experience increases the risk of misapplying answers.

**Independent Test**: Exercise the existing Wizard and SDD clarification scenarios against owned artifacts, including cross-file navigation, changed revisions, failed submission, edits during submission, and return to workflow.

**Acceptance Scenarios**:

1. **Given** a valid Wizard clarification marker in eligible prose, **When** the user saves an answer, **Then** it remains queued without an immediate rerun and is associated with that artifact, owning command, source revision, and question.
2. **Given** queued Wizard answers, **When** the user switches among related artifacts and returns, **Then** each unchanged artifact restores only its own drafts and no draft is submitted to another command.
3. **Given** a Wizard clarification submission fails or answers are edited while submission is in progress, **When** the operation settles, **Then** unsent or newer answers remain available and the running state is accurate.
4. **Given** a Wizard source revision changes before queued answers are applied, **When** submission is attempted, **Then** submission is blocked with an explicit recovery state until the question and target are revalidated.
5. **Given** a Wizard clarification submission is in progress, **When** the user attempts an unsafe context switch or close, **Then** the action is prevented and completion cannot close or update a different artifact subsequently selected.
6. **Given** unsubmitted Wizard answers, **When** the user returns to the workflow, **Then** those drafts are discarded consistently with current Back-to-workflow behavior rather than silently applied.
7. **Given** a marker-like example appears in code, a comment, or a document without a valid workflow binding, **When** it is rendered, **Then** it remains non-interactive text.
8. **Given** an SDD clarification or stage action, **When** the user interacts with it after reviewing related files, **Then** current-question validation, feature selection, constitution state, stage gates, overwrite confirmation, and task progress retain SDD behavior without Wizard-style batching.

---

### User Story 6 - Keep Review Read-Only and Workspace-Bounded (Priority: P1)

A user can trust that artifact review reads only eligible files in the authorized workflow context and that untrusted Markdown cannot trigger model, network, workflow, setup, installation, or file-changing behavior.

**Why this priority**: Artifact content and links are untrusted input. Review must not become a route to unrelated local files, passive network access, command execution, or unintended model disclosure.

**Independent Test**: Run the defined malicious-content, unsafe-path, cross-context, local-access-control, and side-effect fixtures and verify every denied action fails explicitly while valid in-context reads still work.

**Acceptance Scenarios**:

1. **Given** a browser-supplied artifact identifier or previously returned artifact entry, **When** content is requested, **Then** current workflow membership and workspace authorization are revalidated before any bytes are returned.
2. **Given** traversal, encoded traversal, absolute, drive-relative, UNC, device, alternate-data-stream, link or junction escape, metadata-directory, or non-regular-file input, **When** a read or relative navigation is attempted, **Then** access is rejected without exposing unrelated file contents.
3. **Given** raw HTML, a remote image, an unsafe scheme, a protocol-relative target, or a custom command-like link, **When** the document is displayed, **Then** no code, fetch, file access, or workflow action occurs automatically.
4. **Given** a user only reads or navigates artifacts, **When** activity is inspected, **Then** document bodies were not sent to the model, no assistant action was dispatched, no project was initialized, no dependency was installed, and no source file was mutated.
5. **Given** invalid local canvas credentials, host identity, origin, or cross-instance authorization, **When** a review resource is requested, **Then** the request is denied under the same access protections as the existing canvas.
6. **Given** a review error occurs, **When** diagnostic evidence is captured, **Then** it excludes credentials, capability values, native profile data, document bodies, and unrelated private source.

---

### User Story 7 - Adopt and Recover the Maintained Fork (Priority: P2)

An approved fork owner can release identifiable enhanced versions of the existing Wizard and SDD plugins, and an authorized user can install, deliberately update, and restore a known-good version without replacing unrelated official plugins or workflow artifacts.

**Why this priority**: The review capability is useful only if the intended fork build can be identified, supported, and recovered. This follows the core experience but remains a release requirement.

**Independent Test**: In an approved isolated scope, install independently packaged Wizard and SDD fork builds, verify source and version evidence, complete both review journeys, update deliberately, and restore the recorded known-good builds.

**Acceptance Scenarios**:

1. **Given** approved fork ownership, access, and redistribution rights, **When** Wizard and SDD builds are released, **Then** each changed existing plugin has an identifiable fork version, upstream base, source revision, packaged-content evidence, support owner, and compatible prerequisite record.
2. **Given** an isolated target scope, **When** a fork build is installed, **Then** exactly one intended provider owns each existing canvas identity and no separate Markdown reader plugin or canvas is installed.
3. **Given** Wizard and SDD are installed independently from the fork, **When** their artifact previews open, **Then** each package contains everything needed for review without a runtime dependency on the other plugin or a development checkout.
4. **Given** a deliberate fork update, **When** installation completes, **Then** the installed source, version, and packaged-content evidence match the approved release before it is accepted.
5. **Given** an unacceptable update or compatibility failure, **When** the documented rollback is performed, **Then** the known-good fork versions are restored without changing official plugins, project artifacts, sessions, or unrelated settings.
6. **Given** only a component demonstration, command-line discovery result, arbitrary README preview, synthetic success, or separate canvas result, **When** release readiness is assessed, **Then** the core release remains blocked until the required Wizard and SDD integrated acceptance evidence exists.
7. **Given** broad implementation has not started, **When** the early probe is run for each existing canvas, **Then** a recorded result confirms the packaged preview opens, protected resources remain protected, the intended fork source and sole provider are identified, return context is restored, and repository status is unchanged; any failed condition blocks broad implementation.
8. **Given** a release candidate for either changed plugin, **When** the focused release matrix is run, **Then** every required core, safety, clarification, accessibility, package, and host journey has a named passing result and every platform-sensitive gap has an explicit release disposition.

### Edge Cases

- The selected stage has no generated artifact yet, while another artifact in the same context is readable.
- A document is zero bytes, contains only whitespace, or has no headings.
- A UTF-8 document includes a byte-order mark; another input contains malformed UTF-8 or NUL/binary bytes.
- A document is exactly at the supported byte limit or one byte over it.
- Duplicate headings coexist with already suffixed headings, punctuation-only headings, Unicode normalization variants, or headings inside fenced code.
- Two features contain the same relative filename, or two canvas instances display identical headings and footnotes.
- The user changes feature, artifact, or stage while an earlier read, render acknowledgement, or refresh remains pending.
- An artifact is created, modified, atomically replaced, renamed, or deleted during review.
- A refreshed document no longer contains the active heading or clarification question.
- A supporting document contains a marker but has no valid clarification binding.
- A Wizard clarification fails, receives edits during submission, or completes after the user attempted to change context.
- SDD execution is unavailable while previously generated artifacts remain readable.
- A relative Markdown link includes a fragment, mixed letter case, encoded traversal, or a target outside the authorized context.
- A path uses an absolute, drive-relative, UNC, device, alternate-data-stream, symbolic-link, junction, metadata-directory, or non-regular-file form.
- A remote image, raw HTML block, unsafe scheme, or instruction-looking passage is present in the Markdown.
- The artifact selector reaches discovery or pagination limits within a large but valid feature folder.
- A long path, unbroken word, wide table, or code block is viewed at a narrow panel width or 200-percent zoom.
- The canvas connection is interrupted and later restored while the current artifact changes.
- Two plugin instances are active concurrently and attempt to use each other's local authorization.
- The target App cannot isolate fork and official plugins with matching identities.

## Requirements *(mandatory)*

### Terms Used in This Specification

- **Markdown**: A plain-text document format that uses simple markers such as `#`, `-`, and backticks to express headings, lists, and code without executable document logic.
- **GitHub Flavored Markdown (GFM)**: Common additions to Markdown used in GitHub documents, including tables, task lists, strikethrough, and automatically recognized web links.
- **Canvas**: An existing embedded workflow panel in the GitHub Copilot App. In this feature, the two canvases are Wizard and SDD.
- **Artifact**: A document produced, used, or explicitly referenced by a Spec Kit workflow, such as a specification, research note, plan, task list, checklist, contract, constitution, command source, or custom workflow output.
- **Stage**: A named step in the active Spec Kit workflow, such as specifying, planning, or creating tasks.
- **Workflow context**: The active canvas and authorized workspace together with the selected project or feature, originating stage or command, and return location from which review began.
- **Host policy**: The GitHub Copilot App rules that govern whether its embedded canvas may navigate, open an external link, or access a local resource.
- **Fork**: An independently owned and maintained copy of the upstream repository with its own reviewed changes, versions, releases, support, and maintenance responsibility.
- **Authorized workspace**: The local project root that the active canvas session is already permitted to use. Selecting or linking a document does not expand this root.
- **Eligible artifact**: An ordinary `.md` or `.markdown` file that satisfies all of these rules: it is either inside the selected feature's bounded artifact folders, is the project constitution, is explicitly named as an artifact, command source, or template source by the active workflow for the selected context, or is the direct target of a safe relative reference; it remains beneath the authorized workspace and outside repository metadata; and it passes the path, file-type, size, and encoding requirements in this specification.
- **Safe relative reference**: A direct Markdown link in the currently eligible artifact that is resolved once from that artifact's folder, names another `.md` or `.markdown` ordinary file or a heading fragment, remains beneath the authorized workspace and outside repository metadata, and passes every eligibility check again. Users cannot create this access by entering an arbitrary path, and an opened file target is labeled as a reference rather than a workflow stage.
- **Ordinary file**: A regular document file, not a directory, device, pipe, repository metadata entry, symbolic link, junction, or other redirecting or special filesystem object.
- **Working-tree revision**: An identity for the exact local bytes being displayed, whether committed or not. It is not a Git commit identifier.
- **Windows special path forms**: Network-share paths (often called UNC paths), operating-system device paths, drive-relative paths, and alternate data streams that address data other than the named ordinary file. These forms are never eligible artifact paths.
- **Assistant-driven workflow action**: An explicit user command that asks the assistant to run or change a workflow. Ordinary document reading and navigation are not such actions.
- **Sensitive sign-in or host data**: Credentials, authorization capabilities, sign-in URL parameters or fragments, and private local host-profile information that could reveal identity or access details.
- **Representative participant**: A person who has completed at least one Spec Kit workflow and did not implement this feature.

### Review State Triggers

The review shows one base state from this table. A `disconnected` notice may accompany the last validated base state because loss of live updates does not invalidate content that was already read successfully.

| State | Exact trigger | Required presentation |
| --- | --- | --- |
| `idle` | No artifact is selected and no read is pending. | Invite the user to select an available artifact; do not imply that a file is missing. |
| `loading` | An eligible artifact is selected and its current read has not completed. | Identify the selected artifact and show progress without presenting older bytes as current. |
| `ready` | A read completed successfully for the current source revision, the document has non-whitespace content, and at least one navigable heading exists. | Show the validated content, revision, artifact navigation, and table of contents. |
| `changed` | Current source evidence differs from the displayed working-tree revision, or a read reports that the expected revision changed during the operation. | Label displayed content as changed or stale and do not present replacement bytes as current until a new read succeeds. |
| `missing` | The active workflow identifies an expected artifact, but no ordinary file has yet been available at its authorized location. | State that the output is not yet generated while leaving other artifact and workflow navigation usable. |
| `deleted` | An artifact that was previously read or listed as available no longer exists at its authorized location. | State that it was deleted or became unavailable while retaining access to related artifacts and Back to workflow. |
| `unsupported` | The selected target fails the required Markdown suffix, workflow or reference membership, ordinary-file, or authorized-location rules. | Do not display target bytes; show a bounded unsupported or denied result without revealing unrelated paths or contents. |
| `empty` | A valid read succeeds, but the decoded document contains no non-whitespace content after an optional byte-order mark. | Show an explicit empty-document state and keep related-artifact and workflow navigation available. |
| `no-heading` | A valid read succeeds with non-whitespace content but no navigable headings. | Show the full content and artifact navigation without an empty or misleading table of contents. |
| `error` | An authorized target cannot be displayed because it exceeds the size limit, has malformed or binary encoding, changes repeatedly during the read, cannot be read, or encounters another named failure. | Show the specific bounded error category, never empty success or truncated content, while preserving safe navigation. |
| `disconnected` | The canvas can no longer receive scoped update notifications. | Keep the last validated content visibly labeled with the connection loss and do not claim it remains current; preserve manual and return navigation. |

### Functional Requirements

#### In-Context Review

- **FR-001**: The first release MUST enhance artifact review inside both the existing Spec Kit Wizard and existing SDD canvas; success in only one canvas is insufficient.
- **FR-002**: The enhanced review MUST preserve each existing plugin identity, canvas identity, artifact entry point, workflow controls, and return navigation.
- **FR-003**: Opening a review MUST retain the selected feature or project context, originating stage or command, workflow scroll position, and invoking control needed for restoration.
- **FR-004**: Returning from review MUST restore the context captured at entry unless the user explicitly selected a different workflow context outside the review.
- **FR-005**: Opening, reading, section navigation, file navigation, and closing review MUST NOT run, advance, rerun, or mark a workflow stage complete.
- **FR-006**: Readable artifacts MUST remain reviewable when workflow execution is unavailable, without bypassing or weakening execution authorization.

#### Artifact Discovery and Navigation

- **FR-007**: The Artifacts selector MUST list eligible artifacts associated with the selected workflow context, including primary stage outputs, supporting feature documents, checklists, contracts, project constitution, valid composed-command sources, custom outputs, and safe relative references as defined above.
- **FR-008**: Eligible files MUST include `.md` and `.markdown` suffixes without depending on a fixed list of three filenames and without treating an expected but absent file as readable.
- **FR-009**: Artifact discovery MUST stay bounded to the selected feature, item, project-governance, or composition context and MUST report an explicit limit state when discovery bounds are reached.
- **FR-010**: The artifact selector MUST navigate documents, while the table of contents MUST navigate headings only within the currently selected document.
- **FR-011**: The user MUST be able to move Back and Forward through visited documents without changing the workflow's active feature or stage.
- **FR-012**: The review MUST preserve bounded per-document reading position or active-section history and restore it only when the corresponding source revision remains valid.
- **FR-013**: Safe relative references and fragments MUST open within the current review context; a relative target that fails any safe-reference condition MUST remain inert or show an explicit denial.
- **FR-014**: A referenced supporting document MUST be labeled as a reference rather than presented as a newly selected workflow stage.

#### Rendering and Accessibility

- **FR-015**: Supported Markdown MUST include headings, paragraphs, tables, nested lists, task states, strikethrough, autolinks, fenced and inline code, blockquotes, Setext headings, and footnotes.
- **FR-016**: The rendered heading hierarchy and table of contents MUST agree for every supported document, and headings inside code or non-visible comments MUST NOT appear in the table of contents.
- **FR-017**: Heading and footnote targets MUST remain unique and deterministic for duplicate, pre-suffixed, empty, punctuation-only, and Unicode labels and MUST remain isolated between concurrent reader instances.
- **FR-018**: Raw HTML MUST remain non-executing, and image sources MUST be replaced by accessible non-loading placeholders in the first release.
- **FR-019**: Navigation MUST follow this policy: a fragment stays in the current document; a safe relative Markdown reference opens in the current review context; an `http` or `https` link is offered only as an explicit user-initiated external action under host policy; every protocol-relative, script, data, file, command, custom-scheme, unsupported, or unauthorized target remains inert and never fetches automatically.
- **FR-020**: All review and table-of-contents operations MUST be usable by pointer and keyboard in wide and narrow embedded panels.
- **FR-021**: Compact behavior MUST respond to the available review area rather than assume the overall display width represents the embedded panel width.
- **FR-022**: An open compact table-of-contents drawer MUST manage focus, dismissal, inert content, Escape ordering, and destination focus without overriding successful section navigation.
- **FR-023**: Review controls, text, tables, code, paths, status messages, and drawers MUST remain readable without incoherent overlap or page-level horizontal overflow at supported widths and 200-percent zoom.

#### Freshness, Limits, and States

- **FR-024**: The review MUST apply the exact trigger and presentation rules in the Review State Triggers table for `idle`, `loading`, `ready`, `changed`, `missing`, `deleted`, `unsupported`, `empty`, `no-heading`, `error`, and the `disconnected` notice; it MUST NOT substitute empty success or a different state for a known condition.
- **FR-025**: Newly created or modified eligible artifacts MUST become discoverable through scoped updates without automatically changing the selected artifact.
- **FR-026**: A stale read, refresh, or rendered acknowledgement from another artifact, feature, revision, canvas instance, or review generation MUST NOT replace or acknowledge the current selection.
- **FR-027**: When the selected source changes, the review MUST distinguish the changed state before treating replacement bytes as current and MUST restore a heading only if it still exists.
- **FR-028**: When the selected artifact is deleted or becomes unreadable, its explicit unavailable state MUST leave other artifacts and workflow navigation usable.
- **FR-029**: The first release MUST support bounded strict UTF-8 Markdown, including an optional UTF-8 byte-order mark, from zero through exactly 5,242,880 source bytes; larger files MUST be rejected explicitly, and failure to meet the release performance thresholds at this boundary MUST block release rather than lower the supported limit.
- **FR-030**: Oversized, malformed-encoding, binary, unsupported, and concurrently changed inputs MUST produce explicit outcomes and MUST NOT be silently truncated, normalized into different source bytes, or presented as empty success.
- **FR-031**: A displayed source identity MUST distinguish a working-tree content revision from a Git commit and MUST change when the displayed source bytes change.

#### Workflow-Specific Clarifications

- **FR-032**: Wizard clarification controls MUST be offered only for validated eligible prose markers with a valid owning command and artifact binding; examples in code, comments, or unsupported documents MUST remain inert.
- **FR-033**: Saving a Wizard answer MUST queue it without immediate submission, and applying answers MUST retain current apply-and-rerun and automatic-all-answered behavior.
- **FR-034**: Wizard drafts MUST be isolated by workflow context, artifact, owning command, source revision, and question identity while preserving the actual command identity used for submission.
- **FR-035**: Switching related documents MUST preserve each unchanged Wizard artifact's unsubmitted drafts; returning to the workflow MUST discard unsubmitted drafts according to current behavior.
- **FR-036**: A failed Wizard submission or an answer added or edited during submission MUST preserve all answers that were not successfully consumed and MUST clear or retain running acknowledgement according to the actual submission result.
- **FR-037**: A changed Wizard source or target MUST be revalidated before submission; stale clarification drafts MUST be blocked with an explicit recovery state rather than applied to changed text.
- **FR-038**: Unsafe context changes and closure MUST be blocked during an in-flight Wizard clarification submission, and its completion MUST NOT close or mutate a different artifact.
- **FR-039**: SDD MUST retain its own current-question matching, explicit clarification behavior, feature selection, constitution status, stage gates, overwrite confirmation, and task progress without acquiring Wizard batching semantics.

#### Read-Only and Security Boundaries

- **FR-040**: Merely reviewing or navigating MUST NOT send document content to the model, dispatch an assistant or workflow action, initialize Spec Kit, install dependencies, write project files, or change persisted workflow state.
- **FR-041**: Every artifact read and relative-reference resolution MUST revalidate the current authorized workspace, workflow context, artifact membership, and source target; a prior listing or client-supplied path MUST NOT grant continuing access.
- **FR-042**: Artifact access MUST reject parent-directory escape attempts, including encoded attempts; absolute local, network-share, device, and drive-relative paths; alternate data streams; control characters; repository metadata; anything other than an ordinary file; and every target outside the authorized workspace.
- **FR-043**: Artifact access MUST reject symbolic-link, junction, or other redirecting targets that escape the authorized workspace or selected context and MUST report platform-sensitive verification gaps honestly.
- **FR-044**: Untrusted Markdown MUST NOT cause passive remote image loading, arbitrary URL fetching, raw-HTML execution, local file access, command execution, or automatic model submission.
- **FR-045**: All review content, metadata, and local resources MUST remain subject to the existing canvas's authentication, host, origin, instance, input-size, and workspace protections.
- **FR-046**: Logs, prompts, status evidence, and release artifacts MUST exclude sensitive sign-in or host data, document bodies unless explicitly approved for a bounded test, private fixtures, and unrelated private source.
- **FR-047**: Security claims MUST state that the feature protects against untrusted document content, unsafe paths, accidental cross-context access, and ordinary file replacement, but does not claim an operating-system sandbox against malicious code already running as the same user.

#### Delivery, Compatibility, and Validation

- **FR-048**: The first release MUST modify and distribute only the existing Wizard and SDD plugins needed for the core experience; it MUST NOT add a standalone reader plugin, new canvas, preset, general file picker, or separate product.
- **FR-049**: Each changed existing plugin MUST be independently installable with its complete review capability and MUST NOT require the other plugin, a sibling development checkout, or runtime renderer installation.
- **FR-050**: Existing assistant-driven workflow action names, input contracts, prerequisite gates, dispatch semantics, and completion-state behavior MUST remain backward-compatible after the review feature is added.
- **FR-051**: Fork release evidence MUST identify the approved owner, support responsibility, fork source revision, upstream base `96ed37d9134c63d6cb05236879a8e1dcea010e3f`, changed plugin versions, packaged-content hashes, compatible host baseline, and known-good rollback target.
- **FR-052**: Hosted fork creation, destination access, source-reuse rights, publication, installation, and live App actions MUST remain explicit approvals; synthetic or local success MUST NOT be treated as approval.
- **FR-053**: Installation acceptance MUST verify exactly one intended provider for each existing canvas in an isolated scope and MUST NOT silently replace official plugins or assume matching official and fork identities can coexist.
- **FR-054**: A supported install, deliberate update, installed-source verification, and known-good rollback MUST be demonstrated for both fork plugins before release to intended users.
- **FR-055**: Assessment and Bug Fix preview integration MUST remain a subsequent separately versioned and validated tranche and MUST NOT block the Wizard-and-SDD core release.
- **FR-056**: Before broad implementation, each existing canvas MUST have an early evidence record showing that its packaged preview opens, protected resources are denied without valid local access, the intended fork source and exactly one provider are identified, return to the originating stage succeeds, and before-and-after repository status is unchanged. All six conditions MUST pass for both Wizard and SDD; any failure blocks broad implementation.
- **FR-057**: Release validation MUST give every required rendering, navigation, accessibility, authorization, path, size, encoding, context, revision, freshness, clarification, read-only side-effect, static-check, build, actual-shell journey, and independent-package check a named pass, fail, or platform-gap result. Every core journey and safety check MUST pass; a skipped platform-sensitive security case MUST block the corresponding security claim and release unless an authorized disposition explicitly narrows the claim.
- **FR-058**: Release validation MUST include real GitHub Copilot App journeys in both existing canvases on an owned EzPzSpec workflow fixture or an already authorized alternative, proving feature to artifact to related files and table of contents to the same stage.
- **FR-059**: A live stage-output creation or update check MUST be separately approved and recorded; simulated file changes MUST NOT be reported as equivalent live workflow evidence.
- **FR-060**: Command-line discovery, a reader-only demonstration, an arbitrary README, a separate canvas, or success in only one existing canvas MUST NOT satisfy integrated release acceptance.
- **FR-061**: The implementation and validation effort MUST leave EzPzSpec Feature 005, both original application repositories, the installed handoff helper, and unrelated official plugin settings unchanged.
- **FR-062**: An optional later upstream contribution MUST remain outside initial implementation tasks and release gates; the approved fork owner controls initial review, versioning, release, maintenance, and support.

### Scope Boundaries

#### In Scope for the Core Release

- Enhanced read-only Markdown artifact review inside the existing Wizard and SDD canvases.
- Workflow-scoped artifact and section navigation with context, history, focus, and reading-position restoration.
- Safe Markdown/GFM presentation, accessible responsive behavior, explicit source states, and bounded authorized workspace reads.
- Preservation of Wizard and SDD workflow-specific clarification and stage behavior.
- Independently packaged, approved, identifiable fork versions of the two changed existing plugins.
- Focused deterministic validation, independent package validation, and real App acceptance for both canvases.

#### Subsequent Scope

- Equivalent integrated preview adapters for Assessment and Bug Fix, released only after their own workflow and clarification acceptance passes.
- A separately approved optional upstream contribution after the maintained fork is useful and stable.

#### Non-Goals

- A standalone Markdown canvas, reader plugin, marketplace reader entry, general-purpose file browser, generic file picker, external preview application, or VS Code preview extension.
- A full port of the EzPzSpec application, its repository browser, deployment architecture, authentication, remote repository integrations, model runtime, or native handoff behavior.
- Remote Azure DevOps or GitHub browsing, arbitrary URL retrieval, automatic remote image loading, or a new model-mediated action for ordinary reading.
- Markdown editing, task-checkbox mutation, selected-text discussion, automatic model review, compare or diff views, Mermaid, mathematical rendering, syntax highlighting, or local image rendering in the first release.
- Automatic Spec Kit initialization, workflow execution, dependency installation, external App launch, project selection, or any claim that canvas rendering works in VS Code or a command-line host.
- Repository-wide frontend rewrites, repository-wide coverage mandates, test-driven-development mandates, or version changes to plugins that do not ship this feature.
- Creating a hosted fork, adding a fork remote, pushing code, installing a plugin, or publishing private source without separate approval.

### Key Entities

- **Review Context**: The authorized canvas instance, workspace, selected feature or project scope, originating stage or command, return target, and eligible artifact set for one in-flow review journey.
- **Artifact Descriptor**: A stable in-context identity for an eligible file, including display label, relative path, role, owning stage or command when applicable, availability, and reference relationship without embedding source content.
- **Markdown Document**: The strictly decoded bounded working-tree content for one artifact together with its byte size, modification evidence, source kind, and content revision.
- **Document Revision**: A content-derived identity for the exact displayed bytes, used to detect changes and validate navigation and clarification state; it is explicitly not a Git commit identity.
- **Review History Entry**: A visited artifact and optional section or scroll position associated with a valid revision and review context.
- **Heading Target**: A logical section identity and reader-scoped navigation target with depth, label, order, and collision-safe uniqueness.
- **Clarification Draft**: An unsubmitted answer bound to a validated question, artifact, owning workflow command, source revision, and review context.
- **Refresh Event**: A scoped indication that artifact availability or content may have changed, without carrying authority to select a file or mark workflow progress.
- **Fork Release Record**: Evidence linking approved ownership and support to fork and upstream revisions, changed plugin versions, packaged-content hashes, compatible host versions, installation source, validation results, and rollback target.

### Dependencies and Approval Gates

- The existing Wizard and SDD canvas hosts, their workflow state, and their authorized workspace identity must be available; the feature does not create an alternative host.
- A target GitHub Copilot App build must support loading the approved development or fork payload in an isolated scope with one intended provider per canvas.
- Fork owner, visibility, intended users, support ownership, destination access, and source-redistribution rights must be approved before hosted publication or distribution.
- Any reuse of private EzPz implementation requires explicit authorization for the destination; this specification grants none.
- An owned disposable workflow fixture or an already authorized alternative repository is required for real App acceptance.
- A live workflow action that creates or updates an artifact requires separate approval beyond deterministic or synthetic review testing.
- Installed official plugins, original application repositories, user sessions, workflow artifacts, and the existing handoff helper must have a verified preservation and rollback plan before fork installation testing.
- The detailed technical source layout and build sequence from the external research plan are inputs to the planning phase, not user-facing behavior defined by this specification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of core acceptance runs, users complete feature selection, artifact opening, related-file and section navigation, and return to the same originating stage in both Wizard and SDD without workflow-state changes.
- **SC-002**: In a standardized first-use test with at least 10 representative participants and no task-specific coaching, at least 9 can open an artifact and reach a named section within 30 seconds on their first attempt without leaving the canvas.
- **SC-003**: In the approved fixture corpus, 100% of existing eligible `.md` and `.markdown` artifacts within the selected bounded context are discoverable, and 100% of absent expected artifacts are shown as unavailable or omitted rather than readable.
- **SC-004**: Across the heading-collision fixture corpus and two simultaneous review instances, 100% of table-of-contents entries resolve to the intended unique heading and no heading or footnote target crosses reader instances.
- **SC-005**: Users can complete artifact selection, table-of-contents navigation, document Back and Forward, and Back to workflow entirely by keyboard at 360, 480, 640, 820, and 1,024 pixel review widths and at 200-percent zoom, with zero overlapping controls or page-level horizontal overflow in acceptance screenshots.
- **SC-006**: On recorded reference hardware, a representative 100 KiB document becomes readable and navigable within 1 second after content is received, a 5,242,880-byte document does so within 5 seconds, and at least 19 of 20 section or artifact navigation interactions at that boundary show a visible response within 200 milliseconds, with zero silent truncations; failure blocks release rather than reducing the FR-029 limit.
- **SC-007**: In 100% of create, modify, replace, delete, feature-switch, and delayed-response acceptance cases, the selected artifact remains stable unless the user changes it, the latest context wins, and stale content is never reported as current.
- **SC-008**: In 100% of Wizard clarification regression cases, drafts remain bound to the correct artifact, command, revision, and question through switching, failure, edits during submission, discard, and stale-source recovery; in 100% of SDD cases, existing non-batched semantics remain intact.
- **SC-009**: The complete malicious-content, unsafe-path, cross-context, invalid-local-access, and read-only side-effect corpus produces zero unauthorized reads, passive remote fetches, code executions, workflow dispatches, model submissions, setup actions, dependency installations, or source mutations.
- **SC-010**: In one clean-scope adoption trial for Wizard alone and one for SDD alone, users can complete the core review journey using only the selected enhanced plugin and its approved existing prerequisites, with zero missing-resource failures and without installing a separate reader or retaining access to a development checkout.
- **SC-011**: Real Copilot App acceptance records a successful integrated journey for both Wizard and SDD on an owned or already authorized workflow fixture, including visible source revision, related-file navigation, table-of-contents navigation, context restoration, and preserved repository status.
- **SC-012**: In two consecutive release rehearsals, an authorized operator can identify the installed fork source and version, deliberately update both enhanced plugins, verify one intended provider per canvas, and restore both known-good versions within 30 minutes total, with zero changes to unrelated plugins, settings, sessions, or project artifacts.
- **SC-013**: In a standardized acceptance study with at least 10 representative participants using the same uncoached review tasks, at least 9 rate artifact navigation, section navigation, and return-to-workflow behavior 4 out of 5 or better for clarity and predictability.
- **SC-014**: Acceptance evidence records zero changes to EzPzSpec Feature 005, either original application checkout, the installed handoff helper, unrelated official plugins, or unapproved private source destinations.

## Assumptions

- The project constitution is currently an unratified placeholder; repository `AGENTS.md`, contribution guidance, and explicit feature requirements govern this specification until a constitution is ratified.
- The researched upstream baseline is `96ed37d9134c63d6cb05236879a8e1dcea010e3f`; planning will verify the current checkout and preserve later user changes rather than resetting to that commit.
- No feature branch was created because no `before_specify` branch hook is configured; the feature directory and any later fork branch remain independent.
- The existing local checkout is a development source only. It does not prove that a hosted fork, approved remote, release channel, or installation entitlement exists.
- Authorized workflow artifacts may be uncommitted, untracked, or ignored. Current working-tree bytes are the review source when they meet the same context and safety rules.
- Supported text is strict UTF-8 with an optional UTF-8 byte-order mark. The first-release ceiling is exactly 5,242,880 source bytes per document; measured validation is a release gate and cannot silently reduce this limit.
- Supported Markdown suffix matching is case-insensitive for `.md` and `.markdown`; expected filenames are navigation hints, not an authorization boundary or exhaustive allowlist.
- Artifact discovery is bounded and lazy: at most 200 entries are returned per page and at most 10,000 entries are inspected in one discovery pass unless planning establishes a stricter safe bound.
- External web links may be offered only as explicit user-initiated navigation under host policy; previewing never fetches them. Remote and local images remain blocked in the first release.
- Advanced rendering such as Mermaid, mathematical notation, syntax highlighting, and local images remains readable as literal source notation when present but is outside parity claims.
- The initial security model treats document contents and browser inputs as hostile while assuming the selected local checkout is authorized. It does not claim race-proof isolation from malicious code already executing under the same operating-system account.
- Wizard and SDD are equally mandatory for the core release. Assessment and Bug Fix follow only as a subsequent integrated tranche.
- The fork owner controls initial implementation review, releases, support, maintenance, and upstream synchronization. Upstream review or merge is not a release dependency.
- Technical source ownership, build packaging, test tooling, and file placement will be resolved during planning under the external research plan while preserving every externally verifiable requirement and scope boundary above.
