# Implementation Plan: Organization SDD Scaffolding

**Branch:** `feat/add-scaffolding-layer`

**Base:** `plan/canvas-repository-discovery`, commit `4ae678c`

**Date:** 2026-10-13; automatic-start amendment 2026-10-14

## Requested journey

1. "Open Spec-Driven Development" opens the existing repository chooser.
2. Search, review, and explicitly clone/open the selected repository.
3. The checkout-bound target session automatically opens the same SDD artifact.
4. If the original scanner reports missing Spec Kit/Copilot skills, show an
   organization-owned scaffolding view, not the workflow dashboard.
5. Repository continuation/clone-and-open discloses automatic setup when SDD is
   missing, including prerequisite installation/update, browser sign-in,
   non-secret registry configuration, and managed-file changes. No separate
   initial Setup button is shown.
6. After verified target binding is ready, automatically start one bounded
   background job in that checkout. Display each step and each bundle component,
   including pending, loading,
   waiting for authentication, completed, skipped, error, and cancelled states.
7. Verify generated artifacts and reload the target session's skills through
   the installed SDK. Only then return to the original, unchanged SDD dashboard.

Search, selection, clone-only and ordinary direct read-only previews do not
start setup. Verified repository-session opening starts the owned job once;
refresh/reopen attaches without restarting it. Failed, cancelled or interrupted
jobs still require explicit retry. Normal App approval and all existing
clone/handoff protections remain.
An already-enabled repository goes straight to the original dashboard. Explicit
current-workspace entry remains independent of repository discovery/sign-in.

## Verified registry contract

