# SDD Markdown Preview: Tester User Manual

**Audience:** someone who already uses the Spec-Driven Development canvas in the
GitHub Copilot App and has existing Spec Kit specifications in a Git repository.

**Purpose:** temporarily load an experimental SDD canvas build, review your own
existing specifications with a Markdown preview and table of contents, and restore
your original canvas afterward. You do not need the implementation repository.

**Manual date:** 2026-09-13. **Platform covered by these commands:** Windows with
PowerShell 7. Other operating systems have not been validated by this manual.

The ZIP pinned below is unchanged and does not include the newer repository
browser. The separate [repository browser guide](sdd-repository-browser.md)
describes that unreleased development feature; do not substitute its runtime for
this manual's checksummed preview.

## 1. What This Preview Changes

The kit temporarily replaces the implementation of the existing `sdd-canvas`.
It is not a separate Markdown-only canvas, a VS Code extension, or a patch that
can be injected into any arbitrary version of an installed plugin.

You should see your existing feature list and View actions. Opening an artifact
adds rendered Markdown, section navigation, related-file selection, document
history, source identity, and a return to the existing dashboard.

The installer does not initialize Spec Kit, run an SDD iteration, generate sample
specs, install dependencies or skills, commit files, or change global plugins.
No reader build or `npm install` is required on your machine. The Copilot App
provides the extension SDK.

**Important:** the replacement is still a full SDD canvas with workflow controls.
The installer does not disable those controls. This manual authorizes a read-only
test only: do not use Setup, Run, Rerun, Implement, Apply, or Submit clarification.
Do not ask Copilot to generate or update artifacts during this test.

## 2. Files to Receive

Ask the sender for these three files through an approved sharing channel:

| File | Purpose |
| --- | --- |
| `spec-kit-sdd-markdown-preview-4a6f637.zip` | Complete SDD payload, installer, bundled instructions, and checksum manifest. |
| `spec-kit-sdd-markdown-preview-4a6f637.zip.sha256` | ZIP checksum supplied by the sender. |
| This user manual | Standalone installation, testing, and removal procedure. |

This exact ZIP is **293,156 bytes**, with SHA-256:

```text
c6e49c99041f062da24832f9d7768b22f3e7a3f68e83f5c75ba618db93ef073f
```

The runtime source checkpoint is `4a6f6370559e37b3742d60ebd7f4fcd230d69233`.
The kit retains plugin version `0.1.0`; that version alone cannot distinguish the
preview from another SDD build. Use the supplied checksums and build information.

Checksums detect changes, not publisher identity. Confirm the sender and checksum
through a trusted channel before executing anything. If your ZIP is a different
build, obtain its matching manual and checksums; do not substitute this hash.

## 3. Prerequisites and Safety

Before starting, confirm all of the following:

- You have access to the GitHub Copilot App, not only Copilot Chat in VS Code.
- Your App version and account permit project-local canvas extensions.
- Node.js 24, Git, and PowerShell 7 are available on your machine.
- Your App session uses a locally accessible Git working tree with `.specify/`
  and at least one existing `specs/<feature>/spec.md`.
- You have permission to test a temporary replacement extension in that project.
- You can establish exactly one active provider for `sdd-canvas` in the test scope.
- Existing work is saved, and no workflow, agent edit, or background regeneration
  will modify the project during the read-only test.

Use a disposable working copy of an existing SDD repository when practical. Do
not create or switch branches, discard changes, or reset a working tree just to
make this test pass. Preserve any pre-existing changes and record them below.

Run in PowerShell:

```powershell
$PSVersionTable.PSVersion
node --version
git --version
```

Expected: PowerShell major version 7 and Node major version 24. Local automated
validation used Node 24.19.0. Record your Git version; this kit does not prescribe
a new Git installation. Use your organization's normal process for missing tools.
Do not bypass execution, security, or account policies to continue.

Earlier native TOC integration was demonstrated on Windows with Copilot App
1.1.20. That is not a guaranteed minimum version. This ZIP passed extracted-copy
automated browser tests, but native acceptance of this exact ZIP on your machine
is part of the test, not an already-established result.

## 4. Verify and Extract the ZIP

Download the ZIP and checksum outside your repository. The examples below assume
your Downloads folder. Change only the path if you saved the files elsewhere.

