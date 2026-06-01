import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { readProjectConfig, listEnvironments, getEnvironment, writeProjectConfig } from '../../src/project/config.js';

let tmpDir;

function writeConfig(dir, obj) {
  fs.writeFileSync(path.join(dir, 'marbas-project.json'), JSON.stringify(obj, null, 2), 'utf8');
}

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-project-config-'));
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readProjectConfig', () => {
  it('reads a complete config', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'full-'));
    writeConfig(dir, {
      name: 'my-site',
      marbasSite: '1.0.0',
      paths: { buildDir: './dist' },
      environments: { development: {}, production: {} }
    });

    const config = readProjectConfig(dir);
    assert.equal(config.name, 'my-site');
    assert.equal(config.paths.buildDir, './dist');
    assert.ok('development' in config.environments);
  });

  it('applies default buildDir when missing', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'defaults-'));
    writeConfig(dir, {
      name: 'test',
      environments: { development: {} }
    });

    const config = readProjectConfig(dir);
    assert.equal(config.paths.buildDir, './build');
  });

  it('throws when marbas-project.json does not exist', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'missing-'));
    assert.throws(() => readProjectConfig(dir), /not found/i);
  });

  it('throws when config has no environments', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'no-env-'));
    writeConfig(dir, { name: 'test', environments: {} });
    assert.throws(() => readProjectConfig(dir), /environment/i);
  });

  it('throws when JSON is invalid', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'bad-json-'));
    fs.writeFileSync(path.join(dir, 'marbas-project.json'), '{ invalid json }', 'utf8');
    assert.throws(() => readProjectConfig(dir), /parse/i);
  });
});

describe('listEnvironments', () => {
  it('returns all environment names', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'list-'));
    writeConfig(dir, {
      environments: { development: {}, staging: {}, production: {} }
    });

    const envs = listEnvironments(dir);
    assert.deepEqual(envs.sort(), ['development', 'production', 'staging']);
  });
});

describe('getEnvironment', () => {
  it('returns the requested environment with its name', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'get-'));
    writeConfig(dir, {
      environments: { staging: { url: 'https://staging.example.com' } }
    });

    const env = getEnvironment(dir, 'staging');
    assert.equal(env.name, 'staging');
    assert.equal(env.url, 'https://staging.example.com');
  });

  it('throws when environment is not found', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'get-missing-'));
    writeConfig(dir, { environments: { development: {} } });

    assert.throws(() => getEnvironment(dir, 'nonexistent'), /not found/i);
  });
});

describe('writeProjectConfig', () => {
  it('writes and re-reads config correctly', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'write-'));
    const config = {
      name: 'written-site',
      marbasSite: '1.0.0',
      paths: { buildDir: './build' },
      environments: { production: {} }
    };

    writeProjectConfig(dir, config);
    const read = readProjectConfig(dir);
    assert.equal(read.name, 'written-site');
    assert.equal(read.paths.buildDir, './build');
  });
});
