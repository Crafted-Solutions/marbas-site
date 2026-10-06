/**
 * Task 160: locale_url only prefixes site paths — external URLs, other schemes, anchors stay unchanged.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { configureLocaleFilters } from '../../src/render/filters/locale.js';

function localeUrl() {
  const filters = {};
  configureLocaleFilters({ addFilter: (name, fn) => { filters[name] = fn; }, addGlobalData() {}, addShortcode() {}, addNunjucksFilter() {}, addCollection() {} },
    { defaultLanguage: 'de', languages: [{ code: 'de', name: 'Deutsch' }, { code: 'en', name: 'English' }] });
  return (url, pageLanguage) => filters.locale_url.call({ ctx: { pageLanguage } }, url);
}

test('locale_url: default language unchanged', () => {
  const f = localeUrl();
  for (const url of ['/', '/ueber-uns/', 'https://x.de', '#kontakt']) assert.equal(f(url, 'de'), url);
});

test('locale_url: site paths get the language prefix', () => {
  const f = localeUrl();
  assert.equal(f('/', 'en'), '/en/');
  assert.equal(f('/about-us/', 'en'), '/en/about-us/');
  assert.equal(f('about-us/', 'en'), '/en/about-us/');
});

test('locale_url: external URLs, schemes, anchors and prefixed paths pass through (Task 160)', () => {
  const f = localeUrl();
  for (const url of ['https://x.de/a', 'http://x.de', 'HTTPS://X.DE', 'tel:+4930123', 'mailto:a@b.de', '//cdn.x.de/a.js',
    '#kontakt', '?q=1', '', '/en/', '/en/about-us/', '/en']) {
    assert.equal(f(url, 'en'), url, url);
  }
  assert.equal(f(undefined, 'en'), undefined);
  assert.equal(f('/english/', 'en'), '/en/english/', 'a path that only starts with the code is still prefixed');
});
