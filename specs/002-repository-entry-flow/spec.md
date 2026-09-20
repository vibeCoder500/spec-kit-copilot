# Feature Specification: Repository Entry Layer

**Feature Branch**: `plan/canvas-repository-discovery`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Revamp the repo rail and search into a plugged-in layer that preserves the existing Spec Kit canvas. Start with repository search or continue with the current Copilot workspace. Require confirm and clone for a selected remote repository, use the default clone directory, switch the active Copilot session to that repository, and then show the original canvas. Verify both real clone and existing-workspace journeys with Spec Kit-enabled repositories and report the results."

**Scope amendment, 2026-09-21**: The user requested: "complete the clone action
implementation even if the auto workspace switch is not possible right now".
Explicit cloning is now independently deliverable. Unsupported automatic handoff
must not disable cloning: show the completed checkout and a copyable path, leave
the current workspace unchanged, and keep automatic switching unclaimed. Clone
admission uses fresh bounded activity/context observations and event invalidation,
not an atomic host reservation. The host may start unrelated work after a check;
the isolated clone must never retarget or modify that work.

## Clarifications

### Session 2026-09-21

- User decision: Complete standalone cloning even when automatic workspace
  switching is unavailable. Retain explicit consent, source preservation,
  current-state checks, and no queued or automatically resumed clone requests.

### Session 2026-09-20

- Q: With the entry layer enabled, what should users see when they open the usual Spec Kit canvas entry point? → A: Show the repository chooser first; keep a separate direct-canvas entry available.
- Q: If cloning succeeds but the automatic session switch fails, what should the recovery action do? → A: Keep the completed clone; retry only the session handoff after rechecking access and repository identity.
- Q: If the active Copilot session is running a command or agent turn, when should cloning and switching be allowed? → A: Block clone confirmation and handoff retry until idle; the user explicitly proceeds afterward. Do not queue or automatically resume blocked actions.
- Q: Before the user enters search text, what repository results should the entry layer show? → A: Show readable team-linked suggestions inside the empty search dropdown, with no separate repository rail.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Continue With The Current Workspace (Priority: P1)

A user who already has a repository open in GitHub Copilot App can explicitly
continue with that repository without searching, connecting a repository account,
or creating another checkout. The user then sees the existing Spec Kit canvas
and can use its normal workflow in the same workspace.

**Why this priority**: Existing users must not lose their working session or gain
new sign-in and cloning prerequisites just to use the canvas they already have.

**Independent Test**: Open a Spec Kit-enabled workspace, leave remote discovery
disconnected, choose **Use current workspace**, and verify the original canvas
reads the current repository with no new checkout or repository-account request.

**Acceptance Scenarios**:

1. **Given** a valid current repository and disconnected remote discovery,
   **When** the entry layer opens, **Then** it shows the current repository's
   identity and an enabled **Use current workspace** action alongside search.
2. **Given** that entry screen, **When** the user chooses **Use current workspace**,
   **Then** the existing canvas opens for the actual current session repository
   without cloning, changing branches, or modifying files.
3. **Given** a workspace with uncommitted or untracked files, **When** the user
   proceeds with it, **Then** those files and the active branch remain unchanged.
4. **Given** no current repository, **When** the entry screen opens, **Then** it
   does not offer an actionable current-repository shortcut and search remains
   available.

---

### User Story 2 - Select, Confirm, And Clone A Repository (Priority: P1)

A user searches repositories they can access, selects one, reviews the repository
and default destination, and explicitly confirms cloning. Selection alone does
not clone or enter the canvas. When connected, the empty search dropdown offers
readable team-linked suggestions; typing searches readable project repositories.

**Why this priority**: Repository preparation must be deliberate and must no
longer be mixed into the canvas team's workflow interface.

**Independent Test**: Search a readable Spec Kit-enabled repository, select it,
inspect confirmation, cancel once, then confirm. Verify that cancellation creates
no checkout and confirmation creates exactly one checkout at the displayed
default location.

**Acceptance Scenarios**:

1. **Given** a connected repository account, **When** the user searches, **Then**
   only repositories currently readable by that account are eligible for selection.
2. **Given** a search result, **When** the user selects it, **Then** the entry
   layer displays its identity, default branch, destination, and **Confirm and
   clone** action without creating a checkout or opening the downstream canvas.
