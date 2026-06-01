import fs from 'fs';
import path from 'path';
import { parseFrontmatter, serializeFrontmatter } from './frontmatter.js';

function walkMarkdownFiles(dirPath, rootDir, results = []) {
  if (!fs.existsSync(dirPath)) return results;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(fullPath, rootDir, results);
      continue;
    }
    if (entry.name.endsWith('.md')) {
      results.push(path.relative(rootDir, fullPath).split(path.sep).join('/'));
    }
  }

  return results;
}

/**
 * Returns all placeholder entries from a frontmatter data object.
 * Placeholder keys start with "Placeholder_" and hold arrays.
 *
 * @param {Record<string, unknown>} data
 * @returns {Array<[string, unknown[]]>}
 */
export function getPlaceholderEntries(data) {
  return Object.entries(data)
    .filter(([key, value]) => key.startsWith('Placeholder_') && Array.isArray(value));
}

/**
 * Serializes frontmatter data + body into a markdown string.
 *
 * @param {Record<string, unknown>} data
 * @param {string} [body]
 * @returns {string}
 */
export function serializePageData(data, body = '') {
  return serializeFrontmatter(data, body);
}

/**
 * Lists all pages in a pages directory. Returns lightweight summaries.
 *
 * @param {string} pagesDir  Absolute path to the pages directory
 * @returns {Array<{ path: string, data: Record<string, unknown>, body: string }>}
 */
export function listPages(pagesDir) {
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }

  return walkMarkdownFiles(pagesDir, pagesDir)
    .sort((a, b) => a.localeCompare(b))
    .map((relativePath) => {
      const fileContent = fs.readFileSync(path.join(pagesDir, relativePath), 'utf8');
      const { data, body } = parseFrontmatter(fileContent);
      return { path: relativePath, data, body };
    });
}

/**
 * Loads a single page by its relative path.
 *
 * @param {string} pagesDir  Absolute path to the pages directory
 * @param {string} relativePath  Relative path to the page file (e.g. "index.md")
 * @returns {{ path: string, data: Record<string, unknown>, body: string }}
 */
export function loadPage(pagesDir, relativePath) {
  const absolutePath = path.join(pagesDir, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Page not found: ${relativePath}`);
  }

  const fileContent = fs.readFileSync(absolutePath, 'utf8');
  const { data, body } = parseFrontmatter(fileContent);
  return { path: relativePath, data, body };
}

/**
 * Writes a page back to disk. App-only frontmatter fields are preserved as-is.
 *
 * @param {string} pagesDir  Absolute path to the pages directory
 * @param {string} relativePath
 * @param {Record<string, unknown>} data  Frontmatter data (may include app-only fields)
 * @param {string} [body]
 */
export function savePage(pagesDir, relativePath, data, body = '') {
  const absolutePath = path.join(pagesDir, relativePath);
  const dir = path.dirname(absolutePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const serialized = serializePageData(data, body);
  const tempPath = `${absolutePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, serialized);
  fs.renameSync(tempPath, absolutePath);
}
