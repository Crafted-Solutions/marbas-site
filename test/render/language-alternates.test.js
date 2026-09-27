import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAlternates } from '../../src/render/filters/locale.js';

const locale = { defaultLanguage: 'de', languages: [{ code: 'de', label: 'Deutsch' }, { code: 'en', label: 'English' }] };
const page = (url, pageLanguage, extra = {}) => ({ url, data: { pageLanguage, ...extra } });
const urls = (alts) => Object.fromEntries(alts.map((a) => [a.code, a.url]));

test('same path below the language folder', () => {
  const pages = [page('/ueber-uns/', 'de'), page('/en/ueber-uns/', 'en')];
  assert.deepEqual(urls(computeAlternates(pages, pages[0], locale)), { de: '/ueber-uns/', en: '/en/ueber-uns/' });
  assert.deepEqual(urls(computeAlternates(pages, pages[1], locale)), { de: '/ueber-uns/', en: '/en/ueber-uns/' });
});

test('home pages of both languages belong together', () => {
  const pages = [page('/', 'de'), page('/en/', 'en')];
  assert.deepEqual(urls(computeAlternates(pages, pages[1], locale)), { de: '/', en: '/en/' });
});

test('translated slugs via translationKey', () => {
  const pages = [page('/ueber-uns/', 'de', { translationKey: 'about' }), page('/en/about-us/', 'en', { translationKey: 'about' })];
  assert.deepEqual(urls(computeAlternates(pages, pages[0], locale)), { de: '/ueber-uns/', en: '/en/about-us/' });
});

test('translated slugs via CMS ids (marbasCmsI18n.sourcePageId → pageId)', () => {
  const pages = [
    page('/leistungen/', 'de', { pageId: 'p-1' }),
    page('/en/services/', 'en', { pageId: 'p-2', marbasCmsI18n: { sourcePageId: 'p-1' } })
  ];
  assert.deepEqual(urls(computeAlternates(pages, pages[1], locale)), { de: '/leistungen/', en: '/en/services/' });
});

test('page without translation → null for the other language', () => {
  const pages = [page('/impressum/', 'de'), page('/en/', 'en')];
  const alts = computeAlternates(pages, pages[0], locale);
  assert.deepEqual(urls(alts), { de: '/impressum/', en: null });
  assert.equal(alts.find((a) => a.code === 'de').current, true);
  assert.equal(alts.find((a) => a.code === 'en').label, 'English');
});

test('an explicitly linked page is not matched by path to an unrelated page', () => {
  const pages = [
    page('/team/', 'de', { translationKey: 'team' }),
    page('/en/team/', 'en', { translationKey: 'crew' })
  ];
  assert.equal(urls(computeAlternates(pages, pages[0], locale)).en, null);
});

test('a slug that starts with a language code is not treated as a language prefix', () => {
  const pages = [page('/design/', 'de'), page('/en/design/', 'en')];
  assert.deepEqual(urls(computeAlternates(pages, pages[0], locale)), { de: '/design/', en: '/en/design/' });
});
