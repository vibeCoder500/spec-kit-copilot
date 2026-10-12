# Repository Entry Implementation Evidence

## 2026-10-12 Existing-Checkout Primary/Secondary Choices

Implemented primary **Open existing in new session** and secondary **Clone another
copy (-Copy)** for verified matching managed checkouts. The user chose numbered
destinations when occupied: `-Copy`, `-Copy-2`, `-Copy-3`, etc. Both paths and the
copy's remote commit are reviewed before consent. Reuse preserves local work;
the secondary action is a fresh clone of the remote commit. Requests cannot
switch modes after admission, overwrite an occupied path, or silently renumber.

| Check | Result |
| --- | --- |
| Actual native Git copy behavior | PASS: independent copies of the reviewed remote, original local commit/branch/dirty-file preservation, numbered destinations and collision rejection. |
| Current managed original | PASS in coordinator tests: primary reuse requests a distinct session rather than taking the local shortcut. |
| API consent and retained records | PASS: one request/mode; forged paths or modes and mode-switch replays reject; original and copy records remain independent. |
| Responsive UI and copy target | PASS: primary/secondary order/style, exact disclosed destinations, original copy-root/features and no workflow dispatch at four viewport widths. |
| Automated gates | PASS: 121 entry tests, 95 original SDD/shared regressions, 27 complete Edge journeys and five final focused UI journeys; typecheck, lint, package, syntax, diagnostics and whitespace checks. |
| New native desktop choices | BLOCKED / NOT VERIFIED: the named source's ordinary canvas stayed on `Loading canvas...`; scoped reopen could not continue when native foreground input became unavailable. No primary or secondary action was invoked. |
| Native original/copy state | Original clean commit/branch preserved; no native copy clone started or copy folder created. |

The first complete browser run alongside other checks observed one
`invalid_context` failure in an existing bootstrap journey. Five isolated
repeats and the later complete 27-journey run passed; the transient cause is not
established. No production guard was weakened. Copy tests now select their exact
destination-specific fixture target rather than the first previously opened
canvas, avoiding a misleading earlier-target assertion.

Current runtime build hash:
`a81abaa2f9f3b3d9973f23b1e51efdd6df6b8a72cf458a78de069532f7f6ea37`.
The earlier native passes below are preceding-build evidence, not acceptance of
these new controls. No App restart/update, private IPC, prompt/workflow,
approval-policy change, or GUID test group was used for this attempt.
Private installation and observation details remain in session evidence.

## 2026-10-12 Current Build: Named Rail And Automatic Canvas

This result supersedes the stale-target naming/canvas observations below.
The user authorized migration of the test checkout and a backed-up user-scoped
extension update. Native Windows UI Automation then verified the current build
against the installed App without a model prompt, target canvas/menu action,
private IPC, workflow, approval-policy change, or App restart/update.

| Native check | Latest result |
| --- | --- |
| Verified older managed checkout migration | PASS: consent targeted a repository-named destination. An active older Windows session prevented rename, so a verified local copy preserved its old folder without remote cloning/fetching. |
| Repository-named left-rail group | PASS: the new session appeared beneath the repository name, not an operation UUID or generic checkout group. Existing historical groups are retained; the chat title remains host-controlled. |
| Automatic original target canvas | PASS twice: after migration and again on final-build named-copy reuse, with zero chat prompts or manual target canvas actions. |
| Durable target acknowledgment | PASS: opened status and session/context/cwd/provider/instance acknowledgment identify the named checkout independently of launcher submission. |
| Visible original repository features | PASS: original feature-stage controls appeared, not a chooser or fabricated readiness state. |
| Launch timing | Final reuse acknowledgment observed approximately 21 seconds after accepting the App dialog. |
| Existing named-copy reuse | PASS: same named checkout, commit, branch and clean status; no remote clone/fetch/reset. |
| Current-workspace continuation | Earlier native PASS, without another session approval. |
| Strict approval-free one-click | NOT SATISFIED: the repository action still requires the App-owned folder approval. Accepted it only to test the target outcome; production never silently approves it. |
| Fresh remote clone in native App | NOT RUN. Real Git clone and controlled browser clone-to-canvas checks remain distinct from desktop proof. |

The current extension is an explicit installation prerequisite. Automatic
prompt dispatch is unnecessary with the current target bootstrap.
Runtime build hash:
`c0677754d95cf2dee46211159dcb5bfc47f544c1f43e43c1a79fe1bdeb2357fd`.
Private paths, repository identity and session IDs remain in session evidence.
Native observation does not establish the separate G-HOST atomic contract.

Final automated gates passed: 117 repository-entry tests, 95 original SDD/shared
regressions, and 23 controlled Edge journeys; typecheck, package lint, generated
runtime verification, extension syntax, editor diagnostics and whitespace checks
also passed. Real Git coverage includes locked-folder migration, local-content
preservation and explicit rollback-recovery failure; retained-ID tests block
superseded operations. These remain separate from the native outcomes above.

## 2026-10-12 Second-Approval Follow-Through

The user explicitly requested continuation after the additional App approval.
Since the preceding test had denied that dialog, approval was recreated using
one explicit documented launcher call from the same reviewed checkout, then
**Allow** was accepted. No prompt or canvas-opening control was invoked.

- The App opened a new idle session bound to the reviewed existing checkout.
- The left rail grouped it under the legacy operation-directory/checkout label,
  not the repository name. This does not validate naming for fresh named clones.
- No original SDD canvas pane/document or canvas tab appeared during the initial
  eight-second and additional twenty-second observations.
