import fs from 'fs';
import path from 'path';
import { resolveThemeFile } from './resolver.js';
import { resolveBuildOutputPath } from '../env/output-paths.js';
import { readProjectConfig } from '../project/config.js';
import { readThemeFamily, readPalettePresets, readPaletteValues, normalizePaletteConfig, paletteOverrideCss, paletteContrastWarnings } from './palette.js';
import { readThemeLayout, LAYOUT_DEFAULTS } from './layout.js';

/**
 * Copy the project's configured theme CSS into the build/preview output as
 * `theme.css`. Shared by the production build and the development preview so
 * both behave identically.
 *
 * Reads `theme.id` from `marbas-project.json`, resolves the source file via the
 * project-vor-lib resolver and writes it to `<output>/_assets/css/theme.css`.
 * No-op when the project has no `theme.id`.
 *
 * @param {object} options
 * @param {string} options.projectRoot      Absolute project root
 * @param {string} options.libRoot          Absolute lib root (for lib theme fallback)
 * @param {string} options.environment      Target environment (output dir = public_<env>)
 * @param {object} [options.config]         Pre-read marbas-project.json config (optional)
 * Also copies the web fonts the theme references (see copyThemeFonts).
 *
 * @returns {{ copied: boolean, themeId?: string, fonts?: { copied: string[], missing: string[] }, error?: string }}
 */
export function copyThemeToOutput({ projectRoot, libRoot, environment, config } = {}) {
  let resolvedConfig = config;
  if (!resolvedConfig) {
    try {
      resolvedConfig = readProjectConfig(projectRoot);
    } catch {
      return { copied: false };
    }
  }

  const themeId = resolvedConfig?.theme?.id || null;
  if (!themeId) return { copied: false };

  let outputPath;
  try {
    outputPath = resolveBuildOutputPath({ projectRoot, config: resolvedConfig, environment });
  } catch {
    outputPath = path.join(projectRoot, 'build', `public_${environment}`);
  }

  try {
    const src = resolveThemeFile({ projectPath: projectRoot, themeId, libRoot });
    const destDir = path.join(outputPath, '_assets', 'css');
    fs.mkdirSync(destDir, { recursive: true });
    const css = fs.readFileSync(src, 'utf8');
    const palette = resolveThemePalette({ css, theme: resolvedConfig.theme });
    const ejectedBase = checkEjectedBaseForV2({ projectRoot, family: palette.family });
    if (ejectedBase) palette.warnings.push(ejectedBase);
    fs.writeFileSync(path.join(destDir, 'theme.css'), css + palette.overrideCss);
    const fonts = copyThemeFonts({ css, projectRoot, libRoot, outputPath });
    return { copied: true, themeId, fonts, family: palette.family, palette };
  } catch (err) {
    return { copied: false, themeId, error: err.message };
  }
}

/**
 * A v2 theme needs the family class / palette attribute from the library base.njk. An ejected
 * `_includes/base.njk` from before Base v2 lacks them → the theme renders boxed with default colours.
 * @returns {string|null} warning
 */
export function checkEjectedBaseForV2({ projectRoot, family }) {
  if (family !== 'v2' || !projectRoot) return null;
  const ejected = path.join(projectRoot, '_includes', 'base.njk');
  if (!fs.existsSync(ejected)) return null;
  const source = fs.readFileSync(ejected, 'utf8');
  if (source.includes('marbasTheme.family') && source.includes('marbasTheme.palette') && source.includes('marbasTheme.layoutClasses')) return null;
  return 'Projekt hat eine ge-ejectete _includes/base.njk ohne Base-v2-Klassen — das v2-Theme wirkt nicht vollständig (boxed, Palette/Preset oder Layout ignoriert). '
    + 'Ergänzen: <html … {% if marbasTheme.palette %}data-palette="{{ marbasTheme.palette }}"{% endif %}> und <body class="c-page c-page--{{ marbasTheme.family }} {{ marbasTheme.layoutClasses }}">, oder marbas-site reset <p> _includes/base.njk';
}

/**
 * Base v2 palette for a theme + the project's `theme.palette` / `theme.colors`.
 * classic themes ignore both (their colours are not palette-driven) — reported as a warning.
 *
 * @returns {{ family, preset, overrideCss, errors: string[], warnings: string[], contrast: Array, layout: object }}
 */
export function resolveThemePalette({ css, theme = {} }) {
  const family = readThemeFamily(css);
  const { preset, colors, errors } = normalizePaletteConfig(theme);
  const warnings = [];
  if (family !== 'v2') {
    if (preset || Object.keys(colors).length) warnings.push('theme.palette/theme.colors wirken nur bei Themes der Familie v2 — ignoriert');
    return { family, preset: null, overrideCss: '', errors, warnings, contrast: [], layout: { ...LAYOUT_DEFAULTS } };
  }
  const themeLayout = readThemeLayout(css);
  warnings.push(...themeLayout.warnings);
  let activePreset = preset;
  if (preset && !readPalettePresets(css).includes(preset)) {
    warnings.push(`theme.palette "${preset}" gibt es in diesem Theme nicht (vorhanden: ${readPalettePresets(css).join(', ') || 'keine'}) — Standard-Palette aktiv`);
    activePreset = null;
  }
  const values = { ...readPaletteValues(css, activePreset), ...colors };
  return { family, preset: activePreset, overrideCss: paletteOverrideCss(colors), errors, warnings, contrast: paletteContrastWarnings(values), layout: themeLayout.layout };
}

/**
 * Copy the web fonts a theme references (`url('/_assets/fonts/<id>/<file>')`) from
 * `<lib>/themes/fonts/` into `<output>/_assets/fonts/`. Only referenced files are copied, so a
 * build carries the fonts of its own theme, not the whole library. Files the project ships itself
 * (`<project>/_assets/fonts/…`, copied by the regular asset passthrough) take precedence.
 *
 * @returns {{ copied: string[], missing: string[] }} relative font paths
 */
export function copyThemeFonts({ css, projectRoot, libRoot, outputPath }) {
  const copied = [];
  const missing = [];
  const seen = new Set();
  for (const [, raw] of String(css).matchAll(/url\(\s*['"]?\/_assets\/fonts\/([^'")?#]+)['"]?\s*\)/g)) {
    let rel;
    try {
      rel = decodeURIComponent(raw); // `my%20font/x.woff2` → file `my font/x.woff2`
    } catch {
      rel = raw;
    }
    if (seen.has(rel) || rel.split(/[\\/]/).includes('..')) continue;
    seen.add(rel);
    if (projectRoot && fs.existsSync(path.join(projectRoot, '_assets', 'fonts', rel))) continue;
    const src = libRoot ? path.join(libRoot, 'themes', 'fonts', rel) : null;
    if (!src || !fs.existsSync(src)) {
      missing.push(rel);
      continue;
    }
    const dest = path.join(outputPath, '_assets', 'fonts', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied.push(rel);
  }
  return { copied, missing };
}
