# Configuration

Skillgraph reads `skillgraph.config.json` from the target repo root by default.

```json
{
  "$schema": "https://raw.githubusercontent.com/ming0627/skillgraph/main/schema/skillgraph.schema.json",
  "providers": ["github-copilot", "cursor", "claude-code", "openai-codex", "cline", "kilo-code", "agent-skills"],
  "roots": [],
  "outDir": "docs/skills",
  "canonicalRoots": [".agents/skills"],
  "wrapperRoots": [".claude/skills"],
  "exclude": ["**/node_modules/**", "**/.git/**"],
  "instructionExtensions": [".md", ".mdc", ".txt", ".json", ".jsonc", ".yaml", ".yml"],
  "privacy": {
    "includeEvidence": true,
    "redactTerms": []
  },
  "rules": {
    "stalePatterns": []
  }
}
```

## Fields

`providers`

Provider presets to scan. Default display order is:

1. GitHub Copilot
2. Cursor
3. Claude Code
4. OpenAI Codex
5. Cline
6. Kilo Code
7. Generic agent skills

Shared files such as `AGENTS.md` can be associated with more than one provider.

`roots`

Additional directories or files to scan beyond provider presets.

`outDir`

Where generated `SKILLGRAPH.md`, `skillgraph.json`, and `skillgraph.html` are written.

`canonicalRoots`

Roots that contain source-of-truth skill instructions. A `SKILL.md` file under a canonical root is classified as `canonical-skill`.

`wrapperRoots`

Roots that mirror or wrap canonical skills. Skillgraph detects wrapper docs when they reference a canonical root or contain `Canonical skill instructions live at:`.

`exclude`

Glob-like paths to skip while scanning.

`instructionExtensions`

File extensions to scan inside provider/root directories. This lets Skillgraph pick up Markdown, MDC, JSONC, and YAML instruction files.

`privacy.includeEvidence`

When `true`, edge rows include short evidence snippets. Set this to `false` before publishing generated artifacts from a private repo.

`privacy.redactTerms`

Literal terms to replace with `[redacted]` in generated descriptions and evidence.

`rules.stalePatterns`

Custom issue rules for known drift. Each rule accepts:

```json
{
  "id": "old-tool-name",
  "pattern": "OLD_TOOL",
  "regex": "OLD_[A-Z_]+",
  "flags": "i",
  "severity": "warn",
  "message": "Old tool reference is still present."
}
```

Use either `pattern` for literal matching or `regex` for regular expression matching.
