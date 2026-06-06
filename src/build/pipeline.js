import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { resolvePackageBin } from './resolve-bin.js';
import { runComponentBuildHooks } from '../component/build-hooks.js';
import { readProjectConfig } from '../project/config.js';
import { resolveBuildOutputPath } from '../env/output-paths.js';
import { getLibRoot } from '../eject/index.js';
import { copyThemeToOutput } from '../theme/copy.js';
import { buildEnvVars } from '../env/build-env.js';
import { resolveEnvironment } from '../env/resolve.js';
import { resolveWebpackConfigPath } from './webpack/resolve-config.js';

const LIB_ROOT = getLibRoot();

/**
 * The single subprocess helper for the build pipeline — replaces the former
 * `spawnInProject` (build.js) and `runCliViaNode` (run-build.js). Runs a Node
 * CLI bin synchronously in the project, forwarding captured stdout/stderr line
 * by line to `onLog`.
 */
function runSubprocess({ bin, args, projectPath, env, onLog }) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd: projectPath,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  if (result.error) throw result.error;

  if (result.stdout) result.stdout.split('\n').filter(Boolean).forEach(onLog);
  if (result.stderr) result.stderr.split('\n').filter(Boolean).forEach(onLog);

  return result;
}

/**
 * The shared build core: the single place that actually runs webpack →
 * theme copy → Eleventy → component build hooks. Both entry points
 * (`build()` for the CLI and `BuildHandler`/`runBuildFromCli` for the app)
 * delegate the real work here so there is no second build implementation to
 * keep in sync.
 *
 * Pure with respect to the running process: never calls `process.exit` and
 * never mutates `process.env`. Environment files and config-derived variables
 * are resolved via `buildEnvVars` (non-mutating) and passed as the child
 * process env. Caller-supplied values already present in `process.env`
 * (e.g. the CMS passing `MARBAS_THEME_FILE` via extraEnv) are inherited and
 * only overridden by config-derived vars when they overlap.
 *
 * @param {object} options
 * @param {string}   options.projectPath    Absolute or relative project root
 * @param {string}   [options.environment]  Target environment (default 'development')
 * @param {boolean}  [options.optimize]     true → NODE_ENV=production for the subprocesses
 * @param {boolean}  [options.serve]        true → Eleventy runs with --serve
 * @param {boolean}  [options.clean]        true → wipe the resolved output dir first
 * @param {string}   [options.libRoot]      Override lib root (for testing)
 * @param {Function} [options.onLog]        Receives log lines (subprocess + phase markers)
 * @param {object}   [options.hooks]        Optional structured lifecycle callbacks
 *   ({ cleaning(path), webpackStart(), webpackDone(), theme(themeId),
 *      eleventyStart(serve), eleventyDone(), hooksStart() }) — used by the app
 *   adapter to drive its structured logger; the CLI omits them.
 */
export async function runPipeline({
  projectPath,
  environment = 'development',
  optimize = false,
  serve = false,
  clean = false,
  libRoot,
  onLog = () => {},
  hooks = {}
} = {}) {
  const absProject = path.resolve(projectPath);
  const absLib = libRoot ? path.resolve(libRoot) : LIB_ROOT;

  if (!fs.existsSync(absProject)) {
    throw new Error(`Project path does not exist: ${absProject}`);
  }

  // Validate against the project's resolved environments (built-ins + custom).
  // No silent fallback to development — unknown env is a clear error.
  resolveEnvironment(environment, absProject);
  const env = environment;

  // Read config and output path early — needed for cleaning, theme copy and hooks.
  let config, outputPath;
  try {
    config = readProjectConfig(absProject);
    outputPath = resolveBuildOutputPath({ projectRoot: absProject, config, environment: env });
  } catch {
    outputPath = path.join(absProject, 'build', `public_${env}`);
  }

  // Divergence #2 fix: clean the *real* output path (resolveBuildOutputPath),
  // not the legacy rootDir/public_<env> the old BuildHandler used to wipe.
  // Non-fatal — a failed clean warns and the build continues, matching the
  // former cleanOutputDirectory() behaviour.
  if (clean && outputPath) {
    onLog(`[build] Cleaning output directory: ${outputPath}`);
    hooks.cleaning?.(outputPath);
    try {
      fs.rmSync(outputPath, { recursive: true, force: true });
    } catch (err) {
      onLog(`[build] Warning: could not clean output directory: ${err.message}`);
      hooks.cleanFailed?.(err.message);
    }
  }

  // Non-mutating env resolution (the clean variant from the former build()).
  // optimize selects the NODE_ENV the subprocesses see.
  const envVars = buildEnvVars({ projectPath: absProject, environment: env, config });
  const childEnv = {
    ...process.env,
    ...envVars,
    MARBAS_PUBLISH_ENVIRONMENT: env,
    NODE_ENV: optimize ? 'production' : 'development'
  };

  onLog('[build] Running webpack…');
  hooks.webpackStart?.();
  const webpackBin = resolvePackageBin('webpack-cli', absLib, 'webpack');
  const webpackConfig = resolveWebpackConfigPath({ libRoot: absLib, projectRoot: absProject, environment: env });
  const webpackResult = runSubprocess({
    bin: webpackBin, args: ['--config', webpackConfig], projectPath: absProject, env: childEnv, onLog
  });
  if ((webpackResult.status ?? 1) !== 0) {
    throw new Error(`Webpack failed with exit code ${webpackResult.status}`);
  }
  hooks.webpackDone?.();

  // Divergence #1 fix: ensure custom.bundle.css always exists — webpack only
  // emits it when CSS sources are present. An empty file prevents 404s when no
  // project CSS has been authored yet. Now applied on both entry points.
  const customCssDest = path.join(outputPath, '_assets', 'css', 'custom.bundle.css');
  if (!fs.existsSync(customCssDest)) {
    fs.mkdirSync(path.dirname(customCssDest), { recursive: true });
    fs.writeFileSync(customCssDest, '');
  }

  // theme.css copy via the shared helper — after webpack, before Eleventy
  // (Eleventy references the asset). A missing/broken theme is a warning, not
  // a hard failure (consistent with the app and preview paths).
  const themeResult = copyThemeToOutput({ projectRoot: absProject, libRoot: absLib, environment: env, config });
  if (themeResult.copied) {
    onLog(`[build] Theme: ${themeResult.themeId}`);
    hooks.theme?.(themeResult.themeId);
  } else if (themeResult.error) {
    onLog(`[build] Theme copy failed: ${themeResult.error}`);
    hooks.themeFailed?.(themeResult.error);
  }

  onLog('[build] Running Eleventy…');
  hooks.eleventyStart?.(serve);
  const eleventyBin = resolvePackageBin('@11ty/eleventy', absLib, 'eleventy');
  const eleventyConfig = path.join(absLib, 'tm.eleventy.js');
  const eleventyArgs = ['--config', eleventyConfig];
  if (serve) eleventyArgs.push('--serve');
  const eleventyResult = runSubprocess({
    bin: eleventyBin, args: eleventyArgs, projectPath: absProject, env: childEnv, onLog
  });
  if ((eleventyResult.status ?? 1) !== 0) {
    throw new Error(`Eleventy failed with exit code ${eleventyResult.status}`);
  }
  hooks.eleventyDone?.();

  onLog('[build] Running component build hooks…');
  hooks.hooksStart?.();
  await runComponentBuildHooks({ projectRoot: absProject, environment: env, outputPath, log: onLog });

  onLog('[build] Done.');
}
