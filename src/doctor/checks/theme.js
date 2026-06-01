import fs from 'fs';
import path from 'path';
import { readProjectConfig } from '../../project/config.js';
import { resolveThemeFile } from '../../theme/resolver.js';
import { getLibRoot } from '../../eject/index.js';

const LIB_ROOT = getLibRoot();

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

  return [{
    id: 'theme',
    status: 'ok',
    message: isEjected
      ? `${themeId} — ejected (project version)`
      : `${themeId} — library built-in`,
  }];
}
