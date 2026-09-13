# Start Here: SDD Markdown Preview

This share bundle lets you test Markdown preview and table-of-contents navigation
against your existing specifications in the GitHub Copilot App's SDD canvas.
It is an experimental replacement build, not an official plugin release.

1. Extract the outer share ZIP to a new folder outside your repository.
2. Read `spec-kit-sdd-markdown-preview-4a6f637-USER-MANUAL.md` in that folder.
3. Follow the manual to verify the inner `spec-kit-sdd-markdown-preview-4a6f637.zip`
   against its `.zip.sha256` file and the checksum in the manual. In section 4,
   set `$archive` to this extracted inner ZIP instead of assuming Downloads.
4. Extract the inner ZIP to a separate new folder as the manual describes. Keep
   the manual, this sheet, screenshots, and notes outside the resulting kit.
   Extra files inside the kit cause its checksum verification to fail.
5. Verify your actual App worktree and isolate exactly one `sdd-canvas` provider
   before installation. The script does not disable global providers for you.
6. Test only View, TOC, related-artifact navigation, history, and dashboard return.
   Do not run setup, regenerate specs, or submit a workflow during this test.
7. Use the same unmodified kit's removal command to restore your original canvas.
   Retain the kit and any original-extension backup until restoration succeeds.

Required: an existing SDD-enabled repository, Node.js 24, and a Copilot App/account
that supports isolated project-local extensions. The manual's commands target
Windows and PowerShell 7. No npm install or reader build is required.

The inner ZIP and manual retain their verified preview identity `4a6f637`. The
outer share archive is only a delivery wrapper; its checksum is separate. Nothing
is uploaded or installed merely by extracting either archive. Native acceptance
on your machine remains part of the test. Share only authorized redacted feedback.
