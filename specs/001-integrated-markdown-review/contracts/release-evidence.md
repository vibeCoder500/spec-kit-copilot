# Contract: Fork Package and Release Evidence

**Status**: Required before intended-user release  
**Applies to**: Enhanced existing Wizard and SDD plugins  
**Does not authorize**: Fork creation, push, installation, live workflow execution, or publication

## 1. Package Boundaries

Each plugin must be independently installable from its own existing subtree:

- `plugins/spec-kit-copilot-wizard/`
- `plugins/spec-kit-copilot-sdd/`

Each subtree contains its server/runtime code, canvas adapter, complete generated reader JavaScript/CSS, reader asset manifest, and third-party notices. Neither payload may import from the other plugin, the canonical reader source directory at runtime, an EzPzSpec checkout, developer `node_modules`, a CDN, or an absolute developer path.

No standalone Markdown plugin, new canvas identity, preset, npm product, or marketplace reader entry is part of the release.

## 2. Reader Asset Manifest

Each delivered generated-asset directory contains `manifest.json` with this shape:

```json
{
  "schemaVersion": 1,
  "sourceHash": "sha256:<64 lowercase hex>",
  "buildHash": "sha256:<64 lowercase hex>",
  "files": [
    {
      "path": "markdown-reader.js",
      "bytes": 123456,
      "sha256": "<64 lowercase hex>"
    }
  ],
  "dependencies": [
    {
      "name": "react-markdown",
      "version": "10.1.0",
      "license": "MIT",
      "noticeSource": "package metadata or license path"
    }
  ],
  "builtWith": {
    "node": "recorded exact version",
    "packageManager": "recorded exact version",
    "typescript": "recorded locked version",
    "bundler": "vite 8.0.16"
  }
}
```

### Manifest invariants

- `sourceHash` covers canonical source, package manifest, lockfile, TypeScript configuration, and bundler configuration in deterministic path order.
- `buildHash` covers every delivered JS, CSS, and notice file in deterministic path order.
- `files` is complete and allowlisted; verification fails on extra or missing output.
- Both plugin copies have the same reader `sourceHash` and reader-code `buildHash` for a release.
- No source map, credential, capability, OAuth data, document body, private fixture, absolute path, or unrelated application source is delivered.
- Every bundled direct/transitive dependency has a locked version and reviewed license/notice record.

## 3. Independent Plugin Version Record

For each changed plugin, record:

| Field | Wizard | SDD |
| --- | --- | --- |
| Existing plugin ID | `spec-kit-copilot-wizard` | `spec-kit-copilot-sdd` |
| Existing canvas ID | `speckit-wizard` | `sdd-canvas` |
| Baseline plugin version | `0.1.1` | `0.1.0` |
| Fork release version | Required, independently chosen | Required, independently chosen |
| Plugin manifest updated | Required | Required |
| Matching marketplace entry updated if used | Required | Required |
| README/version note updated | Required | Required |
| Extension schema version | Remains independent | Remains independent |
| Internal package version | Remains separate from plugin semver | Not applicable unless later introduced |

Unchanged Assessment, Bug Fix, core skills, preset, and marketplace metadata versions are not synchronized merely because Wizard or SDD changes.

## 4. Fork Release Record

A release record is complete only with:

```json
{
  "fork": {
    "owner": "approved owner",
    "repository": "approved repository",
    "visibility": "approved visibility",
    "supportOwner": "approved support owner",
    "revision": "exact reviewed commit",
    "upstreamBase": "96ed37d9134c63d6cb05236879a8e1dcea010e3f"
  },
  "hostBaseline": {
    "copilotApp": "actual tested version",
    "copilotCli": "actual tested version",
    "platform": "actual tested OS/version"
  },
  "plugins": [
    {
      "id": "spec-kit-copilot-wizard",
      "version": "fork version",
      "source": "verified supported installation source",
      "payloadSha256": "<64 lowercase hex>",
      "assetManifestSha256": "<64 lowercase hex>",
      "providerCount": 1,
      "knownGoodRollback": {
        "source": "verified restore source",
        "version": "verified version",
        "sha256": "verified payload hash"
      }
    }
  ],
  "approvals": {
    "sourceReuse": "approval reference or independently-authored declaration",
    "installation": "approval reference",
    "liveWorkflow": "approval reference or explicitly not run",
    "publication": "approval reference"
  },
  "evidence": []
}
```

Approval references identify the approving authority and bounded operation without embedding credentials or private conversation bodies.

The executable validator also requires `fork.intendedUsers`,
`fork.publicationAuthority`, and `approvals.forkOwnership`; each plugin includes
its `readerBuildHash`. Evidence artifacts use repository-relative `path` and
SHA-256 fields. The CLI verifies each referenced file's hash without following
symlinks. README version agreement is checked using a Markdown table parser.

Structured acceptance measures are recorded as `usability` (integer `participants`,
`reachedSectionWithin30s`, `artifactNavigationAtLeast4`, `sectionNavigationAtLeast4`,
`returnNavigationAtLeast4`, and boolean `uncoached`) and `rollback` (two `rehearsals`
with `passed` and `elapsedMs`, plus `unrelatedStatePreserved`). These fields report
actual authorized observations; synthetic unit-test specimens are not release
records. A failed or missing native/live-workflow/study/rollback gate blocks release.

