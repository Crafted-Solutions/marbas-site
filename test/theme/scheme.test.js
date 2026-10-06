/**
 * Task 148: dark mode (theme.scheme) — palette logic and build output for light / dark / auto.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { normalizeSchemeConfig, readDarkPreset, readPresetDeclarations, schemeCss } from '../../src/theme/palette.js';
import { resolveThemePalette } from '../../src/theme/copy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const BIN = path.join(ROOT, 'src/cli/bin.js');
const themeCss = (id) => fs.readFileSync(path.join(ROOT, 'themes', `${id}.css`), 'utf8');

test('every Base v2 form names a dark preset that exists', () => {
  for (const id of ['theme-editorial', 'theme-product', 'theme-bold', 'theme-warm', 'theme-minimal-luxe', 'theme-druckwerk', 'theme-blueprint', 'theme-nocturne', 'theme-craft']) {
    const css = themeCss(id);
    const dark = readDarkPreset(css);
    assert.ok(dark, `${id} has @dark`);
    assert.ok(readPresetDeclarations(css, dark).some(([k]) => k === '--p-paper'), `${id}: preset ${dark} defines the palette`);
    const r = resolveThemePalette({ css, theme: { id, scheme: { mode: 'dark' } } });
    assert.deepEqual(r.contrast, [], `${id} dark palette AA: ${JSON.stringify(r.contrast)}`);
  }
});

test('normalizeSchemeConfig: default light, validation of mode and dark colours', () => {
  assert.equal(normalizeSchemeConfig({}).mode, 'light');
  assert.equal(normalizeSchemeConfig({ scheme: { mode: 'auto' } }).mode, 'auto');
  const bad = normalizeSchemeConfig({ scheme: { mode: 'night', dark: { palette: 'X Y', colors: { accent: 'blau', foo: '#000' } } } });
  assert.equal(bad.mode, 'light');
  assert.equal(bad.errors.length, 4, bad.errors.join(' | '));
  assert.match(bad.errors.join(' '), /theme\.scheme\.dark\.colors\.accent/);
});

test('schemeCss / resolveThemePalette: dark block outranks theme.colors, copies form variables, auto adds the media query', () => {
  const css = themeCss('theme-product');
  const light = resolveThemePalette({ css, theme: { colors: { accent: '#7a5e2e' } } });
  assert.equal(light.scheme, 'light');
  assert.doesNotMatch(light.overrideCss, /data-scheme/);

  const auto = resolveThemePalette({ css, theme: { colors: { accent: '#7a5e2e' }, scheme: { mode: 'auto', dark: { colors: { accent: '#d3af54' } } } } });
  assert.equal(auto.scheme, 'auto');
  assert.equal(auto.darkPreset, 'nacht');
  assert.match(auto.overrideCss, /:root:root:root\[data-scheme="dark"\] \{[\s\S]*--product-foot-bg:[\s\S]*--p-accent: #d3af54;[\s\S]*color-scheme: dark;/);
  assert.match(auto.overrideCss, /@media \(prefers-color-scheme: dark\) \{\s*:root:root:root\[data-scheme="auto"\]/);
  assert.ok(auto.overrideCss.indexOf('theme.colors') < auto.overrideCss.indexOf('data-scheme="dark"'), 'dark block after the light colours');

  const only = resolveThemePalette({ css, theme: { scheme: { mode: 'dark' } } });
  assert.doesNotMatch(only.overrideCss, /prefers-color-scheme/);
  assert.equal(schemeCss({ mode: 'light', declarations: [['--p-paper', '#000']] }), '');
});

test('resolveThemePalette: no dark palette → warning and light; classic themes ignore scheme', () => {
  const noDark = resolveThemePalette({ css: '/* @family v2 */ :root { --p-paper: #fff; --p-ink: #111; }', theme: { scheme: { mode: 'auto' } } });
  assert.equal(noDark.scheme, 'light');
  assert.match(noDark.warnings.join(' '), /keine dunkle Palette/);
  const classic = resolveThemePalette({ css: themeCss('theme-slate'), theme: { scheme: { mode: 'auto' } } });
  assert.equal(classic.scheme, 'light');
  assert.match(classic.warnings.join(' '), /nur bei Themes der Familie v2/);
});

