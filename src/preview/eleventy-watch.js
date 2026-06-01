import { spawn } from 'child_process';
import { resolvePackageBin } from '../build/resolve-bin.js';

const SERVER_READY_RE = /server at http/i;

function forwardLines(stream, onLine) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) onLine(line);
    }
  });
  stream.on('end', () => {
    if (buffer.trim()) onLine(buffer.trim());
  });
}

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
      ...extraEnv,
      MARBAS_PUBLISH_ENVIRONMENT: environment,
      NODE_ENV: 'development'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  let ready = false;
  const readyCallbacks = [];

  function onLine(line) {
    onLog(line);
    if (!ready && SERVER_READY_RE.test(line)) {
      ready = true;
      for (const cb of readyCallbacks) cb();
      readyCallbacks.length = 0;
    }
  }

  forwardLines(child.stdout, onLine);
  forwardLines(child.stderr, onLine);

  child.on('error', (err) => onLog(`[eleventy error] ${err.message}`));

  return {
    child,
    waitForReady() {
      if (ready) return Promise.resolve();
      return new Promise((resolve) => readyCallbacks.push(resolve));
    },
    stop() {
      child.kill('SIGTERM');
    }
  };
}
