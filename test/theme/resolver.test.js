import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { resolveThemeFile } from '../../src/theme/resolver.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libRoot = path.join(__dirname, '../..');

let tmpDir;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-theme-resolver-'));
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('resolveThemeFile', () => {
  it('resolves a built-in lib theme', () => {
    const result = resolveThemeFile({ projectPath: tmpDir, themeId: 'theme-atlas', libRoot });
    assert.ok(result.includes('theme-atlas.css'));
    assert.ok(fs.existsSync(result));
  });

  it('project _theme/ override wins over lib', () => {
    const projectDir = fs.mkdtempSync(path.join(tmpDir, 'proj-'));
    const themeDir = path.join(projectDir, '_theme');
    fs.mkdirSync(themeDir);
    const overrideFile = path.join(themeDir, 'theme-atlas.css');
    fs.writeFileSync(overrideFile, '/* project override */', 'utf8');

    const result = resolveThemeFile({ projectPath: projectDir, themeId: 'theme-atlas', libRoot });
    assert.equal(result, overrideFile);
  });

  it('falls back to lib when no project override exists', () => {
    const projectDir = fs.mkdtempSync(path.join(tmpDir, 'proj-no-override-'));
    const result = resolveThemeFile({ projectPath: projectDir, themeId: 'theme-signal', libRoot });
    assert.ok(result.includes('themes'));
    assert.ok(fs.existsSync(result));
  });

  it('throws when themeId is empty', () => {
    assert.throws(() => resolveThemeFile({ projectPath: tmpDir, themeId: '', libRoot }), /empty/i);
  });

  it('throws when themeId does not start with theme-', () => {
    assert.throws(() => resolveThemeFile({ projectPath: tmpDir, themeId: 'custom-style', libRoot }), /invalid/i);
  });

  it('throws when themeId has invalid characters', () => {
    assert.throws(() => resolveThemeFile({ projectPath: tmpDir, themeId: 'theme-my style!', libRoot }), /invalid/i);
  });

  it('throws when theme not found anywhere', () => {
    assert.throws(
      () => resolveThemeFile({ projectPath: tmpDir, themeId: 'theme-nonexistent-xyz', libRoot }),
      /not found/i
    );
  });

  it('resolves correctly with no projectPath', () => {
    const result = resolveThemeFile({ themeId: 'theme-bloom', libRoot });
    assert.ok(fs.existsSync(result));
  });
});