```powershell
$artifactName = 'spec-kit-sdd-markdown-preview-4a6f637'
$archive = Join-Path (Join-Path $HOME 'Downloads') "$artifactName.zip"
$expectedHash = 'c6e49c99041f062da24832f9d7768b22f3e7a3f68e83f5c75ba618db93ef073f'
$actualHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) { throw 'ZIP checksum mismatch. Stop and contact the sender.' }
$actualHash
```

Expected: the exact hash above, also matching the sender's sidecar. Do not extract
and run a mismatching artifact or edit its checksum manifest to make it pass.

Extract to a new directory. If the chosen directory exists, choose a new name;
do not merge extractions or overwrite a previous test kit.

```powershell
$extractRoot = Join-Path $HOME 'CopilotPreviewTests/sdd-preview-test-01'
if (Test-Path -LiteralPath $extractRoot) { throw 'Choose a new extraction directory.' }
Expand-Archive -LiteralPath $archive -DestinationPath $extractRoot
$kit = Join-Path $extractRoot $artifactName
$record = Join-Path $extractRoot 'test-record'
New-Item -ItemType Directory -Path $record -ErrorAction Stop | Out-Null
Set-Location -LiteralPath $kit
node ./preview.mjs verify
if ($LASTEXITCODE -ne 0) { throw 'Kit verification failed. Stop.' }
```

Expected verification fields:

```json
{
  "status": "verified",
  "pluginId": "spec-kit-copilot-sdd",
  "canvasId": "sdd-canvas",
  "payloadSha256": "2dc8adb2c38cba1f6b5b8102afeb6c559b2b3e91dcf54fd2be8a9d6e8b0fddc4",
  "sourceCommit": "4a6f6370559e37b3742d60ebd7f4fcd230d69233",
  "previewOnly": true
}
```

**Keep the extracted kit unchanged.** Its verification rejects unexpected or
modified files. Do not save this manual, screenshots, notes, or command output
inside `$kit`. Use the separate `$record` directory. Do not edit or auto-format
the installed extension or its backup either. Retain the same kit for removal.

## 5. Identify the Actual App Worktree

Open your existing repository/session in the Copilot App. Determine its effective
working directory using the App's session/workspace information or supported
read-only inspection. The App can create another worktree instead of using the
folder originally selected. Installing into the original clone may therefore
have no effect on this session.

If needed, use this request in that App session:

```text
Using available read-only inspection, report this session's actual working
directory and Git top-level directory. Do not install, initialize, edit files,
run a workflow, or print document contents or capability URLs. If these values
cannot be verified, say they are not verified.
```

Keep that output local. Use the verified Git top-level directory below, not a
remote GitHub URL and not the path to an individual spec file.

```powershell
$workspace = (Resolve-Path -LiteralPath 'C:\path\to\actual-app-worktree').Path
git -C $workspace rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'The selected directory is not a Git worktree.' }
git -C $workspace rev-parse HEAD
Test-Path -LiteralPath (Join-Path $workspace '.git')
Test-Path -LiteralPath (Join-Path $workspace '.specify') -PathType Container
Test-Path -LiteralPath (Join-Path $workspace 'specs') -PathType Container
Get-ChildItem -LiteralPath (Join-Path $workspace 'specs') -Directory |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'spec.md') -PathType Leaf } |
    Select-Object -ExpandProperty Name
```

Expected: the Git top-level matches the App worktree, all three checks return
`True`, and at least one existing feature is listed. `.git` may be a file in a
linked worktree; that is valid. Stop if the paths cannot be confirmed. Do not run
`specify init` or copy synthetic setup state to satisfy these checks.

Choose one existing feature and, if available, a second iteration for testing.
Note a heading and an existing related document you can recognize in each.

## 6. Isolate the SDD Provider

A provider is an extension registering the canvas ID `sdd-canvas`. The existing
plugin and this replacement must not both be active for that ID. One visible
canvas tab is not proof of one provider.

Record the currently active SDD provider's source, scope, version, and enabled
state through the host's supported plugin/extension inspection. If live discovery
is available, request the registered providers for `sdd-canvas` and their source
scopes. Treat a result without inspection as unverified.

Check for a project-local installation:

```powershell
$localSdd = Join-Path $workspace '.github/extensions/sdd-canvas'
Test-Path -LiteralPath $localSdd
```

Use this decision table:

