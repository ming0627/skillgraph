# Skillgraph

Skillgraph maps AI agent instructions, skills, wrapper docs, helper scripts, and workflow dependencies into a graph you can read, diff, and check in CI.

It is built for teams that have moved beyond one prompt file and now maintain Copilot instructions, Cursor rules, Claude Code skills, Codex `AGENTS.md`, Cline rules, Kilo Code rules, QA flows, release gates, and local helper scripts that quietly depend on each other.

## The Pain

Agent skill systems scale fast, then become hard to reason about:

- Copilot, Cursor, Claude Code, Codex, Cline, and Kilo Code each have a slightly different copy of the same release workflow.
- Implementation instructions say "ready" before auth QA is complete.
- A wrapper skill points to canonical instructions, but nobody knows whether it is stale.
- Multiple rule files repeat the same checklist with slightly different wording.
- CI fails because a helper script was renamed but the skill still references the old path.
- New contributors cannot tell which tool owns a workflow.
- Agents keep rediscovering the same relationships by reading every file again.

Skillgraph makes that hidden system visible.

## What It Generates

For a repo with AI-agent instructions spread across common tool paths, Skillgraph emits:

- `SKILLGRAPH.md` - GitHub-renderable Mermaid workflow map plus tables.
- `skillgraph.html` - local interactive browser explorer.
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

## Provider Coverage

Default provider presets are sorted for display by broad public adoption and ecosystem signals:

| Rank | Provider | Default paths |
| ---: | --- | --- |
| 1 | GitHub Copilot | `.github/copilot-instructions.md`, `.github/instructions`, `.github/prompts`, `.github/agents`, `.github/chatmodes`, `AGENTS.md` |
| 2 | Cursor | `.cursor/rules`, `.cursorrules`, `AGENTS.md` |
| 3 | Claude Code | `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/skills`, `.claude/commands`, `.claude/agents`, `.claude/rules` |
| 4 | OpenAI Codex | `AGENTS.md`, `AGENTS.override.md` |
| 5 | Cline | `.clinerules`, `.cursorrules`, `.windsurfrules`, `AGENTS.md`, `memory-bank` |
| 6 | Kilo Code | `kilo.jsonc`, `kilo.json`, `.kilo/rules`, `.kilocode/rules`, `.kilocode/rules-code`, `.kilocoderules`, `AGENTS.md` |
| 7 | Generic agent skills | `.agents/skills` |

Shared files such as `AGENTS.md` receive multiple provider badges instead of being owned by one tool.

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

## Add To A Repo

Create `skillgraph.config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/ming0627/skillgraph/main/schema/skillgraph.schema.json",
  "providers": ["github-copilot", "cursor", "claude-code", "openai-codex", "cline", "kilo-code", "agent-skills"],
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

## Use Cases

- Map product, implementation, QA/auth, review, release, and rollback agent workflows.
- Find stale wrapper docs after moving canonical skills.
- See which high-level skills rely on login recovery, screenshots, browser automation, or deploy checks.
- Catch missing helper scripts before an agent reaches for them.
- Give new contributors a navigable map instead of a folder full of prompt files.
- Build a CI gate that fails when generated skill docs drift from source.

More examples are in [Use Cases](docs/USE_CASES.md).

## Example Output

```mermaid
flowchart LR
  A["implementation-workflow<br/><small>canonical-skill</small>"] -- "calls" --> B["auth-qa<br/><small>canonical-skill</small>"]
  B -- "calls" --> C["browser-qa<br/><small>canonical-skill</small>"]
  D["release-gate<br/><small>wrapper</small>"] -- "wraps" --> E["release-gate<br/><small>canonical-skill</small>"]
  E -- "uses helper" --> F["release-preflight.sh<br/><small>helper-script</small>"]
```

## Sources For Provider Paths

- [GitHub Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)
- [Cursor rules](https://docs.cursor.com/context/rules)
- [Claude Code memory and project instructions](https://docs.anthropic.com/en/docs/claude-code/memory)
- [OpenAI Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Cline rules](https://docs.cline.bot/customization/cline-rules)
- [Kilo Code custom rules](https://kilo.ai/docs/customize/custom-rules)

## Commands

```bash
skillgraph generate
skillgraph check
skillgraph audit
skillgraph privacy-scan --terms-file docs/private-leak-terms.txt
```

## Status

Skillgraph is intentionally small and dependency-free. The current focus is deterministic local graph generation that is easy to review in a PR.

## License

MIT
