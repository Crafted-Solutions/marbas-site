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