- Persisted launch status remained `requested` and canvas status `pending`; the
  intent was still unexpired when checked during observation.
- The target lacked the current project-local extension and the old global
  extension remained unchanged. Automatic opening with a current target
  installation is therefore still unverified, not disproved by this setup.
- Checkout HEAD, branch and clean status were preserved. The target session was
  left open; no workflow, setup, restart or repository modification occurred.

This proves native second-approval session opening, but not a passing named-rail
or automatic-canvas outcome in the installed target configuration. Private
labels, paths and identity remain in the session report.

## 2026-10-12 Final Scripted Native App Test

This result supersedes the historical unexecuted/tool-unavailable notes below.
Windows UI Automation operated the actual installed App; the separate browser
connection did not need to attach to its desktop window.

| Native check | Result |
| --- | --- |
| Exact current project-local extension | PASS: its chooser visibly loaded in the owned fixture session. |
| Authenticated search and Spec Kit-enabled repository selection | PASS: native search returned the known test repository and selection offered reuse of its existing copy. |
| Current-workspace continuation | PASS: one action opened the original dashboard, constitution and fixture feature/stage controls; zero additional session approvals. |
| Existing-copy reuse and preservation | PASS: selection reviewed the existing checkout; HEAD, branch and clean status matched before/after. No existing copy was removed, moved or repaired to force cloning. |
| Strict single-action remote opening | FAIL: one Open existing Spec Kit repository action was followed by the App's Open session? dialog for the reviewed checkout. |
| Post-action approval | Not accepted. The additional request was denied after observing the failure. |
| Remote target canvas and native session title | NOT VERIFIED: stopped at the extra approval; target current-build installation was not established. |
| Fresh native clone-to-canvas | NOT RUN: real Git clone and controlled browser coverage remain distinct from native desktop proof. |
| Source and environment preservation | PASS: source fixture remained clean at its baseline commit/branch; global extension unchanged; no App restart/update or workflow dispatched. |

The initial owned-fixture folder approval was accepted only as test setup, before
the measured repository action. The post-action approval is a separate, directly
observed failure of the user's one-click criterion, not inferred from setup.
No private paths, account data or repository contents are published here.

The implementation therefore does **not** satisfy strict native one-click
acceptance. The documented launcher has no approval-suppression or explicit
session-title contract. UI Automation observes this limitation; it must not
silently approve dialogs in production or be treated as G-HOST atomic proof.

## 2026-10-12 Initial Scripted Native Desktop Observation

A process-scoped Windows UI Automation inspection of the running Copilot App
successfully read its real accessibility controls. A bounded walk found an
on-screen **Open session?** dialog and enabled **Allow** button for the exact
new current-payload sideload fixture. The earlier launcher submission was still
waiting for folder approval, not proof of a loaded extension or visible canvas.

At this initial observation, no approval was clicked, clone started, or canvas result asserted. This was native
evidence of the initial sideload launch being blocked, not an observed post-clone
journey. Clone-button-to-target-canvas acceptance was then **UNEXECUTED / NOT
PASSED**. UI observation does not establish G-HOST atomic handoff. No other session
was changed; private paths and control metadata remain in the session evidence.

## 2026-10-12 Current-Payload Project Sideload

Following explicit user authorization, the exact current verified runtime was
sideloaded into a new owned synthetic Spec Kit Git repository using the documented
`.github/extensions/sdd-canvas` location. Every copied file matched the staging
manifest; no profile injection or global replacement occurred. `copilot app`
was submitted once there and returned exit code 0. The App remained running,
fixture status stayed clean, and the global extension hash stayed unchanged.
Private fixture identity and hashes are retained in the session report.

This is verified sideload plus launcher-submission evidence, **not visible desktop
E2E acceptance**. The browser tools still control a separate browser. GitHub
documents Computer Use for desktop interaction, but its tools are not exposed in
this VS Code session; enabling an App/CLI session's Computer Use is separate from
attaching Playwright to the desktop. No private debugger endpoint, native UI
automation, approval bypass, forced restart, or manufactured activation was used.
Strict single-click clone-to-canvas acceptance remains unverified.

## 2026-10-12 Strict Real-App Single-Click Acceptance

**BLOCKED / NOT VERIFIED, not passed.** The running installed desktop App was
rechecked. The user-scoped extension still differs from the development payload;
the available browser connection is not attached to the desktop App. There is
no supported native click/observation surface available for the requested real
clone-to-canvas journey. No new native launch or installation was performed.

The earlier user-observed folder approval is an additional action. The documented
launcher has no approval-suppression option, so strict one-click acceptance for a
different cloned repository is not established. Passing automated journeys and
once-only bootstrap tests are not desktop acceptance. Current-repository local
opening does not prove the different-repository journey. No private IPC or native
UI automation was used to manufacture that result.

## 2026-10-12 Repository Naming And Existing-Copy Reuse

New entry clones use a safe exact repository name beneath the managed root.
Existing matching copies are reviewed and reverified rather than cloned again,
preserving local commits, branch and dirty/untracked files without fetch/reset.
Wrong-origin collisions and changes after consent reject without repair.
Destination-level record/launch locks and latest-record selection guard reuse.
A retained repository already current opens the original canvas locally, with
zero native launcher calls in the coordinator test.

