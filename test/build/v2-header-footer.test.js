/**
 * Smoke test (Task 129): header tagline, navLinks (anchor/alert/external), footer text column and
 * bottom note from site.json — without ejected slots. Without the fields the markup stays as before.
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

function buildWith(project, patch) {
  const file = path.join(project, 'pages', '_data', 'site.json');
  const site = JSON.parse(fs.readFileSync(file, 'utf8'));
  patch(site);
  fs.writeFileSync(file, JSON.stringify(site, null, 2));
  const build = run(['build', project, '--env=development']);
  assert.equal(build.status, 0, build.stderr);
  return fs.readFileSync(path.join(project, 'build', 'public_development', 'index.html'), 'utf8');
}

test('Base v2 header/footer fields render from site.json', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-v2hf-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-slate']).status, 0);

    const plain = buildWith(project, (site) => { site.footer.preset = 'columns'; });
    assert.doesNotMatch(plain, /c-brand__text|c-brand__tagline|c-nav__item--alert|c-footer-bottom__note|c-footer-group__text/);

    const html = buildWith(project, (site) => {
      site.header.showCompanyName = true;
      site.header.tagline = { de: 'Rheumatologie · Berlin', en: 'Rheumatology' };
      site.header.navLinks = [
        { label: 'Kontakt', href: '#kontakt' },
        { label: 'Akut', href: '#akut', tone: 'alert' },
        { label: 'Portal', href: 'https://example.org/', external: true },
        { label: '', href: '#leer' }
      ];
      site.footer.preset = 'columns';
      site.footer.groups = [{ title: 'Für Fachkreise', source: 'text', text: '<p>Info für Zuweiser</p>' }];
      site.footer.bottomNote = 'Pflichtangaben ergänzen';
    });

    assert.match(html, /<span class="c-brand__text">\s*<span class="c-brand__name">[^<]+<\/span>\s*<span class="c-brand__tagline">Rheumatologie · Berlin<\/span>/);
    assert.match(html, /<a href="#kontakt" class="c-nav__item"\s*>Kontakt<\/a>/);
    assert.match(html, /<a href="#akut" class="c-nav__item c-nav__item--alert"\s*>Akut<\/a>/);
    assert.match(html, /<a href="https:\/\/example\.org\/" class="c-nav__item" target="_blank" rel="noopener noreferrer"\s*>Portal<\/a>/);
    assert.doesNotMatch(html, /#leer/, 'link without label is skipped');
    assert.match(html, /<p class="c-footer-group__title">Für Fachkreise<\/p>\s*<div class="c-footer-group__text"><p>Info für Zuweiser<\/p><\/div>/);
    assert.match(html, /<p class="c-footer-bottom__note">Pflichtangaben ergänzen<\/p>/);

    const css = fs.readFileSync(path.join(project, 'build', 'public_development', '_assets', 'css', 'base.full.css'), 'utf8');
    assert.match(css, /\.c-page--v2\.c-l-cta-link \.c-btn/, 'v2 CTA form (cta=link) ships with the base');
    assert.match(css, /\.c-link-arrow/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('brand-nav-actions: header.actions also in the menu panel for phones, opt-out via showActionsInDrawer (Task 151)', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-actions-'));
  try {
    const project = path.join(tmp, 'site');
    assert.equal(run(['init', project, '--theme=theme-product']).status, 0);
    const actions = [{ label: 'Termin anfragen', href: '/#kontakt', style: 'primary' }];

    const none = buildWith(project, (site) => { site.header.preset = 'brand-nav-actions'; site.header.actions = []; });
    assert.doesNotMatch(none, /c-nav__actions|c-header--actions-in-nav/);

    const html = buildWith(project, (site) => { site.header.preset = 'brand-nav-actions'; site.header.actions = actions; });
    assert.match(html, /<header role="banner" class="c-header c-header--with-actions c-header--actions-in-nav/);
    const nav = html.slice(html.indexOf('<nav class="c-nav'), html.indexOf('</nav>'));
    assert.match(nav, /<div class="c-nav__actions">\s*<a class="c-btn c-btn--primary" href="\/#kontakt">Termin anfragen<\/a>/);
    assert.match(html, /<div class="c-header-actions">\s*<a class="c-btn c-btn--primary"/, 'desktop row keeps the buttons');

    const optOut = buildWith(project, (site) => { site.header.mobile = { ...(site.header.mobile || {}), showActionsInDrawer: false }; });
    assert.doesNotMatch(optOut, /c-nav__actions|c-header--actions-in-nav/);
    assert.match(optOut, /c-header-actions/);

    const otherPreset = buildWith(project, (site) => { site.header.preset = 'brand-nav'; site.header.mobile.showActionsInDrawer = true; });
    assert.doesNotMatch(otherPreset, /c-nav__actions/, 'presets without header buttons do not add them to the menu');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
