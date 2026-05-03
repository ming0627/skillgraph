# Configuration

Skillgraph reads `skillgraph.config.json` from the target repo root by default.

```json
{
  "$schema": "https://raw.githubusercontent.com/ming0627/skillgraph/main/schema/skillgraph.schema.json",
  "roots": [".agents/skills", ".claude/skills"],
  "outDir": "docs/skills",
  "canonicalRoots": [".agents/skills"],
  "wrapperRoots": [".claude/skills"],
  "exclude": ["**/node_modules/**", "**/.git/**"],
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

`roots`

Directories to scan for markdown skill docs.

`outDir`

Where generated `SKILLGRAPH.md`, `skillgraph.json`, and `skillgraph.html` are written.

`canonicalRoots`

Roots that contain source-of-truth skill instructions. A `SKILL.md` file under a canonical root is classified as `canonical-skill`.

`wrapperRoots`

Roots that mirror or wrap canonical skills. Skillgraph detects wrapper docs when they reference a canonical root or contain `Canonical skill instructions live at:`.

`exclude`

Glob-like paths to skip while scanning.

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