| Check | Result |
| --- | --- |
| Entry typecheck, package lint and unit tests | PASS: 116 tests, zero failures. |
| Real Git named clone/reuse | PASS: exactly one clone; local commit/branch/uncommitted content preserved; wrong-origin collision and post-review changes rejected. |
| Original SDD and shared packaging regressions | PASS: 95 tests, zero failures. |
| Repository browser journeys | PASS: 23 Edge journeys, including reselect/open-existing with clone count unchanged. |
| Runtime package integrity | PASS: persisted runtime verified against current production sources. |
| Changed shared-file lint, extension syntax and whitespace | PASS: focused lint supplies the actual Node/browser globals missing from shared config. |
| Installed App | Running; documented launcher still exposes only current-directory opening, not title setting or approval suppression. |
| Latest payload native session/canvas acceptance | NOT VERIFIED: neither global extension nor earlier launched fixture was replaced with this amendment. |

Repository-named directories correct the basename for new clones, not a verified
desktop session title. Older UUID-root checkouts remain in place. Host-owned
folder approval for another repository cannot be suppressed using the documented
launcher; local canvas entry avoids invoking that launcher at all.
Reusing dirty files does not authorize an App-created linked worktree to omit
them: target fingerprint mismatch still blocks automatic canvas opening without
repair. No private IPC, native UI automation, global installation, commit or push.

## 2026-10-12 Installed Desktop App Attempt

With explicit fixture-staging approval, the development payload passed the existing
staging verifier and was installed project-locally in an owned synthetic Spec Kit
Git fixture. The documented `copilot app` command was submitted once from that
fixture, returned exit code 0, and reported opening the session. The desktop App
remained running; fixture Git status stayed clean and the older global extension
hash was unchanged. Private fixture identity and hashes are in the session report.

This is **launcher submission evidence only**. Available browser tools are not
connected to the desktop App, and no supported desktop inspection/control surface
is available. Folder approval, target session activation, extension loading,
current-workspace canvas visibility, and clone-to-auto-open acceptance are
**NOT VERIFIED**. No user-observed result was supplied; the user requested
autonomous verification. No private IPC or native UI automation was used.
The launched fixture is retained in case the App is using it.

## 2026-10-11 Clone-And-Open Amendment

The development branch implements disclosed **Clone and open Spec Kit** consent,
one native App launch request after cloning, and once-only target extension
bootstrap into the original direct canvas. The source session remains unchanged.
Launcher completion and canvas RPC acknowledgment are tracked separately; neither
is fabricated G-HOST atomic activation evidence.

| Check | Result |
| --- | --- |
| Entry TypeScript, ESLint, unit tests | PASS: 112 tests, zero failures; typecheck and package lint pass. |
| Original SDD and shared packaging regressions | PASS: 95 tests, zero failures. |
| Repository entry browser journeys | PASS: 22 tests at 360, 768, 1280, and 1920 px, including new-session original-canvas and offline local entry. |
| Real Git owned Spec Kit clone and linked worktree | PASS: actual local clone and registered worktree pass independent target verification; source branch/commit retained and dirty target rejected without repair. |
| Two existing Spec Kit workspaces | PASS: five features each; filesystem/Git identity and ordinary binding verified read-only, with HEAD, branch/detached state, and dirty-file status unchanged. Host metadata was synthetic, not desktop App evidence. |
| Native launcher detection | PASS on Windows: trusted installed native launcher found. No desktop launch submitted in this validation. |
| Runtime build/package verification | PASS; built runtime and manifest persisted. |
| Changed shared fixture lint and extension syntax | PASS. Full shared-reader lint reports five existing errors in unchanged exporter, preview runner, and asset synchronizer files; left out of scope. |
| Actual desktop clone-to-session-to-canvas acceptance | NOT RUN: installed user extension is an older payload. No global extension replacement or private desktop automation performed. |
| G-HOST atomic source-session switch | BLOCKED, unchanged. This amendment uses a new session, not an atomic source-session switch. |

Native versions inspected: Copilot CLI 1.0.87-0, Copilot App 1.1.23, developer
Node 24.19.0. The extension must already be installed in the target session;
normal App folder approval remains required. No second model prompt, setup,
workflow dispatch, commit, push, or deployment is part of repository entry.
See the updated [entry guide](../../../docs/sdd-repository-browser.md) and
[validation guide](../quickstart.md). Historical evidence below is retained.

Date: 2026-09-21

Branch: `plan/canvas-repository-discovery`

Baseline commit: `7638614c7e4b2082bbde24adc368fff4dcfdd4a2`

## Scope And Status

Standalone cloning is implemented under the user's 2026-09-21 scope amendment:
cloning no longer requires automatic App workspace switching. The user confirmed
that the manual clone check succeeded. This is user-reported native validation,
not a newly reproduced agent acceptance run.

72 of 86 tasks in [tasks.md](../tasks.md) are checked. The remaining 14 cover the
supported automatic host contract, the original full two-repository native
acceptance, and the complete independently recorded standalone-clone evidence
task. They remain incomplete; user-reported cloning success does not establish
automatic handoff or every preservation/cancellation criterion. The actual App
current-workspace smoke passed separately as described below.

| Gate | Current Result |
| --- | --- |
| G-HOST | BLOCKED: the native command probe changed runtime cwd without changing the App-bound folder; host command dispatch was rejected. The required complete contract is not verified. |
| G-COMPAT | PASS locally on Windows: final original-canvas, reader, entry, browser, and package checks pass. Hosted CI and Linux execution are not claimed. |
| G-NATIVE | PARTIAL: actual App offline current-workspace smoke passed with synthetic content; the user confirmed a successful standalone clone on 2026-09-21. Full automatic clone/handoff acceptance remains blocked by G-HOST. |