3. **Given** an unconfirmed selection, **When** the user cancels or changes the
   selection, **Then** no clone or workflow action occurs.
4. **Given** a confirmed selection and fresh idle workspace observations, **When** the
   user chooses **Confirm and clone**, **Then** one clone starts at the displayed
   default destination and progress is shown until preparation finishes or fails.
5. **Given** a clone already in progress, **When** the user activates the command
   again, **Then** the system does not create another clone.
6. **Given** the active session is running a command or agent turn, **When** the
  user selects a repository, **Then** clone confirmation is blocked until the
  session is idle, and cloning requires an explicit user action afterward rather
  than an automatically resumed or queued request.
7. **Given** a connected repository account and an empty query, **When** the user
  opens the search dropdown, **Then** it shows readable team-linked suggestions
  with no separate rail. Typing searches readable project repositories, and
  clearing the query restores team-linked suggestions.
8. **Given** team suggestions are empty or unavailable, **When** the user opens
  the dropdown, **Then** it shows the empty or error state without blocking
  explicit repository search or **Use current workspace**.
9. **Given** automatic handoff is unsupported, **When** a confirmed clone succeeds,
   **Then** show **Clone complete**, the retained destination and a copy-path
   control, leave the active workspace unchanged, and hide unsupported retries.
10. **Given** a completed standalone clone, **When** the user reconnects or reloads,
    **Then** the retained checkout remains discoverable without another clone,
    workspace switch, initialization or workflow.

---

### User Story 3 - Enter The Canvas In The Selected Session Repository (Priority: P1)

This is conditional on verified host support and is not a blocker for the
standalone clone delivery authorized on 2026-09-21. Manual opening may follow a
standalone clone, but it is not evidence that automatic handoff works.

After cloning succeeds, the active GitHub Copilot App session moves to the cloned
repository and the original Spec Kit canvas opens against that same repository.
The user does not need to copy a path, choose a folder manually, or continue in
the previous repository's workflow by mistake.

**Why this priority**: A successful checkout is not sufficient if the agent and
the canvas still operate in different repositories.

**Independent Test**: From a session for repository A, confirm cloning repository
B. Verify that the visible active App session and the canvas both identify B
before a workflow action can be dispatched. Verify that A remains unchanged.

**Acceptance Scenarios**:

1. **Given** a completed clone, **When** the host activates the target workspace,
  **Then** the original target canvas can open with workflow actions blocked
  until it verifies its own repository and session binding. Only then is handoff
  complete and the repository-selection layer leaves the workflow view.
2. **Given** a completed clone but no acknowledged session transition, **When**
   handoff fails or times out, **Then** the entry layer reports that handoff is
  incomplete, retains the completed clone, offers a handoff-only retry, and does
  not enable workflows for the selected repository.
3. **Given** a host that cannot perform the required automatic transition,
  **When** the user confirms a readable remote repository while current checks
  permit cloning, **Then** create only the checkout, state that the App workspace
  is unchanged, and do not attempt or offer an unsupported handoff.
4. **Given** a repository transition that has completed, **When** the user chooses
   an existing canvas workflow action, **Then** its target is the repository
   acknowledged by the active App session, not the previous session's repository.
5. **Given** a failed transition, **When** the user returns to the original
   workspace, **Then** its existing session and repository remain usable without
   resetting or restoring files.
6. **Given** a retained completed clone after handoff failure, **When** the user
  retries, **Then** repository access, clone identity, and the previous outcome
  are revalidated before retrying only incomplete handoff steps. If the target
  workspace is already active, finish canvas binding there without switching
  again; no second clone is created. Failed revalidation preserves the clone
  and blocks further handoff actions.
7. **Given** the session becomes busy after cloning starts, **When** cloning
  completes, **Then** the clone is retained and handoff waits for an idle session
  and a new explicit user action. The layer does not cancel the running command
  or agent turn or automatically switch when it finishes.
8. **Given** the App creates a linked worktree on a different named branch,
   **When** that worktree is bound to the canvas, **Then** it is accepted only
   when the App identifies it as the target of this handoff, it belongs to the
   prepared repository at the selected commit, and its actual branch matches
   the App's recorded target branch. The original clone's branch and files stay
   unchanged. An unreported, detached, or mismatched target remains blocked.

---

