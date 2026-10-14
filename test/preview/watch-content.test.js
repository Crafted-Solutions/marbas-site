/**
 * Eleventy watch must rebuild with the NEW page content (Task 196).
 *
 * Real Eleventy, real project, lib outside the project. Without src/preview/eleventy-watch-fix.js Eleventy
 * 3.1.2+ reports the change relative to the common parent folder and rewrites the old content — "Wrote 4 files"
 * alone proves nothing, so every case checks a marker in the output HTML.
 *
 * This test is also the guard for Eleventy updates: if the internals the fix relies on change, it goes red.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initProject } from '../../src/init/index.js';
import { startEleventyWatch } from '../../src/preview/eleventy-watch.js';
import {
  applyEleventyWatchFix,
  findRunningEleventy,
  isAffectedEleventyVersion,
  isWatchRun
} from '../../src/preview/eleventy-watch-fix.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB_ROOT = path.resolve(__dirname, '../..');
const CONFIG_PATH = path.join(LIB_ROOT, 'tm.eleventy.js');
// Inside the repo, but the lib is still "outside the project": dir.includes resolves to ../../../_includes.
const WORK_ROOT = path.join(LIB_ROOT, 'test', '.tmp');
const PAGE = path.join('pages', 'ueber-uns.md');
const OUTPUT = path.join('build', 'public_development', 'ueber-uns', 'index.html');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(check, { timeoutMs = 15000, stepMs = 100 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, stepMs));
  }
  return check();
}

/** Starter project + running `eleventy --serve`; `stop()` waits until the process is gone. */
async function startWatchedProject(parentDir) {
  fs.mkdirSync(parentDir, { recursive: true });
  const projectRoot = fs.mkdtempSync(path.join(parentDir, 'watch-'));
  try {
    initProject({ projectPath: projectRoot, name: 'Watch', starter: true, force: true });
  } catch (error) {
    fs.rmSync(projectRoot, { recursive: true, force: true });
    throw error;
  }

  const lines = [];
  const handle = startEleventyWatch({
    projectRoot,
    environment: 'development',
    port: await freePort(),
    configPath: CONFIG_PATH,
    extraEnv: { NO_COLOR: '1' },
    onLog: (line) => lines.push(line)
  });
  const closed = new Promise((resolve) => handle.child.once('close', resolve));

  async function stop() {
    handle.stop();
    await closed;
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }

  let timer;
  const ready = await Promise.race([
    handle.waitForReady().then(() => true),
    closed.then(() => false),
    new Promise((resolve) => { timer = setTimeout(() => resolve(false), 30000); })
  ]);
  clearTimeout(timer);
  if (!ready) {
    await stop();
    throw new Error(`Eleventy did not become ready:\n${lines.join('\n')}`);
  }
  return { projectRoot, lines, stop };
}

function setTitle(projectRoot, title) {
  const file = path.join(projectRoot, PAGE);
  const source = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, source.replace(/^title:.*$/m, `title: ${title}`));
}

function output(projectRoot) {
  try { return fs.readFileSync(path.join(projectRoot, OUTPUT), 'utf8'); } catch { return ''; }
}

async function assertPageChangeArrives(parentDir) {
  const project = await startWatchedProject(parentDir);
  try {
    assert.ok(!output(project.projectRoot).includes('MARKER196'), 'marker must not be there before the change');
    setTitle(project.projectRoot, 'MARKER196');

    const arrived = await waitFor(() => output(project.projectRoot).includes('MARKER196'));
    const log = project.lines.join('\n');
    assert.ok(arrived, `output still has the old content after the rebuild:\n${log}`);
    assert.match(log, /File changed: \.\/pages\/ueber-uns\.md/, 'changed path must be relative to the project');
  } finally {
    await project.stop();
  }
}

test('watch: a page change reaches the output (lib outside the project)', async () => {
  await assertPageChangeArrives(WORK_ROOT);
});

test('watch: a page change reaches the output (project below a symlinked path, os.tmpdir)', async () => {
  await assertPageChangeArrives(os.tmpdir());
});

