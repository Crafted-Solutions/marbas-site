import path from 'path';
import { startWebpackWatch } from './webpack-watch.js';
import { startEleventyWatch } from './eleventy-watch.js';
import { getLibRoot } from '../eject/index.js';
import { resolveWebpackConfigPath } from '../build/webpack/resolve-config.js';

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
