# Data Model: Integrated Markdown Artifact Review

**Date**: 2026-09-09  
**Specification**: [spec.md](spec.md)  
**Research**: [research.md](research.md)

This model describes in-memory review state, authenticated HTTP values, rendered document metadata, and release evidence. It introduces no database or durable browser storage.

## 1. ReviewContext

Represents one authorized review journey inside one existing canvas instance.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | opaque string | Server-issued; bound to canvas instance, workspace fingerprint, scope, and context generation; never a path or credential. |
| `canvasId` | `speckit-wizard` or `sdd-canvas` | Fixed by the owning plugin. |
| `instanceId` | internal opaque string | Never accepted from an artifact document; must match the active server instance. |
| `workspaceFingerprint` | internal string | Derived from the authoritative canonical workspace root; absolute root is not returned in review payloads. |
| `scopeType` | `project`, `feature`, or `composition` | Determines the membership adapter. SDD uses `project` or `feature`; Wizard may also use `composition`. |
| `scopeKey` | string | Normalized, current scanner-owned feature/project/composition identity. |
| `originStage` | optional string | Existing workflow stage from which review opened. Not changed by document navigation. |
| `originCommand` | optional string | Existing composed command from which review opened. |
| `returnTarget` | browser-owned object | Invoking control identity and workflow scroll offset; never grants server access. |
| `generation` | positive integer | Increments whenever workspace, feature, project scope, or owning context changes. |
| `createdAt` | timestamp | Used only for bounded lifetime and diagnostics; no persistence. |

### Review Context Validation

- Server recreates or verifies scope membership from current workflow/scanner state on every operation.
- An ID from another canvas instance, workspace, scope generation, or expired in-memory context is rejected as `invalid_context`.
- Browser-provided stage, command, filename, or label cannot expand membership.
- Changing only the selected document does not create a new workflow context or generation.

### Relationships

- Has many `ArtifactDescriptor` records.
- Has one `ReaderSession` in the browser adapter.
- Owns zero or more `ReviewHistoryEntry` and `ClarificationDraft` records.
- Receives zero or more `RefreshEvent` records.

## 2. ArtifactDescriptor

Describes one candidate or readable artifact without including document content.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | opaque string | Server-issued and context-bound; stable while context membership and normalized relative path remain stable. |
| `relativePath` | string | Workspace-relative display path using `/`; never absolute, drive-relative, UNC, device, ADS, or traversal syntax. |
| `label` | string | Plain untrusted display text derived from current workflow metadata or filename. |
| `role` | `primary`, `supporting`, `command`, or `reference` | `reference` is used for a direct safe link target and never changes the selected workflow stage. |
| `owningStage` | optional string | Supplied only by current workflow metadata. |
| `owningCommand` | optional string | Required before an artifact can expose Wizard clarification controls. |
| `originArtifactId` | optional opaque string | Required for a `reference` reached from another artifact. |
| `availability` | `available`, `expected`, `deleted`, or `unsupported` | `available` alone permits a content-read attempt; read validation still runs again. |
| `suffix` | `.md` or `.markdown` | Compared case-insensitively; response uses normalized lowercase. |
| `modifiedAt` | optional timestamp | Advisory metadata, not a content revision. |
| `byteSize` | optional integer | Advisory non-negative size; final cap is enforced during the read. |

### Artifact Validation

- Membership source is one of: bounded selected feature folders, constitution, current workflow artifact/source metadata, or a newly validated direct relative reference.
- `.git` and every metadata descendant are excluded.
- Expected but absent outputs may be listed with `availability=expected`; they cannot return content.
- Artifact pages contain at most 200 descriptors and are deterministically ordered by role, owning stage/command, then normalized relative path.

## 3. ArtifactPage and DiscoveryCursor

Provides bounded artifact discovery.

### ArtifactPage

