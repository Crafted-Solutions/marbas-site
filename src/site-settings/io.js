import fs from 'fs';
import path from 'path';
import { normalizeSiteSettings, validateSiteSettings } from './normalize.js';

const SITE_SETTINGS_RELATIVE_PATH = path.join('_data', 'site.json');

function resolvePagesDir(projectRoot, config) {
  const configured = String(config?.paths?.pagesDir || './pages').trim() || './pages';
  return path.resolve(projectRoot, configured);
}

export function readSiteSettings(projectRoot, config) {
  const pagesDir = resolvePagesDir(projectRoot, config);
  if (!fs.existsSync(pagesDir)) {
    return { ok: false, error: 'Configured pages directory does not exist.' };
  }

  const relativePath = SITE_SETTINGS_RELATIVE_PATH.split(path.sep).join('/');
  const filePath = path.join(pagesDir, SITE_SETTINGS_RELATIVE_PATH);

  let parsed = {};
  if (fs.existsSync(filePath)) {
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return { ok: false, error: `Site settings could not be read: ${error.message}` };
    }
  }

  return {
    ok: true,
    path: relativePath,
    filePath,
    site: normalizeSiteSettings(parsed, projectRoot)
  };
}

export function saveSiteSettings(projectRoot, config, siteSettings) {
  const pagesDir = resolvePagesDir(projectRoot, config);
  if (!fs.existsSync(pagesDir)) {
    return { ok: false, error: 'Configured pages directory does not exist.' };
  }

  const normalized = normalizeSiteSettings(siteSettings, projectRoot);
  const errors = validateSiteSettings(normalized);
  if (errors.length > 0) {
    return {
      ok: false,
      error: errors.join(' | '),
      errors
    };
  }

  const dataDir = path.join(pagesDir, '_data');
  fs.mkdirSync(dataDir, { recursive: true });

  const filePath = path.join(pagesDir, SITE_SETTINGS_RELATIVE_PATH);
  fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2) + '\n', 'utf8');

  return {
    ok: true,
    path: SITE_SETTINGS_RELATIVE_PATH.split(path.sep).join('/'),
    filePath,
    site: normalized
  };
}
