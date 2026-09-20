# Quickstart: Validate Repository Entry

This validates local entry, user-authorized standalone cloning, and the guarded
handoff core. G-HOST still blocks automatic App switching, not clone-only
acceptance after the 2026-09-21 amendment; see the
[acceptance report](evidence/acceptance.md) for the exact delivered scope.

## 1. Prerequisites And Stop Conditions

- Work from the repository root on the intended feature branch, preserving any
  unrelated user edits. Record `git status` before changing implementation files.
- Use Node compatible with both existing build packages; Node 24.19.0 matches the
  current CI configuration. Use the pinned package lockfiles, native Git, and
  installed Edge on Windows or the existing Playwright Chromium setup on Linux.
- Read [spec.md](spec.md), [data-model.md](data-model.md), and both
  [entry](contracts/entry-layer.md) and [host](contracts/host-handoff.md) contracts.
- G-HOST is currently **ERROR: blocked**. Do not create a live private clone to
   test an unsupported handoff. Standalone clone acceptance is independently
   permitted after owned clone-only checks and explicit repository consent.
   Record exact installed App/SDK versions and leave the current workspace unchanged.
- Local/direct entry must remain testable with no remote profile and no network.
  Synthetic fixtures must not access actual credentials, personal repositories,
  user Git settings, or real workflow dispatch.
- Do not install/update global plugins, change Entra registration, request new
  grants, initialize a repository, commit, push, or deploy as part of this guide.

## 2. Locked Dependency Setup

Run only when the required locked dependencies are not already installed. Each
command must succeed before proceeding; installs keep lifecycle scripts disabled.

```powershell
$repositoryBuild = 'plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser'
$readerBuild = 'plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader'
$wizardRuntime = 'plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas'

npm ci --prefix $repositoryBuild --ignore-scripts --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Repository build dependency setup failed.' }
npm ci --prefix $readerBuild --ignore-scripts --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Reader dependency setup failed.' }
npm ci --prefix $wizardRuntime --ignore-scripts --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Wizard dependency setup failed.' }
```

Do not add or bundle a separate Copilot SDK/CLI. The extension uses the host's
provided SDK. Real-provider configuration remains user-local; use the existing
[connection guide](../../docs/sdd-repository-browser.md) for its authentication
prerequisites only, not as the new handoff acceptance procedure.

## 3. Focused Implementation Checks

Run immediately after each changed slice; stop on the first failure.

```powershell
npm run typecheck --prefix $repositoryBuild
if ($LASTEXITCODE -ne 0) { throw 'Entry typecheck failed.' }
npm run lint --prefix $repositoryBuild
if ($LASTEXITCODE -ne 0) { throw 'Entry lint failed.' }
npm test --prefix $repositoryBuild
if ($LASTEXITCODE -ne 0) { throw 'Entry unit checks failed.' }
npm run build --prefix $repositoryBuild
if ($LASTEXITCODE -ne 0) { throw 'Entry build failed.' }
npm run verify:package --prefix $repositoryBuild
if ($LASTEXITCODE -ne 0) { throw 'Entry package verification failed.' }

Push-Location $readerBuild
try {
    npm run test:browser -- repositories.spec.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Entry actual-shell journeys failed.' }
} finally { Pop-Location }
```

Keep tests in existing package/controller/browser homes. Add host-adapter and
preparation-store tests next to their new modules' existing test directory, not
in a separate framework. The current old-rail/manual-open browser expectations
must be replaced in T015 together with the T019-T022 launch/router migration,
not left failing until US2 or counted as proof of the new flow. T027/T028 extend
that migrated coverage. Run the controller/browser suites, legacy-route rejection,
generated-asset verification, and original direct-canvas checks together before
the migration becomes a completed or released slice.

### Required Synthetic Matrix

