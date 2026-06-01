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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-build-'));
}

// Build test requires webpack + eleventy — allow up to 120s
test('marbas-site build creates output directory', { timeout: 120_000 }, () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'proj');

  // Init the project
  const initResult = spawnSync(process.execPath, [BIN, 'init', projectPath], { encoding: 'utf8' });
  assert.equal(initResult.status, 0, `init failed: ${initResult.stderr}`);

  // Build it
  const buildResult = spawnSync(
    process.execPath,
    [BIN, 'build', projectPath, '--env=development'],
    { encoding: 'utf8', timeout: 110_000 }
  );

  assert.equal(
    buildResult.status, 0,
    `build failed (exit ${buildResult.status}):\nstdout: ${buildResult.stdout}\nstderr: ${buildResult.stderr}`
  );

  const indexHtml = path.join(projectPath, 'build', 'public_development', 'index.html');
  assert.ok(fs.existsSync(indexHtml), `Expected ${indexHtml} to exist`);

  fs.rmSync(tmp, { recursive: true });
});

test('marbas-site build exits 1 without path', () => {
  const result = spawnSync(process.execPath, [BIN, 'build'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('Usage'));
});