`node scripts/canvas-reader/release-metadata.mjs` checks the actual record and
exits unsuccessfully when it is missing or blocked. CI's `--if-present` mode
reports an absent record as `not-requested` with `publicationReady=false`; it
does not turn local automated success into release approval or publish anything.

## 5. Validation Evidence Item

Every required check produces a structured evidence item:

| Field | Rules |
| --- | --- |
| `id` | Stable acceptance/test ID. |
| `category` | `unit`, `service`, `security`, `browser`, `package`, `app`, `performance`, `accessibility`, `usability`, `update`, or `rollback`. |
| `plugin` | Wizard, SDD, both, or reader. |
| `status` | `pass`, `fail`, or `platform-gap`. |
| `commandOrProcedure` | Bounded command or named manual procedure; no bearer URL. |
| `environment` | Recorded relevant version/viewport/platform details. |
| `resultSummary` | No document body, absolute private path, capability, credential, or raw OAuth URL. |
| `artifacts` | Hashes or approved screenshot/report references. |
| `sourceBefore` and `sourceAfter` | Revision and clean/preserved status evidence where required. |
| `disposition` | Required for every failure or platform gap. |

A platform-sensitive security gap blocks the corresponding security claim and release unless an authorized disposition narrows the supported claim. Core Wizard and SDD App journeys cannot be waived by a browser-only result.

## 6. Early Two-Canvas Gate Record

Before broad implementation, verify the effective App workspace as a prerequisite, then all six rows must pass in an approved isolated App scope:

| Condition | Wizard | SDD |
| --- | --- | --- |
| Existing artifact view opens packaged preview asset | PASS required | PASS required |
| Invalid local access is denied | PASS required | PASS required |
| Intended fork/development source identified | PASS required | PASS required |
| Exactly one provider owns existing canvas identity | PASS required | PASS required |
| Return restores originating workflow context | PASS required | PASS required |
| Repository status is unchanged | PASS required | PASS required |

Any failure stops broad implementation until the host or isolation design is explicitly resolved. CLI discovery, a standalone reader, or a component fixture cannot fill this record.

## 7. Required Release Matrix

The release record references named passing evidence for:

- Reader parse/render, GFM, heading/footnote collision, two-reader isolation, URL/image/raw-HTML safety, and lifecycle cleanup.
- Artifact membership, pagination, path/encoding/size/race/revision/auth errors, refresh, and stale-generation suppression.
- Wizard artifact navigation, return context, clarification queue/apply/discard/failure/in-flight behavior, and existing regression suite.
- SDD artifact navigation, return context, immediate current-question clarification, stage/constitution/task behavior, and existing regression suite.
- Playwright journeys in the actual Wizard and SDD shells at 360, 480, 640, 820, and 1,024 pixel reader widths, wide desktop shell, and 200-percent zoom.
- Independent empty-root payload tests for Wizard and SDD, concurrent instances, complete assets/import closure, no preview-time setup/install/model call, and no sibling-checkout access.
- Recorded performance thresholds at 100 KiB and exactly 5,242,880 bytes; failure blocks release rather than reducing support.
- Real Copilot App feature to artifact to related files/TOC to same-stage journeys in both existing canvases.
- A standardized uncoached study with at least 10 representative participants, at least 9 reaching a named section within 30 seconds, and at least 9 rating artifact navigation, section navigation, and workflow return at least 4 out of 5.
- Separately approved live stage-output refresh, or an explicit `not run - approval absent` record that does not satisfy FR-059 or claim live stage-output acceptance.
- Two consecutive deliberate update and known-good rollback rehearsals within 30 minutes total and with no unrelated state changes.

## 8. Real App Evidence

Each real-host run records only:

- Date and approved loading method.
- Fork/development source revision and reader asset hashes.
- Actual App/CLI/platform versions.
- Effective workspace identity expressed through an approved non-secret fixture identifier and Git revision, not an unnecessary absolute path in published evidence.
- Existing plugin/canvas identity and provider count.
- Selected feature/stage and visited workspace-relative artifact paths/revisions.
- Viewport/zoom, approved screenshots, return-to-workflow state, and before/after source status.
- Redacted failure categories and request destinations.

Never record bearer/capability URLs, OAuth fragments, document bodies, private native profiles, credentials, or unrelated authenticated-browser logs.

## 9. Installation, Update, and Rollback Procedure Contract

An authorized operator must be able to:

1. Record existing official/fork plugin state without changing it.
2. Establish the approved isolated scope and exactly one intended provider per canvas.
3. Install Wizard and SDD independently from a verified supported fork source.
4. Verify installed source revision, plugin version, payload hash, reader manifest hash, and provider count.
5. Complete the core App journey in each canvas.
6. Deliberately update to the candidate and repeat source/provider/journey checks.
7. Restore each recorded known-good source/version/hash.
8. Verify official plugins, project artifacts, sessions, settings, original repositories, and the installed handoff helper remain unchanged.

The procedure must use syntax supported by the exact tested host. It cannot invent branch/tag suffixes or infer installed revision from a repository name alone.

## 10. Publication Gate

Publication is allowed only when:

- Fork owner, repository, visibility, intended users, support responsibility, and publication authority are approved.
- Source reuse is approved or the implementation is independently authored.
- Both plugin payloads pass independent verification and all required notices are present.
- Both existing-canvas real App journeys pass.
- Installation/update source and one-provider isolation are verified.
- Known-good rollback passes twice.
- Known gaps and narrowed claims are recorded.

Upstream issue, PR, review, merge, or official marketplace publication is not required and is not part of this gate.
