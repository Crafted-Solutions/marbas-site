import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { getDefaultSiteSettings } from '../../src/site-settings/defaults.js';

const LIB_ROOT = path.resolve(import.meta.dirname, '..', '..');

test('default logo path points to a file shipped with the lib', () => {
  const { logo } = getDefaultSiteSettings('/tmp/demo');
  assert.equal(logo.path, '/_assets/images/Logo.svg');
  assert.ok(fs.existsSync(path.join(LIB_ROOT, logo.path)), `${logo.path} must exist in the package`);
});

test('legacy default Logo.png is still shipped for existing site.json files', () => {
  assert.ok(fs.existsSync(path.join(LIB_ROOT, '_assets', 'images', 'Logo.png')));
});
