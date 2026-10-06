import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncFromCmsTheme, defaultSource } from '../../scripts/sync-from-cms-theme.mjs';

const write = (file, content = 'x') => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };

function fixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-sync-theme-'));
  const source = path.join(tmp, 'cms-theme');
  const target = path.join(tmp, 'site');
  write(path.join(source, 'css', 'base.full.css'), 'base');
  write(path.join(source, 'css', 'base.full.min.css'), 'base-min');
  write(path.join(source, 'css', 'themes', 'theme-a.css'), 'a');
  write(path.join(source, 'css', 'themes', 'theme-b.css'), 'b');
  write(path.join(source, 'css', 'themes', 'README.md'), 'not a theme');
  write(path.join(source, 'css', 'themes', 'fonts', 'inter', 'inter.woff2'), 'woff');
  write(path.join(source, 'css', 'themes', 'fonts', 'inter', 'LICENSE'), 'ofl');
  return { tmp, source, target };
}

test('sync: copies base, themes and fonts (not READMEs); a second run changes nothing', () => {
  const { tmp, source, target } = fixture();
  const first = syncFromCmsTheme({ source, target });
  assert.deepEqual(first.copied.sort(), ['_assets/css/base.full.css', '_assets/css/base.full.min.css', 'themes/fonts/inter/LICENSE', 'themes/fonts/inter/inter.woff2', 'themes/theme-a.css', 'themes/theme-b.css']);
  assert.equal(fs.existsSync(path.join(target, 'themes', 'README.md')), false);
  assert.deepEqual(syncFromCmsTheme({ source, target }), { copied: [], removed: [], drift: [] });
  assert.deepEqual(syncFromCmsTheme({ source, target, check: true }).drift, []);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('sync: mirrors — superfluous themes and fonts are removed, other files in themes/ stay', () => {
  const { tmp, source, target } = fixture();
  syncFromCmsTheme({ source, target });
  write(path.join(target, 'themes', 'theme-old.css'));
  write(path.join(target, 'themes', 'fonts', 'gone', 'x.woff2'));
  write(path.join(target, 'themes', '.gitkeep'), '');
  const result = syncFromCmsTheme({ source, target });
  assert.deepEqual(result.removed.sort(), ['themes/fonts/gone/x.woff2', 'themes/theme-old.css']);
  assert.ok(fs.existsSync(path.join(target, 'themes', '.gitkeep')));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('--check: reports drift (different, missing, superfluous) and writes nothing', () => {
  const { tmp, source, target } = fixture();
  syncFromCmsTheme({ source, target });
  fs.writeFileSync(path.join(target, 'themes', 'theme-a.css'), 'edited in site');
  fs.rmSync(path.join(target, '_assets', 'css', 'base.full.css'));
  write(path.join(target, 'themes', 'theme-extra.css'));
  const result = syncFromCmsTheme({ source, target, check: true });
  assert.deepEqual(result.drift.sort(), ['_assets/css/base.full.css'.replace(/^/, 'fehlt: '), 'abweichend: themes/theme-a.css', 'überzählig: themes/theme-extra.css'].sort());
  assert.equal(fs.readFileSync(path.join(target, 'themes', 'theme-a.css'), 'utf8'), 'edited in site', 'check does not write');
  assert.ok(fs.existsSync(path.join(target, 'themes', 'theme-extra.css')));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('sync: clear errors for a missing cms-theme checkout and an incomplete source', () => {
  const { tmp, source, target } = fixture();
  assert.throws(() => syncFromCmsTheme({ source: path.join(tmp, 'nowhere'), target }), /cms-theme nicht gefunden/);
  fs.rmSync(path.join(source, 'css', 'base.full.min.css'));
  assert.throws(() => syncFromCmsTheme({ source, target }), /Quelle fehlt/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('the generated library files in this repo match cms-theme (skipped without a checkout)', (t) => {
  const source = defaultSource();
  if (!fs.existsSync(path.join(source, 'css', 'themes'))) return t.skip('cms-theme checkout not found (set CMS_THEME_ROOT)');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  assert.deepEqual(syncFromCmsTheme({ source, target: root, check: true }).drift, [], 'run "npm run sync:theme"');
});
