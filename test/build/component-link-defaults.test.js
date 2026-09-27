/**
 * Smoke test (Task 108): language-dependent default link texts, linkAriaLabel on
 * TextMedia, and distinct output files for images without originalId.
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

function run(args) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 180_000 });
}

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
    link: /kontakt/
    linkAriaLabel: 'Mehr zu "Kontakt"'
  - componentType: Cards
    id: cards
    cards:
      - headline: Karte
        link: /a/
${extra}---
`;
}

test('component links: language defaults, aria-label, images without originalId', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-link-defaults-'));
  const projectPath = path.join(tmp, 'site');
  try {
    assert.equal(run(['init', projectPath, '--starter']).status, 0, 'init failed');

    const siteJsonPath = path.join(projectPath, 'pages', '_data', 'site.json');
    const siteJson = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
    siteJson.locale = { defaultLanguage: 'de', languages: [{ code: 'de', label: 'Deutsch' }, { code: 'en', label: 'English' }] };
    fs.writeFileSync(siteJsonPath, JSON.stringify(siteJson, null, 2));

    const images = `  - componentType: TwoImages
    id: two
    image1:
      src: /_assets/images/starter-feature-left.jpg
      alt: Links
    image2:
      src: /_assets/images/starter-feature-right.jpg
      alt: Rechts
`;
    fs.writeFileSync(path.join(projectPath, 'pages', 'linktest.md'), page('de', images));
    fs.mkdirSync(path.join(projectPath, 'pages', 'en'), { recursive: true });
    fs.writeFileSync(path.join(projectPath, 'pages', 'en', 'linktest.md'), page('en'));

    const build = run(['build', projectPath, '--env=development']);
    assert.equal(build.status, 0, `build failed:\n${build.stdout}\n${build.stderr}`);

    const out = path.join(projectPath, 'build', 'public_development');
    const de = fs.readFileSync(path.join(out, 'linktest', 'index.html'), 'utf8');
    const en = fs.readFileSync(path.join(out, 'en', 'linktest', 'index.html'), 'utf8');

    assert.ok(de.includes('aria-label="Mehr zu &quot;Kontakt&quot;"'), 'TextMedia renders escaped linkAriaLabel');
    assert.equal((de.match(/>\s*weitere Informationen\s*</g) || []).length, 2, 'de: TextMedia + Cards default link text');
    assert.equal((en.match(/>\s*More information\s*</g) || []).length, 2, 'en: TextMedia + Cards default link text');
    assert.ok(!/>\s*More\s*</.test(de), 'old English "More" default is gone');
    assert.ok(en.includes('href="/en/kontakt/"'), 'component links get the language prefix on en pages');
    assert.ok(de.includes('href="/kontakt/"'), 'no prefix on default-language pages');

    assert.ok(de.includes('src="/_assets/images/Logo.svg"'), 'header uses the shipped default logo');
    assert.ok(fs.existsSync(path.join(out, '_assets', 'images', 'Logo.svg')), 'default logo is copied to the output');

    const imageFiles = fs.readdirSync(path.join(out, 'images'));
    assert.ok(!imageFiles.some((f) => f.startsWith('undefined-')), 'no undefined-* image files');
    assert.ok(imageFiles.some((f) => /^starter-feature-left-[0-9a-f]{8}-\d+w\.webp$/.test(f)), 'left image gets its own name');
    assert.ok(imageFiles.some((f) => /^starter-feature-right-[0-9a-f]{8}-\d+w\.webp$/.test(f)), 'right image gets its own name');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
