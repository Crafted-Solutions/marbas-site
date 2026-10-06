/**
 * Smoke test (Task 176): theme-retro — tenth Base v2 library theme; its own layout (sunset stripes, arched intro image with a
 * rainbow frame, Fraunces with the soft axis), palettes without contrast warnings, v2 starter builds, Fraunces + DM Sans ship.
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
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-retro.css'), 'utf8');
const RULES = THEME.replace(/\/\*[\s\S]*?\*\//g, '');

test('theme-retro: v2, own layout, presets avocado/disco + dunkel espresso, all palettes AA, Fraunces with SOFT', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'top', intro: 'reverse', linklist: 'cards', split: 'columns', notice: 'box', cta: 'button' });
  assert.deepEqual(readPalettePresets(THEME).sort(), ['avocado', 'disco', 'espresso']);
  assert.match(THEME, /@dark espresso/);
  for (const preset of [null, 'avocado', 'disco', 'espresso']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  for (const family of ['Fraunces', 'DM Sans']) assert.match(THEME, new RegExp(`font-family: '${family}'`), `${family} @font-face generated`);
  // the soft axis needs Fontsource's "soft" files (sync-theme-fonts.mjs: axes: 'soft'), not the default wght files
  assert.match(THEME, /fraunces-latin-soft-normal\.woff2/);
  assert.match(RULES, /font-variation-settings: "SOFT" 100/);
  // stripe colours are decoration only: text on them is --retro-on, never a palette text colour on an untested pair
  assert.match(RULES, /background: var\(--retro-1\); color: var\(--retro-on\)/);
  assert.doesNotMatch(RULES, /\.c-header \{[^}]*position:/);
  assert.doesNotMatch(RULES, /100vw/);
});

test('init --theme=theme-retro --starter builds with its layout and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-retro-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-retro', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-top c-l-intro-reverse c-l-linklist-cards c-l-split-columns c-l-notice-box c-l-cta-button">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(['fraunces', 'dm-sans'].every((f) => fonts.includes(f)), 'Fraunces + DM Sans ship');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
