import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerCommand,
  registerAudit,
  registerWorkflow,
  listCommands,
  listAudits,
  listWorkflows,
  listExtensions,
  _setCurrentSource,
  _reset
} from '../../src/plugin/registry.js';

test.beforeEach(() => _reset());

test('registerCommand stores command and listCommands returns it', () => {
  _setCurrentSource('test-plugin');
  registerCommand({ name: 'greet', description: 'Say hello', run() {} });
  const cmds = listCommands();
  assert.equal(cmds.length, 1);
  assert.equal(cmds[0].name, 'greet');
  assert.equal(cmds[0].description, 'Say hello');
  assert.equal(cmds[0]._plugin, 'test-plugin');
});

test('registerAudit stores audit and listAudits returns it', () => {
  _setCurrentSource('test-plugin');
  registerAudit({ name: 'check-links', run() {} });
  const audits = listAudits();
  assert.equal(audits.length, 1);
  assert.equal(audits[0].name, 'check-links');
});

test('registerWorkflow stores workflow and listWorkflows returns it', () => {
  _setCurrentSource('test-plugin');
  registerWorkflow({ name: 'deploy-flow', steps: ['build', 'deploy'] });
  const wfs = listWorkflows();
  assert.equal(wfs.length, 1);
  assert.equal(wfs[0].name, 'deploy-flow');
  assert.deepEqual(wfs[0].steps, ['build', 'deploy']);
});

test('duplicate command registration throws with both plugin sources in message', () => {
  _setCurrentSource('@marbas/plugin-a');
  registerCommand({ name: 'greet', description: 'First', run() {} });

  _setCurrentSource('@marbas/plugin-b');
  assert.throws(
    () => registerCommand({ name: 'greet', description: 'Second', run() {} }),
    (err) => {
      assert.ok(err.message.includes('@marbas/plugin-a'), 'message should name first plugin');
      assert.ok(err.message.includes('@marbas/plugin-b'), 'message should name second plugin');
      assert.ok(err.message.includes('greet'), 'message should include command name');
      return true;
    }
  );
});

test('duplicate audit registration throws with both plugin sources', () => {
  _setCurrentSource('@marbas/plugin-a');
  registerAudit({ name: 'check', run() {} });

  _setCurrentSource('@marbas/plugin-b');
  assert.throws(
    () => registerAudit({ name: 'check', run() {} }),
    (err) => {
      assert.ok(err.message.includes('@marbas/plugin-a'));
      assert.ok(err.message.includes('@marbas/plugin-b'));
      return true;
    }
  );
});

test('duplicate workflow registration throws with both plugin sources', () => {
  _setCurrentSource('@marbas/plugin-a');
  registerWorkflow({ name: 'flow', steps: [] });

  _setCurrentSource('@marbas/plugin-b');
  assert.throws(
    () => registerWorkflow({ name: 'flow', steps: [] }),
    (err) => {
      assert.ok(err.message.includes('@marbas/plugin-a'));
      assert.ok(err.message.includes('@marbas/plugin-b'));
      return true;
    }
  );
});

test('listCommands returns a snapshot, not a live reference', () => {
  _setCurrentSource('test-plugin');
  registerCommand({ name: 'cmd1', description: 'First', run() {} });
  const snap = listCommands();
  registerCommand({ name: 'cmd2', description: 'Second', run() {} });
  assert.equal(snap.length, 1, 'snapshot should not include later additions');
  assert.equal(listCommands().length, 2);
});

test('_reset clears all registries', () => {
  _setCurrentSource('test-plugin');
  registerCommand({ name: 'cmd', description: 'x', run() {} });
  registerAudit({ name: 'audit', run() {} });
  registerWorkflow({ name: 'flow', steps: [] });
  _reset();
  assert.equal(listCommands().length, 0);
  assert.equal(listAudits().length, 0);
  assert.equal(listWorkflows().length, 0);
  assert.equal(listExtensions().length, 0);
});