| Current situation | Required action |
| --- | --- |
| No local SDD extension and no competing installed provider | Use installation path A below. |
| Existing project-local SDD extension, with no competing provider | Use path B to explicitly back it up and replace it. |
| SDD supplied by a user/global/marketplace plugin | Use the host's supported controls to disable or isolate that SDD provider for the test; record how to re-enable it. Then select A or B based on the local directory. |
| Both local and another active provider, unknown source, or inability to isolate | Stop and ask the canvas team for a supported replacement scope. |

Host controls vary by version; there is no universal disable command supplied
by this kit. Do not edit global plugin caches, assume local-provider precedence,
or remove unrelated plugins. Keep the core Spec Kit skills plugin enabled.
If disabling SDD would affect other active sessions, arrange an isolated test
first rather than changing those sessions without consent.

`--isolated-provider-confirmed` is your acknowledgement of this check. The script
does not establish isolation, discover global providers, or disable them for you.
If supported isolation is unavailable, this ZIP is not a one-click solution for
that host; coordinate a supported replacement with its maintainers.

## 7. Record the Before State

Close the SDD canvas and pause or close the test App session. Keep the verified
worktree in place. Ensure no agent is editing the project. Keep this PowerShell
window open until removal, since later steps reuse these variables.

Capture Git status, including pre-existing changes, in your separate test record:

```powershell
$gitBefore = @(git -C $workspace status --porcelain=v1 --untracked-files=all)
if ($LASTEXITCODE -ne 0) { throw 'Could not record repository status.' }
$gitBefore | Set-Content -LiteralPath (Join-Path $record 'git-before.txt') -Encoding utf8
```

Git status alone does not prove ignored or untracked spec content stayed the
same. Also hash the existing spec, Spec Kit, and skill files without changing them:

```powershell
function Get-SddSourceSnapshot {
    param([Parameter(Mandatory)][string]$Root)
    $rows = foreach ($part in @('specs', '.specify', '.github/skills')) {
        $directory = Join-Path $Root $part
        if (Test-Path -LiteralPath $directory -PathType Container) {
            Get-ChildItem -LiteralPath $directory -File -Recurse -Force -ErrorAction Stop |
                ForEach-Object {
                    [pscustomobject]@{
                        Path = [System.IO.Path]::GetRelativePath($Root, $_.FullName).Replace('\', '/')
                        SHA256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
                    }
                }
        }
    }
    @($rows | Sort-Object Path)
}
$filesBefore = @(Get-SddSourceSnapshot -Root $workspace)
$filesBefore | Export-Csv -LiteralPath (Join-Path $record 'source-before.csv') -NoTypeInformation
```

Keep these records local; they can contain private repository filenames. The
snapshot covers ordinary files under those three directories, not a full-machine
backup. Redirected or inaccessible project paths require review, not bypasses.

## 8. Install: Choose A or B

Run from `$kit`. The dry run verifies inputs but does not write an installation.
Check the returned status and stop on any error before running the next command.

### A. No Existing Project-Local SDD Extension

```powershell
Set-Location -LiteralPath $kit
node ./preview.mjs install --workspace "$workspace" --isolated-provider-confirmed --dry-run
if ($LASTEXITCODE -ne 0) { throw 'Dry run failed. Do not continue.' }
```

Expected: `status: "dry-run"`, `action: "install"`, `specsModified: false`.

```powershell
node ./preview.mjs install --workspace "$workspace" --isolated-provider-confirmed
if ($LASTEXITCODE -ne 0) { throw 'Installation failed. Preserve the receipt/state for recovery.' }
```

Expected: `status: "installed"`, `originalBackedUp: false`,
`specsModified: false`, and `restartRequired: true`.

### B. Replace an Existing Project-Local SDD Extension

Only use this path when you intentionally want to replace the entire existing
local SDD implementation for the test. This does not merge newer plugin features
or customizations into the preview; the original directory is retained as backup.

```powershell
Set-Location -LiteralPath $kit
node ./preview.mjs install --workspace "$workspace" --isolated-provider-confirmed --replace-existing --dry-run
if ($LASTEXITCODE -ne 0) { throw 'Replacement dry run failed. Do not continue.' }
```

Expected: `status: "dry-run"`, `action: "replace-with-backup"`.

```powershell
node ./preview.mjs install --workspace "$workspace" --isolated-provider-confirmed --replace-existing
if ($LASTEXITCODE -ne 0) { throw 'Replacement failed. Preserve the receipt and backup.' }
```

Expected: `status: "installed"`, `originalBackedUp: true`,
`specsModified: false`, and `restartRequired: true`.

