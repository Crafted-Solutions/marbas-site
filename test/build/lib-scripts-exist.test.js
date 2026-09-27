/**
 * Smoke test (Task 117): every script the built HTML references must exist in the output.
 * Regression: full.js and languageSwitcher.js were linked from /_assets/js/ but copied to
 * /_assets/js/_lib/ → 404, mobile navigation and language switcher dead.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 180_000 });

test('all referenced local scripts exist in the build output (incl. language switcher)', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-scripts-'));
  const projectPath = path.join(tmp, 'site');
  try {
    assert.equal(run(['init', projectPath, '--starter']).status, 0, 'init failed');
    const configPath = path.join(projectPath, 'marbas-project.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.theme.languageSwitcher = true;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const build = run(['build', projectPath, '--env=development']);
    assert.equal(build.status, 0, `build failed:\n${build.stderr}`);
    const out = path.join(projectPath, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    const scripts = [...html.matchAll(/<script[^>]+src="(\/[^"]+)"/g)].map((m) => m[1]);
    assert.ok(scripts.some((s) => s.endsWith('/full.js')), 'full.js is referenced');
    assert.ok(scripts.some((s) => s.endsWith('/languageSwitcher.js')), 'languageSwitcher.js is referenced');
    for (const src of scripts) {
      assert.ok(fs.existsSync(path.join(out, src)), `referenced script exists: ${src}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
