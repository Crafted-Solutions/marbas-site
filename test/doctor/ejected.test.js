import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { checkEjected } from '../../src/doctor/checks/ejected.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-doctor-ejected-'));
}

function makeProject(tmp, projectFiles = {}, libFiles = {}) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(path.join(projectPath, '.marbas'), { recursive: true });
  for (const [rel, content] of Object.entries(projectFiles)) {
    const full = path.join(projectPath, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }

  const libRoot = path.join(tmp, 'lib');
  for (const [rel, content] of Object.entries(libFiles)) {
    const full = path.join(libRoot, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }

  return { projectPath, libRoot };
}

test('ejected: no ejected files returns ok', () => {
  const tmp = makeTmpDir();
  const { projectPath } = makeProject(tmp);

  const results = checkEjected({ projectPath });
  assert.ok(results.some((r) => r.status === 'ok'));
  assert.ok(results.every((r) => r.status === 'ok'));

  fs.rmSync(tmp, { recursive: true });
});

test('ejected: fully ejected component shows ok', () => {
  const tmp = makeTmpDir();
  const { projectPath, libRoot } = makeProject(tmp,
    { '_components/Hero/Hero.njk': 'custom' },
    { '_includes/components/Hero/Hero.njk': 'lib' }
  );

  const results = checkEjected({ projectPath, libRoot });
  const heroResult = results.find((r) => r.id.includes('Hero'));
  assert.ok(heroResult);
  assert.equal(heroResult.status, 'ok');
  assert.ok(!heroResult.message.includes('partially'));

  fs.rmSync(tmp, { recursive: true });
});

test('ejected: partially ejected component shows warn', () => {
  const tmp = makeTmpDir();
  const { projectPath, libRoot } = makeProject(tmp,
    { '_components/Hero/Hero.njk': 'custom' },
    {
      '_includes/components/Hero/Hero.njk': 'lib',
      '_includes/components/Hero/schema.json': '{}',
    }
  );

  const results = checkEjected({ projectPath, libRoot });
  const heroResult = results.find((r) => r.id.includes('Hero'));
  assert.ok(heroResult);
  assert.equal(heroResult.status, 'warn');
  assert.ok(heroResult.message.includes('partially'));

  fs.rmSync(tmp, { recursive: true });
});

test('ejected: project-specific file (no lib default) shows ok with label', () => {
  const tmp = makeTmpDir();
  const { projectPath, libRoot } = makeProject(tmp,
    { '_includes/custom.njk': 'custom' },
    {} // no lib default
  );

  const results = checkEjected({ projectPath, libRoot });
  const fileResult = results.find((r) => r.id.includes('custom.njk'));
  assert.ok(fileResult);
  assert.equal(fileResult.status, 'ok');
  assert.ok(fileResult.message.includes('project-specific'));

  fs.rmSync(tmp, { recursive: true });
});
