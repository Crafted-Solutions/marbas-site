import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { MarbasResolver } from '../../src/render/nunjucks-resolver.js';

const LIB_ROOT = path.resolve(import.meta.dirname, '..', '..');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-njk-resolver-'));
}

function writeFile(base, rel, content = '<p>{{ title }}</p>') {
  const full = path.join(base, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

describe('MarbasResolver', () => {
  describe('getSource — project-first lookup', () => {
    it('returns lib file when no project override', () => {
      const tmp = makeTmpDir();
      try {
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        const result = resolver.getSource('base.njk');
        assert.ok(result, 'should find base.njk in lib');
        assert.ok(result.src.length > 0, 'src should not be empty');
        assert.ok(result.path.includes(LIB_ROOT), 'path should be inside lib');
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });

    it('prefers project file over lib file', () => {
      const tmp = makeTmpDir();
      try {
        const projectFile = writeFile(tmp, '_includes/base.njk', '<custom>{{ title }}</custom>');
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        const result = resolver.getSource('base.njk');
        assert.ok(result, 'should find base.njk');
        assert.equal(result.path, projectFile, 'should use project override');
        assert.ok(result.src.includes('<custom>'), 'src should be project version');
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });

    it('returns null for unknown template', () => {
      const tmp = makeTmpDir();
      try {
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        const result = resolver.getSource('nonexistent-xyz.njk');
        assert.equal(result, null);
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });

    it('records path in pathsToNames for cache invalidation', () => {
      const tmp = makeTmpDir();
      try {
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        resolver.getSource('base.njk');
        const names = Object.values(resolver.pathsToNames);
        assert.ok(names.includes('base.njk'), 'pathsToNames should record the logical name');
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });
  });

  describe('resolve — relative path handling', () => {
    it('passes through non-relative names unchanged', () => {
      const tmp = makeTmpDir();
      try {
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        assert.equal(resolver.resolve('header/presets/brand-nav.njk', 'base.njk'), 'base.njk');
        assert.equal(resolver.resolve('any/from.njk', 'footer/presets/columns.njk'), 'footer/presets/columns.njk');
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });

    it('resolves ./relative from lib includes path to logical name', () => {
      const tmp = makeTmpDir();
      try {
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        const from = path.join(LIB_ROOT, '_includes', 'header', 'presets', 'brand-nav.njk');
        const resolved = resolver.resolve(from, './slots/nav.njk');
        assert.equal(resolved, path.normalize('header/presets/slots/nav.njk'));
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });

    it('resolves ./relative from project includes path to logical name', () => {
      const tmp = makeTmpDir();
      try {
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        const from = path.join(tmp, '_includes', 'header', 'presets', 'brand-nav.njk');
        const resolved = resolver.resolve(from, './slots/nav.njk');
        assert.equal(resolved, path.normalize('header/presets/slots/nav.njk'));
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });

    it('resolves ../relative path correctly', () => {
      const tmp = makeTmpDir();
      try {
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        const from = path.join(LIB_ROOT, '_includes', 'footer', 'slots', 'bottom.njk');
        const resolved = resolver.resolve(from, '../presets/columns.njk');
        assert.equal(resolved, path.normalize('footer/presets/columns.njk'));
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });
  });

  describe('getSource — absolute path (from relative resolve)', () => {
    it('returns file for absolute path that exists', () => {
      const tmp = makeTmpDir();
      try {
        const file = writeFile(tmp, '_includes/mypartial.njk', '<partial/>');
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        const result = resolver.getSource(file);
        assert.ok(result, 'should load absolute path');
        assert.equal(result.path, file);
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });

    it('returns null for absolute path that does not exist', () => {
      const tmp = makeTmpDir();
      try {
        const resolver = new MarbasResolver({ projectRoot: tmp, libRoot: LIB_ROOT });
        const result = resolver.getSource('/nonexistent/path/to/file.njk');
        assert.equal(result, null);
      } finally {
        fs.rmSync(tmp, { recursive: true });
      }
    });
  });
});
