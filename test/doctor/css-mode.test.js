import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { checkCssMode } from '../../src/doctor/checks/css-mode.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-doctor-cssmode-'));
}

function makeProject(tmp, siteSettings = null, layoutFiles = {}) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(path.join(projectPath, '.marbas'), { recursive: true });

  if (siteSettings) {
    const dataDir = path.join(projectPath, 'pages', '_data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'site.json'), JSON.stringify(siteSettings));
  }

  for (const [rel, content] of Object.entries(layoutFiles)) {
    const full = path.join(projectPath, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }

  return projectPath;
}

test('css-mode: marbas mode returns ok', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, { theme: { cssMode: 'marbas' } });

  const results = checkCssMode({ projectPath });
  assert.ok(results.every((r) => r.status === 'ok'));

  fs.rmSync(tmp, { recursive: true });
});

test('css-mode: external without ejected layout returns warn', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp, { theme: { cssMode: 'external' } });

  const results = checkCssMode({ projectPath });
  const warn = results.find((r) => r.status === 'warn');
  assert.ok(warn);
  assert.ok(warn.message.includes('layouts'));

  fs.rmSync(tmp, { recursive: true });
});

test('css-mode: external with ejected layout returns ok', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(
    tmp,
    { theme: { cssMode: 'external' } },
    { '_layouts/base.njk': 'layout' }
  );

  const results = checkCssMode({ projectPath });
  assert.ok(results.every((r) => r.status === 'ok'));

  fs.rmSync(tmp, { recursive: true });
});
