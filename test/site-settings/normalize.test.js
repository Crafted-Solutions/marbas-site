import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { normalizeSiteSettings, validateSiteSettings } from '../../src/site-settings/normalize.js';
import { getDefaultSiteSettings } from '../../src/site-settings/defaults.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('getDefaultSiteSettings', () => {
  it('returns default title based on projectRoot basename', () => {
    const defaults = getDefaultSiteSettings('/projects/my-site');
    assert.equal(defaults.title, 'my-site');
  });

  it('falls back to Marbas when projectRoot is empty', () => {
    const defaults = getDefaultSiteSettings('');
    assert.equal(defaults.title, 'Marbas');
  });

  it('does not include _schema (app-only)', () => {
    const defaults = getDefaultSiteSettings('/project');
    assert.equal(defaults._schema, undefined);
  });

  it('does not include a theme block (theme lives in marbas-project.json)', () => {
    const defaults = getDefaultSiteSettings('/project');
    assert.equal(defaults.theme, undefined);
  });

  it('sets correct header defaults', () => {
    const defaults = getDefaultSiteSettings('/project');
    assert.equal(defaults.header.preset, 'brand-nav');
    assert.equal(defaults.header.variant, 'default');
    assert.equal(defaults.header.navigationVariant, 'default');
    assert.equal(defaults.header.sticky, false);
  });

  it('sets correct footer defaults', () => {
    const defaults = getDefaultSiteSettings('/project');
    assert.equal(defaults.footer.preset, 'simple');
    assert.equal(defaults.footer.variant, 'default');
    assert.equal(defaults.footer.bottomLinks.source, 'manual');
    assert.equal(defaults.footer.bottomLinks.links.length, 2);
  });
});

