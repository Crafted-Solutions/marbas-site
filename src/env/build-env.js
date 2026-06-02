import path from 'path';
import { loadEnvForEnvironment } from '../config/load-env.js';

export { loadEnvForEnvironment };

function normalizeThemeFile(themeFile) {
  const value = String(themeFile || '').trim();
  if (!value) {
    return '';
  }

  const base = path.basename(value);
  return /^theme-[A-Za-z0-9._-]+\.css$/.test(base) ? base : '';
}

function normalizeFooterMode(mode) {
  return String(mode || '').trim() === 'globalData' ? 'globalData' : 'legacy';
}

function normalizeHeaderMode(mode) {
  return String(mode || '').trim() === 'globalData' ? 'globalData' : 'legacy';
}

function resolveI18nEnv(config) {
  const i18n = config?.i18n ?? {};
  const defaultLanguage = String(i18n.defaultLanguage || '').trim();
  const languages = Array.isArray(i18n.languages) ? i18n.languages : [];

  const result = {};
  if (defaultLanguage) {
    result.DEFAULT_LANGUAGE = defaultLanguage;
  }

  if (languages.length > 0) {
    result.SUPPORTED_LANGUAGES = JSON.stringify(languages);
  }

  return result;
}

/**
 * Builds the env-var overrides object for a Build/Preview run.
 * Does NOT mutate process.env — callers merge or pass as child-process env.
 *
 * @param {object} opts
 * @param {string} opts.projectPath  Absolute path to the project root
 * @param {string} opts.environment  Target environment name (e.g. "development")
 * @param {object} [opts.config]     Parsed marbas-project.json config
 * @param {string} [opts.themeFile]  Theme CSS file name (e.g. "theme-dark.css")
 * @param {object} [opts.rendering]  { footerMode, headerMode }
 * @returns {object}  Plain env-var map (all values are strings)
 */
export function buildEnvVars({ projectPath, environment, config = null, themeFile = '', rendering = null }) {
  // rendering param takes precedence; fall back to config.rendering
  rendering = rendering ?? config?.rendering ?? null;
  const envResult = loadEnvForEnvironment({
    rootDir: projectPath,
    environment,
    requirePublic: false,
    apply: false,
    preserveExisting: true
  });

  const vars = {
    ...envResult.publicEnvVars,
    ...envResult.privateEnvVars,
    ...resolveI18nEnv(config),
    MARBAS_PUBLISH_ENVIRONMENT: environment,
    NODE_ENV: 'development'
  };

  const normalizedThemeFile = normalizeThemeFile(themeFile);
  if (normalizedThemeFile) {
    vars.MARBAS_THEME_FILE = normalizedThemeFile;
  }

  vars.MARBAS_FOOTER_MODE = normalizeFooterMode(rendering?.footerMode);
  vars.MARBAS_HEADER_MODE = normalizeHeaderMode(rendering?.headerMode);

  const cssMode = String(config?.theme?.cssMode || config?.cssMode || 'marbas').trim();
  vars.MARBAS_USE_CMS_STYLES = cssMode !== 'external' ? '1' : '0';
  vars.MARBAS_USE_LANGUAGE_SWITCHER = config?.theme?.languageSwitcher !== false ? '1' : '0';

  return vars;
}
