import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  configureLocalMediaFilters,
  configureHtmlFilters,
  configureAriaFilters,
  configureLocaleFilters,
  configureHtmlShortcodes,
  registerWithEleventy,
  shouldBypassEleventyImageProcessing,
  createFallbackImageHtml,
  createDir,
  copyRecursive
} from '../../src/render/index.js';

function mockEleventyConfig() {
  const filters = {};
  const asyncFilters = {};
  const shortcodes = {};
  const globalData = {};

  return {
    filters,
    asyncFilters,
    shortcodes,
    globalData,
    addFilter(name, fn) { filters[name] = fn; },
    addAsyncFilter(name, fn) { asyncFilters[name] = fn; },
    addShortcode(name, fn) { shortcodes[name] = fn; },
    addAsyncShortcode(name, fn) { shortcodes[name] = fn; },
    addGlobalData(name, value) { globalData[name] = value; }
  };
}

test('render/index — all exports are functions', () => {
  assert.equal(typeof configureLocalMediaFilters, 'function');
  assert.equal(typeof configureHtmlFilters, 'function');
  assert.equal(typeof configureAriaFilters, 'function');
  assert.equal(typeof configureLocaleFilters, 'function');
  assert.equal(typeof configureHtmlShortcodes, 'function');
  assert.equal(typeof registerWithEleventy, 'function');
  assert.equal(typeof shouldBypassEleventyImageProcessing, 'function');
  assert.equal(typeof createFallbackImageHtml, 'function');
  assert.equal(typeof createDir, 'function');
  assert.equal(typeof copyRecursive, 'function');
});

test('configureHtmlFilters — registers htmlAttribute and stringify', () => {
  const config = mockEleventyConfig();
  configureHtmlFilters(config);
  assert.equal(typeof config.filters.htmlAttribute, 'function');
  assert.equal(typeof config.filters.stringify, 'function');
});

test('configureHtmlFilters — htmlAttribute produces correct output', () => {
  const config = mockEleventyConfig();
  configureHtmlFilters(config);
  const result = config.filters.htmlAttribute('class', 'hero-section');
  assert.equal(result, 'class="hero-section"');
});

test('configureHtmlFilters — htmlAttribute returns empty string for empty value', () => {
  const config = mockEleventyConfig();
  configureHtmlFilters(config);
  assert.equal(config.filters.htmlAttribute('class', ''), '');
  assert.equal(config.filters.htmlAttribute('class', null), '');
});

test('configureAriaFilters — registers getAriaLabelAttribute', () => {
  const config = mockEleventyConfig();
  configureAriaFilters(config);
  assert.equal(typeof config.filters.getAriaLabelAttribute, 'function');
});

test('configureAriaFilters — getAriaLabelAttribute returns correct attribute', () => {
  const config = mockEleventyConfig();
  configureAriaFilters(config);
  assert.equal(config.filters.getAriaLabelAttribute('close menu'), 'aria-label="close menu"');
  assert.equal(config.filters.getAriaLabelAttribute(''), '');
});

test('configureHtmlShortcodes — registers SITE_DOMAIN shortcode', () => {
  const config = mockEleventyConfig();
  configureHtmlShortcodes(config, 'example.com');
  assert.equal(typeof config.shortcodes.SITE_DOMAIN, 'function');
  assert.equal(config.shortcodes.SITE_DOMAIN(), 'example.com');
});

test('configureHtmlShortcodes — getDomainWithPath filter returns domain + path', () => {
  const config = mockEleventyConfig();
  configureHtmlShortcodes(config, 'https://example.com');
  assert.equal(config.filters.getDomainWithPath('/about'), 'https://example.com/about');
});

test('configureLocalMediaFilters — registers processLocalImage async filter', () => {
  const config = mockEleventyConfig();
  configureLocalMediaFilters(config, '');
  assert.equal(typeof config.asyncFilters.processLocalImage, 'function');
  assert.equal(typeof config.filters.getLocalVideo, 'function');
});

test('registerWithEleventy — registers all core filters and shortcodes', () => {
  const config = mockEleventyConfig();
  registerWithEleventy(config, { publishFolder: '', domain: 'test.com' });

  assert.equal(typeof config.filters.htmlAttribute, 'function');
  assert.equal(typeof config.filters.getAriaLabelAttribute, 'function');
  assert.equal(typeof config.asyncFilters.processLocalImage, 'function');
  assert.equal(typeof config.shortcodes.SITE_DOMAIN, 'function');
});

test('registerWithEleventy — locale filters skipped when no localeConfig', () => {
  const config = mockEleventyConfig();
  registerWithEleventy(config, { domain: 'test.com' });
  assert.equal(config.filters.locale_url, undefined);
});

test('registerWithEleventy — locale filters registered with valid localeConfig', () => {
  const config = mockEleventyConfig();
  const localeConfig = {
    defaultLanguage: 'de',
    languages: [{ code: 'de', name: 'Deutsch', iso: 'de-DE' }]
  };
  registerWithEleventy(config, { localeConfig });
  assert.equal(typeof config.filters.locale_url, 'function');
});

test('shouldBypassEleventyImageProcessing — returns boolean', () => {
  const result = shouldBypassEleventyImageProcessing();
  assert.equal(typeof result, 'boolean');
});

test('createFallbackImageHtml — generates img tag', () => {
  const html = createFallbackImageHtml({ src: '/images/test.jpg', alt: 'Test image' });
  assert.ok(html.startsWith('<img '));
  assert.ok(html.includes('src="/images/test.jpg"'));
  assert.ok(html.includes('alt="Test image"'));
});
