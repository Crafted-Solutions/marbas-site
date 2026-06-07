import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runEnvAdd, runEnvRemove } from '../../src/cli/run/env.js';

function writeProject(dir, overrides = {}) {
  const config = {
    name: 'test',
    paths: { buildDir: './build' },
    defaultEnvironment: 'development',
    environments: {
      development: { outputName: 'development', env: {} },
      production:  { outputName: 'production',  env: {} }
    },
    theme: { id: null, cssMode: 'marbas', languageSwitcher: true },
    rendering: { footerMode: 'globalData', headerMode: 'globalData' },
    ...overrides
  };
  fs.writeFileSync(path.join(dir, 'marbas-project.json'), JSON.stringify(config, null, 2) + '\n');
}

function readConfig(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'marbas-project.json'), 'utf8'));
}

// Capture process.exit + stderr/stdout without actually exiting
function withExitTrap(fn) {
  const originalExit = process.exit;
  const originalStdErr = process.stderr.write.bind(process.stderr);
  const originalStdOut = process.stdout.write.bind(process.stdout);
  const errors = [];
  const output = [];
  let exitCode = null;

  process.exit = (code) => { exitCode = code ?? 0; throw new Error(`__exit_${code}`); };
  process.stderr.write = (msg) => { errors.push(msg); };
  process.stdout.write = (msg) => { output.push(msg); };

  try {
    fn();
  } catch (e) {
    if (!e.message.startsWith('__exit_')) throw e;
  } finally {
    process.exit = originalExit;
    process.stderr.write = originalStdErr;
    process.stdout.write = originalStdOut;
  }

  return { exitCode, errors: errors.join(''), output: output.join('') };
}

describe('env add/remove', () => {
  let dir;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-env-'));
    writeProject(dir);
  });

  after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  // ── add ────────────────────────────────────────────────────────────────

  it('adds a new environment with default mode', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'staging', flags: {} }));
    assert.equal(r.exitCode, null);
    const cfg = readConfig(dir);
    assert.ok(cfg.environments.staging);
    assert.equal(cfg.environments.staging.outputName, 'staging');
    assert.equal(cfg.environments.staging.mode, 'development');
  });

  it('adds a new environment with explicit production mode', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'live', flags: { mode: 'production' } }));
    assert.equal(r.exitCode, null);
    const cfg = readConfig(dir);
    assert.equal(cfg.environments.live.mode, 'production');
  });

  it('adds a new environment with custom output name', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'qa', flags: { output: 'qa_build' } }));
    assert.equal(r.exitCode, null);
    const cfg = readConfig(dir);
    assert.equal(cfg.environments.qa.outputName, 'qa_build');
  });

  it('rejects built-in key "development"', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'development', flags: {} }));
    assert.equal(r.exitCode, 1);
    assert.ok(r.errors.includes('built-in'));
  });

  it('rejects built-in key "production"', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'production', flags: {} }));
    assert.equal(r.exitCode, 1);
    assert.ok(r.errors.includes('built-in'));
  });

  it('rejects duplicate key', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'staging', flags: {} }));
    assert.equal(r.exitCode, 1);
    assert.ok(r.errors.includes('already exists'));
  });

  it('rejects invalid key with uppercase letters', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'My-Env', flags: {} }));
    assert.equal(r.exitCode, 1);
    assert.ok(r.errors.includes('Invalid'));
  });

  it('rejects invalid key with hyphens', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'my-env', flags: {} }));
    assert.equal(r.exitCode, 1);
    assert.ok(r.errors.includes('Invalid'));
  });

  // ── remove ─────────────────────────────────────────────────────────────

  it('removes an existing custom environment', () => {
    const r = withExitTrap(() => runEnvRemove({ projectPath: dir, key: 'live' }));
    assert.equal(r.exitCode, null);
    const cfg = readConfig(dir);
    assert.equal(cfg.environments.live, undefined);
  });

  it('rejects removing built-in "development"', () => {
    const r = withExitTrap(() => runEnvRemove({ projectPath: dir, key: 'development' }));
    assert.equal(r.exitCode, 1);
    assert.ok(r.errors.includes('built-in'));
  });

  it('rejects removing built-in "production"', () => {
    const r = withExitTrap(() => runEnvRemove({ projectPath: dir, key: 'production' }));
    assert.equal(r.exitCode, 1);
    assert.ok(r.errors.includes('built-in'));
  });

  it('rejects removing non-existent environment', () => {
    const r = withExitTrap(() => runEnvRemove({ projectPath: dir, key: 'nonexistent' }));
    assert.equal(r.exitCode, 1);
    assert.ok(r.errors.includes('does not exist'));
  });

  it('rejects --output= (empty value) and falls back to key as outputName', () => {
    const r = withExitTrap(() => runEnvAdd({ projectPath: dir, key: 'emptyout', flags: { output: '' } }));
    assert.equal(r.exitCode, null);
    const cfg = readConfig(dir);
    assert.equal(cfg.environments.emptyout.outputName, 'emptyout');
  });

  it('rejects removing the only remaining custom environment', () => {
    const dir3 = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-env-only-'));
    writeProject(dir3, {
      defaultEnvironment: 'staging',
      environments: {
        staging: { outputName: 'staging', mode: 'production', env: {} }
      }
    });
    try {
      const r = withExitTrap(() => runEnvRemove({ projectPath: dir3, key: 'staging' }));
      assert.equal(r.exitCode, 1);
      assert.ok(r.errors.includes('only environment'));
    } finally {
      fs.rmSync(dir3, { recursive: true, force: true });
    }
  });

  it('resets defaultEnvironment to development when removed env was default', () => {
    // Write fresh project with custom default
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-env-default-'));
    writeProject(dir2, {
      defaultEnvironment: 'staging',
      environments: {
        development: { outputName: 'development', env: {} },
        production:  { outputName: 'production',  env: {} },
        staging:     { outputName: 'staging', mode: 'production', env: {} }
      }
    });
    try {
      const r = withExitTrap(() => runEnvRemove({ projectPath: dir2, key: 'staging' }));
      assert.equal(r.exitCode, null);
      assert.ok(r.output.includes('reset to "development"'));
      const cfg = readConfig(dir2);
      assert.equal(cfg.defaultEnvironment, 'development');
      assert.equal(cfg.environments.staging, undefined);
    } finally {
      fs.rmSync(dir2, { recursive: true, force: true });
    }
  });
});
