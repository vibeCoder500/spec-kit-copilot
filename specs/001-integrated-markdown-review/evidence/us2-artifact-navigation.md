# T036-T043: Related Artifact Navigation

Date: 2026-09-13. Windows, Node 24.19.0, npm 11.17.0, Playwright 1.63.0,
installed Edge channel. The actual App still runs the earlier staged probe.

The existing canvases now list selected-feature supporting/custom Markdown,
checklists, contracts, applicable constitution, and Wizard composition sources.
Expected outputs are marked unavailable for reading. Discovery uses a bounded
snapshot per cursor chain, counts non-artifacts and directories, and returns at
most 200 descriptors per page. At 10,000 inspections, an incomplete pass ends
with `limitReached=true` and no next cursor. New list passes invalidate old scan
cursors; context and membership are revalidated before content access.

Both adapters expose an Artifacts selector, safe local references, and bounded
Back/Forward history. At most 50 artifact/revision positions are retained; forward
history is dropped after a new choice, and scroll is restored only for unchanged
bytes. Relative links are resolved by a bounded, revision-checked POST on the
existing server. HTTP(S) targets are returned for explicit user action, never
server-fetched. Unknown schemes are inert. No workflow selection is changed.

Validation, all final commands exit 0:

```powershell
node --test plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/artifact-review.test.mjs plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/artifact-review-context.test.mjs plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/artifact-review.test.mjs
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser -- wizard-shell.spec.mjs sdd-shell.spec.mjs
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader test
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run typecheck
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run lint
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run build
```

Results: **31** service/context/history/HTTP tests, **6** reader unit tests, and
**4** primary/navigation browser journeys passed. Typecheck, lint, build, and
editor diagnostics passed. Red records: [T032](red/T032.md), [T033](red/T033.md),
[T034](red/T034.md), [T035](red/T035.md).

The browser journeys selected research, used Back/Forward, followed its local
reference, and returned to the unchanged feature/stage with focus restored.
Dispatch, blocked writes, and fixture mutations were zero; owned cleanup passed.
The direct SDD HTTP check also proved unchanged legacy content, no-store/nosniff,
missing-capability denial, and typed invalid-context responses.

Reader source hash at this build:
`sha256:66130b2362828ccd7cd6a81e030d956df1d7b9bcf41b186cb02838be04729408`.
Reader build hash:
`sha256:ba15474c989cd3fab2066237ccf1a3480bd4491d4145ef8c948fee9bbdbf3f5d`.
Generated SDD domain, discovery, and browser adapter copies were byte checked.

The TOC, heading/footnote namespace, accessibility matrix, freshness states,
trusted clarification controls, full Windows security corpus, performance limits,
and final native visual proof are still later tasks. No private reference content,
source repository change, workflow run, publication, or final E2E pass is claimed.
