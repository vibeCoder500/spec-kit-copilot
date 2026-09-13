# US6 Windows Security Checkpoint

Status: PASS for the automated T077-T086 matrix on this Windows environment.
Recorded 2026-09-13. This is not a publication, native-App, or full-release approval.

## Environment and Results

Windows; Node 24.19.0; npm 11.17.0; Playwright 1.63.0; Edge 153.0.4234.32;
Xeon Platinum 8370C at 2.80 GHz; 16 logical processors; 64 GiB RAM.
All filesystem and operation-guard fixtures were owned synthetic temporary roots.

| Gate | Result | Coverage |
| --- | --- | --- |
| Full canvas suites | 371 passed, 0 failed/skipped | Existing workflow tests plus filesystem, context, revision, cursor, HTTP, and clarification checks. |
| Reader suite | 32 passed, 0 failed/skipped | Markdown/GFM, inert content, native-link bypass denial, scoped targets, states, TOC, and trusted controls. |
| Tool/package suite | 17 passed, 0 failed/skipped | Staging, asset provenance, no-side-effect guards, bounded adapter diagnostics, and load-failure fallback. |
| Browser suite | 38 passed, 0 failed/skipped | Both actual shells, required widths/zoom, keyboard/return focus, passive-request denial, freshness, clarification recovery, and performance. |
| Static/build/package | PASS | Typecheck, lint, build, generated-copy verification, and changed-file editor diagnostics. |

## Security Matrix

| Case | Result | Evidence |
| --- | --- | --- |
| Traversal and ambiguous Windows syntax | PASS | Plain/encoded/double-encoded traversal, absolute/drive-relative/UNC/device paths, ADS, controls, invalid Windows characters, reserved aliases including superscript digits, trailing aliases, and `.git` components denied before open. |
| Ordinary-file boundary | PASS | Directories and injected FIFO/socket/device targets denied; canonical escape denied without opening. |
| Real Windows redirects | PASS | File symlink, directory symlink, and junction were created without elevation and denied. No privilege skip. |
| Size and decoding | PASS | Exact 5,242,880-byte success; one extra byte/growth denied; strict UTF-8, BOM, empty/whitespace, malformed/overlong/surrogate/UTF-16/truncated sequences, and NUL behavior verified. |
| Revisions and replacement | PASS | Exact-byte hashes, expected-revision denial, open-handle/path identity, replacement and truncation checks; handles close on failure. Close errors are bounded. |
| Capability/Host/Origin | PASS | Both actual servers deny missing/wrong/duplicate capabilities, mismatched Host, foreign Origin, and opaque `null` Origin on review routes/assets. |
| Structured request limits | PASS | Duplicate/unknown/excessive queries, 16 KiB body cap, malformed JSON/UTF-8, wrong content type, and unsupported fields denied with typed outcomes. |
| Context/cursor isolation | PASS | Concurrent server instances cannot exchange context IDs or artifacts; foreign and invalidated generation cursors are denied. |
| Response/static policy | PASS | Review success/denial and allowlisted assets use no-store, no-referrer, and nosniff. Unknown reader assets are not served. Legacy workflow response contracts remain unchanged. |
| Untrusted content | PASS | Raw active HTML, resource elements, remote/local/data images, unsafe URLs, protocol-relative links, credential URLs, and instruction-like prose remain inert. |
| Native browser link bypass | PASS | Ordinary anchors expose neutral targets; validated host callbacks own navigation. Auxiliary clicks are suppressed and footnotes retain scoped fragments. |
| Preview side effects | PASS | Staged preview requests trigger zero process launch, npm/Specify/Git/shell paths, write APIs/write-mode opens, remote fetches, setup calls, or model dispatches. Workspace hashes unchanged. |
| Diagnostics | PASS | Allowlisted outcome codes only; no response bodies, answers, capabilities, OAuth-like fragments, absolute paths, causes, or URL-bearing error stacks escape injected failures. Renderer-load failures show an in-preview bounded message. |

Wizard's prior server exposed only a token gate. The implementation added exact
bound Host/Origin checks specifically to the review routes/assets; it does not
claim to have redesigned unrelated legacy server endpoints. SDD reuses its existing
gate and adds review-specific denial headers, bounded parsing, and typed errors.

## Commands

Run from the integration repository root. `READER` abbreviates
`plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader`.

```text
node --test "plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/*.test.mjs" "plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/*.test.mjs"
npm --prefix READER run typecheck
npm --prefix READER run lint
npm --prefix READER test
npm --prefix READER run test:tools
npm --prefix READER run build
npm --prefix READER run verify:package
npm --prefix READER run test:browser
```

The complete browser replay took about 1.1 minutes. Fixed-corpus render times were
156.8/161.1 ms for 100 KiB (Wizard/SDD), and 2,472.9/2,485.0 ms for exactly 5 MiB.
Both completed 20/20 measured section responses within 200 ms (maxima 31.5/32.1 ms).
These are the defined browser-fixture measurements, not arbitrary-content or native
host performance claims. No size cap was reduced or content silently truncated.

## Provenance and Boundaries

- Reader source hash: `sha256:d59751f6c92ab6602dfbb217344a4b8765309e517266c467554b3fbc210923d4`.
- Reader build hash: `sha256:5f51f164a1884bd262e5465869bc0ec3b3ff2d20fbd1642fdd741ada3f24f253`.
- Read helper SHA-256: `3b1b5fc7fd1a20ff5dbe0a68b854676f8c2a1864f53e1dc8e346922fb28c3572`.
- Review domain SHA-256: `a1735e045f9c5ce3e8356c8101e37badd7f4b30fce2aa713fbcdcd8c453710ad`.
- Adapter SHA-256: `11e7f8674701d8ea87b6620afa25cd66595ffbfa68f00dbe7c7efd4fe46664c9`.
- Parser and separate dependency notices match in both payloads; generated-copy verification passed.

Initial failures and corrections are retained in [T077](red/T077.md),
[T078](red/T078.md), [T079](red/T079.md), and [T080](red/T080.md). One Windows
temporary-path alias and one jsdom fixture API mismatch were test corrections,
not hidden product failures.

No listed Windows case was skipped. Arbitrary reparse-provider behavior, cloud
placeholder files, network shares, and hostile same-user races are not verified
here. Metadata-injected special-file checks are not native FIFO/device tests on
Windows. The supported claim is protection from untrusted document content,
unsafe paths, accidental context crossover, and ordinary file replacement, not
an OS sandbox against code already running as the same user (FR-047).

The native App remains on the earlier [TOC proof build](native-toc-proof-2026-09-13.md).
Latest-payload native acceptance, independently isolated payload closure, fork
ownership/publication, participant study, live stage output, and update/rollback
remain separate gates. No remote, branch, release, or original EzPzSpec source was
changed by this checkpoint.
