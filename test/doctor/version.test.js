import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { checkVersion } from '../../src/doctor/checks/version.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-doctor-version-'));
}

function makeProject(tmp, config) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(path.join(projectPath, '.marbas'), { recursive: true });
  fs.writeFileSync(path.join(projectPath, 'marbas-project.json'), JSON.stringify(config));
  return projectPath;
}

test('version check: same version returns ok', () => {
  const tmp = makeTmpDir();
  // read the actual tool version
  const pkgPath = new URL('../../package.json', import.meta.url).pathname;
  const toolVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  const projectPath = makeProject(tmp, { marbasSite: toolVersion, environments: { development: {} } });

  const result = checkVersion(projectPath);
  assert.equal(result.status, 'ok');

  fs.rmSync(tmp, { recursive: true });
});

test('version check: minor drift returns warn', () => {
  const tmp = makeTmpDir();
  const pkgPath = new URL('../../package.json', import.meta.url).pathname;
  const toolVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  const [major] = toolVersion.split('.');
  const projectVersion = `${major}.999.0`;
  const projectPath = makeProject(tmp, { marbasSite: projectVersion, environments: { development: {} } });

  const result = checkVersion(projectPath);
  assert.equal(result.status, 'warn');
  assert.ok(result.message.includes('drift'));

  fs.rmSync(tmp, { recursive: true });
});

test('version check: major mismatch returns error', () => {
  const tmp = makeTmpDir();
  const pkgPath = new URL('../../package.json', import.meta.url).pathname;
  const toolVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  const [major] = toolVersion.split('.');
  const otherMajor = parseInt(major, 10) + 1;
  const projectPath = makeProject(tmp, { marbasSite: `${otherMajor}.0.0`, environments: { development: {} } });

  const result = checkVersion(projectPath);
  assert.equal(result.status, 'error');
  assert.ok(result.message.includes('mismatch'));

  fs.rmSync(tmp, { recursive: true });
});

test('version check: missing marbasSite field returns warn', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, { environments: { development: {} } });

  const result = checkVersion(projectPath);
  assert.equal(result.status, 'warn');

  fs.rmSync(tmp, { recursive: true });
});
