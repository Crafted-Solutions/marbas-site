import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only the two webpack bases exist as files. Custom environments select one of
// these via their `mode` (see src/build/webpack/resolve-config.js); they are not
// listed here because they are resolved per-project, not as static entries.
const CONFIG_MAP = {
  development: new URL('./development.js', import.meta.url).href,
  production: new URL('./production.js', import.meta.url).href
};

/**
 * Loads a webpack base configuration by name (development | production).
 * Falls back to development if the requested base is unknown.
 *
 * @param {string} [configName]  Defaults to WEBPACK_CONFIG env var or 'development'
 * @returns {Promise<object>}
 */
export async function loadWebpackConfig(configName) {
  const name = configName || process.env.WEBPACK_CONFIG || 'development';

  if (!CONFIG_MAP[name]) {
    logger.warn(`Unknown webpack configuration: "${name}". Falling back to development.`);
    const fallback = await import(CONFIG_MAP.development);
    return fallback.default;
  }

  try {
    logger.verbose(`Loading webpack config: ${name}`);
    const config = await import(CONFIG_MAP[name]);
    return config.default;
  } catch (error) {
    logger.error(`Failed to load webpack configuration "${name}": ${error.message}`);
    logger.warn('Falling back to development configuration');
    const fallback = await import(CONFIG_MAP.development);
    return fallback.default;
  }
}

export { CONFIG_MAP };
