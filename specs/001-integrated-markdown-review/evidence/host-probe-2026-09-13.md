# Host Probe Evidence: 2026-09-13

Status: **T016 passed for both existing canvases**.
This is the early host feasibility gate, not full-feature real-App acceptance.
T001-T016 are complete; T017-T108 remain unchecked at this checkpoint. This records
T013-T016 probe work and focused FR-057 verification, not later-story acceptance.

## Environment and Provenance

- Windows; PowerShell 7.6.6; Node 24.19.0; npm 11.17.0.
- Initial Copilot App executable version: 1.1.16. Normal launch ran its updater;
  no explicit update, restart, installation, or elevation action was accepted
  during that initial attempt. A later explicitly approved restart updated the
  executable to 1.1.19; see the restart record below.
- Browser checks used the installed Edge channel in an isolated Playwright
  context. The exact browser version was not captured in this replay.
- Development checkout HEAD: `96ed37d9134c63d6cb05236879a8e1dcea010e3f`, with
  uncommitted reader changes. HEAD alone does not identify the tested payload.
- Reader source hash: `sha256:b0c20676ad517f3ca05b04810f2d70bc38c9d4359e94afc1d4ec2bc3c760b722`.
- Reader build hash: `sha256:3e4f01c79d1a47c094d26528d44f6528240e764f86bc50ccdf84906932985cf8`.
- [Staged payload inventory](staging-manifest-2026-09-13.json) records 114 files,
  their relative paths, byte counts, and SHA-256 values for both complete local
  plugin payloads, including the host-open changes. All 114 hashes were rechecked
  before retaining the inventory. Inventory size: 24,504 bytes; SHA-256:
  `e8978cb57e528177560767a74fc90dd877ed4691670f049dade7e0a8b08babea`.
- Owned staging fixture ID: `7ad6452f-c85f-4aeb-bea3-8d32d8295d1a`.

## Host-Open Regression

Both existing open handlers previously omitted the `readerProbe=1` URL flag,
so host-created views could not activate the packaged development probe. Each
canvas now declares a boolean `readerProbe` input and adds the query flag only
for boolean `true`. The normal URL, server instance, capability, and canvas ID
are unchanged; the string `"true"` does not activate it.

For each canvas, a test first failed with the intended `null !== "1"` assertion,
then passed after the corresponding handler change. The Wizard host test mocks
the SDK and deliberately stops boot before dependency installation or setup;
it is not evidence that real Wizard startup has no side effects.

Commands below ran from the development repository root. Each successful command
exited 0. The intended red test runs exited 1.

```powershell
node --test plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/reader-probe.test.mjs
node --test plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/reader-host-open.test.mjs
node --test "plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/*.test.mjs" "plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/*.test.mjs"
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run verify:package
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser
```

| Check | Expected | Observed |
| --- | --- | --- |
| SDD host probe regression | Strict boolean opt-in, default off | 1 pass after intended red |
| Wizard host probe regression | Strict boolean opt-in, default off | 1 pass after intended red |
| Combined existing canvas suites | No regressions | 290 tests, 290 pass, 0 fail/skip/cancel |
| Package verification | Both distributions match | 2 plugins verified; hashes above |
| Actual-shell browser probes | Both canvases at both widths | 4 pass, 0 fail |
| Editor diagnostics | No new host/test diagnostics | No errors in the four touched host/test files |

Reader unit, typecheck, lint, audit, and build results from September 9 remain
historical in [probe-validation.md](probe-validation.md); they were not rerun
as part of this replay. No remote CI result is claimed.

## Retained Browser Screenshots

These are **synthetic-workspace browser screenshots of the existing canvas
shells**, not native Copilot App screenshots and not screenshots of private
EzPzSpec artifacts. The test viewport was 1280x900 or 360x900; screenshots capture
the preview element, not browser chrome. All four were visually inspected.

