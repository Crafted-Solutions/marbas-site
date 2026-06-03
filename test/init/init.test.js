import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initProject } from '../../src/init/index.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-init-'));
}

test('initProject creates all required directories', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'my-project');

  initProject({ projectPath });

  assert.ok(fs.existsSync(projectPath));
  assert.ok(fs.existsSync(path.join(projectPath, 'pages')));
  assert.ok(fs.existsSync(path.join(projectPath, 'pages', '_data')));
  assert.ok(fs.existsSync(path.join(projectPath, '_components')));
  assert.ok(fs.existsSync(path.join(projectPath, '_theme')));
  assert.ok(fs.existsSync(path.join(projectPath, '_media')));
  assert.ok(fs.existsSync(path.join(projectPath, '.marbas')));

  fs.rmSync(tmp, { recursive: true });
});

test('initProject creates marbas-project.json with correct structure', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'test-proj');

  initProject({ projectPath, name: 'My Site' });

  const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
  assert.equal(config.name, 'My Site');
  assert.ok(config.marbasSite, 'marbasSite version should be set');
  assert.equal(config.defaultEnvironment, 'development');
  assert.equal(config.paths.buildDir, './build');
  // Task 87: init seeds exactly the two built-in environments
  assert.ok(config.environments.development, 'Should have development environment');
  assert.ok(config.environments.production, 'Should have production environment');
  assert.deepEqual(Object.keys(config.environments).sort(), ['development', 'production']);
  assert.deepEqual(config.deployTargets, {});

  fs.rmSync(tmp, { recursive: true });
});

test('initProject defaults name to directory basename', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'my-awesome-site');

  initProject({ projectPath });

  const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
  assert.equal(config.name, 'my-awesome-site');

  fs.rmSync(tmp, { recursive: true });
});

test('initProject creates pages/index.md', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'proj');

  initProject({ projectPath });

  const indexMd = fs.readFileSync(path.join(projectPath, 'pages', 'index.md'), 'utf8');
  assert.ok(indexMd.includes('layout: base'));
  assert.ok(indexMd.includes('Willkommen'));

  fs.rmSync(tmp, { recursive: true });
});

test('initProject creates pages/_data/site.json with defaults', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'proj');

  initProject({ projectPath });

  const siteJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'pages', '_data', 'site.json'), 'utf8'));
  assert.ok(siteJson.title, 'site.json should have a title');
  assert.ok(siteJson.header, 'site.json should have header settings');
  assert.ok(siteJson.footer, 'site.json should have footer settings');

  fs.rmSync(tmp, { recursive: true });
});

test('initProject creates .gitignore with required entries', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'proj');

  initProject({ projectPath });

  const gitignore = fs.readFileSync(path.join(projectPath, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('node_modules/'));
  assert.ok(gitignore.includes('build/'));
  assert.ok(gitignore.includes('.marbas/trash/'));

  fs.rmSync(tmp, { recursive: true });
});

test('initProject creates .gitkeep in empty dirs', () => {
  const tmp = makeTmpDir();
  const projectPath = path.join(tmp, 'proj');

  initProject({ projectPath });

  assert.ok(fs.existsSync(path.join(projectPath, '_components', '.gitkeep')));
  assert.ok(fs.existsSync(path.join(projectPath, '_theme', '.gitkeep')));
  assert.ok(fs.existsSync(path.join(projectPath, '_media', '.gitkeep')));

  fs.rmSync(tmp, { recursive: true });
});