The original 2026-09-20 validation performed no live repository clone,
authentication change, workflow execution, global plugin installation,
development/private-source commit, push, or deployment. Synthetic seed commits
were created only inside owned
native smoke/probe fixtures so the App could create its normal worktree. Detailed
native captures and fixture records remain in the ignored development evidence
directory, not in tracked delivery artifacts.

## Standalone Clone Amendment: 2026-09-21

- The production host adapter exposes checked preparation independently of the
  still-unsupported atomic handoff capabilities. Fresh activity/context reads and
  event invalidation reject busy, unknown, or stale consent without queueing.
  These observations are not an atomic host reservation.
- An explicitly confirmed clone creates a separate managed checkout, retains its
  completion record, and shows **Clone complete** with a copyable checkout path.
  The active App workspace is unchanged; no automatic directory switch, target
  canvas opening, or workflow is attempted on a clone-only host.
- Reconnecting exposes the retained checkout without cloning again. Unsupported
  handoff controls remain hidden, and preparation that finishes while the App is
  busy remains a completed standalone clone.
- The user reported successful manual cloning on 2026-09-21 and requested a
  commit. No additional clone was needed to record that result. Commit `766a85d`
  contains the standalone-clone delivery; automatic sign-in is the later follow-up
  described below.

This amendment supersedes the historical production-clone-disabled statements
in the earlier checkpoints below. It does not waive G-HOST for automatic
workspace switching or claim the original full native acceptance matrix passed.

## Automatic Connection Follow-Up: 2026-09-21

- The user approved automatically starting the existing Microsoft connection when
  a fresh configured repository chooser opens, without a Connect click.
- Startup checks the server-owned initial generation and disconnected state.
  Already connected/connecting, failed, and previously disconnected instances
  do not restart sign-in, including after page reload. Refresh/polling/SSE do not
  initiate it. Failure and Disconnect retain explicit retry.
- Current-workspace and direct actions stay independent of pending/failed remote
  connection. Sign-in does not select or clone a repository, switch the App
  workspace, or run a workflow.
- The PKCE/nonce flow, tenant/account checks, scopes, app registration, and
  in-memory token cache are unchanged. No credential persistence is added.
  Existing browser SSO may avoid prompts; account selection, consent, or MFA may
  still be required.
- Existing controller and packaged-canvas browser tests cover one attempt,
  state/configuration guards, explicit retry, Disconnect/reload, local access,
  and unchanged clone consent. Tests use synthetic authentication; this follow-up
  does not claim a new live Microsoft sign-in or private-repository clone.

Final follow-up verification passed 626 automated tests: 94 entry-package,
372 original-canvas, 34 shared-reader, 63 tooling/controller, and 63 actual-shell
browser checks. Typechecking, package and changed-script lint, and both asset
verifiers pass. An older prepared-entry test setup still clicked Connect; its
setup was migrated without removing the original workflow/reader assertions,
then the complete browser suite passed. Desktop and mobile captures were inspected.

The five-asset entry runtime build is
`e43522d57fb514f3ab148888a97133d6d24755f3506db48d0f1374e649d3afc1`.
Shared-reader source/build hashes remain at the T001 baseline. The planning file
was left untouched. These are local Windows results, not a hosted CI, Linux,
or new native Microsoft SSO acceptance claim.

## Explicit App Opening Follow-Up: 2026-09-21

The user requested a button/script mechanism to open the cloned repository,
even without automatic in-session switching. The separate **Open in Copilot App**
action uses the public, noninteractive `copilot app` command from an already
installed native CLI. It does not start another agent or modify the old session's
cwd. The existing G-HOST gate for atomic automatic handoff remains unverified.

- The backend accepts only operation/context/request IDs, reauthorizes the retained
  repository, validates its owned checkout and source activity/context, and uses
  fixed argv with a sanitized environment. No browser-supplied path or command is
  accepted. Duplicate requests reuse a result; failures retain the checkout.
- Completed and retained clones expose an explicit opening button. Busy or unknown
  state blocks it; idle events do not submit it. Results say `requested`, never
  `workspace_activated` or `canvas_ready` based on a launcher exit code.
- Normal local binding now accepts an explicitly opened owned clone or registered
  worktree without forging an automatic attempt, and preserves ordinary local
  edits. Pending automatic handoffs still cannot bypass their guarded target path.
- Native verification used the installed CLI 1.0.83 and two owned synthetic Git
  repositories. The old App 1.1.20 process did not exit normally; the user explicitly
  approved stopping only that App process and relaunching. A pending App update
  applied during restart, yielding App 1.1.21. No updater command was issued.
- The App displayed **Open session?** with the exact owned folder. After the
  normal **Allow** action, its own **Show in Explorer** selected that exact target.
  A second explicit launch while App 1.1.21 was already running passed the same
  independent folder check with no restart. App confirmation was required.
- Both repositories' tracked/untracked files, branches and HEADs matched their
  baselines after native opening. No private repository was cloned, no model
  prompt or workflow was submitted, and no global plugin was replaced. Detailed
  ownership/path observations are in ignored evidence only.

The native checks prove the launcher and App approval path, not the complete
atomic handoff contract, macOS behavior, or automatic target-canvas opening. The
button/HTTP integration is exercised by synthetic controller/browser tests; native
checks invoke the same launch adapter without a private clone. The shipped
button never stops the App; the explicitly approved restart was test-only.

Final local checks passed 636 automated tests: 103 repository-package,
372 original-canvas, 34 shared-reader, 63 tooling/controller, and 64 actual-shell
browser tests. Typecheck, lint, changed-script lint, package verification and
Markdown/link checks passed. One unchanged reader-navigation timing failure
passed in isolation and then in the complete 64-test browser rerun without a
reader or assertion change. Mobile and desktop completion/opening views were
inspected for clipping and overlap.

