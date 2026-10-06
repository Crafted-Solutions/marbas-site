/**
 * Smoke test (Task 171): the Base v2 building block Tiles in all six forms — card or row layout is decided by the form
 * (`@layout linklist`), the markup is the same.
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

const page = `---
layout: content_1col.njk
title: Kacheln
pageLanguage: de
templateEngineOverride: njk,md
Placeholder_Main:
  - componentType: Tiles
    id: kacheln
    label: "Dein Anliegen"
    headline: "Was dir fehlt"
    columns: 2
    items:
      - title: "Dir fehlt eine Münze?"
        text: "Finde Angebote."
        href: "/katalog/"
        linkText: "Katalog entdecken"
        image: { src: /_assets/images/starter-hero.jpg, alt: "Album", originalId: tile-1 }
      - title: "Ohne Bild, ohne Ziel"
        text: "Nur Text."
  - componentType: Tiles
    id: ablauf
    items:
      - { label: "Schritt 1", title: "Anmelden", text: "Online", href: "/a/", image: { src: /_assets/images/starter-hero.jpg, alt: "Anmelden", originalId: tile-2 } }
      - { title: "Danach", text: "ohne Kennung", href: "/b/" }
---
`;

const FORMS = {
  'theme-product': 'cards', 'theme-warm': 'cards', 'theme-druckwerk': 'cards',
  'theme-editorial': 'rows', 'theme-bold': 'rows', 'theme-minimal-luxe': 'rows'
};

test('Tiles render in all six forms; the form picks cards or rows', { timeout: 600_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-tiles-'));
  try {
    for (const [theme, layout] of Object.entries(FORMS)) {
      const project = path.join(tmp, theme, 'site');
      assert.equal(run(['init', project, `--theme=${theme}`]).status, 0, theme);
      fs.writeFileSync(path.join(project, 'pages', 'index.md'), page);
      const build = run(['build', project, '--env=development']);
      assert.equal(build.status, 0, `${theme}: ${build.stderr}`);
      assert.doesNotMatch(build.stdout + build.stderr, /missing-component/, theme);
      const html = fs.readFileSync(path.join(project, 'build', 'public_development', 'index.html'), 'utf8');

      assert.match(html, new RegExp(`<body class="c-page c-page--v2[^"]*c-l-linklist-${layout}`), `${theme}: layout ${layout}`);
      const tiles = html.slice(html.indexOf('id="kacheln"'), html.indexOf('id="ablauf"'));
      assert.match(tiles, /class="c-v2 c-v2--paper c-v2-section c-v2-linklist c-v2-tiles"/, theme);
      assert.match(tiles, /style="--tiles-cols: 2"/, `${theme}: columns`);
      assert.equal((tiles.match(/class="c-v2-tiles__media"/g) || []).length, 1, `${theme}: figure only for the tile with an image`);
      assert.match(tiles, /<figure class="c-v2-tiles__media">[\s\S]*?<img[^>]+alt="Album"/, `${theme}: image processed`);
      assert.match(tiles, /<span class="c-v2-tiles__link">Katalog entdecken <span aria-hidden="true">↗<\/span><\/span>/, `${theme}: link text`);
      assert.match(tiles, /<div class="c-v2-rows__row c-v2-tiles__item">[\s\S]*?Ohne Bild, ohne Ziel/, `${theme}: tile without href is no link`);
      assert.doesNotMatch(html, /href="#"/, theme);
      const ablauf = html.slice(html.indexOf('id="ablauf"'));
      assert.match(ablauf, /c-v2-rows c-v2-tiles__grid c-v2-rows--labels/, `${theme}: labelled list marked`);
      assert.match(ablauf, /<span class="c-v2-rows__index">Schritt 1<\/span>/, theme);
      assert.match(ablauf, /--tiles-cols: 2/, `${theme}: default columns for two tiles`);
      assert.match(ablauf, /c-v2-rows__arrow/, `${theme}: arrow without link text`);

      const css = fs.readFileSync(path.join(project, 'build', 'public_development', '_assets', 'css', 'base.full.css'), 'utf8');
      assert.match(css, /\.c-l-linklist-rows \.c-v2-tiles \.c-v2-tiles__item/, `${theme}: row layout in the base`);
      assert.match(css, /\.c-l-linklist-cards \.c-v2-tiles \.c-v2-tiles__media/, `${theme}: card layout in the base`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
