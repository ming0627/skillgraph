---
name: release-gate
description: "Verify final QA evidence and release handoff readiness."
---

# Release Gate

Use review-gate and rollback-runbook before release approval.

Run `scripts/release/preflight.sh` and include:

- behavior changed
- tests run
- known risks
- rollback path
