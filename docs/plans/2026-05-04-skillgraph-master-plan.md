# Skillgraph Master Plan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn Skillgraph from a graph renderer into a reusable Skill OS dashboard that diagnoses AI-instruction drift, identifies reusable canonical skills, and helps teams package/export skills across AI coding tools.

**Architecture:** Keep the zero-dependency Node CLI and deterministic generated artifacts. Extend the current graph model with explicit derived views: triage, workflow spine, inventory, reuse recommendations, and package metadata. Keep inference as an audit layer, then add first-class manifests and export adapters for portable skills.

**Tech Stack:** Node ESM, stdlib-only CLI, generated self-contained HTML/CSS/JS, JSON Schema, GitHub Actions, GitHub Pages, npm package distribution.

---

## Product North Star

Skillgraph should answer three user questions in order:

1. What is broken or risky in my AI agent instruction system?
2. Which skills are reusable source-of-truth workflows, and which files are wrappers or provider copies?
3. How do I package, test, export, and share those reusable skills across Copilot, Cursor, Claude Code, Codex, Cline, Kilo, Augment, Antigravity, Factory, and generic agent-skill roots?

The UI should not open with "all nodes and all edges." It should open with diagnosis, then let users drill into a readable graph.

---

## Phase 1: Reposition README And Demo Path

### Task 1: Rewrite README Hero Around Drift Detection

**Files:**
- Modify: `README.md`

**Step 1: Edit the opening section**

Replace the first two paragraphs with:

```markdown
# Skillgraph

A dependency graph and drift detector for your AI coding instructions.

Skillgraph scans Copilot instructions, Cursor rules, Claude Code skills, Codex `AGENTS.md`, Cline rules, Augment Code rules, Kilo Code rules, Google Antigravity workflows, Factory droids, generic `.agents/skills`, wrappers, helper scripts, and workflow docs. It shows what exists, what depends on what, what drifted, and what should become reusable.
```

**Step 2: Add a top CTA block**

Add after the opening:

```markdown
[Open live demo](https://ming0627.github.io/skillgraph/) · [Try in 60 seconds](#try-in-60-seconds) · [Add to CI](#add-to-ci) · [Reuse skills](#reusable-skills)
```

**Step 3: Move provider coverage lower**

Move the detailed provider table below Quick Start, Interactive UI, and Try in 60 Seconds.

**Step 4: Run docs check**

Run:

```bash
npm run check
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: reposition skillgraph around instruction drift"
```

### Task 2: Add Try In 60 Seconds

**Files:**
- Modify: `README.md`

**Step 1: Add GitHub install path**

Add:

````markdown
## Try In 60 Seconds

```bash
npx --yes github:ming0627/skillgraph generate
open docs/skills/skillgraph.html
```

This scans common AI-agent instruction paths in the current repo and opens a local self-contained dashboard.
````

**Step 2: Add future npm path but mark it future**

Add:

````markdown
After npm publish, this becomes:

```bash
npx skillgraph@latest generate --open
```
````

**Step 3: Verify**

Run:

```bash
npm run check
```

Expected: pass.

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add quick trial path"
```

---

## Phase 2: UI That Teaches The Skill System

### Task 3: Add View Modes: Triage, Map, Inventory, Reuse

**Files:**
- Modify: `src/skillgraph.mjs`
- Test: `test/skillgraph.test.mjs`
- Regenerate: `examples/release-train-drift/docs/skills/skillgraph.html`

**Step 1: Write failing HTML generation test**

In `test/skillgraph.test.mjs`, extend `generateHtml` test:

```js
assert.match(html, /Triage/);
assert.match(html, /Workflow Spine/);
assert.match(html, /Inventory/);
assert.match(html, /Reuse/);
```

**Step 2: Run test to verify failure**

Run:

```bash
node --test test/skillgraph.test.mjs
```

Expected: FAIL because mode labels do not exist yet.

**Step 3: Add mode controls**

In `generateHtml(graph)`, replace the current `scope` select with a segmented mode control:

```html
<div class="mode-tabs" role="tablist" aria-label="Skillgraph mode">
  <button type="button" data-mode="triage" class="mode-tab active">Triage</button>
  <button type="button" data-mode="spine" class="mode-tab">Workflow Spine</button>
  <button type="button" data-mode="inventory" class="mode-tab">Inventory</button>
  <button type="button" data-mode="reuse" class="mode-tab">Reuse</button>
