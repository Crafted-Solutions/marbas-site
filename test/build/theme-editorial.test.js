/**
 * Smoke test (Task 130): theme-editorial as library theme — v2 starter, palettes without contrast warnings,
 * init without --theme unchanged (classic), SVG images passed through instead of rasterised.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { readPaletteValues, paletteContrastWarnings, readPalettePresets, readThemeFamily } from '../../src/theme/palette.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const BIN = path.join(ROOT, 'src/cli/bin.js');
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 180_000 });
const THEME = fs.readFileSync(path.join(ROOT, 'themes', 'theme-editorial.css'), 'utf8');

test('theme-editorial: v2 family, presets warm/nacht/salbei, all palettes AA', () => {
  assert.equal(readThemeFamily(THEME), 'v2');
  assert.deepEqual(readPalettePresets(THEME).sort(), ['nacht', 'salbei', 'warm']);
  for (const preset of [null, 'warm', 'nacht', 'salbei']) {
    assert.deepEqual(paletteContrastWarnings(readPaletteValues(THEME, preset)), [], `palette ${preset || 'default'}`);
  }
  assert.doesNotMatch(THEME.match(/:root \{[^}]*\}/)[0], /#234b45/, 'default palette is not the Hagen sage (only preset salbei)');
});

test('init --theme=theme-editorial --starter builds v2 starter pages; init without theme stays classic', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-editorial-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-editorial', '--starter']).status, 0);
    const index = fs.readFileSync(path.join(project, 'pages', 'index.md'), 'utf8');
    assert.match(index, /componentType: Intro/);
    assert.match(index, /componentType: LinkList/);
    assert.ok(fs.existsSync(path.join(project, 'pages', 'impressum.md')), 'legal pages from the classic starter');
    const site = JSON.parse(fs.readFileSync(path.join(project, 'pages', '_data', 'site.json'), 'utf8'));
    assert.equal(typeof site.header.tagline, 'string');

    // an SVG image in the Intro stays vector
    fs.mkdirSync(path.join(project, '_media'), { recursive: true });
    fs.writeFileSync(path.join(project, '_media', 'motiv.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="300" height="200"><rect width="30" height="20" fill="#27418c"/></svg>');
    fs.writeFileSync(path.join(project, 'pages', 'index.md'), index.replace(/src: \/_assets\/images\/starter-hero\.jpg/, 'src: /_media/motiv.svg'));

    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    const out = build.stdout + build.stderr;
    assert.doesNotMatch(out, /missing-component|Palette contrast/i);
    const html = fs.readFileSync(path.join(project, 'build', 'public_development', 'index.html'), 'utf8');
    assert.match(html, /<body class="c-page c-page--v2">/);
    assert.match(html, /class="c-v2 c-v2--paper c-v2-intro"/);
    assert.match(html, /<figure class="c-v2-intro__media"><img src="\/images\/[^"]+\.svg"/, 'SVG passed through');
    const svgImg = html.match(/<figure class="c-v2-intro__media">(<img[^>]+>)/)[1];
    assert.doesNotMatch(svgImg, /width="300"/, 'SVG announced at the largest requested width, not its intrinsic 300px');
    assert.match(svgImg, /width="(\d+)" height="(\d+)"/);
    const [, w, h] = svgImg.match(/width="(\d+)" height="(\d+)"/);
    assert.equal(Math.round(Number(w) * 2 / 3), Number(h), 'aspect ratio kept');
    const images = fs.readdirSync(path.join(project, 'build', 'public_development', 'images'));
    assert.equal(images.some((f) => /^starter-v2-hero.*\.(webp|jpeg)$/.test(f)), false, 'no raster variants of the SVG');

    const plain = path.join(tmp, 'plain');
    assert.equal(run(['init', plain, '--starter']).status, 0);
    const plainConfig = JSON.parse(fs.readFileSync(path.join(plain, 'marbas-project.json'), 'utf8'));
    assert.equal(plainConfig.theme.id, null, 'init default unchanged');
    assert.match(fs.readFileSync(path.join(plain, 'pages', 'index.md'), 'utf8'), /componentType: Hero/, 'classic starter');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
