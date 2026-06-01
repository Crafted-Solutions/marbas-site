import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { listLibraryThemes, getThemeDefaults, THEME_DEFAULTS_BY_ID } from '../../src/theme/library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libRoot = path.join(__dirname, '../..');

let tmpDir;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-theme-lib-'));
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('listLibraryThemes', () => {
  it('finds all theme-*.css files in _assets/css', () => {
    const themes = listLibraryThemes(libRoot);
    assert.ok(themes.length > 0, 'expected at least one theme');
    for (const theme of themes) {
      assert.ok(theme.id.startsWith('theme-'), `id should start with theme-: ${theme.id}`);
      assert.ok(theme.fileName.startsWith('theme-'), `fileName should start with theme-: ${theme.fileName}`);
      assert.ok(fs.existsSync(theme.sourcePath), `theme file should exist: ${theme.sourcePath}`);
    }
  });

  it('includes known themes', () => {
    const themes = listLibraryThemes(libRoot);
    const ids = themes.map(t => t.id);
    assert.ok(ids.includes('theme-atlas'), 'expected theme-atlas');
    assert.ok(ids.includes('theme-signal'), 'expected theme-signal');
  });

  it('ignores non-theme CSS files like base.css', () => {
    const themes = listLibraryThemes(libRoot);
    const ids = themes.map(t => t.id);
    assert.ok(!ids.includes('base'), 'should not include base.css');
    assert.ok(!ids.includes('base.full'), 'should not include base.full.css');
  });

  it('returns each theme with a defaults object', () => {
    const themes = listLibraryThemes(libRoot);
    for (const theme of themes) {
      assert.ok(theme.defaults, 'expected defaults');
      assert.ok(typeof theme.defaults.headerVariant === 'string');
      assert.ok(typeof theme.defaults.navigationVariant === 'string');
      assert.ok(typeof theme.defaults.footerVariant === 'string');
    }
  });

  it('returns empty array when _assets/css does not exist', () => {
    const emptyDir = fs.mkdtempSync(path.join(tmpDir, 'empty-'));
    const themes = listLibraryThemes(emptyDir);
    assert.deepEqual(themes, []);
  });

  it('ignores non-theme-pattern files in themes/', () => {
    const fakeLib = fs.mkdtempSync(path.join(tmpDir, 'fake-lib-'));
    const themesDir = path.join(fakeLib, 'themes');
    fs.mkdirSync(themesDir, { recursive: true });
    fs.writeFileSync(path.join(themesDir, 'theme-custom.css'), '/* theme */', 'utf8');
    fs.writeFileSync(path.join(themesDir, 'theme-custom.js'), '// ignored', 'utf8');
    fs.writeFileSync(path.join(themesDir, 'base.css'), '/* base */', 'utf8');

    const themes = listLibraryThemes(fakeLib);
    assert.equal(themes.length, 1);
    assert.equal(themes[0].id, 'theme-custom');
  });
});

describe('getThemeDefaults', () => {
  it('returns known defaults for theme-atlas', () => {
    const defaults = getThemeDefaults('theme-atlas');
    assert.equal(defaults.headerVariant, 'line');
    assert.equal(defaults.navigationVariant, 'underline');
    assert.equal(defaults.footerVariant, 'contrast');
  });

  it('returns all-default for unknown theme', () => {
    const defaults = getThemeDefaults('theme-unknown-xyz');
    assert.equal(defaults.headerVariant, 'default');
    assert.equal(defaults.navigationVariant, 'default');
    assert.equal(defaults.footerVariant, 'default');
  });

  it('returns all-default for empty themeId', () => {
    const defaults = getThemeDefaults('');
    assert.equal(defaults.headerVariant, 'default');
  });
});

describe('THEME_DEFAULTS_BY_ID', () => {
  it('is frozen', () => {
    assert.ok(Object.isFrozen(THEME_DEFAULTS_BY_ID));
  });

  it('contains the 18 known themes', () => {
    assert.equal(Object.keys(THEME_DEFAULTS_BY_ID).length, 18);
  });
});
