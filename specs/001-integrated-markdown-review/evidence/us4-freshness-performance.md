# T061-T066: Freshness and Performance

Date: 2026-09-13. Windows; Node 24.19.0; npm 11.17.0; Playwright 1.63.0;
Edge 153.0.4234.32. Hardware: Intel Xeon Platinum 8370C at 2.80GHz,
16 logical processors, 64 GiB RAM.

Both adapters now retain selection across scoped discovery refreshes, check the
displayed revision before replacing content, visibly mark changed bytes stale,
and reject delayed responses after selection or disposal. Empty/headingless
reads map to their exact states; deleted/unsupported/error views retain artifact
navigation. Disconnection is an orthogonal notice over the last validated content.
The existing Wizard watcher/SSE and SDD poller/SSE are reused. No new timer,
event stream, model call, or persistent review cache was introduced.

Wizard's primary context survives a deleted file as an expected descriptor.
SDD's active-review metadata signature notices supporting-file changes without
reading their bodies into the stream. Reading, listing, and notification handling
remain bounded and do not select a new artifact or advance a workflow.

Final validation commands, all exit 0:

```powershell
node --test "plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/*.test.mjs" "plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/*.test.mjs"
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader test
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run typecheck
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run lint
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run build
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser -- freshness.spec.mjs
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser -- performance.spec.mjs
```

Results: **345 canvas tests**, **23 reader tests**, **4 freshness/reconnect
journeys**, and **4 performance cases** passed, with no skips. Typecheck, lint,
build, and touched-file diagnostics passed. Red evidence:
[T057](red/T057.md), [T058](red/T058.md), [T059](red/T059.md), [T060](red/T060.md).

## Measured Budgets

Timing starts after the content response's JSON body has been received and parsed,
and ends two animation frames after the readable article commits. It includes
Markdown parsing, rendering, and layout; it is not network-transfer latency.
The fixed synthetic corpus contains 40 sections and long prose, with exact byte
counts verified from the service. Section timings run from click to the second
animation frame and require the intended active heading to be highlighted.

| Canvas | 102,400-byte render | 5,242,880-byte render | Section actions <= 200ms | Maximum action |
| --- | --- | --- | --- | --- |
| Wizard | 168.6ms | 2455.3ms | 20 of 20 | 32.7ms |
| SDD | 148.0ms | 2417.6ms | 20 of 20 | 31.9ms |

All meet the unchanged 1-second, 5-second, and 19-of-20 thresholds. Exact-limit
bytes were delivered without silent truncation. These results describe this
hardware/corpus, not every possible adversarial Markdown shape or native App
performance. No supported byte limit was reduced.

Mutation tests changed only explicitly enabled owned synthetic files, verified
the changed/deleted states and stable selection, then restored hash-matching test
mutations before cleanup. Existing event streams were paused/resumed only in the
owned harness. No original EzPzSpec files or native App fixtures were changed by
these tests. The [native TOC proof](native-toc-proof-2026-09-13.md) remains valid
for its recorded source hashes; its App payload predates this freshness increment.
