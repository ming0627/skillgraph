# Release Train Drift Example

This example models a common real-world agent-team problem: a feature release workflow gets split across multiple AI coding tools, then the instructions drift.

The fictional task:

> Ship a workspace invite flow safely.

The intended workflow:

```text
product-requirements -> implementation-workflow -> auth-qa -> browser-qa -> review-gate -> release-gate -> rollback-runbook
```

The drift:

- one wrapper still mentions `OLD_TEST_USER`
- one wrapper points to a retired `scripts/release/legacy-smoke.sh`
- release depends on QA and rollback, but that dependency is easy to miss by reading files manually
- Copilot, Cursor, Codex, Claude Code, Cline, and Kilo Code all have their own instruction files that reference the same workflow

Generate the graph from the repo root:

```bash
npm run example:generate
open examples/release-train-drift/docs/skills/skillgraph.html
```

Expected issues:

- missing helper: `scripts/release/legacy-smoke.sh`
- stale pattern: `OLD_TEST_USER`
- stale pattern: legacy release smoke script
