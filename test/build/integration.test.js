import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG_MAP } from '../../src/build/webpack/config-loader.js';
import { getBaseConfig, getWebpackCacheConfig, getStatsConfig, getStaticAssetCopyPatterns, getFaviconCopyConfig } from '../../src/build/webpack/base.js';

test('CONFIG_MAP — has all four environment entries', () => {
  assert.ok('development' in CONFIG_MAP);
  assert.ok('local_test' in CONFIG_MAP);
  assert.ok('staging' in CONFIG_MAP);
  assert.ok('production' in CONFIG_MAP);
});

test('CONFIG_MAP — all entries are file:// URLs pointing to existing files', async () => {
  const { fileURLToPath } = await import('url');
  const { existsSync } = await import('fs');

  for (const [env, url] of Object.entries(CONFIG_MAP)) {
    const filePath = fileURLToPath(url);
    assert.ok(existsSync(filePath), `Config file missing for ${env}: ${filePath}`);
  }
});

test('getBaseConfig — returns valid webpack config structure', () => {
  const config = getBaseConfig({
    mode: 'development',
    devtool: 'source-map',
    outputPath: '/tmp/test-output/_assets',
    environment: 'development',
    enableSourceMaps: true
  });

  assert.equal(config.mode, 'development');
  assert.equal(config.devtool, 'source-map');
  assert.ok(typeof config.entry === 'object');
  assert.ok('main' in config.entry);
  assert.ok('custom' in config.entry);
  assert.ok(typeof config.output === 'object');
  assert.ok(Array.isArray(config.module.rules));
  assert.ok(Array.isArray(config.plugins));
});

test('getBaseConfig — output path is resolved from provided outputPath', () => {
  const config = getBaseConfig({ outputPath: '/my/project/build/public_development/_assets' });
  assert.equal(config.output.path, '/my/project/build/public_development/_assets');
});

test('getWebpackCacheConfig — returns false when MARBAS_DISABLE_WEBPACK_CACHE=1', () => {
  const prev = process.env.MARBAS_DISABLE_WEBPACK_CACHE;
  process.env.MARBAS_DISABLE_WEBPACK_CACHE = '1';
  assert.equal(getWebpackCacheConfig('file://test.js'), false);
  if (prev === undefined) {
    delete process.env.MARBAS_DISABLE_WEBPACK_CACHE;
  } else {
    process.env.MARBAS_DISABLE_WEBPACK_CACHE = prev;
  }
});

test('getWebpackCacheConfig — returns filesystem config normally', () => {
  const prev = process.env.MARBAS_DISABLE_WEBPACK_CACHE;
  delete process.env.MARBAS_DISABLE_WEBPACK_CACHE;
  const config = getWebpackCacheConfig('file://test.js');
  if (config !== false) {
    assert.equal(config.type, 'filesystem');
  }
  if (prev !== undefined) {
    process.env.MARBAS_DISABLE_WEBPACK_CACHE = prev;
  }
});

test('getStatsConfig — returns valid stats string', () => {
  const result = getStatsConfig();
  const valid = ['errors-only', 'minimal', 'normal', 'verbose'];
  assert.ok(valid.includes(result), `Expected one of ${valid.join(', ')}, got ${result}`);
});

test('getStaticAssetCopyPatterns — returns array with image/font/favicon entries', () => {
  const patterns = getStaticAssetCopyPatterns('/tmp/project/build/public_development', '/tmp/project');
  assert.ok(Array.isArray(patterns));
  assert.equal(patterns.length, 3);
  assert.ok(patterns.some((p) => String(p.from).includes('images')));
  assert.ok(patterns.some((p) => String(p.from).includes('fonts')));
  assert.ok(patterns.some((p) => String(p.from).includes('favicons')));
});

test('getFaviconCopyConfig — returns object with from/to/noErrorOnMissing', () => {
  const config = getFaviconCopyConfig('/tmp/project/build/public_development', '/tmp/project');
  assert.ok(String(config.from).includes('favicons'));
  assert.equal(config.to, '/tmp/project/build/public_development');
  assert.equal(config.noErrorOnMissing, true);
});
