# Quickstart: Validate Integrated Markdown Artifact Review

**Purpose**: Run the feature's focused validation after implementation.  
**Specification**: [spec.md](spec.md)  
**Plan**: [plan.md](plan.md)  
**Data model**: [data-model.md](data-model.md)  
**Contracts**: [artifact review HTTP](contracts/artifact-review-http.md), [reader mount](contracts/markdown-reader-mount.md), [release evidence](contracts/release-evidence.md)

This guide does not initialize Spec Kit, install a plugin, run a workflow stage, create a hosted fork, or publish code. Commands described as implementation deliverables will exist only after the corresponding tasks are complete.

## 1. Prerequisites

- Node.js 24.19.0 development baseline and npm available.
- Current checkout is `C:\Users\tussinghal\repos\spec-kit-copilot-markdown` with user changes preserved.
- Reader package and lockfile have been reviewed.
- Explicit approval exists before `npm ci`; use `--ignore-scripts` unless a specific lifecycle script has separately been reviewed and approved.
- Windows is available for path, junction, and reparse-point coverage.
- Playwright browser prerequisites are installed through the approved project process.
- Real App checks use an owned disposable workflow fixture or an already authorized repository, never the original EzPzSpec working checkout.
- Fork loading, plugin installation, live workflow actions, and publication are not implied by deterministic test approval.

Record before testing:

```powershell
$checkout = Join-Path $HOME 'repos\spec-kit-copilot-markdown'
$reader = Join-Path $checkout 'plugins\spec-kit-copilot-wizard\extensions\speckit-wizard-canvas\ui\markdown-reader'
$wizard = Join-Path $checkout 'plugins\spec-kit-copilot-wizard\extensions\speckit-wizard-canvas'
$sddTest = Join-Path $checkout 'plugins\spec-kit-copilot-sdd\extensions\sdd-canvas\tests'

Test-Path -LiteralPath (Join-Path $checkout '.git')
Test-Path -LiteralPath (Join-Path $reader 'package-lock.json')
```

Expected: both checks return `True`. Capture repository status and current revision through the approved Git tooling before and after validation; do not reset, stash, clean, or switch away from user work.

## 2. Early Two-Canvas Host Gate

