import { spawn } from 'child_process';
import fs from 'fs';
import { resolvePackageBin } from '../build/resolve-bin.js';

const COMPILED_RE = /compiled (successfully|with \d+ (warning|error))/i;

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
 * Start webpack in watch mode.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} [options.configPath]   Absolute path to webpack config (optional)
 * @param {string} options.environment
 * @param {string} [options.binPath]      Override webpack-cli binary (for testing)
 * @param {string} [options.nodeExecutable]  Node binary to spawn (default process.execPath)
 * @param {object} [options.extraEnv]        Extra env vars merged into the child env
 * @param {Function} [options.onLog]
 * @returns {{ child, waitForFirstCompile(): Promise<void>, stop(): void }}
 */
export function startWebpackWatch({ projectRoot, configPath, environment, binPath, nodeExecutable = process.execPath, extraEnv = {}, onLog = () => {} }) {
  const webpackBin = binPath || resolvePackageBin('webpack-cli', projectRoot, 'webpack');

  const args = ['--watch'];
  if (configPath && fs.existsSync(configPath)) {
    args.push('--config', configPath);
  }

  const child = spawn(nodeExecutable, [webpackBin, ...args], {
    cwd: projectRoot,
    env: {
      ...process.env,
      ...extraEnv,
      MARBAS_PUBLISH_ENVIRONMENT: environment,
      MARBAS_DISABLE_WEBPACK_CACHE: '1',
      WEBPACK_CONFIG: environment
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  let compiled = false;
  let exitCode = null;
  const compileCallbacks = [];
  const rejectCallbacks = [];

  function onLine(line) {
    onLog(line);
    if (!compiled && COMPILED_RE.test(line)) {
      compiled = true;
      for (const cb of compileCallbacks) cb();
      compileCallbacks.length = 0;
      rejectCallbacks.length = 0;
    }
  }

  forwardLines(child.stdout, onLine);
  forwardLines(child.stderr, (line) => onLog(`[webpack stderr] ${line}`));

  child.on('error', (err) => onLog(`[webpack error] ${err.message}`));

  child.on('close', (code) => {
    exitCode = code;
    if (!compiled) {
      const err = new Error(`Webpack exited (code ${code}) before first compile`);
      for (const cb of rejectCallbacks) cb(err);
      compileCallbacks.length = 0;
      rejectCallbacks.length = 0;
    }
  });

  return {
    child,
    waitForFirstCompile() {
      if (compiled) return Promise.resolve();
      if (exitCode !== null) return Promise.reject(new Error(`Webpack exited (code ${exitCode}) before first compile`));
      return new Promise((resolve, reject) => {
        compileCallbacks.push(resolve);
        rejectCallbacks.push(reject);
      });
    },
    stop() {
      child.kill('SIGTERM');
    }
  };
}