| Scenario | Expected Result | Requirement / Outcome |
| --- | --- | --- |
| Enabled normal launch | Chooser first; no workflow layout mounted inside it. | FR-001, SC-005 |
| Coordinated UI/router migration | Foundation preserves the existing UI/router pair; T022 accepts chooser launch, legacy-route rejection, migrated tests, and rebuilt assets together. No halfway migration is exposed or released. | FR-001, FR-014, FR-015, SC-005 |
| Direct launch / disabled or failed entry | Original canvas works independently. | FR-014, FR-016, SC-005 |
| Current Spec Kit workspace, no profile/network | One action to original canvas; zero remote sign-in/clone; dirty files preserved. | FR-002, FR-003, FR-018, SC-001, SC-007 |
| Fresh configured disconnected entry | One automatic Microsoft connection request without a button click; local/direct controls stay usable and no clone starts. | 2026-09-21 sign-in amendment |
| Connected, connecting, failed, or previously disconnected entry | No automatic new request; refresh, events, and reload preserve that decision; failure/disconnect retain explicit retry. | 2026-09-21 sign-in amendment |
| Missing, disabled, invalid, or unavailable remote configuration | No automatic sign-in request. | FR-003, FR-016 |
| No Git workspace | Local shortcut unavailable; no inferred alternative root. | FR-002, FR-021 |
| Empty/type/clear search | Team suggestions, project matches, restored suggestions; no rail or pre-clone content reads. | FR-004, FR-005, FR-015 |
| Suggestions fail or return none | Explicit search/local continuation remain usable. | FR-004 |
| Candidate is current repo/worktree | Local continuation, zero duplicate clone. | FR-019 |
| Select/cancel/expired consent | Zero Git start and zero clone-directory writes. | FR-005, FR-006, FR-008, SC-002 |
| Unsupported automatic handoff, checked clone support | Explicit clone completes with a copyable retained path and unchanged workspace; no handoff calls or controls. | FR-012, SC-003 |
| Missing/unknown clone admission support | Disabled confirmation and backend rejection before clone. | FR-012 |
| Double confirmation/retry HTTP response | One checkout/process for one admitted operation. | FR-007, FR-008, SC-003 |
| Default ref/account/context/capability changes | Reconfirm or block; never silently use stale consent. | FR-008, FR-021 |
| Busy or stale clone observations / racing automatic handoff | Checked clone rejection; atomic handoff rejection; no queue, cancellation or resume-on-idle. Clone-only checks are not a host lock. | FR-018, SC-004 |
| Busy during clone | Clone may finish; handoff waits for a new user action. | FR-018, SC-004 |
| Clone cancel/fail | Only owned incomplete staging cleaned; unrelated files preserved. | FR-009, SC-007 |
| Successful mocked host transition | `workspace_activated`, then guarded canvas open, then target host/Git/provider verification and `canvas_ready`; workflow actions remain blocked until final readiness. | FR-010, FR-011 |
| Workspace activation without canvas readiness | Missing provider, validation failure, or timeout cannot enable workflows; explicit retry reconciles the same attempt and finishes canvas binding without another switch or clone. | FR-011, FR-013, SC-004 |
| Handoff fail then explicit retry | Retained clone reused; access/identity checked; zero second clone. | FR-013, SC-004 |
| Lost/late handoff result | Reconcile attempt ID; no duplicate transition on timeout. | FR-011, FR-013, FR-021 |
| Close/disconnect/reopen | Incomplete work canceled safely; completed record retained; no auto-resume. | FR-009, FR-013, FR-020 |
| Original prepared checkout changes branch/HEAD/files | Block initial handoff/retry and preserve it; never overwrite its recorded identity, reset, or reclone. | FR-011, FR-013, FR-018 |
| App creates a linked target on a different named branch | Accept only an attempt-attested canonical target registered in the same Git common directory with matching origin, exact prepared commit, clean index/worktree, and actual branch equal to the host's target branch. Preserve the original clone. | FR-011, SC-003, SC-007 |
| Copied marker, redirected path, detached/prewarm target, unattested branch, missing registration, wrong origin/HEAD | Block readiness and preserve both checkouts; branch or commit equality alone is not identity proof. | FR-011, FR-013, FR-018 |
| Provider unavailable / non-Spec Kit repository | No silent install/setup; original canvas setup rules apply only when properly opened. | FR-014, FR-017 |
| New target session, stale old canvas action | No cross-session workflow dispatch. | FR-011, FR-021, SC-004 |
| Keyboard and 360/768/1280/1920 px views | Search, consent, progress, errors, and recovery readable/operable with no overlap. | SC-008 |

