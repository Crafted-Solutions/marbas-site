import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveFooterConfig } from '../../../src/page/chrome/footer.js';

const minimal = {
  footer: {
    preset: 'simple',
    variant: 'default',
    companyName: 'Muster GmbH',
    intro: '',
    copyright: '© 2026 Muster GmbH',
    groups: [],
    contact: { address: { street: '', zip: '', city: '', country: '' }, phone: '', email: '' },
    socialLinks: [],
    ctaBlock: { enabled: false, title: '', text: '', label: '', href: '' },
    bottomLinks: { source: 'manual', links: [] }
  }
};

describe('resolveFooterConfig', () => {
  it('resolves preset correctly', () => {
    const cfg = resolveFooterConfig(minimal);
    assert.equal(cfg.preset, 'simple');
  });

  it('falls back to simple for invalid preset', () => {
    const cfg = resolveFooterConfig({ footer: { preset: 'mega-footer' } });
    assert.equal(cfg.preset, 'simple');
  });

  it('resolves variant from site settings', () => {
    const cfg = resolveFooterConfig({ footer: { ...minimal.footer, variant: 'accent' } });
    assert.equal(cfg.variant, 'accent');
  });

  it('falls back to theme default variant when at default', () => {
    const cfg = resolveFooterConfig(
      { footer: { ...minimal.footer, variant: 'default' } },
      { footerVariant: 'contrast' }
    );
    assert.equal(cfg.variant, 'contrast');
  });

  it('site-set non-default variant wins over theme default', () => {
    const cfg = resolveFooterConfig(
      { footer: { ...minimal.footer, variant: 'accent' } },
      { footerVariant: 'contrast' }
    );
    assert.equal(cfg.variant, 'accent');
  });

  it('limits groups to 4', () => {
    const groups = Array.from({ length: 6 }, (_, i) => ({ title: `G${i}`, source: 'manual', links: [] }));
    const cfg = resolveFooterConfig({ footer: { ...minimal.footer, groups } });
    assert.equal(cfg.groups.length, 4);
  });

  it('limits socialLinks to 8', () => {
    const links = Array.from({ length: 10 }, (_, i) => ({ platform: `p${i}`, label: `L${i}`, href: '/' }));
    const cfg = resolveFooterConfig({ footer: { ...minimal.footer, socialLinks: links } });
    assert.equal(cfg.socialLinks.length, 8);
  });

  it('resolves contact address', () => {
    const cfg = resolveFooterConfig({
      footer: {
        ...minimal.footer,
        contact: {
          address: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
          phone: '+49 123 456',
          email: 'info@example.de'
        }
      }
    });
    assert.equal(cfg.contact.address.street, 'Musterstraße 1');
    assert.equal(cfg.contact.phone, '+49 123 456');
    assert.equal(cfg.contact.email, 'info@example.de');
  });

  it('resolves enabled ctaBlock', () => {
    const cfg = resolveFooterConfig({
      footer: {
        ...minimal.footer,
        ctaBlock: { enabled: true, title: 'Angebot', text: 'Jetzt', label: 'Los', href: '/kontakt/' }
      }
    });
    assert.equal(cfg.ctaBlock.enabled, true);
    assert.equal(cfg.ctaBlock.title, 'Angebot');
    assert.equal(cfg.ctaBlock.href, '/kontakt/');
  });

  it('handles null/undefined siteSettings', () => {
    const cfg = resolveFooterConfig(null);
    assert.equal(cfg.preset, 'simple');
    assert.equal(cfg.variant, 'default');
    assert.deepEqual(cfg.groups, []);
  });

  it('resolves columns preset', () => {
    const cfg = resolveFooterConfig({ footer: { ...minimal.footer, preset: 'columns' } });
    assert.equal(cfg.preset, 'columns');
  });
});
