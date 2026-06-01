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

export function withLogger(logger) {
  return logger ?? createConsoleLogger();
}

/**
 * Shared singleton logger for modules that run in their own process (e.g. the
 * webpack configs spawned as child processes). Its level is seeded from the
 * LOG_LEVEL env var so verbose output stays suppressed unless explicitly enabled.
 */
export const logger = createConsoleLogger();
logger.setLevel(process.env.LOG_LEVEL || 'normal');