The five-asset runtime build is
`247d4fff03512398b2e1484190fc872ac58c10af123b4db51bd40230025d2513`.
The shared reader remains at the T001 source/build hashes. Hosted CI, native
macOS, and an actual private-clone button invocation were not run in this follow-up;
the Windows native launcher and its App-approved repository selection were proved
separately against the owned fixtures above.

## T001: Baseline

- The tracked working tree was clean. The new feature documents and scoped
  repository-entry instructions were untracked and have been preserved.
- Fingerprinted 405 tracked files in memory before implementation. No raw
  account/session details, local capability URLs, or repository inventories are
  included here.
- Original SDD regression suite: 32 passed.
- Existing repository-browser suite: 44 passed using owned synthetic providers.
- Repository runtime package verification passed with build hash
  `96b76fe3bdc207baec066b76aae3dcb9e4ba0fc6e82b7228639073011ae39844`.
- Shared-reader validation initially found stale ignored build intermediates.
  Rebuilt reader/parser intermediates from the current branch without syncing
  committed assets; shared reader and domain package verification then passed.
- Verified all 405 tracked files remained unchanged after that rebuild.
- Shared reader source hash:
  `sha256:245979f9e0334e1c67b5bf537da4b51aad4c6266ecc54e990133be50dfd732ff`.
- Shared reader build hash:
  `sha256:5dca0e3a54606828ec58a724d9164f540d5890386c31ed7188a16421e038b03e`.
- Existing behavior remains the embedded repository browser and explicit manual
  clone opening. Those results are baseline evidence, not acceptance of the new
  chooser or automatic handoff.
- Existing ignore rules cover dependencies, build outputs, test results, local
  profiles/environment files, and private development evidence.

## T002: Locked Toolchain

- Node 24.19.0 satisfies the existing build floor.
- All 11 repository-build and 21 reader-build direct dependencies match their
  exact manifest pins, root lockfile entries, and installed versions.
- No installation, lifecycle script, SDK replacement, or dependency change was
  required.

## T003: Host Capability Inventory

- Rechecked the App's shipped public declarations: CLI 1.0.84-5, SDK protocol 3.
- `metadata.snapshot`, `metadata.activity`, `metadata.isProcessing`, and
  `metadata.setWorkingDirectory` are present. Current public extension docs
  confirm host-owned session attachment and canvas registration/lifecycle.
- No supported contract has been established for host-atomic preparation
  admission, visible App workspace activation, ordered `workspace_activated` /
  `canvas_ready` acknowledgments, and uncertain-result reconciliation.
- Completing this inventory does not pass G-HOST. T050 and T053 remain required
  and blocked; production cloning and live private clone acceptance stay disabled
  for the new flow. Safe foundation/local implementation can proceed.

## Supplemental Native Host Command Probe

The follow-up request to implement the complete clone-and-switch flow was tested
against the actual App 1.1.20 and its shipped CLI SDK 1.0.84-5, protocol 3. An
isolated project-local probe joined the App's real session. It was restricted to
two owned synthetic Git repositories, fixed canonical source/target paths, and
one-shot calls. No additional SDK client or private App IPC was used.

| Check | Observed Result |
| --- | --- |
| Live command discovery | `commands.list` exposes builtin `cwd`, alias `cd`, with `allowDuringAgentExecution: false`, including when client commands are explicitly requested. |
| Runtime invocation | One idle `commands.invoke({ name: "cwd", input: target })` returned `completed`. The joined session's snapshot changed to the target. Preliminary and settled `session.context_changed` events followed, with Git context in the settled event. |
| Independent desktop binding | The App's own **Show in Explorer** action still selected the exact original source worktree, not the target reported by the SDK. The selected folder was canonicalized and matched to the owned fixture; only that observer window was closed. |
| Host command dispatch | One `commands.execute({ commandName: "cwd", args: target })` returned `No client found for command: cwd`. No second successful transition occurred. |
| Repository preservation | Source and target tracked/untracked inventories, branch, and HEAD matched their pre-invocation fingerprints immediately after the runtime transition. Later probe-only instrumentation updates were confined to the owned test extensions. |
| Cleanup | An explicit fixed-target runtime command restored the test session to its original owned worktree. A fresh snapshot and settled context event confirmed restoration and idle activity. |
| Production regression | All seven focused host-adapter tests passed; the production adapter and its remote-disabled capabilities were unchanged. |

This is concrete negative evidence for the two tested public command routes, not
proof that no future or host-owner integration can work. A successful runtime cwd
change is not the required App activation: the desktop folder binding remained
at the source. The command metadata's busy flag also does not establish the
required atomic source-context admission or durable outcome reconciliation.
Those remaining native proof scenarios were not claimed or marked complete.

The missing integration is App-owned: a supported operation must move the visible
workspace and its dependent services, enforce the specified activity/context
ordering, and expose attempt reconciliation. No such mapped operation was
established by this probe. T050-T055 and G-HOST remain blocked; production cloning
was not enabled. The requested private-repository clone acceptance was not run.
No remote connection, clone, workflow, global plugin update, commit of development
changes, or push was performed. Probe code and detailed results remain ignored
development evidence, not part of the shipped extension.

## T004-T011: Foundation

- Added server-owned entry/host/consent/preparation types and distinct activation
  and readiness records, plus bounded safe errors and HTTP status mappings.
- Added a default local-only host adapter using shipped public metadata/activity
  and canvas-open contracts. Remote admission/handoff methods reject without
  invoking any start callback; missing or partial support never enables cloning.
