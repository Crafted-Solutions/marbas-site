import fs from 'fs';
import path from 'path';

/**
 * Warns when .marbas-site-project.json exists but marbas-project.json is missing.
 * @param {string} projectPath
 * @returns {{ id: string, status: 'ok'|'warn'|'error', message: string, details?: string }}
 */
export function checkLegacyConfig(projectPath) {
  const hasLegacy = fs.existsSync(path.join(projectPath, '.marbas-site-project.json'));
  const hasConfig = fs.existsSync(path.join(projectPath, 'marbas-project.json'));

  if (hasLegacy && !hasConfig) {
    return {
      id: 'legacy-config',
      status: 'warn',
      message: 'Legacy config found: .marbas-site-project.json exists but marbas-project.json is missing',
      details: 'Run `marbas-site reinit <path>` to migrate.'
    };
  }

  return { id: 'legacy-config', status: 'ok', message: 'Project config is up to date' };
}
