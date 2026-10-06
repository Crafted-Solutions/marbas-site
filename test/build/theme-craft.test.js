/**
 * Smoke test (Task 175): theme-craft — ninth Base v2 library theme; its own layout (hang-tag labels, passe-partout photos,
 * hand-drawn rules), palettes without contrast warnings, v2 starter builds, Merriweather + Caveat ship.
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
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-craft.css'), 'utf8');
const RULES = THEME.replace(/\/\*[\s\S]*?\*\//g, '');

test('theme-craft: v2, own layout, presets ton/indigo + dunkel kohle, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'top', intro: 'split', linklist: 'cards', split: 'columns', notice: 'box', cta: 'button' });
  assert.deepEqual(readPalettePresets(THEME).sort(), ['indigo', 'kohle', 'ton']);
  assert.match(THEME, /@dark kohle/);
  for (const preset of [null, 'ton', 'indigo', 'kohle']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  for (const family of ['Merriweather', 'Caveat']) assert.match(THEME, new RegExp(`font-family: '${family}'`), `${family} @font-face generated`);
  // handwriting only as an accent token, never the text font
  assert.match(RULES, /--t-font-sans: 'Merriweather'/);
  assert.match(RULES, /--t-font-hand: 'Caveat'/);
  // the header stays sticky (base): the form must not reset its position
  assert.doesNotMatch(RULES, /\.c-header \{[^}]*position:/);
  // hand-drawn rules are masks coloured from the palette: no fixed colour anywhere in the form part
  const form = THEME.split('── FORM')[1].replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(form, /#[0-9a-f]{3,8}\b/i, 'form rules use var(--p-*) only');
  assert.match(RULES, /prefers-reduced-transparency: reduce\) \{ \.c-page--v2 \{ background-image: none; \} \}/, 'paper texture can be switched off');
  assert.doesNotMatch(RULES, /100vw/);
});

test('init --theme=theme-craft --starter builds with its layout and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-craft-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-craft', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-top c-l-intro-split c-l-linklist-cards c-l-split-columns c-l-notice-box c-l-cta-button">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(['merriweather', 'caveat'].every((f) => fonts.includes(f)), 'Merriweather + Caveat ship');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
