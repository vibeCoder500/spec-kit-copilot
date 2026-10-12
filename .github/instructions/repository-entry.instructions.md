---
description: "Use when implementing or validating the SDD repository entry layer, clone consent, current-workspace entry, or Copilot App handoff."
applyTo: "specs/002-repository-entry-flow/**,plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/**,scripts/canvas-reader/**"
---

# Repository Entry Context

- Follow [the clarified spec](../../specs/002-repository-entry-flow/spec.md) and
  [implementation plan](../../specs/002-repository-entry-flow/plan.md). The user's
  2026-10-11 amendment authorizes clone plus a new App session and original canvas
  with one disclosed confirmation. Retain clone-only fallback when the supported
  launcher is unavailable. The old embedded rail remains retired.
- Preserve the canvas team's renderer, workflows, prerequisites, and later reader
  fixes. Use a separate entry renderer and narrow routing; never reparent the
  workflow DOM or introduce another workflow implementation.
- Normal enabled launch is chooser-first. Always retain explicit direct canvas
  entry. Current-workspace continuation works without remote configuration,
  authentication, cloning, or host handoff capability.
- Empty-query team suggestions stay inside the dropdown; typed queries search
  readable project repositories. No separate rail or pre-clone artifact reader.
- Reuse the current Node/TypeScript build, MSAL/discovery, native Git protections,
  and managed clone destination. Do not install a second SDK/CLI or add a new
  provider/authentication system.
- New sessions use repository-named destinations. Disclose and reverify legacy
  UUID/checkout migration before consent; if Windows locks that folder, preserve
  it for the older session and make a verified local copy without clone/fetch.
  Prefer the named preparation and reject superseded operation IDs.
- The user's 2026-10-11 amendment permits **Clone and open Spec Kit** using the
  already-installed, documented noninteractive `copilot app` launcher.
  Capture clone-and-open intent at selection time; bind it to an authorized operation, verify
  the checkout and fresh idle/context state, and preserve normal App approval.
  Do not start a CLI agent, send a prompt, force-close the App, or manufacture
  handoff readiness. Launcher completion means requested, not verified activation.
  Persist a bounded checkout-bound request before launch. The target extension
  claims it once, independently verifies the checkout or registered linked
  worktree, and opens `sdd-canvas-direct` without a second prompt or chooser.
  Record canvas acknowledgment separately from atomic handoff. An uncertain
  submitted request must never auto-repeat. Target extension installation remains
  an explicit prerequisite, not an entry action.
- G-HOST gates automatic handoff, not clone-only completion. It remains blocked
  until a supported contract proves atomic idle/context
  admission, visible App activation, target binding, and uncertain-result
  reconciliation. Proposed adapter names are not existing SDK RPC methods.
  `metadata.setWorkingDirectory()` alone, manual navigation, native UI automation,
  private IPC, or a display-only project-root change cannot satisfy handoff.
- Confirmation must bind account/source/context/destination and authorize one
  clone. Reject busy/unknown/stale state without queueing or automatic resume.
  Clone-only admission uses bounded fresh host observations and activity-event
  invalidation, not an atomic host reservation; never advertise it as one.
  Keep the source workspace unchanged and retain completed checkouts with a
  copyable path. Hide unsupported handoff actions; never attempt a cwd-only switch.
- Clone-only native acceptance may follow passing owned clone-only checks and
  explicit repository consent. Automatic handoff acceptance still requires G-HOST.
  No implicit setup, skill/plugin installation, workflows, commit, push, or deploy.
- Use [the validation guide](../../specs/002-repository-entry-flow/quickstart.md).
  Run focused checks after each edit, then existing canvas/package gates. Actual
  App current-workspace and clone journeys are required for full completion.
- Keep private captures, accounts, source, local capabilities, and credentials
  outside Git. Report blocked/unrun requirements explicitly.
