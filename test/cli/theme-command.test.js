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
const LIB_ROOT = path.resolve(__dirname, '../..');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-theme-cmd-'));
}

function makeProject(tmp, config = {}) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(projectPath, { recursive: true });
  fs.writeFileSync(
    path.join(projectPath, 'marbas-project.json'),
    JSON.stringify({ name: 'test', marbasSite: '1.0.0', environments: { development: {} }, ...config }, null, 2)
  );
  return projectPath;
}

test('marbas theme — sets theme.id in marbas-project.json', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp);

  const result = spawnSync(process.execPath, [BIN, 'theme', projectPath, 'theme-bloom'], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, `Expected exit 0, got ${result.status}:\n${result.stderr}`);
  assert.ok(result.stdout.includes('theme-bloom'));

  const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
  assert.equal(config.theme?.id, 'theme-bloom');

  fs.rmSync(tmp, { recursive: true });
});

test('marbas theme — unknown theme-id exits 1', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp);

  const result = spawnSync(process.execPath, [BIN, 'theme', projectPath, 'theme-doesnotexist'], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('theme-doesnotexist'));

  fs.rmSync(tmp, { recursive: true });
});

test('marbas theme — missing theme-id exits 1 with usage', () => {
  const result = spawnSync(process.execPath, [BIN, 'theme', '/some/path'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('Usage'));
});

test('marbas theme — preserves existing theme fields', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, { theme: { languageSwitcher: true } });

  const result = spawnSync(process.execPath, [BIN, 'theme', projectPath, 'theme-atlas'], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
  assert.equal(config.theme?.id, 'theme-atlas');
  assert.equal(config.theme?.languageSwitcher, true);

  fs.rmSync(tmp, { recursive: true });
});
