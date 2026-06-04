function noop() {}

const LEVELS = {
  silent: 0,
  minimal: 1,
  normal: 2,
  verbose: 3
};

function normalizeLevel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(LEVELS, normalized)) {
    return normalized;
  }

  return 'normal';
}

export function createConsoleLogger() {
  let currentLevel = 'normal';

  const shouldLog = (levelName) => LEVELS[currentLevel] >= LEVELS[normalizeLevel(levelName)];

  return {
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args),
    info: (...args) => console.log(...args),
    verbose: (...args) => console.debug(...args),
    buildStart: (...args) => console.log(...args),
    buildStep: (_emoji, message) => console.log(message),
    buildSuccess: (_emoji, message) => console.log(message),
    buildWarning: (_emoji, message) => console.warn(message),
    buildError: (_emoji, message) => console.error(message),
    envInfo: noop,
    buildSummary: noop,
    webpackStart: (_name) => console.log('Building assets...'),
    webpackSuccess: () => console.log('Webpack build completed'),
    eleventyStart: () => console.log('Building site...'),
    eleventySuccess: () => console.log('Eleventy build completed'),
    shouldLog,
    getChildProcessOptions: (cwd, env = {}) => ({
      cwd,
      env: { ...process.env, ...env },
      stdio: shouldLog('verbose') ? 'inherit' : 'pipe',
      windowsHide: true
    }),
    setLevel: (levelName) => {
      currentLevel = normalizeLevel(levelName);
    }
  };
}

/**
 * The Marbas logger contract. Maps every method to the fallback category used
 * when a provided (possibly partial) logger does not implement it. Single source
 * of truth — `createConsoleLogger` must implement every key (guarded by a test).
 *
 * Categories:
 *  - info / warn / error  → route to the provided logger's grouped method,
 *    falling back to the console so output is never silently swallowed
 *  - noop                 → decorative methods that may legitimately do nothing
 *  - shouldLog / getChildProcessOptions / setLevel → value-returning helpers
 */
export const LOGGER_CONTRACT = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  verbose: 'info',
  buildStart: 'info',
  buildStep: 'info',
  buildSuccess: 'info',
  buildWarning: 'warn',
  buildError: 'error',
  envInfo: 'noop',
  buildSummary: 'noop',
  webpackStart: 'info',
  webpackSuccess: 'info',
  eleventyStart: 'info',
  eleventySuccess: 'info',
  shouldLog: 'shouldLog',
  getChildProcessOptions: 'getChildProcessOptions',
  setLevel: 'setLevel'
};

/**
 * @typedef {object} MarbasLogger
 * @property {(...args: any[]) => void} error
 * @property {(...args: any[]) => void} warn
 * @property {(...args: any[]) => void} info
 * @property {(...args: any[]) => void} verbose
 * @property {(...args: any[]) => void} buildStart
 * @property {(emoji: string, message: string) => void} buildStep
 * @property {(emoji: string, message: string) => void} buildSuccess
 * @property {(emoji: string, message: string) => void} buildWarning
 * @property {(emoji: string, message: string) => void} buildError
 * @property {(...args: any[]) => void} envInfo
 * @property {(...args: any[]) => void} buildSummary
 * @property {(name: string) => void} webpackStart
 * @property {() => void} webpackSuccess
 * @property {(serve?: boolean) => void} eleventyStart
 * @property {() => void} eleventySuccess
 * @property {(levelName: string) => boolean} shouldLog
 * @property {(cwd: string, env?: object) => object} getChildProcessOptions
 * @property {(levelName: string) => void} setLevel
 */

const bindIfFn = (obj, name) => (typeof obj?.[name] === 'function' ? obj[name].bind(obj) : null);

/**
 * Normalize an arbitrary (possibly partial or absent) logger into a complete
 * {@link MarbasLogger}. Every contract method is guaranteed callable so callers
 * never need optional chaining and no output is silently dropped.
 *
 * @param {Partial<MarbasLogger>|null|undefined} logger
 * @returns {MarbasLogger}
 */
export function withLogger(logger) {
  if (!logger) return createConsoleLogger();

  const consoleFallback = createConsoleLogger();

  const info = bindIfFn(logger, 'info') || consoleFallback.info;
  const warn = bindIfFn(logger, 'warn') || info;
  const error = bindIfFn(logger, 'error') || consoleFallback.error;

  const categories = {
    info,
    warn,
    error,
    noop,
    shouldLog: bindIfFn(logger, 'shouldLog') || (() => true),
    // NOTE: the getChildProcessOptions fallback is the console logger's own (level
    // "normal"). A partial logger that supplies a custom `shouldLog` but no
    // `getChildProcessOptions` therefore won't have its verbosity reflected in the
    // spawned child's stdio. Acceptable: real callers pass either a complete logger
    // or none. Revisit if a partial logger needs verbose child output.
    getChildProcessOptions: bindIfFn(logger, 'getChildProcessOptions') || consoleFallback.getChildProcessOptions,
    setLevel: bindIfFn(logger, 'setLevel') || noop
  };

  const normalized = {};
  for (const [method, category] of Object.entries(LOGGER_CONTRACT)) {
    normalized[method] = bindIfFn(logger, method) || categories[category];
  }
  return normalized;
}

/**
 * Shared singleton logger for modules that run in their own process (e.g. the
 * webpack configs spawned as child processes). Its level is seeded from the
 * LOG_LEVEL env var so verbose output stays suppressed unless explicitly enabled.
 */
export const logger = createConsoleLogger();
logger.setLevel(process.env.LOG_LEVEL || 'normal');
