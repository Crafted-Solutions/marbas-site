import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { checkGitignore } from '../../src/doctor/checks/gitignore.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-doctor-gitignore-'));
}

function makeProject(tmp, gitignoreContent = null) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(path.join(projectPath, '.marbas'), { recursive: true });
  if (gitignoreContent !== null) {
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent);
  }
  return projectPath;
}

test('gitignore: complete .gitignore returns ok', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, [
    '.marbas/trash/',
    '.marbas/build-context/',
    'node_modules/',
    'build/',
  ].join('\n'));

  const results = checkGitignore(projectPath);
  assert.ok(results.every((r) => r.status === 'ok'));

  fs.rmSync(tmp, { recursive: true });
});

test('gitignore: missing entries returns warn', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, 'node_modules/\nbuild/\n');

  const results = checkGitignore(projectPath);
  assert.equal(results[0].status, 'warn');
  assert.ok(results[0].message.includes('.marbas/trash/'));

  fs.rmSync(tmp, { recursive: true });
});

test('gitignore: missing file returns warn', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp); // no .gitignore

  const results = checkGitignore(projectPath);
  assert.equal(results[0].status, 'warn');
  assert.ok(results[0].message.includes('.gitignore not found'));

  fs.rmSync(tmp, { recursive: true });
});