- Host tests cover unknown activity, bounded reads, changed contexts, wrong
  session/provider results, and local-only opening during busy work.
- Added an isolated coordinator and strict entry HTTP transport, including
  duplicate JSON-key/query rejection, bounded bodies, safe snapshots, exact
  schemas, and rejection of legacy-operation aliases.
- New entry routes are available only to explicitly supplied owned fixture
  options. Existing normal launch and its paired UI/router remain unchanged.
- Owned fixture controls cover source/target isolation, opt-in fake capabilities,
  busy/context races, idempotent start counters, and zero implicit dispatch.
- Entry and host tests were observed failing before their implementations, then
  passing afterward. The complete repository package now passes 51 tests,
  typechecking, and package lint. Eight fixture/staging tests pass.
- Changed fixture scripts pass root-scoped lint with their Node web/timer globals
  declared. No rules were disabled and no unrelated lint configuration changed.
- The rebuilt repository payload verifies at
  `50b3988705fffee0c85e9e6f0b7ff0ec296bdc157d712b958e47a8637c7373e4`.
- This checkpoint does not implement the current-workspace button, normal-launch
  migration, confirmed entry cloning, or automatic App handoff. Those tasks remain
  unchecked; G-HOST and replacement-flow native acceptance remain blocked/pending.

## Verification Boundary

US1 (T012-T022) is now implemented and validated as the local-entry MVP:

- Independent bounded entry settings, canonical read-only Git inspection, and
  fresh host/Git revalidation for explicit idempotent local continuation.
- Normal enabled launch opens a separate chooser; `sdd-canvas-direct` retains the
  original renderer/actions. The old DOM mount and reachable legacy remote
  browse/clone routes were retired in the same validated migration.
- Per-instance async workspace context prevents selecting a repository by changing
  a shared scanner root. Host identity is rechecked before direct workflow/review
  access. No implicit workflow is used to open or switch a canvas.
- 56 repository package tests, typecheck, and package lint pass. All 32 original
  SDD tests pass after adapting the reader-probe harness to the direct provider;
  original reader assertions remain intact. Together with controller, fixture,
  and staging checks, the compatibility run passed 45 tests.
- Six actual-shell browser journeys pass, including offline continuation at
  360/768/1280/1920 px, direct rendering, retired-route rejection, and no-repository
  behavior. Mobile/desktop screenshots were inspected: nonblank, framed, no overlap.
- The current-repository inspector passed against the real nested development
  directory using read-only Git queries, with the branch verified and no mutations.
- The interim seven-asset entry/runtime payload verifies at
  `5291c814d910352b594cb7b7b34f309b20553958f46d243990a12864a50fac33`.
- Native staging was adjusted only to preserve profile injection at the new
  options-based start call. No fixture has been opened in the App in this run yet.

US2 (T023-T038) is implemented with owned synthetic preparation only:

- Existing delegated discovery primitives passed fresh-ref and independent
  collection checks without a provider rewrite. Selection and start reauthorize
  metadata; no spec content is read before cloning.
- Consent binds the account, profile, repository/ref/commit, canonical destination,
  source context, activity epoch, capability generation, and 120-second window.
  An injected atomic host admits exactly one start. The production adapter still
  rejects before any clone directory or Git process is created.
- Version-2 completion records are bounded to 8 KiB and created atomically outside
  the checkout. Identity is immutable, paths and ownership are validated, and
  inspection stops at 256 records. Version-1 records remain read-only and cannot
  authorize recovery. No credentials or consent values are persisted.
- Native Git execution retains isolated credentials, trusted executables,
  shell-free arguments, no hooks/submodules, bounded output and the 10-minute
  deadline. Completed clones survive cancellation, disconnect and disposal;
  incomplete cleanup remains confined to a provably owned stage.
- The separate entry UI now supports explicit connection, dropdown-only team
  suggestions and project search, one-second debounce, keyboard selection,
  full consent details, progress and cancellation. Busy/idle and late responses
  never submit commands. Progress-only SSE contains no consent or host identity.
- 74 package tests, typecheck, package lint, and source-aware payload verification
  pass. The compatibility/controller/staging run passes 47 tests, retaining all
  32 original SDD assertions. Scoped integration-script lint also passes.
- All 12 actual-shell browser journeys pass: offline/direct entry, consent and
  one mocked clone at four widths, explicit cancellation, and an atomic-admission
  busy race with no resume-on-idle. Mobile/desktop consent captures were inspected.
- Verified interim runtime build:
  `3423d848205f395c8655df19514fe9744b65d89a9bc7230900cde9ec2abe7ce6`.
- These results are not G-HOST or native acceptance. No live authentication,
  private repository clone, App session mutation, or workflow was performed.

US3 safe core (T039-T049) is implemented; T050-T055 remain blocked:

- Attempts are persisted before host submission. Activation is persisted before
  guarded canvas opening. Independent host/Git validation and successful original
  canvas startup precede the separate readiness record and workflow enablement.
- Recovery reconciles the old attempt first. Unknown/in-progress outcomes cannot
  create another transition; activation-only recovery opens the same target and
  instance without cloning or switching again. Late activation is retained after
  timeout without triggering an automatic open.
- Busy/context/activity-epoch changes consume automatic eligibility, including a
  busy-then-idle sequence during preparation. A new explicit action is required.
- Owned real-Git tests cover exact original identity, an attested different-branch
  linked worktree, Git registration, dirty/untracked/assume-unchanged content,
  detached or moved HEAD, wrong origin, stale context, and normal post-readiness
  edits. No verifier repairs, resets, or modifies those repositories.
