import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readThemeFamily, readPalettePresets, normalizePaletteConfig, paletteOverrideCss,
  readPaletteValues, paletteContrastWarnings, contrastRatio
} from '../../src/theme/palette.js';
import { resolveThemePalette } from '../../src/theme/copy.js';

const V2 = `/* theme-x — @family v2 */
:root { --p-paper: #f8f8f5; --p-ink: #252d2a; --p-muted: #53615b; --p-accent: #234b45; --p-accent-soft: #e8efea; --p-alert: #7e332f; --p-alert-soft: #f6eeeb; }
:root[data-palette="nacht"] { --p-paper: #12172a; --p-ink: #ecebe4; --p-muted: #a9adbb; --p-accent: #d9b25f; --p-accent-soft: #1b2240; }`;

test('family: @family marker in a comment, default classic', () => {
  assert.equal(readThemeFamily(V2), 'v2');
  assert.equal(readThemeFamily(':root { --t-bg: #fff; }'), 'classic');
  assert.equal(readThemeFamily('.x { content: "@family v2"; }'), 'classic', 'only comments count');
});

test('presets and palette values', () => {
  assert.deepEqual(readPalettePresets(V2), ['nacht']);
  assert.equal(readPaletteValues(V2).paper, '#f8f8f5');
  assert.equal(readPaletteValues(V2, 'nacht').paper, '#12172a');
  assert.equal(readPaletteValues(V2, 'nacht').alert, '#7e332f', 'preset inherits unset values from the default');
});

test('config validation: only known names and plain colours pass (values end up in CSS)', () => {
  const ok = normalizePaletteConfig({ palette: 'nacht', colors: { accent: '#b8344f', paper: 'rgb(250, 248, 240)' } });
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.colors, { accent: '#b8344f', paper: 'rgb(250, 248, 240)' });
  const bad = normalizePaletteConfig({ palette: 'Nacht!', colors: { accent: 'red; } body { display:none', shadow: '#000', ink: 42 } });
  assert.equal(bad.preset, null);
  assert.deepEqual(bad.colors, {});
  assert.equal(bad.errors.length, 4);
});

test('override css targets --p-* with higher specificity than presets', () => {
  assert.equal(paletteOverrideCss({}), '');
  const css = paletteOverrideCss({ accent: '#b8344f' });
  assert.match(css, /:root:root, :root:root\[data-palette\] \{\n  --p-accent: #b8344f;\n\}/);
});

test('contrast: WCAG ratio and warnings below 4.5', () => {
  assert.equal(contrastRatio('#000', '#fff').toFixed(1), '21.0');
  assert.deepEqual(paletteContrastWarnings(readPaletteValues(V2)), []);
  const weak = paletteContrastWarnings({ ...readPaletteValues(V2), accent: '#9fc9bf' });
  assert.ok(weak.some((w) => /Akzent\/Links auf Papier/.test(w.label)));
});

test('resolveThemePalette: v2 applies preset + colours, classic ignores them with a warning', () => {
  const v2 = resolveThemePalette({ css: V2, theme: { palette: 'nacht', colors: { accent: '#e0c070' } } });
  assert.equal(v2.family, 'v2');
  assert.equal(v2.preset, 'nacht');
  assert.match(v2.overrideCss, /--p-accent: #e0c070/);
  const unknown = resolveThemePalette({ css: V2, theme: { palette: 'fehlt' } });
  assert.equal(unknown.preset, null);
  assert.match(unknown.warnings[0], /gibt es in diesem Theme nicht/);
  const classic = resolveThemePalette({ css: ':root{}', theme: { colors: { accent: '#000000' } } });
  assert.equal(classic.family, 'classic');
  assert.equal(classic.overrideCss, '');
  assert.match(classic.warnings[0], /nur bei Themes der Familie v2/);
});

test('ejected base.njk without Base v2 classes is reported for v2 themes only', async () => {
  const fs = await import('fs'); const os = await import('os'); const path = await import('path');
  const { checkEjectedBaseForV2 } = await import('../../src/theme/copy.js');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-ejected-'));
  try {
    assert.equal(checkEjectedBaseForV2({ projectRoot: root, family: 'v2' }), null, 'no ejected base → fine');
    fs.mkdirSync(path.join(root, '_includes'));
    fs.writeFileSync(path.join(root, '_includes', 'base.njk'), '<body class="c-page">');
    assert.match(checkEjectedBaseForV2({ projectRoot: root, family: 'v2' }), /ge-ejectete _includes\/base\.njk/);
    assert.equal(checkEjectedBaseForV2({ projectRoot: root, family: 'classic' }), null);
    fs.writeFileSync(path.join(root, '_includes', 'base.njk'), '<html {{ marbasTheme.palette }}><body class="c-page--{{ marbasTheme.family }}">');
    assert.equal(checkEjectedBaseForV2({ projectRoot: root, family: 'v2' }), null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('palette surface (Task 130): accepted in theme.colors, defaults to white for the contrast check', () => {
    assert.deepEqual(normalizePaletteConfig({ colors: { surface: '#1a2038' } }).colors, { surface: '#1a2038' });
    const css = ':root { --p-paper: #12172a; --p-ink: #ecebe4; }';
    assert.equal(readPaletteValues(css).surface, '#ffffff');
    const labels = paletteContrastWarnings(readPaletteValues(css)).map((w) => w.label);
    assert.ok(labels.includes('Text auf weißem Band (surface)'), 'dark palette without surface is reported');
    const withSurface = readPaletteValues(':root { --p-paper: #12172a; --p-ink: #ecebe4; --p-surface: #1a2038; }');
    assert.equal(paletteContrastWarnings(withSurface).some((w) => w.label.includes('surface')), false);
});
