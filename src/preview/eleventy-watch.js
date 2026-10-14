import { spawn } from 'child_process';
import { resolvePackageBin } from '../build/resolve-bin.js';
import { forwardLines } from './output-lines.js';

const SERVER_READY_RE = /server at http/i;

/**
 * Start Eleventy in serve+watch mode.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} options.environment
 * @param {number} options.port
 * @param {string} [options.binPath]   Override eleventy binary (for testing)
 * @param {string} [options.nodeExecutable]  Node binary to spawn (default process.execPath)
 * @param {object} [options.extraEnv]        Extra env vars merged into the child env
 * @param {Function} [options.onLog]
 * @returns {{ child, waitForReady(): Promise<void>, stop(): void }}
 */
export function startEleventyWatch({ projectRoot, environment, port, binPath, configPath, nodeExecutable = process.execPath, extraEnv = {}, onLog = () => {} }) {
  const eleventyBin = binPath || resolvePackageBin('@11ty/eleventy', projectRoot, 'eleventy');

  const args = ['--serve', `--port=${port}`];
  if (configPath) args.push('--config', configPath);

  const child = spawn(nodeExecutable, [eleventyBin, ...args], {
    cwd: projectRoot,
    env: {
      ...process.env,
      // No colours (Task 204) — the ready line is matched as text. The caller's extraEnv may override.
      NO_COLOR: '1',
      ...extraEnv,
      MARBAS_PUBLISH_ENVIRONMENT: environment,
      NODE_ENV: 'development'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  let ready = false;
  let exitCode = null;
  const readyCallbacks = [];
  const rejectCallbacks = [];

  function onLine(line) {
    onLog(line);
    if (!ready && SERVER_READY_RE.test(line)) {
      ready = true;
      for (const cb of readyCallbacks) cb();
      readyCallbacks.length = 0;
      rejectCallbacks.length = 0;
    }
  }

  forwardLines(child.stdout, onLine);
  forwardLines(child.stderr, onLine);

  child.on('error', (err) => onLog(`[eleventy error] ${err.message}`));

  // Eleventy ending before "Server at http" must reject waitForReady() — otherwise startPreview waits forever
  // (same pattern as webpack-watch.js).
  let exitReason = null;
  child.on('close', (code, signal) => {
    exitCode = code ?? -1;
    exitReason = signal ? `signal ${signal}` : `code ${code}`;
    if (!ready) {
      const err = new Error(`Eleventy exited (${exitReason}) before server was ready`);
      for (const cb of rejectCallbacks) cb(err);
      readyCallbacks.length = 0;
      rejectCallbacks.length = 0;
    }
  });

  return {
    child,
    waitForReady() {
      if (ready) return Promise.resolve();
      if (exitCode !== null) return Promise.reject(new Error(`Eleventy exited (${exitReason}) before server was ready`));
      return new Promise((resolve, reject) => {
        readyCallbacks.push(resolve);
        rejectCallbacks.push(reject);
      });
    },
    stop() {
      child.kill('SIGTERM');
    }
  };
}