describe('normalizeSiteSettings', () => {
  it('applies defaults when input is empty', () => {
    const result = normalizeSiteSettings({}, '/projects/my-site');
    assert.equal(result.title, 'my-site');
    assert.equal(result.header.preset, 'brand-nav');
    assert.equal(result.footer.preset, 'simple');
  });

  it('preserves valid title from input', () => {
    const result = normalizeSiteSettings({ title: 'Muster GmbH' }, '/project');
    assert.equal(result.title, 'Muster GmbH');
  });

  it('normalizes invalid header preset to brand-nav', () => {
    const result = normalizeSiteSettings({ header: { preset: 'invalid-preset' } }, '/project');
    assert.equal(result.header.preset, 'brand-nav');
  });

  it('normalizes invalid footer preset to simple', () => {
    const result = normalizeSiteSettings({ footer: { preset: 'bad' } }, '/project');
    assert.equal(result.footer.preset, 'simple');
  });

  it('normalizes invalid header variant to default', () => {
    const result = normalizeSiteSettings({ header: { variant: 'unknown' } }, '/project');
    assert.equal(result.header.variant, 'default');
  });

  it('preserves valid header variant', () => {
    const result = normalizeSiteSettings({ header: { variant: 'glass' } }, '/project');
    assert.equal(result.header.variant, 'glass');
  });

  it('normalizes invalid navigation variant to default', () => {
    const result = normalizeSiteSettings({ header: { navigationVariant: 'zigzag' } }, '/project');
    assert.equal(result.header.navigationVariant, 'default');
  });

  it('preserves valid navigation variant', () => {
    const result = normalizeSiteSettings({ header: { navigationVariant: 'pill' } }, '/project');
    assert.equal(result.header.navigationVariant, 'pill');
  });

  it('normalizes boolean readBoolean from string', () => {
    const result = normalizeSiteSettings({ header: { sticky: 'true' } }, '/project');
    assert.equal(result.header.sticky, true);
  });

  it('limits actions to 2', () => {
    const result = normalizeSiteSettings({
      header: {
        actions: [
          { label: 'A', href: '/a/', style: 'primary' },
          { label: 'B', href: '/b/', style: 'secondary' },
          { label: 'C', href: '/c/', style: 'outline' }
        ]
      }
    }, '/project');
    assert.equal(result.header.actions.length, 2);
  });

  it('normalizes invalid action style to primary', () => {
    const result = normalizeSiteSettings({
      header: { actions: [{ label: 'X', href: '/', style: 'neon' }] }
    }, '/project');
    assert.equal(result.header.actions[0].style, 'primary');
  });

  it('limits socialLinks to 8', () => {
    const links = Array.from({ length: 10 }, (_, i) => ({ platform: `p${i}`, label: `L${i}`, href: `/` }));
    const result = normalizeSiteSettings({ footer: { socialLinks: links } }, '/project');
    assert.equal(result.footer.socialLinks.length, 8);
  });

  it('limits footer groups to 4', () => {
    const groups = Array.from({ length: 6 }, (_, i) => ({ title: `G${i}`, source: 'manual', links: [] }));
    const result = normalizeSiteSettings({ footer: { groups } }, '/project');
    assert.equal(result.footer.groups.length, 4);
  });

  it('migrates legacy footer.links to bottomLinks', () => {
    const result = normalizeSiteSettings({
      footer: {
        links: {
          imprint: { label: 'Impressum', href: '/impressum/' },
          privacy: { label: 'Datenschutz', href: '/datenschutz/' }
        }
      }
    }, '/project');
    assert.equal(result.footer.bottomLinks.source, 'manual');
    assert.equal(result.footer.bottomLinks.links.length, 2);
    assert.equal(result.footer.bottomLinks.links[0].href, '/impressum/');
  });

  it('migrates legacy footer.address to contact.address', () => {
    const result = normalizeSiteSettings({
      footer: {
        address: { street: 'Altstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
        contact: { phone: '123', email: 'test@test.de' }
      }
    }, '/project');
    assert.equal(result.footer.contact.address.street, 'Altstraße 1');
    assert.equal(result.footer.contact.phone, '123');
  });

  it('preserves _schema pass-through (forward-compat)', () => {
    const schema = { title: { widget: 'text', required: true } };
    const result = normalizeSiteSettings({ title: 'Test', _schema: schema }, '/project');
    assert.deepEqual(result._schema, schema);
  });

  it('normalizes tagCollection link source', () => {
    const result = normalizeSiteSettings({
      header: { utilityLinks: { source: 'tagCollection', tags: ['news'], limit: 5 } }
    }, '/project');
    assert.equal(result.header.utilityLinks.source, 'tagCollection');
    assert.deepEqual(result.header.utilityLinks.tags, ['news']);
    assert.equal(result.header.utilityLinks.limit, 5);
  });
});

describe('validateSiteSettings', () => {
  it('returns empty array for valid settings', () => {
    const errors = validateSiteSettings({ title: 'My Site', seo: {} });
    assert.deepEqual(errors, []);
  });

  it('errors when title is missing', () => {
    const errors = validateSiteSettings({ title: '' });
    assert.ok(errors.length > 0);
    assert.ok(errors[0].includes('Titel'));
  });

  it('errors when alt-text is set without image src', () => {
    const errors = validateSiteSettings({
      title: 'Site',
      seo: { defaultImage: { alt: 'Some alt text', src: '' } }
    });
    assert.ok(errors.some(e => e.includes('Alt-Text')));
  });

  it('passes when alt and src are both set', () => {
    const errors = validateSiteSettings({
      title: 'Site',
      seo: { defaultImage: { alt: 'Logo', src: '/og.jpg' } }
    });
    assert.deepEqual(errors, []);
  });
});

describe('normalizeSiteSettings — theme migration (Task 90)', () => {
  it('drops a legacy theme field from existing site.json', () => {
    const normalized = normalizeSiteSettings({
      title: 'Legacy Site',
      theme: { id: 'theme-bloom', cssMode: 'marbas' }
    }, '/project');
    assert.equal(normalized.theme, undefined, 'legacy theme must not survive normalization');
  });

  it('never emits a theme block for a clean input', () => {
    const normalized = normalizeSiteSettings({ title: 'Clean Site' }, '/project');
    assert.equal(normalized.theme, undefined);
  });

  it('preserves app-only passthrough fields (e.g. _schema) while dropping theme', () => {
    const normalized = normalizeSiteSettings({
      title: 'Site',
      _schema: 'v2',
      theme: { id: 'theme-atlas' }
    }, '/project');
    assert.equal(normalized._schema, 'v2', '_schema must still pass through');
    assert.equal(normalized.theme, undefined, 'theme must be dropped');
  });
});
