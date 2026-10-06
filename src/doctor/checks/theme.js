import fs from 'fs';
import path from 'path';
import { readProjectConfig } from '../../project/config.js';
import { resolveThemeFile } from '../../theme/resolver.js';
import { getLibRoot } from '../../eject/index.js';
import { resolveThemePalette, checkEjectedBaseForV2, checkEjectedBaseForScheme } from '../../theme/copy.js';

const LIB_ROOT = getLibRoot();

// classic mechanism (header/nav/footer variants) — forms (Base v2) design header and footer themselves
const VARIANT_FIELDS = [['header', 'variant'], ['header', 'navigationVariant'], ['footer', 'variant']];

/** Variant fields in site.json that are set to something other than "default" (e.g. ['header.variant=accent']). */
export function findNonDefaultVariants(projectPath, config) {
  const pagesDir = path.resolve(projectPath, config?.paths?.pagesDir || './pages');
  let site;
  try {
    site = JSON.parse(fs.readFileSync(path.join(pagesDir, '_data', 'site.json'), 'utf8'));
  } catch {
    return [];
  }
  return VARIANT_FIELDS
    .map(([group, key]) => [`${group}.${key}`, site?.[group]?.[key]])
    .filter(([, value]) => typeof value === 'string' && value && value !== 'default')
    .map(([field, value]) => `${field}=${value}`);
}

/**
 * @param {{ projectPath: string, libRoot?: string }} opts
 * @returns {Array<{ id: string, status: 'ok'|'warn'|'error', message: string, details?: string }>}
 */
export function checkTheme({ projectPath, libRoot = LIB_ROOT }) {
  const absProject = path.resolve(projectPath);

  let config;
  try {
    config = readProjectConfig(absProject);
  } catch {
    return [{ id: 'theme', status: 'error', message: 'Cannot read marbas-project.json' }];
  }

  const themeId = config?.theme?.id;

  if (!themeId) {
    return [{
      id: 'theme',
      status: 'warn',
      message: 'No theme configured — pages will be unstyled',
      details: 'Run: marbas-site theme <path> <theme-id>',
    }];
  }

  let resolvedPath;
  try {
    resolvedPath = resolveThemeFile({ projectPath: absProject, themeId, libRoot });
  } catch (err) {
    return [{
      id: 'theme',
      status: 'error',
      message: `Theme "${themeId}" not found`,
      details: err.message,
    }];
  }

  const ejectedPath = path.join(absProject, '_theme', `${themeId}.css`);
  const isEjected = fs.existsSync(ejectedPath);
  const palette = resolveThemePalette({ css: fs.readFileSync(resolvedPath, 'utf8'), theme: config.theme });

  const results = [{
    id: 'theme',
    status: 'ok',
    message: (isEjected
      ? `${themeId} — ejected (project version)`
      : `${themeId} — library built-in`) + ` · family ${palette.family}${palette.preset ? ` · palette ${palette.preset}` : ''}`
      + (palette.scheme && palette.scheme !== 'light' ? ` · dark mode ${palette.scheme}${palette.darkPreset ? ` (${palette.darkPreset})` : ''}` : ''),
  }];
  for (const message of palette.errors) results.push({ id: 'theme-palette', status: 'error', message });
  for (const message of palette.warnings) results.push({ id: 'theme-palette', status: 'warn', message });
  const ejectedBase = checkEjectedBaseForV2({ projectRoot: absProject, family: palette.family });
  if (ejectedBase) results.push({ id: 'theme-base', status: 'warn', message: ejectedBase });
  const ejectedScheme = checkEjectedBaseForScheme({ projectRoot: absProject, scheme: palette.scheme });
  if (ejectedScheme) results.push({ id: 'theme-base', status: 'warn', message: ejectedScheme });
  if (palette.family === 'v2') {
    const variants = findNonDefaultVariants(absProject, config);
    if (variants.length) {
      results.push({
        id: 'theme-variants',
        status: 'warn',
        message: `site.json sets variants (${variants.join(', ')}) — they do not apply to forms: the form designs header and footer itself, and a variant can change them unintentionally (e.g. a dark footer)`,
        details: 'Set header.variant, header.navigationVariant and footer.variant to "default" (or remove them). See docs/themes.md → "Switching from classic".',
      });
    }
  }
  for (const c of palette.contrast) {
    results.push({ id: 'theme-palette', status: 'warn', message: `Palette contrast ${c.label}: ${c.ratio}:1 (${c.fg} on ${c.bg}) — below 4.5:1` });
  }
  return results;
}
