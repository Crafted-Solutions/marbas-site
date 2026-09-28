/**
 * Smoke test (Task 113): built-in blocks render their id as HTML id (anchors), and a custom
 * hero with providesH1: true suppresses the page-title <h1>.
 * Task 124: the page-title <h1> uses .c-page-title (h1 size, not the component h2 size), and
 * Cards columns are clamped to the 1–4 grid classes the base provides.
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
const img = (id) => `      src: /_assets/images/starter-feature-left.jpg\n      alt: Bild\n      originalId: ${id}`;

const blocksPage = `---
layout: content_1col.njk
title: Blocks
pageLanguage: de
templateEngineOverride: njk,md
Placeholder_Hero:
  - componentType: Hero
    id: a-hero
    title: Hero
    image:
${img('i-hero')}
Placeholder_Main:
  - componentType: TextMedia
    id: a-textmedia
    title: T
    text: "<p>x</p>"
  - componentType: Cards
    id: a-cards
    cards:
      - headline: C
  - componentType: Banner
    id: a-banner
    image:
${img('i-banner')}
  - componentType: TwoImages
    id: a-twoimages
    image1:
${img('i-one').replace(/^ {6}/gm, '      ')}
    image2:
${img('i-two')}
  - componentType: Video
    id: a-video
    videoHeadline: V
    video: { mp4: /x.mp4 }
---
`;

const customHeroPage = (flag) => `---
layout: content_1col.njk
title: Seitentitel
pageLanguage: de
templateEngineOverride: njk,md
Placeholder_Hero:
  - componentType: MyHero
    id: my-hero
    headline: Eigene H1${flag ? '\n    providesH1: true' : ''}
---
`;

const cardsPage = (columns) => `---
layout: content_1col.njk
title: Karten ${columns}
pageLanguage: de
templateEngineOverride: njk,md
Placeholder_Main:
  - componentType: Cards
    id: cards-${columns}
    columns: ${columns}
    cards:
      - headline: A
---
`;

test('anchors on built-ins and providesH1 for custom heroes', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-anchors-'));
  const projectPath = path.join(tmp, 'site');
  try {
    assert.equal(run(['init', projectPath]).status, 0, 'init failed');
    fs.mkdirSync(path.join(projectPath, '_components', 'MyHero'), { recursive: true });
    fs.writeFileSync(path.join(projectPath, '_components', 'MyHero', 'MyHero.njk'),
      '<section id="{{ data.id }}" class="my-hero"><h1>{{ data.headline }}</h1></section>');
    fs.writeFileSync(path.join(projectPath, 'pages', 'blocks.md'), blocksPage);
    fs.writeFileSync(path.join(projectPath, 'pages', 'flagged.md'), customHeroPage(true));
    fs.writeFileSync(path.join(projectPath, 'pages', 'unflagged.md'), customHeroPage(false));
    for (const columns of [4, 9]) fs.writeFileSync(path.join(projectPath, 'pages', `cards-${columns}.md`), cardsPage(columns));

    const build = run(['build', projectPath, '--env=development']);
    assert.equal(build.status, 0, `build failed:\n${build.stdout}\n${build.stderr}`);
    const out = path.join(projectPath, 'build', 'public_development');
    const read = (p) => fs.readFileSync(path.join(out, p, 'index.html'), 'utf8');

    const blocks = read('blocks');
    for (const id of ['a-hero', 'a-textmedia', 'a-cards', 'a-banner', 'a-twoimages', 'a-video']) {
      assert.ok(blocks.includes(`id="${id}"`), `built-in renders id="${id}"`);
    }
    assert.equal((blocks.match(/<h1\b/g) || []).length, 1, 'Hero page: exactly one h1');

    const flagged = read('flagged');
    assert.equal((flagged.match(/<h1\b/g) || []).length, 1, 'providesH1: only the custom hero h1');
    assert.ok(!flagged.includes('>Seitentitel</h1>'), 'page title not rendered as h1');

    const unflagged = read('unflagged');
    assert.equal((unflagged.match(/<h1\b/g) || []).length, 2, 'without the flag the page title h1 is added (previous behaviour)');
    assert.ok(unflagged.includes('<h1 class="c-page-title">Seitentitel</h1>'), 'page title h1 uses .c-page-title');

    assert.match(read('cards-4'), /c-cols-lg-4/, 'Cards columns: 4 → 4-column class');
    assert.match(read('cards-9'), /c-cols-lg-4/, 'Cards columns: 9 → clamped to 4');
    const css = fs.readFileSync(path.join(out, '_assets', 'css', 'base.full.css'), 'utf8');
    assert.match(css, /\.c-page-title\s*\{[^}]*--text-4/, 'base defines .c-page-title with h1 size');
    assert.match(css, /\.c-cols-lg-4\s*\{/, 'base defines the 4-column grid');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
