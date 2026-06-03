import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { readProjectConfig } from '../../src/project/config.js';
import { buildEnvVars } from '../../src/env/build-env.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-config-test-'));
}

function writeConfig(dir, data) {
  fs.writeFileSync(path.join(dir, 'marbas-project.json'), JSON.stringify(data, null, 2));
}

// ── readProjectConfig ────────────────────────────────────────────────────────

test('readProjectConfig applies theme defaults when theme block is absent', () => {
  const tmp = makeTmpDir();
  writeConfig(tmp, {
    name: 'test',
    marbasSite: '0.5.0',
    environments: { development: { outputName: 'development', env: {} } }
  });

  const config = readProjectConfig(tmp);
  assert.equal(config.theme.id, null);
  assert.equal(config.theme.cssMode, 'marbas');
  assert.equal(config.theme.languageSwitcher, true);
});

test('readProjectConfig preserves explicit theme.id', () => {
  const tmp = makeTmpDir();
  writeConfig(tmp, {
    name: 'test',
    marbasSite: '0.5.0',
    environments: { development: { outputName: 'development', env: {} } },
    theme: { id: 'theme-atelier', cssMode: 'marbas', languageSwitcher: false }
  });

  const config = readProjectConfig(tmp);
  assert.equal(config.theme.id, 'theme-atelier');
  assert.equal(config.theme.cssMode, 'marbas');
  assert.equal(config.theme.languageSwitcher, false);
});

test('readProjectConfig applies rendering defaults when rendering block is absent', () => {
  const tmp = makeTmpDir();
  writeConfig(tmp, {
    name: 'test',
    marbasSite: '0.5.0',
    environments: { development: { outputName: 'development', env: {} } }
  });

  const config = readProjectConfig(tmp);
  assert.equal(config.rendering.footerMode, 'globalData');
  assert.equal(config.rendering.headerMode, 'globalData');
});

test('readProjectConfig preserves explicit rendering settings', () => {
  const tmp = makeTmpDir();
  writeConfig(tmp, {
    name: 'test',
    marbasSite: '0.5.0',
    environments: { development: { outputName: 'development', env: {} } },
    rendering: { footerMode: 'globalData', headerMode: 'globalData' }
  });

  const config = readProjectConfig(tmp);
  assert.equal(config.rendering.footerMode, 'globalData');
  assert.equal(config.rendering.headerMode, 'globalData');
});

test('readProjectConfig reads i18n block', () => {
  const tmp = makeTmpDir();
  writeConfig(tmp, {
    name: 'test',
    marbasSite: '0.5.0',
    environments: { development: { outputName: 'development', env: {} } },
    i18n: { defaultLanguage: 'de', languages: [{ code: 'de', iso: 'de-DE', name: 'Deutsch' }] }
  });

  const config = readProjectConfig(tmp);
  assert.equal(config.i18n.defaultLanguage, 'de');
  assert.equal(config.i18n.languages.length, 1);
});

test('readProjectConfig falls back to legacy .marbas-site-project.json and maps theme.selected', () => {
  const tmp = makeTmpDir();
  fs.writeFileSync(path.join(tmp, '.marbas-site-project.json'), JSON.stringify({
    name: 'legacy-project',
    theme: { selected: 'theme-bloom.css', languageSwitcher: true },
    rendering: { footerMode: 'globalData', headerMode: 'legacy' },
    i18n: { defaultLanguage: 'en' }
  }));

  const config = readProjectConfig(tmp);
  assert.equal(config._fromLegacy, true);
  assert.equal(config.theme.id, 'theme-bloom');
  assert.equal(config.rendering.footerMode, 'globalData');
  assert.equal(config.i18n.defaultLanguage, 'en');
});

// ── buildEnvVars ─────────────────────────────────────────────────────────────

test('buildEnvVars sets MARBAS_THEME_FILE from config.theme.id', () => {
  const tmp = makeTmpDir();
  // no env files needed — we only check the returned vars
  const vars = buildEnvVars({
    projectPath: tmp,
    environment: 'development',
    config: {
      theme: { id: 'theme-atelier', cssMode: 'marbas', languageSwitcher: true },
      rendering: { footerMode: 'globalData', headerMode: 'globalData' }
    },
    themeFile: 'theme-atelier.css'
  });

  assert.equal(vars.MARBAS_THEME_FILE, 'theme-atelier.css');
  assert.equal(vars.MARBAS_FOOTER_MODE, 'globalData');
  assert.equal(vars.MARBAS_HEADER_MODE, 'globalData');
  assert.equal(vars.MARBAS_USE_CMS_STYLES, '1');
  assert.equal(vars.MARBAS_USE_LANGUAGE_SWITCHER, '1');
});

test('buildEnvVars reads cssMode from config.theme.cssMode', () => {
  const tmp = makeTmpDir();
  const vars = buildEnvVars({
    projectPath: tmp,
    environment: 'development',
    config: { theme: { cssMode: 'external', languageSwitcher: false }, rendering: {} }
  });

  assert.equal(vars.MARBAS_USE_CMS_STYLES, '0');
  assert.equal(vars.MARBAS_USE_LANGUAGE_SWITCHER, '0');
});

test('buildEnvVars sets i18n vars from config.i18n', () => {
  const tmp = makeTmpDir();
  const vars = buildEnvVars({
    projectPath: tmp,
    environment: 'development',
    config: {
      theme: {},
      rendering: {},
      i18n: {
        defaultLanguage: 'de',
        languages: [{ code: 'de' }, { code: 'en' }]
      }
    }
  });

  assert.equal(vars.DEFAULT_LANGUAGE, 'de');
  assert.ok(vars.SUPPORTED_LANGUAGES.includes('"de"'));
});