Each journey verified the selected synthetic artifact path and revision, visible
content, absence of rendered image/script elements, return focus and unchanged
workflow text. It also asserted zero external requests, browser errors, workflow
dispatches, blocked writes, or fixture mutations, followed by successful owned
fixture cleanup. Those assertions apply to the harness, not the native App.

| Preview | Bytes | SHA-256 |
| --- | --- | --- |
| [Wizard 1280](screenshots/2026-09-13/wizard-1280-probe.png) | 29197 | `b20ef5740b834df24cb8ba9c9f681d91aa379ec0408d478e3d9debed0dfd251a` |
| [Wizard 360](screenshots/2026-09-13/wizard-360-probe.png) | 25508 | `d605a78a6d2ffe6d1c6cc695bb80b86115181556810762cefda1cb9510b92c80` |
| [SDD 1280](screenshots/2026-09-13/sdd-1280-probe.png) | 25101 | `512b3ba15c09e4d985a822ce61f41b71359d3d78e1f0f9b09147a075c408f792` |
| [SDD 360](screenshots/2026-09-13/sdd-360-probe.png) | 22316 | `f1d8cbcdd1364709930a15d51562bc31368c274281d3bdb9cf6362164f623cd5` |

## Actual App Workspace and Staging

The existing approval covered local pinned dependencies, an owned detached
EzPzSpec fixture, and project-local development loading without replacing official
plugins. The user's request to proceed continued that scope; it did not authorize
publication, private source redistribution, live workflow execution, or updates.
The later interactive approval specifically allowed App restart and its pending
update, without broadening those other boundaries.

The native Open folder dialog selected the approved `EzPzSpec-canvas-md-test`
fixture. A read-only foreground-session request reported its actual working
directory and Git root. Local Git checks confirmed that the App created its own
worktree from `main`, rather than using the detached fixture commit:

| Repository role | Revision | Branch/state after checks |
| --- | --- | --- |
| Original EzPzSpec | `11ae033982e6feaa35e86b584109148f38d0cebf` | `005-web-spec-workflows`, clean |
| Approved detached fixture | `11ae033982e6feaa35e86b584109148f38d0cebf` | Detached, clean |
| Actual App-created worktree | `630f9a861f135843f05c5ae0f90cbf37ca058ee8` | `tussinghal-microsoft-vigilant-goggles`, only approved untracked staging paths |

The App worktree's common Git directory was verified to belong to the original
repository. Absolute private paths and raw metadata replies are deliberately not
retained. No assistant-issued branch creation, commit, push, fork, or remote change
was performed; the branch above was created by the App's normal session operation.

The actual App worktree was clean before staging. Only new paths were added:

```text
.canvas-reader-probe/
.github/extensions/speckit-wizard-canvas/
.github/extensions/sdd-canvas/
specs/999-canvas-preview-fixture/
```

The first path contains complete plugin payloads plus the generated inventory;
the two extension folders contain matching payloads for project discovery. The
last path contains synthetic review artifacts. No existing file was overwritten,
no official provider changed, and no synthetic configuration, skills, or Wizard
state was copied into the App repository. Final Git status showed only
`.canvas-reader-probe/`, `.github/extensions/`, and the synthetic feature untracked.
This verifies tracked-file preservation during staging/discovery, not condition 6
of the still-unexecuted actual-canvas journey.

## Initial Runtime Discovery Blocker

Before staging, Customize > Installed > Canvas showed only six built-in entries:
Editor, Browser, Terminal, Word, Excel, and PowerPoint. After staging, a request
explicitly asked for live discovery, forbidding disk inference, canvas opening,
installation, reload, edits, and workflow execution. The App returned:

```json
{"marker":"CANVAS_READER_PROVIDERS","providers":[{"id":"browser","name":"Browser"},{"id":"editor","name":"Editor"},{"id":"excel","name":"Excel"},{"id":"powerpoint","name":"PowerPoint"},{"id":"terminal","name":"Terminal"}]}
```

