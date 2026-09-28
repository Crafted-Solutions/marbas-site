import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgv } from '../../src/cli/argv.js';

test('parseArgv — empty args', () => {
  const r = parseArgv([]);
  assert.equal(r.command, null);
  assert.equal(r.projectPath, null);
  assert.deepEqual(r.extras, []);
  assert.deepEqual(r.flags, {});
});

test('parseArgv — command only', () => {
  const r = parseArgv(['build']);
  assert.equal(r.command, 'build');
  assert.equal(r.projectPath, null);
});

test('parseArgv — command + projectPath', () => {
  const r = parseArgv(['build', '/my/project']);
  assert.equal(r.command, 'build');
  assert.equal(r.projectPath, '/my/project');
  assert.deepEqual(r.extras, []);
});

test('parseArgv — command + projectPath + extra positional', () => {
  const r = parseArgv(['eject', '/my/project', '_components/Nav/Nav.njk']);
  assert.equal(r.command, 'eject');
  assert.equal(r.projectPath, '/my/project');
  assert.deepEqual(r.extras, ['_components/Nav/Nav.njk']);
});

test('parseArgv — flag with =value', () => {
  const r = parseArgv(['build', '/p', '--env=production']);
  assert.equal(r.flags.env, 'production');
});

test('parseArgv — flag without value → true', () => {
  const r = parseArgv(['reset', '/p', 'file', '--force']);
  assert.equal(r.flags.force, true);
});

test('parseArgv — --help flag', () => {
  const r = parseArgv(['--help']);
  assert.equal(r.flags.help, true);
  assert.equal(r.command, null);
});

test('parseArgv — -h short flag', () => {
  const r = parseArgv(['-h']);
  assert.equal(r.flags.h, true);
});

test('parseArgv — --version flag', () => {
  const r = parseArgv(['--version']);
  assert.equal(r.flags.version, true);
});

test('parseArgv — multiple flags', () => {
  const r = parseArgv(['build', '/p', '--env=staging', '--force', '--log-level=verbose']);
  assert.equal(r.flags.env, 'staging');
  assert.equal(r.flags.force, true);
  assert.equal(r.flags['log-level'], 'verbose');
});

test('parseArgv — flags intermixed with positionals', () => {
  const r = parseArgv(['--env=dev', 'build', '/p']);
  assert.equal(r.command, 'build');
  assert.equal(r.projectPath, '/p');
  assert.equal(r.flags.env, 'dev');
});

// ─── value flags: `--flag value` (Task 119) ───────────────────────────────
const VALUE_FLAGS = ['name', 'lang', 'env', 'port'];

test('parseArgv — value flag with space-separated value', () => {
  const r = parseArgv(['init', '/p', '--name', 'Praxis Nord', '--lang', 'en'], { valueFlags: VALUE_FLAGS });
  assert.equal(r.flags.name, 'Praxis Nord');
  assert.equal(r.flags.lang, 'en');
  assert.equal(r.projectPath, '/p');
  assert.deepEqual(r.extras, []);
  assert.deepEqual(r.errors, []);
});

test('parseArgv — both forms mixed', () => {
  const r = parseArgv(['preview', '/p', '--env=staging', '--port', '3005'], { valueFlags: VALUE_FLAGS });
  assert.equal(r.flags.env, 'staging');
  assert.equal(r.flags.port, '3005');
});

test('parseArgv — value flag before positionals consumes only its value', () => {
  const r = parseArgv(['--env', 'dev', 'build', '/p'], { valueFlags: VALUE_FLAGS });
  assert.equal(r.flags.env, 'dev');
  assert.equal(r.command, 'build');
  assert.equal(r.projectPath, '/p');
});

test('parseArgv — value flag without value (last arg) is an error, not true', () => {
  const r = parseArgv(['init', '/p', '--name'], { valueFlags: VALUE_FLAGS });
  assert.equal(r.flags.name, undefined);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /--name expects a value/);
});

test('parseArgv — value flag followed by another flag is an error', () => {
  const r = parseArgv(['init', '/p', '--name', '--force'], { valueFlags: VALUE_FLAGS });
  assert.equal(r.flags.name, undefined);
  assert.equal(r.flags.force, true);
  assert.equal(r.errors.length, 1);
});

test('parseArgv — switches never consume the next argument', () => {
  const r = parseArgv(['init', '--force', '/p', '--starter'], { valueFlags: VALUE_FLAGS });
  assert.equal(r.flags.force, true);
  assert.equal(r.flags.starter, true);
  assert.equal(r.projectPath, '/p');
});

test('parseArgv — without valueFlags the old behaviour stays (backwards compatible)', () => {
  const r = parseArgv(['init', '/p', '--name', 'X']);
  assert.equal(r.flags.name, true);
  assert.deepEqual(r.extras, ['X']);
});

test('collectValueFlags — derives value flags from command definitions', async () => {
  const { collectValueFlags } = await import('../../src/cli/argv.js');
  const { COMMANDS } = await import('../../src/cli/commands.js');
  const names = collectValueFlags(COMMANDS);
  for (const n of ['name', 'description', 'lang', 'theme', 'env', 'port', 'log-level', 'mode', 'output']) {
    assert.ok(names.includes(n), `${n} fehlt`);
  }
  for (const s of ['force', 'starter', 'quiet', 'json', 'no-color']) assert.ok(!names.includes(s), `${s} ist ein Schalter`);
});
