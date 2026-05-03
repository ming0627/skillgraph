---
name: release-gate
description: "Run release preflight and final handoff checks."
---

# Release Gate

Use review-gate and rollback-runbook before release.

Run `scripts/release-preflight.sh`.

The handoff must include behavior changed, tests run, known risks, and rollback path.
