/**
 * Smoke test (Task 131): theme-bold — third Base v2 library theme; its own layout (stacked intro, rows, band notice,
 * buttons), palettes without contrast warnings, v2 starter builds, Oswald + Inter ship.
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
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-bold.css'), 'utf8');

test('theme-bold: v2, own layout, presets signal/wald + dunkel nacht, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'top', intro: 'stacked', linklist: 'rows', split: 'columns', notice: 'band', cta: 'button' });
  assert.deepEqual(readPalettePresets(THEME).sort(), ['nacht', 'signal', 'wald']);
  for (const preset of [null, 'signal', 'wald', 'nacht']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  assert.match(THEME, /--t-font-display:\s*'Oswald'/, 'display font in a --t-font-* token so the font sync ships it');
  assert.match(THEME, /font-family: 'Oswald'/, 'Oswald @font-face generated');
});

test('init --theme=theme-bold --starter builds with its layout and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-bold-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-bold', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-top c-l-intro-stacked c-l-linklist-rows c-l-split-columns c-l-notice-band c-l-cta-button">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(fonts.includes('oswald') && fonts.includes('inter'), 'Oswald + Inter ship');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
