import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { eject } from '../../src/eject/index.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-eject-'));
}

function makeLibRoot(tmp, files = {}) {
  const libRoot = path.join(tmp, 'lib');
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(libRoot, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return libRoot;
}

function makeProject(tmp) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(path.join(projectPath, '.marbas'), { recursive: true });
  return projectPath;
}

test('eject copies lib file into project', () => {
  const tmp = makeTmpDir();
  const libRoot = makeLibRoot(tmp, { '_includes/base.njk': 'lib-base' });
  const projectPath = makeProject(tmp);

  const result = eject({ projectPath, relativePath: '_includes/base.njk', libRoot });

  assert.equal(result.status, 'ejected');
  const dest = path.join(projectPath, '_includes', 'base.njk');
  assert.ok(fs.existsSync(dest));
  assert.equal(fs.readFileSync(dest, 'utf8'), 'lib-base');

  fs.rmSync(tmp, { recursive: true });
});

test('eject copies whole component directory', () => {
  const tmp = makeTmpDir();
  // Built-ins live in the lib at _includes/components/; ejecting remaps to the
  // project's _components/ (where the renderer reads overrides).
  const libRoot = makeLibRoot(tmp, {
    '_includes/components/Hero/Hero.njk': 'hero-template',
    '_includes/components/Hero/schema.json': '{}'
  });
  const projectPath = makeProject(tmp);

  const result = eject({ projectPath, relativePath: '_components/Hero', libRoot });

  assert.equal(result.status, 'ejected');
  assert.ok(fs.existsSync(path.join(projectPath, '_components', 'Hero', 'Hero.njk')));
  assert.ok(fs.existsSync(path.join(projectPath, '_components', 'Hero', 'schema.json')));

  fs.rmSync(tmp, { recursive: true });
});

test('eject accepts the lib _includes/components/ form and remaps to _components/', () => {
  const tmp = makeTmpDir();
  const libRoot = makeLibRoot(tmp, {
    '_includes/components/Hero/Hero.njk': 'hero-template'
  });
  const projectPath = makeProject(tmp);

  // User addresses the built-in by its lib path — destination is still _components/.
  const result = eject({ projectPath, relativePath: '_includes/components/Hero', libRoot });

  assert.equal(result.status, 'ejected');
  assert.ok(fs.existsSync(path.join(projectPath, '_components', 'Hero', 'Hero.njk')));
  assert.ok(!fs.existsSync(path.join(projectPath, '_includes', 'components', 'Hero')));

  fs.rmSync(tmp, { recursive: true });
});

test('eject remaps a theme from the lib themes/ dir to the project _theme/ dir', () => {
  const tmp = makeTmpDir();
  // Built-in themes live in the lib at themes/; project overrides resolve from
  // _theme/ (see src/theme/resolver.js). Ejecting must bridge that difference.
  const libRoot = makeLibRoot(tmp, {
    'themes/theme-bloom.css': ':root { --t-accent: #abc; }'
  });
  const projectPath = makeProject(tmp);

  const result = eject({ projectPath, relativePath: '_theme/theme-bloom.css', libRoot });

  assert.equal(result.status, 'ejected');
  const dest = path.join(projectPath, '_theme', 'theme-bloom.css');
  assert.ok(fs.existsSync(dest), 'theme should land in project _theme/');
  assert.equal(fs.readFileSync(dest, 'utf8'), ':root { --t-accent: #abc; }');
  assert.ok(!fs.existsSync(path.join(projectPath, 'themes')), 'must not write a themes/ dir');

  fs.rmSync(tmp, { recursive: true });
});

test('double eject returns already-ejected status', () => {
  const tmp = makeTmpDir();
  const libRoot = makeLibRoot(tmp, { '_includes/base.njk': 'lib-base' });
  const projectPath = makeProject(tmp);

  eject({ projectPath, relativePath: '_includes/base.njk', libRoot });
  const result = eject({ projectPath, relativePath: '_includes/base.njk', libRoot });

  assert.equal(result.status, 'already-ejected');

  fs.rmSync(tmp, { recursive: true });
});

test('eject without lib default returns error', () => {
  const tmp = makeTmpDir();
  const libRoot = makeLibRoot(tmp); // empty lib
  const projectPath = makeProject(tmp);

  const result = eject({ projectPath, relativePath: '_includes/base.njk', libRoot });

  assert.equal(result.status, 'error');
  assert.ok(result.message.includes('No lib default'));

  fs.rmSync(tmp, { recursive: true });
});

test('eject outside ejectable dirs returns error', () => {
  const tmp = makeTmpDir();
  const libRoot = makeLibRoot(tmp, { 'src/something.js': 'code' });
  const projectPath = makeProject(tmp);

  const result = eject({ projectPath, relativePath: 'src/something.js', libRoot });

  assert.equal(result.status, 'error');
  assert.ok(result.message.includes('not in an ejectable directory'));

  fs.rmSync(tmp, { recursive: true });
});

test('eject with missing relativePath returns error', () => {
  const tmp = makeTmpDir();
  const projectPath = makeProject(tmp);

  const result = eject({ projectPath, relativePath: '', libRoot: tmp });
  assert.equal(result.status, 'error');

  fs.rmSync(tmp, { recursive: true });
});
