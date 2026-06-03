import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  BUILTIN_ENVIRONMENTS,
  normalizeMode,
  listEnvironments,
  isValidEnvironment,
  resolveEnvironment,
  getEnvironmentMode
} from '../../src/env/resolve.js';

function writeProject(dir, environments) {
  fs.writeFileSync(
    path.join(dir, 'marbas-project.json'),
    JSON.stringify({
      name: 'test',
      paths: { buildDir: './build' },
      defaultEnvironment: 'development',
      environments
    }, null, 2)
  );
}

describe('env/resolve', () => {
  let projectDir;
  let emptyDir;

  before(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-resolve-'));
    emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-resolve-empty-'));
    writeProject(projectDir, {
      development: { outputName: 'development', env: {} },
      production: { outputName: 'production', env: {} },
      foo: { outputName: 'foo', mode: 'production', env: { BASE_URL: 'https://foo' } },
      bar: { webpackConfig: 'production' },
      baz: {} // no mode → defaults to development
    });
  });

  after(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('built-ins are development and production', () => {
    assert.deepEqual(Object.keys(BUILTIN_ENVIRONMENTS).sort(), ['development', 'production']);
  });

  it('normalizeMode clamps to development | production with safe default', () => {
    assert.equal(normalizeMode('production'), 'production');
    assert.equal(normalizeMode('development'), 'development');
    assert.equal(normalizeMode('PRODUCTION'), 'production');
    assert.equal(normalizeMode('weird'), 'development');
    assert.equal(normalizeMode(undefined), 'development');
  });

  it('listEnvironments merges built-ins with config (de-duplicated, built-ins first)', () => {
    const envs = listEnvironments(projectDir);
    assert.deepEqual(envs.slice(0, 2), ['development', 'production']);
    assert.ok(envs.includes('foo'));
    assert.ok(envs.includes('bar'));
    assert.ok(envs.includes('baz'));
    // no duplicate development/production despite being in config
    assert.equal(envs.filter((e) => e === 'development').length, 1);
    assert.equal(envs.filter((e) => e === 'production').length, 1);
  });

  it('listEnvironments returns just built-ins without a project config', () => {
    assert.deepEqual(listEnvironments(emptyDir).sort(), ['development', 'production']);
  });

  it('isValidEnvironment is true for built-ins and custom, false otherwise', () => {
    assert.equal(isValidEnvironment('development', projectDir), true);
    assert.equal(isValidEnvironment('foo', projectDir), true);
    assert.equal(isValidEnvironment('nope', projectDir), false);
    // built-ins valid even without config
    assert.equal(isValidEnvironment('production', emptyDir), true);
    assert.equal(isValidEnvironment('foo', emptyDir), false);
  });

  it('resolveEnvironment reads mode from explicit field, webpackConfig alias, and defaults', () => {
    assert.equal(resolveEnvironment('foo', projectDir).mode, 'production');
    assert.equal(resolveEnvironment('bar', projectDir).mode, 'production'); // via webpackConfig alias
    assert.equal(resolveEnvironment('baz', projectDir).mode, 'development'); // default
    assert.equal(resolveEnvironment('development', projectDir).mode, 'development');
    assert.equal(resolveEnvironment('production', projectDir).mode, 'production');
  });

  it('resolveEnvironment exposes outputName, env and isBuiltin', () => {
    const foo = resolveEnvironment('foo', projectDir);
    assert.equal(foo.name, 'foo');
    assert.equal(foo.outputName, 'foo');
    assert.deepEqual(foo.env, { BASE_URL: 'https://foo' });
    assert.equal(foo.isBuiltin, false);
    assert.equal(resolveEnvironment('production', projectDir).isBuiltin, true);
  });

  it('resolveEnvironment throws with the available list for unknown env', () => {
    assert.throws(
      () => resolveEnvironment('ghost', projectDir),
      (err) => {
        assert.match(err.message, /Unknown environment "ghost"/);
        assert.match(err.message, /Available environments:/);
        assert.match(err.message, /foo/);
        return true;
      }
    );
  });

  it('getEnvironmentMode is a convenience over resolveEnvironment', () => {
    assert.equal(getEnvironmentMode('foo', projectDir), 'production');
    assert.equal(getEnvironmentMode('development', emptyDir), 'development');
  });
});