Measure local chooser/continuation targets over at least 20 owned fixture runs,
reporting p95 separately from provider network timings. Verify the configured
10-second request, 35-second discovery, 120-second consent, 10-minute clone,
5-second host-read, and 30-second handoff deadlines with injected clocks or
bounded fixtures rather than making the suite wait for production timeouts.

## 4. Compatibility And Package Gates

Run the existing workflow gates before native acceptance. They must test the
original direct experience, not rewritten assertions that hide regressions.

```powershell
npm run typecheck --prefix $readerBuild
if ($LASTEXITCODE -ne 0) { throw 'Reader typecheck failed.' }
npm run lint --prefix $readerBuild
if ($LASTEXITCODE -ne 0) { throw 'Reader/script lint failed.' }
npm test --prefix $readerBuild
if ($LASTEXITCODE -ne 0) { throw 'Reader unit checks failed.' }
npm run verify:package --prefix $readerBuild
if ($LASTEXITCODE -ne 0) { throw 'Shared assets changed unexpectedly.' }
node --test 'plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/*.test.mjs' 'plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/*.test.mjs'
if ($LASTEXITCODE -ne 0) { throw 'Existing canvas regressions failed.' }
npm run test:tools --prefix $readerBuild
if ($LASTEXITCODE -ne 0) { throw 'Packaging/fixture checks failed.' }
npm run test:browser --prefix $readerBuild
if ($LASTEXITCODE -ne 0) { throw 'Full canvas browser suite failed.' }
npm audit --prefix $repositoryBuild --audit-level=low --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'Entry dependency audit failed.' }
```

For changed entry scripts, invoke the pinned repository-entry ESLint executable
from the repository root with its explicit entry-package config, as configured in
CI. The shared reader config is part of its source fingerprint and is unchanged.
Verify files are actually
included, not silently ignored due to the package working directory. Existing
browser/fetch globals must be declared in the appropriate config scope, not
suppressed wholesale. Updating unrelated lint rules is not part of the feature.

The build-only sources, dependencies, test adapters, private profile/evidence,
source maps, and unrelated files must be absent from installable payloads. The
manifest must enumerate only the new named entry assets and dependency-closed
server runtime with matching hashes and notices. Add the new feature-spec path
to CI filtering when implementing; hosted CI was not run by this planning step.

## 5. Actual App Acceptance

### Standalone Clone Acceptance

This path is authorized independently of G-HOST. Complete the owned clone-only
and compatibility gates first, then use only the explicitly approved repository.

1. Stage the verified current payload in an owned App test session without
   replacing global plugins. Record source Git/file baselines and App/SDK versions.
2. Verify one automatic connection attempt when the fresh configured chooser
   opens, without clicking Connect. Complete any required Microsoft interaction;
   use explicit retry after a failure or Disconnect. Find the approved repository,
   inspect the account/ref/full commit/destination and **App workspace: Unchanged**.
   Cancel once and verify no new managed operation or checkout was created.
3. Reselect while idle and choose **Confirm and clone** once. Observe **Clone
   complete**, the copyable path and unchanged active App workspace. Require one
   completed checkout, no handoff calls and no setup/workflow dispatch.
4. Independently verify the clone's origin, expected commit, named preparation
   branch and clean files. Reconnect/reopen and confirm the same retained checkout
   appears without a second clone or session change. Recheck source baselines.
