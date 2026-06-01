import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, serializeFrontmatter, APP_ONLY_FRONTMATTER_KEYS } from '../../src/page/frontmatter.js';

test('parseFrontmatter — standard frontmatter + body', () => {
  const content = '---\ntitle: Hello\nlayout: page.njk\n---\n\nBody text here.';
  const { data, body } = parseFrontmatter(content);
  assert.equal(data.title, 'Hello');
  assert.equal(data.layout, 'page.njk');
  assert.equal(body, '\n\nBody text here.');
});

test('parseFrontmatter — no frontmatter returns empty data', () => {
  const content = 'Just a plain body.';
  const { data, body } = parseFrontmatter(content);
  assert.deepEqual(data, {});
  assert.equal(body, 'Just a plain body.');
});

test('parseFrontmatter — empty frontmatter block', () => {
  const content = '---\n\n---\n';
  const { data } = parseFrontmatter(content);
  assert.deepEqual(data, {});
});

test('parseFrontmatter — app-only fields are passed through unchanged', () => {
  const content = '---\ntitle: Test\n_editor:\n  status: draft\n_ai:\n  summary: auto\n_audit:\n  lastEditedBy: user@example.com\n---\n';
  const { data } = parseFrontmatter(content);
  assert.equal(data.title, 'Test');
  assert.deepEqual(data._editor, { status: 'draft' });
  assert.deepEqual(data._ai, { summary: 'auto' });
  assert.deepEqual(data._audit, { lastEditedBy: 'user@example.com' });
});

test('parseFrontmatter — CRLF line endings', () => {
  const content = '---\r\ntitle: CRLF\r\n---\r\n\r\nBody.';
  const { data, body } = parseFrontmatter(content);
  assert.equal(data.title, 'CRLF');
  assert.ok(body.includes('Body.'));
});

test('serializeFrontmatter — round-trips data + body', () => {
  const data = { title: 'Page', layout: 'page.njk' };
  const body = '\n\nSome content.';
  const serialized = serializeFrontmatter(data, body);
  const { data: parsed, body: parsedBody } = parseFrontmatter(serialized);
  assert.equal(parsed.title, 'Page');
  assert.equal(parsed.layout, 'page.njk');
  assert.equal(parsedBody, body);
});

test('serializeFrontmatter — no body defaults to newline', () => {
  const data = { title: 'Empty' };
  const serialized = serializeFrontmatter(data);
  assert.ok(serialized.startsWith('---\n'));
  assert.ok(serialized.endsWith('---\n'));
});

test('APP_ONLY_FRONTMATTER_KEYS — exports expected keys', () => {
  assert.ok(Array.isArray(APP_ONLY_FRONTMATTER_KEYS));
  assert.ok(APP_ONLY_FRONTMATTER_KEYS.includes('_editor'));
  assert.ok(APP_ONLY_FRONTMATTER_KEYS.includes('_ai'));
  assert.ok(APP_ONLY_FRONTMATTER_KEYS.includes('_audit'));
});
