# Use Cases

## 1. Skill Sprawl Audit

Problem: a repo has dozens of skills, helper scripts, and wrapper docs. Nobody can tell which files matter.

Skillgraph gives you:

- total skill count
- canonical vs wrapper split
- orphan skills
- duplicate names
- helper script dependencies

## 2. Multi-Tool Release Train

Problem: Copilot, Cursor, Claude Code, Codex, Cline, Augment Code, Kilo Code, Google Antigravity, and Factory AI each have their own instruction files for the same feature release process.

Skillgraph shows:

- product requirements
- implementation workflow
- auth and browser QA
- review gate
- release gate
- rollback runbook
- stale wrappers and missing helper scripts

See `examples/release-train-drift`.

## 3. Design System Guardrail

Problem: design skills often say "run QA" but do not make the dependency obvious.

Skillgraph makes the implicit chain explicit:

```text
design -> ux-autopilot -> auth-qa -> ensure-auth-state.mjs
```

## 4. CI Drift Check

Problem: generated docs drift after a skill is renamed.

Use:

```bash
skillgraph generate
skillgraph check
```

In CI, `skillgraph check` fails when `SKILLGRAPH.md`, `skillgraph.json`, or `skillgraph.html` are stale.

## 5. Missing Helper Detection

Problem: a skill tells the agent to run `scripts/smoke.sh`, but the script was deleted.

Skillgraph adds a `missing-helper` node and emits an `error` issue.

## 6. Onboarding Map

Problem: new contributors open a folder of prompt files and cannot tell where to start.

The HTML explorer provides a searchable map of:

- skill name
- kind
- path
- description
- incoming and outgoing edges
- provider/kind/edge filters
- highlighted issues and missing helpers

## 7. Public Documentation Without Private Leaks

Problem: you want to share the tool and pattern without exposing private app details.

Use the fictional release-train example under `examples/release-train-drift`, keep private generated artifacts out of the public repo, and run privacy scans before publishing screenshots or docs.
