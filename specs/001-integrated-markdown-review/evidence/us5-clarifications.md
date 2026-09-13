# US5 Clarification Validation

Status: PASS for the automated clarification phase, T067-T076. This is not a
native App acceptance, live workflow, security-matrix, or release-readiness claim.
Recorded 2026-09-13 on Windows, Node 24.19.0, npm 11.17.0, Playwright 1.63.0,
and the installed Edge browser. Only owned synthetic workspace files were used.

## Behavior Verified

| Check | Evidence | Outcome |
| --- | --- | --- |
| Prose-only controls | Reader/source parser and SDD extraction tests | Code fences, inline/indented code, comments, links, unbound and stale descriptors remain inert. |
| Wizard identity | Revision-bound draft tests | Context, artifact, actual command, revision, and question isolate answers; command names are not replaced by draft keys. |
| Cross-file restoration | Actual Wizard shell | Research navigation/back retains the answer, including the reopened edit field. |
| Apply and automatic flush | Actual Wizard shell | Partial Apply sends one batch; completing both questions automatically sends one two-answer batch to the real owning command. |
| In-flight ownership | Store and shell tests | Navigation/close/discard cannot interrupt a submission; acknowledgements consume only the captured edit version, including edit-and-revert races. |
| Failure and untracked acknowledgement | Store, existing modal, and shell tests | Failure preserves answers for retry; successful untracked responses preserve existing local running acknowledgement. |
| Source changes | Store and compact Wizard shell | Old answers cannot dispatch. They remain visible and require explicit confirmation against a new current revision of the same question/owner. |
| Back discard | Actual Wizard shell | Closing discards only the current context's unsubmitted answers; reopening shows no queued answer. |
| SDD immediacy | Actual SDD shell with intercepted submit response | Exactly one question/index/revision/artifact is sent, with no batch; successful completion returns within the existing canvas. |
| SDD dispatch boundary | Actual HTTP handler with mocked SDK | Stale revision, wrong question, and wrong index return 400 before any SDK call; one valid single-question request invokes the mock exactly once. No real workflow runs. |
| Existing gates | Complete Wizard/SDD suites | Constitution, stage, overwrite, task, setup, and legacy behavior assertions remain green. |
| Compact layout | 360px Wizard shell | Recovered-answer text and controls stay within the viewport. |

The browser fixtures block real workflow/write routes. The dedicated SDD handler
test opts into a mock SDK only. Its workspace hash comparison is unchanged; the
source-change fixture restores only its recorded synthetic mutation before cleanup.

## Commands and Results

All commands run from the integration repository root. `READER` below abbreviates
`plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader`.

```text
node --test "plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/*.test.mjs" "plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/*.test.mjs"
355 tests passed; 0 failed, skipped, or cancelled.

npm --prefix READER test
28 tests passed.

npm --prefix READER run test:tools
11 tests passed.

npm --prefix READER run test:browser -- clarifications.spec.mjs
6 tests passed, including compact stale recovery.

npm --prefix READER run typecheck
npm --prefix READER run lint
npm --prefix READER run build
npm --prefix READER run verify:package
All passed. Editor diagnostics for the changed clarification files: none.
```

The source parser's transformed AST initially failed strict typing and was corrected
to its Markdown `Root` type. An added reopen regression then reproduced an empty
answer field because the modal uses `initialValue`, not `defaultValue`; the one-line
caller repair passed the same test. Explicit recovery tests first failed because
there was no recovery operation and the stale-answer banner was hidden; the store
and UI fixes passed those same checks. Historical initial red evidence remains in
[red/T067.md](red/T067.md), [red/T068.md](red/T068.md), and [red/T069.md](red/T069.md).

## Packaged Checkpoint

- Reader source hash: `sha256:549cc8f608690f0b2e19aea894ee3e4ce799b2ec33f67e71d01460b2eec69e7f`.
- Reader build hash: `sha256:574bf01f8e9b464dccc36960ff4271634b9599a087843d6c83f5dda253f8691c`.
- Server parser: 446,090 bytes; SHA-256 `83a487ae078d4a03c405401c43721f6856d59716bcaa8f0229600f163e30e55e`.
- Parser notices: 61,292 bytes; SHA-256 `7e1f9fed20201df637cfdf8e0686afe72ca4eb22d5c0f265c513f6ffa1433272`.
- Both plugins contain matching generated reader assets, domain copies, and parser notices. Runtime parser imports are restricted to the three verified Node built-ins.

The [HTTP contract](../contracts/artifact-review-http.md) records the additive
read-only validation endpoint and revalidation at the existing explicit submit
boundaries. The [native TOC proof](native-toc-proof-2026-09-13.md) is an earlier,
separately hashed checkpoint. Its screenshots do not validate this newer build.
Full security, independent payload, latest native acceptance, and release gates
remain pending in the task list. Original EzPzSpec application source was not edited.