| Field | Type | Rules |
| --- | --- | --- |
| `contextId` | opaque string | Must equal the current validated context. |
| `generation` | positive integer | Lets the browser discard pages from an older context. |
| `items` | `ArtifactDescriptor[]` | Maximum 200. No content bodies. |
| `nextCursor` | optional opaque string | Present only when more bounded results remain. |
| `limitReached` | boolean | True on a successful partial page when the cumulative 10,000-entry inspection limit prevented complete discovery; when true, `nextCursor` is absent. |

### DiscoveryCursor

Internal signed/opaque state containing context ID, generation, deterministic resume key, cumulative inspected-entry count, and expiry. It is rejected after a context change and never embeds a bearer capability or absolute path. A cursor chain ends with a successful partial page and `limitReached=true` when the cumulative inspected-entry count reaches 10,000.

## 4. MarkdownDocument

Contains one completed, validated artifact read.

| Field | Type | Rules |
| --- | --- | --- |
| `artifact` | `ArtifactDescriptor` | Re-resolved for the active context at read time. |
| `revision` | `DocumentRevision` | Computed from exact bytes before BOM removal or presentation normalization. |
| `content` | string | Strictly decoded UTF-8; optional leading BOM removed only from displayed text. |
| `byteSize` | integer | Exact source byte count, `0..5,242,880`. |
| `modifiedAt` | timestamp | Captured from the final validated file metadata. |
| `sourceKind` | `working-tree` | Never represented as a Git commit. |

### Document Validation

- Target must remain an authorized ordinary file throughout a bounded read.
- Invalid UTF-8, NUL/binary content, size overflow, identity changes, and repeated concurrent replacement return typed errors rather than a partial document.
- Whitespace-only content is valid and maps the reader to `empty`.

## 5. DocumentRevision

A content-derived identity serialized everywhere as the string `sha256:<64 lowercase hexadecimal characters>`. The in-memory model, HTTP contract, browser mount contract, history, link resolution, and clarification bindings use this exact representation; no object/string conversion boundary exists. The UI may derive a short non-authoritative prefix for display but must label it as a working-tree revision.

Two documents have the same revision only when their exact bytes match. Modified time and path are not revision inputs.

## 6. HeadingTarget

Represents one navigable rendered heading.

| Field | Type | Rules |
| --- | --- | --- |
| `logicalSlug` | string | Generated from plain heading text by one fresh stateful slugger per document; collision-safe across pre-suffixed values. |
| `domId` | string | `<readerId>-heading-<logicalSlug-or-section>` plus collision-safe suffixes; unique in the host document. |
| `label` | string | Plain text derived from the Markdown syntax tree. |
| `depth` | integer | `1..6`. |
| `order` | non-negative integer | Source order, unique within one document. |
| `sourceOffset` | optional integer | Used only for trusted clarification/heading association; never rendered as authority. |

### Heading Validation

- Headings inside code and non-visible comments are excluded.
- Empty slug bases use `section` before collision handling.
- Two reader instances with identical content produce the same logical slugs but different DOM IDs.
- Footnote IDs follow the same reader namespace rule.

## 7. ReaderSession

Browser-adapter state for one `ReviewContext`.

| Field | Type | Rules |
| --- | --- | --- |
| `contextId` | opaque string | Current context only. |
| `generation` | positive integer | Copied into every async selection operation. |
| `selectedArtifactId` | optional opaque string | User selection; refresh does not change it. |
| `baseState` | `idle`, `loading`, `ready`, `changed`, `missing`, `deleted`, `unsupported`, `empty`, `no-heading`, or `error` | Exactly one base state. |
| `connectionState` | `connected` or `disconnected` | Orthogonal notice; disconnection keeps the last validated base state. |
| `document` | optional `MarkdownDocument` | Required for `ready` and `no-heading`; may remain as stale evidence in `changed`. |
| `headings` | `HeadingTarget[]` | Empty for `empty` and `no-heading`. |
| `layout` | `wide` or `compact` | Derived from reader container width; initial threshold 820 px. |
| `history` | `ReviewHistoryEntry[]` | Maximum 50 entries per context. |
| `historyIndex` | integer | `-1` when empty; otherwise valid array index. |
| `activeRequest` | optional internal token | Abort handle plus generation/artifact/revision tuple. |