- Direct actions and reads use per-instance host/Git bindings; pending target
  instances cannot bypass readiness, including actions before canvas opening.
- 86 package tests, typecheck and lint pass. All 47 original/controller/fixture/
  staging checks pass. All 15 actual-shell journeys pass, including uncertain
  outcomes and activation-only recovery into the separate original target canvas.
- Verified interim runtime build:
  `07a498db6d2f537c8db58332647a96d2c4e9e51e0c689beff2d8d0310c05a995`.
- G-HOST remains ERROR. These tests use owned adapter doubles and local Git;
  they do not provide the missing supported App activation/reconciliation APIs.
  No real App workspace mutation or private clone was attempted.

US4 (T056-T064) passes G-COMPAT locally on Windows:

- Current-workspace and verified-target shell journeys preserve the original
  workflow controls, prerequisites, artifact selection, reference navigation and
  return behavior. Direct entry loads no entry DOM/CSS or remote authentication.
- Entry HTML is lazy-loaded independently of direct registration. Missing entry
  state still permits explicit direct opening without setup or dispatch.
- Retired embedded UI source and generated assets were removed. The active
  manifest contains exactly five entry/server assets; staging rejects obsolete
  assets, private configuration/evidence, build sources, and a bundled second SDK.
- The synthetic preview now opens the chooser. Its launcher URL has no capability;
  authentication, Git and host behavior stay in owned synthetic fixtures.
- Required checks pass: 372 original canvas tests, 34 reader tests, 50 tooling
  tests, and the complete 56-test browser matrix. Reader typecheck/lint and both
  package verifiers pass. Entry audit reports zero vulnerabilities.
- A temporary edit to the fingerprinted reader lint config caused stale-build
  rejection. It was restored exactly; entry script lint now belongs to the entry
  package. Shared reader source/build hashes still match the T001 baseline, with
  no reader runtime regeneration. An obsolete preview expectation was migrated;
  the original reference-navigation assertion was retained and passed on replay.
- An exploratory whole-directory lint run also exposed existing errors in the
  legacy exporter/shared-build scripts. Those unrelated files and rules were not
  changed. The added CI lint gate explicitly covers the changed entry scripts.
- CI retains locked installs, audits, Windows/Linux jobs, all existing tests and
  synthetic-only uploads, with the new feature path included. Hosted jobs and
  Linux execution have not been run from this session.
- Five-asset runtime build:
  `57d30607ac467b993dec3bc75cd1364ec6f560097bd636c20c18e1be2e421c09`.

Evidence tooling (T065-T067) and usage documentation (T075-T076) are complete:

- Sanitized evidence has strict allowlisted fields and distinguishes synthetic,
  manual-open and verified-native provenance. Invalid ordering, extra clones,
  pre-consent writes, lost source identity or secret-bearing fields cannot pass.
  This summarizes supplied evidence; it does not manufacture native proof.
- Read-only acceptance snapshots fingerprint all tracked and non-ignored untracked
  files, Git status, branch, HEAD, repository and common-directory identity. Output
  contains hashes rather than filenames, source bodies, accounts or capabilities.
- The historical acceptance helper no longer installs an extension or generates
  temporary skills. It requires a supported host and already-verified target,
  verifies the on-disk payload, performs no writes/workflows, retains the clone,
  and explicitly requires separate visible-App evidence.
- The guide and both READMEs now describe the chooser/direct/local paths and
  blocked production handoff. Markdown tables and relative links validate.
- Final hardening rejects retired operations in both the outer router and the
  shared transport. Explicit selection cancellation revokes its server consent.
- Twenty owned actual-shell runs measured chooser p95 102.26 ms and current-workspace
  continuation p95 90.79 ms, below the 2-second budgets. These use a synthetic host
  and inspector; native App latency was not measured.
- Injected checks exercise 10-second request, 35-second discovery, 120-second
  consent, 10-minute clone, 5-second host-read and 30-second handoff budgets without
  waiting for production timeouts. Expiry cancels only the owned incomplete stage.

## T077-T078: Final Local Verification

The interrupted final check/report was resumed against the saved implementation.
No hung test process was found; the older Node processes were persistent browser
automation servers. All final one-shot checks completed normally:

| Check | Result |
| --- | --- |
| Entry package | 90 tests passed; typecheck, lint, and source-aware verification passed. |
| Original SDD and Wizard canvases | 372 tests passed, retaining the original workflow and reader assertions. |
| Shared Markdown reader | 34 tests passed; typecheck, lint, and package verification passed. |
| Packaging, fixture, security, preview, and evidence tools | 51 tests passed. |
| Actual-shell browser matrix | 57 tests passed, including consent, cancellation, guarded target recovery, and responsive layouts. |
| Dependency audit | Zero vulnerabilities reported for the entry build package. |
| CI and authored patch checks | YAML, explicit entry-script lint, and whitespace checks passed; Windows/Linux matrix and synthetic-only uploads retained. |
| Git privacy boundary | No private capture/configuration, dependency directory, or development build output in the publishable file inventory. |

Total: 604 passing automated tests. These include owned local Git and synthetic
host/provider fixtures; they do not establish automatic native App handoff.

Final five-asset repository runtime build hash:
`84e712d5b4f3fa349b5aa71bae7f6b8ee552cdcbb7ec0bc55698a00e7ec4a9e6`.
Shared-reader source and build hashes remain exactly the T001 baseline.