This is a bounded transcription of the App agent's reply to the runtime-only
request, not a separately captured raw discovery-tool trace. Neither expected
canvas ID (`speckit-wizard`, `sdd-canvas`) appeared. The installed UI inventory and
live-session reply differ on Word; neither is evidence of a loaded reader provider.

The SDK's documented project-local discovery and `/clear` reload describe the
CLI, not proven App behavior. Typing `/` in the owned session did not expose a
supported reload choice through accessibility. Only that owned slash draft was
removed, without submitting a command. During this initial attempt, no session
was cleared, App restarted, update accepted, global provider replaced, or
alternate canvas ID invented.

## Approved Restart Follow-Up

The user explicitly selected **Allow restart and pending update**, after being
informed that this could interrupt other sessions and might not resolve T016.
The App's visible `Restart now` button was invoked. A normal relaunch attempt
reported that the executable was locked while the updater was replacing it;
no process was killed, alternative installer launched, or elevation attempted.
The updater completed and reopened Copilot App, whose executable now reports
version **1.1.19**.

The existing `Canvas reader verification` session was selected again, with the
same fixture/worktree identity visible. An exact-verified, read-only request
asked for the actual working directory, Git root, HEAD, branch, and live runtime
providers under marker `CANVAS_READER_POST_RESTART`. Its result was pending at
that checkpoint; session labels alone do not prove the effective workspace or
loaded providers. No canvas-open or workflow request was sent during this check.

Post-update Git status again showed the original checkout clean and the App
worktree containing only the same three approved untracked staging paths.

The completed reply subsequently confirmed the same effective worktree, Git root,
HEAD `630f9a861f135843f05c5ae0f90cbf37ca058ee8`, and branch, with
`discoveryAvailable: true`. It listed Browser, Editor, Excel, PowerPoint, Terminal,
Word, and one entry each for `sdd-canvas` (Spec-Driven Development) and
`speckit-wizard` (Spec Kit Wizard). This resolved the initial discovery blocker.
As above, this is the bounded App-agent reply, not a separately retained raw
discovery-tool trace.

## Native SDD Journey

The live canvas tool opened one `sdd-canvas` instance with boolean
`readerProbe: true` and reported success. Native accessibility confirmed its
loopback document URL had the probe flag; that URL and capability stayed in local
process memory and were not written into evidence.

The canvas initially showed its normal setup gate. Its real `/api/state` response
confirmed the expected App workspace and discovered the synthetic feature, but
`setupRequired` was true because the core skills were absent. The user explicitly
approved adding the existing eight **inert test-only skills** to the fixture's
new `.github/skills/` directory. Source hashes were checked against the owned
fixture marker before copying and against the destination afterward. No existing
file was overwritten, no skill executed, and Spec Kit initialization was not run.
This tests reader behavior with synthetic prerequisites, not real workflow setup.

Read-only HTTP checks against the server actually opened by the App passed:

| Check | Observed |
| --- | --- |
| Effective server workspace | Matches verified App worktree |
| Missing capability | HTTP 403 |
| Foreign Origin | HTTP 403 |
| Traversal-shaped artifact selector | `ok: false`, no content returned |
| Reader JavaScript | 410170 bytes; SHA-256 `65ca86b0f9cf0f3f6c5875014a8d5bdf6a3a4eb542f8de9dd6121138582ef054` |
| Reader CSS | 881 bytes; SHA-256 `4d85c0d68371376d7b67e293ae427d3e40337e5c0caf7322bd0f3991f1b5e6a6` |
| Reader manifest | 8737 bytes; SHA-256 `12a38af6f1f40c945eb4a54795c88e9a21c9fd879f4ac643dc1002f8ef12be78` |
| Reader notices | 59593 bytes; SHA-256 `1b3036ad68a6c0d3b61822bc207099b9e63bee7d3f358222f17751bc442e77b7` |