### Base-State Transitions

| From | Event | To | Required effect |
| --- | --- | --- | --- |
| `idle` | Select available descriptor | `loading` | Start generation-bound read. |
| Any stable state | Select another descriptor | `loading` | Abort old request; retain old history, not old selection content. |
| `loading` | Current non-empty document with headings | `ready` | Mount/update reader and append history. |
| `loading` | Current non-empty document without headings | `no-heading` | Render content without TOC. |
| `loading` | Current whitespace-only document | `empty` | Keep artifact navigation available. |
| `loading` | Expected output absent | `missing` | Do not create an empty document. |
| Stable document state | Previously available target disappears | `deleted` | Keep related navigation and return action. |
| Any | Membership/type/path denial | `unsupported` | Never expose target bytes. |
| Any displayed document state | Revision invalidation | `changed` | Label old bytes stale before any replacement is current. |
| `changed` | User/automatic bounded refresh starts | `loading` | Preserve desired logical fragment only as a restoration candidate. |
| `loading` | Typed read/encoding/size/race failure | `error` | Show stable error category, never partial bytes. |
| Any | Workflow context closes | disposed | Abort, unmount, remove listeners, clear bodies/history/drafts. |

A response updates state only when context ID, generation, artifact ID, and expected revision conditions still match.

## 8. ReviewHistoryEntry

Stores bounded navigation state for a visited document.

| Field | Type | Rules |
| --- | --- | --- |
| `artifactId` | opaque string | Belongs to the current context. |
| `revision` | `DocumentRevision` | Required before restoring section or scroll. |
| `logicalFragment` | optional string | Preferred restoration target. |
| `scrollOffset` | non-negative number | Fallback within the explicit reader scroll root. |
| `visitedAt` | timestamp | Used for bounded eviction only. |

### History Validation

- Consecutive navigation to the same artifact/revision updates the current entry instead of duplicating it.
- A new user navigation after Back removes forward entries.
- Oldest non-current entries are evicted above 50.
- Section/scroll restoration occurs only when revision still matches; otherwise start at the requested valid fragment or document top.

## 9. LinkResolution

Represents one server-side resolution of a user-selected Markdown link.

### Request

| Field | Type | Rules |
| --- | --- | --- |
| `contextId` | opaque string | Current validated context. |
| `sourceArtifactId` | opaque string | Current readable artifact. |
| `target` | string | Bounded raw Markdown destination, decoded once. |
| `expectedRevision` | `DocumentRevision` | Source must still match before the link is trusted. |

### Result

One of:

- `fragment`: current artifact ID plus validated logical fragment.
- `artifact`: a new/current `ArtifactDescriptor` with `role=reference` plus optional fragment.
- `external`: normalized `http` or `https` destination requiring explicit host-controlled user navigation.
- `inert`: stable reason for unsupported, unsafe, malformed, or unauthorized target.

Resolution never fetches an external URL and never returns arbitrary local file content.

## 10. ClarificationBinding and ClarificationDraft

### ClarificationBinding

Trusted presentation metadata derived from validated workflow/parser state.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | opaque string | Stable for context, artifact, revision, command, and question identity. |
| `artifactId` | opaque string | Must equal the rendered artifact. |
| `revision` | `DocumentRevision` | Must equal the rendered source before action. |
| `commandName` | string | Actual allowlisted workflow command; never a composite draft key. |
| `questionId` | string | Stable identity from section/question/source location. |
| `section` | optional string | Plain display context. |
| `question` | string | Current normalized question text. |
| `sourceRange` | internal range | Must point to eligible prose, never code or a comment. |
| `mode` | `wizard-batched` or `sdd-immediate` | Fixed by owning canvas. |

