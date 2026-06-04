import fs from 'fs';
import path from 'path';
import { resolveThemeFile } from './resolver.js';
import { resolveBuildOutputPath } from '../env/output-paths.js';
import { readProjectConfig } from '../project/config.js';

/**
 * Copy the project's configured theme CSS into the build/preview output as
 * `theme.css`. Shared by the production build and the development preview so
 * both behave identically.
 *
 * Reads `theme.id` from `marbas-project.json`, resolves the source file via the
 * project-vor-lib resolver and writes it to `<output>/_assets/css/theme.css`.
 * No-op when the project has no `theme.id`.
 *
 * @param {object} options
 * @param {string} options.projectRoot      Absolute project root
 * @param {string} options.libRoot          Absolute lib root (for lib theme fallback)
 * @param {string} options.environment      Target environment (output dir = public_<env>)
 * @param {object} [options.config]         Pre-read marbas-project.json config (optional)
 * @returns {{ copied: boolean, themeId?: string, error?: string }}
 */
export function copyThemeToOutput({ projectRoot, libRoot, environment, config } = {}) {
  let resolvedConfig = config;
  if (!resolvedConfig) {
    try {
      resolvedConfig = readProjectConfig(projectRoot);
    } catch {
      return { copied: false };
    }
  }

  const themeId = resolvedConfig?.theme?.id || null;
  if (!themeId) return { copied: false };

  let outputPath;
  try {
    outputPath = resolveBuildOutputPath({ projectRoot, config: resolvedConfig, environment });
  } catch {
    outputPath = path.join(projectRoot, 'build', `public_${environment}`);
  }

  try {
    const src = resolveThemeFile({ projectPath: projectRoot, themeId, libRoot });
    const destDir = path.join(outputPath, '_assets', 'css');
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, path.join(destDir, 'theme.css'));
    return { copied: true, themeId };
  } catch (err) {
    return { copied: false, themeId, error: err.message };
  }
}