Research used the authenticated README, bootstrap workflow, bundle catalog, and
bundle manifest from
[the MSD registry](https://msft.ghe.com/1eh-msd/msd-speckit-registry).

- README standard setup downloads
  `workflows/bootstrap/workflow.yml`, then runs `specify workflow run`.
- Its current minimum is **Specify >= 1.1.0**. This device initially has 0.12.0;
  the latest PyPI release observed during research is 1.1.3.
- Initialization is Copilot **skills mode**, in the existing directory, with
  explicit platform scripts and noninteractive flags.
- The recommended default is **`msd-bundle`**, currently 1.0.0: extension `bug`
  and seven `msd-constitution-*` presets. Conditional presets are installed;
  applicability is evaluated by their normal template machinery.
- Extension, preset, bundle, and workflow catalogs are separate. Register all
  four, preserving unrelated catalogs. Already-correct entries are verified and
  skipped; duplicates are not blindly re-added.
- The installed workflow catalog command accepts URL and `--name` only; unlike
  extension/preset/bundle catalogs it does not accept `--priority`. Native
  execution exposed and corrected that distinction, and the command fixture now
  enforces the actual flag surface.
- `specify extension add squad --from
  https://msft.ghe.com/1eh-msd/msd-speckit-registry/releases/download/v1.0.0/squad-v1.0.0.zip`
  is a real **direct extension install**, not the default bundle. Validate this
  separately in an isolated test project; do not silently add Squad to the
  organization's published default.

The canvas executes the supported bootstrap primitives individually rather than
running the workflow's interactive error gates. This supplies precise step
progress, cancellation, platform-correct commands, and explicit retries while
retaining the CLI's bundle installer and component provenance. Fetch the live
workflow and bundle metadata to check compatibility and enumerate components;
never execute arbitrary downloaded shell text.

## Implementation

### 1. Local setup execution

- Reuse native executable validation and existing workspace/host identity checks.
- Use native processes with argument arrays, no shell interpolation, bounded
  output, deadlines, and cancellation of the owned process tree.
- Find/install GitHub CLI where supported, then use its normal GHES browser login
  if existing authentication is unavailable. MFA/consent remain user-owned.
- Merge the README's three-host bearer provider into `~/.specify/auth.json`
  without overwriting unrelated providers or storing a token there.
- Read the token from `gh` and supply `GH_ENTERPRISE_TOKEN` only to setup child
  processes. Unlike the README's terminal example, do not persist a plaintext
  user environment token or require an App restart.
- Install latest `specify-cli` from PyPI using `uv` (preferred) or `pipx`; upgrade
  an incompatible existing installation. Use the recommended Microsoft package
  index. Recheck the executable and version after installation.
- Native testing found the organization mirror's latest package was 1.0.13,
  below the live 1.1.0 minimum. When installation succeeds but verifies too old,
  disclose a bounded retry against official PyPI, then recheck the version.
  Installer/network failures are not silently bypassed; no registry token is
  passed to either package index.
- Initialize with `--here --force --integration copilot
  --integration-options=--skills --script ps --ignore-agent-tools` on Windows
  (`sh` on other supported systems).
- Register catalogs using their existing CLI groups, install `msd-bundle`, and
  independently verify the bundle record, component manifests/registries,
  expected versions/priorities, and the original scanner's core prerequisites.
- Reload skills using the documented, locally verified
  `session.rpc.skills.reload()` RPC. Surface load errors, not success-shaped
  fallbacks. Do not start another Copilot agent or dispatch a setup prompt.

### 2. Background job and consent

- Bind setup to the actual canonical worktree and session context, never to a
  browser-supplied path, command, catalog URL, or bundle identifier.
- Require fresh idle/context/repository observations at admission and between
  mutation stages. Reject stale, busy, or unknown state without queueing.
- Obtain fresh read-only admission context when the verified host lifecycle
  starts setup automatically. The server independently rejects changed context,
  busy work and stale admission without queueing. Read/refresh alone never starts
  a job; admission failures are visible and allow explicit retry.
- Serialize the setup view's own read-only host observations so asynchronous
  progress/SSE refresh cannot race its mutation guard. Native RPC latency
  reproduced false stale-context rejection when those observations overlapped.
  Keep the existing host's out-of-order/context guards unchanged; setup HTTP
  routes use the service's complete queued verification, not a redundant outer
  check. This serializes observations, never queued setup actions or retries.
- Serialize setup per checkout across canvases/processes using a user-local
  lock. Keep bounded, credential-free progress outside Git.
- One request id admits one job. Refresh/reopen attaches to progress; it never
  starts another install. Interrupted work needs an explicit retry.
- Memoize automatic admission per canvas service and retain an existing job
  across reopening. Closing the view waits for admission/owned job settlement
  before releasing its host verifier; it does not cancel background setup.
- Closing the canvas does not cancel a running job. Explicit cancellation stops
  its owned native command; preserve completed artifacts and expose retry.
- Track each bundle artifact from the actual registry manifest and installed
  component records, including bundle rollback/partial-failure outcomes.

### 3. Canvas integration

- Keep the chooser and scaffolding in the existing isolated entry renderer and
  generated repository-entry asset. Do not reparent/copy the workflow DOM or
  modify the tagged shared Markdown reader.
- Make provider discovery distinguish ordinary "open spec driven development"
  from explicit direct/current-workspace requests. Native testing showed that
  generic dashboard descriptions could make the host agent choose direct entry
  instead of the requested repository chooser.
- Route only a verified local target lacking setup to scaffolding. Gate workflow
  mutation APIs/actions while it is active.
- Preserve explicit original/direct entry and read-only preview HTTP contracts
  even when stage execution needs setup. Chooser continuation and verified
  prepared-target opening carry `repositorySetup` intent; incomplete owned jobs
  remain gated across all reopen paths. Renderer choice is not write consent.
- Add capability-protected, strict same-origin setup state/start/cancel/continue
  routes. Stream curated progress with existing SSE; retain polling recovery.
- On verified completion, switch the same artifact's renderer to the original
  dashboard. Preserve existing workflow handlers, previews, and prerequisites.
- Update the SDD plugin/marketplace version together, related guides, and CI
  selectors. Leave unrelated plugins and the core skills plugin unchanged.

## Validation

1. Focused Node tests for process resolution/redaction/timeout/cancellation,
   registry metadata, auth merge, job admission/idempotency, persistence,
   context changes, retries, artifact verification, and skill-reload failures.
2. Typecheck, lint, generated-runtime build/provenance, and extension syntax.
3. Controlled Edge journeys through the actual extension shell: automatic host
   admission without an initial Setup button,
   streaming per-artifact progress, authentication wait, failures/retry/cancel,
   reload/reopen, dashboard handover, enabled-repository bypass, narrow viewport,
   and original artifact/workflow behavior.
4. Existing repository-entry, SDD/shared-reader, and package/staging gates.
5. Sideload a verified production payload into the installed Copilot App with a
   scoped backup of any existing development extension. Do not restart/force-close
   the App, change approval policy, use private IPC, or fabricate native readiness.
6. Use the user-authorized non-SDD Azure DevOps repository for real discovery,
   clone/new-session, automatic setup, authentication/bootstrap, component progress,
   and original-dashboard acceptance. Verify repository identity, application
   content preservation, installed artifacts, and actual session skill discovery.
7. Separately smoke-test the exact Squad direct-install command in an owned
   throwaway project. Do not conflate this with the recommended default.

Record native outcomes separately from synthetic tests. Private captures,
accounts, repository source, credentials, and session details stay outside Git.
The final report must identify any remaining host/authentication limits honestly.
