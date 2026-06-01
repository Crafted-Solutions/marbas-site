import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCssMode, getActiveCssAssets } from '../../src/theme/css-mode.js';

describe('getCssMode', () => {
  it('returns marbas when cssMode is marbas', () => {
    assert.equal(getCssMode({ cssMode: 'marbas' }), 'marbas');
  });

  it('returns external when cssMode is external', () => {
    assert.equal(getCssMode({ cssMode: 'external' }), 'external');
  });

  it('defaults to marbas when cssMode is missing', () => {
    assert.equal(getCssMode({}), 'marbas');
  });

  it('defaults to marbas when siteSettings is null', () => {
    assert.equal(getCssMode(null), 'marbas');
  });

  it('defaults to marbas for unknown value', () => {
    assert.equal(getCssMode({ cssMode: 'custom' }), 'marbas');
  });

  it('is case-insensitive', () => {
    assert.equal(getCssMode({ cssMode: 'EXTERNAL' }), 'external');
  });
});

describe('getActiveCssAssets', () => {
  it('returns empty array for external cssMode', () => {
    const assets = getActiveCssAssets({ cssMode: 'external' });
    assert.deepEqual(assets, []);
  });

  it('returns base.full.css and custom.bundle.css for marbas without theme', () => {
    const assets = getActiveCssAssets({ cssMode: 'marbas' });
    assert.ok(assets.includes('/_assets/css/base.full.css'));
    assert.ok(assets.some(a => a.includes('custom.bundle.css')));
    assert.equal(assets.filter(a => a.includes('theme-')).length, 0);
  });

  it('includes theme file when provided', () => {
    const assets = getActiveCssAssets({ cssMode: 'marbas', themeFile: 'theme-atlas.css' });
    assert.ok(assets.includes('/_assets/css/theme-atlas.css'));
  });

  it('theme file is between base.full.css and custom.bundle.css', () => {
    const assets = getActiveCssAssets({ cssMode: 'marbas', themeFile: 'theme-bloom.css' });
    const baseIdx = assets.indexOf('/_assets/css/base.full.css');
    const themeIdx = assets.indexOf('/_assets/css/theme-bloom.css');
    const bundleIdx = assets.findIndex(a => a.includes('custom.bundle.css'));
    assert.ok(baseIdx < themeIdx, 'base.full.css should come before theme');
    assert.ok(themeIdx < bundleIdx, 'theme should come before custom.bundle.css');
  });

  it('skips theme entry when themeFile is empty', () => {
    const assets = getActiveCssAssets({ cssMode: 'marbas', themeFile: '' });
    assert.equal(assets.filter(a => a.includes('theme-')).length, 0);
    assert.equal(assets.length, 2);
  });
});
