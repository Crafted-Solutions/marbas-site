import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMANDS } from '../../src/cli/commands.js';
import { printGlobalHelp, printCommandHelp } from '../../src/cli/help.js';

const EXPECTED_COMMANDS = ['init', 'build', 'preview', 'deploy', 'eject', 'reset', 'doctor', 'envs', 'theme'];

test('COMMANDS registry contains all 9 commands', () => {
  const names = COMMANDS.map((c) => c.name);
  for (const expected of EXPECTED_COMMANDS) {
    assert.ok(names.includes(expected), `Missing command: ${expected}`);
  }
  assert.equal(COMMANDS.length, 9);
});

test('each command has required fields', () => {
  for (const cmd of COMMANDS) {
    assert.ok(cmd.name, 'Missing name');
    assert.ok(cmd.description, `${cmd.name}: missing description`);
    assert.ok(cmd.usage, `${cmd.name}: missing usage`);
    assert.ok(Array.isArray(cmd.positionals), `${cmd.name}: positionals must be array`);
    assert.ok(Array.isArray(cmd.flags), `${cmd.name}: flags must be array`);
    assert.equal(typeof cmd.run, 'function', `${cmd.name}: run must be a function`);
  }
});

test('global help output contains all command names', () => {
  let output = '';
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (str) => { output += str; return true; };
  try {
    printGlobalHelp('0.0.1');
  } finally {
    process.stdout.write = orig;
  }

  for (const name of EXPECTED_COMMANDS) {
    assert.ok(output.includes(name), `Global help missing command: ${name}`);
  }
});

test('command help output contains usage and flags', () => {
  let output = '';
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (str) => { output += str; return true; };
  try {
    printCommandHelp('build');
  } finally {
    process.stdout.write = orig;
  }

  assert.ok(output.includes('marbas-site build'), 'Command help should include usage');
  assert.ok(output.includes('--env'), 'build help should mention --env flag');
});
