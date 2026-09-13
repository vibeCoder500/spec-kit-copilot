# Contract: Artifact Review HTTP and Events

**Status**: Planned additive contract  
**Consumers**: Existing Wizard and SDD browser adapters  
**Owners**: Each existing canvas server

## 1. Compatibility and Authorization

- This contract adds review routes to each existing server. It does not replace or change current `/api/artifact`, artifact query fields, clarification routes, workflow routes, `/api/events`, or `/events` response shapes.
- Every request uses the owning canvas's existing capability, exact Host check, Origin check when present, instance isolation, loopback binding, and request-body limits.
- Review context IDs, artifact IDs, revisions, and cursors are opaque data, not bearer credentials. Possessing one without the canvas capability grants no access.
- All responses use `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff`. JSON uses UTF-8.
- Review routes never call `session.send`, run setup, install dependencies, mutate workflow state, or write workspace files.

## 2. Shared JSON Conventions

### Success envelope

```json
{
  "ok": true,
  "data": {}
}
```

### Error envelope

```json
{
  "ok": false,
  "error": {
    "code": "invalid_context",
    "message": "Review context is no longer available.",
    "retryable": false
  }
}
```

`message` is bounded user-facing text. It never contains an absolute path, capability, document body, stack trace, or raw operating-system exception.

### Common value formats

- `context`: non-empty opaque string, maximum 256 characters.
- `artifactId`: non-empty opaque string, maximum 256 characters.
- `cursor`: optional opaque string, maximum 1,024 characters.
- `revision`: `sha256:` followed by 64 lowercase hexadecimal characters.
- Relative display paths use `/`, are bounded to 2,048 characters, and never serve as read authority.
- Timestamps are UTC RFC 3339 strings.

## 3. List Artifacts

### Initialize Context

`GET /api/review/context?stage=<stage>&source=<optional-source-hint>&feature=<optional-feature>`
is the read-only bootstrap for opaque identifiers. Hints are matched against the
owning server's current scanner/workflow membership, never used as path authority.
It returns the first artifact page plus `primaryArtifactId` inside the normal
success envelope. Existing authorization and typed-error rules apply. This creates
only bounded in-memory review state, never a workflow action or persistent file.

### List Request

```http
GET /api/review/artifacts?context=<context-id>&cursor=<optional-cursor>
```

### List Success: `200 OK`

```json
{
  "ok": true,
  "data": {
    "contextId": "ctx_opaque",
    "generation": 4,
    "items": [
      {
        "id": "artifact_opaque",
        "relativePath": "specs/001-example/spec.md",
        "label": "Specification",
        "role": "primary",
        "owningStage": "specify",
        "owningCommand": "speckit-specify",
        "originArtifactId": null,
        "availability": "available",
        "suffix": ".md",
        "modifiedAt": "2026-09-09T12:00:00Z",
        "byteSize": 42000
      }
    ],
    "nextCursor": null,
    "limitReached": false
  }
}
```

### List Rules

- Revalidate the current canvas instance, authoritative workspace, workflow scope, and context generation before listing.
- Return no more than 200 descriptors.
- Inspect no more than 10,000 entries cumulatively across one context-bound cursor chain.
- Order by role, owning stage/command, then normalized relative path.
- `availability=expected` may describe an output that has not been generated; it cannot authorize content.
- When the cumulative inspection cap is reached before discovery completes, return the available partial page as `200 OK` with `limitReached=true` and no `nextCursor`; do not return `429` for this condition or silently treat the list as complete.
- A cursor is valid only for the same context, generation, ordering, cumulative inspected-entry count, and bounded lifetime.

## 4. Read Artifact Content

### Content Request

```http
GET /api/review/content?context=<context-id>&artifactId=<artifact-id>&expectedRevision=<optional-sha256-revision>
```

### Content Success: `200 OK`

