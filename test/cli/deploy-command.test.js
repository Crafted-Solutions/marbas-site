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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-deploy-'));
}

test('marbas-site deploy exits 1 when no deploy targets configured', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'proj');

  spawnSync(process.execPath, [BIN, 'init', projectPath], { encoding: 'utf8' });

  const result = spawnSync(
    process.execPath,
    [BIN, 'deploy', projectPath, '--env=development'],
    { encoding: 'utf8' }
  );

  assert.equal(result.status, 1);
  assert.ok(
    result.stderr.includes('no deploy targets') || result.stderr.includes('deployTargets'),
    `Expected clear error message, got: ${result.stderr}`
  );

  fs.rmSync(tmp, { recursive: true });
});

test('marbas-site deploy exits 1 without path', () => {
  const result = spawnSync(process.execPath, [BIN, 'deploy'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('Usage'));
});