</div>
```

**Step 4: Add CSS for mode tabs**

Add compact styles near the filter styles:

```css
.mode-tabs { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:6px; margin-bottom:10px; }
.mode-tab { min-height:34px; border:1px solid var(--line); border-radius:7px; background:white; color:var(--ink); cursor:pointer; }
.mode-tab.active { border-color:var(--blue); color:var(--blue); background:#eef4ff; font-weight:750; }
```

**Step 5: Replace `state.scope` with `state.mode`**

Use:

```js
mode: "triage",
```

Update edge/node filters to use mode:

```js
function nodeInMode(node) {
  if (state.mode === 'triage') return attentionIds.has(node.id) || hasManualFilter();
  if (state.mode === 'spine') return node.kind === 'canonical-skill' || attentionIds.has(node.id);
  if (state.mode === 'reuse') return node.kind === 'canonical-skill' || node.kind === 'wrapper';
  return true;
}
```

**Step 6: Regenerate example**

Run:

```bash
npm run example:generate
npm run example:check
npm run check
```

Expected: pass.

**Step 7: Commit**

```bash
git add src/skillgraph.mjs test/skillgraph.test.mjs examples/release-train-drift/docs/skills/skillgraph.html
git commit -m "feat: add skillgraph task modes"
```

### Task 4: Make Triage Auto-Select Highest Severity Issue

**Files:**
- Modify: `src/skillgraph.mjs`
- Test: `test/skillgraph.test.mjs`
- Regenerate: `examples/release-train-drift/docs/skills/skillgraph.html`

**Step 1: Write failing generated HTML test**

Assert the generated HTML contains:

```js
assert.match(html, /Start here/);
assert.match(html, /highestSeverityIssue/);
```

**Step 2: Add issue priority helper in generated JS**

Inside `generateHtml`, add:

```js
const severityRank = { error: 0, warn: 1, info: 2 };
function highestSeverityIssue() {
  return graph.issues.slice().sort((a, b) => {
    return (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9);
  })[0] || null;
}
```

**Step 3: Select the issue node on first render**

Before `render()`:

```js
const firstIssue = highestSeverityIssue();
const firstIssueNode = firstIssue ? nodeForIssue(firstIssue) : null;
if (firstIssueNode) state.selectedId = firstIssueNode.id;
```

**Step 4: Add inspector copy for selected issue**

When `nodeIssues.length`, show:

```html
<div class="detail-card issue-diagnosis">
  <h3>Start here</h3>
  <p>This node has an issue. Fix it before trusting dependent skills or wrappers.</p>
</div>
```

**Step 5: Verify**

Run:

```bash
npm run example:generate
npm run check
npm run example:check
```

**Step 6: Visual smoke**

Use Playwright or browser-use to verify the first screen has a selected issue node and visible issue diagnosis.

**Step 7: Commit**

```bash
git add src/skillgraph.mjs test/skillgraph.test.mjs examples/release-train-drift/docs/skills/skillgraph.html
git commit -m "feat: open skillgraph on highest priority issue"
```

### Task 5: Add Workflow Spine Layout

**Files:**
- Modify: `src/skillgraph.mjs`
- Test: `test/skillgraph.test.mjs`
- Regenerate: `examples/release-train-drift/docs/skills/skillgraph.html`

**Step 1: Add derived spine helper to public graph**

In `buildSkillGraph`, add a `views` key:

```js
views: {
  workflowSpine: inferWorkflowSpine(publicNodes, edges),
},
```

**Step 2: Implement `inferWorkflowSpine`**

Place near `inferIssues`:

```js
function inferWorkflowSpine(nodes, edges) {
  const canonical = nodes.filter((node) => node.kind === 'canonical-skill');
  const canonicalIds = new Set(canonical.map((node) => node.id));
  return edges
    .filter((edge) => edge.type === 'calls' && canonicalIds.has(edge.source) && canonicalIds.has(edge.target))
    .map((edge) => ({ source: edge.source, target: edge.target, type: edge.type }));
}
```

**Step 3: Add test**

Use two canonical skills where one calls the other. Assert:

```js
assert.equal(graph.views.workflowSpine.length, 1);
```

**Step 4: Update HTML layout**

When `state.mode === 'spine'`, rank canonical skills along the main horizontal row and attach wrappers/providers below them.

**Step 5: Verify**

Run:

```bash
npm run check
npm run example:generate
npm run example:check
```

**Step 6: Commit**

```bash
git add src/skillgraph.mjs test/skillgraph.test.mjs examples/release-train-drift/docs/skills
git commit -m "feat: add workflow spine view"
```

### Task 6: Add Reuse Recommendations

**Files:**
- Modify: `src/skillgraph.mjs`
- Test: `test/skillgraph.test.mjs`
- Regenerate: `examples/release-train-drift/docs/skills/skillgraph.html`

**Step 1: Add recommendations to graph**

Add `recommendations` to `buildSkillGraph` output:

```js
recommendations: inferRecommendations(publicNodes, edges, issues),
```

**Step 2: Implement `inferRecommendations`**

Rules:

- Canonical skill with many provider references: `package-candidate`
- Wrapper with issue: `wrapper-drift`
- Duplicate non-canonical docs: `consolidate`
- Missing helper: `repair-helper`

Shape:

```js
{
  type: 'package-candidate',
  severity: 'info',
  title: 'auth-qa is a reusable package candidate',
  nodeIds: [node.id],
  rationale: 'Multiple providers reference this canonical skill.',
}
```

**Step 3: Add tests**

Assert a canonical skill referenced by two provider docs produces `package-candidate`.

**Step 4: Render in Reuse mode**

Add a left-rail list:

```html
<h3>Reuse Opportunities</h3>
```

Clicking a recommendation selects the node and shows a recommendation card in the inspector.

**Step 5: Verify**

Run:

```bash
npm run check
npm run example:generate
npm run example:check
```

**Step 6: Commit**

```bash
git add src/skillgraph.mjs test/skillgraph.test.mjs examples/release-train-drift/docs/skills
git commit -m "feat: surface skill reuse recommendations"
```

---

## Phase 3: Reusable Skill Package Model

### Task 7: Add Skill Package Schema

**Files:**
- Create: `schema/skill-package.schema.json`
- Modify: `package.json`
- Modify: `README.md`

**Step 1: Create schema**

Create `schema/skill-package.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://github.com/ming0627/skillgraph/schema/skill-package.schema.json",
  "title": "Skillgraph skill package",
  "type": "object",
  "required": ["id", "name", "version", "description"],
  "additionalProperties": true,
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "version": { "type": "string" },
    "description": { "type": "string" },
    "useWhen": { "type": "array", "items": { "type": "string" } },
    "requires": {
      "type": "object",
      "properties": {
        "tools": { "type": "array", "items": { "type": "string" } },
        "permissions": { "type": "array", "items": { "type": "string" } },
        "runtime": { "type": "object" }
      }
    },
    "provides": {
      "type": "object",
      "properties": {
        "outputs": { "type": "array", "items": { "type": "string" } }
      }
    },
    "dependencies": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id"],
        "properties": {
          "id": { "type": "string" },
          "type": { "enum": ["requires", "optional", "wraps", "extends", "validates", "gates"] }
        }
      }
    },
    "exports": { "type": "object", "additionalProperties": { "type": "string" } },
    "privacy": { "type": "object" },
    "tests": { "type": "array", "items": { "type": "object" } }
  }
}
```

**Step 2: Package schema**

Ensure `schema` is already included in `package.json` files list.

**Step 3: Document**

Add README section:

```markdown
## Reusable Skills

