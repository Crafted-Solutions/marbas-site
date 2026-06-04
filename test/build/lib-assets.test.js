import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { addLibAssetsPassthrough } from '../../src/eleventy/passthrough.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIB_ROOT = path.resolve(__dirname, '../..');

function mockEleventyConfig() {
  const patterns = {};
  return {
    addPassthroughCopy: (map) => Object.assign(patterns, map),
    get patterns() { return patterns; }
  };
}

test('addLibAssetsPassthrough registers base CSS files, JS _lib and images patterns', () => {
  const cfg = mockEleventyConfig();
  addLibAssetsPassthrough(cfg, { libRoot: LIB_ROOT });

  const keys = Object.keys(cfg.patterns);
  assert.equal(keys.length, 4, 'Should register exactly 4 passthrough patterns');

  const cssKey = keys.find((k) => k.endsWith('base.full.css'));
  const cssMinKey = keys.find((k) => k.endsWith('base.full.min.css'));
  const jsKey = keys.find((k) => k.includes('js/_lib'));
  const imgKey = keys.find((k) => k.endsWith('_assets/images'));
  assert.ok(cssKey, 'Should have a base.full.css pattern');
  assert.ok(cssMinKey, 'Should have a base.full.min.css pattern');
  assert.ok(jsKey, 'Should have a JS _lib pattern');
  assert.ok(imgKey, 'Should have an images pattern');
  assert.equal(cfg.patterns[cssKey], '_assets/css/base.full.css');
  assert.equal(cfg.patterns[cssMinKey], '_assets/css/base.full.min.css');
  assert.equal(cfg.patterns[jsKey], '_assets/js/_lib');
  assert.equal(cfg.patterns[imgKey], '_assets/images');
});

test('addLibAssetsPassthrough uses absolute source path for CSS', () => {
  const cfg = mockEleventyConfig();
  addLibAssetsPassthrough(cfg, { libRoot: LIB_ROOT });

  const cssKey = Object.keys(cfg.patterns).find((k) => k.endsWith('base.full.css'));
  assert.ok(path.isAbsolute(cssKey), 'CSS source path must be absolute');
  assert.ok(fs.existsSync(cssKey), `base.full.css source file must exist: ${cssKey}`);
});

test('addLibAssetsPassthrough uses absolute source path for JS', () => {
  const cfg = mockEleventyConfig();
  addLibAssetsPassthrough(cfg, { libRoot: LIB_ROOT });

  const jsKey = Object.keys(cfg.patterns).find((k) => k.includes('js/_lib'));
  assert.ok(path.isAbsolute(jsKey), 'JS source path must be absolute');
  assert.ok(fs.existsSync(jsKey), `JS _lib source directory must exist: ${jsKey}`);
});

test('base.full.css exists and is non-empty in lib source', () => {
  const cssFile = path.join(LIB_ROOT, '_assets/css/base.full.css');
  assert.ok(fs.existsSync(cssFile), `base.full.css should exist at ${cssFile}`);
  const content = fs.readFileSync(cssFile, 'utf8');
  assert.ok(content.length > 0, 'base.full.css should not be empty');
});

test('full.js exists and is non-empty in lib source', () => {
  const jsFile = path.join(LIB_ROOT, '_assets/js/_lib/full.js');
  assert.ok(fs.existsSync(jsFile), `full.js should exist at ${jsFile}`);
  const content = fs.readFileSync(jsFile, 'utf8');
  assert.ok(content.length > 0, 'full.js should not be empty');
});

test('addLibAssetsPassthrough works with default libRoot', () => {
  const cfg = mockEleventyConfig();
  addLibAssetsPassthrough(cfg);

  const keys = Object.keys(cfg.patterns);
  assert.equal(keys.length, 4, 'Should register 4 patterns with default libRoot');
  assert.ok(keys.every((k) => path.isAbsolute(k)), 'All keys should be absolute');
});
