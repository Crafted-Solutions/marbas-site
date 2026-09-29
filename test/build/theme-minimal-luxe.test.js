/**
 * Smoke test (Task 133): theme-minimal-luxe — fifth Base v2 library theme; its own layout (stacked intro with full-bleed
 * image, rows, band notice, text links), palettes without contrast warnings, v2 starter builds, Cormorant + Jost ship.
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
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-minimal-luxe.css'), 'utf8');

test('theme-minimal-luxe: v2, own layout, presets noir/stein, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'top', intro: 'stacked', linklist: 'rows', split: 'columns', notice: 'band', cta: 'link' });
  assert.deepEqual(readPalettePresets(THEME).sort(), ['noir', 'stein']);
  for (const preset of [null, 'noir', 'stein']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  assert.match(THEME, /--t-font-serif:\s*'Cormorant Garamond'/, 'serif in a --t-font-* token so the font sync ships it');
  assert.match(THEME, /font-family: 'Cormorant Garamond'/, 'Cormorant @font-face generated');
  assert.match(THEME, /overflow-x: clip/, 'full-bleed image without horizontal scrollbar');
  assert.match(THEME, /\.c-page--v2 \.c-grid \.c-v2-intro__media \{ width: auto; margin-inline: 0; \}/, 'full-bleed image stays in its column');
});

test('init --theme=theme-minimal-luxe --starter builds with its layout and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-luxe-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-minimal-luxe', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-top c-l-intro-stacked c-l-linklist-rows c-l-split-columns c-l-notice-band c-l-cta-link">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(fonts.includes('cormorant-garamond') && fonts.includes('jost'), 'Cormorant Garamond + Jost ship');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
