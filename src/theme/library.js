import fs from 'fs';
import path from 'path';

const THEME_FILE_PATTERN = /^theme-[A-Za-z0-9._-]+\.css$/;

export const THEME_DEFAULTS_BY_ID = Object.freeze({
  'theme-atelier': { headerVariant: 'accent', navigationVariant: 'pill', footerVariant: 'default' },
  'theme-atlas': { headerVariant: 'line', navigationVariant: 'underline', footerVariant: 'contrast' },
  'theme-bloom': { headerVariant: 'glass', navigationVariant: 'pill', footerVariant: 'accent' },
  'theme-campus': { headerVariant: 'default', navigationVariant: 'default', footerVariant: 'default' },
  'theme-civic': { headerVariant: 'accent', navigationVariant: 'default', footerVariant: 'contrast' },
  'theme-fjord': { headerVariant: 'line', navigationVariant: 'underline', footerVariant: 'contrast' },
  'theme-forum': { headerVariant: 'default', navigationVariant: 'default', footerVariant: 'default' },
  'theme-gazette': { headerVariant: 'line', navigationVariant: 'underline', footerVariant: 'contrast' },
  'theme-klinik': { headerVariant: 'line', navigationVariant: 'default', footerVariant: 'default' },
  'theme-lumina': { headerVariant: 'glass', navigationVariant: 'pill', footerVariant: 'contrast' },
  'theme-maison': { headerVariant: 'glass', navigationVariant: 'underline', footerVariant: 'contrast' },
  'theme-praxis': { headerVariant: 'accent', navigationVariant: 'default', footerVariant: 'default' },
  'theme-signal': { headerVariant: 'default', navigationVariant: 'pill', footerVariant: 'default' },
  'theme-slate': { headerVariant: 'default', navigationVariant: 'default', footerVariant: 'contrast' },
  'theme-studio': { headerVariant: 'line', navigationVariant: 'underline', footerVariant: 'contrast' },
  'theme-tempo': { headerVariant: 'accent', navigationVariant: 'pill', footerVariant: 'contrast' },
  'theme-terra': { headerVariant: 'line', navigationVariant: 'underline', footerVariant: 'accent' },
  'theme-verdant': { headerVariant: 'glass', navigationVariant: 'pill', footerVariant: 'accent' }
});

const DEFAULT_THEME_DEFAULTS = Object.freeze({
  headerVariant: 'default',
  navigationVariant: 'default',
  footerVariant: 'default'
});

function libThemesDir(libRoot) {
  return path.join(libRoot, 'themes');
}

function formatThemeLabel(fileName) {
  return String(fileName || '')
    .replace(/^theme-/, '')
    .replace(/\.css$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim() || String(fileName || '');
}

export function listLibraryThemes(libRoot) {
  const themesDir = libThemesDir(libRoot);
  if (!fs.existsSync(themesDir)) {
    return [];
  }

  return fs.readdirSync(themesDir)
    .filter(name => THEME_FILE_PATTERN.test(name))
    .sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }))
    .map(fileName => {
      const themeId = fileName.replace(/\.css$/i, '');
      return {
        id: themeId,
        name: formatThemeLabel(fileName),
        fileName,
        sourcePath: path.join(themesDir, fileName),
        defaults: THEME_DEFAULTS_BY_ID[themeId] ?? { ...DEFAULT_THEME_DEFAULTS }
      };
    });
}

export function getThemeDefaults(themeId) {
  const normalized = String(themeId || '').trim().toLowerCase();
  return THEME_DEFAULTS_BY_ID[normalized] ?? { ...DEFAULT_THEME_DEFAULTS };
}