```json
{
  "ok": true,
  "data": {
    "artifact": {
      "id": "artifact_opaque",
      "relativePath": "specs/001-example/spec.md",
      "label": "Specification",
      "role": "primary",
      "owningStage": "specify",
      "owningCommand": "speckit-specify",
      "originArtifactId": null,
      "availability": "available",
      "suffix": ".md",
      "modifiedAt": "2026-09-09T12:00:00Z",
      "byteSize": 42000
    },
    "revision": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "content": "# Example\n",
    "byteSize": 10,
    "modifiedAt": "2026-09-09T12:00:00Z",
    "sourceKind": "working-tree"
  }
}
```

### Content Rules

- Resolve the descriptor again from current server-owned membership; never convert `artifactId` directly into a path.
- Validate Markdown suffix, path syntax, lexical and canonical containment, metadata exclusion, regular-file type, and link/junction/reparse policy on every read.
- Enforce 5,242,880 bytes while reading, not only with a preliminary stat.
- Compute revision from exact bytes before removing an optional UTF-8 BOM for presentation.
- Decode UTF-8 strictly and reject NUL/binary content.
- Compare file identity and metadata around the read. Do not return partial content after a replacement race.
- If `expectedRevision` is supplied and current bytes differ, return `changed_source` without a document body.
- Empty and no-heading are successful content responses; the browser derives those presentation states from validated content.
- Successful content includes a `clarifications` array. Each eligible prose marker has a server-owned `id`, `contextId`, `artifactId`, `revision`, `questionId`, exact `question`, `section`, zero-based `index`, `sourceStart`, `sourceEnd`, actual `commandName`, and `mode` (`wizard-batched` or `sdd-immediate`). Code, comments, links, and ineligible artifacts yield no controls. SDD supplies controls only for the primary current specification.

## 5. Resolve a Link

### Link Request

```http
POST /api/review/resolve-link
Content-Type: application/json

{
  "contextId": "ctx_opaque",
  "sourceArtifactId": "artifact_opaque",
  "expectedRevision": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "target": "research.md#decision"
}
```

The accepted JSON body for this route is at most 16 KiB and rejects unknown excessive fields rather than silently truncating them.

### Success: fragment in current document

```json
{
  "ok": true,
  "data": {
    "kind": "fragment",
    "artifactId": "artifact_opaque",
    "fragment": "decision"
  }
}
```

### Success: validated referenced artifact

```json
{
  "ok": true,
  "data": {
    "kind": "artifact",
    "artifact": {
      "id": "reference_opaque",
      "relativePath": "specs/001-example/research.md",
      "label": "research.md",
      "role": "reference",
      "originArtifactId": "artifact_opaque",
      "availability": "available",
      "suffix": ".md"
    },
    "fragment": "decision"
  }
}
```

### Success: external user action

```json
{
  "ok": true,
  "data": {
    "kind": "external",
    "url": "https://example.com/",
    "requiresUserAction": true
  }
}
```

### Success: inert target

```json
{
  "ok": true,
  "data": {
    "kind": "inert",
    "reason": "unsupported_scheme"
  }
}
```

### Link Rules

- Verify that the source artifact still belongs to the context and still has `expectedRevision` before interpreting its target.
- Decode transport once. Resolve relative paths once from the source artifact folder.
- A file target must be `.md` or `.markdown`, beneath the authorized workspace, outside metadata, and an ordinary file satisfying the full read path policy.
- A fragment is a logical heading fragment, not a browser-supplied DOM ID.
- `http` and `https` return an external user-action descriptor; the server never fetches the URL.
- Protocol-relative, `javascript`, `data`, `file`, command, custom-scheme, malformed, unsafe, and unauthorized targets return `inert` or a typed denial.

## 6. Typed Outcomes

