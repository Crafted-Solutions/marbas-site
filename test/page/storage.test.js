import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { listPages, loadPage, savePage, serializePageData, getPlaceholderEntries } from '../../src/page/storage.js';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-storage-test-'));
}

function createPageFile(dir, relativePath, content) {
  const absolutePath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

test('listPages — empty directory returns empty array', () => {
  const dir = makeTempDir();
  const pages = listPages(dir);
  assert.deepEqual(pages, []);
});

test('listPages — returns parsed pages sorted by path', () => {
  const dir = makeTempDir();
  createPageFile(dir, 'contact.md', '---\ntitle: Contact\n---\n');
  createPageFile(dir, 'about.md', '---\ntitle: About\n---\n');
  createPageFile(dir, 'index.md', '---\ntitle: Home\n---\n');

  const pages = listPages(dir);
  assert.equal(pages.length, 3);
  assert.equal(pages[0].path, 'about.md');
  assert.equal(pages[1].path, 'contact.md');
  assert.equal(pages[2].path, 'index.md');
  assert.equal(pages[2].data.title, 'Home');
});

test('listPages — body is preserved intact', () => {
  const dir = makeTempDir();
  createPageFile(dir, 'index.md', '---\ntitle: Home\n---\n\n# Welcome\n\nSome text.');

  const pages = listPages(dir);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].body, '\n\n# Welcome\n\nSome text.');
});

test('listPages — app-only frontmatter fields pass through', () => {
  const dir = makeTempDir();
  createPageFile(dir, 'index.md', '---\ntitle: Test\n_editor:\n  status: draft\n---\n');

  const pages = listPages(dir);
  assert.deepEqual(pages[0].data._editor, { status: 'draft' });
});

test('listPages — walks subdirectories', () => {
  const dir = makeTempDir();
  createPageFile(dir, 'blog/post.md', '---\ntitle: Post\n---\n');
  createPageFile(dir, 'index.md', '---\ntitle: Home\n---\n');

  const pages = listPages(dir);
  assert.equal(pages.length, 2);
  assert.ok(pages.some((p) => p.path === 'blog/post.md'));
});

test('loadPage — reads and parses a page', () => {
  const dir = makeTempDir();
  createPageFile(dir, 'index.md', '---\ntitle: Home\nlayout: page.njk\n---\n\nBody content.');

  const page = loadPage(dir, 'index.md');
  assert.equal(page.path, 'index.md');
  assert.equal(page.data.title, 'Home');
  assert.equal(page.data.layout, 'page.njk');
  assert.equal(page.body, '\n\nBody content.');
});

test('loadPage — throws for missing page', () => {
  const dir = makeTempDir();
  assert.throws(
    () => loadPage(dir, 'missing.md'),
    /Page not found: missing\.md/
  );
});

test('savePage — writes frontmatter + body correctly', () => {
  const dir = makeTempDir();
  createPageFile(dir, 'index.md', '---\ntitle: Old\n---\n');

  savePage(dir, 'index.md', { title: 'New', layout: 'page.njk' }, '\n\nUpdated body.');

  const page = loadPage(dir, 'index.md');
  assert.equal(page.data.title, 'New');
  assert.equal(page.data.layout, 'page.njk');
  assert.equal(page.body, '\n\nUpdated body.');
});

test('savePage — creates parent directories as needed', () => {
  const dir = makeTempDir();
  savePage(dir, 'nested/deep/page.md', { title: 'Deep' }, '');

  assert.ok(fs.existsSync(path.join(dir, 'nested/deep/page.md')));
  const page = loadPage(dir, 'nested/deep/page.md');
  assert.equal(page.data.title, 'Deep');
});

test('savePage — app-only fields are preserved', () => {
  const dir = makeTempDir();
  const data = { title: 'Test', _editor: { status: 'published' }, _ai: { summary: 'auto' } };
  savePage(dir, 'index.md', data, '');

  const page = loadPage(dir, 'index.md');
  assert.deepEqual(page.data._editor, { status: 'published' });
  assert.deepEqual(page.data._ai, { summary: 'auto' });
});

test('serializePageData — produces valid frontmatter', () => {
  const serialized = serializePageData({ title: 'Test', count: 3 }, '\n\nBody.');
  assert.ok(serialized.startsWith('---\n'));
  assert.ok(serialized.includes('title: Test'));
  assert.ok(serialized.includes('Body.'));
});

test('getPlaceholderEntries — extracts Placeholder_ keys', () => {
  const data = {
    title: 'Test',
    Placeholder_Main: [{ componentType: 'Hero' }],
    Placeholder_Sidebar: [],
    other: 'value'
  };
  const entries = getPlaceholderEntries(data);
  assert.equal(entries.length, 2);
  const keys = entries.map(([k]) => k);
  assert.ok(keys.includes('Placeholder_Main'));
  assert.ok(keys.includes('Placeholder_Sidebar'));
  assert.ok(!keys.includes('title'));
  assert.ok(!keys.includes('other'));
});

test('getPlaceholderEntries — ignores non-array Placeholder_ values', () => {
  const data = {
    Placeholder_Main: [{ componentType: 'Hero' }],
    Placeholder_NotAnArray: 'string'
  };
  const entries = getPlaceholderEntries(data);
  assert.equal(entries.length, 1);
  assert.equal(entries[0][0], 'Placeholder_Main');
});
