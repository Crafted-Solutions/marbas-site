import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getLibRoot } from '../../src/eject/index.js';

test('getLibRoot returns the physical package root by default', () => {
  delete process.env.MARBAS_LIB_ROOT;
  const root = getLibRoot();
  // The package root must contain tm.eleventy.js (a shipped entry file).
  assert.ok(fs.existsSync(path.join(root, 'tm.eleventy.js')), 'default lib root should contain tm.eleventy.js');
});

test('getLibRoot honours MARBAS_LIB_ROOT when the path exists', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-libroot-'));
  const previous = process.env.MARBAS_LIB_ROOT;
  try {
    process.env.MARBAS_LIB_ROOT = tmp;
    assert.equal(getLibRoot(), tmp);
  } finally {
    if (previous === undefined) delete process.env.MARBAS_LIB_ROOT;
    else process.env.MARBAS_LIB_ROOT = previous;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('getLibRoot ignores MARBAS_LIB_ROOT when the path does not exist', () => {
  const previous = process.env.MARBAS_LIB_ROOT;
  try {
    process.env.MARBAS_LIB_ROOT = path.join(os.tmpdir(), 'marbas-does-not-exist-xyz');
    const root = getLibRoot();
    assert.ok(fs.existsSync(path.join(root, 'tm.eleventy.js')), 'falls back to physical root');
  } finally {
    if (previous === undefined) delete process.env.MARBAS_LIB_ROOT;
    else process.env.MARBAS_LIB_ROOT = previous;
  }
});
