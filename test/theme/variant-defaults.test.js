import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getVariantDefaultsForTheme, applyVariantDefaultsToSiteSettings } from '../../src/theme/variant-defaults.js';

describe('getVariantDefaultsForTheme', () => {
  it('returns theme-atlas defaults', () => {
    const d = getVariantDefaultsForTheme('theme-atlas');
    assert.equal(d.headerVariant, 'line');
    assert.equal(d.navigationVariant, 'underline');
    assert.equal(d.footerVariant, 'contrast');
  });

  it('returns all-default for unknown theme', () => {
    const d = getVariantDefaultsForTheme('theme-unknown');
    assert.equal(d.headerVariant, 'default');
    assert.equal(d.navigationVariant, 'default');
    assert.equal(d.footerVariant, 'default');
  });
});

describe('applyVariantDefaultsToSiteSettings', () => {
  const baseSettings = {
    title: 'Test',
    header: { preset: 'brand-nav', variant: 'default', navigationVariant: 'default' },
    footer: { preset: 'simple', variant: 'default' }
  };

  it('applies theme defaults when values are at their defaults', () => {
    const result = applyVariantDefaultsToSiteSettings(baseSettings, 'theme-atlas');
    assert.equal(result.header.variant, 'line');
    assert.equal(result.header.navigationVariant, 'underline');
    assert.equal(result.footer.variant, 'contrast');
  });

  it('does not overwrite custom values without force', () => {
    const customSettings = {
      ...baseSettings,
      header: { ...baseSettings.header, variant: 'glass', navigationVariant: 'pill' },
      footer: { ...baseSettings.footer, variant: 'accent' }
    };

    const result = applyVariantDefaultsToSiteSettings(customSettings, 'theme-atlas');
    assert.equal(result.header.variant, 'glass');
    assert.equal(result.header.navigationVariant, 'pill');
    assert.equal(result.footer.variant, 'accent');
  });

  it('overwrites custom values with force: true', () => {
    const customSettings = {
      ...baseSettings,
      header: { ...baseSettings.header, variant: 'glass', navigationVariant: 'pill' },
      footer: { ...baseSettings.footer, variant: 'accent' }
    };

    const result = applyVariantDefaultsToSiteSettings(customSettings, 'theme-atlas', { force: true });
    assert.equal(result.header.variant, 'line');
    assert.equal(result.header.navigationVariant, 'underline');
    assert.equal(result.footer.variant, 'contrast');
  });

  it('preserves all other fields unchanged', () => {
    const result = applyVariantDefaultsToSiteSettings(baseSettings, 'theme-bloom');
    assert.equal(result.title, 'Test');
    assert.equal(result.header.preset, 'brand-nav');
    assert.equal(result.footer.preset, 'simple');
  });

  it('handles missing header/footer gracefully', () => {
    const minimal = { title: 'Minimal' };
    const result = applyVariantDefaultsToSiteSettings(minimal, 'theme-atlas');
    assert.equal(result.header.variant, 'line');
    assert.equal(result.footer.variant, 'contrast');
  });

  it('returns a new object, does not mutate input', () => {
    const input = { ...baseSettings, header: { ...baseSettings.header }, footer: { ...baseSettings.footer } };
    const result = applyVariantDefaultsToSiteSettings(input, 'theme-atlas');
    assert.notEqual(result, input);
    assert.notEqual(result.header, input.header);
    assert.equal(input.header.variant, 'default');
  });

  it('applies all-default for unknown theme', () => {
    const result = applyVariantDefaultsToSiteSettings(baseSettings, 'theme-unknown-xyz');
    assert.equal(result.header.variant, 'default');
    assert.equal(result.header.navigationVariant, 'default');
    assert.equal(result.footer.variant, 'default');
  });
});
