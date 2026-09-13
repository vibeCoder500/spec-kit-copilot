# Contract: Markdown Reader Mount

**Status**: Planned browser boundary  
**Provider**: Wizard-owned generated reader bundle  
**Consumers**: Wizard artifact adapter and SDD artifact adapter

## 1. Exported Surface

The dependency-closed ESM bundle exports one function:

```typescript
mountMarkdownReader(
  element: HTMLElement,
  options: ReaderOptions,
): MountedReader
```

It owns exactly one React root for `element`. Canvas adapters do not import React, Markdown parser packages, Wizard workflow state, or SDD workflow state.

## 2. Input Types

```typescript
type ReaderState =
  | "idle"
  | "loading"
  | "ready"
  | "changed"
  | "missing"
  | "deleted"
  | "unsupported"
  | "empty"
  | "no-heading"
  | "error";

type ConnectionState = "connected" | "disconnected";
type ArtifactRole = "primary" | "supporting" | "command" | "reference";
type DocumentRevision = string;

// Contract invariant: every DocumentRevision matches
// /^sha256:[0-9a-f]{64}$/ before it crosses this boundary.

interface ArtifactReference {
  id: string;
  relativePath: string;
  label: string;
  role: ArtifactRole;
  owningStage?: string;
  owningCommand?: string;
  originArtifactId?: string;
  availability: "available" | "expected" | "deleted" | "unsupported";
}

interface MarkdownDocument {
  artifact: ArtifactReference;
  revision: DocumentRevision;
  content: string;
  byteSize: number;
  modifiedAt: string;
  sourceKind: "working-tree";
}

interface ClarificationDescriptor {
  id: string;
  artifactId: string;
  revision: DocumentRevision;
  commandName: string;
  questionId: string;
  section?: string;
  question: string;
  mode: "wizard-batched" | "sdd-immediate";
  answer?: string;
  status?: "queued" | "submitting" | "acknowledged" | "failed" | "stale";
}

interface ReaderOptions {
  readerId: string;
  state: ReaderState;
  connectionState: ConnectionState;
  document?: MarkdownDocument;
  artifacts: readonly ArtifactReference[];
  selectedArtifactId?: string;
  scrollElement: HTMLElement;
  fragment?: string;
  statusMessage?: string;
  clarifications?: readonly ClarificationDescriptor[];
  onSelectArtifact(artifactId: string): void;
  onNavigateReference(target: string): void;
  onNavigateHistory(direction: "back" | "forward"): void;
  onReturnToWorkflow(): void;
  onClarification?(descriptorId: string, answer?: string): void;
  onRendered?(event: RenderedEvent): void;
}

interface RenderedEvent {
  readerId: string;
  artifactId?: string;
  revision?: DocumentRevision;
  state: ReaderState;
  activeFragment?: string;
}

interface MountedReader {
  update(options: ReaderOptions): void;
  unmount(): void;
}
```

## 3. Adapter Responsibilities

The Wizard and SDD adapters, not the reader, own:

- Creating and changing the server-validated review context.
- Fetching artifact pages and document content through authenticated existing-server routes.
- Aborting requests and suppressing results from old contexts, generations, artifacts, or revisions.
- Document selection, bounded Back/Forward history, and per-revision scroll/fragment restoration.
- Capturing and restoring workflow scroll and invoking-control focus.
- Mapping existing SSE invalidations into list/read refreshes.
- Deciding whether an artifact has a valid clarification binding.
- Wizard draft queue, apply/rerun, failure, in-flight, and discard behavior.
- SDD immediate one-question submission and current-question validation.
- External-link host interaction after an explicit user action.

## 4. Reader Responsibilities

The reader owns:

- Safe Markdown/GFM parsing and rendering.
- A single parse pipeline that both renders the article and creates the heading outline.
- Stateful duplicate-safe logical slugs from plain heading text.
- Reader-scoped heading and footnote DOM IDs.
- Rendering raw HTML as non-executing/omitted content and all images as accessible non-loading placeholders.
- Trusted link component behavior: fragments call local navigation, relative Markdown targets call `onNavigateReference`, external web targets require a user action, and unsupported schemes are inert.
- Hierarchical TOC presentation, active-heading calculation, heading focus, and explicit-scroll-root behavior.
- One container-measured `wide`/`compact` layout state with initial 820 px threshold.
- Compact drawer focus trap, prior-inert preservation, Escape ordering, destination focus, and dismissal focus restoration.
- State-specific presentation without inventing content or workflow availability.
- Full cleanup of observers, animation frames, event listeners, and React root on `unmount`.

## 5. Lifecycle Rules

### Mount

- `element`, `readerId`, and `scrollElement` are required.
- The mount fails fast for a disconnected element or duplicate live mount on the same element.
- It does not fetch, install, initialize, create a server, access Node APIs, or contact the model.
- The adapter may initially mount `idle` or `loading` without a document.

### Update