// ─── build: light (unchanged) / dark / auto ─────────────────────────────────

function buildProject(scheme, header = {}, siteExtra = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-scheme-'));
  const project = path.join(tmp, 'p', 'site');
  let r = spawnSync(process.execPath, [BIN, 'init', project, '--starter', '--theme=theme-product', '--name=Scheme'], { encoding: 'utf8', timeout: 120_000 });
  assert.equal(r.status, 0, r.stderr);
  const cfgFile = path.join(project, 'marbas-project.json');
  const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  if (scheme) cfg.theme.scheme = scheme; else delete cfg.theme.scheme;
  fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2));
  const siteFile = path.join(project, 'pages', '_data', 'site.json');
  const site = JSON.parse(fs.readFileSync(siteFile, 'utf8'));
  site.header = { ...(site.header || {}), ...header };
  if (siteExtra.logo) site.logo = { ...(site.logo || {}), ...siteExtra.logo };
  fs.writeFileSync(siteFile, JSON.stringify(site, null, 2));
  r = spawnSync(process.execPath, [BIN, 'build', project, '--env=development'], { encoding: 'utf8', timeout: 180_000 });
  assert.equal(r.status, 0, r.stderr);
  const out = path.join(project, 'build', 'public_development');
  const result = { html: fs.readFileSync(path.join(out, 'index.html'), 'utf8'), css: fs.readFileSync(path.join(out, '_assets', 'css', 'theme.css'), 'utf8') };
  fs.rmSync(tmp, { recursive: true, force: true });
  return result;
}

test('build: without theme.scheme nothing dark-mode related is emitted', () => {
  const { html, css } = buildProject(null);
  assert.doesNotMatch(html, /data-scheme|marbas-scheme|c-scheme-|c-brand__mark--/);
  assert.doesNotMatch(css, /data-scheme/);
});

test('build: mode dark → attribute + dark block, no script, no switch', () => {
  const { html, css } = buildProject({ mode: 'dark' }, { schemeToggle: true });
  assert.match(html, /<html lang="de" data-scheme="dark">/);
  assert.doesNotMatch(html, /marbas-scheme|c-scheme-switch|data-scheme-toggle/);
  assert.match(css, /:root:root:root\[data-scheme="dark"\]/);
});

test('build: mode auto → head script (read only), footer switch, header toggle only on request', () => {
  const plain = buildProject({ mode: 'auto' });
  assert.match(plain.html, /<html lang="de" data-scheme="auto">/);
  assert.match(plain.html, /<base href="">\s*<script>\(function\(\)\{try\{var s=localStorage\.getItem\('marbas-scheme'\)/);
  assert.doesNotMatch(plain.html.split('</head>')[0], /setItem|document\.cookie/, 'head script never writes');
  assert.match(plain.html, /class="c-scheme-switch" role="group"[\s\S]*data-scheme-set="auto" aria-pressed="true"/);
  assert.doesNotMatch(plain.html, /data-scheme-toggle/);
  assert.match(plain.css, /prefers-color-scheme: dark/);
  const withHeader = buildProject({ mode: 'auto' }, { schemeToggle: true });
  assert.match(withHeader.html, /<button type="button" class="c-scheme-toggle" data-scheme-toggle aria-pressed="false" aria-label="Hell\/Dunkel umschalten">/);
});

test('build: logo.pathDark → second logo for the dark scheme, hidden from screen readers', () => {
  const { html } = buildProject({ mode: 'auto' }, {}, { logo: { show: true, path: '/_media/logo.svg', pathDark: '/_media/logo-dark.svg' } });
  assert.match(html, /<img class="c-brand__mark c-brand__mark--light" alt="Logo" src="\/_media\/logo\.svg" height="40"\/>/);
  assert.match(html, /<img class="c-brand__mark c-brand__mark--dark" alt="" aria-hidden="true" src="\/_media\/logo-dark\.svg" height="40"\/>/);
});