Run this gate before broad implementation in an approved isolated GitHub Copilot App scope. Complete the table defined in [release-evidence.md](contracts/release-evidence.md#6-early-two-canvas-gate-record) for both existing canvases.

For Wizard and SDD separately:

Prerequisite: verify the effective App workspace is the owned fixture. This is recorded setup evidence, not a seventh gate condition.

1. Open the existing artifact view and load the smallest complete packaged reader probe through a host-supported development method.
2. Verify an invalid capability or cross-instance request is denied.
3. Verify the intended development or fork source identity.
4. Verify exactly one provider owns the existing canvas identity.
5. Return to the originating feature/stage and verify selection, scroll, and focus.
6. Verify repository status is unchanged.

Expected: all six conditions pass in both canvases. CLI discovery, a component-only page, or a new reader canvas does not pass this gate. Stop broad implementation if either existing canvas cannot satisfy it.

## 3. Install Reviewed Build Dependencies

This step requires the dependency approval listed above.

```powershell
Push-Location $reader
try {
    npm ci --ignore-scripts
} finally {
    Pop-Location
}
```

Expected: installation uses the committed reader lockfile, does not change package manifests or npm configuration, and runs no dependency lifecycle scripts. Do not enable all scripts to work around a failure.

## 4. Reader Checks

```powershell
Push-Location $reader
try {
    npm run typecheck
    npm run lint
    npm test
    npm run build
    npm run verify:package
} finally {
    Pop-Location
}
```

Expected:

- Typecheck and scoped lint pass.
- Markdown/GFM, heading/footnote collisions, two-reader isolation, unsafe content, images, links, state presentation, responsive TOC, focus/inert behavior, and mount/update/unmount fixtures pass.
- Build emits one dependency-closed browser ESM file, one CSS file, a manifest, and notices.
- Verification confirms both plugin copies match canonical source/build hashes, have no unresolved imports, and contain no source maps, absolute development paths, credentials, private fixtures, or unintended files.

## 5. Existing and New Canvas Tests

### Wizard

```powershell
Push-Location $wizard
try {
    npm test
} finally {
    Pop-Location
}
```

Expected: all existing Wizard tests and new artifact discovery/read, route authorization, revision, stale-response, navigation, and clarification regressions pass. Existing catalog, composition, environment, phase, and run-tracker behavior remains unchanged.

### SDD

```powershell
node --test `
  (Join-Path $sddTest 'sdd.test.mjs') `
  (Join-Path $sddTest 'artifact-review.test.mjs')
```

Expected: existing task scanning, gating, and question matching pass alongside new context, artifact, route/static authorization, navigation, revision, and refresh tests. SDD retains immediate one-question clarification and does not acquire Wizard batching.

### Required security cases

Confirm named passing results for:

- Context/artifact/cursor misuse and same filename in different features.
- Missing/wrong capability, Host, Origin, and cross-instance use.
- Traversal and encoded traversal; absolute, drive-relative, UNC, device, and alternate-data-stream paths.
- `.git`, directories, special files, symbolic links, junctions, and reparse escapes.
- Exact 5,242,880-byte boundary, one byte over, optional UTF-8 BOM, malformed UTF-8, NUL/binary, empty, deletion, and ordinary replacement races.
- Expected-revision mismatch and delayed response after file/feature change.
- Zero passive network requests, model actions, setup/install calls, shell/Git calls, or writes during reading/navigation.

Expected: every applicable safety result passes. A skipped Windows-sensitive case is recorded as `platform-gap` and blocks the corresponding release claim until explicitly dispositioned.

## 6. Browser Journeys in Actual Canvas Shells

```powershell
Push-Location $reader
try {
    npm run test:browser
} finally {
    Pop-Location
}
```

The browser runner uses the production reader bundle and the actual Wizard and SDD shell entry points with synthetic filesystem/session dependencies. It stubs model dispatch, setup, installation, and external network behavior.

Expected journeys in both shells:

1. Select feature and stage, then open the current artifact entry point.
2. Move through spec, research, plan, tasks, quickstart, checklist, contract, custom, and safe referenced Markdown that exists.
3. Navigate the TOC by pointer and keyboard.
4. Use file Back/Forward and restore per-file position only for matching revisions.
5. Create, change, replace, and delete synthetic artifacts without selection theft.
6. Return to the same workflow feature/stage, scroll position, and invoking control.
7. Close/reopen and verify observers, listeners, requests, and reader roots are disposed.
8. Exercise Wizard draft isolation/failure/in-flight behavior and SDD's distinct immediate clarification behavior.

Run at 360, 480, 640, 820, and 1,024 pixel reader widths, a wide desktop shell, and 200-percent zoom. Resize the reader container, not only the browser window.

Expected:

- No overlapping controls or page-level horizontal overflow.
- Drawer focus trap, Escape order, inert restoration, destination focus, and Back-to-workflow focus pass.
- No remote request occurs from raw HTML, image syntax, unsafe links, or instruction-like content.
- A 100 KiB document becomes usable within 1 second after receipt; a 5,242,880-byte document within 5 seconds; at least 19 of 20 measured navigation interactions visibly respond within 200 milliseconds. Failure blocks release rather than reducing the supported limit.
- Reports contain only redacted destinations/categories and approved screenshots, never capabilities, OAuth fragments, or document bodies.

## 7. Independent Packaged-Payload Checks

`npm run verify:package` invokes the repository staging verifier, but record the outcomes separately for Wizard and SDD.

For each plugin:

1. Stage its existing plugin subtree into an otherwise empty owned temporary root.
2. Provision only its approved existing runtime prerequisites.
3. Run handler, static-asset, import-closure, and synthetic artifact-review tests without access to the sibling plugin, canonical reader source, EzPzSpec, or developer `node_modules`.
4. Run two plugin instances concurrently and verify capability, cookie/transport, heading, footnote, state, and context isolation.
5. Confirm opening/navigating review starts no dependency installation, setup, Specify, Git, shell, or model action.
6. Compare payload and asset hashes with `manifest.json`.

Expected: Wizard and SDD each complete the core review independently. The installed payload contains no additional reader plugin or canvas registration.

## 8. Real GitHub Copilot App Acceptance

This section requires approved App development loading and an owned fixture. Do not use an invented deep link or claim that command-line discovery proves App rendering.

### Fixture

Prefer an owned detached worktree such as `C:\Users\tussinghal\repos\EzPzSpec-canvas-md-test`, created only after confirming that destination is absent and worktree creation is approved. Include synthetic workflow-shaped Markdown with duplicate headings, a safe relative reference, GFM content, a checklist, and distinct harmless clarification markers. Do not commit private fixture content into the plugin fork.

### Wizard journey

1. Open the confirmed fixture through the App's supported project UI.
2. Verify the App's effective working directory and Git root match the fixture.
3. Load the approved modified existing Wizard plugin and verify one provider for `speckit-wizard`.
4. Select the synthetic feature/stage and open its normal artifact link.
5. Navigate related files and TOC in wide and compact panel states.
6. Return and verify the original feature/stage, pipeline scroll, and invoking focus.
7. Verify no workflow/model action or source mutation occurred.

### SDD journey

Repeat the same journey through the existing SDD plugin and `sdd-canvas` identity. Verify SDD constitution, feature, stage, overwrite, clarification, and task behavior remains intact.

### Refresh journey

In the owned fixture only, add/update/delete a supporting artifact and verify scoped truthful refresh without selection theft. A genuine stage-generated artifact refresh is a separate test requiring explicit live-action approval; record simulated and live evidence separately.

Expected: both existing canvases demonstrate feature to artifact to related files/TOC to the same stage. Record actual App/CLI/platform versions, source revision, plugin versions, reader hashes, provider count, workspace-relative artifact revisions, approved screenshots, and before/after repository status.

## 9. Participant Acceptance Study

Use the same fixed, non-sensitive fixture and written tasks for at least 10 representative participants who have completed a Spec Kit workflow and did not implement this feature. Give no task-specific coaching.

For each anonymous participant identifier, record:

1. Whether the participant opened the specified artifact and reached the named section without leaving the canvas.
2. Elapsed time from seeing the task to focusing the named section.
3. A 1-to-5 rating for the combined clarity and predictability of artifact navigation, section navigation, and Back to workflow.
4. Whether assistance, an error, or an abandoned attempt occurred.

Expected: at least 9 of 10 participants complete the first-use task within 30 seconds, and at least 9 of 10 rate the combined experience 4 or 5. Record aggregate evidence under the `usability` category without participant names, document bodies, credentials, or unrelated activity.

## 10. Update and Rollback Rehearsal

This section requires approved fork ownership, installation scope, and installation/update actions.

Use only source/ref syntax supported by the exact tested host. For each of two consecutive rehearsals:

1. Record current source, versions, hashes, provider counts, and known-good restore targets.
2. Install or deliberately update the two existing fork plugins in the approved isolated scope.
3. Verify installed fork revision, independent plugin versions, payload/reader hashes, and one provider per canvas.
4. Repeat each real App core journey.
5. Restore both known-good source/version/hash targets.
6. Verify official plugins, project artifacts, sessions, settings, original application repositories, and the installed handoff helper are unchanged.

Expected: both rehearsals complete within 30 minutes total per the specification and produce the [release evidence contract](contracts/release-evidence.md). Do not silently replace official plugins or infer source identity from a marketplace name.

## 11. Completion Criteria

The feature is ready for fork-owner release review only when:

- All deterministic reader, service, security, existing-suite, browser-shell, and independent-package checks pass.
- Both real App existing-canvas journeys pass.
- The standardized participant study meets both 9-of-10 thresholds.
- Every platform gap has an explicit disposition and no unsupported security claim remains.
- Source reuse is approved or implementation is independently authored.
- Fork ownership/support/publication and installation scope are approved.
- Source, versions, payload and reader hashes, provider count, notices, host baseline, and known-good rollback are recorded.
- Any live stage-output claim has separately approved evidence.
- Repository status confirms no change to EzPzSpec Feature 005, either original application checkout, the installed handoff helper, unrelated official plugins, or unapproved destinations.

Assessment and Bug Fix remain outside this core completion decision until their later adapters receive equivalent independent validation.
