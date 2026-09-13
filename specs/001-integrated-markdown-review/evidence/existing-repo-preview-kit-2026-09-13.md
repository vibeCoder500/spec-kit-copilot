# Existing-Repository SDD Preview Kit

Status: local preview artifact exported and validated, 2026-09-13.
The user requested a shareable artifact for a recipient whose SDD repository
already contains generated spec iterations. No sample project or Spec Kit setup
is delivered. This does not complete or waive the maintained-fork release gates.

## Artifact

- ZIP: `dist/previews/spec-kit-sdd-markdown-preview-4a6f637.zip`.
- ZIP size: 293,156 bytes; 22 files inside the enclosing kit directory.
- ZIP SHA-256: `c6e49c99041f062da24832f9d7768b22f3e7a3f68e83f5c75ba618db93ef073f`.
- Adjacent checksum: `spec-kit-sdd-markdown-preview-4a6f637.zip.sha256`.
- SDD payload SHA-256: `2dc8adb2c38cba1f6b5b8102afeb6c559b2b3e91dcf54fd2be8a9d6e8b0fddc4`.
- Source checkpoint: `4a6f6370559e37b3742d60ebd7f4fcd230d69233`; runtime payload is unchanged from that verified checkpoint. The newly added export/installer tooling is not yet committed.
- Reader build hash: `sha256:5f51f164a1884bd262e5465869bc0ec3b3ff2d20fbd1642fdd741ada3f24f253`.
- Existing plugin version remains `0.1.0`. This is explicitly an experimental replacement build, not a new official release.

The archive contains the complete independently verified SDD plugin, portable
Node installer/verifier, recipient instructions, build information, and checksums.
No Wizard payload, sample spec, skill, simulated setup state, development
dependency, private repository file, capability, or credential is exported.
The host-provided SDK is required; no recipient npm install or build is needed.

## Loading Boundary

The installer uses the recipient's explicitly supplied effective Copilot App
worktree. It requires an existing Git/SDD layout and at least one existing
`specs/<feature>/spec.md`. It never initializes or regenerates Spec Kit.

Only `.github/extensions/sdd-canvas/` and `.github/.sdd-markdown-preview/` are
written, along with missing parent directories. An existing project-local SDD
extension is refused unless `--replace-existing` explicitly authorizes backup
and replacement. Undo verifies installed and backup hashes before removing or
restoring anything; edits and unexpected files are preserved by refusal.

This is a replacement of the existing `sdd-canvas` implementation, not a second
viewer-only provider. `--isolated-provider-confirmed` requires the tester to
establish one provider first. The installer does not discover, disable, or modify
global plugins. If the host cannot isolate an existing installed SDD provider,
the tester must stop and arrange supported replacement with the canvas team.

## Validation

Windows, Node 24.19.0, Playwright 1.63.0, installed Edge browser.

```text
node --test scripts/canvas-reader/test/preview-kit.test.mjs
7 passed, 0 skipped.

npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run lint
Passed.

npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:tools
36 passed, 0 skipped.

node scripts/canvas-reader/export-preview.mjs --output dist/previews/spec-kit-sdd-markdown-preview-4a6f637
Exported and verified 22 files.

node <freshly-extracted-kit>/preview.mjs verify
Passed.

CANVAS_READER_PREVIEW_KIT=<freshly-extracted-kit>
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser -- preview-kit.spec.mjs
1 passed using the extracted ZIP's installer and plugin.
```

The installer tests cover no-op dry-run, explicit provider confirmation,
existing-extension refusal, byte-exact backup/restore, payload tampering,
unexpected installed files, redirected project paths, altered backups, and
two pre-existing feature iterations. Existing specs, research, completed tasks,
and constitution remain byte-for-byte unchanged; no skills or setup state appear.

The browser test installs the extracted extension into a separate synthetic
project whose specs already exist, opens the actual SDD shell, checks the TOC,
follows Research, uses artifact history, and restores dashboard focus/context.
It records zero external requests and zero mocked workflow dispatches, then
removes the preview and verifies the original document bytes again.

[Extracted-kit screenshot](screenshots/2026-09-13/sdd-existing-repo-preview-kit.png):
1280x900, 27,047 bytes, SHA-256
`e094245528282de7749a534c1a138a9bf766441a83a153f052fc5560370d3803`.
The synthetic screenshot was visually inspected. It is an actual-shell browser
capture with a mocked SDK, not a native Copilot App screenshot or a private repo.

Original EzPzSpec Git status remains clean. No real user repository was installed
into, no global provider was changed, and no workflow, publication, push, or
additional commit occurred. Exported archives remain ignored under `dist/`.
Earlier native App 1.1.20 TOC proof is separate; recipient/native acceptance of
this exact archive remains outstanding. No extension hooks are registered.
