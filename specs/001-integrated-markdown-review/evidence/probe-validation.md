# Packaged Probe Validation: T011-T015

Date: 2026-09-09. Environment: Windows, Node v24.19.0, npm 11.17.0,
PowerShell 7.6.6, isolated Edge 152.0.4191.62 via Playwright 1.63.0.
Source baseline: `96ed37d9134c63d6cb05236879a8e1dcea010e3f` plus local implementation changes.

## Scope

This is pre-gate evidence for the opt-in `readerProbe=1` path in the two existing
canvas previews, not the complete Markdown review feature. Normal previews keep
their existing renderer and workflow-specific clarification controls. The probe
does not implement TOC, related-artifact history, secure review routes, or live
refresh. T016 real App acceptance is separate and is not implied by these results.

## Passing Checks

| Check | Command or procedure | Observed result |
| --- | --- | --- |
| T011 mount/update/unmount and passive-content checks | Reader `npm test` | 6 passed, 0 failed, 0 skipped |
| T012 copying, notices, source/build hashes, unsafe output and stale verification | `node --test scripts/canvas-reader/test/sync-assets.test.mjs` | 6 passed, 0 failed |
| T013 Wizard opt-in integration and existing clarification regressions | Wizard reader-probe and modals test files | 5 passed, 0 failed |
| T014 SDD actual guarded server and existing regressions | SDD `tests/*.test.mjs` | 5 passed, 0 failed |
| T015 actual-server fixtures, staging, no-overwrite and cleanup protection | `node --test scripts/canvas-reader/test/fixture-tools.test.mjs` | 5 passed, 0 failed |
| Actual Wizard/SDD browser shells with packaged probe | Reader `npm run test:browser` | 4 passed: both canvases at 1280px and 360px |
| Full existing Wizard suite including added probe regression | Wizard `npm test` | 284 passed, 0 failed, 0 skipped |
| Static checks and real asset build | Reader typecheck, lint, build, verify:package | All exit 0 |

## Browser Assertions

- Use the actual Phases/View artifact and SDD Specify controls, not a component demo.
- Packaged reader renders the owned fixture and visible artifact path/revision.
- Back unmounts the reader, restores invoking-control focus, and retains workflow content.
- No page errors, external requests, workflow dispatch, blocked write attempts, or fixture-file changes occur during review.
- The supplied fixture has synthetic Markdown only. The SDK is mocked for deterministic SDD tests; Wizard uses its actual server factory with prepared scanner data. These mocks cannot establish App host compatibility.
- Screenshots were inspected for the 360px preview in both canvases. The source-identity assertion caught and fixed an SDD global-header CSS interaction before acceptance.
- Screenshots and transient browser reports are under ignored `test-results/canvas-reader/`; they are not release artifacts.

## Packaged Identity

- Reader source hash: `sha256:b0c20676ad517f3ca05b04810f2d70bc38c9d4359e94afc1d4ec2bc3c760b722`.
- Reader build hash: `sha256:3e4f01c79d1a47c094d26528d44f6528240e764f86bc50ccdf84906932985cf8`.
- Both existing plugin copies match. Browser imports are closed; JS/CSS source maps, private path strings, external CSS assets, missing notices, and unexpected output fail verification.
- Staging copies complete existing plugin runtimes and the Wizard's locked js-yaml/argparse prerequisite, excludes reader development dependencies, refuses an existing destination, and records hashes in its staging manifest.
- Temporary test roots are deleted only when their snapshot is unchanged; a regression test confirms that unexpected user files are preserved.

## Corrections Observed

- Windows Host denial is tested with node:http because fetch normalized the Host header.
- Generated JS path checks inspect decoded strings through a parser instead of mistaking escaped Unicode regexes for UNC paths.
- Synthetic Wizard metadata uses its real boot-ready state and object-shaped pipeline entries. No production boot bypass was added.
- The embedded artifact-source group avoids SDD's page-wide header hiding rules.

No actual App probe, original application-worktree modification, live workflow run,
fork publication, installed-plugin update, or rollback was performed for these checks.
