import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildEnvVars, loadEnvForEnvironment } from '../../src/env/build-env.js';

let tmpDir;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-build-env-'));
  const envDir = path.join(tmpDir, 'config', 'env');
  fs.mkdirSync(envDir, { recursive: true });
  fs.writeFileSync(path.join(envDir, '.env.staging'), 'PUBLIC_VAR=public_value\nSHARED=from_public\n', 'utf8');
  fs.writeFileSync(path.join(envDir, '.env.staging.local'), 'PRIVATE_VAR=private_value\nSHARED=from_private\n', 'utf8');
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadEnvForEnvironment', () => {
  it('loads public and private env files without applying', () => {
    const result = loadEnvForEnvironment({
      rootDir: tmpDir,
      environment: 'staging',
      requirePublic: false,
      apply: false,
      preserveExisting: true
    });

    assert.equal(result.publicEnvVars.PUBLIC_VAR, 'public_value');
    assert.equal(result.privateEnvVars.PRIVATE_VAR, 'private_value');
    assert.equal(result.privateEnvVars.SHARED, 'from_private');
    assert.ok(result.loadedFiles.includes('.env.staging'));
    assert.ok(result.loadedFiles.includes('.env.staging.local'));
  });

  it('returns empty vars when no env files exist', () => {
    const result = loadEnvForEnvironment({
      rootDir: tmpDir,
      environment: 'nonexistent',
      requirePublic: false,
      apply: false
    });

    assert.deepEqual(result.publicEnvVars, {});
    assert.deepEqual(result.privateEnvVars, {});
  });

  it('throws when requirePublic is true and file missing', () => {
    assert.throws(() => {
      loadEnvForEnvironment({
        rootDir: tmpDir,
        environment: 'nonexistent',
        requirePublic: true,
        apply: false
      });
    }, /not found/i);
  });
});

describe('buildEnvVars', () => {
  it('sets MARBAS_PUBLISH_ENVIRONMENT', () => {
    const vars = buildEnvVars({ projectPath: tmpDir, environment: 'staging' });
    assert.equal(vars.MARBAS_PUBLISH_ENVIRONMENT, 'staging');
  });

  it('sets NODE_ENV to development', () => {
    const vars = buildEnvVars({ projectPath: tmpDir, environment: 'staging' });
    assert.equal(vars.NODE_ENV, 'development');
  });

  it('includes private env vars overriding public ones', () => {
    const vars = buildEnvVars({ projectPath: tmpDir, environment: 'staging' });
    assert.equal(vars.PUBLIC_VAR, 'public_value');
    assert.equal(vars.PRIVATE_VAR, 'private_value');
    assert.equal(vars.SHARED, 'from_private');
  });

  it('sets MARBAS_THEME_FILE when a valid theme file is given', () => {
    const vars = buildEnvVars({
      projectPath: tmpDir,
      environment: 'development',
      themeFile: 'theme-dark.css'
    });
    assert.equal(vars.MARBAS_THEME_FILE, 'theme-dark.css');
  });

  it('does not set MARBAS_THEME_FILE for invalid theme file name', () => {
    const vars = buildEnvVars({
      projectPath: tmpDir,
      environment: 'development',
      themeFile: 'custom.css'
    });
    assert.equal(vars.MARBAS_THEME_FILE, undefined);
  });

  it('accepts theme file as full path and extracts basename', () => {
    const vars = buildEnvVars({
      projectPath: tmpDir,
      environment: 'development',
      themeFile: '/some/path/theme-light.css'
    });
    assert.equal(vars.MARBAS_THEME_FILE, 'theme-light.css');
  });

  it('defaults MARBAS_FOOTER_MODE to legacy', () => {
    const vars = buildEnvVars({ projectPath: tmpDir, environment: 'development' });
    assert.equal(vars.MARBAS_FOOTER_MODE, 'legacy');
  });

  it('sets MARBAS_FOOTER_MODE to globalData when rendering.footerMode is globalData', () => {
    const vars = buildEnvVars({
      projectPath: tmpDir,
      environment: 'development',
      rendering: { footerMode: 'globalData' }
    });
    assert.equal(vars.MARBAS_FOOTER_MODE, 'globalData');
  });

  it('defaults MARBAS_HEADER_MODE to legacy', () => {
    const vars = buildEnvVars({ projectPath: tmpDir, environment: 'development' });
    assert.equal(vars.MARBAS_HEADER_MODE, 'legacy');
  });

  it('sets MARBAS_USE_CMS_STYLES to 1 for marbas cssMode', () => {
    const vars = buildEnvVars({
      projectPath: tmpDir,
      environment: 'development',
      config: { cssMode: 'marbas' }
    });
    assert.equal(vars.MARBAS_USE_CMS_STYLES, '1');
  });

  it('sets MARBAS_USE_CMS_STYLES to 0 for external cssMode', () => {
    const vars = buildEnvVars({
      projectPath: tmpDir,
      environment: 'development',
      config: { cssMode: 'external' }
    });
    assert.equal(vars.MARBAS_USE_CMS_STYLES, '0');
  });

  it('sets MARBAS_USE_LANGUAGE_SWITCHER to 1 by default', () => {
    const vars = buildEnvVars({ projectPath: tmpDir, environment: 'development', config: {} });
    assert.equal(vars.MARBAS_USE_LANGUAGE_SWITCHER, '1');
  });

  it('sets MARBAS_USE_LANGUAGE_SWITCHER to 0 when disabled in theme', () => {
    const vars = buildEnvVars({
      projectPath: tmpDir,
      environment: 'development',
      config: { theme: { languageSwitcher: false } }
    });
    assert.equal(vars.MARBAS_USE_LANGUAGE_SWITCHER, '0');
  });

  it('includes i18n env vars when config has i18n', () => {
    const vars = buildEnvVars({
      projectPath: tmpDir,
      environment: 'development',
      config: {
        i18n: {
          defaultLanguage: 'de',
          languages: [{ code: 'de' }, { code: 'en' }]
        }
      }
    });
    assert.equal(vars.DEFAULT_LANGUAGE, 'de');
    assert.ok(vars.SUPPORTED_LANGUAGES.includes('de'));
  });
});
