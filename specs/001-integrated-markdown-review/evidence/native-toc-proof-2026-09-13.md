# Native Canvas TOC and Markdown Preview Proof

Status: **requested visual capture and scoped native journeys passed**.
Date: 2026-09-13. This is not completion of the entire 108-task implementation
plan or final release acceptance. T001-T056 are complete; T057 and later remain.

## Actual App Captures

These images were captured from the foreground **GitHub Copilot App**, including
its native canvas tab bar. They are not browser harness screenshots. Both show
the existing canvas, the persistent TOC rail, and the rendered Markdown preview
together. Only owned synthetic content is visible; no chat, capability URLs,
absolute private paths, credentials, or private reference documents are included.
Both final images were visually inspected.

| Existing canvas | Capture | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| Spec Kit Wizard (`speckit-wizard`) | [Verified native Wizard](screenshots/2026-09-13/native-wizard-1279-toc-verified.png) | 1279x856 | 34475 | `072a9d1d90bf8c4ff751eb2349b5cf190745de3d740177a505b207d12ced01db` |
| Spec-Driven Development (`sdd-canvas`) | [Native SDD](screenshots/2026-09-13/native-sdd-1279-toc.png) | 1279x856 | 28761 | `b46090430163cbf553b3d0e68b81b91224db2ed575b45482244eeee9938e9cc4` |

The canvas document itself measured 1279x816; the additional 40px records the
native tab strip. The App's existing Maximize panel control provided the wide
view. The article is `specs/999-canvas-preview-fixture/spec.md`, with displayed
working-tree revision **22ec87aa43c0**, checked against its exact-byte hash.

The presentation follows the [EzPzSpec reference observations](reference-viewer-2026-09-13.md):
hierarchical rail, highlighted current section, compact file metadata, readable
heading hierarchy, lists/code, and a side-by-side article. It adapts to each
canvas's host tokens rather than copying private application source or loading
remote fonts. The reader uses a 210px rail and an 820px container breakpoint.

## Host and Source Verification

- Windows; Node 24.19.0; npm 11.17.0; PowerShell 7.6.6.
- Final Copilot App executable version: **1.1.20**. The initial host was 1.1.19.
  The user approved a restart, then separately approved stopping only the verified
  background App process when normal window close did not terminate it. No update
  control was invoked; the executable changed version during the normal relaunch
  path. No other process was targeted.
- The existing fixture session and authoritative live server roots were verified
  against the approved App-created worktree at `630f9a861f135843f05c5ae0f90cbf37ca058ee8`.
  The original EzPzSpec checkout remained on its original branch and clean.
- The user approved the core `spec-kit-copilot` installation and fixture-only
  skills reload. Version 0.15.0 installed nine skills; the reload reported zero
  errors/warnings. No workflow, dependency installation, or Spec Kit init ran.
- Both canvases were opened with default input, **without `readerProbe`**.
  The existing canvas IDs were retained; no standalone viewer canvas was created.
- Closing/reopening tabs initially retained the old extension process. Its new
  review route returned the old plain-text 404. The approved App restart loaded
  the new routes; both then returned HTTP 200 in the verified workspace.

The [125-file payload inventory](staging-manifest-toc-2026-09-13.json) identifies
the complete tested development payload. Inventory: 26,805 bytes, SHA-256
`bff1645bbebe61262449d441cb9f82030051f2c869dbc27056fea380c73b00b3`.
Before replacement, all 114 prior payload hashes and the corresponding owned
extension files matched their earlier inventory. The update changed only the
121 project-local extension files and retained both old and new payloads.

One subsequent static-script correction is identified separately: Wizard
`extensions/speckit-wizard-canvas/ui/app.js`, 10,786 bytes, SHA-256
`14638ee0f6cc58a9bec46fb5e8d4e1cbee90ff005324d4df4eb121ce8d77f67b`.
Its old hash was checked before replacement; its new hash was checked against the
live server after reopening only Wizard. The payload inventory plus this explicit
override identify the final tested code. The reader distribution did not change.

All four assets fetched from **each actual App-opened server** matched the build:

