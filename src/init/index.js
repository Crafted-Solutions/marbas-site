import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDefaultSiteSettings } from '../site-settings/defaults.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIB_PKG = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
);

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

/**
 * Initialise a new, minimal Marbas project at projectPath.
 *
 * @param {object} options
 * @param {string} options.projectPath         Target directory (must not exist unless force)
 * @param {string} [options.name]              Project name (defaults to directory basename)
 * @param {string} [options.description]       Optional description
 * @param {string} [options.defaultEnvironment] Default build environment (default: "development")
 * @param {boolean} [options.force]            Overwrite if directory already exists
 */
export function initProject({
  projectPath,
  name,
  description = '',
  defaultEnvironment = 'development',
  force = false
} = {}) {
  const absPath = path.resolve(projectPath);
  const projectName = name || path.basename(absPath);

  if (fs.existsSync(absPath) && !force) {
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
      [defaultEnvironment]: {
        outputName: defaultEnvironment,
        env: {}
      }
    },
    deployTargets: {}
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

  // pages/index.md
  fs.writeFileSync(path.join(absPath, 'pages', 'index.md'), INDEX_PAGE);

  // .gitignore
  fs.writeFileSync(path.join(absPath, '.gitignore'), GITIGNORE);
}