| HTTP | Code | Meaning | Retryable |
| --- | --- | --- | --- |
| 400 | `invalid_request` | Missing, malformed, duplicate, or oversized input. | No |
| 403 | `forbidden` | Existing capability, Host, Origin, or instance check failed. | No |
| 404 | `invalid_context` | Context expired, changed generation, wrong scope, or wrong instance. | No |
| 404 | `artifact_unavailable` | Current context has no matching descriptor or a formerly available target was deleted. | Yes after list refresh |
| 409 | `changed_source` | Expected revision differs or source changed during the read. | Yes |
| 413 | `artifact_too_large` | Source exceeds 5,242,880 bytes. | No |
| 415 | `unsupported_artifact` | Suffix, membership, ordinary-file, metadata, or path policy failed. | No |
| 422 | `invalid_encoding` | Source is not strict UTF-8 or contains NUL/binary data. | No |
| 500 | `read_failed` | Authorized source could not be read for a bounded non-sensitive reason. | Yes |
| 503 | `workspace_unavailable` | Authoritative workspace or current scanner state is unavailable. | Yes |

Servers may deliberately collapse unsafe path/membership details into `unsupported_artifact` so responses do not reveal unrelated filesystem state.

## 7. Existing Event Stream Extension

No new stream is introduced. The current Wizard `/api/events` and SDD `/events` may include an additive review invalidation payload:

```json
{
  "review": {
    "kind": "artifact-set",
    "contextHint": "ctx_opaque",
    "artifactId": null,
    "observedRevision": null
  }
}
```

Allowed `kind` values are `artifact-set`, `artifact-revision`, and `workflow-state`.

- Event data never contains document bodies, absolute paths, capabilities, or approval state.
- An event does not authorize a list/read, choose an artifact, change a stage, or report workflow completion.
- The adapter refreshes only if the hint matches its current context, then revalidates through the HTTP contract.
- Existing heartbeat, reconnect, and close behavior remains owned by each server.

## 8. Validate Clarifications

`POST /api/review/validate-clarifications` accepts a JSON body of at most 16 KiB:

```json
{
  "contextId": "ctx_opaque",
  "artifactId": "artifact_opaque",
  "expectedRevision": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "commandName": "speckit-clarify",
  "answers": [{ "questionId": "question_opaque", "index": 0, "question": "Which scope?", "answer": "This feature." }]
}
```

- This endpoint is read-only: it validates current membership, exact bytes/revision, owning command, unique question IDs, exact questions, and optional indices. It never submits a command.
- Wizard accepts one to 100 bounded answers for one artifact/command/revision. SDD accepts exactly one. A successful response contains `data.clarifications`, the revalidated bindings and trimmed answers. Unknown top-level fields are rejected.
- The existing explicit submit boundary repeats validation immediately before dispatch. Wizard sends the binding under the additive `review` field of `/api/phase/submit`. SDD sends `contextId`, `artifactId`, `expectedRevision`, and `questionId` alongside the existing feature/index/question/answer fields of `/api/clarify` and verifies feature correspondence. Existing non-review callers remain supported.
- Wizard drafts are in memory and keyed by context, artifact, actual command, revision, and question. Source changes block dispatch. Recovery requires explicit user confirmation against a new current revision with the same artifact, command, and exact question; ambiguous duplicate questions are not automatically rebound. Back discards the context's unsubmitted drafts. Acknowledgement consumes only the submitted edit version.
- SDD does not acquire a draft batch. Both adapters block navigation/close during their explicit submission and preserve input on failure.

## 9. Contract Tests

Both servers must prove:

- Legacy routes and current callers remain unchanged.
- Every new route rejects missing/wrong capability, Host, Origin, instance, context, and generation.
- Same artifact names in two contexts cannot cross-read.
- Traversal, encoded traversal, absolute/drive-relative/UNC/device/ADS paths, `.git`, non-regular files, and link/junction escapes fail without content disclosure.
- Exact byte cap, BOM, malformed UTF-8, NUL/binary, empty, deletion, replacement, and expected-revision cases return the declared outcome.
- Listing bounds, deterministic pagination, cumulative cursor counts, partial `200` with `limitReached=true` and no next cursor, stale cursors, new-file discovery, and no selection side effects pass.
- Link resolution never performs a network request or resolves an unsafe local target.
- Reading/navigation produces no model, setup, installation, shell, Git, or write call.
