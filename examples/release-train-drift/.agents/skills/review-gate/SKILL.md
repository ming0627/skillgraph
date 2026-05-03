---
name: review-gate
description: "Review behavior, privacy, test evidence, and release risk before approval."
---

# Review Gate

Use product-requirements and auth-qa before approving.

Run `scripts/diff-risk-check.mjs`.

If release risk is medium or higher, require release-gate and rollback-runbook.
