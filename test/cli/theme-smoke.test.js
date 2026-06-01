/**
 * Smoke test: full theme lifecycle via CLI
 *
 * 1. init a fresh project
 * 2. build without a theme → no theme.css in output
 * 3. marbas theme → set theme-bloom
 * 4. build again → theme.css present and contains bloom content
 * 5. switch to theme-atlas via CLI
 * 6. build again → theme.css replaced with atlas content
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');

function run(args, opts = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    timeout: opts.timeout ?? 120_000,
    ...opts
  });
}

function themeCssPath(projectPath) {
  return path.join(projectPath, 'build', 'public_development', '_assets', 'css', 'theme.css');
}

test('theme CLI smoke — init → build → set theme → build → switch → build', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-theme-smoke-'));
  const projectPath = path.join(tmp, 'site');

  try {
    // 1. Init
    const init = run(['init', projectPath, '--env=development']);
    assert.equal(init.status, 0, `init failed:\n${init.stderr}`);

    // 2. Build without theme → theme.css must NOT exist
    const build1 = run(['build', projectPath, '--env=development']);
    assert.equal(build1.status, 0, `build1 failed:\n${build1.stdout}\n${build1.stderr}`);
    assert.ok(!fs.existsSync(themeCssPath(projectPath)), 'theme.css must not exist before theme is set');

    // 3. Set theme-bloom
    const setBloom = run(['theme', projectPath, 'theme-bloom']);
    assert.equal(setBloom.status, 0, `theme set failed:\n${setBloom.stderr}`);
    assert.ok(setBloom.stdout.includes('theme-bloom'));

    const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
    assert.equal(config.theme?.id, 'theme-bloom');

    // 4. Build with theme-bloom → theme.css must exist and contain bloom tokens
    const build2 = run(['build', projectPath, '--env=development']);
    assert.equal(build2.status, 0, `build2 failed:\n${build2.stdout}\n${build2.stderr}`);

    const css1 = fs.readFileSync(themeCssPath(projectPath), 'utf8');
    assert.ok(css1.length > 0, 'theme.css is empty after build');
    // theme-bloom.css defines a rose/blush palette — check for a known token
    assert.ok(css1.includes('--t-'), 'theme.css must contain CSS custom properties');

    const bloom = fs.readFileSync(
      path.join(__dirname, '../../themes/theme-bloom.css'), 'utf8'
    );
    assert.equal(css1, bloom, 'theme.css content must match library theme-bloom.css');

    // 5. Switch to theme-atlas
    const setAtlas = run(['theme', projectPath, 'theme-atlas']);
    assert.equal(setAtlas.status, 0, `theme switch failed:\n${setAtlas.stderr}`);

    // 6. Build with theme-atlas → theme.css replaced
    const build3 = run(['build', projectPath, '--env=development']);
    assert.equal(build3.status, 0, `build3 failed:\n${build3.stdout}\n${build3.stderr}`);

    const css2 = fs.readFileSync(themeCssPath(projectPath), 'utf8');
    const atlas = fs.readFileSync(
      path.join(__dirname, '../../themes/theme-atlas.css'), 'utf8'
    );
    assert.equal(css2, atlas, 'theme.css content must match library theme-atlas.css after switch');
    assert.notEqual(css1, css2, 'theme.css must have changed after switching themes');

  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});
