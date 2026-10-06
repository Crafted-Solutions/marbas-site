/**
 * Smoke test (Task 174): theme-nocturne — eighth Base v2 library theme; its own layout (magazine cover intro, rubric labels,
 * cover-story tiles), palettes without contrast warnings, v2 starter builds, Playfair Display + DM Sans ship.
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
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-nocturne.css'), 'utf8');
const RULES = THEME.replace(/\/\*[\s\S]*?\*\//g, '');

test('theme-nocturne: v2, own layout, light default + presets nacht/bordeaux, dunkel nacht, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  const { layout, warnings } = readThemeLayout(THEME);
  assert.deepEqual(warnings, []);
  assert.deepEqual(layout, { rail: 'top', intro: 'stacked', linklist: 'cards', split: 'columns', notice: 'band', cta: 'link' });
  assert.deepEqual(readPalettePresets(THEME).sort(), ['bordeaux', 'nacht']);
  assert.match(THEME, /@dark nacht/);
  for (const preset of [null, 'nacht', 'bordeaux']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  for (const family of ['Playfair Display', 'DM Sans']) assert.match(THEME, new RegExp(`font-family: '${family}'`), `${family} @font-face generated`);
  // text on the cover image: the scrim belongs to the text block (>= 92 % paper under every letter), not to the image
  assert.match(RULES, /\.c-v2-intro__copy::before \{[^}]*color-mix\(in oklab, var\(--p-paper\) 92%, transparent\)/);
  // small screens: image above the text, never text on the photo
  assert.match(RULES, /@container v2 \(max-width: 760px\) \{[^@]*grid-template-areas: "media" "copy"/);
  assert.doesNotMatch(RULES, /100vw/);
});

test('init --theme=theme-nocturne --starter builds with its layout and shipped fonts', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-nocturne-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-nocturne', '--starter']).status, 0);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component|Palette contrast|@layout|font/i);
    const out = path.join(project, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2 c-l-rail-top c-l-intro-stacked c-l-linklist-cards c-l-split-columns c-l-notice-band c-l-cta-link">/);
    const fonts = fs.readdirSync(path.join(out, '_assets', 'fonts'));
    assert.ok(['playfair-display', 'dm-sans'].every((f) => fonts.includes(f)), 'Playfair Display + DM Sans ship');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
