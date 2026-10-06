/**
 * Smoke test (Task 173): theme-blueprint — seventh Base v2 library theme; its own layout (rail on top, flush cells,
 * spec-block intro, mono labels), palettes without contrast warnings, v2 starter builds, IBM Plex Sans + JetBrains Mono ship.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { readPaletteValues, paletteContrastWarnings, readPalettePresets, readThemeFamily } from '../../src/theme/palette.js';
import { readThemeLayout } from '../../src/theme/layout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const BIN = path.join(ROOT, 'src/cli/bin.js');
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 180_000 });
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-blueprint.css'), 'utf8');
const RULES = THEME.replace(/\/\*[\s\S]*?\*\//g, '');

test('theme-blueprint: v2, own layout, presets graphit/blaupause + dunkel terminal, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'top', intro: 'split', linklist: 'cards', split: 'columns', notice: 'box', cta: 'button' });
  assert.deepEqual(readPalettePresets(THEME).sort(), ['blaupause', 'graphit', 'terminal']);
  for (const preset of [null, 'graphit', 'blaupause', 'terminal']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  for (const family of ['IBM Plex Sans', 'JetBrains Mono']) assert.match(THEME, new RegExp(`font-family: '${family}'`), `${family} @font-face generated`);
  // the page grid follows the content measure in % of the box — never 100vw (would shift against the scrollbar)
  assert.match(RULES, /--bp-w: min\(calc\(100% - var\(--v2-gutter\)\), var\(--v2-measure\)\)/);
  assert.doesNotMatch(RULES, /100vw/);
  // no section counter: .c-v2 is a size container (style containment) — counters would restart in every block
  assert.doesNotMatch(RULES, /counter-increment: bp-sec/);
});

test('init --theme=theme-blueprint --starter builds with its layout and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-blueprint-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-blueprint', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-top c-l-intro-split c-l-linklist-cards c-l-split-columns c-l-notice-box c-l-cta-button">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(['ibm-plex-sans', 'jetbrains-mono'].every((f) => fonts.includes(f)), 'IBM Plex Sans + JetBrains Mono ship');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