All four served asset hashes matched the development distribution. These checks
used only GET requests; no remote request, canvas action, or workflow POST was
issued by the verification command. They cover probe access boundaries, not the
unimplemented post-T016 secure-read specification.

Through native UI Automation, the synthetic title, adjacent slug, and unique
`View spec.md` tooltip identified its read-only Specify button. Invoking it
rendered the expected path, `Working-tree revision 22ec87aa43c0`, and synthetic
document text. The [native SDD screenshot](screenshots/2026-09-13/native-sdd-499-reader.png)
was captured from the foreground App's verified canvas rectangle only: **499x816**,
16,795 bytes, SHA-256
`077b0f75c5dbd3e07cc9b7749ec77fbf71ea2c5c04d7359e42d529e9547e2041`.
It was visually inspected and excludes chat, capability URLs, and private artifacts.
Unlike the four browser screenshots above, this image is from the actual App.

Invoking `Back to dashboard` removed the reader, showed the same synthetic feature,
and restored focus to the exact original trigger runtime ID and geometry. All
13 synthetic artifact/skill files still matched their source hashes. Git status
showed no tracked changes, only the approved payload, extensions, skills, and
synthetic feature directories. The original EzPzSpec checkout remained clean.

## Wizard Startup Approval

The user separately approved bounded normal Wizard startup: CLI checks, catalog
downloads, and fixture-local state/cache writes. Dependency installation, Spec Kit
setup, and workflow actions remain excluded. Baseline the fixture after startup
and verify that the artifact-reading journey itself introduces no further changes.

## Native Wizard Startup: Initial Blocker

The staged dependency check returned `ready: true`, with no missing packages.
The App opened one existing `speckit-wizard` canvas with boolean `readerProbe: true`
and returned success. Native accessibility located its 499x816 document. The
actual server confirmed the approved workspace, probe flag, synthetic feature,
and synthetic Specify artifact. Boot reached `ready`; dependency installation
was `skipped`, and workspace, dependency check, environment probe, and catalog
steps were `ok`. No dependency error was present.

Read-only GET checks verified all four served reader assets against the same
byte counts and SHA-256 values in the SDD table above. Missing capability returned
HTTP 401; an out-of-workspace artifact path returned HTTP 403. These are scoped
probe checks, not acceptance of the later secure-read implementation.

The preboot configuration baseline contained 18 files under `.specify/` and
`.speckit-wizard/`. After startup, all 18 hashes were unchanged; the sole addition
was `.speckit-wizard/state.json`, within the approved startup scope. No tracked
App-worktree changes were present. The original EzPzSpec checkout remained clean.

The existing setup gate still reports `pluginInstalled: false` and
`skillsReloaded: false`, with `cliInstalled: true` and
`projectInitialized: true`. Phases is disabled and Specify is locked. Invoking
the existing Composition navigation did not leave Environment or expose preview
controls. No refresh, install, initialize, reload, or workflow action was invoked.

The controlling code checks the core plugin through `copilot plugin list` in
`env/probe.mjs`; loading the development canvas is not proof of that prerequisite.
`canvas-runtime/snapshot-builder.mjs` and `ui/app.js` enforce the setup gate.
This observation does not establish why the core-plugin check returned false.
No production gate was changed and no fixture setup flags were asserted.

Wizard native reader rendering, screenshot, return focus, and reading-only
preservation remain untested. Continuing needs explicit approval for synthetic
fixture setup state or a separate prerequisite investigation. Synthetic state
would test the reader, not certify actual plugin installation or skill reload.

## Read-Only Prerequisite Investigation

The user selected **Investigate real prerequisite detection**, without approving
installation, reload actions, production changes, or synthetic setup flags.

