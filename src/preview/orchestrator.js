import path from 'path';
import { startWebpackWatch } from './webpack-watch.js';
import { startEleventyWatch } from './eleventy-watch.js';
import { getLibRoot } from '../eject/index.js';
import { resolveWebpackConfigPath } from '../build/webpack/resolve-config.js';
import { copyThemeToOutput } from '../theme/copy.js';

const LIB_ROOT = getLibRoot();

/**
 * Start the preview pipeline: Webpack watch → Eleventy serve.
 * Webpack compiles first; Eleventy starts only after the first bundle is ready.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} options.environment
 * @param {number} [options.port]       Eleventy dev-server port (default 3001)
 * @param {Function} [options.onLog]
 * @param {string}  [options.nodeExecutable]  Node binary used to spawn watchers (default process.execPath)
 * @param {object}  [options.extraEnv]        Extra env vars for spawned watchers
 * @param {object}  [options._bins]     { webpack, eleventy } — override bin paths for testing
 * @returns {Promise<{ port: number, stop(): void }>}
 */
export async function startPreview({
  projectRoot,
  environment,
  port = 3001,
  libRoot,
  onLog = () => {},
  nodeExecutable = process.execPath,
  extraEnv = {},
  _bins = {}
} = {}) {
  const effectiveLibRoot = libRoot ? path.resolve(libRoot) : LIB_ROOT;
  const webpackConfigPath = resolveWebpackConfigPath({
    libRoot: effectiveLibRoot,
    projectRoot,
    environment
  });
  const eleventyConfigPath = path.join(effectiveLibRoot, 'tm.eleventy.js');

  onLog(`[preview] Starting webpack watch (${environment})…`);
  const webpackHandle = startWebpackWatch({
    projectRoot,
    configPath: webpackConfigPath,
    environment,
    binPath: _bins.webpack,
    nodeExecutable,
    extraEnv,
    onLog: (line) => onLog(`[webpack] ${line}`)
  });

  await webpackHandle.waitForFirstCompile();
  onLog('[preview] Webpack compiled.');

  // webpack-watch runs with clean:false and never copies the theme — unlike the
  // production build's copyTheme(). Mirror that step here so the dev preview
  // shows the configured theme (and picks up theme switches on restart).
  try {
    const themeResult = copyThemeToOutput({
      projectRoot,
      libRoot: effectiveLibRoot,
      environment
    });
    if (themeResult.copied) {
      onLog(`[preview] Theme: ${themeResult.themeId}`);
    } else if (themeResult.error) {
      onLog(`[preview] Theme copy failed: ${themeResult.error}`);
    }
  } catch (err) {
    onLog(`[preview] Theme copy failed: ${err.message}`);
  }

  onLog('[preview] Starting Eleventy…');

  const eleventyHandle = startEleventyWatch({
    projectRoot,
    environment,
    port,
    configPath: _bins.eleventy ? undefined : eleventyConfigPath,
    binPath: _bins.eleventy,
    nodeExecutable,
    extraEnv,
    onLog: (line) => onLog(`[eleventy] ${line}`)
  });

  await eleventyHandle.waitForReady();
  onLog(`[preview] Ready at http://localhost:${port}/`);

  return {
    port,
    stop() {
      onLog('[preview] Shutting down…');
      eleventyHandle.stop();
      webpackHandle.stop();
    }
  };
}
