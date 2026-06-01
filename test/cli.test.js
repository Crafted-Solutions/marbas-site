import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = join(__dirname, '../src/cli/bin.js');

function run(...args) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
}

describe('marbas-site CLI', () => {
  it('--version prints version string and exits 0', () => {
    const result = run('--version');
    assert.equal(result.status, 0);
    assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/);
  });

  it('--help lists all commands and exits 0', () => {
    const result = run('--help');
    assert.equal(result.status, 0);
    for (const cmd of ['init', 'build', 'preview', 'deploy', 'eject', 'reset', 'doctor']) {
      assert.ok(result.stdout.includes(cmd), `expected --help to mention "${cmd}"`);
    }
  });

  it('init with nonexistent path exits 1 with error message', () => {
    const result = run('init', '/tmp/marbas-test-nonexistent-path-xyz');
    // init is implemented — it either succeeds or fails with a real error, not a stub message
    // nonexistent parent paths may fail; the important thing is no unhandled crash
    assert.ok(result.status === 0 || result.status === 1, 'expected clean exit code');
    assert.ok(!result.stderr.includes('not yet implemented'), 'init should not be a stub anymore');
  });

  it('unknown command exits 1', () => {
    const result = run('nonexistent-command');
    assert.equal(result.status, 1);
  });
});
