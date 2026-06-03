import fs from 'fs';
import path from 'path';
import { getEnvironmentMode } from '../../env/resolve.js';

/**
 * Resolve the webpack config file for an environment.
 *
 * Resolution order (decided in Task 87):
 *   1. `<libWebpackDir>/<environment>.js` if it exists (built-in or power-user file)
 *   2. otherwise the base config for the environment's `mode`
 *      (production.js | development.js)
 *
 * @param {object} opts
 * @param {string} opts.libRoot       marbas-site package root
 * @param {string} [opts.projectRoot] project root (for resolving custom-env mode)
 * @param {string} opts.environment   target environment name
 * @returns {string} absolute path to a webpack config file
 */
export function resolveWebpackConfigPath({ libRoot, projectRoot, environment }) {
  const webpackDir = path.join(libRoot, 'src', 'build', 'webpack');

  const envConfig = path.join(webpackDir, `${environment}.js`);
  if (fs.existsSync(envConfig)) {
    return envConfig;
  }

  const mode = getEnvironmentMode(environment, projectRoot);
  return path.join(webpackDir, mode === 'production' ? 'production.js' : 'development.js');
}