### What Was Written

| Worktree-relative path | Contents |
| --- | --- |
| `.github/extensions/sdd-canvas/` | Complete temporary SDD canvas implementation and reader assets. |
| `.github/.sdd-markdown-preview/receipt.json` | Installation identity and file hashes needed for undo. |
| `.github/.sdd-markdown-preview/backup/` | Your original local extension, only when replacement was selected. |

Missing `.github` or `.github/extensions` parents may be created. The installer
does not modify `.git`, `.specify`, `specs`, skills, global plugin settings, or your
Git ignore rules. The JSON `specsModified: false` is an installer report, not a
substitute for the before/after comparisons in this manual.

**Do not commit these temporary extension/receipt/backup paths.** They may appear
as untracked files or, when replacing a tracked local extension, as tracked
modifications. Do not run `git add .`, Git cleanup, reset, or extension auto-format
over the test installation. Keep the backup and same extracted kit until undo.

## 9. Restart and Confirm the Loaded Build

1. Restart the Copilot App normally using supported close/exit and launch actions.
   Closing only a canvas tab may leave the previous extension process loaded.
   Save unrelated work first; do not force-kill other sessions or processes.
2. Return to the same verified test session/worktree. Recheck its effective
   directory; opening another session can select another worktree.
3. Use available live extension discovery to verify exactly one provider owns
   `sdd-canvas`, and that it is the project-local extension just installed.
4. Open the existing **Spec-Driven Development** canvas using its normal App entry
   point. Do not open Wizard or create a new Markdown canvas for this test.

If the normal opening action is through chat, a bounded request is:

```text
Open the existing sdd-canvas with default input in this verified test workspace.
Do not run setup, install anything, regenerate specs, submit clarifications,
or execute any workflow. If the canvas is not available, report that and stop.
```

The name and plugin version can remain the same as the original. Confirm the
loaded provider source and the new preview behavior, not the version label alone.
If there is no live discovery method, record provider identity as unverified and
ask the team for a supported verification route; do not report native acceptance.

## 10. Test Your Existing Specifications

Do not create or edit artifacts to complete these checks. Use files already
present. If a required related document or second iteration is absent, record
that case as `not applicable`, not as a pass.

| ID | Action | Expected result |
| --- | --- | --- |
| T01 | Select the existing feature chosen earlier and use its normal View action for the specification. | The spec opens inside the SDD canvas, with its relative source path and working-tree revision. Existing text is rendered, not regenerated. |
| T02 | Widen/maximize the canvas panel. | The left TOC rail and Markdown article are visible together when the reader container is at least 820 px wide. A wide screen alone does not guarantee a wide panel. |
| T03 | Select a known heading in the TOC, then scroll the article. | Section navigation stays in the document and the highlighted TOC item tracks the reading position. |
| T04 | Use Tab to reach a TOC item and press Enter. | Keyboard navigation reaches the intended section with a visible focus indication. |
| T05 | Narrow the reader panel and open its section-navigation drawer. Press Escape; reopen and select a section. | Narrow layouts use a drawer instead of a permanent rail. Escape closes the drawer before leaving the review; choosing a section closes it and focuses the destination. |
| T06 | Use the Artifacts selector to open an existing Research, Plan, Tasks, checklist, or contract document. | Only available scoped artifacts are readable. Switching files does not change the workflow stage or mark it complete. |
| T07 | Use Previous artifact and Next artifact. If the spec contains a safe relative Markdown link, follow it too. | History stays inside the review; existing related documents open without leaving the canvas. Expected files that do not exist are not presented as readable content. |
| T08 | Inspect a table, list, task checkbox, code block, and footnote where present. | Markdown is formatted; task checkboxes are disabled. Wide tables/code scroll within the reader. Images are placeholders and raw HTML is not executed. |
| T09 | Use Refresh artifact without editing the source. | The same current document remains available. Refresh is not a workflow rerun. |
| T10 | Choose Back to dashboard. | The original feature/stage, dashboard context, and invoking control are restored. No task or stage is marked complete by reading. |
| T11 | Repeat View, section navigation, and return with another existing spec iteration. | The document identity and contents belong to that iteration; the previous feature's document does not leak into the new view. |
| T12 | Compare source hashes using section 11. | No added, removed, or modified source file appears in the recorded source directories. |