### User Story 4 - Keep Canvas Ownership And Behavior Separate (Priority: P1)

The Spec Kit canvas team retains its existing layout, workflow controls,
prerequisites, artifact navigation, and command behavior. Repository selection
is an entry layer, not a permanent rail or replacement workflow inside that
experience.

**Why this priority**: The integration must remain compatible with an independently
owned canvas and must not undo subsequent canvas improvements.

**Independent Test**: Compare the canvas reached from each entry route with the
same canvas opened directly in the target workspace. Verify the same controls,
artifact rendering, prerequisite decisions, and workflow targets.

**Acceptance Scenarios**:

1. **Given** either successful entry route, **When** the canvas opens, **Then**
  repository search, selection, and clone progress do not
   replace, overlay, or rearrange its normal workflow layout.
2. **Given** the entry layer is enabled, disabled, or unavailable, **When** an
  existing user chooses the explicit direct-canvas entry, **Then** the original
  experience opens in the current workspace without the repository chooser.
3. **Given** a selected repository without Spec Kit configuration, **When** the
   user reaches its correctly bound canvas, **Then** the canvas's existing setup
   experience applies; the entry layer does not initialize or regenerate it.
4. **Given** any entry-layer action, **When** it completes, **Then** no workflow,
   commit, push, deployment, or project initialization has run implicitly.
5. **Given** the entry layer is enabled, **When** the user opens the usual Spec
  Kit canvas entry point, **Then** the repository chooser appears first and the
  original canvas is shown only after a successful entry choice.

---

### User Story 5 - Receive Verifiable Delivery Evidence (Priority: P2)

The user receives an implementation report distinguishing tested behavior,
unsupported host capabilities, and any remaining gaps. Real repository checks
must cover both requested entry routes without exposing private source.

**Why this priority**: The automatic handoff must be demonstrated in the actual
App, not inferred from a browser preview or a mocked session.

**Independent Test**: Review evidence for two distinct Spec Kit-enabled
repositories covering one confirmed remote clone and one existing-workspace
entry, with actual session and canvas targets verified in each case.

**Acceptance Scenarios**:

1. **Given** the implementation is presented as complete, **When** the user reads
   the report, **Then** it includes actual App results for both entry routes,
   cancellation/no-clone checks, workspace preservation, and canvas compatibility.
2. **Given** private repositories are used, **When** evidence is retained,
   **Then** private names, source screenshots, account details, and authentication
   data are excluded from tracked/public delivery artifacts.
3. **Given** automatic handoff cannot be verified, **When** results are reported,
   **Then** that requirement is marked blocked or unverified, not passed based
   on clone completion, manual folder selection, or a synthetic test alone.

### Edge Cases

- No workspace is open, or the workspace is not a repository.
- The current workspace is already the selected repository, including a
  legitimate App-created worktree; continuing locally must not create a duplicate.
- The remote account disconnects, changes, or loses access after selection.
- Team-linked suggestions are empty or fail to load; show the corresponding
  dropdown state while keeping explicit search and local continuation available.
- The selected repository's default branch changes or disappears before cloning.
- The default clone destination is unavailable, unwritable, full, or already
  occupied; existing contents must not be overwritten or removed.
- Clone cancellation, network failure, duplicate confirmation, or closing the
  entry layer during an operation must not start another clone or a workflow.
- Cloning succeeds but the host refuses, cancels, or cannot complete handoff;
  retain the completed clone and permit only a revalidated handoff retry. Lost
  access or a mismatched clone blocks retry without deleting or recloning it.
- The active workspace changes while confirmation is open or handoff is pending;
  stale confirmation must not enable a canvas for a different repository.
- The current session contains uncommitted work or an active operation; transition
  must not discard work or move an in-progress action to another repository.
  Clone confirmation and all handoff attempts are blocked while a command or
  agent turn is running. An already-running clone may finish, but the transition
  waits for an idle session and explicit user action; nothing is queued for
  automatic continuation.
- The target lacks the original canvas or its required project skills; the entry
  layer must not install or regenerate them silently.
- The target is not Spec Kit-enabled; existing canvas setup behavior remains the
  authority and still requires its normal user action.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository chooser MUST be an optional entry layer with a clear
  ownership boundary from the existing Spec Kit canvas. When enabled, it MUST
  appear first at the usual Spec Kit canvas entry point.
