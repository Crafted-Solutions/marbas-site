/**
 * Preview start reads progress from the child processes' text output (Task 204).
 *
 * - Colour codes between the words ("compiled \e[1m\e[32msuccessfully…", as webpack-cli prints on Windows) must not
 *   hide the progress lines, and must not reach the log.
 * - The children run with NO_COLOR=1 (overridable via extraEnv).
 * - Eleventy ending before "Server at http" rejects — and no webpack watcher is left behind.
 *
 * Own fake scripts per test (in a temp dir) — integration.test.js uses fixed file names next to the tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripAnsi } from '../../src/preview/output-lines.js';
import { startEleventyWatch } from '../../src/preview/eleventy-watch.js';
import { startWebpackWatch } from '../../src/preview/webpack-watch.js';
import { startPreview } from '../../src/preview/orchestrator.js';

const ESC = '\u001b';
// The line from the owner's Windows log (Task 204), ESC characters restored
const COLOURED_COMPILED = `webpack 5.105.4 compiled ${ESC}[1m${ESC}[32msuccessfully${ESC}[39m${ESC}[22m in 315 ms`;
const COLOURED_READY = `${ESC}[90m[11ty]${ESC}[39m Server at ${ESC}[36mhttp://localhost:3199/${ESC}[39m`;

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-start-output-'));
}

// Every fake writes its pid here; afterEach kills what is still alive — also when an assertion failed or a start hung.
const startedPids = [];
test.afterEach(() => {
  for (const pid of startedPids.splice(0)) {
    try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
  }
});

/** Fake child: prints `lines` (JSON strings, so ESC survives), then stays alive or exits with `exitCode`. */
function fakeScript(dir, name, { lines = [], exitCode = null, pidFile = path.join(dir, `${name}.pid`) } = {}) {
  const file = path.join(dir, `${name}.mjs`);
  trackPid(pidFile);
  fs.writeFileSync(file, `
import fs from 'node:fs';
fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));
setTimeout(() => {
  process.stdout.write(${JSON.stringify(lines.map((line) => `${line}\n`).join(''))}.replace(/\\{NO_COLOR\\}/g, String(process.env.NO_COLOR)));
  ${exitCode === null ? 'setInterval(() => {}, 60000);' : `process.exit(${exitCode});`}
}, 30);
`);
  return file;
}

/** Remember the pid once the fake has written it (the file exists only after spawn). */
function trackPid(pidFile) {
  const read = () => {
    try { startedPids.push(Number(fs.readFileSync(pidFile, 'utf8'))); return true; } catch { return false; }
  };
  const timer = setInterval(() => { if (read()) clearInterval(timer); }, 10);
  timer.unref();
}

function isAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function waitUntil(check, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return check();
}

test('stripAnsi removes colour and OSC sequences, keeps plain text', () => {
  assert.equal(stripAnsi(COLOURED_COMPILED), 'webpack 5.105.4 compiled successfully in 315 ms');
  assert.equal(stripAnsi(COLOURED_READY), '[11ty] Server at http://localhost:3199/');
  assert.equal(stripAnsi(`${ESC}]8;;https://example.org${ESC}\\link${ESC}]8;;${ESC}\\`), 'link');
  assert.equal(stripAnsi(`${ESC}(Bplain${ESC}7 text${ESC}8`), 'plain text');
  assert.equal(stripAnsi('\u009b32mgreen\u009b0m'), 'green');
  assert.equal(stripAnsi('[11ty] Wrote 4 files — äöü [ok]'), '[11ty] Wrote 4 files — äöü [ok]');
});

