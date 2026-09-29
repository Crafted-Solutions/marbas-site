import test from 'node:test';
import assert from 'node:assert/strict';
import { readThemeLayout, layoutBodyClasses, LAYOUT_DEFAULTS, LAYOUT_OPTIONS } from '../../src/theme/layout.js';
import { resolveThemePalette } from '../../src/theme/copy.js';

test('layout: defaults without @layout (rail top, cards, buttons)', () => {
  const { layout, warnings } = readThemeLayout('/* theme — @family v2 */ :root { --p-paper: #fff; }');
  assert.deepEqual(layout, { ...LAYOUT_DEFAULTS });
  assert.deepEqual(warnings, []);
  assert.equal(layout.rail, 'top');
  assert.equal(layoutBodyClasses(layout), 'c-l-rail-top c-l-intro-split c-l-linklist-cards c-l-split-columns c-l-notice-box c-l-cta-button');
});

test('layout: @layout in a comment sets the declared keys, keeps defaults for the rest', () => {
  const css = `/* ====
   @family v2
   @layout rail=side linklist=rows cta=link
   ==== */`;
  const { layout, warnings } = readThemeLayout(css);
  assert.deepEqual(warnings, []);
  assert.equal(layout.rail, 'side');
  assert.equal(layout.linklist, 'rows');
  assert.equal(layout.cta, 'link');
  assert.equal(layout.intro, LAYOUT_DEFAULTS.intro);
});

test('layout: unknown keys and values warn and fall back', () => {
  const { layout, warnings } = readThemeLayout('/* @layout rail=left hero=big intro=reverse split=a=b */');
  assert.equal(layout.rail, 'top');
  assert.equal(layout.intro, 'reverse');
  assert.equal(layout.split, 'columns');
  assert.equal(warnings.length, 3);
  assert.match(warnings.join('\n'), /rail="left" ungültig/);
  assert.match(warnings.join('\n'), /unbekannter Schlüssel "hero"/);
});

test('layout: outside comments is ignored; body classes only emit known values', () => {
  assert.deepEqual(readThemeLayout('.x { content: "@layout rail=side"; }').layout, { ...LAYOUT_DEFAULTS });
  assert.match(layoutBodyClasses({ rail: 'evil" onload="x' }), /^c-l-rail-top /);
  for (const key of Object.keys(LAYOUT_OPTIONS)) assert.ok(LAYOUT_OPTIONS[key].includes(LAYOUT_DEFAULTS[key]), key);
});

test('layout: resolveThemePalette carries the layout and its warnings (v2); classic gets defaults', () => {
  const v2 = resolveThemePalette({ css: '/* @family v2\n @layout rail=side notice=bogus */ :root { --p-paper: #fff; --p-ink: #111; }' });
  assert.equal(v2.layout.rail, 'side');
  assert.ok(v2.warnings.some((w) => w.includes('notice')));
  const classic = resolveThemePalette({ css: '/* @layout rail=side */ :root { --t-bg: #fff; }' });
  assert.deepEqual(classic.layout, { ...LAYOUT_DEFAULTS });
});
