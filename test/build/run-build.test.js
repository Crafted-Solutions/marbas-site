import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { initProject as init } from '../../src/init/index.js';
import { BuildHandler } from '../../src/build/run-build.js';

function tmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-runbuild-'));
  fs.rmSync(dir, { recursive: true, force: true });
  return dir;
}

// A fully silent logger so the build subprocess noise stays out of the test
// output. Every BuildHandler logger method is a no-op; shouldLog stays falsy.
function silentLogger() {
  const noop = () => {};
  return {
    error: noop, warn: noop, info: noop, verbose: noop,
    buildStart: noop, buildStep: noop, buildSuccess: noop,
    buildWarning: noop, buildError: noop, envInfo: noop, buildSummary: noop,
    webpackStart: noop, webpackSuccess: noop, eleventyStart: noop, eleventySuccess: noop,
    shouldLog: () => false,
    setLevel: noop
  };
}

// --- Argument parsing -------------------------------------------------------

test('BuildHandler: parses --env, --optimize and --serve', () => {
  const handler = new BuildHandler({
    rootDir: process.cwd(),
    args: ['--env=development', '--optimize', '--serve'],
    logger: silentLogger()
  });
  assert.equal(handler.environment, 'development');
  assert.equal(handler.optimize, true);
  assert.equal(handler.serve, true);
});

test('BuildHandler: defaults optimize/serve to false', () => {
  const handler = new BuildHandler({
    rootDir: process.cwd(),
    args: ['--env=production'],
    logger: silentLogger()
  });
  assert.equal(handler.environment, 'production');
  assert.equal(handler.optimize, false);
  assert.equal(handler.serve, false);
});

test('BuildHandler: unknown environment exits with code 1', () => {
  const projectPath = tmpProject();
  try {
    init({ projectPath });
    const realExit = process.exit;
    let exitCode;
    process.exit = (code) => { exitCode = code; throw new Error('__exit__'); };
    try {
      // eslint-disable-next-line no-new
      new BuildHandler({ rootDir: projectPath, args: ['--env=ghost'], logger: silentLogger() });
      assert.fail('expected parseArguments to exit');
    } catch (err) {
      if (err.message !== '__exit__') throw err;
    } finally {
      process.exit = realExit;
    }
    assert.equal(exitCode, 1);
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('BuildHandler: missing --env exits with code 1', () => {
  const realExit = process.exit;
  let exitCode;
  process.exit = (code) => { exitCode = code; throw new Error('__exit__'); };
  try {
    // eslint-disable-next-line no-new
    new BuildHandler({ rootDir: process.cwd(), args: [], logger: silentLogger() });
    assert.fail('expected parseArguments to exit');
  } catch (err) {
    if (err.message !== '__exit__') throw err;
  } finally {
    process.exit = realExit;
  }
  assert.equal(exitCode, 1);
});

// --- Smoke: the app build path actually builds (was previously untested) -----

test('BuildHandler.run: builds a project, emits custom.bundle.css + theme.css', async () => {
  const projectPath = tmpProject();
  try {
    init({ projectPath });

    // Give the project a theme so theme.css must be emitted by the shared core.
    const configPath = path.join(projectPath, 'marbas-project.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.theme = { ...(config.theme || {}), id: 'theme-bloom' };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    const handler = new BuildHandler({
      rootDir: projectPath,
      args: ['--env=development', '--log-level=silent'],
      logger: silentLogger()
    });
    await handler.run();

    const cssDir = path.join(projectPath, 'build', 'public_development', '_assets', 'css');
    // Divergence #1: the app path now always produces custom.bundle.css.
    assert.ok(fs.existsSync(path.join(cssDir, 'custom.bundle.css')), 'custom.bundle.css missing on app path');
    assert.ok(fs.existsSync(path.join(cssDir, 'theme.css')), 'theme.css missing on app path');
    assert.ok(fs.existsSync(path.join(projectPath, 'build', 'public_development', 'index.html')), 'index.html missing');
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('BuildHandler.run: cleaning wipes the resolved output dir (divergence #2)', async () => {
  const projectPath = tmpProject();
  try {
    init({ projectPath });

    // Seed a stale artefact inside the *real* output path (build/public_development).
    const outDir = path.join(projectPath, 'build', 'public_development');
    fs.mkdirSync(outDir, { recursive: true });
    const stale = path.join(outDir, 'STALE.txt');
    fs.writeFileSync(stale, 'old');

    const handler = new BuildHandler({
      rootDir: projectPath,
      args: ['--env=development', '--log-level=silent'],
      logger: silentLogger()
    });
    await handler.run();

    assert.ok(!fs.existsSync(stale), 'stale file in real output dir was not cleaned');
    assert.ok(fs.existsSync(path.join(outDir, 'index.html')), 'output not rebuilt after clean');
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
