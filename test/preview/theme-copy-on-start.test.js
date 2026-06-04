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
