/**
 * Smoke test (Task 137): theme-druckwerk — sixth Base v2 library theme; its own layout (stamp labels in the side rail,
 * sticker cards, label buttons), palettes without contrast warnings, v2 starter builds, Jost + IBM Plex ship.
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
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-druckwerk.css'), 'utf8');

test('theme-druckwerk: v2, own layout, presets gruen-orange/gelb-violett + dunkel nachtdruck, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'side', intro: 'split', linklist: 'cards', split: 'columns', notice: 'box', cta: 'button' });
  assert.deepEqual(readPalettePresets(THEME).sort(), ['gelb-violett', 'gruen-orange', 'nachtdruck']);
  for (const preset of [null, 'gruen-orange', 'gelb-violett', 'nachtdruck']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  for (const family of ['Jost', 'IBM Plex Sans', 'IBM Plex Mono']) assert.match(THEME, new RegExp(`font-family: '${family}'`), `${family} @font-face generated`);
  assert.match(THEME, /prefers-reduced-transparency: reduce\) \{ \.c-page--v2 \{ background-image: none; \} \}/, 'grain can be switched off');
  assert.doesNotMatch(THEME.replace(/\/\*[\s\S]*?\*\//g, ''), /background: var\(--riso-1\); color/, 'text never sits on full fluorescent colour (AA)');
});

test('init --theme=theme-druckwerk --starter builds with its layout and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-druckwerk-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-druckwerk', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-side c-l-intro-split c-l-linklist-cards c-l-split-columns c-l-notice-box c-l-cta-button">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(['jost', 'ibm-plex-sans', 'ibm-plex-mono'].every((f) => fonts.includes(f)), 'Jost + IBM Plex ship');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
