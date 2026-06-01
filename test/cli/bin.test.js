import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');

function run(...args) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });
}

test('--version prints version and exits 0', () => {
  const r = run('--version');
  assert.equal(r.status, 0);
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+/);
});

test('-v prints version and exits 0', () => {
  const r = run('-v');
  assert.equal(r.status, 0);
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+/);
});

test('--help prints global help and exits 0', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('init'), 'help should list init command');
  assert.ok(r.stdout.includes('build'), 'help should list build command');
  assert.ok(r.stdout.includes('doctor'), 'help should list doctor command');
});

test('no args prints global help and exits 0', () => {
  const r = run();
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('Usage'));
});

test('build --help prints command help and exits 0', () => {
  const r = run('build', '--help');
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('marbas-site build'));
  assert.ok(r.stdout.includes('--env'));
});

test('unknown command exits 1 with error message', () => {
  const r = run('foobar');
  assert.equal(r.status, 1);
  assert.ok(r.stderr.includes('Unknown command') || r.stderr.includes('foobar'));
});

test('init command exits cleanly (not a stub)', () => {
  const r = run('init', '/tmp/marbas-test-stub-check-xyz');
  assert.ok(r.status === 0 || r.status === 1, 'expected clean exit code');
  assert.ok(!r.stderr.includes('not yet implemented'), 'init should not be a stub');
});
