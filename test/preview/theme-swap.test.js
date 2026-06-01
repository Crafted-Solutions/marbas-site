/**
 * Smoke test: Theme-Hot-Swap via HTTP
 *
 * Validates that setActiveTheme atomically replaces theme.css in the output
 * directory and that an HTTP file server serving that directory immediately
 * returns the new theme content on the next request.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import { setActiveTheme } from '../../src/preview/theme.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-themeswap-'));
}

function startFileServer(rootDir) {
  const server = http.createServer((req, res) => {
    const filePath = path.join(rootDir, req.url.replace(/\?.*$/, ''));
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

function httpGet(port, urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${urlPath}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

function setupFixture(td) {
  const cssDir = path.join(td, '_assets', 'css');
  fs.mkdirSync(cssDir, { recursive: true });
  fs.writeFileSync(path.join(cssDir, 'theme-ocean.css'), ':root { --color: blue; --theme: ocean; }');
  fs.writeFileSync(path.join(cssDir, 'theme-sunset.css'), ':root { --color: orange; --theme: sunset; }');

  // Simulate initial build output: output dir already has a theme.css
  const outputCssDir = path.join(td, 'build', 'public_development', '_assets', 'css');
  fs.mkdirSync(outputCssDir, { recursive: true });
  fs.writeFileSync(path.join(outputCssDir, 'theme.css'), ':root { --color: blue; --theme: ocean; }');
}

test('setActiveTheme changes served theme.css content over HTTP', async () => {
  const td = makeTmpDir();
  let server;
  try {
    setupFixture(td);
    const outputDir = path.join(td, 'build', 'public_development');

    const { server: srv, port } = await startFileServer(outputDir);
    server = srv;

    // Initial theme
    const before = await httpGet(port, '/_assets/css/theme.css');
    assert.equal(before.status, 200);
    assert.ok(before.body.includes('ocean'), 'initial theme.css should be ocean');

    // Swap to sunset
    setActiveTheme({ projectPath: td, themeId: 'sunset', environment: 'development' });

    // Same URL now returns different content
    const after = await httpGet(port, '/_assets/css/theme.css');
    assert.equal(after.status, 200);
    assert.ok(after.body.includes('sunset'), 'theme.css should now be sunset');
    assert.ok(!after.body.includes('ocean'), 'ocean theme should be gone');
  } finally {
    if (server) server.close();
    fs.rmSync(td, { recursive: true, force: true });
  }
});

test('no leftover .tmp file after theme swap', () => {
  const td = makeTmpDir();
  try {
    setupFixture(td);
    setActiveTheme({ projectPath: td, themeId: 'sunset', environment: 'development' });

    const outputCssDir = path.join(td, 'build', 'public_development', '_assets', 'css');
    const tmpFile = path.join(outputCssDir, 'theme.css.tmp');
    assert.ok(!fs.existsSync(tmpFile), 'no .tmp file should remain after atomic rename');
  } finally {
    fs.rmSync(td, { recursive: true, force: true });
  }
});

test('multiple sequential swaps all succeed', () => {
  const td = makeTmpDir();
  try {
    setupFixture(td);
    const outputCssDir = path.join(td, 'build', 'public_development', '_assets', 'css');

    setActiveTheme({ projectPath: td, themeId: 'sunset', environment: 'development' });
    let content = fs.readFileSync(path.join(outputCssDir, 'theme.css'), 'utf8');
    assert.ok(content.includes('sunset'));

    setActiveTheme({ projectPath: td, themeId: 'ocean', environment: 'development' });
    content = fs.readFileSync(path.join(outputCssDir, 'theme.css'), 'utf8');
    assert.ok(content.includes('ocean'));

    setActiveTheme({ projectPath: td, themeId: 'sunset', environment: 'development' });
    content = fs.readFileSync(path.join(outputCssDir, 'theme.css'), 'utf8');
    assert.ok(content.includes('sunset'));
  } finally {
    fs.rmSync(td, { recursive: true, force: true });
  }
});
