import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { discoverPlugins } from '../../src/plugin/discovery.js';
import { listCommands, listExtensions, _reset } from '../../src/plugin/registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-discovery-'));
}

function writePlugin(nmDir, scopedName, pkgJson, entryContent) {
  const parts = scopedName.startsWith('@') ? scopedName.split('/') : [scopedName];
  const pkgDir = parts.length === 2
    ? path.join(nmDir, parts[0], parts[1])
    : path.join(nmDir, parts[0]);
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkgJson));
  if (entryContent !== undefined) {
    fs.writeFileSync(path.join(pkgDir, 'index.js'), entryContent);
  }
  return pkgDir;
}

test.beforeEach(() => _reset());

test('discovers @marbas/* plugin with marbas-extension flag via extensionEntry', async () => {
  const td = makeTmpDir();
  try {
    writePlugin(
      path.join(td, 'node_modules'),
      '@marbas/hello',
      { name: '@marbas/hello', version: '1.0.0', 'marbas-extension': true, main: 'index.js' },
      `export function extensionEntry({ registerCommand }) {
        registerCommand({ name: 'hello', description: 'Say hello', run() {} });
      }`
    );

    await discoverPlugins({ projectPath: td });

    const cmds = listCommands();
    assert.equal(cmds.length, 1);
    assert.equal(cmds[0].name, 'hello');
    assert.equal(cmds[0]._plugin, '@marbas/hello');

    const exts = listExtensions();
    assert.equal(exts.length, 1);
    assert.equal(exts[0].name, '@marbas/hello');
    assert.equal(exts[0].version, '1.0.0');
  } finally {
    fs.rmSync(td, { recursive: true, force: true });
  }
});

test('discovers marbas-* top-level plugin', async () => {
  const td = makeTmpDir();
  try {
    writePlugin(
      path.join(td, 'node_modules'),
      'marbas-seo',
      { name: 'marbas-seo', version: '0.5.0', 'marbas-extension': true, main: 'index.js' },
      `export function extensionEntry({ registerAudit }) {
        registerAudit({ name: 'seo-check', run() {} });
      }`
    );

    await discoverPlugins({ projectPath: td });

    const { listAudits } = await import('../../src/plugin/registry.js');
    const audits = listAudits();
    assert.equal(audits.length, 1);
    assert.equal(audits[0].name, 'seo-check');
    assert.equal(audits[0]._plugin, 'marbas-seo');
  } finally {
    fs.rmSync(td, { recursive: true, force: true });
  }
});

test('skips packages without marbas-extension flag', async () => {
  const td = makeTmpDir();
  try {
    writePlugin(
      path.join(td, 'node_modules'),
      '@marbas/not-an-extension',
      { name: '@marbas/not-an-extension', version: '1.0.0' },
      `export function extensionEntry({ registerCommand }) {
        registerCommand({ name: 'hidden', description: 'Should not appear', run() {} });
      }`
    );

    await discoverPlugins({ projectPath: td });

    assert.equal(listCommands().length, 0);
  } finally {
    fs.rmSync(td, { recursive: true, force: true });
  }
});

test('plugin load error writes warning to stderr and does not throw', async () => {
  const td = makeTmpDir();
  const stderrChunks = [];
  const origWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk) => { stderrChunks.push(chunk); return true; };

  try {
    writePlugin(
      path.join(td, 'node_modules'),
      '@marbas/broken',
      { name: '@marbas/broken', version: '1.0.0', 'marbas-extension': true, main: 'index.js' },
      `throw new Error('plugin initialization failed');`
    );

    await assert.doesNotReject(() => discoverPlugins({ projectPath: td }));

    const output = stderrChunks.join('');
    assert.ok(output.includes('@marbas/broken'), 'warning should name the broken plugin');
    assert.ok(output.includes('Warning'), 'should be a warning');
  } finally {
    process.stderr.write = origWrite;
    fs.rmSync(td, { recursive: true, force: true });
  }
});

test('no node_modules dir: returns without error', async () => {
  const td = makeTmpDir();
  try {
    await assert.doesNotReject(() => discoverPlugins({ projectPath: td }));
    assert.equal(listCommands().length, 0);
  } finally {
    fs.rmSync(td, { recursive: true, force: true });
  }
});