The live Wizard environment snapshot classifies the core-plugin check as `ok`,
but its detail reports no plugins. Replaying `copilot plugin list` in the approved
worktree with Wizard's own `buildAugmentedPath()` and `summarizeResults()` returned
exit 0, a no-plugins message, no core-plugin name, and `pluginInstalled: false`.
The resolved CLI reports **1.0.84-4**. No spawn error occurred. Only classification
flags and the version were emitted; raw inventory and paths were not retained.
The fixed-argument Windows shell replay emitted Node's DEP0190 warning; it did
not fail. This is not an observed plugin-output parser mismatch.

The existing `reloadSessionSkills` handler calls `runSkillsReload()`, which uses
`session.rpc.skills.reload()` and persists `skillsReloaded: true` after a result
without errors. Current SDK documentation describes this reload API for applying
skill changes without restarting. Reading its code and documentation does not
prove that the live App exposes it successfully; no reload was invoked.

The supported next attempt needs separate approval to install the core skills
plugin into the CLI's user-scoped inventory and reload only the fixture session's
skill registry. Neither action is covered by the bounded startup approval. The
development canvas registrations themselves do not satisfy the core-plugin check.

## Gate Disposition

The user subsequently approved installing the core plugin into the resolved CLI's
user-scoped inventory and reloading skills only in the fixture session, without
workflow execution. `copilot plugin install github/spec-kit-copilot` succeeded,
installing version **0.15.0** and nine skills. No marketplace was added. The CLI
warned that direct repository installs are deprecated for a future release; this
observed install was supported. Wizard's own PATH resolver and parser then detected
the installed core plugin. No existing canvas provider was replaced.

After verifying the native session and server workspace again, the existing
`POST /api/skills/reload` endpoint returned HTTP 200, `ok: true`, zero errors, and
zero warnings. The existing `POST /api/env/probe` recheck then detected the core
plugin; `skillsReloaded` was true and Specify was unlocked. These explicitly
approved prerequisite operations preceded the reading baseline. They are not
classified as read-only artifact navigation.

The fixture has no installed preset command graph. The existing Phases panel
therefore remained empty despite a scanner-confirmed synthetic Specify artifact:
`renderPhaseCard()` requires a nonempty command list before resolving canonical
fallbacks. That pre-existing path was not changed to pass the gate. Instead, the
existing Setup > Composition source link opened the already-approved inert
`.github/skills/speckit-specify/SKILL.md` through the same artifact viewer. Its
tooltip and source hash were verified before opening. Native pointer navigation
was used where generic list-item accessibility invocation did not activate a view.

The native reader showed that synthetic path, revision **1e15cc3eaa82**, and its
fixture text. The [native Wizard screenshot](screenshots/2026-09-13/native-wizard-499-reader.png)
captures only the foreground canvas: **499x816**, 22,066 bytes, SHA-256
`7eea4149272e2a7da16386a8cf7c178003fe92480617433f00d22b593186c90a`.
It was visually inspected. This is the minimal packaged probe; it does not yet
include the planned table of contents or constitute final visual acceptance.

Returning through the existing Wizard button unmounted the reader and restored
the exact original source control runtime ID and geometry. The Composition view's
accessible text matched its pre-open value. All **32** post-setup baseline files
under `.specify/`, `.speckit-wizard/`, the synthetic skills, and synthetic feature
had identical hashes, with no additions or deletions. Git reported no tracked
App-worktree changes; only the approved staging/state directories were untracked.
The original EzPzSpec checkout remained clean.

Both native canvases now pass the scoped six-condition host gate, with the provider
discovery evidence qualified above. T016 is complete; T017 may proceed. The
synthetic harness's no-dispatch/network assertions are not relabeled as blanket
assertions about the App or Wizard startup lifecycle.

The staged fixture is retained. Cleanup must first check for new user changes.
Publication, live stage-output, performance/accessibility matrices, participant
study, update/rollback, and full E2E acceptance remain later gates, not passes.
Post-execution hook check found no `.specify/extensions.yml`; no hooks dispatched.