5. Disconnect test auth and close only owned panels. Retain the completed clone;
   do not navigate to it automatically or claim `workspace_activated`/`canvas_ready`.
   Keep private paths, accounts, source and captures in ignored evidence.

### Full Automatic Handoff Acceptance

The two actual-repository journeys below establish SC-006; browser-only or
synthetic results cannot satisfy that outcome.

Only start this section after G-HOST passes the supported-contract proof matrix
in [host-handoff.md](contracts/host-handoff.md). Stop rather than use manual folder
selection, `setWorkingDirectory()` alone, a separate SDK client, guessed URI,
private IPC, or native clicking as the feature's handoff implementation.

1. Record exact payload hashes, App/SDK/runtime versions, capability result, and
   a baseline for the source workspace: canonical path/common directory, branch,
   HEAD, and hashes/inventory of tracked and untracked files. Keep details private.
2. Use two approved, readable, Spec Kit-enabled repositories with the original
   canvas already available. Confirm the intended remote account and managed
   destination locally. Do not disclose their private inventories in public logs.
3. In repository A's actual App session, disconnect remote auth and use the
   chooser's current-workspace action. Open a known local spec and compare the
   original canvas/reader/workflow-prerequisite states with direct entry. No clone,
   setup, branch change, or workflow dispatch is allowed in this check.
4. Connect explicitly, inspect empty-query suggestions, search repository B, and
   select it. Capture search/selection/confirmation privately. Cancel once and
   prove no clone directory or preparation record was created.
5. While idle and with fresh confirmation, choose **Confirm and clone** once.
   Verify the displayed default destination, one clone, and retained source
   identity. Without a folder picker or manual session navigation, verify visible
   App activation and record `workspace_activated`. Verify that the target canvas
   opens guarded, validates its own host/Git binding, then records `canvas_ready`;
   workflows must stay blocked between these checkpoints. Record original-clone
   branch/commit and host-attested target kind/path/branch separately; for a linked
   target, verify registered common directory/origin, the prepared commit, clean
   files/index, and the actual target branch against the host mapping, not against
   the original clone's branch.
6. After B's canvas reaches verified `canvas_ready`, open its existing spec.
   Confirm normal artifact navigation and prerequisite state. Do not execute a
   mutating workflow merely to prove binding. Any real workflow run requires
   separate narrow approval.
7. Use owned non-private fixtures for deliberate busy/race/failure injection.
   For a completed-clone failure, explicitly retry handoff and prove no second
   clone. Also fail after activation but before readiness and prove same-attempt
   canvas recovery without a second workspace switch. Verify late-result
   reconciliation and source-session preservation. Include a positive different-
   branch linked target and negative unattested/detached/wrong-commit/dirty-target
   cases; never repair a failed identity check by changing either checkout.
8. Recheck A's baseline, all preparation counts, and B's expected initial state.
   Disconnect owned test auth, close owned test panels only, and retain completed
   clones unless deletion is separately authorized. Record cleanup precisely.

Browser screenshots of the real App-served renderer can document appearance if
native capture fails, but are not proof of visible App workspace activation.
Native session identity evidence remains mandatory. Synthetic fixture screenshots
must be labeled as synthetic and never substituted for live acceptance.

## 6. Report And Completion

Report branch/payload, implemented entry routes, tests actually run, measured
timings, G-HOST proof, two native journeys, cancellation/retry clone counts,
source-workspace preservation, credential cleanup, and any unverified platforms.

Trace SC-001 through SC-008 to the matrix and actual results. Keep screenshots,
private names/source, account/session identifiers, and raw diagnostics in an
ignored evidence directory. Publish only a sanitized outcome summary; never
include capability URLs, tokens, authorization codes, or consent values.

Full automatic-flow completion requires G-HOST, G-COMPAT, and G-NATIVE to pass.
Standalone cloning can be delivered under the authorized amendment; report its
tests and native results separately while automatic handoff remains blocked.
Do not mark the entire automatic specification delivered. Commit, release/version changes, marketplace
publication, and push are separate user-authorized operations.
