import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { runDoctor } from '../../src/doctor/index.js';

// Task 141: the CLI calls runDoctor({ projectPath }) — library themes must resolve against the installed lib.
function makeProject(theme) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-doctor-lib-'));
  fs.writeFileSync(path.join(tmp, 'marbas-project.json'), JSON.stringify({
    marbasSite: '0.15.0', environments: { development: {} }, defaultEnvironment: 'development', theme
  }));
  return tmp;
}

const themeChecks = (report) => report.checks.filter((c) => c.id === 'theme' || c.id.startsWith('theme.'));

for (const libRoot of [undefined, null]) {
  test(`runDoctor (libRoot ${libRoot}): classic library theme is found`, () => {
    const projectPath = makeProject({ id: 'theme-slate' });
    try {
      const checks = themeChecks(runDoctor({ projectPath, libRoot }));
      assert.ok(checks.length > 0);
      assert.ok(checks.every((c) => c.status !== 'error'), JSON.stringify(checks));
      assert.ok(!checks.some((c) => /not found/.test(c.message)), JSON.stringify(checks));
    } finally {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
  });
}

test('runDoctor: v2 library theme with preset is found and its palette is checked', () => {
  const projectPath = makeProject({ id: 'theme-product', palette: 'nacht', colors: { accent: '#ffe066' } });
  try {
    const checks = themeChecks(runDoctor({ projectPath }));
    const text = JSON.stringify(checks);
    assert.ok(checks.every((c) => c.status !== 'error'), text);
    assert.ok(!/not found/.test(text), text);
    assert.match(text, /nacht/);
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('runDoctor: an ejected library theme in _theme/ is "ejected", placeholders are ignored', () => {
  const projectPath = makeProject({ id: 'theme-editorial' });
  fs.mkdirSync(path.join(projectPath, '_theme'));
  fs.writeFileSync(path.join(projectPath, '_theme', '.gitkeep'), '');
  fs.writeFileSync(path.join(projectPath, '_theme', 'theme-editorial.css'), '/* @family v2 */');
  fs.writeFileSync(path.join(projectPath, '_theme', 'theme-kunde.css'), ':root{}');
  try {
    const ejected = runDoctor({ projectPath }).checks.filter((c) => c.id.startsWith('ejected'));
    const byId = Object.fromEntries(ejected.map((c) => [c.id, c.message]));
    assert.match(byId['ejected._theme/theme-editorial.css'], /— ejected$/);
    assert.match(byId['ejected._theme/theme-kunde.css'], /project-specific/);
    assert.ok(!Object.keys(byId).some((id) => id.includes('.gitkeep')), JSON.stringify(byId));
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
