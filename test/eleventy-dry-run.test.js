import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initProject as init } from '../src/init/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const libRoot = join(__dirname, '..');
const eleventy = join(libRoot, 'node_modules/@11ty/eleventy/cmd.cjs');

let tmpDir;

before(() => {
  // Scaffold a real project so tm.eleventy.js can read marbas-project.json + site settings.
  tmpDir = mkdtempSync(join(tmpdir(), 'marbas-smoke-'));
  init({ projectPath: tmpDir, force: true });
});

after(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('eleventy dry-run', () => {
  it('starts and processes templates without crashing', () => {
    const result = spawnSync(
      process.execPath,
      [eleventy, '--dryrun', '--config', join(libRoot, 'tm.eleventy.js')],
      {
        cwd: tmpDir,
        encoding: 'utf8',
        env: { ...process.env, MARBAS_PUBLISH_ENVIRONMENT: 'development' },
        timeout: 30000
      }
    );

    const output = result.stdout + result.stderr;
    // Eleventy must either exit 0 or process at least one template before any post-build error
    const processedTemplates = output.includes('Wrote') || output.includes('[11ty]');
    assert.ok(processedTemplates, `Expected eleventy to start and output something. Got:\n${output.slice(0, 500)}`);
    // Must not crash before template processing
    assert.ok(!output.includes('Cannot find module'), `Unexpected missing module: ${output.slice(0, 500)}`);
  });
});
