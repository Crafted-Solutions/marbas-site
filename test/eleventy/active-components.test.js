/**
 * Task 211: components with `active: false` stay in the page file but are never rendered.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { filterInactiveComponents, isComponentActive } from '../../src/eleventy/active-components.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 300_000 });

test('isComponentActive: only the boolean false deactivates', () => {
  assert.equal(isComponentActive({ componentType: 'Hero' }), true, 'missing field = active');
  assert.equal(isComponentActive({ active: true }), true);
  assert.equal(isComponentActive({ active: false }), false);
  assert.equal(isComponentActive({ active: 'false' }), true, 'string "false" is not the flag');
  assert.equal(isComponentActive({ active: 0 }), true);
  assert.equal(isComponentActive(null), true);
  assert.equal(isComponentActive('x'), true);
});

test('filterInactiveComponents: every Placeholder_* array, nothing else, arrays replaced not mutated', () => {
  const main = [{ id: 'a' }, { id: 'b', active: false }, { id: 'c', active: true }];
  const data = {
    title: 'T',
    Placeholder_Main: main,
    Placeholder_Hero: [{ id: 'h', active: false }],
    Placeholder_Custom: [{ id: 'x' }],
    Placeholder_Odd: 'not an array',
    other: [{ id: 'o', active: false }]
  };
  assert.equal(filterInactiveComponents(data), 2);
  assert.deepEqual(data.Placeholder_Main.map((c) => c.id), ['a', 'c']);
  assert.deepEqual(data.Placeholder_Hero, []);
  assert.deepEqual(data.Placeholder_Custom.map((c) => c.id), ['x']);
  assert.equal(data.Placeholder_Odd, 'not an array');
  assert.equal(data.other.length, 1, 'non-placeholder keys untouched');
  assert.equal(main.length, 3, 'the original array is not spliced');
  assert.equal(filterInactiveComponents(null), 0);
  assert.equal(filterInactiveComponents({ title: 'x' }), 0);
});

const page = `---
layout: content_2col_main_left.njk
title: Seitentitel Aktiv
pageLanguage: de
templateEngineOverride: njk,md
Placeholder_Hero:
  - componentType: Hero
    id: off-hero
    title: Inaktiver Hero
    active: false
Placeholder_Main:
  - componentType: TitleText
    id: on-first
    title: Erste
    text: "<p>eins</p>"
  - componentType: TitleText
    id: off-middle
    title: Mitte
    text: "<p>zwei</p>"
    active: false
  - componentType: TitleText
    id: on-last
    title: Letzte
    text: "<p>drei</p>"
    active: true
  - componentType: GibtEsNicht
    id: off-missing
    active: false
Placeholder_Aside_1:
  - componentType: TitleText
    id: off-aside
    title: Seite
    active: false
---
`;

test('inactive components are not rendered in development and production builds', { timeout: 600_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-active-'));
  const projectPath = path.join(tmp, 'site');
  try {
    assert.equal(run(['init', projectPath]).status, 0, 'init failed');
    fs.writeFileSync(path.join(projectPath, 'pages', 'aktiv.md'), page);

    for (const env of ['development', 'production']) {
      const build = run(['build', projectPath, `--env=${env}`]);
      assert.equal(build.status, 0, `${env} build failed:\n${build.stdout}\n${build.stderr}`);
      const html = fs.readFileSync(path.join(projectPath, 'build', `public_${env}`, 'aktiv', 'index.html'), 'utf8');

      assert.ok(html.includes('id="on-first"'), `${env}: active component without field rendered`);
      assert.ok(html.includes('id="on-last"'), `${env}: active: true rendered`);
      for (const id of ['off-hero', 'off-middle', 'off-aside', 'off-missing']) {
        assert.ok(!html.includes(id), `${env}: inactive ${id} not in the HTML`);
      }
      assert.ok(!html.includes('Inaktiver Hero'), `${env}: inactive hero text absent`);
      assert.ok(!html.includes('GibtEsNicht'), `${env}: no missing-component notice for an inactive entry`);
      assert.match(html, /<h1 class="c-page-title">Seitentitel Aktiv<\/h1>/,
        `${env}: an inactive Hero does not suppress the page-title h1`);
      assert.equal((html.match(/<h1\b/g) || []).length, 1, `${env}: exactly one h1`);
    }

    const source = fs.readFileSync(path.join(projectPath, 'pages', 'aktiv.md'), 'utf8');
    assert.equal(source, page, 'the page file is not changed by the build');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
