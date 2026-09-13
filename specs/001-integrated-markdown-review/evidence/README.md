# Implementation Evidence

Evidence in this directory is a record of observed checks, not approval to run them.
Task checkboxes are updated only after the task's stated output and validation exist.

## Record Format

Each task or grouped validation record identifies:

- Task IDs and requirement IDs covered.
- Date, tested source or source hash, actual OS, Node, npm, and relevant host versions.
- Check category: unit, service, security, browser, package, App, performance, accessibility, usability, update, or rollback.
- Status: pass, fail, platform-gap, blocked, or not-run. Only observed successful checks receive pass.
- Exact bounded command or named procedure, exit code, and expected versus observed outcome.
- Relative artifact paths, byte counts, hashes, approved screenshot/report references, and relevant viewport sizes.
- Before/after repository status and any intended fixture changes.
- Approval reference and scope for dependency installation, fixture creation, App loading, live actions, or publication.
- Disposition and next prerequisite for every failure, gap, blocked action, or unexecuted check.

## Test-First Records

Each test-first task has a separate `red/T###.md` file. It records the test command,
the missing behavior, and the observed assertion failure or specifically expected
missing implementation. A syntax, dependency, or harness error is not proof of the
intended behavioral failure. Repair such errors before marking that task complete.

Green results are recorded after implementation. Preserve the original red record
and reference it from the green record; do not overwrite it with a later result.
The final integrated replay references prior evidence and records changed outcomes.

## Sensitive Data

- Never record capability URLs, token/cookie/header values, sign-in URLs, credentials, native profiles, absolute private paths, document bodies, or clarification answers.
- Use synthetic fixture identifiers and workspace-relative paths. Keep private test data out of Git and release payloads.
- Capture screenshots only for owned synthetic content or separately approved material.
- Project terminal/browser errors to stable categories before recording them. Do not copy unrelated authenticated browser logs.
- Record approval decisions without requesting or storing any secret.

## Limits of Evidence

- Unit and browser checks do not prove actual Copilot App rendering or single-provider isolation.
- Plugin discovery is not App acceptance. Both existing canvases must pass all six T016 conditions before T017 or later tasks.
- A skipped junction test is a platform-gap, not a security pass.
- Simulated file writes are separate from the separately approved live stage-output test.
- Performance results include hardware, input byte count, timing interval, and observed thresholds. The 5,242,880-byte limit is not silently reduced.
- A release record cannot certify approval, install/update behavior, or rollback without observed evidence for that operation.

## Current Setup Results

T001-T002 baseline, approvals, lockfile review, and dependency audit are recorded in
[implementation-gates.md](implementation-gates.md). Subsequent records are created
only when their checks actually run; absent records are not implied passes.

The [September 13 host probe record](host-probe-2026-09-13.md) retains the current
payload inventory, four hash-verified browser screenshots, and native SDD and
Wizard reader screenshots after the approved App update and prerequisites. Both
canvases passed the early T016 host gate. This is not full E2E acceptance.

The [EzPzSpec reference observations](reference-viewer-2026-09-13.md) record the
requested TOC/preview presentation without retaining private document content.

The [native TOC proof](native-toc-proof-2026-09-13.md) contains the requested actual
App screenshots of both canvases with the navigation rail and Markdown preview,
served-source hashes, native section/file/history/return checks, and preservation
results. T001-T056 are complete; later implementation and release gates remain.