test('startPreview: coloured webpack line still counts as compiled, log is clean', async () => {
  const dir = tmpDir();
  const logs = [];
  try {
    const handle = await startPreview({
      projectRoot: dir,
      environment: 'development',
      port: 3199,
      onLog: (line) => logs.push(line),
      _bins: {
        webpack: fakeScript(dir, 'webpack', { lines: [COLOURED_COMPILED] }),
        eleventy: fakeScript(dir, 'eleventy', { lines: ['[11ty] Server at http://localhost:3199/'] })
      }
    });
    handle.stop();
    assert.ok(logs.some((line) => line.includes('Webpack compiled.')), logs.join('\n'));
    assert.ok(logs.some((line) => line.includes('compiled successfully in 315 ms')), logs.join('\n'));
    assert.ok(!logs.some((line) => line.includes(ESC)), 'no ESC character may reach the log');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 5000 });

test('startEleventyWatch: coloured ready line fulfils waitForReady', async () => {
  const dir = tmpDir();
  try {
    const handle = startEleventyWatch({
      projectRoot: dir,
      environment: 'development',
      port: 3199,
      binPath: fakeScript(dir, 'eleventy', { lines: [COLOURED_READY] })
    });
    await handle.waitForReady();
    handle.stop();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 5000 });

test('children see NO_COLOR=1, extraEnv can override it', async () => {
  const dir = tmpDir();
  try {
    const seen = async (extraEnv) => {
      const lines = [];
      const handle = startWebpackWatch({
        projectRoot: dir,
        environment: 'development',
        extraEnv,
        binPath: fakeScript(dir, 'webpack-env', { lines: ['NO_COLOR={NO_COLOR}', 'compiled successfully'] }),
        onLog: (line) => lines.push(line)
      });
      await handle.waitForFirstCompile();
      handle.stop();
      return lines.find((line) => line.startsWith('NO_COLOR='));
    };
    assert.equal(await seen({}), 'NO_COLOR=1');
    assert.equal(await seen({ NO_COLOR: '0' }), 'NO_COLOR=0');

    const lines = [];
    const eleventy = startEleventyWatch({
      projectRoot: dir,
      environment: 'development',
      port: 3199,
      binPath: fakeScript(dir, 'eleventy-env', { lines: ['NO_COLOR={NO_COLOR}', 'Server at http://localhost:3199/'] }),
      onLog: (line) => lines.push(line)
    });
    await eleventy.waitForReady();
    eleventy.stop();
    assert.ok(lines.includes('NO_COLOR=1'), lines.join('\n'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 5000 });

test('startPreview: Eleventy exiting before ready rejects and stops webpack', async () => {
  const dir = tmpDir();
  const pidFile = path.join(dir, 'webpack.pid');
  const logs = [];
  try {
    await assert.rejects(
      startPreview({
        projectRoot: dir,
        environment: 'development',
        port: 3199,
        onLog: (line) => logs.push(line),
        _bins: {
          webpack: fakeScript(dir, 'webpack', { lines: ['compiled successfully'], pidFile }),
          eleventy: fakeScript(dir, 'eleventy', { lines: ['[11ty] Problem writing Eleventy templates'], exitCode: 1 })
        }
      }),
      /Eleventy exited \(code 1\) before server was ready/
    );
    const pid = Number(fs.readFileSync(pidFile, 'utf8'));
    assert.ok(await waitUntil(() => !isAlive(pid)), 'webpack watcher must not keep running');
    assert.ok(logs.some((line) => line.includes('Eleventy exited (code 1)')), logs.join('\n'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 5000 });

test('startEleventyWatch: waitForReady after Eleventy already exited rejects at once', async () => {
  const dir = tmpDir();
  try {
    const handle = startEleventyWatch({
      projectRoot: dir,
      environment: 'development',
      port: 3199,
      binPath: fakeScript(dir, 'eleventy', { exitCode: 3 })
    });
    await new Promise((resolve) => handle.child.once('close', resolve));
    await assert.rejects(handle.waitForReady(), /Eleventy exited \(code 3\) before server was ready/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 5000 });

test('startEleventyWatch: ended by a signal names the signal, not "code null"', async () => {
  const dir = tmpDir();
  try {
    const handle = startEleventyWatch({
      projectRoot: dir,
      environment: 'development',
      port: 3199,
      binPath: fakeScript(dir, 'eleventy')
    });
    const rejected = assert.rejects(handle.waitForReady(), /Eleventy exited \(signal SIGTERM\) before server was ready/);
    handle.stop();
    await rejected;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 5000 });
