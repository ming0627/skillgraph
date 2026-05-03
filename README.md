# Skillgraph

A dependency graph and drift detector for your AI coding instructions.

Skillgraph scans Copilot instructions, Cursor rules, Claude Code skills, Codex `AGENTS.md`, Cline rules, Augment Code rules, Kilo Code rules, Google Antigravity workflows, Factory droids, generic `.agents/skills`, wrappers, helper scripts, and workflow docs. It shows what exists, what depends on what, what drifted, and what should become reusable.

[Open live demo](https://ming0627.github.io/skillgraph/) | [Try in 60 seconds](#try-in-60-seconds) | [Add to CI](#add-to-ci) | [Reuse skills](#reusable-skills)

## The Pain

Agent skill systems scale fast, then become hard to reason about:

- Copilot, Cursor, Claude Code, Codex, Cline, Augment Code, Kilo Code, Google Antigravity, and Factory AI each have a slightly different copy of the same release workflow.
- Implementation instructions say "ready" before auth QA is complete.
- A wrapper skill points to canonical instructions, but nobody knows whether it is stale.
- Multiple rule files repeat the same checklist with slightly different wording.
- CI fails because a helper script was renamed but the skill still references the old path.
- New contributors cannot tell which tool owns a workflow.
- Agents keep rediscovering the same relationships by reading every file again.

Skillgraph makes that hidden system visible.

## What It Generates

For a repo with AI-agent instructions spread across common tool paths, Skillgraph emits:

- `skillgraph.html` - local interactive browser explorer for the full skill map.
- `SKILLGRAPH.md` - GitHub-renderable Mermaid summary plus tables for PR review.
- `skillgraph.json` - machine-readable graph for CI, dashboards, or other tools.

It detects:

- canonical skills
- wrapper or mirror skills
- provider coverage
- skill-to-skill call/reference edges
- helper script references
- missing helper scripts
- duplicate skill names
- orphan skills
- custom stale patterns

## Quick Start

Install from GitHub:

```bash
npm install -D github:ming0627/skillgraph
npx skillgraph generate
```

Or run from a checkout:

```bash
git clone https://github.com/ming0627/skillgraph.git
cd skillgraph
npm test
npm run example:generate
open examples/release-train-drift/docs/skills/skillgraph.html
```

## Try In 60 Seconds

```bash
npx --yes github:ming0627/skillgraph generate
open docs/skills/skillgraph.html
```

This scans common AI-agent instruction paths in the current repo and opens a local self-contained dashboard.

After npm publish, this becomes:

```bash
npx skillgraph@latest generate --open
```

## Add To CI

Use the [GitHub Action setup](docs/GITHUB_ACTION.md) to generate and check Skillgraph artifacts on pull requests and pushes.

```bash
npx --yes github:ming0627/skillgraph generate
npx --yes github:ming0627/skillgraph check
```

## Interactive UI

The main human experience is `skillgraph.html`, a self-contained explorer that opens on `Needs attention` and supports search, provider filters, kind filters, edge-type filters, pan/zoom, fit-to-screen, issue highlighting, and a dependency inspector.

Live demo: [https://ming0627.github.io/skillgraph/](https://ming0627.github.io/skillgraph/)

![Skillgraph interactive explorer](docs/assets/skillgraph-ui-preview.png)

The Mermaid in `SKILLGRAPH.md` is kept for lightweight diffs and GitHub PRs. Use the HTML explorer when you need to see the whole skill system.

## Provider Coverage

Default provider presets are sorted for display by broad public adoption and ecosystem signals:

| Rank | Provider | Default paths |
| ---: | --- | --- |
| 1 | GitHub Copilot | `.github/copilot-instructions.md`, `.github/instructions`, `.github/prompts`, `.github/agents`, `.github/chatmodes`, `AGENTS.md` |
| 2 | Cursor | `.cursor/rules`, `.cursorrules`, `AGENTS.md` |
| 3 | Claude Code | `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/skills`, `.claude/commands`, `.claude/agents`, `.claude/rules` |
| 4 | OpenAI Codex | `AGENTS.md`, `AGENTS.override.md` |
| 5 | Cline | `.clinerules`, `.cursorrules`, `.windsurfrules`, `AGENTS.md`, `memory-bank` |
| 6 | Augment Code | `.augment/rules`, `.augment/agents`, `.augment-guidelines`, `.augment/code_review_guidelines.yaml`, `AGENTS.md`, `CLAUDE.md` |
| 7 | Kilo Code | `kilo.jsonc`, `kilo.json`, `.kilo/rules`, `.kilocode/rules`, `.kilocode/rules-code`, `.kilocoderules`, `AGENTS.md` |
| 8 | Google Antigravity | `GEMINI.md`, `AGENTS.md`, `.agent/rules`, `.agent/workflows`, `.agents/rules`, `.agents/workflows` |
| 9 | Factory AI | `AGENTS.md`, `.factory/rules`, `.factory/skills`, `.factory/commands`, `.factory/droids` |
| 10 | Generic agent skills | `.agents/skills` |

Shared files such as `AGENTS.md` receive multiple provider badges instead of being owned by one tool.

## Add To A Repo

Create `skillgraph.config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/ming0627/skillgraph/main/schema/skillgraph.schema.json",
  "providers": ["github-copilot", "cursor", "claude-code", "openai-codex", "cline", "augment-code", "kilo-code", "google-antigravity", "factory-ai", "agent-skills"],
  "roots": [],
  "outDir": "docs/skills",
  "canonicalRoots": [".agents/skills"],
  "wrapperRoots": [".claude/skills"],
  "privacy": {
    "includeEvidence": false,
    "redactTerms": ["secret-project-name", "person@example.com"]
  },
  "rules": {
    "stalePatterns": [
      {
        "id": "old-auth-default",
        "pattern": "OLD_TEST_ACCOUNT",
        "severity": "warn",
        "message": "Old test account reference is still present."
      }
    ]
  }
}
```

Add scripts:

```json
{
  "scripts": {
    "skills:graph": "skillgraph generate",
    "skills:graph:check": "skillgraph check",
    "skills:graph:audit": "skillgraph audit"
  }
}
```

Run:

```bash
npm run skills:graph
npm run skills:graph:check
```

## Privacy Model

Skillgraph does not output full skill contents. It emits relative paths, names, descriptions, inferred edges, optional evidence snippets, and issue metadata.

For public artifacts, use:

```json
{
  "privacy": {
    "includeEvidence": false,
    "redactTerms": ["internal-product", "person@example.com"]
  }
}
```

Before open-sourcing or publishing generated artifacts, run:

```bash
skillgraph privacy-scan --terms-file docs/private-leak-terms.txt
```

See [Privacy](docs/PRIVACY.md) for the recommended release checklist.

## Reusable Skills

Skillgraph separates canonical skill roots from wrappers and mirrors so teams can see which workflow should be treated as the source of truth. Use the graph to find repeated instructions, stale provider copies, and reusable workflows that are ready to package for other AI coding tools.

Reusable packages can also be described with `skillgraph.skill.json`, `skill.yml`, or `skill.yaml`. A package manifest captures version, dependencies, required tools, permissions, outputs, provider exports, privacy risk, and tests. JSON manifests preserve full structured metadata; YAML support is intentionally lightweight today and reads top-level `key: value` fields plus simple lists.

```bash
skillgraph export --package packages/release-gate --provider codex
```

## Use Cases

- Map product, implementation, QA/auth, review, release, and rollback agent workflows.
- Find stale wrapper docs after moving canonical skills.
- See which high-level skills rely on login recovery, screenshots, browser automation, or deploy checks.
- Catch missing helper scripts before an agent reaches for them.
- Give new contributors a navigable map instead of a folder full of prompt files.
- Build a CI gate that fails when generated skill docs drift from source.

More examples are in [Use Cases](docs/USE_CASES.md).

## Sources For Provider Paths

- [GitHub Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)
- [Cursor rules](https://docs.cursor.com/context/rules)
- [Claude Code memory and project instructions](https://docs.anthropic.com/en/docs/claude-code/memory)
- [OpenAI Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Cline rules](https://docs.cline.bot/customization/cline-rules)
- [Augment Code rules and guidelines](https://docs.augmentcode.com/setup-augment/guidelines)
- [Augment Code review guidelines](https://docs.augmentcode.com/codereview/review-guidelines)
- [Kilo Code custom rules](https://kilo.ai/docs/customize/custom-rules)
- [Google Antigravity rules and workflows](https://antigravity.google/docs/rules-workflows)
- [Factory AGENTS.md](https://docs.factory.ai/cli/configuration/agents-md)
- [Factory rules and conventions](https://docs.factory.ai/guides/power-user/rules-conventions)
- [Factory skills](https://docs.factory.ai/cli/configuration/skills)
- [Factory custom droids](https://docs.factory.ai/cli/configuration/custom-droids)

## Commands

```bash
skillgraph init --preset public-oss
skillgraph generate
skillgraph generate --open
skillgraph check
skillgraph audit
skillgraph export --package packages/release-gate --provider codex
skillgraph privacy-scan --terms-file docs/private-leak-terms.txt
```

## Status

Skillgraph is intentionally small and dependency-free. The current focus is deterministic local graph generation that is easy to review in a PR.

## License

MIT
