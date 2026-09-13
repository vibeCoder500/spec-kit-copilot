# SDD Markdown Preview for Existing Repositories

This experimental build adds the Markdown preview and table of contents to the
existing Spec-Driven Development canvas (`sdd-canvas`). It reads your existing
specs, research, plans, tasks, and related Markdown. It does not initialize Spec
Kit, regenerate artifacts, copy sample specs, install skills, or run a workflow.

This is a complete replacement build of the existing SDD canvas, not an extra
viewer-only plugin or an official release. The Wizard canvas is not changed.
Original plugin identity and license metadata are retained; BUILD-INFO.json
identifies this preview's source and exact payload. No npm install or build is
required on the tester's machine. The Copilot App supplies its extension SDK.

## Prerequisites

- GitHub Copilot App with local project-extension support and a compatible account.
- Node.js 24 available on PATH. Local validation used Node 24.19.0 on Windows.
- An existing SDD-enabled Git repository with `.specify/` and `specs/<feature>/spec.md`.
- The actual App session worktree path. The App may create a different worktree
  from the folder initially selected; confirm its effective working directory.
- Exactly one active provider for `sdd-canvas` in the test scope.

Native local loading was previously demonstrated on App 1.1.20 on Windows.
That is a tested baseline, not a guaranteed minimum version or cross-platform
certification. This current payload still needs tester/native acceptance.

## Before Installing

Close the SDD canvas and pause/close the test App session. Record your repository
status. Extract this kit outside your repository and keep it for removal.
Verify the ZIP checksum supplied by the sender before trusting its scripts.

If SDD comes from a user/global installed plugin, disable that competing provider
in an appropriate isolated test scope using the host's supported controls. This
script does not inspect or change your installed plugin inventory. If the host
cannot isolate or disable that provider, stop and arrange a supported replacement
with the canvas team; do not run two providers with the same canvas ID.

If SDD is already project-local, the explicit `--replace-existing` option backs
up that extension before replacing it. Without that flag, existing files are
never overwritten. Other plugin versions are not merged: this is the complete
recorded preview build, restored afterward to your prior local version.

## Install

Run from the extracted kit directory. Substitute your effective App worktree:

```powershell
node preview.mjs verify
node preview.mjs install --workspace "C:\path\to\app-worktree" --isolated-provider-confirmed --dry-run
node preview.mjs install --workspace "C:\path\to\app-worktree" --isolated-provider-confirmed
```

For an existing project-local SDD extension, add `--replace-existing` to the
install commands. The confirmation flag records your explicit provider check;
it does not automatically establish isolation.

Only these paths are changed:

```text
.github/extensions/sdd-canvas/       installed extension
.github/.sdd-markdown-preview/      receipt and optional original backup
```

Do not commit these temporary test paths or their backup. No `.git`, `.specify`,
spec documents, skills, workflow state, or global plugin directory is modified.
Checksum verification detects accidental changes; it is not a digital signature.

## Test Your Existing Specs

1. Restart the Copilot App so it rediscovers project-local extensions. Reconfirm
   the effective worktree and exactly one `sdd-canvas` provider.
2. Open the existing Spec-Driven Development canvas. No setup or run action is needed.
3. Select a feature that already has a specification and use its normal View action.
4. Confirm the Markdown preview and section navigation. Widen the panel to see
   the persistent TOC rail; narrower panels use the Sections drawer.
5. Jump to a heading, switch to an existing Research/Plan/Tasks artifact, use
   Previous/Next artifact, and return to the same feature/stage.
6. Repeat with another existing spec iteration. Reading must not change the
   documents or mark a stage complete. Check repository status again.

This is a read-only acceptance exercise. Do not click Run, Setup, Apply, or
Submit clarification unless you separately intend to authorize that workflow.
Raw HTML and images stay inert; Markdown files are limited to 5 MiB.

If the old preview remains, restart the App process normally and verify its
effective worktree and active provider. Do not add a second copy or bypass a
host policy restriction. CLI ZIP installation is not the loading mechanism.

## Undo

Close the SDD canvas/session first, then use this same extracted kit:

```powershell
node preview.mjs remove --workspace "C:\path\to\app-worktree" --dry-run
node preview.mjs remove --workspace "C:\path\to\app-worktree"
```

Removal verifies every installed file. It restores a backed-up project-local
extension byte-for-byte, or removes only the preview it installed. Unexpected
files or edits cause refusal rather than deletion. Keep any edits separately
and resolve them before retrying; do not force-delete the backup. Interrupted
installation state is retained for manual recovery instead of guessing.

Restart the App and re-enable the original provider if you disabled one. Verify
the original canvas and repository state. The kit never changes that provider's
global installation or configuration.

## Feedback

Send the sender the kit/payload hash from BUILD-INFO.json, OS/App/Node versions,
which checks passed/failed, whether removal restored your original canvas, and
a redacted screenshot of the preview plus TOC. Do not include private spec text,
repository paths, capability URLs, credentials, or raw authenticated logs without
authorization. No telemetry, upload, or feedback submission happens automatically.
