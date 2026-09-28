/**
 * Smoke test (Task 128): Base v2 building blocks Intro, Notice, LinkList, Split, Contact as built-ins.
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
title: Seitentitel
pageLanguage: de
templateEngineOverride: njk,md
Placeholder_Hero:
  - componentType: Intro
    id: start
    label: "Kennung"
    headline: "Praxis<br>Dr. Test"
    lead: "Leittext"
    text: "<p>Nebentext</p>"
    links:
      - { label: "Zu den Anliegen", href: "/#anliegen" }
    image: { src: /_assets/images/starter-hero.jpg, alt: "Bild", originalId: v2-start }
Placeholder_Main:
  - componentType: Notice
    id: hinweis
    label: "Aktuelles"
    text: "<p>Hinweis</p>"
    meta: "Stand"
  - componentType: LinkList
    id: anliegen
    label: "01 / Orientierung"
    headline: "Was möchten Sie tun?"
    items:
      - { title: "Termin", text: "Unterlagen", href: "/#termin" }
      - { title: "Akut", text: "Dringend", href: "/#akut", tone: alert }
      - { title: "Ohne Ziel", text: "Nur Info" }
  - componentType: Notice
    id: hinweis-ohne-kennung
    text: "<p>Ohne Kennung</p>"
  - componentType: Split
    id: termin
    tone: soft
    label: "02"
    headline: "Gut vorbereitet."
    text: "<p>Text</p>"
    mutedText: "<p>Nebentext</p>"
    list: { title: "Mitbringen", items: ["Karte", { value: "Medikamentenliste" }], note: "Hinweis" }
  - componentType: Split
    id: akut
    tone: alert
    layout: title
    headline: "Akut?"
    text: "<p>Text</p>"
    note: "Randnotiz"
    numbers:
      - { label: "Notruf", detail: "Lebensbedrohlich", value: "112" }
      - { label: "Erreichbar", value: "rund um die Uhr" }
  - componentType: Contact
    id: kontakt
    headline: "Kontakt"
    details: [{ term: "Telefon", value: "030 123" }]
    hoursTitle: "Öffnungszeiten"
    hours: [{ day: "Montag", time: "8–12 Uhr" }]
    link: "/#akut"
    linkText: "Akut"
---
`;

const pageIntroWithoutHeadline = `---
layout: content_1col.njk
title: Fallback-Titel
pageLanguage: de
templateEngineOverride: njk,md
Placeholder_Hero:
  - componentType: Intro
    id: ohne
    lead: "Nur Leittext"
---
`;

test('Base v2 building blocks render as built-ins (v2 and classic theme)', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-v2c-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-slate']).status, 0);
    fs.writeFileSync(path.join(project, 'pages', 'index.md'), page);
    fs.writeFileSync(path.join(project, 'pages', 'ohne.md'), pageIntroWithoutHeadline);
    const build = run(['build', project, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    assert.doesNotMatch(build.stdout + build.stderr, /missing-component/);
    const html = fs.readFileSync(path.join(project, 'build', 'public_development', 'index.html'), 'utf8');

    assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Intro provides the only h1');
    assert.match(html, /<h1 class="c-v2-intro__title">Praxis<br>Dr\. Test<\/h1>/);
    assert.doesNotMatch(html, />Seitentitel<\/h1>/);
    for (const id of ['start', 'hinweis', 'anliegen', 'termin', 'akut', 'kontakt']) assert.match(html, new RegExp(`id="${id}"`));
    assert.match(html, /class="c-v2 c-v2--soft c-v2-section c-v2-split-section"/);
    assert.match(html, /class="c-v2-rows__row c-v2-rows__row--alert"/);
    assert.match(html, /<span class="c-v2-rows__index">01<\/span>/);
    assert.match(html, /<li>Karte<\/li><li>Medikamentenliste<\/li>/, 'list items as strings and editor objects');
    assert.match(html, /href="tel:112"/);
    assert.match(html, /<p class="c-v2__note">Randnotiz<\/p>/);
    assert.match(html, /<dt>Montag<\/dt><dd>8–12 Uhr<\/dd>/);
    assert.match(html, /<figure class="c-v2-intro__media">[\s\S]*?<img[^>]+alt="Bild"/, 'intro image processed');
    // review fixes: no pseudo links, no empty tel:, label rail kept without label
    assert.match(html, /<div class="c-v2-rows__row">[\s\S]*?Ohne Ziel/, 'row without href is not a link');
    assert.doesNotMatch(html, /href="#"|href="tel:"/);
    assert.match(html, /<div class="c-v2-numbers__item"><span><strong class="c-v2-numbers__label">Erreichbar/);
    assert.match(html, /c-v2-notice__inner">\s*<span><\/span>\s*<div class="c-v2-notice__copy">/, 'notice keeps the rail column without label');
    const ohne = fs.readFileSync(path.join(project, 'build', 'public_development', 'ohne', 'index.html'), 'utf8');
    assert.equal((ohne.match(/<h1\b/g) || []).length, 1, 'Intro without headline: fallback title h1');
    assert.match(ohne, />Fallback-Titel<\/h1>/);
    assert.match(html, /<body class="c-page c-page--classic">/, 'usable in classic themes');
    const css = fs.readFileSync(path.join(project, 'build', 'public_development', '_assets', 'css', 'base.full.css'), 'utf8');
    assert.match(css, /\.c-page--classic \.c-v2::before/, 'classic fallback keeps bands inside the box');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
