/**
 * Smoke test (Task 132): theme-warm — fourth Base v2 library theme; its own layout (image left, cards, box notice,
 * buttons), palettes without contrast warnings, v2 starter builds, Source Serif 4 + Nunito Sans ship.
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
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-warm.css'), 'utf8');

test('theme-warm: v2, own layout, presets salbei/beere, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'top', intro: 'reverse', linklist: 'cards', split: 'columns', notice: 'box', cta: 'button' });
  assert.match(THEME, /\.c-l-linklist-cards \.c-v2-rows__row\.c-v2-rows__row--alert \{ background: var\(--p-alert-soft\)/, 'alert card keeps its tint over the theme card rules');
  assert.deepEqual(readPalettePresets(THEME).sort(), ['beere', 'salbei']);
  for (const preset of [null, 'salbei', 'beere']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  assert.match(THEME, /--t-font-serif:\s*'Source Serif 4'/, 'serif in a --t-font-* token so the font sync ships it');
  assert.match(THEME, /font-family: 'Source Serif 4'/, 'Source Serif 4 @font-face generated');
  assert.match(THEME, /\.c-page--v2 \.c-grid \.c-v2::after \{ left: 0; width: 100%; margin-left: 0; \}/, 'wave stays inside its column');
});

test('init --theme=theme-warm --starter builds with its layout and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-warm-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-warm', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-top c-l-intro-reverse c-l-linklist-cards c-l-split-columns c-l-notice-box c-l-cta-button">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(fonts.includes('source-serif-4') && fonts.includes('nunito-sans'), 'Source Serif 4 + Nunito Sans ship');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
