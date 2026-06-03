import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { initProject as init } from '../../src/init/index.js';
import { build } from '../../src/build/build.js';

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-build-customenv-'));
}

// Smoke test for the dynamic environment model (Task 87): a user-defined
// environment with mode=production must build with the production webpack base,
// write to build/public_<env>/, and emit custom.bundle.css + theme.css.
test('build: custom env "foo" (mode production) writes to public_foo with custom + theme CSS', async () => {
  const projectPath = tmpProject();
  fs.rmSync(projectPath, { recursive: true, force: true });

  try {
    init({ projectPath });

    // Add a custom environment + a theme, keeping the two built-ins.
    const configPath = path.join(projectPath, 'marbas-project.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.environments.foo = { outputName: 'foo', mode: 'production', env: {} };
    config.theme.id = 'theme-bloom';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    await build({ projectPath, environment: 'foo' });

    const outDir = path.join(projectPath, 'build', 'public_foo');
    assert.ok(fs.existsSync(path.join(outDir, 'index.html')), 'index.html missing in public_foo');
    assert.ok(
      fs.existsSync(path.join(outDir, '_assets', 'css', 'custom.bundle.css')),
      'custom.bundle.css missing in public_foo'
    );
    assert.ok(
      fs.existsSync(path.join(outDir, '_assets', 'css', 'theme.css')),
      'theme.css missing in public_foo'
    );
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

// Unknown environment must fail loudly — no silent fallback to development.
test('build: unknown environment throws with the available list', async () => {
  const projectPath = tmpProject();
  fs.rmSync(projectPath, { recursive: true, force: true });

  try {
    init({ projectPath });
    await assert.rejects(
      () => build({ projectPath, environment: 'ghost' }),
      /Unknown environment "ghost".*Available environments:/s
    );
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
