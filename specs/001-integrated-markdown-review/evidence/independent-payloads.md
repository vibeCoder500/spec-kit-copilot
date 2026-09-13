# Independent Payload Verification

Status: PASS for T087-T091 local package and validation-tool requirements.
Recorded 2026-09-13T10:51:27.459Z on Windows with Node 24.19.0.
These are local development payloads, not versioned or published fork releases.

## Isolation Procedure

1. Create a new owned synthetic workspace for each plugin.
2. Stage exactly one existing plugin into an absent target using
   `stageAppFixture({ workspace, target, pluginIds: [id] })`.
3. Verify the directory contains only that plugin and the generated staging
   inventory. The sibling plugin and development reader package are absent.
4. Run `verifyStagedPlugin({ pluginRoot })`: parse ESM/CommonJS and inline browser
   imports, validate the known fixed dynamic loaders, reject outside/remote or
   uninstalled dependencies, and verify reader assets, hashes, and notices.
5. Start two actual existing-server instances from the staged plugin using the
   fixture SDK/scanner boundary. Read the primary artifact from its owning
   instance, then attempt a foreign-context read in the other instance.
6. Assert zero workflow dispatches and unchanged source hashes. Stop both servers,
   remove their verified owned fixtures, and clean only the owned staging root.

Wizard's existing fixed core-inventory loader is verified from its AST and required
packaged target. Its `/ui/app.js` shell URL is resolved as an existing local server
route. Other dynamic imports are rejected except the known capability-gated reader
and adapter loaders. The host-provided Copilot SDK is the only permitted external
runtime package; existing Wizard `js-yaml` dependencies are inside its payload.

## Exact Payloads

| Field | Wizard | SDD |
| --- | --- | --- |
| Plugin | `spec-kit-copilot-wizard` | `spec-kit-copilot-sdd` |
| Current development version | `0.1.1` | `0.1.0` |
| Files | 111 | 18 |
| Total bytes | 2,777,638 | 1,273,914 |
| Concurrent contexts | 2 | 2 |
| Own primary read | 200 | 200 |
| Foreign context read | 404 | 404 |
| Workflow dispatches | 0 | 0 |
| Workspace changed | No | No |

- Wizard payload SHA-256: `abc376c2f9e46b3cad892742378cd85f322ea1febe220464ad4a92ba5057ca4d`.
- SDD payload SHA-256: `2dc8adb2c38cba1f6b5b8102afeb6c559b2b3e91dcf54fd2be8a9d6e8b0fddc4`.
- Identical reader manifest SHA-256: `54ff8f4909d51f685797709e7bd627759d5f69edf76bde8844fb5232d33622ea`.
- Identical reader build hash: `sha256:5f51f164a1884bd262e5465869bc0ec3b3ff2d20fbd1642fdd741ada3f24f253`.

Payload hashes cover deterministic sorted `relative-path + NUL + file-SHA-256`
records joined by newlines, not archive-container metadata. File counts exclude
the staging inventory outside each plugin root. Later source edits require a new
inventory; the values here identify this exact tested checkpoint.

## Reproducible Checks

```text
node --test --test-name-pattern="stages alone|independent payload" scripts/canvas-reader/test/sync-assets.test.mjs
6 passed.

node --test scripts/canvas-reader/test/release-metadata.test.mjs
6 passed using synthetic in-memory specimens, not claimed real release evidence.

npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:tools
29 passed; 0 failed or skipped.

npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run lint
Passed.

node scripts/canvas-reader/release-metadata.mjs --if-present
{"ok":false,"status":"not-requested","publicationReady":false,"errors":["release_record_absent"]}
```

The independent cases also deny missing assets/notices, sibling/absolute/remote/
uninstalled imports, and forbidden private files without deleting those test files.
The six staged [security tests](us6-security.md) guard process, setup, model,
remote-fetch, write, and diagnostic surfaces. Full prior replay: 371 canvas,
32 reader, and 38 actual-shell browser tests passed. Original red results remain
in [T087](red/T087.md) and [T088](red/T088.md).

## CI and Release Boundary

The completed CI definition includes Windows/Linux, locked lifecycle-disabled
installs, audit, typecheck/lint, non-repairing build verification, both canvas
suites, reader/tool tests, independent payloads, browser journeys, and optional
release-record validation. It uploads only synthetic preview PNGs, not raw logs,
traces, capabilities, or browser profiles. Windows symlink coverage is mandatory
in CI; its local mandatory-mode check passed. YAML parsing and local command gates
passed; hosted runners have not been executed in this session.

No fork destination, support owner, release version, installation authority,
participant results, live stage-output run, update/rollback rehearsal, or
publication approval is inferred from these results. T092 is the next authority
gate. Native [TOC screenshots](native-toc-proof-2026-09-13.md) remain evidence for
their earlier recorded App payload, not the current security build.
