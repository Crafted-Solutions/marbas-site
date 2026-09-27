import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initProject } from '../../src/init/index.js';

// Task 112: project defaults written by init

function tmpProject(name = 'folder-name') {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-init-defaults-'));
  return { tmp, projectPath: path.join(tmp, name) };
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const site = (projectPath) => readJson(path.join(projectPath, 'pages', '_data', 'site.json'));
const project = (projectPath) => readJson(path.join(projectPath, 'marbas-project.json'));

test('--name reaches site.json title, companyName, copyright and seo.siteName', () => {
  const { tmp, projectPath } = tmpProject();
  try {
    initProject({ projectPath, name: 'Praxis Muster' });
    const s = site(projectPath);
    assert.equal(s.title, 'Praxis Muster');
    assert.equal(s.footer.companyName, 'Praxis Muster');
    assert.match(s.footer.copyright, /Praxis Muster$/);
    assert.equal(s.seo.siteName, 'Praxis Muster');
  } finally { fs.rmSync(tmp, { recursive: true }); }
});

test('locale is written and the language switcher is off for one language', () => {
  const { tmp, projectPath } = tmpProject();
  try {
    initProject({ projectPath });
    assert.deepEqual(site(projectPath).locale, { defaultLanguage: 'de', languages: [{ code: 'de', label: 'Deutsch' }] });
    assert.equal(project(projectPath).theme.languageSwitcher, false);
  } finally { fs.rmSync(tmp, { recursive: true }); }
});

test('--lang=en: English locale, English starter pages and legal links', () => {
  const { tmp, projectPath } = tmpProject();
  try {
    initProject({ projectPath, starter: true, lang: 'en' });
    const s = site(projectPath);
    assert.equal(s.locale.defaultLanguage, 'en');
    assert.deepEqual(s.footer.bottomLinks.links.map((l) => l.href), ['/imprint/', '/privacy/']);
    const pages = fs.readdirSync(path.join(projectPath, 'pages')).filter((f) => f.endsWith('.md')).sort();
    assert.deepEqual(pages, ['about-us.md', 'imprint.md', 'index.md', 'privacy.md']);
    for (const page of pages) {
      assert.match(fs.readFileSync(path.join(projectPath, 'pages', page), 'utf8'), /pageLanguage: en/);
    }
  } finally { fs.rmSync(tmp, { recursive: true }); }
});

test('invalid --lang is rejected', () => {
  const { tmp, projectPath } = tmpProject();
  try {
    assert.throws(() => initProject({ projectPath, lang: 'xyz1' }), /Invalid --lang/);
  } finally { fs.rmSync(tmp, { recursive: true }); }
});

test('--theme sets theme.id and the theme variant defaults', () => {
  const { tmp, projectPath } = tmpProject();
  try {
    initProject({ projectPath, theme: 'theme-atlas' });
    assert.equal(project(projectPath).theme.id, 'theme-atlas');
    const s = site(projectPath);
    assert.equal(s.header.variant, 'line');
    assert.equal(s.header.navigationVariant, 'underline');
    assert.equal(s.footer.variant, 'contrast');
    assert.throws(() => initProject({ projectPath: path.join(tmp, 'other'), theme: 'theme-doesnotexist' }));
  } finally { fs.rmSync(tmp, { recursive: true }); }
});

test('.gitignore covers build artefacts; favicons are seeded', () => {
  const { tmp, projectPath } = tmpProject();
  try {
    initProject({ projectPath });
    const gitignore = fs.readFileSync(path.join(projectPath, '.gitignore'), 'utf8');
    for (const entry of ['.cache/', '_webpack/lib-entry.js', '_webpack/custom-js-entry.js']) {
      assert.ok(gitignore.includes(entry), `.gitignore contains ${entry}`);
    }
    for (const file of ['favicon.ico', 'apple-touch-icon.png']) {
      assert.ok(fs.existsSync(path.join(projectPath, '_assets', 'favicons', file)), `${file} seeded`);
    }
  } finally { fs.rmSync(tmp, { recursive: true }); }
});

test('starter pages (de and en) contain no "#" links and no duplicated legal heading', () => {
  for (const lang of ['de', 'en']) {
    const { tmp, projectPath } = tmpProject();
    try {
      initProject({ projectPath, starter: true, lang });
      const dir = path.join(projectPath, 'pages');
      for (const page of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
        const src = fs.readFileSync(path.join(dir, page), 'utf8');
        assert.ok(!/link: "#"/.test(src), `${lang}/${page}: no "#" link`);
        if (/robotsNoIndex: true/.test(src)) {
          const main = src.slice(src.indexOf('Placeholder_Main'));
          assert.ok(!/\n    title:/.test(main), `${lang}/${page}: legal page repeats its title as H2`);
        }
      }
    } finally { fs.rmSync(tmp, { recursive: true }); }
  }
});

test('regional German code (de-at) gets the German starter and legal links', () => {
  const { tmp, projectPath } = tmpProject();
  try {
    initProject({ projectPath, starter: true, lang: 'de-at' });
    const s = site(projectPath);
    assert.equal(s.locale.defaultLanguage, 'de-at');
    assert.equal(s.locale.languages[0].label, 'Deutsch');
    assert.deepEqual(s.footer.bottomLinks.links.map((l) => l.href), ['/impressum/', '/datenschutz/']);
    assert.ok(fs.existsSync(path.join(projectPath, 'pages', 'impressum.md')));
  } finally { fs.rmSync(tmp, { recursive: true }); }
});
