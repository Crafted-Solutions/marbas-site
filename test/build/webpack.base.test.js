import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getCustomJsEntry } from '../../src/build/webpack/base.js';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removePath(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

test('getCustomJsEntry includes component JS and CSS after asset JS in sorted order', () => {
  // Fully isolated: a temp project (source of assets + components) and a temp
  // lib (empty built-ins) so nothing is written into the tracked package tree.
  const projectRoot = makeTempDir('marbas-customjs-project-');
  const libRoot = makeTempDir('marbas-customjs-lib-');
  fs.mkdirSync(path.join(libRoot, '_includes', 'components'), { recursive: true });

  const assetsDir = path.join(projectRoot, '_assets', 'js');
  const libAssetsDir = path.join(assetsDir, '_lib');
  const componentAlpha = 'Alpha';
  const componentZeta = 'Zeta';
  const componentAlphaDir = path.join(projectRoot, '_components', componentAlpha);
  const componentZetaDir = path.join(projectRoot, '_components', componentZeta);

  fs.mkdirSync(libAssetsDir, { recursive: true });
  fs.mkdirSync(componentAlphaDir, { recursive: true });
  fs.mkdirSync(componentZetaDir, { recursive: true });
  fs.writeFileSync(path.join(assetsDir, 'a.js'), '// asset a\n', 'utf8');
  fs.writeFileSync(path.join(assetsDir, 'z.js'), '// asset z\n', 'utf8');
  fs.writeFileSync(path.join(libAssetsDir, 'ignored.js'), '// ignored\n', 'utf8');
  fs.writeFileSync(path.join(componentAlphaDir, `${componentAlpha}.js`), '// component alpha\n', 'utf8');
  fs.writeFileSync(path.join(componentZetaDir, `${componentZeta}.js`), '// component zeta\n', 'utf8');
  fs.writeFileSync(path.join(componentAlphaDir, `${componentAlpha}.css`), '.alpha {}\n', 'utf8');
  fs.writeFileSync(path.join(componentZetaDir, `${componentZeta}.css`), '.zeta {}\n', 'utf8');

  try {
    assert.equal(
      getCustomJsEntry({ projectRoot, libRoot }),
      './_webpack/custom-js-entry.js'
    );

    const content = fs.readFileSync(path.join(projectRoot, '_webpack', 'custom-js-entry.js'), 'utf8');
    const lines = content.split('\n');

    const assetALine = `import '../_assets/js/a.js';`;
    const assetZLine = `import '../_assets/js/z.js';`;
    const ignoredLibLine = `import '../_assets/js/_lib/ignored.js';`;
    const componentAlphaJsLine = `import '../_components/${componentAlpha}/${componentAlpha}.js';`;
    const componentZetaJsLine = `import '../_components/${componentZeta}/${componentZeta}.js';`;
    const componentAlphaCssLine = `import '../_components/${componentAlpha}/${componentAlpha}.css';`;
    const componentZetaCssLine = `import '../_components/${componentZeta}/${componentZeta}.css';`;

    assert.ok(lines.includes(assetALine), 'Should include asset A');
    assert.ok(lines.includes(assetZLine), 'Should include asset Z');
    assert.ok(lines.includes(componentAlphaJsLine), 'Should include alpha JS');
    assert.ok(lines.includes(componentZetaJsLine), 'Should include zeta JS');
    assert.ok(lines.includes(componentAlphaCssLine), 'Should include alpha CSS');
    assert.ok(lines.includes(componentZetaCssLine), 'Should include zeta CSS');
    assert.ok(!lines.includes(ignoredLibLine), 'Should NOT include _lib JS');

    assert.ok(lines.indexOf(assetALine) < lines.indexOf(assetZLine), 'asset A before Z');
    assert.ok(lines.indexOf(assetZLine) < lines.indexOf(componentAlphaJsLine), 'asset JS before component JS');
    assert.ok(lines.indexOf(componentAlphaJsLine) < lines.indexOf(componentZetaJsLine), 'alpha before zeta JS');
    assert.ok(lines.indexOf(componentZetaJsLine) < lines.indexOf(componentAlphaCssLine), 'component JS before CSS');
    assert.ok(lines.indexOf(componentAlphaCssLine) < lines.indexOf(componentZetaCssLine), 'alpha before zeta CSS');
  } finally {
    removePath(projectRoot);
    removePath(libRoot);
  }
});

test('getCustomJsEntry — project component overrides lib component of same name', () => {
  const projectRoot = makeTempDir('marbas-override-project-');
  const libRoot = makeTempDir('marbas-override-lib-');
  const componentName = 'Hero';

  // Lib built-in component lives under _includes/components/ (idiomatic Eleventy).
  const libComponentDir = path.join(libRoot, '_includes', 'components', componentName);
  // Same-named project component must win and exclude the lib variant.
  const projectComponentDir = path.join(projectRoot, '_components', componentName);

  fs.mkdirSync(libComponentDir, { recursive: true });
  fs.writeFileSync(path.join(libComponentDir, `${componentName}.js`), '// lib hero\n', 'utf8');
  fs.writeFileSync(path.join(libComponentDir, `${componentName}.css`), '.lib-hero {}\n', 'utf8');

  fs.mkdirSync(projectComponentDir, { recursive: true });
  fs.writeFileSync(path.join(projectComponentDir, `${componentName}.js`), '// project hero\n', 'utf8');

  try {
    getCustomJsEntry({ projectRoot, libRoot });

    const content = fs.readFileSync(path.join(projectRoot, '_webpack', 'custom-js-entry.js'), 'utf8');
    const lines = content.split('\n');

    const projectLine = `import '../_components/${componentName}/${componentName}.js';`;

    assert.ok(lines.includes(projectLine), 'Should include project component JS');
    // The lib component lives in the temp lib's _includes/components/; since the
    // project overrides the same name, no import should point into the lib root.
    assert.ok(
      !lines.some((l) => l.includes(libRoot.replace(/\\/g, '/'))),
      'Should NOT include any lib component path'
    );
    // Specifically the lib CSS variant must be excluded (project has no CSS).
    assert.ok(
      !lines.some((l) => l.endsWith(`${componentName}.css';`)),
      'Should NOT include lib component CSS when overridden'
    );
  } finally {
    removePath(projectRoot);
    removePath(libRoot);
  }
});
