import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initProject } from '../../src/init/index.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-init-'));
}

test('initProject throws when directory exists without --force', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'existing');
  fs.mkdirSync(projectPath);

  assert.throws(
    () => initProject({ projectPath }),
    (err) => {
      assert.ok(err.message.includes('already exists'));
      assert.ok(err.message.includes('--force'));
      return true;
    }
  );

  fs.rmSync(tmp, { recursive: true });
});

test('initProject overwrites existing directory with --force', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'existing');
  fs.mkdirSync(projectPath);
  fs.writeFileSync(path.join(projectPath, 'stale.txt'), 'old');

  assert.doesNotThrow(() => initProject({ projectPath, force: true }));

  assert.ok(fs.existsSync(path.join(projectPath, 'marbas-project.json')));
  assert.ok(fs.existsSync(path.join(projectPath, 'pages', 'index.md')));

  fs.rmSync(tmp, { recursive: true });
});

test('initProject with --force preserves existing files not in scaffold', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'existing');
  fs.mkdirSync(projectPath);
  fs.writeFileSync(path.join(projectPath, 'custom.txt'), 'keep me');

  initProject({ projectPath, force: true });

  assert.ok(fs.existsSync(path.join(projectPath, 'custom.txt')));

  fs.rmSync(tmp, { recursive: true });
});