| Asset | Bytes | SHA-256 |
| --- | --- | --- |
| Reader JavaScript | 489487 | `103e6c96d67a8c1d4e307b4bd2e955a6bec60221911447d389994f3a7fc4286d` |
| Reader CSS | 7393 | `3dfda0cb0df58516131bb1b7da5402880e18cf4df48336f7490e4a7b1b430184` |
| Reader manifest | 12079 | `21e16f5be2667555862a5f5aa27823aab66acf6f01d6fbc6c4e6a381f1013709` |
| Third-party notices | 86383 | `2939337eb66613e0414361d5ee5436ff544bae6d5a51f103f0851da837cbcc80` |

Reader source hash: `sha256:bb1d0f3e528b4bcb8cb8ea831c8b0472e32618e935b090f85f29278ea7e584ad`.
Build hash: `sha256:02f47fd8e4154e8c01ed0e025da4ca2433181b97ade110fef086c8f1b3342e10`.
Capabilities stayed in local process memory and are not retained in evidence.

## Native Journey Results

| Check | Wizard | SDD |
| --- | --- | --- |
| Existing primary preview opens in the same native canvas | PASS | PASS |
| Synthetic source path/revision/content verified | PASS | PASS |
| Wide TOC and Markdown article visible together | PASS | PASS |
| Actual Enter on Details focuses the heading | PASS | PASS |
| Research link opens the related synthetic document | PASS | PASS |
| Previous artifact restores the specification | PASS | PASS |
| Back restores the exact original control and settled geometry | PASS after correction | PASS |
| Original feature/stage view preserved | PASS, exact view text | PASS, original feature/trigger |
| Post-startup fixture files unchanged by reading/navigation | PASS, 32 hashes | PASS, 32 hashes |

The first extended native Wizard journey found a real return-focus defect:
background state messages rebuilt the hidden workflow and detached its invoking
button. A browser regression replayed the same state message and failed at the
original button's `isConnected` assertion. Guarding workflow DOM rendering while
the reader is open made that exact regression pass. The corrected script was
hash-verified in the App and the native journey repeated successfully.

The final native measurement baseline was taken **after the reopened Wizard's
normal startup and after focus/scroll settled**, immediately before opening.
An earlier comparison used the previous instance's baseline and a rectangle
captured before native ScrollIntoView settled; it found only the approved Wizard
startup state change and an incorrect pre-scroll rectangle. Those comparisons are
not reported as passes. The final replay restored the exact runtime ID, geometry,
and workflow text, with all 32 hashes unchanged and no added files.

The initial Wizard TOC image without the `-verified` suffix is retained as an
intermediate capture, not the final return-verification evidence. Reading and
navigation invoked no workflow buttons, setup actions, or model commands. App
open requests and approved startup/reload operations are recorded separately and
are not mislabeled as side-effect-free reading.

## Automated Corroboration and Limits

- Full canvas regression suite: **332 pass**, 0 fail/skip/cancel, before the final
  static render guard; that guard's focused regression and the complete browser
  replay passed afterward.
- Reader component/outline/TOC/lifecycle tests: **19 pass**.
- Final actual-shell browser replay: **24 pass**, including the background-refresh
  regression, both primary/related journeys, 14 responsive/zoom cases, and two
  exact-container breakpoint cases. Browser tests verify zero passive external
  requests and no workflow dispatch/source mutation in their owned harness.
- Typecheck, lint, dependency-closed build, and identical-distribution verification
  passed. See [the TOC matrix](us3-safe-accessible-reader.md) for commands, red
  records, the 14 retained browser screenshots, and the CSS-zoom qualification.
- Native captures prove the requested visual milestone, not the remaining
  freshness/performance, clarification migration, full Windows threat corpus,
  participant study, fork publication, update/rollback, or release gates.

The original checkout remains clean; the App worktree has only approved untracked
fixture, extension, payload, and Wizard state directories. No commit, push,
publication, original application edit, or workflow execution occurred. The
post-execution hook file `.specify/extensions.yml` was absent; no hooks dispatched.