### ClarificationDraft

| Field | Type | Rules |
| --- | --- | --- |
| `bindingId` | opaque string | Resolves to one current binding. |
| `answer` | string | Existing canvas limits apply; non-empty after trim. |
| `status` | `queued`, `submitting`, `acknowledged`, `failed`, or `stale` | Wizard uses all states; SDD does not retain a batched draft after immediate completion. |
| `editVersion` | positive integer | Increments on every answer change so in-flight completion cannot consume newer text. |
| `error` | optional stable string | Contains no document body, credential, or absolute path. |

### Wizard Draft Transitions

| From | Event | To | Effect |
| --- | --- | --- | --- |
| none/`queued` | Save answer | `queued` | Preserve by full binding identity without dispatch. |
| `queued` | Apply/rerun or all eligible answered | `submitting` | Snapshot edit versions and block unsafe context changes. |
| `submitting` | Success for snapshot | `acknowledged` or removed | Consume only unchanged submitted versions. |
| `submitting` | Failure | `failed` | Preserve answer and clear local running state as current behavior requires. |
| Any draft | Source/binding revision changes | `stale` | Block dispatch pending revalidation/recovery. |
| Any unsubmitted | Back to workflow | removed | Preserve current discard behavior. |

## 11. RefreshEvent

A small invalidation notification carried by the existing SSE stream.

| Field | Type | Rules |
| --- | --- | --- |
| `contextHint` | optional opaque string | Lets a matching adapter refresh; never authorizes a read. |
| `kind` | `artifact-set`, `artifact-revision`, or `workflow-state` | No document bodies. |
| `artifactId` | optional opaque string | Advisory current-context identity. |
| `observedRevision` | optional `DocumentRevision` | Used to mark `changed`, not to install content. |

A refresh event cannot change selection, stage, feature, or completion state. Every resulting list/read call revalidates context.

## 12. ReaderAssetManifest

Generated build and packaging evidence copied with each plugin.

| Field | Type | Rules |
| --- | --- | --- |
| `schemaVersion` | integer | Starts at 1. |
| `sourceHash` | SHA-256 string | Covers canonical reader source and lockfile inputs. |
| `buildHash` | SHA-256 string | Covers allowlisted generated JS, CSS, and notices. |
| `files` | array | Relative path, byte size, and SHA-256 for every delivered asset. |
| `dependencies` | array | Name, locked version, license identifier, and notice source for bundled packages. |
| `builtWith` | object | Recorded Node, package manager, TypeScript, and bundler versions; contains no local path. |

Verification fails for missing, extra, stale, absolute-path-bearing, source-map, or unresolved-import output.

## 13. ForkReleaseRecord

Release evidence for independently maintained Wizard and SDD builds.

| Field | Type | Rules |
| --- | --- | --- |
| `forkOwner` | approved identity | Must be approved before publication. |
| `supportOwner` | approved identity | Required for intended-user release. |
| `forkRevision` | commit ID | Exact reviewed source. |
| `upstreamBase` | commit ID | Initial planning baseline is `96ed37d9134c63d6cb05236879a8e1dcea010e3f`. |
| `plugins` | array | Wizard/SDD plugin ID, independent version, payload hash, asset manifest hash, and installation source. |
| `hostBaseline` | object | Actual App/CLI/SDK-visible versions used for acceptance. |
| `providerEvidence` | object | Exactly one intended provider per canvas in the tested scope. |
| `validationEvidence` | references | Named deterministic, browser, packaged, and real-App results; no secrets or document bodies. |
| `knownGoodRollback` | object | Source/version/hash and verified restoration steps for each plugin. |
| `approvals` | references | Redistribution, installation, live-action, and publication approvals where applicable. |

A release record cannot mark an approval as passed from synthetic evidence and cannot claim support for a canvas whose actual App journey failed or was skipped.
