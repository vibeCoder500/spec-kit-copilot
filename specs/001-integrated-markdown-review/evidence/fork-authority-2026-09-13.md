# Fork Authority Checkpoint

Status: BLOCKED at T092 by the authenticated GitHub account policy.
Recorded 2026-09-13. Local implementation and validation through T091 remain intact.

## Explicit Decisions

- Continue the maintained-fork workflow, not local-only scope.
- Proposed destination: `tussinghal_microsoft/spec-kit-copilot`, a new public fork of `github/spec-kit-copilot`.
- Maintainer/support owner and publication authority: `tussinghal_microsoft`, confirmed by the user after reading the authenticated GitHub login.
- Intended users: public GitHub Copilot CLI/App users trying the enhanced Wizard and SDD canvases.
- Installation scope: the existing owned isolated fixture only; unrelated plugins, projects, and sessions remain outside scope.
- Source reuse: independently authored integration and reader; no private EzPzSpec source/CSS copied.
- The user approved creating the upstream public fork only. Candidate commits/pushes, live workflow actions, releases, and update/rollback operations still require separate approvals.
- The user approved whitespace-only normalization of the authority evidence file after three unsuccessful patch attempts; non-trailing content was verified unchanged and Markdown diagnostics cleared.

## Creation Attempt

The authenticated GitHub identity was `tussinghal_microsoft`. The approved
`fork_repository` operation against `github/spec-kit-copilot` returned HTTP 403:

```text
As an Enterprise Managed User, you cannot access this content
```

No fork was created. No visibility fallback, remote addition, branch creation,
commit, push, or release followed. Local changes remain unstaged; original
EzPzSpec was verified clean before this operation.

## Required Next Decision

Use an authenticated GitHub account that is permitted to own the approved public
fork, then confirm its exact owner/repository and support/publication assignment.
Authentication must occur through the normal GitHub/VS Code account interface;
no password, access token, or other secret should be sent to the assistant.

T092 remains incomplete until a usable destination is confirmed. Existing public
scope is preserved; the assistant will not silently create a private or differently
owned repository. Remaining participant, live-output, native latest-build,
update/rollback, and publication gates retain their independent requirements.
