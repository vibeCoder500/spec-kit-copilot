# T016 Real App Gate: Passed

Current status (2026-09-13): both existing canvases passed the early native host
probe after verified workspace discovery and explicitly approved prerequisites.
See [the dated host probe report](host-probe-2026-09-13.md) for source hashes,
approvals, exact observations, and both actual native screenshots. This is not
full-feature acceptance or proof of the not-yet-implemented TOC/navigation surface.

| Condition | Wizard | SDD |
| --- | --- | --- |
| Existing artifact view loads packaged reader | PASS: synthetic Composition source preview | PASS: synthetic Specify preview |
| Invalid local access denied | PASS: missing capability 401; traversal 403 | PASS: capability/Origin 403; invalid selector denied |
| Intended served reader source | PASS: all four asset hashes match staged package | PASS: all four asset hashes match staged package |
| One intended provider per canvas identity | PASS: one `speckit-wizard` entry in live-discovery reply | PASS: one `sdd-canvas` entry in live-discovery reply |
| Return restores originating context | PASS: exact trigger focus/geometry and Composition text | PASS: exact trigger focus/geometry and feature |
| Reading preserves repository state | PASS: 32 baseline hashes unchanged; no tracked changes | PASS: 13 fixture hashes unchanged; no tracked changes |

Provider counts use the bounded App-agent reply to an explicitly live-discovery
request, not a separately retained raw tool trace. Both served-asset checks ran
against the servers actually opened by the App. Prerequisite installs/reload/state
writes are separately approved and excluded from the reading-only baseline.

T016 is complete. The September 9 record below is preserved as historical evidence.

## September 9 Attempt

Date: 2026-09-09. Status: blocked, not passed. T017 and later tasks have not started.

## Approved Scope and Observations

- The user approved local pinned dependencies, an owned detached EzPzSpec test worktree, and temporary project-local plugin loading without replacing official plugins.
- Actual GitHub Copilot App executable metadata reports version `1.1.15`. The running CLI executable is from the `1.0.83-5` SDK CLI installation; that path is not proof of canvas compatibility.
- Created the approved `EzPzSpec-canvas-md-test` worktree at source commit `11ae033982e6feaa35e86b584109148f38d0cebf`. The original EzPzSpec branch was not switched and no original application file was edited.
- Final Git checks confirmed the original EzPzSpec working tree is clean on `005-web-spec-workflows` and the test worktree is detached at the same commit. No commit, push, or fork remote was created.
- Native accessibility exposes the App's New project or session and local Open folder actions. Navigation used those actions only; no App message, workflow stage, setup, plugin installation, or source upload was sent.
- The user reported that the fixture was active. Subsequent read-only accessibility checks found one App window with the project selector still reading `Start from scratch`; no fixture entry or authoritative fixture working-directory evidence was available.
- The project list exposed Documents and the existing Global Event project, not an identifiable fixture. Neither was selected as a substitute. The final picker exposed a search field but not a verified folder entry/submit pair, so no unverified keyboard input was sent.
- No project-local extension was staged into an App workspace. No official plugin, active user session, private profile, credential, or installed handoff helper was modified.
- Post-execution hook check: `.specify/extensions.yml` is absent; no hooks were registered to dispatch.

## Prerequisite

The App session's effective working directory and Git root must be verified as the
approved fixture (or its explicitly verified App-created worktree) before staging.
That prerequisite remains blocked. A user-reported project-open action, window title,
CLI process, or successful browser harness cannot replace the workspace check.

## Six Conditions

| Condition | Wizard | SDD |
| --- | --- | --- |
| Existing artifact view opens packaged preview in the actual App | Not run | Not run |
| Invalid local access is denied in the actual App scope | Not run | Not run |
| Intended development source is identified in the App | Not verified | Not verified |
| Exactly one intended provider owns each existing canvas identity | Not verified | Not verified |
| Return restores the originating workflow context in the App | Not run | Not run |
| Before/after workflow repository status is preserved by the App journey | Not run | Not run |

## Evidence That Does Not Pass This Gate

[probe-validation.md](probe-validation.md) records passing reader, package,
actual-shell browser, and existing-suite checks. They use owned synthetic services
and cannot be relabeled as actual App acceptance.

## Resume Prerequisites

1. Select the approved fixture through the App's project selector and obtain the foreground session's authoritative working directory and Git root using its read-only facilities.
2. Confirm a supported isolated loading method and one intended provider per existing canvas before staging complete local payloads. Matching official/fork IDs must not be silently replaced or duplicated.
3. Run and record all six conditions in both canvases. Only then mark T016 complete and continue sequentially with T017.

The detached worktree is retained for this approved test. No cleanup should remove it
without first checking for user changes. Fork ownership, publication, live workflow
execution, update/rollback, and the participant study remain separate later gates.
