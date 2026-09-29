/**
 * Smoke test (Task 138): the theme's @layout becomes body classes; v2 blocks work in multi-column page layouts
 * (content_2col_*): bands stay inside their column, blocks adapt to the column width (container queries).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 180_000 });

const twoCol = `---
layout: content_2col_main_left.njk
title: Spalten
pageLanguage: de
templateEngineOverride: njk,md
Placeholder_Main:
  - componentType: Split
    id: haupt
    tone: soft
    label: "01"
    headline: "Hauptspalte"
    text: "<p>Text</p>"
Placeholder_Aside_1:
  - componentType: Notice
    id: seite
    text: "<p>Seitenspalte</p>"
---
`;

test('theme @layout → body classes; warnings for invalid values; v2 blocks in a two-column page', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-v2layout-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project]).status, 0);
    fs.writeFileSync(path.join(project, '_theme', 'theme-probe.css'),
      '/* probe\n   @family v2\n   @layout rail=side intro=reverse linklist=rows cta=link notice=wobble\n*/\n:root { --p-paper: #ffffff; --p-ink: #111111; }\n');
    const configFile = path.join(project, 'marbas-project.json');
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    config.theme.id = 'theme-probe';
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    fs.writeFileSync(path.join(project, 'pages', 'spalten.md'), twoCol);

    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.match(build.stdout + build.stderr, /@layout notice="wobble" ungültig/);

    const html = fs.readFileSync(path.join(project, 'build', 'public_development', 'spalten', 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-side c-l-intro-reverse c-l-linklist-rows c-l-split-columns c-l-notice-box c-l-cta-link">/);
    assert.match(html, /<div class="c-grid c-cols-1 c-cols-lg-3">[\s\S]*id="haupt"[\s\S]*<aside>[\s\S]*id="seite"/, 'blocks stay in their columns');

    const css = fs.readFileSync(path.join(project, 'build', 'public_development', '_assets', 'css', 'base.full.css'), 'utf8');
    assert.match(css, /\.c-v2 \{[^}]*container: v2 \/ inline-size/, 'blocks are size containers');
    assert.match(css, /@container v2 \(max-width: 760px\)/, 'blocks stack by column width, not window width');
    assert.match(css, /\.c-page--v2 \.c-grid \.c-v2::before \{ left: 0; width: 100%; margin-left: 0; \}/, 'bands confined to the column');
    assert.match(css, /\.c-l-rail-side \.c-v2__frame \{ display: grid;/, 'label column only for rail=side');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
