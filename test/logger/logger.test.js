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
