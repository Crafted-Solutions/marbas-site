/**
 * Smoke test (Task 109): language switcher data and hreflang come from the pages that exist.
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
const alternatesOf = (html) => JSON.parse(((html.match(/alternates='([^']*)'/) || [])[1] || '[]').replace(/&quot;/g, '"'));

test('switcher alternates + hreflang for a de/en site; no switcher on a single-language site', { timeout: 600_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-alternates-'));
  try {
    // two-language site
    const two = path.join(tmp, 'two');
    assert.equal(run(['init', two]).status, 0);
    const siteJsonPath = path.join(two, 'pages', '_data', 'site.json');
    const siteJson = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
    siteJson.locale = { defaultLanguage: 'de', languages: [{ code: 'de', label: 'Deutsch' }, { code: 'en', label: 'English' }] };
    fs.writeFileSync(siteJsonPath, JSON.stringify(siteJson, null, 2));
    const cfgPath = path.join(two, 'marbas-project.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.theme.languageSwitcher = true;
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
    fs.mkdirSync(path.join(two, 'pages', 'en'));
    fs.writeFileSync(path.join(two, 'pages', 'en', 'index.md'), page('Home', 'en'));
    fs.writeFileSync(path.join(two, 'pages', 'ueber-uns.md'), page('Über uns', 'de', 'translationKey: about\n'));
    fs.writeFileSync(path.join(two, 'pages', 'en', 'about-us.md'), page('About us', 'en', 'translationKey: about\n'));
    fs.writeFileSync(path.join(two, 'pages', 'impressum.md'), page('Impressum', 'de'));

    let build = run(['build', two, '--env=development']);
    assert.equal(build.status, 0, `build failed:\n${build.stderr}`);
    const out = path.join(two, 'build', 'public_development');
    const about = fs.readFileSync(path.join(out, 'ueber-uns', 'index.html'), 'utf8');
    const imprint = fs.readFileSync(path.join(out, 'impressum', 'index.html'), 'utf8');

    assert.deepEqual(alternatesOf(about).map((a) => [a.code, a.url]), [['de', '/ueber-uns/'], ['en', '/en/about-us/']]);
    assert.ok(about.includes('hreflang="en" href="/en/about-us/"') || /hreflang="en" href="[^"]*\/en\/about-us\/"/.test(about), 'hreflang en → translated slug');
    assert.match(about, /hreflang="x-default"/);

    assert.deepEqual(alternatesOf(imprint).map((a) => [a.code, a.url]), [['de', '/impressum/'], ['en', null]]);
    assert.ok(!/hreflang=/.test(imprint), 'no hreflang for a page without translation');

    // single-language site: no switcher, no hreflang
    const one = path.join(tmp, 'one');
    assert.equal(run(['init', one, '--starter']).status, 0);
    const cfg1Path = path.join(one, 'marbas-project.json');
    const cfg1 = JSON.parse(fs.readFileSync(cfg1Path, 'utf8'));
    cfg1.theme.languageSwitcher = true;   // even when enabled, one language renders no switcher
    fs.writeFileSync(cfg1Path, JSON.stringify(cfg1, null, 2));
    build = run(['build', one, '--env=development']);
    assert.equal(build.status, 0);
    const home = fs.readFileSync(path.join(one, 'build', 'public_development', 'index.html'), 'utf8');
    assert.ok(!home.includes('<language-switcher'), 'no switcher for one language');
    assert.ok(!/hreflang=/.test(home), 'no hreflang for one language');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
