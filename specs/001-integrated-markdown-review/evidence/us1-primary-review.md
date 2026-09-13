# T026-T031: Primary Artifact Review

Date: 2026-09-13. Windows, Node 24.19.0, npm 11.17.0, Playwright 1.63.0,
installed Edge channel. Source remains the uncommitted development checkout.

Both existing servers now issue bounded review contexts from current workflow
membership and serve exact-byte validated documents. The context bootstrap is
documented in the [HTTP contract](../contracts/artifact-review-http.md). Legacy
artifact routes and response shapes remain unchanged. SDD carries local copies
of the dependency-free domain and browser adapter; it has no sibling runtime import.

Wizard mounts in its existing overlay. SDD now opens its existing artifact view
in the same document rather than navigating away. Both restore the invoking control
and workflow context. Existing artifacts remain available when execution is gated;
run controls and server workflow prerequisites are unchanged. Wizard's canonical
artifact fallback also handles the empty preset command graph observed in T016.

Marker-bearing documents temporarily retain their existing clarification renderers
after validated reads. The dedicated clarification tasks will move those controls
into the common reader; this checkpoint does not claim that work is complete.

Validation, all final commands exit 0:

```powershell
node --test "plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/test/*.test.mjs" "plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/tests/*.test.mjs"
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:browser
npm --prefix plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader run test:tools
```

| Check | Result |
| --- | --- |
| Full canvas suites | 320 pass, 0 fail/skip/cancel |
| Actual-shell browser journeys | 6 pass: 4 retained probes plus both default-mode primary readers |
| Staging and synchronization tools | 11 pass |
| Wizard service/adapter and existing clarification/probe subset | 11 pass |
| SDD service/adapter subset | 5 pass |

The first full replay found one old source assertion requiring SDD to hide every
feature until setup completes. It was updated to require artifact visibility
while retaining its execution-gate assertions; the complete replay then passed.
No unrelated failing test was suppressed. Red records:
[T022](red/T022.md), [T023](red/T023.md), [T024](red/T024.md), [T025](red/T025.md).

Both browser journeys asserted same-container context/revision/content, return
focus, unchanged workflow text, zero workflow dispatch, zero blocked writes,
zero source mutation, zero external requests, and successful owned-fixture cleanup.
These results are synthetic-service browser evidence, not updated native App
acceptance. The native App still has the earlier staged probe until a deliberate
restaging/reload. TOC, related navigation, freshness, and final visual evidence
remain subsequent tasks. No EzPzSpec source change or publication occurred.
