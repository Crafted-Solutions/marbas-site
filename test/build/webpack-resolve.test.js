import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveWebpackConfigPath } from '../../src/build/webpack/resolve-config.js';

const __filename = fileURLToPath(import.meta.url);
const LIB_ROOT = path.resolve(path.dirname(__filename), '../..');

describe('resolveWebpackConfigPath', () => {
  let projectDir;

  before(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-wpresolve-'));
    fs.writeFileSync(
      path.join(projectDir, 'marbas-project.json'),
      JSON.stringify({
        name: 'test',
        paths: { buildDir: './build' },
        defaultEnvironment: 'development',
        environments: {
          development: { outputName: 'development' },
          production: { outputName: 'production' },
          foo: { mode: 'production' },
          bar: { mode: 'development' },
          baz: {}
        }
      }, null, 2)
    );
  });

  after(() => fs.rmSync(projectDir, { recursive: true, force: true }));

  it('uses the env-specific file when it exists (development)', () => {
    const p = resolveWebpackConfigPath({ libRoot: LIB_ROOT, projectRoot: projectDir, environment: 'development' });
    assert.equal(path.basename(p), 'development.js');
    assert.ok(fs.existsSync(p));
  });

  it('uses the env-specific file when it exists (production)', () => {
    const p = resolveWebpackConfigPath({ libRoot: LIB_ROOT, projectRoot: projectDir, environment: 'production' });
    assert.equal(path.basename(p), 'production.js');
    assert.ok(fs.existsSync(p));
  });

  it('falls back to production base for a custom prod-mode env', () => {
    const p = resolveWebpackConfigPath({ libRoot: LIB_ROOT, projectRoot: projectDir, environment: 'foo' });
    assert.equal(path.basename(p), 'production.js');
    assert.ok(fs.existsSync(p));
  });

  it('falls back to development base for a custom dev-mode env', () => {
    const p = resolveWebpackConfigPath({ libRoot: LIB_ROOT, projectRoot: projectDir, environment: 'bar' });
    assert.equal(path.basename(p), 'development.js');
  });

  it('falls back to development base when custom env has no mode', () => {
    const p = resolveWebpackConfigPath({ libRoot: LIB_ROOT, projectRoot: projectDir, environment: 'baz' });
    assert.equal(path.basename(p), 'development.js');
  });

  it('legacy local_test / staging files no longer exist in the lib', () => {
    const webpackDir = path.join(LIB_ROOT, 'src', 'build', 'webpack');
    assert.ok(!fs.existsSync(path.join(webpackDir, 'local_test.js')));
    assert.ok(!fs.existsSync(path.join(webpackDir, 'staging.js')));
  });
});
