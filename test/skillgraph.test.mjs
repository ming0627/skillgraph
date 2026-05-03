import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';

import {
  buildSkillGraph,
  defaultConfigTemplate,
  generateHtml,
  generateMermaid,
  loadConfig,
  parseFrontmatter,
  renderCodexExport,
  scanForbiddenTerms,
} from '../src/skillgraph.mjs';

function writeFixture(root, relativePath, content) {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function withFixture(fn) {
  const root = mkdtempSync(join(tmpdir(), 'skillgraph-'));
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('parseFrontmatter', () => {
  it('extracts simple scalar metadata', () => {
    const frontmatter = parseFrontmatter(`---
name: auth-qa
description: "Reusable login recovery"
owner: 'Platform'
---
# Skill
`);
    assert.deepEqual(frontmatter, {
      name: 'auth-qa',
      description: 'Reusable login recovery',
      owner: 'Platform',
    });
  });
});

describe('buildSkillGraph', () => {
  it('maps canonical skills, wrappers, helper scripts, and call edges', () => withFixture((root) => {
    writeFixture(root, 'skillgraph.config.json', JSON.stringify({
      roots: ['.agents/skills', '.claude/skills'],
      outDir: 'docs/skills',
      privacy: { includeEvidence: false, redactTerms: ['internal-service'] },
      rules: {
        stalePatterns: [
          { id: 'old-default', pattern: 'OLD_DEFAULT_USER', severity: 'warn' },
        ],
      },
    }));
    writeFixture(root, '.agents/skills/auth-qa/SKILL.md', `---
name: auth-qa
description: "Use internal-service for login recovery."
---
# Auth QA

Run scripts/ensure-auth-state.mjs before returning.
`);
    writeFixture(root, '.agents/skills/auth-qa/scripts/ensure-auth-state.mjs', 'export const ok = true;\n');
    writeFixture(root, '.agents/skills/ux-autopilot/SKILL.md', `---
name: ux-autopilot
description: "Audit UI flows."
---
# UX Autopilot

Use auth-qa before browser QA returns. Avoid OLD_DEFAULT_USER.
`);
    writeFixture(root, '.claude/skills/ux-autopilot/SKILL.md', `# UX Autopilot

Canonical skill instructions live at: .agents/skills/ux-autopilot/SKILL.md
`);

    const config = loadConfig({ rootDir: root });
    const graph = buildSkillGraph({ config });
    const byPath = new Map(graph.nodes.map((node) => [node.path, node]));
    const auth = byPath.get('.agents/skills/auth-qa/SKILL.md');
    const autopilot = byPath.get('.agents/skills/ux-autopilot/SKILL.md');
    const wrapper = byPath.get('.claude/skills/ux-autopilot/SKILL.md');
    const helper = byPath.get('.agents/skills/auth-qa/scripts/ensure-auth-state.mjs');

    assert.equal(auth.kind, 'canonical-skill');
    assert.equal(autopilot.kind, 'canonical-skill');
    assert.equal(wrapper.kind, 'wrapper');
    assert.equal(helper.kind, 'helper-script');
    assert.match(auth.description, /\[redacted\]/);
    assert.ok(graph.edges.some((edge) => edge.source === wrapper.id && edge.target === autopilot.id && edge.type === 'wraps'));
    assert.ok(graph.edges.some((edge) => edge.source === autopilot.id && edge.target === auth.id && edge.type === 'calls'));
    assert.ok(graph.edges.some((edge) => edge.source === auth.id && edge.target === helper.id && edge.type === 'uses-helper'));
    assert.ok(graph.edges.every((edge) => edge.evidence === ''));
    assert.ok(graph.issues.some((issue) => issue.type === 'old-default'));
    assert.equal(graph.views.workflowSpine.length, 1);
    assert.equal(buildSkillGraph({ config }).contentHash, graph.contentHash);
  }));

  it('surfaces reuse recommendations for shared canonical skills', () => withFixture((root) => {
    writeFixture(root, '.agents/skills/auth-qa/SKILL.md', `---
name: auth-qa
---
# Auth QA
`);
    writeFixture(root, 'AGENTS.md', 'Use auth-qa before protected route QA.\n');
    writeFixture(root, '.cursor/rules/auth.mdc', 'Use auth-qa before protected route QA.\n');

    const graph = buildSkillGraph({ rootDir: root });
    assert.ok(graph.recommendations.some((item) => item.type === 'package-candidate' && item.title.includes('auth-qa')));
  }));

  it('detects reusable skill package manifests', () => withFixture((root) => {
    writeFixture(root, 'packages/auth-qa/skillgraph.skill.json', JSON.stringify({
      id: 'com.example.auth-qa',
      name: 'auth-qa',
      version: '1.0.0',
      description: 'Reusable auth QA package.',
    }));

    const graph = buildSkillGraph({ rootDir: root, roots: ['packages'] });
    const packageNode = graph.nodes.find((node) => node.path === 'packages/auth-qa/skillgraph.skill.json');
    assert.equal(packageNode.kind, 'skill-package');
    assert.equal(packageNode.frontmatter.version, '1.0.0');
    assert.equal(packageNode.frontmatter.description, 'Reusable auth QA package.');
  }));

  it('preserves structured JSON package metadata and simple YAML lists', () => withFixture((root) => {
    writeFixture(root, 'packages/release-gate/skillgraph.skill.json', JSON.stringify({
      id: 'com.example.release-gate',
      name: 'release-gate',
      version: '1.0.0',
      description: 'Reusable release gate package.',
      useWhen: ['Before release approval'],
      requires: { tools: ['shell'], permissions: ['read-files'] },
      exports: { codex: 'adapters/codex/AGENTS.fragment.md' },
      tests: [{ command: 'scripts/release/preflight.sh' }],
    }));
    writeFixture(root, 'packages/auth-qa/skill.yml', `id: com.example.auth-qa
name: auth-qa
version: 1.0.0
description: Reusable auth QA package.
useWhen:
  - Before protected route QA
`);

    const graph = buildSkillGraph({ rootDir: root, roots: ['packages'] });
    const jsonPackage = graph.nodes.find((node) => node.path === 'packages/release-gate/skillgraph.skill.json');
    const yamlPackage = graph.nodes.find((node) => node.path === 'packages/auth-qa/skill.yml');
    assert.deepEqual(jsonPackage.frontmatter.requires.tools, ['shell']);
    assert.deepEqual(jsonPackage.frontmatter.exports, { codex: 'adapters/codex/AGENTS.fragment.md' });
    assert.deepEqual(jsonPackage.frontmatter.tests, [{ command: 'scripts/release/preflight.sh' }]);
    assert.deepEqual(yamlPackage.frontmatter.useWhen, ['Before protected route QA']);
  }));

  it('resolves helper paths after a cd command', () => withFixture((root) => {
    writeFixture(root, '.agents/skills/deploy-check/SKILL.md', `---
name: deploy-check
---
# Deploy Check

Run this before deploy:

\`\`\`bash
cd apps/web && node scripts/validate-config.cjs
\`\`\`
`);
    writeFixture(root, 'apps/web/scripts/validate-config.cjs', 'module.exports = true;\n');

    const graph = buildSkillGraph({ rootDir: root });
    const helper = graph.nodes.find((node) => node.path === 'apps/web/scripts/validate-config.cjs');

    assert.equal(helper.kind, 'helper-script');
    assert.ok(!graph.issues.some((issue) => issue.type === 'missing-helper'));
  }));

  it('assigns shared instruction files to multiple providers', () => withFixture((root) => {
    writeFixture(root, 'AGENTS.md', 'Use release-gate before final handoff.\n');
    writeFixture(root, '.cursor/rules/release.mdc', `---
description: Release workflow
---
Use release-gate.
`);
    writeFixture(root, '.augment/rules/release.md', `---
description: Augment release workflow
---
Use release-gate.
`);
    writeFixture(root, 'GEMINI.md', 'Use release-gate for Antigravity changes.\n');
    writeFixture(root, '.factory/rules/release.md', 'Use release-gate for Factory Droid changes.\n');

    const graph = buildSkillGraph({ rootDir: root });
    const agents = graph.nodes.find((node) => node.path === 'AGENTS.md');
    const cursorRule = graph.nodes.find((node) => node.path === '.cursor/rules/release.mdc');
    const augmentRule = graph.nodes.find((node) => node.path === '.augment/rules/release.md');
    const geminiRule = graph.nodes.find((node) => node.path === 'GEMINI.md');
    const factoryRule = graph.nodes.find((node) => node.path === '.factory/rules/release.md');

    assert.ok(agents.providerNames.includes('GitHub Copilot'));
    assert.ok(agents.providerNames.includes('OpenAI Codex'));
    assert.ok(agents.providerNames.includes('Cursor'));
    assert.ok(agents.providerNames.includes('Augment Code'));
    assert.ok(agents.providerNames.includes('Google Antigravity'));
    assert.ok(agents.providerNames.includes('Factory AI'));
    assert.equal(cursorRule.providerName, 'Cursor');
    assert.equal(augmentRule.providerName, 'Augment Code');
    assert.equal(geminiRule.providerName, 'Google Antigravity');
    assert.equal(factoryRule.providerName, 'Factory AI');
  }));
});

describe('generateMermaid', () => {
  it('renders a flowchart from call edges', () => withFixture((root) => {
    writeFixture(root, '.agents/skills/a/SKILL.md', `---
name: a
---
Use b.
`);
    writeFixture(root, '.agents/skills/b/SKILL.md', `---
name: b
---
# B
`);
    const graph = buildSkillGraph({ rootDir: root });
    assert.match(generateMermaid(graph), /flowchart LR/);
  }));
});

describe('generateHtml', () => {
  it('renders the interactive explorer controls', () => withFixture((root) => {
    writeFixture(root, '.agents/skills/a/SKILL.md', `---
name: a
---
Use b.
`);
    writeFixture(root, '.agents/skills/b/SKILL.md', `---
name: b
---
# B
`);
    const html = generateHtml(buildSkillGraph({ rootDir: root }));
    assert.match(html, /Interactive skill map/);
    assert.match(html, /id="graphSvg"/);
    assert.match(html, /Needs attention/);
    assert.match(html, /Triage/);
    assert.match(html, /Workflow Spine/);
    assert.match(html, /Inventory/);
    assert.match(html, /Reuse/);
    assert.match(html, /Start here/);
    assert.match(html, /highestSeverityIssue/);
    assert.match(html, /Reuse Opportunities/);
    assert.match(html, /id="provider"/);
    assert.match(html, /Fit all/);
  }));
});

describe('skill package utilities', () => {
  it('renders codex exports from reusable skill packages', () => {
    const output = renderCodexExport(
      {
        name: 'release-gate',
        description: 'Verify final QA evidence.',
        useWhen: ['Before release approval'],
      },
      '# Release Gate\n\nRun preflight.\n',
    );

    assert.match(output, /# release-gate/);
    assert.match(output, /Verify final QA evidence/);
    assert.match(output, /- Before release approval/);
    assert.match(output, /Run preflight/);
  });

  it('creates private-team init templates without evidence by default', () => {
    const template = defaultConfigTemplate({ privateTeam: true });
    assert.equal(template.privacy.includeEvidence, false);
    assert.deepEqual(template.providers, [
      'github-copilot',
      'cursor',
      'claude-code',
      'openai-codex',
      'cline',
      'augment-code',
      'kilo-code',
      'google-antigravity',
      'factory-ai',
      'agent-skills',
    ]);
  });
});

describe('scanForbiddenTerms', () => {
  it('reports private terms before publishing artifacts', () => withFixture((root) => {
    writeFixture(root, 'README.md', 'This mentions private-acme-code-name.\n');
    const hits = scanForbiddenTerms(root, ['private-acme-code-name']);
    assert.deepEqual(hits, [{ path: 'README.md', line: 1, term: 'private-acme-code-name' }]);
  }));
});
