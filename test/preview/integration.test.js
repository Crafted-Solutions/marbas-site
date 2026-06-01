/**
 * Preview pipeline smoke tests.
 *
 * Full HTTP integration (real webpack + eleventy + HTTP request) requires the
 * fixture project from Task 23. Until then these tests cover:
 * - setActiveTheme (atomic write)
 * - webpack-watch / eleventy-watch lifecycle with fake child processes
 * - orchestrator start → stop with injected fake bins
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { setActiveTheme } from '../../src/preview/theme.js';
import { startWebpackWatch } from '../../src/preview/webpack-watch.js';
import { startEleventyWatch } from '../../src/preview/eleventy-watch.js';
import { startPreview } from '../../src/preview/orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fake script: emits a "compiled successfully" line after a short delay then stays alive
const FAKE_WEBPACK_SCRIPT = path.join(__dirname, '_fake-webpack.mjs');
// Fake script: emits "Server at http://localhost:3001/" then stays alive
const FAKE_ELEVENTY_SCRIPT = path.join(__dirname, '_fake-eleventy.mjs');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-preview-'));
}

function writeHelperScripts() {
  fs.writeFileSync(FAKE_WEBPACK_SCRIPT, `
setTimeout(() => {
  process.stdout.write('webpack 5.x compiled successfully in 50 ms\\n');
}, 60);
setInterval(() => {}, 60000);
`);
  fs.writeFileSync(FAKE_ELEVENTY_SCRIPT, `
setTimeout(() => {
  process.stdout.write('[11ty] Server at http://localhost:3099/\\n');
}, 60);
setInterval(() => {}, 60000);
`);
}

function cleanHelperScripts() {
  try { fs.unlinkSync(FAKE_WEBPACK_SCRIPT); } catch {}
  try { fs.unlinkSync(FAKE_ELEVENTY_SCRIPT); } catch {}
}

// --- setActiveTheme ---

test('setActiveTheme writes theme.css atomically', () => {
  const tmp = makeTmpDir();

  // Project structure
  const cssDir = path.join(tmp, '_assets', 'css');
  fs.mkdirSync(cssDir, { recursive: true });
  fs.writeFileSync(path.join(cssDir, 'theme-ocean.css'), ':root { --color: blue; }');

  // Output dir
  const outputCssDir = path.join(tmp, 'build', 'public_development', '_assets', 'css');
  fs.mkdirSync(outputCssDir, { recursive: true });

  setActiveTheme({ projectPath: tmp, themeId: 'ocean', environment: 'development' });

  const written = fs.readFileSync(path.join(outputCssDir, 'theme.css'), 'utf8');
  assert.ok(written.includes('--color: blue'), 'theme.css should contain theme source');

  // No leftover .tmp file
  assert.ok(!fs.existsSync(path.join(outputCssDir, 'theme.css.tmp')), 'No .tmp file should remain');

  fs.rmSync(tmp, { recursive: true });
});

test('setActiveTheme throws when source theme file is missing', () => {
  const tmp = makeTmpDir();
  assert.throws(
    () => setActiveTheme({ projectPath: tmp, themeId: 'nonexistent', environment: 'development' }),
    /Theme file not found/
  );
  fs.rmSync(tmp, { recursive: true });
});

// --- webpack-watch lifecycle ---

test('startWebpackWatch returns handle with waitForFirstCompile and stop', async () => {
  writeHelperScripts();
  const tmp = makeTmpDir();

  const handle = startWebpackWatch({
    projectRoot: tmp,
    environment: 'development',
    binPath: FAKE_WEBPACK_SCRIPT
  });

  assert.equal(typeof handle.waitForFirstCompile, 'function');
  assert.equal(typeof handle.stop, 'function');
  assert.ok(handle.child, 'Should have a child process');

  await handle.waitForFirstCompile();
  handle.stop();

  fs.rmSync(tmp, { recursive: true });
  cleanHelperScripts();
});

// --- eleventy-watch lifecycle ---

test('startEleventyWatch returns handle with waitForReady and stop', async () => {
  writeHelperScripts();
  const tmp = makeTmpDir();

  const handle = startEleventyWatch({
    projectRoot: tmp,
    environment: 'development',
    port: 3099,
    binPath: FAKE_ELEVENTY_SCRIPT
  });

  assert.equal(typeof handle.waitForReady, 'function');
  assert.equal(typeof handle.stop, 'function');

  await handle.waitForReady();
  handle.stop();

  fs.rmSync(tmp, { recursive: true });
  cleanHelperScripts();
});

// --- orchestrator ---

test('startPreview orchestrates webpack then eleventy and returns stop handle', async () => {
  writeHelperScripts();
  const tmp = makeTmpDir();

  const logs = [];
  const handle = await startPreview({
    projectRoot: tmp,
    environment: 'development',
    port: 3099,
    onLog: (msg) => logs.push(msg),
    _bins: {
      webpack: FAKE_WEBPACK_SCRIPT,
      eleventy: FAKE_ELEVENTY_SCRIPT
    }
  });

  assert.equal(handle.port, 3099);
  assert.equal(typeof handle.stop, 'function');

  // Webpack compiled before eleventy started
  const webpackIdx = logs.findIndex((l) => l.includes('Webpack compiled.'));
  const eleventyIdx = logs.findIndex((l) => l.includes('Starting Eleventy'));
  assert.ok(webpackIdx !== -1, 'Should log webpack compiled');
  assert.ok(eleventyIdx !== -1, 'Should log starting eleventy');
  assert.ok(webpackIdx < eleventyIdx, 'Webpack must compile before Eleventy starts');

  assert.ok(logs.some((l) => l.includes('Ready at')), 'Should emit ready message');

  handle.stop();

  fs.rmSync(tmp, { recursive: true });
  cleanHelperScripts();
}, { timeout: 5000 });
