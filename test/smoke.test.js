import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as marbasSite from '../src/index.js';

const HIGH_LEVEL_API = ['build', 'preview', 'deploy', 'init', 'eject', 'reset', 'doctor'];

describe('marbas-site exports', () => {
  it('exports all High-Level-API functions', () => {
    for (const name of HIGH_LEVEL_API) {
      assert.equal(typeof marbasSite[name], 'function', `expected ${name} to be a function`);
    }
  });

  it('exports low-level engine symbols', () => {
    const expected = ['BuildHandler', 'PreviewServer', 'SimpleFTPDeployer', 'loadEnvForEnvironment', 'parseEnvFile'];
    for (const name of expected) {
      assert.ok(name in marbasSite, `expected ${name} to be exported`);
    }
  });
});
