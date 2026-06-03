import { readProjectConfig } from '../project/config.js';

/**
 * Central environment resolution — the single source of truth for which
 * environments exist, whether a name is valid, and which webpack base (mode)
 * an environment uses.
 *
 * Model:
 *   - Two built-ins: `development` (mode development) and `production`
 *     (mode production). Always valid, even without a marbas-project.json.
 *   - Arbitrary user-defined environments in marbas-project.json under
 *     `environments`. Each may carry a `mode` (development | production,
 *     default development) that selects the webpack base. The CMS app stores
 *     this choice historically as `webpackConfig` — both field names are
 *     accepted for forward/backward compatibility.
 */

export const BUILTIN_ENVIRONMENTS = {
  development: { mode: 'development' },
  production: { mode: 'production' }
};

const VALID_MODES = new Set(['development', 'production']);

/**
 * Normalize a mode value to one of the two webpack bases.
 * Unknown / missing → 'development' (safe default: never minify unexpectedly).
 */
export function normalizeMode(mode) {
  const value = String(mode || '').trim().toLowerCase();
  return VALID_MODES.has(value) ? value : 'development';
}

/**
 * Read the project config tolerantly — returns null when absent/unreadable
 * so built-in environments still resolve outside a project.
 */
function readConfigSafe(projectRoot) {
  if (!projectRoot) return null;
  try {
    return readProjectConfig(projectRoot);
  } catch {
    return null;
  }
}

function configEnvironments(config) {
  const envs = config?.environments;
  return envs && typeof envs === 'object' ? envs : {};
}

/**
 * List all available environment names: built-ins merged with the ones defined
 * in marbas-project.json (de-duplicated, built-ins first).
 *
 * @param {string} projectRoot
 * @returns {string[]}
 */
export function listEnvironments(projectRoot) {
  const config = readConfigSafe(projectRoot);
  const names = [...Object.keys(BUILTIN_ENVIRONMENTS)];

  for (const name of Object.keys(configEnvironments(config))) {
    if (!names.includes(name)) {
      names.push(name);
    }
  }

  return names;
}

/**
 * Whether `name` is a valid environment — built-in OR defined in the project
 * config. Never validates against a hardcoded list.
 *
 * @param {string} name
 * @param {string} projectRoot
 * @returns {boolean}
 */
export function isValidEnvironment(name, projectRoot) {
  if (!name) return false;
  if (Object.prototype.hasOwnProperty.call(BUILTIN_ENVIRONMENTS, name)) return true;
  const config = readConfigSafe(projectRoot);
  return Object.prototype.hasOwnProperty.call(configEnvironments(config), name);
}

/**
 * Resolve an environment to its effective descriptor.
 * Throws a clear error (listing the available environments) for unknown names —
 * no silent fallback to `development`.
 *
 * @param {string} name
 * @param {string} projectRoot
 * @returns {{ name: string, mode: 'development'|'production', outputName: string, env: object, isBuiltin: boolean }}
 */
export function resolveEnvironment(name, projectRoot) {
  const config = readConfigSafe(projectRoot);
  const defined = configEnvironments(config);
  const isBuiltin = Object.prototype.hasOwnProperty.call(BUILTIN_ENVIRONMENTS, name);

  if (!name || (!isBuiltin && !Object.prototype.hasOwnProperty.call(defined, name))) {
    const available = listEnvironments(projectRoot).join(', ');
    throw new Error(
      `Unknown environment "${name}". Available environments: ${available}`
    );
  }

  const def = defined[name] || {};
  // mode precedence: explicit env.mode → app's webpackConfig field → built-in mode → default
  const mode = normalizeMode(
    def.mode ?? def.webpackConfig ?? BUILTIN_ENVIRONMENTS[name]?.mode
  );

  return {
    name,
    mode,
    outputName: def.outputName || name,
    env: def.env || {},
    isBuiltin
  };
}

/**
 * Convenience: the webpack mode (development | production) for an environment.
 *
 * @param {string} name
 * @param {string} projectRoot
 * @returns {'development'|'production'}
 */
export function getEnvironmentMode(name, projectRoot) {
  return resolveEnvironment(name, projectRoot).mode;
}
