import fs from 'fs';
import path from 'path';

const CONFIG_FILE = 'marbas-project.json';
const LEGACY_CONFIG_FILE = '.marbas-site-project.json';

const LEGACY_DEFAULT_ENVS = {
  development: { outputName: 'development', env: {} },
  local_test:  { outputName: 'local_test',  env: {} },
  staging:     { outputName: 'staging',     env: {} },
  production:  { outputName: 'production',  env: {} }
};

function convertLegacyConfig(legacy) {
  const envs = {};
  const legacyEnvs = legacy?.environments || {};

  // Merge legacy-defined envs with the four classic defaults
  for (const [name, def] of Object.entries({ ...LEGACY_DEFAULT_ENVS, ...legacyEnvs })) {
    envs[name] = {
      outputName: def.outputName || name,
      env: def.env || {}
    };
  }

  const themeSelected = String(legacy?.theme?.selected || '').trim();
  const themeId = themeSelected ? themeSelected.replace(/\.css$/, '') : null;

  return {
    name: legacy?.name || path.basename(process.cwd()),
    marbasSite: legacy?.marbasSite || '0.0.1',
    paths: {
      buildDir: legacy?.paths?.buildDir || './build',
      ...(legacy?.paths?.pagesDir ? { pagesDir: legacy.paths.pagesDir } : {})
    },
    defaultEnvironment: legacy?.preview?.defaultEnvironment || 'development',
    environments: envs,
    deployTargets: {},
    theme: {
      id: themeId,
      cssMode: legacy?.cssMode || legacy?.theme?.cssMode || 'marbas',
      languageSwitcher: legacy?.theme?.languageSwitcher !== false
    },
    rendering: {
      footerMode: legacy?.rendering?.footerMode || 'globalData',
      headerMode: legacy?.rendering?.headerMode || 'globalData'
    },
    ...(legacy?.i18n ? { i18n: legacy.i18n } : {}),
    _fromLegacy: true
  };
}

function applyDefaults(raw) {
  const config = { ...raw };
  if (!config.paths) config.paths = {};
  if (!config.paths.buildDir) config.paths.buildDir = './build';
  if (!config.environments || typeof config.environments !== 'object') config.environments = {};
  config.theme = {
    id: null,
    cssMode: 'marbas',
    languageSwitcher: true,
    ...(config.theme || {})
  };
  config.rendering = {
    footerMode: 'globalData',
    headerMode: 'globalData',
    ...(config.rendering || {})
  };
  if (!config.i18n) config.i18n = {};
  return config;
}

export function readProjectConfig(projectPath) {
  const configPath = path.join(projectPath, CONFIG_FILE);
  const legacyPath = path.join(projectPath, LEGACY_CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    if (fs.existsSync(legacyPath)) {
      let legacy;
      try {
        legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
      } catch (error) {
        throw new Error(`Failed to parse ${LEGACY_CONFIG_FILE}: ${error.message}`);
      }
      return convertLegacyConfig(legacy);
    }
    throw new Error(`marbas-project.json not found in ${projectPath}`);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse marbas-project.json: ${error.message}`);
  }

  const config = applyDefaults(raw);

  if (Object.keys(config.environments).length === 0) {
    throw new Error('marbas-project.json must define at least one environment in "environments"');
  }

  return config;
}

export function listEnvironments(projectPath) {
  const config = readProjectConfig(projectPath);
  return Object.keys(config.environments);
}

export function getEnvironment(projectPath, name) {
  const config = readProjectConfig(projectPath);
  const env = config.environments[name];

  if (!env) {
    throw new Error(`Environment "${name}" not found in marbas-project.json`);
  }

  return { name, ...env };
}

export function writeProjectConfig(projectPath, config) {
  const configPath = path.join(projectPath, CONFIG_FILE);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}
