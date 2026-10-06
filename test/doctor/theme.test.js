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
  assert.equal(results[0].status, 'ok');
  assert.ok(results[0].message.includes('theme-bloom'));
  assert.ok(results[0].message.includes('library'));
  // theme-bloom is classic → deprecation hint (Task 167)
  assert.ok(results.some((r) => r.status === 'warn' && /classic wird mit marbas-site 0\.50 entfernt/.test(r.message)), JSON.stringify(results));

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

const V2_CSS = '/* @family v2 */ :root { --p-paper: #ffffff; --p-ink: #111111; --p-accent: #005a9c; }';

function v2Project(tmp, site) {
  const libRoot = path.join(tmp, 'lib');
  fs.mkdirSync(path.join(libRoot, 'themes'), { recursive: true });
  fs.writeFileSync(path.join(libRoot, 'themes', 'theme-editorial.css'), V2_CSS);
  const projectPath = makeProject(tmp, { theme: { id: 'theme-editorial' } }, { 'pages/_data/site.json': JSON.stringify(site) });
  return { projectPath, libRoot };
}

test('checkTheme: form with variants other than default → warn naming the fields', () => {
  const tmp = makeTmpDir();
  const { projectPath, libRoot } = v2Project(tmp, { header: { variant: 'accent', navigationVariant: 'pill' }, footer: { variant: 'contrast' } });
  const warn = checkTheme({ projectPath, libRoot }).find((r) => r.id === 'theme-variants');
  assert.equal(warn.status, 'warn');
  for (const field of ['header.variant=accent', 'header.navigationVariant=pill', 'footer.variant=contrast']) assert.ok(warn.message.includes(field), field);
  fs.rmSync(tmp, { recursive: true });
});

test('checkTheme: form with default or missing variants → no variant warning', () => {
  const tmp = makeTmpDir();
  const { projectPath, libRoot } = v2Project(tmp, { header: { variant: 'default' }, footer: {} });
  assert.equal(checkTheme({ projectPath, libRoot }).some((r) => r.id === 'theme-variants'), false);
  fs.rmSync(tmp, { recursive: true });
});

test('checkTheme: classic theme with variants → no variant warning (variants are meaningful there)', () => {
  const tmp = makeTmpDir();
  const libRoot = makeFakeLib(tmp);
  const projectPath = makeProject(tmp, { theme: { id: 'theme-bloom' } }, { 'pages/_data/site.json': JSON.stringify({ header: { variant: 'glass' } }) });
  assert.equal(checkTheme({ projectPath, libRoot }).some((r) => r.id === 'theme-variants'), false);
  fs.rmSync(tmp, { recursive: true });
});
