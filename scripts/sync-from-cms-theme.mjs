#!/usr/bin/env node
/**
 * sync-from-cms-theme.mjs — brings the visual files of the library into this repo.
 *
 * cms-theme is the single source for everything visual (Task 140): base CSS, all themes, web fonts.
 * This repo only holds generated copies — never edit them here:
 *
 *   cms-theme/css/base.full.css, base.full.min.css   → _assets/css/
 *   cms-theme/css/themes/theme-*.css                  → themes/
 *   cms-theme/css/themes/fonts/**                     → themes/fonts/**
 *
 * The copy is an exact mirror: theme files and font files that no longer exist in cms-theme are removed here.
 * Other files in themes/ (e.g. .gitkeep) are left alone.
 *
 * Usage: node scripts/sync-from-cms-theme.mjs [--source <cms-theme>] [--check]
 *   --source  cms-theme checkout; default: $CMS_THEME_ROOT, else ../../../Privat/Theme/cms-theme (next to the workspace)
 *   --check   no writes; exit 1 when a file is missing, different or superfluous (drift)
 *
 * Changing a theme or a font: edit cms-theme, `npm run fonts:sync` there (fonts), then `npm run sync:theme` here.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME_FILE = /^theme-.*\.css$/;

export function defaultSource() {
  return process.env.CMS_THEME_ROOT || path.resolve(ROOT, '..', '..', '..', 'Privat', 'Theme', 'cms-theme');
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full).map((f) => path.join(entry.name, f)) : [entry.name];
  });
}

/** @returns {Array<{ from: string, to: string }>} every file that must exist here (from = source file) */
function plannedFiles(source, target) {
  const css = path.join(source, 'css');
  const planned = [];
  for (const name of ['base.full.css', 'base.full.min.css']) planned.push({ from: path.join(css, name), to: path.join(target, '_assets', 'css', name) });
  const themes = path.join(css, 'themes');
  for (const name of fs.readdirSync(themes).filter((f) => THEME_FILE.test(f)).sort()) {
    planned.push({ from: path.join(themes, name), to: path.join(target, 'themes', name) });
  }
  for (const rel of listFiles(path.join(themes, 'fonts')).sort()) {
    planned.push({ from: path.join(themes, 'fonts', rel), to: path.join(target, 'themes', 'fonts', rel) });
  }
  return planned;
}

/** Files here that the source no longer has: theme-*.css in themes/ and everything in themes/fonts/. */
function superfluousFiles(target, planned) {
  const wanted = new Set(planned.map((p) => p.to));
  const themesDir = path.join(target, 'themes');
  const candidates = [
    ...(fs.existsSync(themesDir) ? fs.readdirSync(themesDir).filter((f) => THEME_FILE.test(f)).map((f) => path.join(themesDir, f)) : []),
    ...listFiles(path.join(themesDir, 'fonts')).map((f) => path.join(themesDir, 'fonts', f))
  ];
  return candidates.filter((file) => !wanted.has(file));
}

/**
 * @param {{ source: string, target?: string, check?: boolean }} opts
 * @returns {{ copied: string[], removed: string[], drift: string[] }} paths relative to target; in check mode copied/removed stay empty
 */
export function syncFromCmsTheme({ source, target = ROOT, check = false }) {
  if (!source || !fs.existsSync(path.join(source, 'css', 'themes'))) {
    throw new Error(`cms-theme nicht gefunden: ${source || '(leer)'} — Checkout angeben (--source oder $CMS_THEME_ROOT).`);
  }
  const planned = plannedFiles(source, target);
  for (const p of planned) if (!fs.existsSync(p.from)) throw new Error(`Quelle fehlt: ${p.from} — in cms-theme "npm run build:presets" bzw. "npm run fonts:sync" ausführen.`);
  const rel = (file) => path.relative(target, file).split(path.sep).join('/');
  const result = { copied: [], removed: [], drift: [] };

  for (const p of planned) {
    const same = fs.existsSync(p.to) && fs.readFileSync(p.to).equals(fs.readFileSync(p.from));
    if (same) continue;
    if (check) { result.drift.push(`${fs.existsSync(p.to) ? 'abweichend' : 'fehlt'}: ${rel(p.to)}`); continue; }
    fs.mkdirSync(path.dirname(p.to), { recursive: true });
    fs.copyFileSync(p.from, p.to);
    result.copied.push(rel(p.to));
  }
  for (const file of superfluousFiles(target, planned)) {
    if (check) { result.drift.push(`überzählig: ${rel(file)}`); continue; }
    fs.rmSync(file);
    result.removed.push(rel(file));
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const at = args.indexOf('--source');
  const source = path.resolve(at !== -1 && args[at + 1] ? args[at + 1] : defaultSource());
  try {
    const result = syncFromCmsTheme({ source, check });
    if (check) {
      result.drift.forEach((line) => console.error(line));
      console.log(result.drift.length ? `${result.drift.length} Abweichung(en) gegenüber cms-theme — "npm run sync:theme" ausführen.` : 'Alle visuellen Dateien entsprechen cms-theme.');
      process.exit(result.drift.length ? 1 : 0);
    }
    console.log(`${result.copied.length} Datei(en) aus cms-theme kopiert, ${result.removed.length} entfernt (${source}).`);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
