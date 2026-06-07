import test from 'node:test';
import assert from 'node:assert/strict';
import { withLogger, createConsoleLogger, LOGGER_CONTRACT } from '../../src/logger.js';

const CONTRACT_METHODS = Object.keys(LOGGER_CONTRACT);

test('createConsoleLogger implements every contract method (drift guard)', () => {
  const log = createConsoleLogger();
  for (const method of CONTRACT_METHODS) {
    assert.equal(typeof log[method], 'function', `createConsoleLogger missing ${method}`);
  }
});

test('withLogger({}) returns a logger where all contract methods are callable', () => {
  const log = withLogger({});
  for (const method of CONTRACT_METHODS) {
    assert.equal(typeof log[method], 'function', `normalized logger missing ${method}`);
    // none of them must throw when invoked
    assert.doesNotThrow(() => log[method]('x', 'y'));
  }
});

test('withLogger(undefined) falls back to the console logger', () => {
  const log = withLogger(undefined);
  for (const method of CONTRACT_METHODS) {
    assert.equal(typeof log[method], 'function');
  }
});

test('partial logger: build* output methods route to info', () => {
  const infoCalls = [];
  const errorCalls = [];
  const partial = {
    info: (...a) => infoCalls.push(a),
    error: (...a) => errorCalls.push(a)
  };
  const log = withLogger(partial);

  log.buildStep('🎨', 'Theme: bloom');
  log.buildSuccess('✅', 'done');
  log.webpackStart('production');
  log.eleventyStart(false);

  assert.equal(infoCalls.length, 4, 'build/webpack/eleventy steps must route to info');
  assert.ok(infoCalls.some((args) => args.includes('Theme: bloom')));
});

test('partial logger without warn: buildWarning falls back to info, not swallowed', () => {
  const infoCalls = [];
  const log = withLogger({ info: (...a) => infoCalls.push(a), error: () => {} });
  log.buildWarning('⚠️', 'careful');
  assert.ok(infoCalls.some((args) => args.includes('careful')), 'warning must not vanish');
});

test('partial logger: buildError routes to error', () => {
  const errorCalls = [];
  const log = withLogger({ info: () => {}, error: (...a) => errorCalls.push(a) });
  log.buildError('❌', 'boom');
  assert.ok(errorCalls.some((args) => args.includes('boom')));
});

test('shouldLog defaults to true when absent', () => {
  const log = withLogger({ info: () => {} });
  assert.equal(log.shouldLog('minimal'), true);
});

test('getChildProcessOptions returns an options object when absent', () => {
  const log = withLogger({ info: () => {} });
  const opts = log.getChildProcessOptions('/tmp', { FOO: '1' });
  assert.equal(typeof opts, 'object');
  assert.equal(opts.cwd, '/tmp');
  assert.equal(opts.env.FOO, '1');
});

test('provided specific method takes precedence over fallback', () => {
  let stepCalled = false;
  let infoCalled = false;
  const log = withLogger({
    info: () => { infoCalled = true; },
    buildStep: () => { stepCalled = true; }
  });
  log.buildStep('🎨', 'x');
  assert.equal(stepCalled, true, 'own buildStep must be used');
  assert.equal(infoCalled, false, 'must not fall back to info when buildStep exists');
});

// ── Level-Gating ─────────────────────────────────────────────────────────────

function captureConsole(fn) {
  const logs = [];
  const debugs = [];
  const warns = [];
  const errors = [];
  const origLog = console.log;
  const origDebug = console.debug;
  const origWarn = console.warn;
  const origError = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.debug = (...a) => debugs.push(a.join(' '));
  console.warn = (...a) => warns.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));
  try { fn(); } finally {
    console.log = origLog;
    console.debug = origDebug;
    console.warn = origWarn;
    console.error = origError;
  }
  return { logs, debugs, warns, errors };
}

test('verbose() only emits at level verbose', () => {
  const log = createConsoleLogger();

  log.setLevel('silent');
  const silent = captureConsole(() => log.verbose('v-silent'));
  assert.equal(silent.debugs.length, 0, 'verbose must be silent at level=silent');

  log.setLevel('normal');
  const normal = captureConsole(() => log.verbose('v-normal'));
  assert.equal(normal.debugs.length, 0, 'verbose must be silent at level=normal');

  log.setLevel('verbose');
  const verbose = captureConsole(() => log.verbose('v-verbose'));
  assert.equal(verbose.debugs.length, 1, 'verbose must emit at level=verbose');
  assert.ok(verbose.debugs[0].includes('v-verbose'));
});

test('buildStep() only emits at level normal+', () => {
  const log = createConsoleLogger();

  log.setLevel('silent');
  const silent = captureConsole(() => log.buildStep('🎨', 'step-silent'));
  assert.equal(silent.logs.length, 0, 'buildStep must be silent at level=silent');

  log.setLevel('normal');
  const normal = captureConsole(() => log.buildStep('🎨', 'step-normal'));
  assert.equal(normal.logs.length, 1, 'buildStep must emit at level=normal');
  assert.ok(normal.logs[0].includes('step-normal'));
});

test('error() always emits regardless of level', () => {
  const log = createConsoleLogger();
  log.setLevel('silent');
  const result = captureConsole(() => log.error('fatal'));
  assert.equal(result.errors.length, 1, 'error must always emit');
  assert.ok(result.errors[0].includes('fatal'));
});

test('warn() always emits regardless of level', () => {
  const log = createConsoleLogger();
  log.setLevel('silent');
  const result = captureConsole(() => log.warn('attention'));
  assert.equal(result.warns.length, 1, 'warn must always emit');
  assert.ok(result.warns[0].includes('attention'));
});

test('info() emits at minimal+ but not at silent', () => {
  const log = createConsoleLogger();

  log.setLevel('silent');
  const silent = captureConsole(() => log.info('info-silent'));
  assert.equal(silent.logs.length, 0, 'info must be silent at level=silent');

  log.setLevel('minimal');
  const minimal = captureConsole(() => log.info('info-minimal'));
  assert.equal(minimal.logs.length, 1, 'info must emit at level=minimal');
});

test('webpackStart()/eleventyStart() are gated at normal+', () => {
  const log = createConsoleLogger();

  log.setLevel('silent');
  const silent = captureConsole(() => { log.webpackStart('x'); log.eleventyStart(); });
  assert.equal(silent.logs.length, 0);

  log.setLevel('normal');
  const normal = captureConsole(() => { log.webpackStart('x'); log.eleventyStart(); });
  assert.equal(normal.logs.length, 2);
});
