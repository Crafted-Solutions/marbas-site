import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSiteSettings } from '../../src/site-settings/normalize.js';

describe('validateSiteSettings', () => {
  it('returns empty array for fully valid settings', () => {
    const errors = validateSiteSettings({
      title: 'My Website',
      seo: {
        defaultImage: { src: '/og.jpg', alt: 'Website thumbnail' }
      }
    });
    assert.deepEqual(errors, []);
  });

  it('returns error when title is empty string', () => {
    const errors = validateSiteSettings({ title: '' });
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.toLowerCase().includes('titel')));
  });

  it('returns error when title is missing', () => {
    const errors = validateSiteSettings({});
    assert.ok(errors.length > 0);
  });

  it('returns error when title is whitespace only', () => {
    const errors = validateSiteSettings({ title: '   ' });
    assert.ok(errors.length > 0);
  });

  it('errors when defaultImage has alt but no src', () => {
    const errors = validateSiteSettings({
      title: 'Site',
      seo: { defaultImage: { alt: 'An image', src: '' } }
    });
    assert.ok(errors.some(e => e.includes('Alt-Text')));
  });

  it('passes when defaultImage has both alt and src', () => {
    const errors = validateSiteSettings({
      title: 'Site',
      seo: { defaultImage: { alt: 'An image', src: '/img.jpg' } }
    });
    assert.deepEqual(errors, []);
  });

  it('passes when defaultImage has no alt and no src', () => {
    const errors = validateSiteSettings({
      title: 'Site',
      seo: { defaultImage: { alt: '', src: '' } }
    });
    assert.deepEqual(errors, []);
  });

  it('passes when seo is undefined', () => {
    const errors = validateSiteSettings({ title: 'Site' });
    assert.deepEqual(errors, []);
  });

  it('can accumulate multiple errors', () => {
    const errors = validateSiteSettings({
      title: '',
      seo: { defaultImage: { alt: 'No src', src: '' } }
    });
    assert.ok(errors.length >= 2);
  });
});
