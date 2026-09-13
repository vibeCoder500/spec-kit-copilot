# Implementation Gates

## T001 Baseline

- Recorded: 2026-09-09, before implementation edits.
- Checkout: `spec-kit-copilot-markdown`, the existing development workspace.
- Branch: `main`; no implementation branch was created.
- HEAD and researched upstream base: `96ed37d9134c63d6cb05236879a8e1dcea010e3f`.
- Only remote: `origin`, `https://github.com/github/spec-kit-copilot.git`.
- Tracked changes before this run: none.
- Pre-existing untracked paths: `.github/agents/`, `.github/prompts/`, `.vscode/`, and `specs/`.
- Existing ignored initialization and runtime paths remain in place. No reinitialization, reset, stash, clean, fetch, branch switch, commit, or push was run.
- Node: `v24.19.0`; npm: `11.17.0`; PowerShell: `7.6.6`; OS: Windows.
- Specification checklist: 16 completed, 0 incomplete.
- Constitution: unratified template; maintainer guidance and accepted feature requirements apply.
- Extension hooks: no `.specify/extensions.yml` exists at this check.

## Authority and Ownership

| Operation or field | Status | Boundary |
| --- | --- | --- |
| Sequential implementation and local validation | Requested | User requested all phases task by task followed by E2E testing. |
| Build dependency installation and license review | Approved locally, 2026-09-09 | User selected "Approve local dependency installation" for pinned reader/test packages and the existing Wizard prerequisite; lifecycle scripts stay disabled and license/audit checks precede use. |
| Private EzPz implementation reuse | Not approved | Independently author the probe from public APIs; do not copy private source or CSS. |
| Fork owner, repository, visibility, intended users | Undecided | Existing upstream remote is not an approved fork destination. |
| Fork maintenance and support owner | Unassigned | Required before release; never infer from the local account. |
| Disposable App fixture and local plugin loading | Approved for isolated probe, 2026-09-09 | User selected "Approve isolated fixture and App probe" for an absent EzPzSpec-canvas-md-test worktree and new owned project-local extension directories; effective workspace and single-provider isolation still require verification. |
| T016 real App gate | Blocked on effective workspace verification | App version 1.1.15 is present; the approved detached worktree exists, but no verified fixture session or isolated provider evidence is available. See [early-two-canvas-gate.md](early-two-canvas-gate.md). T017 and later remain unstarted. |
| Live workflow stage execution | Not approved | Simulated file changes and browser tests cannot substitute for this approval. |
| Hosted fork, remote addition, commits, pushes, release publication | Not approved | Request exact destination and action approval when reached. |
| Installed plugin update and rollback | Not approved | Requires verified isolated scope and supported host source/ref behavior. |

## Preservation and Setup Verification

- Work remains in this development checkout; no EzPzSpec or other application files have been modified.
- The installed handoff helper, official plugins, user sessions, and host profiles have not been accessed or changed.
- Git repository detection succeeded. Existing `node_modules/` protection is retained; ignore rules now cover local build/test output, logs, secrets, and editor temporaries.
- Generated reader assets under each plugin's vendor directory must remain trackable.
- No Docker, ESLint, Prettier, Terraform, Helm, or publishable npm package configuration was detected before this run. Their extra ignore files are not needed yet; reader lint exclusions will be scoped when introduced.
- T001 records pending gates, not their approval or successful execution. No E2E result is claimed here.

## T002 Dependency Review

- Direct package versions and licenses were read through npm's existing configured registry. No registry, TLS, or proxy settings were changed.
- Renderer pins are unchanged. The user explicitly approved replacing Vite 8.0.10 with 8.0.16 after audit identified GHSA-fx2h-pf6j-xcff and GHSA-v6wh-96g9-6wx3 in the original pin. Test and lint tools are exact stable versions; the alpha-tagged TypeScript ESLint latest release was not selected.
- Direct license families: MIT, ISC, and Apache-2.0. Lockfile transitive license, source URL, and audit review follows resolution before execution.
- All dependencies are build/test-only in a private Wizard-owned package. No runtime renderer installation or root npm workspace is introduced.
- The reader and probe are independently authored using public library APIs. Private EzPz source/CSS reuse and all publication actions remain unapproved.
- Initial resolution identified MPL-2.0 in Lightning CSS and its platform builds, used as local build tooling and not shipped browser code. Required notices will follow actual bundled-module provenance, not assume every installed development tool is redistributed.
- The only detected dependency install script is esbuild's; it remains disabled. No vulnerable Vite code was executed before patch approval.
- Patched lockfile audit: 0 vulnerabilities, exit 0. `npm ci --ignore-scripts --no-fund --no-audit` and `npm ls --depth=0` passed with all 21 exact direct pins. Installation added 253 local packages; platform-specific optional dependencies remain represented in the lockfile.
- T002 completed dependency resolution and installation only. Reader builds, canvas loading, and E2E acceptance have not yet run.

## 2026-09-13 T092 Authority Checkpoint

The earlier sections preserve their initial baseline observations. Current state:

- T001-T091 are complete. [Clarification](us5-clarifications.md), [Windows security](us6-security.md), and [independent payload](independent-payloads.md) checkpoints are recorded. Latest applicable tests: 371 canvas, 32 reader, 29 tooling, and 38 actual-shell browser cases pass. Typecheck, lint, build, package verification, and changed-file diagnostics pass.
- The early T016 gate and the user's requested native TOC/Markdown visual proof passed in both canvases. [Native proof](native-toc-proof-2026-09-13.md) records the exact earlier App payload and screenshots; it is not latest-build evidence.
- Existing separately approved fixture loading, core plugin installation, skill reload, and App restarts are documented in the host-probe/native proof records. No real workflow stage was executed by the automated fixtures.
- Current integration branch remains `main`, with implementation changes unstaged. No assistant-issued branch creation, commit, remote change, push, or publication occurred. Plugin, marketplace, and root README versions remain unchanged.
- Git status of the original EzPzSpec repository is clean on `005-web-spec-workflows`. Its source and installed handoff helper were not edited.
- `.specify/extensions.yml` remains absent; there are no after-implementation hooks to dispatch at this checkpoint.
- CI definitions and local equivalents are validated; hosted runners have not run. The release validator reports `not-requested`, `publicationReady=false`, and `release_record_absent`. Synthetic unit-test specimens are not release evidence.

T092 remains **blocked pending an explicit scope/authority decision**. Required
fields are fork owner/repository/visibility, intended users, support owner,
publication authority, and installation scope. Independent authorship is the
recorded source-reuse decision. No destination or support assignment is inferred
from the local account or the existing upstream remote.

Continuing a maintained fork requires those fields before T093/T094 version
selection. Live stage output, the ten-participant uncoached study, deliberate
update/rollback, and publication retain their separate approvals and evidence
requirements. Alternatively, the user may explicitly defer fork-dependent work
and authorize local-only latest-build native proof/documentation; that changes the
remaining release scope rather than marking incomplete release tasks complete.
