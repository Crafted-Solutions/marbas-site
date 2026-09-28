/**
 * Smoke test: theme copy on preview start
 *
 * The development preview (webpack-watch, clean:false) never copied the theme
 * into the output. copyThemeToOutput — invoked by the orchestrator after the
 * first webpack compile — mirrors the production build's copyTheme() so the
 * preview shows the configured theme.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { copyThemeToOutput } from '../../src/theme/copy.js';
import { resolveBuildOutputPath } from '../../src/env/output-paths.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-preview-theme-'));
}

function makeProject(tmp, config = {}) {
  const projectPath = path.join(tmp, 'project');
  fs.mkdirSync(path.join(projectPath, 'pages'), { recursive: true });
  fs.writeFileSync(
    path.join(projectPath, 'marbas-project.json'),
    JSON.stringify({
      name: 'test',
      marbasSite: '1.0.0',
      paths: { buildDir: './build' },
      environments: { development: { outputName: 'development', env: {} } },
      ...config
    }, null, 2)
  );
  return projectPath;
}

function makeFakeLib(tmp) {
  const libRoot = path.join(tmp, 'lib');
  fs.mkdirSync(path.join(libRoot, 'themes'), { recursive: true });
  fs.writeFileSync(path.join(libRoot, 'themes', 'theme-bloom.css'), ':root { --t-bg: #fff; }');
  return libRoot;
}

test('copyThemeToOutput: writes theme.css to resolved output dir', () => {
  const tmp = makeTmpDir();
  try {
    const libRoot = makeFakeLib(tmp);
    const projectPath = makeProject(tmp, { theme: { id: 'theme-bloom' } });

    const result = copyThemeToOutput({ projectRoot: projectPath, libRoot, environment: 'development' });
    assert.equal(result.copied, true);
    assert.equal(result.themeId, 'theme-bloom');

    const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
    const outputPath = resolveBuildOutputPath({ projectRoot: projectPath, config, environment: 'development' });
    const themeCss = path.join(outputPath, '_assets', 'css', 'theme.css');

    assert.ok(fs.existsSync(themeCss), 'theme.css must exist in the output dir');
    assert.ok(fs.readFileSync(themeCss, 'utf8').includes('--t-bg'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('copyThemeToOutput: no theme.id is a no-op', () => {
  const tmp = makeTmpDir();
  try {
    const libRoot = makeFakeLib(tmp);
    const projectPath = makeProject(tmp);

    const result = copyThemeToOutput({ projectRoot: projectPath, libRoot, environment: 'development' });
    assert.equal(result.copied, false);

    const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
    const outputPath = resolveBuildOutputPath({ projectRoot: projectPath, config, environment: 'development' });
    const themeCss = path.join(outputPath, '_assets', 'css', 'theme.css');

    assert.ok(!fs.existsSync(themeCss), 'theme.css must not be written without a theme.id');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('copyThemeToOutput: unknown theme.id reports error, no crash', () => {
  const tmp = makeTmpDir();
  try {
    const libRoot = makeFakeLib(tmp);
    const projectPath = makeProject(tmp, { theme: { id: 'theme-nonexistent' } });

    const result = copyThemeToOutput({ projectRoot: projectPath, libRoot, environment: 'development' });
    assert.equal(result.copied, false);
    assert.match(result.error, /not found/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ─── web fonts (Task 119) ───────────────────────────────────
test('copyThemeToOutput: copies exactly the fonts the theme references', () => {
  const tmp = makeTmpDir();
  try {
    const libRoot = makeFakeLib(tmp);
    fs.writeFileSync(path.join(libRoot, 'themes', 'theme-slate.css'),
      "@font-face { font-family: 'Inter'; src: url('/_assets/fonts/inter/inter-latin.woff2') format('woff2'); }\n" +
      "@font-face { font-family: 'Inter'; src: url(\"/_assets/fonts/inter/inter-latin.woff2\"); }\n:root { --t-bg: #fff; }");
    fs.mkdirSync(path.join(libRoot, 'themes', 'fonts', 'inter'), { recursive: true });
    fs.mkdirSync(path.join(libRoot, 'themes', 'fonts', 'lato'), { recursive: true });
    fs.writeFileSync(path.join(libRoot, 'themes', 'fonts', 'inter', 'inter-latin.woff2'), 'woff2');
    fs.writeFileSync(path.join(libRoot, 'themes', 'fonts', 'lato', 'lato-latin.woff2'), 'woff2');
    const projectPath = makeProject(tmp, { theme: { id: 'theme-slate' } });

    const result = copyThemeToOutput({ projectRoot: projectPath, libRoot, environment: 'development' });
    assert.deepEqual(result.fonts, { copied: ['inter/inter-latin.woff2'], missing: [] });

    const config = JSON.parse(fs.readFileSync(path.join(projectPath, 'marbas-project.json'), 'utf8'));
    const out = resolveBuildOutputPath({ projectRoot: projectPath, config, environment: 'development' });
    assert.ok(fs.existsSync(path.join(out, '_assets', 'fonts', 'inter', 'inter-latin.woff2')));
    assert.ok(!fs.existsSync(path.join(out, '_assets', 'fonts', 'lato')), 'fonts of other themes must not be copied');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('copyThemeToOutput: project fonts win, unknown fonts are reported, no path traversal', () => {
  const tmp = makeTmpDir();
  try {
    const libRoot = makeFakeLib(tmp);
    const projectPath = makeProject(tmp, { theme: { id: 'theme-custom' } });
    fs.mkdirSync(path.join(projectPath, '_theme'), { recursive: true });
    fs.writeFileSync(path.join(projectPath, '_theme', 'theme-custom.css'),
      "@font-face { src: url('/_assets/fonts/own/own.woff2'); }\n" +
      "@font-face { src: url('/_assets/fonts/nowhere/x.woff2'); }\n" +
      "@font-face { src: url('/_assets/fonts/../../secret.woff2'); }\n" +
      "@font-face { src: url('/_assets/fonts/my%20font/r.woff2'); }");
    fs.mkdirSync(path.join(projectPath, '_assets', 'fonts', 'my font'), { recursive: true });
    fs.writeFileSync(path.join(projectPath, '_assets', 'fonts', 'my font', 'r.woff2'), 'mine');
    fs.mkdirSync(path.join(projectPath, '_assets', 'fonts', 'own'), { recursive: true });
    fs.writeFileSync(path.join(projectPath, '_assets', 'fonts', 'own', 'own.woff2'), 'mine');

    const result = copyThemeToOutput({ projectRoot: projectPath, libRoot, environment: 'development' });
    assert.equal(result.copied, true);
    assert.deepEqual(result.fonts, { copied: [], missing: ['nowhere/x.woff2'] });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('library themes: every referenced font file ships in themes/fonts', () => {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
  const themesDir = path.join(root, 'themes');
  let refs = 0;
  for (const file of fs.readdirSync(themesDir).filter((f) => /^theme-.*\.css$/.test(f))) {
    const css = fs.readFileSync(path.join(themesDir, file), 'utf8');
    assert.doesNotMatch(css, /fonts\.googleapis|@import/, `${file}: no external font loading`);
    for (const [, rel] of css.matchAll(/url\('\/_assets\/fonts\/([^']+)'\)/g)) {
      refs++;
      assert.ok(fs.existsSync(path.join(themesDir, 'fonts', rel)), `${file}: themes/fonts/${rel} fehlt`);
    }
  }
  assert.ok(refs > 0);
});
