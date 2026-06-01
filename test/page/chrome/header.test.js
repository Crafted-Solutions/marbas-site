import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveHeaderConfig } from '../../../src/page/chrome/header.js';

const minimal = {
  title: 'Test',
  header: {
    preset: 'brand-nav',
    variant: 'default',
    navigationVariant: 'default',
    sticky: false,
    showCompanyName: true,
    announcement: { enabled: false },
    utilityLinks: { source: 'manual', links: [] },
    actions: [],
    mobile: { drawer: true, showUtilityLinksInDrawer: true, showActionsInDrawer: true }
  },
  logo: { show: true, path: '/_assets/images/Logo.png' }
};

describe('resolveHeaderConfig', () => {
  it('resolves preset correctly', () => {
    const cfg = resolveHeaderConfig(minimal);
    assert.equal(cfg.preset, 'brand-nav');
  });

  it('falls back to brand-nav for invalid preset', () => {
    const cfg = resolveHeaderConfig({ header: { preset: 'mega-nav' } });
    assert.equal(cfg.preset, 'brand-nav');
  });

  it('resolves variant from site settings', () => {
    const cfg = resolveHeaderConfig({ header: { ...minimal.header, variant: 'glass' } });
    assert.equal(cfg.variant, 'glass');
  });

  it('falls back to theme default variant when site variant is default', () => {
    const cfg = resolveHeaderConfig(
      { header: { ...minimal.header, variant: 'default' } },
      { headerVariant: 'accent' }
    );
    assert.equal(cfg.variant, 'accent');
  });

  it('site-set non-default variant wins over theme default', () => {
    const cfg = resolveHeaderConfig(
      { header: { ...minimal.header, variant: 'glass' } },
      { headerVariant: 'accent' }
    );
    assert.equal(cfg.variant, 'glass');
  });

  it('resolves navigationVariant from theme default when at default', () => {
    const cfg = resolveHeaderConfig(
      { header: { ...minimal.header, navigationVariant: 'default' } },
      { navigationVariant: 'pill' }
    );
    assert.equal(cfg.navigationVariant, 'pill');
  });

  it('sets sticky correctly', () => {
    const cfg = resolveHeaderConfig({ header: { sticky: true } });
    assert.equal(cfg.sticky, true);
  });

  it('defaults sticky to false', () => {
    const cfg = resolveHeaderConfig({});
    assert.equal(cfg.sticky, false);
  });

  it('resolves logo config', () => {
    const cfg = resolveHeaderConfig(minimal);
    assert.equal(cfg.logo.show, true);
    assert.equal(cfg.logo.path, '/_assets/images/Logo.png');
  });

  it('resolves enabled announcement bar', () => {
    const siteSettings = {
      header: {
        ...minimal.header,
        announcement: {
          enabled: true,
          id: 'spring-2026',
          text: 'Angebot!',
          label: 'Mehr',
          href: '/angebote/'
        }
      }
    };
    const cfg = resolveHeaderConfig(siteSettings);
    assert.equal(cfg.announcement.enabled, true);
    assert.equal(cfg.announcement.id, 'spring-2026');
    assert.equal(cfg.announcement.href, '/angebote/');
  });

  it('resolves disabled announcement bar', () => {
    const cfg = resolveHeaderConfig(minimal);
    assert.equal(cfg.announcement.enabled, false);
  });

  it('normalizes actions to max 2', () => {
    const siteSettings = {
      header: {
        ...minimal.header,
        actions: [
          { label: 'A', href: '/a/', style: 'primary' },
          { label: 'B', href: '/b/', style: 'secondary' },
          { label: 'C', href: '/c/', style: 'outline' }
        ]
      }
    };
    const cfg = resolveHeaderConfig(siteSettings);
    assert.equal(cfg.actions.length, 2);
  });

  it('resolves mobile defaults', () => {
    const cfg = resolveHeaderConfig({});
    assert.equal(cfg.mobile.drawer, true);
    assert.equal(cfg.mobile.showUtilityLinksInDrawer, true);
  });

  it('handles null/undefined siteSettings', () => {
    const cfg = resolveHeaderConfig(null);
    assert.equal(cfg.preset, 'brand-nav');
    assert.equal(cfg.sticky, false);
  });
});
