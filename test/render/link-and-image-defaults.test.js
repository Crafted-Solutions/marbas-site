import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildImageFilename } from '../../src/render/filters/local-media.js';
import { configureHtmlFilters, configureLocaleFilters } from '../../src/render/index.js';
import { defaultLinkText } from '../../src/render/filters/locale.js';

function mockEleventyConfig() {
  const filters = {};
  return {
    filters,
    addFilter(name, fn) { filters[name] = fn; },
    addGlobalData() {},
    addShortcode() {}
  };
}

// ── buildImageFilename ─────────────────────────

test('buildImageFilename — uses originalId when set', () => {
  assert.equal(buildImageFilename({ src: '/_media/a.jpg', originalId: 'team-photo' }, 800, 'webp'), 'team-photo-800w.webp');
});

test('buildImageFilename — without originalId: stable, source-unique, no "undefined"', () => {
  const a1 = buildImageFilename({ src: '/_media/Team Foto.JPG' }, 800, 'webp');
  const a2 = buildImageFilename({ src: '/_media/Team Foto.JPG' }, 800, 'webp');
  const b = buildImageFilename({ src: '/_media/other/Team Foto.JPG' }, 800, 'webp');
  assert.equal(a1, a2, 'same src → same name across builds');
  assert.notEqual(a1, b, 'different src → different name, even with equal basename');
  assert.match(a1, /^team-foto-[0-9a-f]{8}-800w\.webp$/);
  assert.ok(!a1.includes('undefined'));
});

test('buildImageFilename — blank originalId is treated as missing', () => {
  assert.match(buildImageFilename({ src: '/_media/x.png', originalId: '  ' }, 400, 'jpeg'), /^x-[0-9a-f]{8}-400w\.jpeg$/);
});

// ── defaultLinkText ─────────────────────────────

test('defaultLinkText — German, English, region subtags, unknown → English', () => {
  assert.equal(defaultLinkText('de'), 'weitere Informationen');
  assert.equal(defaultLinkText('de-AT'), 'weitere Informationen');
  assert.equal(defaultLinkText('EN'), 'More information');
  assert.equal(defaultLinkText('fr'), 'More information');
});

test('defaultLinkText filter — falls back to the site default language when lang is empty', () => {
  const config = mockEleventyConfig();
  configureLocaleFilters(config, { defaultLanguage: 'de', languages: [{ code: 'de', label: 'Deutsch' }] });
  assert.equal(config.filters.defaultLinkText(undefined), 'weitere Informationen');
  assert.equal(config.filters.defaultLinkText('en'), 'More information');
});

// ── htmlAttribute escaping ──────────────────────

test('htmlAttribute — escapes quotes and angle brackets, keeps existing entities', () => {
  const config = mockEleventyConfig();
  configureHtmlFilters(config);
  assert.equal(config.filters.htmlAttribute('aria-label', 'Mehr zu "Leistungen" <neu>'), 'aria-label="Mehr zu &quot;Leistungen&quot; &lt;neu&gt;"');
  assert.equal(config.filters.htmlAttribute('aria-label', 'A &amp; B & C'), 'aria-label="A &amp; B &amp; C"');
});
