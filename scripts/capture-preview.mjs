#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (error) {
  throw new Error(
    [
      "Playwright is required to capture the UI preview PNG.",
      "Run with NODE_PATH pointing at a Playwright install, or run from an environment where playwright is installed.",
      "Example: NODE_PATH=/path/to/node_modules node scripts/capture-preview.mjs",
    ].join("\n"),
    { cause: error },
  );
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const htmlPath = resolve(
  repoRoot,
  argValue("--html", "examples/release-train-drift/docs/skills/skillgraph.html"),
);
const outPath = resolve(repoRoot, argValue("--out", "docs/assets/skillgraph-ui-preview.png"));

if (!existsSync(htmlPath)) {
  throw new Error(`Cannot find generated Skillgraph HTML at ${htmlPath}`);
}

mkdirSync(dirname(outPath), { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
  });

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`Wrote ${outPath}`);
} finally {
  await browser.close();
}
