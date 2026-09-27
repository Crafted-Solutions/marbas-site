/**
 * Smoke test (Task 114): the build must use `locale` from pages/_data/site.json.
 * Regression: tm.eleventy.js read `siteSettings.locale` instead of `siteSettings.site.locale`,
 * so every build fell back to { defaultLanguage: 'de' } — component links on English-default
 * sites got a bogus /en/ prefix and the language switcher only offered German.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 180_000 });

function page(lang, extra = '') {
  return `---
layout: content_1col.njk
title: Test
pageLanguage: ${lang}
templateEngineOverride: njk,md
Placeholder_Main:
  - componentType: TextMedia
    id: tm
    title: Text
    text: "<p>x</p>"
    link: /contact/
${extra}---
`;
}

function setup(locale) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-locale-'));
  const projectPath = path.join(tmp, 'site');
  assert.equal(run(['init', projectPath, '--starter']).status, 0, 'init failed');
  for (const f of fs.readdirSync(path.join(projectPath, 'pages'))) {
    if (f.endsWith('.md')) fs.rmSync(path.join(projectPath, 'pages', f));
  }
  const siteJsonPath = path.join(projectPath, 'pages', '_data', 'site.json');
  const siteJson = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
  siteJson.locale = locale;
  fs.writeFileSync(siteJsonPath, JSON.stringify(siteJson, null, 2));
  return { tmp, projectPath, out: path.join(projectPath, 'build', 'public_development') };
}

test('English-default site: no /en/ prefix, no German hreflang', { timeout: 360_000 }, () => {
  const { tmp, projectPath, out } = setup({ defaultLanguage: 'en', languages: [{ code: 'en', label: 'English' }] });
  try {
    fs.writeFileSync(path.join(projectPath, 'pages', 'index.md'), page('en'));
    const build = run(['build', projectPath, '--env=development']);
    assert.equal(build.status, 0, `build failed:\n${build.stdout}\n${build.stderr}`);
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.ok(html.includes('href="/contact/"'), 'component link has no language prefix');
    assert.ok(!html.includes('href="/en/contact/"'), 'no bogus /en/ prefix');
    assert.ok(!html.includes('hreflang="de"'), 'no German alternate on an English-only site');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('de+en site: language switcher and prefixes use site.json locale', { timeout: 360_000 }, () => {
  const { tmp, projectPath, out } = setup({ defaultLanguage: 'de', languages: [{ code: 'de', label: 'Deutsch' }, { code: 'en', label: 'English' }] });
  try {
    fs.writeFileSync(path.join(projectPath, 'pages', 'index.md'), page('de'));
    fs.mkdirSync(path.join(projectPath, 'pages', 'en'));
    fs.writeFileSync(path.join(projectPath, 'pages', 'en', 'index.md'), page('en'));
    const build = run(['build', projectPath, '--env=development']);
    assert.equal(build.status, 0, `build failed:\n${build.stdout}\n${build.stderr}`);
    const de = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    const en = fs.readFileSync(path.join(out, 'en', 'index.html'), 'utf8');
    assert.ok(de.includes('href="/contact/"'));
    assert.ok(en.includes('href="/en/contact/"'));
    const langs = (de.match(/languages='([^']*)'/) || [])[1] || '';
    assert.ok(langs.replace(/&quot;/g, '"').includes('"code":"en"'), `switcher offers English (got ${langs})`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
