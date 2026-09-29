/**
 * Smoke test (Task 134): theme-product — second Base v2 library theme; its own layout (cards, buttons, label above
 * the title), palettes without contrast warnings, v2 starter builds, fonts ship.
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
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-product.css'), 'utf8');

test('theme-product: v2, own layout, presets nacht/petrol, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'top', intro: 'split', linklist: 'cards', split: 'columns', notice: 'box', cta: 'button' });
  assert.deepEqual(readPalettePresets(THEME).sort(), ['nacht', 'petrol']);
  for (const preset of [null, 'nacht', 'petrol']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  assert.match(THEME, /@media \(min-width: 768px\) \{[\s\S]*?backdrop-filter/, 'glass effect only from tablet up (mobile menu is position: fixed)');
});

test('init --theme=theme-product --starter builds with cards, buttons and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-product-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-product', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-top c-l-intro-split c-l-linklist-cards c-l-split-columns c-l-notice-box c-l-cta-button">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(fonts.some((d) => d.includes('plus-jakarta-sans')), 'Plus Jakarta Sans ships');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
