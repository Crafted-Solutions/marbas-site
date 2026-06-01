import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getManifestPath, readManifest, writeManifest, archiveVersionFile } from '../../src/page/versions.js';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-versions-test-'));
}

test('getManifestPath — builds correct path', () => {
  const archiveDir = '/tmp/versions';
  const result = getManifestPath(archiveDir, 'index.md');
  assert.equal(result, '/tmp/versions/index/manifest.json');
});

test('getManifestPath — strips extension from nested path', () => {
  const archiveDir = '/tmp/versions';
  const result = getManifestPath(archiveDir, 'blog/post.md');
  assert.equal(result, '/tmp/versions/blog/post/manifest.json');
});

test('readManifest — returns null when no manifest exists', () => {
  const dir = makeTempDir();
  const result = readManifest(dir, 'index.md');
  assert.equal(result, null);
});

test('writeManifest / readManifest — round-trip', () => {
  const dir = makeTempDir();
  const manifest = { currentVersion: 3, updatedAt: '2026-01-01T00:00:00.000Z', versions: [] };

  writeManifest(dir, 'index.md', manifest);
  const read = readManifest(dir, 'index.md');

  assert.deepEqual(read, manifest);
});

test('writeManifest — creates parent directories', () => {
  const dir = makeTempDir();
  const manifest = { currentVersion: 1 };
  writeManifest(dir, 'nested/deep/page.md', manifest);

  const manifestPath = getManifestPath(dir, 'nested/deep/page.md');
  assert.ok(fs.existsSync(manifestPath));
});

test('archiveVersionFile — writes versioned file at correct path', () => {
  const dir = makeTempDir();
  const content = '---\ntitle: Test\n---\n\nBody.';

  archiveVersionFile(dir, 'index.md', 1, content);

  const archivePath = path.join(dir, 'index', 'v000001.md');
  assert.ok(fs.existsSync(archivePath));
  assert.equal(fs.readFileSync(archivePath, 'utf8'), content);
});

test('archiveVersionFile — pads version number to 6 digits', () => {
  const dir = makeTempDir();

  archiveVersionFile(dir, 'index.md', 42, 'content');

  const archivePath = path.join(dir, 'index', 'v000042.md');
  assert.ok(fs.existsSync(archivePath));
});

test('archiveVersionFile — returns relative archived path', () => {
  const dir = makeTempDir();

  const result = archiveVersionFile(dir, 'index.md', 1, 'content');

  assert.ok(result.includes('index/v000001.md'));
  assert.ok(!result.includes('\\'));
});

test('archiveVersionFile — manifest gets incremented across saves', () => {
  const dir = makeTempDir();
  const relativePath = 'page.md';
  const content1 = '---\ntitle: v1\n---\n';
  const content2 = '---\ntitle: v2\n---\n';

  archiveVersionFile(dir, relativePath, 1, content1);
  archiveVersionFile(dir, relativePath, 2, content2);

  assert.ok(fs.existsSync(path.join(dir, 'page', 'v000001.md')));
  assert.ok(fs.existsSync(path.join(dir, 'page', 'v000002.md')));

  // Simulate a manifest being updated
  const manifest = { currentVersion: 2, versions: [1, 2] };
  writeManifest(dir, relativePath, manifest);
  const read = readManifest(dir, relativePath);
  assert.equal(read.currentVersion, 2);
});
