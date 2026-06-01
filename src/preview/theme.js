import fs from 'fs';
import path from 'path';
import { resolveBuildOutputPath } from '../env/output-paths.js';
import { readProjectConfig } from '../project/config.js';

/**
 * Atomically swap the active theme in the build output.
 * Writes theme CSS to a sibling .tmp file then renames it into place —
 * same-filesystem rename is atomic on POSIX and near-atomic on Windows/NTFS.
 *
 * @param {object} options
 * @param {string} options.projectPath   Absolute project root
 * @param {string} options.themeId       Theme identifier (e.g. "blue" → theme-blue.css)
 * @param {string} options.environment
 */
export function setActiveTheme({ projectPath, themeId, environment }) {
  const themeSrcPath = path.join(projectPath, '_assets', 'css', `theme-${themeId}.css`);
  if (!fs.existsSync(themeSrcPath)) {
    throw new Error(`Theme file not found: ${themeSrcPath}`);
  }

  let outputPath;
  try {
    const config = readProjectConfig(projectPath);
    outputPath = resolveBuildOutputPath({ projectRoot: projectPath, config, environment });
  } catch {
    outputPath = path.join(projectPath, 'build', `public_${environment}`);
  }

  const themeDestPath = path.join(outputPath, '_assets', 'css', 'theme.css');
  const themeTmpPath = themeDestPath + '.tmp';

  fs.mkdirSync(path.dirname(themeDestPath), { recursive: true });
  fs.copyFileSync(themeSrcPath, themeTmpPath);
  fs.renameSync(themeTmpPath, themeDestPath);
}
