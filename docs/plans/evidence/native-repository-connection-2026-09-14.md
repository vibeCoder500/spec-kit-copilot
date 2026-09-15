# Native Repository Connection Proof

Date: 2026-09-14

Scope: Explicitly approved isolated synthetic project, local proof extension,
Microsoft connection, and read-only EzPzSpec artifact request. No private clone,
workflow, normal plugin installation, or deployment was authorized by this proof.

## Outcome

- Actual GitHub Copilot App: 1.1.20 on Windows.
- Actual extension Node runtime: 24.20.0.
- Host-created synthetic worktree and ownership marker: acknowledged.
- Microsoft browser sign-in through the dedicated desktop callback: passed.
- Delegated repository lookup, branch resolution, and commit-pinned allowed
  artifact read: passed from the proof canvas's own control.
- Native Disconnect action and cleared account state: passed.
- The proof displayed literal text; production Markdown rendering and the
  repository dropdown/rail were not part of this checkpoint.

## Changes And Isolation

The approved callback was appended without changing inspected SPA settings,
existing broker redirect, sign-in audience, fallback-public-client setting, or
requested permissions. The existing EzPzSpec authentication preflight passed
again after the change, including delegated scope/consent checks.

The first callback attempt exposed optional Microsoft `client_info` and
`clientdata` response fields. They are now accepted as unused metadata; their
values are neither trusted nor reflected. State, duplicate-parameter, PKCE,
nonce, timeout, and replay protections remain enabled. Focused synthetic callback
tests pass for this actual response shape.

The source implementation branch is `plan/canvas-repository-discovery`. Synthetic
fixture commits do not commit or publish implementation changes. The successful
proof fixture commit is `71613e3e2278f7867c117d70de5f6da4697a6e50`.

Proof bundle SHA-256:
`9dacf7753679091a5a2328598003ba4066c3f8a92d79c82c1d040887a8726e5c`.

Only sanitized outcomes are retained here. No account identity, private source,
capability URL, authorization code, token, or browser storage is recorded.

This closes the initial native authentication feasibility question. It does not
waive permission-isolation, clone/session-binding, UX, package, or release gates.