For a screen capture, show the TOC and preview together only if the content may
be shared. Existing specs can be confidential. Otherwise crop/redact locally or
report the result without a screenshot. Do not capture chat, unrelated projects,
local paths, browser capability URLs, or authentication details.

### Behaviors That Are Intentional

- Only `.md` and `.markdown` files are supported, up to 5,242,880 bytes (5 MiB).
- Invalid UTF-8, NUL/binary content, unsafe paths, and redirecting artifacts may
  be refused rather than displayed.
- Image placeholders, ignored raw HTML, and disabled task checkboxes are safety
  behavior, not missing installation dependencies.
- The TOC may be absent for a document without headings. An empty file shows an
  empty state. A missing file is not silently generated.
- This preview does not add a general repository browser, editor, diagram engine,
  or Markdown math renderer.
- Existing workflow controls remain available according to the original gates.
  Do not submit a clarification or run a stage as part of this read-only exercise.
- Do not follow external web links in this test; that is a separate explicit
  navigation action and is unnecessary to validate the local reader.

## 11. Confirm Sources Stayed Unchanged

Close the reader and pause the test session before checking. In the same PowerShell
window, compare the files with the baseline captured in section 7:

```powershell
$filesAfter = @(Get-SddSourceSnapshot -Root $workspace)
$sourceChanges = @(Compare-Object -ReferenceObject $filesBefore -DifferenceObject $filesAfter -Property Path, SHA256)
$sourceChanges | Format-Table -AutoSize
$filesAfter | Export-Csv -LiteralPath (Join-Path $record 'source-after.csv') -NoTypeInformation
if ($sourceChanges.Count -gt 0) { throw 'Source files changed. Stop and investigate before claiming a pass.' }
git -C $workspace status --short --untracked-files=all
```

Expected: no source differences. During installation, Git may show only the
temporary paths from section 8 plus your pre-existing changes. Reading does not
justify any new source changes. Other agents, tools, or normal host activity can
also cause changes; investigate their origin rather than automatically reverting
them or attributing them to the reader. Do not send raw local records publicly.

If you closed PowerShell, recreate `$workspace`, `$kit`, and `$record` with their
original values and define `Get-SddSourceSnapshot` again. Then restore both
baselines before repeating the comparison or removal checks:

```powershell
$filesBefore = @(Import-Csv -LiteralPath (Join-Path $record 'source-before.csv'))
$gitBefore = @(Get-Content -LiteralPath (Join-Path $record 'git-before.txt'))
```

A moved worktree is not the same installation target and may fail the receipt
check. Do not reconstruct a missing baseline from the post-test state and report
it as a before/after pass.

## 12. Remove the Preview and Restore SDD

Close the SDD canvas and pause/close the test App session first. Use the same
unmodified extracted kit and the same effective workspace used for installation.

```powershell
Set-Location -LiteralPath $kit
node ./preview.mjs remove --workspace "$workspace" --dry-run
if ($LASTEXITCODE -ne 0) { throw 'Removal verification failed. Preserve the installation and backup.' }
```

Expected: `status: "dry-run"` and `action: "remove"` for installation A, or
`action: "restore"` for replacement B. After reviewing that result:

```powershell
node ./preview.mjs remove --workspace "$workspace"
if ($LASTEXITCODE -ne 0) { throw 'Removal did not complete. Do not force-delete the state or backup.' }
```

Expected: `status: "removed"` for A or `status: "restored"` for B, with
`specsModified: false` and `restartRequired: true`.

The removal command checks installed files and any original backup first. Edited
files, extra files, a different kit, or a mismatched workspace cause refusal.
There is no safe general-purpose force flag. Preserve changes and contact the
sender for recovery instead of deleting receipt/backup files to bypass checks.

Before reopening the App, verify repository status and sources again:

```powershell
$gitAfter = @(git -C $workspace status --porcelain=v1 --untracked-files=all)
if ($LASTEXITCODE -ne 0) { throw 'Could not read final repository status.' }
$gitAfter | Set-Content -LiteralPath (Join-Path $record 'git-after.txt') -Encoding utf8
if (($gitBefore -join "`n") -cne ($gitAfter -join "`n")) {
    Write-Warning 'Repository status differs from the baseline. Review locally; do not reset changes.'
}
$filesFinal = @(Get-SddSourceSnapshot -Root $workspace)
Compare-Object -ReferenceObject $filesBefore -DifferenceObject $filesFinal -Property Path, SHA256
Test-Path -LiteralPath (Join-Path $workspace '.github/.sdd-markdown-preview')
```

