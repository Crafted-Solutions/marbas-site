import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uiText, localize } from '../../src/render/filters/locale.js';
import { normalizeSiteSettings, validateSiteSettings } from '../../src/site-settings/normalize.js';

test('uiText: German, English, region subtag, unknown language → English, {name}', () => {
  assert.equal(uiText('navOpen', 'de'), 'Navigation öffnen');
  assert.equal(uiText('navOpen', 'en'), 'Open navigation');
  assert.equal(uiText('skipLink', 'de-AT'), 'Zum Inhalt springen');
  assert.equal(uiText('legal', 'fr'), 'Legal');
  assert.equal(uiText('submenu', 'en', 'Services'), 'Show subpages of Services');
});

test('localize: objects per language with fallbacks; plain values pass through', () => {
  const value = { de: 'Termin buchen', en: 'Book appointment' };
  assert.equal(localize(value, 'en', 'de'), 'Book appointment');
  assert.equal(localize(value, 'de-at', 'de'), 'Termin buchen');
  assert.equal(localize(value, 'fr', 'de'), 'Termin buchen', 'falls back to the default language');
  assert.equal(localize({ en: 'Only English' }, 'fr', 'de'), 'Only English', 'falls back to the first value');
  assert.equal(localize('Plain', 'en', 'de'), 'Plain');
  assert.equal(localize(undefined, 'en', 'de'), undefined);
});

test('normalizeSiteSettings keeps localized texts and validates a localized title', () => {
  const site = normalizeSiteSettings({
    title: { de: 'Praxis', en: 'Practice' },
    header: { actions: [{ label: { de: 'Termin', en: 'Book' }, href: '/kontakt/' }] },
    footer: {
      copyright: { de: '© DE', en: '© EN' },
      groups: [{ title: { de: 'Praxis', en: 'Practice' }, links: [{ label: { de: 'Team', en: 'Team' }, href: { de: '/team/', en: '/en/team/' } }] }]
    }
  }, '/tmp/demo');
  assert.deepEqual(site.title, { de: 'Praxis', en: 'Practice' });
  assert.deepEqual(site.header.actions[0].label, { de: 'Termin', en: 'Book' });
  assert.deepEqual(site.footer.copyright, { de: '© DE', en: '© EN' });
  assert.deepEqual(site.footer.groups[0].links[0].href, { de: '/team/', en: '/en/team/' });
  assert.deepEqual(validateSiteSettings(site), []);
  // non-language keys and non-string values are dropped
  const odd = normalizeSiteSettings({ footer: { intro: { de: 'Hallo', foo: 'x', en: 5 } } }, '/tmp/demo');
  assert.deepEqual(odd.footer.intro, { de: 'Hallo' });
});

test('public chrome resolvers keep localized values instead of "[object Object]"', async () => {
  const { resolveFooterConfig, resolveActions, resolveAnnouncementConfig } = await import('../../src/page/chrome/index.js');
  const copyright = { de: '© DE', en: '© EN' };
  assert.deepEqual(resolveFooterConfig({ footer: { copyright } }).copyright, copyright);
  assert.equal(resolveFooterConfig({ footer: { copyright: '  © 2026  ' } }).copyright, '© 2026');
  assert.deepEqual(resolveActions([{ label: { de: 'Termin', en: 'Book' }, href: '/k/' }])[0].label, { de: 'Termin', en: 'Book' });
  assert.deepEqual(resolveAnnouncementConfig({ enabled: true, text: { de: 'Neu', en: 'New' } }).text, { de: 'Neu', en: 'New' });
});
