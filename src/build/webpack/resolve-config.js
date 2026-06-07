import fs from 'fs';
import path from 'path';
import { getEnvironmentMode, BUILTIN_ENVIRONMENTS } from '../../env/resolve.js';

// Generated webpack entry files that share the _webpack/ directory — never load these as configs.
const RESERVED_WEBPACK_NAMES = new Set(['lib-entry', 'custom-js-entry', 'app', 'main']);

/**
 * Resolve the webpack config file for an environment.
 *
 * Resolution order:
 *   1. `<projectRoot>/_webpack/<environment>.js`  — optional project-local override
 *   2. `<libWebpackDir>/<environment>.js`          — built-in env file (development / production)
 *   3. base config matched by the environment's `mode` (production.js | development.js)
 *
 * @param {object} opts
 * @param {string} opts.libRoot       marbas-site package root
 * @param {string} [opts.projectRoot] project root (for project-local config + mode resolution)
 * @param {string} opts.environment   target environment name
 * @returns {string} absolute path to a webpack config file
 */
export function resolveWebpackConfigPath({ libRoot, projectRoot, environment }) {
  const isBuiltin = Object.prototype.hasOwnProperty.call(BUILTIN_ENVIRONMENTS, environment);
  if (projectRoot && !isBuiltin && !RESERVED_WEBPACK_NAMES.has(environment)) {
    const localConfig = path.join(projectRoot, '_webpack', `${environment}.js`);
    if (fs.existsSync(localConfig)) {
      return localConfig;
    }
  }

  const webpackDir = path.join(libRoot, 'src', 'build', 'webpack');

  const envConfig = path.join(webpackDir, `${environment}.js`);
  if (fs.existsSync(envConfig)) {
    return envConfig;
  }

  const mode = getEnvironmentMode(environment, projectRoot);
  return path.join(webpackDir, mode === 'production' ? 'production.js' : 'development.js');
}