- **FR-002**: Its initial screen MUST show repository search and, when a current
  repository is available, **Use current workspace** with the repository identity.
- **FR-003**: The current-workspace route MUST work without remote sign-in,
  repository search, cloning, or an additional folder-selection step.
- **FR-004**: Repository discovery MUST reuse the established account and project
  access boundaries; only currently readable repositories may be selected. When
  connected, an empty query MUST offer readable team-linked suggestions inside
  the search dropdown. A nonblank query MUST search readable project repositories,
  and clearing it MUST restore team suggestions. Empty or failed suggestions
  MUST NOT block explicit search or the current-workspace route.
- **FR-005**: Selecting a search result MUST NOT clone, initialize, open workflows,
  or replace the active session's workspace.
- **FR-006**: Before cloning, the user MUST see the selected repository, account,
  branch/revision, and default clone destination and explicitly choose **Confirm
  and clone**.
- **FR-007**: A confirmed clone MUST use the displayed default managed destination
  without requiring a directory picker and MUST NOT overwrite existing content.
- **FR-008**: Each confirmation MUST authorize at most one clone and MUST become
  invalid if its account, repository, source revision, or session context changes.
- **FR-009**: Preparation MUST expose progress, cancellation, and actionable
  failure states, and MUST preserve unrelated files and repositories.
- **FR-010**: When verified automatic handoff is supported, the remote route MUST
  transition the active App session before making the target canvas ready.
  Unsupported hosts MUST permit standalone cloning without opening the target
  canvas or changing the active workspace. Manual opening is not automatic-handoff
  acceptance evidence.
- **FR-011**: Session and canvas repository identity MUST be verified together;
  a display-only repository change MUST NOT be treated as a completed handoff.
  Workspace activation and final canvas readiness MUST be distinct checkpoints,
  with workflow actions blocked until target verification completes. The original
  prepared checkout MUST retain its recorded branch, commit, and file state during
  initial handoff. An App-attested linked target MAY use a different named branch
  at the same prepared commit if its registered repository identity and actual
  branch match the App's recorded mapping; this MUST NOT rewrite the prepared
  checkout's identity or accept an unreported or detached target.
- **FR-012**: The entry layer MUST determine whether automatic host handoff is
  supported independently of cloning. Unsupported handoff MUST disable only its
  controls and automatic transition, not an explicitly confirmed standalone clone.
  Clone-only admission MUST require fresh valid account, source, workspace and
  idle observations, and MUST NOT advertise an atomic host reservation.
- **FR-013**: A failed or unacknowledged handoff MUST leave workflows unavailable
  for the selected repository and MUST preserve access to the original workspace.
  It MUST retain the completed clone and, on supported hosts, offer a handoff-only retry that first
  revalidates repository access and clone identity. Retry MUST NOT clone again,
  and failed revalidation MUST preserve the clone while blocking the transition.
- **FR-014**: Once either route succeeds, the original canvas MUST retain its
  existing layout, artifact navigation, setup rules, prerequisites, and commands.
- **FR-015**: Team-linked suggestions MUST remain inside the search dropdown;
  there MUST NOT be a separate repository rail in the entry layer or downstream
  canvas. Search and selection controls MUST NOT remain embedded in or rearrange
  the original canvas after entry. Pre-clone artifact browsing is not a step in
  this replacement flow.
- **FR-016**: A separate explicit direct-canvas entry MUST remain available when
  the entry layer is enabled, disabled, or unavailable. It MUST open the original
  canvas in the actual current workspace without repository selection or cloning.
- **FR-017**: The entry layer MUST NOT implicitly initialize Spec Kit, install
  skills or plugins, run workflows, commit, push, or deploy.
- **FR-018**: The current repository's files, branch, worktree relationships, and
  in-progress work MUST remain unchanged unless the user separately authorizes
  an operation affecting them. Starting a clone MUST be blocked when fresh host
  observations report active or unknown work, or activity/context revisions have
  changed. Activity events invalidate consent; clone-only checks do not lock the
  host against a later concurrent turn. Handoff still requires atomic host
  ordering and MUST be blocked during an active command or agent turn. The layer
  MUST NOT cancel that work, queue blocked actions, or automatically resume them
  when idle; a new explicit user action is required. An already-running clone may
  finish, but its handoff MUST wait for the same idle-session and consent checks.
