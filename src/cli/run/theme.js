import path from 'path';
import { readProjectConfig, writeProjectConfig } from '../../project/config.js';
import { resolveThemeFile } from '../../theme/resolver.js';
import { getLibRoot } from '../../eject/index.js';

const LIB_ROOT = getLibRoot();

export function runTheme({ projectPath, themeId, libRoot = LIB_ROOT }) {
  if (!projectPath || !themeId) {
    process.stderr.write('Usage: marbas-site theme <path> <theme-id>\n');
    process.exit(1);
  }

  const absProject = path.resolve(projectPath);

  let config;
  try {
    config = readProjectConfig(absProject);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }

  try {
    resolveThemeFile({ projectPath: absProject, themeId, libRoot });
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }

  config.theme = { ...config.theme, id: themeId };
  writeProjectConfig(absProject, config);
  process.stdout.write(`Theme set to ${themeId}. Run "marbas-site build" to apply.\n`);
}
