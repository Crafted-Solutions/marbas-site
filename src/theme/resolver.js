import fs from 'fs';
import path from 'path';

const THEME_FILE_PATTERN = /^theme-[A-Za-z0-9._-]+\.css$/;

function validateThemeId(themeId) {
  const normalized = String(themeId || '').trim();
  if (!normalized) {
    throw new Error('themeId must not be empty');
  }

  if (!normalized.startsWith('theme-')) {
    throw new Error(`Invalid themeId "${normalized}": must start with "theme-"`);
  }

  const fileName = `${normalized}.css`;
  if (!THEME_FILE_PATTERN.test(fileName)) {
    throw new Error(`Invalid themeId "${normalized}": contains invalid characters`);
  }

  return normalized;
}

/**
 * Returns true when the theme is present as a local project file
 * (`<projectPath>/_theme/<themeId>.css`), i.e. it was ejected or created by
 * the user. Returns false for lib-bundled themes or on any error.
 *
 * @param {object} opts
 * @param {string} opts.projectPath  Absolute path to the project root
 * @param {string} opts.themeId      Theme ID, e.g. "theme-atlas"
 * @returns {boolean}
 */
export function isCustomTheme({ projectPath, themeId } = {}) {
  if (!projectPath || !themeId) return false;
  try {
    const validId = validateThemeId(themeId);
    return fs.existsSync(path.join(projectPath, '_theme', `${validId}.css`));
  } catch {
    return false;
  }
}

/**
 * Resolves the absolute path to a theme CSS file.
 * Priority: project _theme/ > lib _assets/css/ > (throws if not found)
 *
 * @param {object} opts
 * @param {string} opts.projectPath  Absolute path to the project root
 * @param {string} opts.themeId      Theme ID, e.g. "theme-atlas"
 * @param {string} opts.libRoot      Absolute path to the marbas-site lib root
 * @returns {string} Absolute path to the CSS file
 */
export function resolveThemeFile({ projectPath, themeId, libRoot }) {
  const validId = validateThemeId(themeId);
  const fileName = `${validId}.css`;

  // 1. Project override (ejected theme)
  if (projectPath) {
    const projectTheme = path.join(projectPath, '_theme', fileName);
    if (fs.existsSync(projectTheme)) {
      return projectTheme;
    }
  }

  // 2. Lib built-in
  const libTheme = path.join(libRoot, 'themes', fileName);
  if (fs.existsSync(libTheme)) {
    return libTheme;
  }

  throw new Error(`Theme "${themeId}" not found in project or lib`);
}
