import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { reinitProject } from '../../src/init/index.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-reinit-'));
}

function makeProjectDir(tmp, files = {}) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(projectPath, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(projectPath, name), JSON.stringify(content, null, 2));
  }
  return projectPath;
}

test('reinitProject: creates marbas-project.json from legacy config', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProjectDir(tmp, {
    '.marbas-site-project.json': {
      name: 'TestSite',
      theme: { selected: 'theme-bloom.css', languageSwitcher: true },
      rendering: { footerMode: 'globalData', headerMode: 'globalData' },
      i18n: { defaultLanguage: 'de', languages: [{ code: 'de' }] },
      preview: { defaultEnvironment: 'staging' },
      paths: { buildDir: './dist' }
    }
  });

  const result = reinitProject({ projectPath });

  assert.ok(result.hadLegacy);
  assert.ok(fs.existsSync(result.configPath));

  const config = JSON.parse(fs.readFileSync(result.configPath, 'utf8'));
  assert.equal(config.name, 'TestSite');
  assert.equal(config.theme.id, 'theme-bloom');
  assert.equal(config.rendering.footerMode, 'globalData');
  assert.equal(config.i18n.defaultLanguage, 'de');
  assert.equal(config.defaultEnvironment, 'staging');
  assert.equal(config.paths.buildDir, './dist');
  assert.ok(config.environments.development);
  assert.ok(config.environments.staging);

  fs.rmSync(tmp, { recursive: true });
});

test('reinitProject: backup is written to .marbas/migration-backup/', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProjectDir(tmp, {
    '.marbas-site-project.json': { name: 'BackupTest' }
  });

  reinitProject({ projectPath });

  const backupDir = path.join(projectPath, '.marbas', 'migration-backup');
  const backups = fs.readdirSync(backupDir);
  assert.equal(backups.length, 1);
  assert.ok(backups[0].startsWith('marbas-site-project.json.'));

  fs.rmSync(tmp, { recursive: true });
});

test('reinitProject: no legacy config → uses defaults', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProjectDir(tmp);

  const result = reinitProject({ projectPath });

  assert.equal(result.hadLegacy, false);
  const config = JSON.parse(fs.readFileSync(result.configPath, 'utf8'));
  assert.equal(config.defaultEnvironment, 'development');
  assert.equal(config.theme.id, null);
  assert.equal(config.rendering.footerMode, 'globalData');
  assert.ok(config.environments.development);

  fs.rmSync(tmp, { recursive: true });
});

test('reinitProject: throws if marbas-project.json already exists without --force', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProjectDir(tmp, {
    'marbas-project.json': { name: 'existing' }
  });

  assert.throws(
    () => reinitProject({ projectPath }),
    /already exists/
  );

  fs.rmSync(tmp, { recursive: true });
});

test('reinitProject: --force overwrites existing marbas-project.json', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProjectDir(tmp, {
    'marbas-project.json': { name: 'old' },
    '.marbas-site-project.json': { name: 'NewSite' }
  });

  const result = reinitProject({ projectPath, force: true });

  const config = JSON.parse(fs.readFileSync(result.configPath, 'utf8'));
  assert.equal(config.name, 'NewSite');

  fs.rmSync(tmp, { recursive: true });
});

test('reinitProject: only lib-relevant env fields are kept', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProjectDir(tmp, {
    '.marbas-site-project.json': {
      environments: {
        production: { outputName: 'production', env: { MY_VAR: '1' }, baseHref: '/cms/', domain: 'example.com' }
      }
    }
  });

  const result = reinitProject({ projectPath });
  const config = JSON.parse(fs.readFileSync(result.configPath, 'utf8'));

  assert.deepEqual(config.environments.production, { outputName: 'production', env: { MY_VAR: '1' } });
  assert.equal(config.environments.production.baseHref, undefined);

  fs.rmSync(tmp, { recursive: true });
});