- **FR-019**: Selecting the current session's repository MUST offer local
  continuation rather than require another clone.
- **FR-020**: Authentication secrets MUST remain outside displayed URLs, files,
  screenshots, reports, prompts, and repository contents.
- **FR-021**: Stale selection, confirmation, or session state MUST be rejected
  before a workflow can operate on the wrong repository.
- **FR-022**: Verification MUST include actual GitHub Copilot App journeys using
  distinct Spec Kit-enabled repositories for the clone and existing-workspace
  paths, alongside automated regression coverage.
- **FR-023**: The delivery report MUST distinguish actual-host evidence from
  synthetic checks and identify any blocked or unverified requirement explicitly.

### Key Entities *(include if feature involves data)*

- **Repository Candidate**: A currently readable repository with an account-bound
  identity, default branch, and source revision selected for entry.
- **Current Workspace**: The repository and working directory actually used by
  the active App session, including legitimate worktree relationships.
- **Entry Choice**: The explicit user decision to continue locally or confirm
  cloning a selected repository.
- **Clone Preparation**: A single consent-bound operation with a default
  destination, progress, cancellation, failure, and completed-checkout identity.
- **Session Handoff**: The transition linking a prepared repository, the active
  App session's acknowledgment, and the canvas's verified workflow target.
- **Verification Evidence**: Results for both entry routes, workspace preservation,
  cloning consent, and compatibility, with private material kept outside Git.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A valid existing workspace reaches its normal canvas in one explicit
  continuation action, with zero clone operations and zero remote sign-in prompts.
- **SC-002**: In every tested search, selection, and cancellation case, zero
  checkouts are created before explicit clone confirmation.
- **SC-003**: In every tested confirmed-clone journey on a supported host, exactly
  one checkout is prepared at the displayed destination and the user reaches the
  selected repository's active-session canvas without manual folder navigation.
  On clone-only hosts, exactly one checkout is retained with a copyable path,
  zero workspace-switch calls, and an unchanged current workspace.
- **SC-004**: In every tested handoff failure or workspace mismatch, zero workflow
  actions are sent to the previous or an unverified repository. A handoff-only
  retry creates zero additional clones and proceeds only after successful access
  and clone-identity revalidation. Busy, unknown or stale clone-admission checks
  permit zero clone starts. Handoffs require the stronger host-atomic busy guard;
  becoming idle triggers neither action without a new explicit user action.
- **SC-005**: Both entry routes preserve all existing canvas compatibility checks,
  with zero repository-layer controls intruding into the downstream workflow view.
- **SC-006**: The acceptance report demonstrates both requested entry routes in
  the actual App using at least two distinct Spec Kit-enabled repositories and
  explicitly records clone consent, actual workspace identity, and artifact access.
- **SC-007**: Every before/after preservation check shows no changes to the
  original repository's tracked files, untracked user files, or active branch.
- **SC-008**: A user can identify the target repository and next required action
  at each of selection, confirmation, preparation, handoff, and failure in all
  acceptance walkthroughs, without relying on terminal instructions.

## Assumptions

- This replaces the earlier combined repository-rail/remote-reader experience for
  the existing SDD canvas. Other canvas products are not redesigned.
- Existing provider, account, tenant/project restrictions, and managed clone
  destination policy remain unchanged unless needed for the approved flow.
- The current-workspace shortcut refers to the active App session, not another
  open window, a repository chosen only in the UI, or this development checkout.
- The transition must affect the visible active App session. Whether the host
  retains an internal conversation identifier is secondary to correct repository
  binding and preserving the original work; conversation-history migration is
  not a separate feature requirement.
- Automatic workspace transition depends on a supported host capability. Its
  availability is an implementation prerequisite to prove, not assumed from
  successful cloning or from the ability to display another repository's files.
- The entry layer does not redefine the canvas team's prerequisite or workflow
  behavior. Spec Kit-enabled repositories are used for primary acceptance so
  repository entry can be tested independently of project setup.
- Live verification uses a bounded number of approved repositories and operations.
  Cloning approval does not authorize commits, pushes, deployments, or unrelated
  workflow runs. Private evidence remains Git-ignored.
- The project's constitution file currently contains unfilled template text and
  supplies no additional ratified principles for this feature.