Skillgraph can also describe a reusable skill package with `skill.yml` or `skillgraph.skill.json`: version, dependencies, required tools, permissions, outputs, provider exports, privacy risk, and tests.
```

**Step 4: Verify**

Run:

```bash
npm run check
npm pack --dry-run
```

**Step 5: Commit**

```bash
git add schema/skill-package.schema.json README.md package.json
git commit -m "feat: add skill package schema"
```

### Task 8: Detect Package Manifests

**Files:**
- Modify: `src/skillgraph.mjs`
- Test: `test/skillgraph.test.mjs`

**Step 1: Add manifest names**

Add constant:

```js
const PACKAGE_MANIFEST_NAMES = new Set(['skill.yml', 'skill.yaml', 'skillgraph.skill.json']);
```

**Step 2: Classify manifests**

In `classifyNode`, if basename is in `PACKAGE_MANIFEST_NAMES`, return `skill-package`.

**Step 3: Parse JSON manifests**

For JSON manifests, use existing `readJson`. For YAML, start with lightweight metadata extraction from simple `key: value` lines and document that full YAML parsing is future work.

**Step 4: Add test**

Create fixture `auth-qa/skillgraph.skill.json`, build graph, assert:

```js
assert.equal(packageNode.kind, 'skill-package');
assert.equal(packageNode.frontmatter.version, '1.0.0');
```

**Step 5: Verify**

Run:

```bash
npm run check
```

**Step 6: Commit**

```bash
git add src/skillgraph.mjs test/skillgraph.test.mjs
git commit -m "feat: detect reusable skill packages"
```

### Task 9: Add Example Reusable Package

**Files:**
- Create: `examples/release-train-drift/packages/release-gate/skillgraph.skill.json`
- Create: `examples/release-train-drift/packages/release-gate/SKILL.md`
- Modify: `examples/release-train-drift/skillgraph.config.json`
- Regenerate: `examples/release-train-drift/docs/skills/*`

**Step 1: Add package manifest**

Use fictional data only:

```json
{
  "$schema": "../../../schema/skill-package.schema.json",
  "id": "com.example.release-gate",
  "name": "release-gate",
  "version": "1.0.0",
  "description": "Verify final QA evidence and release handoff readiness.",
  "useWhen": ["Before release approval", "After review and browser QA"],
  "requires": {
    "tools": ["shell"],
    "permissions": ["read-files", "run-local-command"]
  },
  "provides": {
    "outputs": ["release-evidence", "handoff-summary"]
  },
  "dependencies": [
    { "id": "com.example.review-gate", "type": "requires" },
    { "id": "com.example.rollback-runbook", "type": "gates" }
  ],
  "exports": {
    "codex": "adapters/codex/AGENTS.fragment.md",
    "claude-code": "adapters/claude-code/SKILL.md",
    "cursor": "adapters/cursor/release-gate.mdc"
  },
  "privacy": {
    "dataRisk": "public-example"
  },
  "tests": [
    { "command": "scripts/release/preflight.sh" }
  ]
}
```

**Step 2: Add package root to config**

In example config, add:

```json
"roots": ["packages"]
```

**Step 3: Regenerate**

Run:

```bash
npm run example:generate
npm run example:check
npm run leak:scan
```

**Step 4: Commit**

```bash
git add examples/release-train-drift
git commit -m "feat: add reusable skill package example"
```

---

## Phase 4: Provider Export Adapters

### Task 10: Add Export Command Skeleton

**Files:**
- Modify: `src/skillgraph.mjs`
- Test: `test/skillgraph.test.mjs`
- Modify: `README.md`

**Step 1: Extend CLI usage**

Add:

```text
skillgraph export [--root .] [--package packages/release-gate] [--provider codex]
```

**Step 2: Parse args**

Add `--package` and `--provider` to `parseArgs`.

**Step 3: Implement command stub**

In `runCli`:

```js
if (args.command === 'export') {
  if (!args.packagePath) throw new Error('export requires --package');
  if (!args.provider) throw new Error('export requires --provider');
  console.log(`Export plan: ${args.packagePath} -> ${args.provider}`);
  return;
}
```

**Step 4: Add test for CLI helper if exposed**

If `parseArgs` remains private, keep this as a smoke by running:

```bash
node bin/skillgraph.mjs export --package examples/release-train-drift/packages/release-gate --provider codex
```

Expected: prints export plan.

**Step 5: Commit**

```bash
git add src/skillgraph.mjs README.md
git commit -m "feat: add skill package export command"
```

### Task 11: Implement First Export Adapter For Codex

**Files:**
- Modify: `src/skillgraph.mjs`
- Create: `examples/release-train-drift/packages/release-gate/adapters/codex/AGENTS.fragment.md`
- Test: `test/skillgraph.test.mjs`

**Step 1: Add adapter output function**

Implement:

```js
function renderCodexExport(pkg, skillText) {
  return `# ${pkg.name}

${pkg.description}

Use when:
${(pkg.useWhen || []).map((item) => `- ${item}`).join('\n')}

${skillText}
`;
}
```

**Step 2: Export to stdout first**

For MVP, print adapter output to stdout instead of writing files.

**Step 3: Add test**

Create a package manifest fixture and assert output contains name, description, useWhen, and skill text.

**Step 4: Verify**

Run:

```bash
npm run check
```

**Step 5: Commit**

```bash
git add src/skillgraph.mjs test/skillgraph.test.mjs examples/release-train-drift/packages
git commit -m "feat: export reusable skills for codex"
```

---

## Phase 5: Init, CI, And Launch Distribution

### Task 12: Add `skillgraph init`

**Files:**
- Modify: `src/skillgraph.mjs`
- Test: `test/skillgraph.test.mjs`
- Modify: `README.md`

**Step 1: Add usage**

```text
skillgraph init [--preset public-oss|private-team] [--ci]
```

**Step 2: Add template function**

Add:

```js
function defaultConfigTemplate({ privateTeam = false } = {}) {
  return {
    $schema: './schema/skillgraph.schema.json',
    providers: PROVIDER_PRESETS.map((provider) => provider.id),
    roots: [],
    outDir: 'docs/skills',
    canonicalRoots: ['.agents/skills'],
    wrapperRoots: ['.claude/skills'],
    privacy: {
      includeEvidence: !privateTeam,
      redactTerms: [],
    },
    rules: {
      stalePatterns: [],
    },
  };
}
```

**Step 3: Write config if missing**

Use `writeFileSync` inside CLI command, not shell writes:

```js
if (existsSync(configPath)) throw new Error('skillgraph.config.json already exists');
writeFileSync(configPath, jsonStable(defaultConfigTemplate({ privateTeam })));
```

**Step 4: Add test**

Use fixture temp dir, run helper if exported or test template output.

**Step 5: Verify**

Run:

```bash
npm run check
```

**Step 6: Commit**

```bash
git add src/skillgraph.mjs test/skillgraph.test.mjs README.md
git commit -m "feat: add skillgraph init"
```

### Task 13: Add GitHub Pages Demo Workflow

**Files:**
- Create: `.github/workflows/pages.yml`
- Modify: `README.md`

**Step 1: Add workflow**

Create:

```yaml
name: Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
      - run: npm run example:generate
      - run: mkdir -p public && cp examples/release-train-drift/docs/skills/skillgraph.html public/index.html
      - uses: actions/upload-pages-artifact@v4
        with:
          path: public
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Update README**

Add:

```markdown
Live demo: https://ming0627.github.io/skillgraph/
```

**Step 3: Verify local YAML presence**

Run:

```bash
git diff --check
npm run check
```

**Step 4: Commit and push**

```bash
git add .github/workflows/pages.yml README.md
git commit -m "ci: publish skillgraph demo to pages"
git push origin main
```

Expected: GitHub Pages may require repo Pages settings enabled. If deploy fails due settings, document the required repo setting.

### Task 14: Add GitHub Action Example

**Files:**
- Create: `docs/GITHUB_ACTION.md`
- Modify: `README.md`

**Step 1: Add CI copy-paste workflow**

Create `docs/GITHUB_ACTION.md` with:

````markdown
# GitHub Action Setup

```yaml
name: Skillgraph

on:
  pull_request:
  push:
    branches: [main]

jobs:
  skillgraph:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
      - run: npx --yes github:ming0627/skillgraph generate
      - run: npx --yes github:ming0627/skillgraph check
```
````

**Step 2: Link from README**

Add under Quick Start.

**Step 3: Verify**

Run:

```bash
npm run check
git diff --check
```

**Step 4: Commit**

```bash
git add docs/GITHUB_ACTION.md README.md
git commit -m "docs: add github action setup"
```

### Task 15: Add Share Assets

**Files:**
- Create: `docs/assets/skillgraph-ui-preview.png`
- Create: `docs/assets/social-preview.svg`
- Modify: `README.md`

**Step 1: Capture actual UI screenshot**

Use Playwright:

```bash
NODE_PATH=/path/to/playwright/node_modules node scripts/capture-preview.mjs
```

If no script exists, create `scripts/capture-preview.mjs` using bundled Playwright. Keep it outside the npm package unless needed.

**Step 2: Replace SVG mock in README with PNG**

Use:

```markdown
![Skillgraph interactive explorer](docs/assets/skillgraph-ui-preview.png)
```

**Step 3: Add social preview SVG**

Create a 1280x640 SVG with tagline:

```text
Skillgraph
See where your AI coding rules drift, break, and repeat.
```

**Step 4: Verify**

Run:

```bash
npm run check
npm pack --dry-run
```

**Step 5: Commit**

```bash
git add docs/assets README.md scripts/capture-preview.mjs package.json
git commit -m "docs: add skillgraph share assets"
```

---

## Phase 6: Release Readiness

### Task 16: Prepare npm Publishing

**Files:**
- Modify: `package.json`
- Create: `docs/RELEASE.md`

**Step 1: Update package metadata**

Add:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/ming0627/skillgraph.git"
},
"bugs": {
  "url": "https://github.com/ming0627/skillgraph/issues"
},
"homepage": "https://github.com/ming0627/skillgraph#readme"
```

Add keywords:

```json
"ai-instructions",
"agent-skills",
"copilot",
"cursor",
"claude-code",
"codex",
"cline",
"skill-drift"
```

**Step 2: Add release doc**

Create `docs/RELEASE.md` with:

```markdown
# Release

1. Run `npm run check`
2. Run `npm run example:generate && npm run example:check`
3. Run `npm run leak:scan`
4. Run external private-term scan when publishing from a private worktree
5. Run `npm pack --dry-run`
6. Publish when npm ownership and trusted publishing are configured
```

**Step 3: Verify**

Run:

```bash
npm run check
npm pack --dry-run
```

**Step 4: Commit**

```bash
git add package.json docs/RELEASE.md
git commit -m "chore: prepare npm release metadata"
```

---

## Phase 7: Verification Gate

### Task 17: Full Local Verification

**Files:**
- No edits expected

**Step 1: Run local checks**

```bash
npm run check
npm run example:generate
npm run example:check
npm run leak:scan
node bin/skillgraph.mjs privacy-scan --terms-file /tmp/skillgraph-private-leak-terms.txt
npm pack --dry-run
git diff --check
```

Expected: all pass.

**Step 2: Run UI visual checks**

Use Playwright at:

- 1440x900
- 829x929
- 390x844

Assertions:

- no horizontal overflow
- issue cards visible in Triage
- Workflow Spine renders canonical flow
- Inventory renders provider coverage
- Reuse renders recommendations
- selecting an issue narrows map and updates inspector

**Step 3: Push and watch CI**

```bash
git push origin main
gh run list --repo ming0627/skillgraph --limit 1
gh run watch <run-id> --repo ming0627/skillgraph --exit-status
```

Expected: CI green.

---

## Milestone Order

1. README repositioning and live-demo CTA
2. UI modes and triage-first flow
3. Workflow spine and reuse recommendations
4. Skill package schema and package detection
5. Provider export MVP
6. `init`, GitHub Action docs, GitHub Pages demo
7. npm release readiness

This order makes the project more viral before it becomes a large standardization platform, while still moving toward reusable skills.
