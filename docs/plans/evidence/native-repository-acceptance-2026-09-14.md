# Native Repository Acceptance

Date: 2026-09-14

Branch: `plan/canvas-repository-discovery`

## Scope And Approval

The user approved implementation, one dedicated desktop redirect on the existing
Entra registration, isolated App test projects, read-only repository checks, one
isolated EzPzSpec clone, and one read-only SDD analyze action in its verified App
worktree. A later explicit approval allowed staging the test canvas and temporary
wrappers around existing generated commands in that worktree, without project
initialization or modifying the generated command files.

No global plugin installation, private source commit/push, release, deployment,
additional clone, or second analyze action was performed by this acceptance.

## Verified Journey

| Check | Outcome |
| --- | --- |
| Actual Windows host | GitHub Copilot App 1.1.20; extension Node 24.20.0 |
| Microsoft connection | Native canvas control opened browser SSO; dedicated callback and bound account succeeded |
| Repository search | Native dropdown uniquely located the approved EzPzSpec repository |
| Dropdown exploration | Expanded `.specify/memory` and selected the constitution directly inside the native dropdown |
| Production Markdown | Native renderer displayed source provenance, TOC, and repository-return controls; no private source captured |
| Personalized rail | Corrected native empty-query rail displayed four verified team-linked repository rows |
| Confirmed clone | Native dialog showed the selected repository, exact commit, new local branch, and a new owned destination before confirmation |
| Clone result | `prepared_for_manual_open`; HEAD, origin, branch, preparation record, and clean checkout verified |
| New App session | User-approved folder opening created an App worktree; the canvas reported `localContext.binding = verified` |
| Local freshness | Blob-checked Git times corrected fresh-checkout timestamp ordering without changing files |
| SDD analyze | One eligible feature's native Analyze control dispatched the approved read-only command with explicit no-hook/no-write guidance |
| Workflow completion | Analysis report and `SDD_CLONE_ANALYZE_COMPLETE` marker verified without disclosing the report |
| Source preservation | All tracked clone files unchanged; 171 tracked configuration/spec files matched their pre-action fingerprint |
| Original repository | EzPzSpec's original checkout remained clean |
| Cleanup | Both owned repository test connections disconnected, remote account/context state cleared, completed clone retained |

## Findings Resolved

1. Microsoft returned optional `client_info` and `clientdata` callback parameters.
   The callback now permits but does not use or reflect them. Duplicate/state,
   nonce, PKCE, size, expiry, and replay checks remain enforced.
2. Azure DevOps Code Search needed the reference's `7.1-preview.1` contract and
   `path:"/es-metadata.yml"` expression. The corrected production service passed
   a bounded live diagnostic and the native rail check. No broader permission
   or alternate credential was needed.
3. Git checkout wrote spec/plan/task timestamps in an order unrelated to their
   committed history. Verified prepared workspaces now use committed times only
   while content matches the recorded Git blob, preserving ordinary local-edit
   freshness behavior.
4. Native accessibility selection sometimes changed focus without activating an
   App item. Test actions used exact text/identity verification and window-owned
   clicks where needed. No production feature depends on UI automation.

## Payload Identity

Final repository runtime build hash:
`96b76fe3bdc207baec066b76aae3dcb9e4ba0fc6e82b7228639073011ae39844`.

Shared reader build hash:
`sha256:5dca0e3a54606828ec58a724d9164f540d5890386c31ed7188a16421e038b03e`.

The final server/UI JavaScript and local scanner were compared with the
native-tested copy. The only entry-point difference is the explicitly recorded
test profile injection. Subsequent CSS normalization changed line endings only;
source fingerprint metadata now normalizes Windows/Linux text consistently.

Native test adapters are not shipped. No actual account identity, repository
inventory, source content, capability URL, authorization code, or token is
included in this document. Detailed local staging/hash records are retained in
the ignored development evidence directory.

## Automated Gates

- Repository package: typecheck, lint, 44 unit tests, build, source-aware package
  verification, and dependency audit passed locally.
- Shared reader: typecheck, lint, 34 tests, build, and matching asset verification
  passed locally.
- Existing canvas regressions: 32 SDD tests and 340 Wizard tests passed locally.
- Actual-shell browser suite: 44 tests passed, including 360/768/1280/1920 px
  repository views and synthetic clone consent/cancellation/readiness.
- Packaging and fixture tools: the existing suite and new preview, staging,
  cross-platform hash, and HTTP-boundary checks passed locally.

These results are scoped to this implementation and test environment. Hosted CI
is configured but was not run; non-Windows App acceptance and other tenants'
Conditional Access policies are not claimed validated. Publication rights,
component versions, marketplace delivery, and a formal release remain separate
approval gates.