test('watch: a change to a lib template still triggers a rebuild', async () => {
  const project = await startWatchedProject(WORK_ROOT);
  try {
    const builds = () => project.lines.filter((line) => /Wrote \d+ files?/.test(line)).length;
    const before = builds();
    const template = path.join(LIB_ROOT, '_includes', 'base.njk');
    const now = new Date();
    fs.utimesSync(template, now, now); // content untouched — the watcher reacts to the mtime

    assert.ok(await waitFor(() => builds() > before), `no rebuild after touching a lib template:\n${project.lines.join('\n')}`);
  } finally {
    await project.stop();
  }
});

// --- eleventy-watch-fix: guards ---

test('isAffectedEleventyVersion: 3.1.2 up to 4.0.0', () => {
  for (const version of ['3.1.2', '3.1.5', '3.1.6', '3.1.6-beta.1', '3.2.0']) {
    assert.equal(isAffectedEleventyVersion(version), true, version);
  }
  for (const version of ['3.0.0', '3.1.0', '3.1.1', '3.1.2-beta.4', '4.0.0', '4.0.0-alpha.10', '2.0.1', '', undefined]) {
    assert.equal(isAffectedEleventyVersion(version), false, String(version));
  }
});

test('isWatchRun: --serve / --watch or ELEVENTY_RUN_MODE', () => {
  assert.equal(isWatchRun({ argv: ['node', 'cmd.cjs', '--serve'], env: {} }), true);
  assert.equal(isWatchRun({ argv: ['node', 'cmd.cjs', '--watch'], env: {} }), true);
  assert.equal(isWatchRun({ argv: ['node', 'cmd.cjs'], env: { ELEVENTY_RUN_MODE: 'serve' } }), true);
  assert.equal(isWatchRun({ argv: ['node', 'cmd.cjs'], env: { ELEVENTY_RUN_MODE: 'build' } }), false);
  assert.equal(isWatchRun({ argv: ['node', 'cmd.cjs', '--dryrun'], env: {} }), false);
});

function fakeEleventy(version) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-fake-eleventy-'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: '@11ty/eleventy', version }));
  fs.writeFileSync(path.join(root, 'cmd.cjs'), '');
  return { root, argv: ['node', path.join(root, 'cmd.cjs'), '--serve'] };
}

test('applyEleventyWatchFix: build runs are left alone', async () => {
  const result = await applyEleventyWatchFix({ argv: ['node', 'cmd.cjs'], env: {} });
  assert.deepEqual(result, { applied: false, reason: 'not-watch' });
});

test('applyEleventyWatchFix: uses the running Eleventy and skips unaffected versions', async () => {
  const fake = fakeEleventy('3.1.1');
  try {
    assert.deepEqual(findRunningEleventy({ argv: fake.argv }), { root: fs.realpathSync(fake.root), version: '3.1.1' });
    const result = await applyEleventyWatchFix({ argv: fake.argv, env: {} });
    assert.deepEqual(result, { applied: false, reason: 'version-not-affected', version: '3.1.1' });
  } finally {
    fs.rmSync(fake.root, { recursive: true, force: true });
  }
});

test('applyEleventyWatchFix: a host that does not start Eleventy through its CLI gets a warning, no patch', async () => {
  const messages = [];
  const result = await applyEleventyWatchFix({
    argv: ['node', path.join(LIB_ROOT, 'src', 'cli', 'bin.js')],
    env: { ELEVENTY_RUN_MODE: 'serve' },
    log: (message) => messages.push(message)
  });
  assert.deepEqual(result, { applied: false, reason: 'eleventy-not-found' });
  assert.equal(messages.length, 1);
});

test('applyEleventyWatchFix: changed internals are reported, not thrown', async () => {
  const fake = fakeEleventy('3.1.9'); // affected range, but no src/Util/GlobRemap.js
  const messages = [];
  try {
    const result = await applyEleventyWatchFix({ argv: fake.argv, env: {}, log: (message) => messages.push(message) });
    assert.equal(result.applied, false);
    assert.equal(result.reason, 'internals-changed');
    assert.equal(messages.length, 1);
    assert.match(messages[0], /watch path fix could not be applied/);
  } finally {
    fs.rmSync(fake.root, { recursive: true, force: true });
  }
});

test.after(() => {
  // remove the scratch folder when no project is left in it
  try { fs.rmdirSync(WORK_ROOT); } catch { /* not empty or already gone */ }
});