The repeated 20-run owned-shell timing check measured chooser p95 65.76 ms and
current-workspace continuation p95 92.78 ms. Both meet the 2-second targets, but
use a synthetic host/inspector and are not native App latency measurements.
Hosted CI and Linux execution remain not run; no push or configuration workaround
was used to claim those results.

## Native Current-Workspace Smoke

After the interrupted run was recovered, the user unlocked Windows and the
non-clone path was exercised in GitHub Copilot App 1.1.20 with its real shipped
SDK. This was an owned, Spec Kit-shaped synthetic repository, not either of the
two private repositories required by the full native acceptance plan.

- Staged the production payload without profile injection or runtime changes.
  All 23 extension files matched the verified staged hashes in the App worktree;
  the runtime build matched the final hash above.
- Opened the new owned folder through the App's native project picker solely to
  establish a test session. That manual test setup is not clone-handoff evidence.
- The App opened provider `project:sdd-canvas` and displayed the separate chooser.
  Remote configuration was `unconfigured`, the account stayed `disconnected`,
  and **Use current workspace** was enabled without sign-in.
- Invoked **Use current workspace** once through the actual native control. A
  separate original-canvas instance opened through the real host SDK; its root,
  initial commit, Git common directory, and ownership marker matched the App's
  legitimate worktree of the owned fixture.
- The downstream canvas exposed the original workflow controls with no repository
  entry actions. Opened the existing synthetic spec through its preview-only
  Specify stage and verified the title, headings, body, TOC and reader controls.
- A native 1113 x 1085 canvas screenshot was saved, inspected, and found nonblank,
  correctly framed, and free of overlapping controls. It contains synthetic text
  and is retained with the private local evidence, not published.
- Read-only before/after snapshots showed the source tracked/untracked content,
  branch, and HEAD unchanged. The target's tracked contents matched the source
  baseline with zero untracked files. No normal plugin was installed or changed.
- The real chooser ended in `ready` for local entry while reporting
  `canPrepareRemote = false`, `canRetryHandoff = false`, and
  `host_handoff_unsupported`. No connection or clone control was invoked and no
  workflow command was run.
- Closed only the two test canvas tabs. Retained the owned synthetic project,
  App test session/worktree, screenshot, and generated result record. No credential
  was acquired, so no test sign-in remained to clear.

The native folder-picker and composer needed verified native control input;
unsupported accessibility setters were not treated as successful actions.
The initial desktop lock and the interrupted reporting step were test-execution
issues, not a hung build. They are now resolved. Native UI automation was used
only to operate and verify this test, never as the production handoff mechanism.

## T079: Original 2026-09-20 Requirement And Gate Verdicts

These are the original pre-amendment verdicts; the standalone clone delivery and
user-reported result above supersede their clone-disabled status only.

| Requirements / Outcomes | Verified Scope And Remaining Limit |
| --- | --- |
| FR-001, FR-002, FR-003, FR-014, FR-015, FR-016, FR-019 | Chooser/direct/current-workspace behavior implemented and tested; actual App local continuation and original spec rendering passed with owned synthetic content. |
| FR-004 | Delegated discovery and dropdown behavior pass automated provider/controller checks; no new live account search was performed for this replacement run. |
| FR-005, FR-006, FR-007, FR-008, FR-009 | Metadata-only selection, consent, one admitted preparation, progress and cancellation pass owned tests; production clone remains disabled rather than bypassing host guarantees. |
| FR-010, FR-012 | Unsupported-host detection fails closed as required; automatic visible App clone handoff cannot be completed without the missing supported integration. |
| FR-011, FR-013, FR-018, FR-021 | Original/linked Git identity, ordered activation/readiness, stale/busy rejection, retained-clone retry and reconciliation pass owned host/Git tests. Real atomic host admission and remote handoff remain blocked. |
| FR-017, FR-020 | No implicit workflows or setup; secret/route/package/privacy tests pass. Native smoke used no remote credential or workflow operation. |
| FR-022, FR-023 | Automated results and the scoped native local smoke are reported accurately. The required two-real-repository acceptance is not satisfied. |
| SC-001 | One explicit native local-continuation action succeeded while disconnected; 20-run synthetic-host p95 stayed within budget. |
| SC-002 | Automated selection/cancellation checks show zero pre-consent clone writes; no live remote clone was attempted. |
| SC-003 | BLOCKED: no supported actual-host automatic clone/handoff acceptance. |
| SC-004 | Race, mismatch, retry, late-result and no-auto-resume checks pass with owned adapters; real-host remote guarantee remains unverified. |
| SC-005 | Original canvas/reader suites and native local preview pass; remote target equivalence is automated only. |
| SC-006 | BLOCKED: two distinct real Spec Kit-enabled repository journeys have not been performed. |
| SC-007 | Owned real-Git tests and native synthetic source/target fingerprints pass preservation checks; no private source was changed. |
| SC-008 | Responsive entry/consent/recovery tests and inspected captures pass; actual native chooser, local continuation and reader were verified. |

T050-T055 remain unchecked because the supported host-owner mapping and actual
atomic activation/reconciliation proof are unavailable. T068-T074 remain unchecked
because their required preceding gates and two-real-repository scenario are not
satisfied. The supplemental offline App smoke does not bypass those dependencies
or turn synthetic content into live-repository acceptance.

T077-T079 are complete for the final local audit and truthful partial report.
Hosted CI, Linux native execution, and production clone handoff remain unrun or
blocked as stated. No final commit, push, version bump, or publication is implied.
The next unblocker is the supported App contract described in
[host-handoff.md](../contracts/host-handoff.md), not another manual clone or a
directory-only workaround.
