import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDefaultSiteSettings } from '../site-settings/defaults.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIB_PKG = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
);

// Built-in environments seeded into every project. Legacy projects that carried
// local_test/staging keep those (they are merged in from the legacy config below)
// but they are no longer seeded as defaults.
const DEFAULT_ENVS = {
  development: { outputName: 'development', env: {} },
  production:  { outputName: 'production',  env: {} }
};

export function reinitProject({ projectPath, force = false } = {}) {
  const absPath = path.resolve(projectPath);
  const configPath = path.join(absPath, 'marbas-project.json');
  const legacyPath = path.join(absPath, '.marbas-site-project.json');

  if (fs.existsSync(configPath) && !force) {
    throw new Error(`marbas-project.json already exists at ${absPath}. Use --force to overwrite.`);
  }

  let legacy = {};
  let hadLegacy = false;

  if (fs.existsSync(legacyPath)) {
    hadLegacy = true;
    try {
      legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
    } catch (err) {
      throw new Error(`Cannot parse .marbas-site-project.json: ${err.message}`);
    }

    const backupDir = path.join(absPath, '.marbas', 'migration-backup');
    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(legacyPath, path.join(backupDir, `marbas-site-project.json.${timestamp}`));
  }

  // Build environments — built-ins plus any legacy-defined env (lib-relevant
  // fields only; CMS-specific baseHref/domain are dropped).
  const envs = {};
  const legacyEnvs = legacy?.environments || {};
  for (const [name, def] of Object.entries({ ...DEFAULT_ENVS, ...legacyEnvs })) {
    envs[name] = { outputName: def.outputName || name, env: def.env || {} };
  }

  // Preserve the legacy default environment as a custom env so a migrated
  // project that built against e.g. "staging" keeps building (no hard break).
  const defaultEnvironment = legacy?.preview?.defaultEnvironment || 'development';
  if (!envs[defaultEnvironment]) {
    envs[defaultEnvironment] = { outputName: defaultEnvironment, env: {} };
  }

  const themeSelected = String(legacy?.theme?.selected || '').trim();
  const themeId = themeSelected ? themeSelected.replace(/\.css$/, '') : null;

  const projectConfig = {
    name: legacy?.name || path.basename(absPath),
    marbasSite: LIB_PKG.version,
    paths: { buildDir: legacy?.paths?.buildDir || './build' },
    defaultEnvironment,
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
    ...(legacy?.i18n ? { i18n: legacy.i18n } : {})
  };

  fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2) + '\n');

  return { configPath, hadLegacy, config: projectConfig };
}

const GITIGNORE = `node_modules/
build/
.marbas/trash/
.marbas/build-context/
.marbas/migration-backup/
`;

const INDEX_PAGE = `---
layout: base
title: Willkommen
---

# Willkommen bei deinem neuen Marbas-Projekt
`;

const STARTER_PAGES_DIR = path.join(__dirname, 'starter', 'pages');

function copyStarterPages(targetPagesDir) {
  const stack = [{ src: STARTER_PAGES_DIR, dest: targetPagesDir }];
  while (stack.length > 0) {
    const { src, dest } = stack.pop();
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        stack.push({ src: srcPath, dest: destPath });
      } else if (entry.name !== '_data') {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Initialise a new Marbas project at projectPath.
 *
 * @param {object} options
 * @param {string} options.projectPath          Target directory (must not exist unless force)
 * @param {string} [options.name]               Project name (defaults to directory basename)
 * @param {string} [options.description]        Optional description
 * @param {string} [options.defaultEnvironment] Default build environment (default: "development")
 * @param {boolean} [options.force]             Overwrite if already a Marbas project
 * @param {boolean} [options.starter]           Copy starter pages with example components
 */
export function initProject({
  projectPath,
  name,
  description = '',
  defaultEnvironment = 'development',
  force = false,
  starter = false
} = {}) {
  const absPath = path.resolve(projectPath);
  const projectName = name || path.basename(absPath);

  const alreadyInitialised = fs.existsSync(path.join(absPath, 'marbas-project.json'));
  if (alreadyInitialised && !force) {
    throw new Error(
      `Directory already exists: ${absPath}\nUse --force to overwrite.`
    );
  }

  // Directories
  const dirs = [
    absPath,
    path.join(absPath, 'pages', '_data'),
    path.join(absPath, '_components'),
    path.join(absPath, '_theme'),
    path.join(absPath, '_media'),
    path.join(absPath, '.marbas')
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // .gitkeep placeholders for empty dirs
  for (const dir of ['_components', '_theme', '_media']) {
    fs.writeFileSync(path.join(absPath, dir, '.gitkeep'), '');
  }

  // marbas-project.json
  const projectConfig = {
    name: projectName,
    description,
    marbasSite: LIB_PKG.version,
    paths: {
      buildDir: './build'
    },
    defaultEnvironment,
    environments: {
      development: { outputName: 'development', env: {} },
      production: { outputName: 'production', env: {} }
    },
    deployTargets: {},
    theme: {
      id: null,
      cssMode: 'marbas',
      languageSwitcher: true
    },
    rendering: {
      footerMode: 'globalData',
      headerMode: 'globalData'
    }
  };
  fs.writeFileSync(
    path.join(absPath, 'marbas-project.json'),
    JSON.stringify(projectConfig, null, 2) + '\n'
  );

  // _data/site.json
  const siteSettings = getDefaultSiteSettings(absPath);
  fs.writeFileSync(
    path.join(absPath, 'pages', '_data', 'site.json'),
    JSON.stringify(siteSettings, null, 2) + '\n'
  );

  // pages/index.md — starter copies example pages, minimal writes a blank index
  if (starter) {
    copyStarterPages(path.join(absPath, 'pages'));
  } else {
    fs.writeFileSync(path.join(absPath, 'pages', 'index.md'), INDEX_PAGE);
  }

  // .gitignore
  fs.writeFileSync(path.join(absPath, '.gitignore'), GITIGNORE);
}
