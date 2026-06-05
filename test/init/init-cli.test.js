import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-init-cli-'));
}

function runInit(args) {
  return spawnSync(process.execPath, [BIN, 'init', ...args], { encoding: 'utf8' });
}

test('marbas-site init creates project via CLI', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'cli-proj');

  const result = runInit([projectPath]);

  assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  assert.ok(result.stdout.includes(projectPath));
  assert.ok(fs.existsSync(path.join(projectPath, 'marbas-project.json')));
  assert.ok(fs.existsSync(path.join(projectPath, 'pages', 'index.md')));

  fs.rmSync(tmp, { recursive: true });
});

test('marbas-site init passes --name flag', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'named-proj');

  const result = runInit([projectPath, '--name=My CLI Site']);

  assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
  assert.equal(config.name, 'My CLI Site');

  fs.rmSync(tmp, { recursive: true });
});

test('marbas-site init passes --env flag', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'env-proj');

  const result = runInit([projectPath, '--env=production']);

  assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
  assert.equal(config.defaultEnvironment, 'production');
  assert.ok(config.environments.production);

  fs.rmSync(tmp, { recursive: true });
});

test('marbas-site init exits with error when already a Marbas project', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'dupe');
  fs.mkdirSync(projectPath);
  // Guard triggers on an existing marbas-project.json, not on a mere directory.
  fs.writeFileSync(path.join(projectPath, 'marbas-project.json'), '{}');

  const result = runInit([projectPath]);

  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('already exists'));

  fs.rmSync(tmp, { recursive: true });
});

test('marbas-site init --force overwrites existing directory', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'force-proj');
  fs.mkdirSync(projectPath);

  const result = runInit([projectPath, '--force']);

  assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  assert.ok(fs.existsSync(path.join(projectPath, 'marbas-project.json')));

  fs.rmSync(tmp, { recursive: true });
});

test('marbas-site init without path exits with error', () => {
  const result = spawnSync(process.execPath, [BIN, 'init'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('Usage'));
});
