# T048-T056: Safe Markdown and Table of Contents

Date: 2026-09-13. Windows, Node 24.19.0, npm 11.17.0, Playwright 1.63.0,
installed Edge channel. This checkpoint is browser-shell evidence; subsequent
[native App captures and verification](native-toc-proof-2026-09-13.md) are recorded
separately. The [reference observations](reference-viewer-2026-09-13.md)
describe the requested EzPzSpec layout without retaining private reference content.

The common reader now renders Markdown/GFM and a hierarchical TOC from one cached
parse. A fresh stateful slugger prevents duplicate/pre-suffixed heading collisions;
heading and footnote targets are scoped to the reader. Raw HTML is excluded,
images are non-loading accessible placeholders, tasks are disabled, and unsupported
links are inert. Table/code overflow remains inside dedicated scrollers.

At reader widths of at least 820px, a sticky **210px** TOC rail appears beside the
article. Narrower containers use a modal drawer with focus trapping, Escape-layer
ordering, prior inert-state restoration, and destination focus. Active headings
follow the explicit preview scroller's 25-percent reading line. Resize observers,
scroll listeners, and animation frames are disposed with the reader.

Validation, final runs passed:

```powershell
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader test
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run typecheck
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run lint
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run build
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run verify:package
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser -- reader-accessibility.spec.mjs
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser -- reader-accessibility.spec.mjs --grep "exact reader container"
```

- Reader unit/component tests: **19 pass**, covering outline, GFM/safety, multi-reader
  targets, TOC focus/scroll, mount generations, lifecycle, and state controls.
- Full browser replay before the final table-width refinement: **22 pass**.
- After that refinement: **14 responsive/zoom cases pass**, both canvases at
  360/480/640/820/1024/1440 viewport widths, plus **2 exact-container cases pass**
  at 360/480/640/819/820/821/1024px. The breakpoint follows container, not viewport.
- The 200-percent check uses CSS zoom in the actual shell; it is not evidence of
  native App zoom controls or a browser-toolbar zoom setting.
- Tests assert keyboard section selection, destination focus, correct Escape
  ordering, no page-level horizontal overflow, real GFM table/code presence,
  zero passive external requests, zero page errors/dispatch/mutation, and owned cleanup.
- Typecheck, lint, package verification, and editor diagnostics passed.

The narrow Wizard test initially exposed background pipeline/header overflow and
focus restoration before the shell became visible. Preview-only containment and
generation-guarded post-layout focus restoration resolved the same failing check.
The user explicitly approved continued diagnosis after three unsuccessful attempts.
The final exact check and the full matrix passed; no assertion was removed.

Final reader source hash:
`sha256:bb1d0f3e528b4bcb8cb8ea831c8b0472e32618e935b090f85f29278ea7e584ad`.
Build hash:
`sha256:02f47fd8e4154e8c01ed0e025da4ca2433181b97ade110fef086c8f1b3342e10`.
Both distributions were verified byte-identical with dependency closure and notices.
Red records: [T044](red/T044.md), [T045](red/T045.md), [T046](red/T046.md), [T047](red/T047.md).

## Retained Synthetic Screenshots

All images capture the existing canvas preview in an isolated browser harness,
not the native App. Wide Wizard and compact SDD images were visually inspected;
the remaining images were produced by passing viewport checks and hash verified.

| Capture | Bytes | SHA-256 |
| --- | --- | --- |
| [Wizard 360](screenshots/2026-09-13/browser-wizard-360-toc.png) | 32507 | `8f592a291d14a8802254c2fdf10bd6bcae41e668b4fc577e035e7fb5a8cf16cc` |
| [Wizard 480](screenshots/2026-09-13/browser-wizard-480-toc.png) | 50048 | `3aa6ab29633748ff51ecffbaf86b8d8723c606b214d24d6f2477377d99fe75df` |
| [Wizard 640](screenshots/2026-09-13/browser-wizard-640-toc.png) | 57249 | `bc63aadd2a654034fd9b2303b1d84664de6c29137bb3e436a370d824bec91534` |
| [Wizard 820](screenshots/2026-09-13/browser-wizard-820-toc.png) | 57740 | `ddf72fad644654a05e12699b77922aed1c050446b83e5a70df862fd8644f96e4` |
| [Wizard 1024](screenshots/2026-09-13/browser-wizard-1024-toc.png) | 66049 | `c8e0b28ed95d02888117557689ab6d54b13c5c4fa24ac77b530f989c6baf4f67` |
| [Wizard 1440](screenshots/2026-09-13/browser-wizard-1440-toc.png) | 68960 | `e4ec049d94c3f12369efec13fbf2fd2fe1c3d709da991e49bbeee3990728dfdc` |
| [Wizard 200 percent](screenshots/2026-09-13/browser-wizard-zoom-200.png) | 68681 | `5ce1dab702554a3012aedf6b5821a99960c77e8dee3bdd1dfca8fccdd61b0596` |
| [SDD 360](screenshots/2026-09-13/browser-sdd-360-toc.png) | 27289 | `2e78d32866bc3ff60eac927d48fed257df61a8c8c2db91a204829300d72a7c66` |
| [SDD 480](screenshots/2026-09-13/browser-sdd-480-toc.png) | 43294 | `8441c4cd6908ffa338c7c2d9e51332f698f01380cca8b80f6006fa5b658b1c5e` |
| [SDD 640](screenshots/2026-09-13/browser-sdd-640-toc.png) | 50622 | `dfd5b0ed121d9aeccc80cad9b8c84f15aedb351916f5c57e9ffbe1083098d4b4` |
| [SDD 820](screenshots/2026-09-13/browser-sdd-820-toc.png) | 48245 | `bba8cbd373f491ced9cfe5ffd8aac52043e99c06c8119186feb3f7e08da1ba17` |
| [SDD 1024](screenshots/2026-09-13/browser-sdd-1024-toc.png) | 54837 | `2ab2b2cff7e2d96de3ff7882e0685726c6a17a5dcf49513fc938e91cad861ff6` |
| [SDD 1440](screenshots/2026-09-13/browser-sdd-1440-toc.png) | 60493 | `efcaee9dcd573367f20ad25d74ba7f60bea2cc5e83521d3f4d9ff7fe8962e6a2` |
| [SDD 200 percent](screenshots/2026-09-13/browser-sdd-zoom-200.png) | 180163 | `fb24d97864176aa417706691fd465d6c906e689216e34caf9b9316adadac1a69` |

Freshness/performance, trusted clarification migration, the full Windows security
corpus, updated native acceptance, participant study, and release/rollback remain
later gates. No full E2E or release readiness is claimed at this checkpoint.
