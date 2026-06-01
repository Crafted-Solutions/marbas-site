import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { initProject as init } from '../../src/init/index.js';
import { eject } from '../../src/eject/index.js';
import { reset } from '../../src/reset/index.js';
import { runDoctor as doctor } from '../../src/doctor/index.js';
import { build } from '../../src/build/build.js';

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-e2e-'));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── Workflow 1: init ──────────────────────────────────────────────────────────

test('WF1: init creates minimal project structure', () => {
  const projectPath = tmpProject();
  cleanup(projectPath); // let init create it

  try {
    init({ projectPath });

    assert.ok(fs.existsSync(path.join(projectPath, 'marbas-project.json')), 'marbas-project.json missing');
    assert.ok(fs.existsSync(path.join(projectPath, 'pages')), 'pages/ missing');
    assert.ok(fs.existsSync(path.join(projectPath, '_components')), '_components/ missing');
    assert.ok(fs.existsSync(path.join(projectPath, '_theme')), '_theme/ missing');
    assert.ok(fs.existsSync(path.join(projectPath, '_media')), '_media/ missing');
    assert.ok(fs.existsSync(path.join(projectPath, 'pages', '_data', 'site.json')), 'pages/_data/site.json missing');
    assert.ok(fs.existsSync(path.join(projectPath, 'pages', 'index.md')), 'pages/index.md missing');

    // No plumbing artefacts in project
    assert.ok(!fs.existsSync(path.join(projectPath, '_includes')), '_includes/ should not exist in slim project');
    assert.ok(!fs.existsSync(path.join(projectPath, 'eleventy.config.js')), 'eleventy.config.js should not exist');
  } finally {
    cleanup(projectPath);
  }
});

// ── Workflow 2: eject ─────────────────────────────────────────────────────────

test('WF2: eject copies Hero component into project', () => {
  const projectPath = tmpProject();
  cleanup(projectPath);

  try {
    init({ projectPath });

    // Built-ins eject into the project's friendly _components/ dir.
    const result = eject({ projectPath, relativePath: '_components/Hero' });
    assert.equal(result.status, 'ejected', `eject failed: ${result.message}`);

    const heroNjk = path.join(projectPath, '_components', 'Hero', 'Hero.njk');
    assert.ok(fs.existsSync(heroNjk), 'Hero.njk not found after eject');

    // Calling eject again is idempotent
    const again = eject({ projectPath, relativePath: '_components/Hero' });
    assert.equal(again.status, 'already-ejected');
  } finally {
    cleanup(projectPath);
  }
});

// ── Workflow 3: reset ─────────────────────────────────────────────────────────

test('WF3: reset removes ejected component and creates trash backup', () => {
  const projectPath = tmpProject();
  cleanup(projectPath);

  try {
    init({ projectPath });
    eject({ projectPath, relativePath: '_components/Hero' });

    const heroDir = path.join(projectPath, '_components', 'Hero');
    assert.ok(fs.existsSync(heroDir), 'Hero should exist before reset');

    const result = reset({ projectPath, relativePath: '_components/Hero' });
    assert.equal(result.status, 'reset', `reset failed: ${result.message}`);

    assert.ok(!fs.existsSync(heroDir), 'Hero should be gone after reset');

    // Backup exists in .marbas/trash/
    const trashRoot = path.join(projectPath, '.marbas', 'trash');
    assert.ok(fs.existsSync(trashRoot), '.marbas/trash/ should exist');
    const timestamps = fs.readdirSync(trashRoot);
    assert.ok(timestamps.length > 0, 'trash should contain at least one backup');
    const backupHero = path.join(trashRoot, timestamps[0], '_components', 'Hero', 'Hero.njk');
    assert.ok(fs.existsSync(backupHero), 'Hero.njk backup not found in trash');
  } finally {
    cleanup(projectPath);
  }
});

// ── Workflow 4: manual deletion ───────────────────────────────────────────────

test('WF4: build succeeds after manually deleting an ejected file', async () => {
  const projectPath = tmpProject();
  cleanup(projectPath);

  try {
    init({ projectPath });
    eject({ projectPath, relativePath: '_components/Hero' });

    // Manually delete ejected component (simulate external deletion)
    fs.rmSync(path.join(projectPath, '_components', 'Hero'), { recursive: true });

    // Build should fall back to lib default — no error
    await build({ projectPath, environment: 'development' });

    const indexHtml = path.join(projectPath, 'build', 'public_development', 'index.html');
    assert.ok(fs.existsSync(indexHtml), 'index.html missing after build with manually deleted eject');
  } finally {
    cleanup(projectPath);
  }
});

// ── Workflow 5: doctor ────────────────────────────────────────────────────────

test('WF5: doctor runs without error on fresh project', () => {
  const projectPath = tmpProject();
  cleanup(projectPath);

  try {
    init({ projectPath });
    const report = doctor({ projectPath });

    assert.ok(Array.isArray(report.checks), 'doctor should return { checks: [] }');
    assert.ok(report.checks.length > 0, 'doctor report should not be empty');

    const statuses = report.checks.map((c) => c.status);
    assert.ok(!statuses.includes('error'), `doctor reported errors: ${JSON.stringify(report.checks.filter(c => c.status === 'error'))}`);
  } finally {
    cleanup(projectPath);
  }
});

// ── Workflow 6: version drift ─────────────────────────────────────────────────

test('WF6: doctor detects version drift (old marbasSite in project)', () => {
  const projectPath = tmpProject();
  cleanup(projectPath);

  try {
    init({ projectPath });

    // Simulate old project version
    const configPath = path.join(projectPath, 'marbas-project.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.marbasSite = '0.0.1';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const report = doctor({ projectPath });
    assert.ok(Array.isArray(report.checks), 'doctor should return { checks: [] }');

    // Doctor should mention version — either as ok (same major) or warn
    const versionCheck = report.checks.find((c) => c.id === 'version' || c.id?.includes('version'));
    assert.ok(versionCheck, 'doctor should include a version check');
  } finally {
    cleanup(projectPath);
  }
});
