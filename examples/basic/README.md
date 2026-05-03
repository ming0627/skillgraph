# Basic Example

This fixture models a small agent workflow:

```text
ux-autopilot -> auth-qa -> ensure-auth-state.mjs
```

It also includes a wrapper skill under `.claude/skills` that points back to the canonical `.agents/skills` instructions.

Generate the graph from the repo root:

```bash
npm run example:generate
open examples/basic/docs/skills/skillgraph.html
```
