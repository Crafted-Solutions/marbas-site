import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { checkTheme } from '../../src/doctor/checks/theme.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-doctor-theme-'));
}

function makeProject(tmp, config = {}, extraFiles = {}) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(projectPath, { recursive: true });
  fs.writeFileSync(
    path.join(projectPath, 'marbas-project.json'),
    JSON.stringify({ name: 'test', marbasSite: '1.0.0', environments: { development: {} }, ...config }, null, 2)
  );
  for (const [rel, content] of Object.entries(extraFiles)) {
    const full = path.join(projectPath, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return projectPath;
}

function makeFakeLib(tmp) {
  const libRoot = path.join(tmp, 'lib');
  fs.mkdirSync(path.join(libRoot, 'themes'), { recursive: true });
  fs.writeFileSync(path.join(libRoot, 'themes', 'theme-bloom.css'), ':root { --t-bg: #fff; }');
  return libRoot;
}

test('checkTheme: no theme.id → warn', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp);
  const libRoot = makeFakeLib(tmp);

  const results = checkTheme({ projectPath, libRoot });
  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'warn');
  assert.ok(results[0].message.includes('unstyled'));

  fs.rmSync(tmp, { recursive: true });
});

test('checkTheme: valid lib theme → ok', () => {
  const tmp = makeTmpDir();
  const libRoot = makeFakeLib(tmp);
  const projectPath = makeProject(tmp, { theme: { id: 'theme-bloom' } });

  const results = checkTheme({ projectPath, libRoot });
  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'ok');
  assert.ok(results[0].message.includes('theme-bloom'));
  assert.ok(results[0].message.includes('library'));

  fs.rmSync(tmp, { recursive: true });
});

test('checkTheme: ejected theme → ok with ejected note', () => {
  const tmp = makeTmpDir();
  const libRoot = makeFakeLib(tmp);
  const projectPath = makeProject(
    tmp,
    { theme: { id: 'theme-bloom' } },
    { '_theme/theme-bloom.css': ':root { --t-bg: pink; }' }
  );

  const results = checkTheme({ projectPath, libRoot });
  assert.equal(results[0].status, 'ok');
  assert.ok(results[0].message.includes('ejected'));

  fs.rmSync(tmp, { recursive: true });
});

test('checkTheme: unknown theme-id → error', () => {
  const tmp = makeTmpDir();
  const libRoot = makeFakeLib(tmp);
  const projectPath = makeProject(tmp, { theme: { id: 'theme-nonexistent' } });

  const results = checkTheme({ projectPath, libRoot });
  assert.equal(results[0].status, 'error');
  assert.ok(results[0].message.includes('theme-nonexistent'));

  fs.rmSync(tmp, { recursive: true });
});
