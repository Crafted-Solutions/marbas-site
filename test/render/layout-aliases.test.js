import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerLayoutAliases } from '../../src/render/layout-aliases.js';

const LIB_ROOT = path.resolve(import.meta.dirname, '..', '..');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-layout-aliases-'));
}

function makeConfig() {
  const aliases = {};
  return {
    addLayoutAlias: (name, target) => { aliases[name] = target; },
    aliases,
  };
}

describe('registerLayoutAliases', () => {
  it('registers base layout alias pointing to lib _includes/base.njk', () => {
    const tmp = makeTmpDir();
    try {
      const config = makeConfig();
      registerLayoutAliases(config, { projectRoot: tmp, libRoot: LIB_ROOT });

      assert.ok('base' in config.aliases, 'should register "base" alias');
      assert.ok(config.aliases.base.includes('base.njk'), 'alias should point to base.njk');
      // alias is relative to <libRoot>/_includes — resolve to verify it exists
      const absPath = path.resolve(path.join(LIB_ROOT, '_includes'), config.aliases.base);
      assert.ok(fs.existsSync(absPath), 'aliased path must exist on disk');
      // relative to _includes means it does NOT contain the full libRoot prefix
      assert.ok(!path.isAbsolute(config.aliases.base), 'alias should be a relative path');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it('prefers project _layouts/base.njk over lib version', () => {
    const tmp = makeTmpDir();
    try {
      const layoutsDir = path.join(tmp, '_layouts');
      fs.mkdirSync(layoutsDir, { recursive: true });
      const projectBase = path.join(layoutsDir, 'base.njk');
      fs.writeFileSync(projectBase, '{% block content %}{% endblock %}');

      const config = makeConfig();
      registerLayoutAliases(config, { projectRoot: tmp, libRoot: LIB_ROOT });

      // alias is relative to <libRoot>/_includes; resolve to compare
      const absAlias = path.resolve(path.join(LIB_ROOT, '_includes'), config.aliases.base);
      assert.equal(absAlias, projectBase, 'should use project override');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it('registers layouts from lib _layouts/ if they exist', () => {
    const tmp = makeTmpDir();
    const tmpLib = makeTmpDir();
    try {
      // Create a fake lib with _layouts/custom.njk
      const libLayouts = path.join(tmpLib, '_layouts');
      const libIncludes = path.join(tmpLib, '_includes');
      fs.mkdirSync(libLayouts, { recursive: true });
      fs.mkdirSync(libIncludes, { recursive: true });
      fs.writeFileSync(path.join(libLayouts, 'custom.njk'), '<custom/>');

      const config = makeConfig();
      registerLayoutAliases(config, { projectRoot: tmp, libRoot: tmpLib });

      assert.ok('custom' in config.aliases, 'should register layout from _layouts/');
      // alias is relative to tmpLib/_includes — resolve to verify it points into _layouts/
      const absCustom = path.resolve(path.join(tmpLib, '_includes'), config.aliases.custom);
      assert.ok(absCustom.includes('_layouts'), 'should point to lib _layouts/');
    } finally {
      fs.rmSync(tmp, { recursive: true });
      fs.rmSync(tmpLib, { recursive: true });
    }
  });

  it('prefers project _includes/base.njk over lib (eject convention)', () => {
    const tmp = makeTmpDir();
    try {
      const includesDir = path.join(tmp, '_includes');
      fs.mkdirSync(includesDir, { recursive: true });
      const projectBase = path.join(includesDir, 'base.njk');
      fs.writeFileSync(projectBase, '{% block content %}{% endblock %}');

      const config = makeConfig();
      registerLayoutAliases(config, { projectRoot: tmp, libRoot: LIB_ROOT });

      const absAlias = path.resolve(path.join(LIB_ROOT, '_includes'), config.aliases.base);
      assert.equal(absAlias, projectBase, 'should use ejected override from _includes/');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it('does not register the same layout name twice', () => {
    const tmp = makeTmpDir();
    const tmpLib = makeTmpDir();
    try {
      // lib has base.njk in both _layouts/ and _includes/
      const libLayouts = path.join(tmpLib, '_layouts');
      const libIncludes = path.join(tmpLib, '_includes');
      fs.mkdirSync(libLayouts, { recursive: true });
      fs.mkdirSync(libIncludes, { recursive: true });
      fs.writeFileSync(path.join(libLayouts, 'base.njk'), '<from-layouts/>');
      fs.writeFileSync(path.join(libIncludes, 'base.njk'), '<from-includes/>');

      const calls = [];
      const config = {
        addLayoutAlias: (name, target) => calls.push({ name, target }),
        aliases: {},
      };

      registerLayoutAliases(config, { projectRoot: tmp, libRoot: tmpLib });

      const baseCalls = calls.filter(c => c.name === 'base');
      assert.equal(baseCalls.length, 1, 'base should be registered exactly once');
      // _layouts/ takes precedence over _includes/
      assert.ok(baseCalls[0].target.includes('_layouts'), '_layouts/ should win over _includes/');
    } finally {
      fs.rmSync(tmp, { recursive: true });
      fs.rmSync(tmpLib, { recursive: true });
    }
  });
});
