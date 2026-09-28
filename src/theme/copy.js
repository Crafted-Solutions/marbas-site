import fs from 'fs';
import path from 'path';
import { resolveThemeFile } from './resolver.js';
import { resolveBuildOutputPath } from '../env/output-paths.js';
import { readProjectConfig } from '../project/config.js';

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
    fs.copyFileSync(src, path.join(destDir, 'theme.css'));
    const fonts = copyThemeFonts({ css: fs.readFileSync(src, 'utf8'), projectRoot, libRoot, outputPath });
    return { copied: true, themeId, fonts };
  } catch (err) {
    return { copied: false, themeId, error: err.message };
  }
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