- `update` reuses the same root and fully replaces the prior option snapshot.
- A changed `readerId` is invalid; a changed context is represented by adapter disposal and a new mount.
- `ready` requires a matching document and selected artifact.
- `empty`, `missing`, `deleted`, `unsupported`, and `error` do not render stale document content as current.
- `changed` may show the last validated document only with an explicit stale label.
- A fragment is resolved only within current reader-owned heading targets.
- `onRendered` fires after the current state is committed and includes no document body or capability. The adapter still validates event generation before accepting it.

### Unmount

- `unmount` is idempotent.
- It disconnects `ResizeObserver` and `IntersectionObserver`, cancels animation frames, removes listeners, closes drawer state, restores prior inert state, and unmounts the React root.
- Canvas adapters call `unmount` before replacing/removing the mount element with `innerHTML`.
- Unmounting the reader does not close the canvas server; canvas `onClose` remains responsible for parent lifecycle cleanup.

## 6. State Presentation Contract

| State | Reader presentation |
| --- | --- |
| `idle` | Artifact-selection prompt; no missing-file implication. |
| `loading` | Selected artifact identity and progress; no old content presented as current. |
| `ready` | Document, artifacts control, source revision, and TOC. |
| `changed` | Last validated document may remain visible but clearly stale; refresh status is prominent. |
| `missing` | Not-yet-generated message with related navigation retained. |
| `deleted` | Previously available message with related and return navigation retained. |
| `unsupported` | Bounded denial/unsupported message; no target bytes. |
| `empty` | Explicit empty-document state with navigation. |
| `no-heading` | Full document and artifact navigation with no empty TOC. |
| `error` | Stable category/message with safe retry/navigation when allowed. |

`connectionState=disconnected` overlays a visible notice on the last validated state and never claims current freshness.

## 7. Heading and Footnote Rules

- A fresh stateful slugger is created per document update.
- Input to slugging is plain syntax-tree heading text, not raw Markdown.
- Empty results use `section` before collision handling.
- Logical fragments remain document-local and stable for the same ordered heading text.
- Rendered IDs are prefixed with a sanitized reader-instance namespace.
- Two simultaneous readers with identical Markdown have distinct DOM IDs and cannot focus each other's headings or footnotes.
- Heading lookups use the reader root or a current heading map, never `document.getElementById`.

## 8. Link and Image Rules

| Input | Result |
| --- | --- |
| `#fragment` | Navigate to a current logical heading or remain inert if absent. |
| Relative `.md`/`.markdown` target | Call `onNavigateReference` with the untrusted target; adapter/server resolves it. |
| `http` or `https` | Expose an explicit user-initiated external action with `noopener noreferrer`; no automatic fetch. |
| Protocol-relative or unsupported scheme | Render inert text/link affordance with no navigation. |
| Any image syntax | Render an accessible placeholder carrying safe alt text; never emit a requesting `<img>`. |
| Raw HTML | Do not parse into active elements. |

## 9. Clarification Presentation Rules

- Clarification controls come only from `ClarificationDescriptor` values supplied by the owning adapter and matched to current artifact/revision.
- Source text cannot manufacture callback names, command names, IDs, status, or component properties.
- Marker-like text in code/comments or without a descriptor remains ordinary text.
- The reader calls only `onClarification`; it never dispatches a workflow or updates a draft store itself.
- Switching artifacts does not call clarification callbacks.
- While a descriptor is `submitting`, controls reflect the owning adapter state; unsafe closure/switch blocking remains adapter-owned.

## 10. Accessibility and Layout

- Artifact selector and TOC have distinct accessible names and purposes.
- All commands are keyboard operable with visible focus.
- The compact TOC drawer traps focus only while open.
- Escape closes the TOC drawer before the outer canvas preview receives Escape.
- Selecting a section closes/removes inert state before focusing the destination and does not restore trigger focus afterward.
- Dismissing the drawer restores its trigger focus and the exact prior inert state.
- Tables and code scroll inside bounded content; controls and page do not horizontally overflow at required widths and 200-percent zoom.
- Motion respects reduced-motion preferences.

## 11. Test Observability

The rendered root may expose only non-secret attributes needed by deterministic tests:

- `data-reader-id`
- `data-reader-state`
- `data-artifact-id`
- `data-revision`
- `data-layout`

No capability, absolute path, document body, workspace fingerprint, or clarification answer is exposed as a diagnostic attribute or log.

## 12. Contract Tests

- Mount/update/unmount and duplicate-mount behavior.
- Ordinary/GFM fixtures, Setext headings, duplicate/pre-suffixed/empty/Unicode headings, code/comment exclusions, and footnotes.
- Two-reader ID, focus, fragment, and footnote isolation.
- Unsafe URL, raw HTML, remote/local image, and instruction-like content with zero passive network requests.
- Active heading, pointer/keyboard TOC, container resize, drawer focus/inert/Escape, reduced motion, and cleanup.
- Every reader state and disconnected notice.
- Stale rendered callback cannot acknowledge a later adapter generation.
- Wizard descriptors remain artifact/revision/command scoped; SDD descriptors never acquire batching behavior.