Expected: baseline Git status, no source differences, and `False` for the preview
state directory. Under A, the project-local extension is gone. Under B, the
original local extension and all of its original files are back.

Restore the original provider's enabled state if you changed it for isolation.
Restart the App normally and confirm the original SDD canvas works with exactly
one provider. Only then remove the downloaded/extracted test kit if no longer
needed. Keep your private test record according to your organization's policy.

## 13. Troubleshooting

| Symptom | What to check or do |
| --- | --- |
| `node` is not recognized, or an unsupported runtime error occurs | Verify Node 24 is installed and on PATH using your approved process. Do not run npm installation as a workaround. |
| ZIP checksum mismatch | Stop. Confirm the build with the sender and download it again through a trusted channel. |
| Preview checksum mismatch or unexpected files | Extract a fresh, verified ZIP outside the repository. Keep manual, screenshots, and notes outside the kit directory. Do not rewrite checksums. |
| Required local paths cannot be accessed | Verify the effective App worktree, `.git`, `.specify`, `specs`, permissions, and ordinary local paths. Do not elevate or bypass policy as a retry strategy. |
| No existing spec is found | Confirm you selected the correct worktree and that `specs/<feature>/spec.md` already exists there. Do not initialize/regenerate specs for this test. |
| Provider confirmation error | Perform section 6 first. Add the confirmation flag only after establishing isolation. |
| Existing project-local extension error | Use path B only when you intend a complete local replacement with backup; otherwise stop. |
| Preview receipt already exists | A prior installation or interrupted operation needs removal/recovery using its original kit. Do not reinstall over it or delete its receipt. |
| Installation did not finish | Preserve `.github/.sdd-markdown-preview/` and the current target. Interrupted state is deliberately retained; ask for recovery help before changing it. |
| The canvas is missing, duplicated, or still has the old preview | Recheck the actual worktree and registered provider source/count, then restart the App normally. Tab reopening alone may retain cached code. Do not install a second copy. |
| The App cannot load or isolate local extensions | Stop. Request a host-supported test scope/replacement from the canvas team. The ZIP cannot override an account or host restriction. |
| Dashboard shows setup or execution is gated | Do not click Setup. Existing artifacts may remain viewable; otherwise verify the worktree and its pre-existing setup with the owner. Do not add placeholder skills/state. |
| TOC rail is not visible | Widen the reader container to at least 820 px or use the compact section drawer. Verify that the document contains headings. |
| A file is missing, unsupported, stale, disconnected, or errors | Use only existing safe Markdown within the current context. Check size/encoding, use Refresh or another artifact, and verify the original file locally without submitting a workflow. Record persistent failures. |
| Undo reports modified files or changed backup | Preserve edits and the receipt/backup. Ask the sender to help reconcile them; do not force-delete or reset the repository. |
| Undo receipt does not match | Use the original unmodified kit and original workspace location. A new kit or relocated worktree cannot silently take over an existing receipt. |

Never include raw authenticated console logs in a support report. They can contain
capabilities, OAuth data, private paths, or document contents. Share only a bounded
error category and authorized redacted evidence.

## 14. Report Results

Create a report in your separate test-record directory, not inside the kit,
installed extension, or backup. Send it to the person who supplied the preview.

```text
Preview: spec-kit-sdd-markdown-preview-4a6f637
ZIP SHA-256: c6e49c99041f062da24832f9d7768b22f3e7a3f68e83f5c75ba618db93ef073f
Test date:
OS and version:
Copilot App version:
Node version:
Installation: A / B
Original provider scope: project-local / user-global / other
Exactly one loaded SDD provider verified: yes / no / blocked
Existing iterations tested: count only; use redacted labels
T01-T12: pass / fail / not applicable, with brief notes for each
Source hashes unchanged: yes / no / not verified
Undo result: removed / restored / failed / not attempted
Original provider restored and verified: yes / no / not verified
Final Git status matches baseline: yes / no / not verified
Redacted error category, if any:
Screenshot supplied with content authorization: yes / no
```

Only mark the native test successful after the reader behavior, provider identity,
source preservation, removal, and original-canvas restoration are verified. A
successful installer message alone is not native acceptance. Cases you could
not test remain explicitly unverified. This kit does not run a live workflow,
upload data, collect telemetry, or submit feedback automatically; the Copilot
App's own service behavior and organizational policies remain separate.
