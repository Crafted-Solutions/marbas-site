import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMANDS, COMMAND_MAP } from '../../src/cli/commands.js';
import { printGlobalHelp } from '../../src/cli/help.js';
import { _reset } from '../../src/plugin/registry.js';

function captureStdout(fn) {
  let out = '';
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (str) => { out += str; return true; };
  try { fn(); } finally { process.stdout.write = orig; }
  return out;
}

function withPluginCommand(cmd, fn) {
  const coreLen = COMMANDS.length;
  COMMANDS.push(cmd);
  COMMAND_MAP[cmd.name] = cmd;
  try { fn(); } finally {
    COMMANDS.splice(coreLen);
    delete COMMAND_MAP[cmd.name];
  }
}

test.beforeEach(() => _reset());

test('plugin command appears in global help with [plugin-name] label', () => {
  const pluginCmd = {
    name: 'my-cmd',
    description: 'Does something [@marbas/my-plugin]',
    usage: 'marbas my-cmd <path>',
    positionals: ['path'],
    flags: [],
    _plugin: '@marbas/my-plugin',
    run() {}
  };

  withPluginCommand(pluginCmd, () => {
    const output = captureStdout(() => printGlobalHelp('0.0.1'));
    assert.ok(output.includes('my-cmd'), 'help should list plugin command');
    assert.ok(output.includes('[@marbas/my-plugin]'), 'help should show plugin label');
  });
});

test('plugin command added to COMMAND_MAP is callable', () => {
  let called = false;
  const pluginCmd = {
    name: 'my-cmd2',
    description: 'Test cmd [@marbas/my-plugin]',
    usage: 'marbas my-cmd2',
    positionals: [],
    flags: [],
    _plugin: '@marbas/my-plugin',
    run() { called = true; }
  };

  withPluginCommand(pluginCmd, () => {
    const cmd = COMMAND_MAP['my-cmd2'];
    assert.ok(cmd, 'plugin command should be in COMMAND_MAP');
    cmd.run({});
    assert.ok(called, 'plugin command run() should be callable');
  });
});

test('core command count is unchanged after test isolation', () => {
  const coreCmds = [...COMMANDS];
  const pluginCmd = {
    name: 'temp-cmd',
    description: 'Temporary [test-plugin]',
    usage: 'marbas temp-cmd',
    positionals: [],
    flags: [],
    _plugin: 'test-plugin',
    run() {}
  };

  withPluginCommand(pluginCmd, () => {
    assert.equal(COMMANDS.length, coreCmds.length + 1);
  });

  assert.equal(COMMANDS.length, coreCmds.length, 'COMMANDS should be restored after test');
});
