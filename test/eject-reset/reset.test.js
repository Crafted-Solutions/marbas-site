import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { reset } from '../../src/reset/index.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-reset-'));
}

function makeProject(tmp, files = {}) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(path.join(projectPath, '.marbas'), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(projectPath, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return projectPath;
}

test('reset removes ejected file and creates backup', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, { '_includes/base.njk': 'custom-base' });

  const result = reset({ projectPath, relativePath: '_includes/base.njk' });

  assert.equal(result.status, 'reset');
  assert.ok(result.backupPath);
  assert.ok(!fs.existsSync(path.join(projectPath, '_includes', 'base.njk')));
  assert.ok(fs.existsSync(result.backupPath));
  assert.equal(fs.readFileSync(result.backupPath, 'utf8'), 'custom-base');

  fs.rmSync(tmp, { recursive: true });
});

test('reset removes whole component directory and creates backup', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, {
    '_components/Hero/Hero.njk': 'hero-template',
    '_components/Hero/schema.json': '{}'
  });

  const result = reset({ projectPath, relativePath: '_components/Hero' });

  assert.equal(result.status, 'reset');
  assert.ok(result.backupPath);
  assert.ok(!fs.existsSync(path.join(projectPath, '_components', 'Hero')));
  assert.ok(fs.existsSync(path.join(result.backupPath, 'Hero.njk')));
  assert.ok(fs.existsSync(path.join(result.backupPath, 'schema.json')));

  fs.rmSync(tmp, { recursive: true });
});

test('reset of non-ejected file returns nothing-to-do', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp); // no files

  const result = reset({ projectPath, relativePath: '_includes/base.njk' });

  assert.equal(result.status, 'nothing-to-do');
  assert.ok(result.message.includes('not ejected'));

  fs.rmSync(tmp, { recursive: true });
});

test('reset outside ejectable dirs returns error', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, { 'src/something.js': 'code' });

  const result = reset({ projectPath, relativePath: 'src/something.js' });

  assert.equal(result.status, 'error');
  assert.ok(result.message.includes('not in an ejectable directory'));

  fs.rmSync(tmp, { recursive: true });
});

test('reset with missing relativePath returns error', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp);

  const result = reset({ projectPath, relativePath: '' });
  assert.equal(result.status, 'error');

  fs.rmSync(tmp, { recursive: true });
});

test('reset with failed backup leaves source untouched', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, { '_includes/base.njk': 'custom' });

  // Make .marbas/trash read-only to trigger backup failure
  const trashParent = path.join(projectPath, '.marbas');
  fs.chmodSync(trashParent, 0o444);

  let result;
  try {
    result = reset({ projectPath, relativePath: '_includes/base.njk' });
  } finally {
    fs.chmodSync(trashParent, 0o755);
  }

  assert.equal(result.status, 'error');
  assert.ok(result.message.includes('Backup failed'));
  // Source must still exist
  assert.ok(fs.existsSync(path.join(projectPath, '_includes', 'base.njk')));

  fs.rmSync(tmp, { recursive: true });
});
