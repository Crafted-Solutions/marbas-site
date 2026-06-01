import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveComponentPath } from '../../src/components/resolver.js';

const LIB_ROOT = path.resolve(import.meta.dirname, '..', '..');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-render-component-'));
}

describe('resolveComponentPath', () => {
  it('returns lib path when no project override exists', () => {
    const tmp = makeTmpDir();
    try {
      const result = resolveComponentPath('Hero', { projectRoot: tmp, libRoot: LIB_ROOT });
      assert.ok(result, 'should find Hero in lib');
      assert.ok(result.includes('Hero'), 'path should reference Hero');
      assert.ok(fs.existsSync(result), 'resolved path must exist on disk');
      assert.ok(result.includes(LIB_ROOT), 'should be the lib path when no project override');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it('returns project path when project override exists', () => {
    const tmp = makeTmpDir();
    try {
      const heroDir = path.join(tmp, '_components', 'Hero');
      fs.mkdirSync(heroDir, { recursive: true });
      const heroFile = path.join(heroDir, 'Hero.njk');
      fs.writeFileSync(heroFile, '<div>custom hero</div>');

      const result = resolveComponentPath('Hero', { projectRoot: tmp, libRoot: LIB_ROOT });
      assert.equal(result, heroFile, 'should prefer project override over lib');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it('returns null for unknown component type', () => {
    const tmp = makeTmpDir();
    try {
      const result = resolveComponentPath('NonExistentXyz', { projectRoot: tmp, libRoot: LIB_ROOT });
      assert.equal(result, null, 'should return null when component not found');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it('returns null for empty/falsy type', () => {
    const tmp = makeTmpDir();
    try {
      assert.equal(resolveComponentPath('', { projectRoot: tmp, libRoot: LIB_ROOT }), null);
      assert.equal(resolveComponentPath(null, { projectRoot: tmp, libRoot: LIB_ROOT }), null);
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });
});
