/**
 * Smoke test (Task 110): UI texts follow the page language, localized site.json values resolve
 * per language, tagCollection footer lists render (limit, language filter).
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
const page = (title, lang, extra = '') => `---\nlayout: content_1col.njk\ntitle: ${title}\npageLanguage: ${lang}\ntemplateEngineOverride: njk,md\n${extra}---\n`;
const GERMAN_UI = ['Zum Inhalt springen', 'Navigation öffnen', 'Hauptnavigation', 'Rechtliches', 'Unterseiten von'];

test('UI texts and localized site.json values per language', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-ui-texts-'));
  const projectPath = path.join(tmp, 'site');
  try {
    assert.equal(run(['init', projectPath]).status, 0);
    const siteJsonPath = path.join(projectPath, 'pages', '_data', 'site.json');
    const siteJson = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
    siteJson.locale = { defaultLanguage: 'de', languages: [{ code: 'de', label: 'Deutsch' }, { code: 'en', label: 'English' }] };
    siteJson.header.preset = 'brand-nav-actions';
    siteJson.header.actions = [{ label: { de: 'Termin buchen', en: 'Book appointment' }, href: { de: '/kontakt/', en: '/en/contact/' } }];
    siteJson.footer.preset = 'columns';
    siteJson.footer.copyright = { de: '© Praxis', en: '© Practice' };
    siteJson.footer.groups = [{ title: { de: 'Seiten', en: 'Pages' }, source: 'tagCollection', tags: ['footer'], limit: 2 }];
    fs.writeFileSync(siteJsonPath, JSON.stringify(siteJson, null, 2));

    fs.mkdirSync(path.join(projectPath, 'pages', 'en'));
    fs.writeFileSync(path.join(projectPath, 'pages', 'en', 'index.md'), page('Home', 'en'));
    for (const [file, lang] of [['a.md', 'de'], ['b.md', 'de'], ['c.md', 'de'], ['en/x.md', 'en']]) {
      fs.writeFileSync(path.join(projectPath, 'pages', file), page(`Seite ${file}`, lang, 'tags: [footer]\n'));
    }

    const build = run(['build', projectPath, '--env=development']);
    assert.equal(build.status, 0, `build failed:\n${build.stderr}`);
    const out = path.join(projectPath, 'build', 'public_development');
    const de = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    const en = fs.readFileSync(path.join(out, 'en', 'index.html'), 'utf8');

    for (const text of GERMAN_UI) assert.ok(!en.includes(text), `en page has no German UI text "${text}"`);
    assert.ok(en.includes('Skip to content') && en.includes('Open navigation'));
    assert.ok(de.includes('Zum Inhalt springen'));

    assert.ok(de.includes('href="/kontakt/">Termin buchen</a>'), 'de action');
    assert.ok(en.includes('href="/en/contact/">Book appointment</a>'), 'en action');
    assert.ok(de.includes('© Praxis') && en.includes('© Practice'), 'copyright per language');
    assert.ok(de.includes('>Seiten</p>') && en.includes('>Pages</p>'), 'group title per language');

    const deLinks = [...de.matchAll(/class="c-footer-group__link" href="([^"]+)"/g)].map((m) => m[1]);
    const enLinks = [...en.matchAll(/class="c-footer-group__link" href="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(deLinks.length, 2, `tagCollection group respects limit 2 (got ${deLinks})`);
    assert.ok(deLinks.every((href) => !href.startsWith('/en/')), 'de group only German pages');
    assert.deepEqual(enLinks, ['/en/x/'], 'en group only English pages');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
