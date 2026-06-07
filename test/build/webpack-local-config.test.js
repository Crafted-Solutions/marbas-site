import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { initProject } from '../../src/init/index.js';
import { build } from '../../src/build/build.js';

const __filename = fileURLToPath(import.meta.url);
const LIB_ROOT = path.resolve(path.dirname(__filename), '../..');

// Smoke: a project-local _webpack/staging.js is picked up and the build succeeds.
// The local config re-uses the lib's development base — this proves the lib's
// exported helpers are importable from a project-local config.
test('build: project-local _webpack/staging.js is used and build succeeds', async () => {
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-wp-local-'));
  fs.rmSync(projectPath, { recursive: true, force: true });

  try {
    initProject({ projectPath });

    // Add a staging environment (development mode)
    const configPath = path.join(projectPath, 'marbas-project.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.environments.staging = { outputName: 'staging', mode: 'development', env: {} };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    // Write a minimal project-local webpack config that imports from the lib
    fs.mkdirSync(path.join(projectPath, '_webpack'));
    fs.writeFileSync(
      path.join(projectPath, '_webpack', 'staging.js'),
      `import libConfig from '${LIB_ROOT}/src/build/webpack/development.js';
export default libConfig;
`
    );

    await build({ projectPath, environment: 'staging' });

    const outDir = path.join(projectPath, 'build', 'public_staging');
    assert.ok(fs.existsSync(path.join(outDir, 'index.html')), 'index.html missing in public_staging');
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
