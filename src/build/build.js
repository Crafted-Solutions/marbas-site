import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { resolvePackageBin } from './resolve-bin.js';
import { runComponentBuildHooks } from '../component/build-hooks.js';
import { readProjectConfig } from '../project/config.js';
import { resolveBuildOutputPath } from '../env/output-paths.js';
import { getLibRoot } from '../eject/index.js';
import { resolveThemeFile } from '../theme/resolver.js';

const LIB_ROOT = getLibRoot();

const WEBPACK_CONFIG_DIR = path.join(LIB_ROOT, 'src', 'build', 'webpack');
const KNOWN_ENVS = ['development', 'local_test', 'staging', 'production'];

function resolveWebpackConfigPath(environment) {
  const envConfig = path.join(WEBPACK_CONFIG_DIR, `${environment}.js`);
  if (fs.existsSync(envConfig)) return envConfig;
  return path.join(WEBPACK_CONFIG_DIR, 'development.js');
}

function spawnInProject(bin, args, { projectPath, environment, onLog }) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd: projectPath,
    env: { ...process.env, MARBAS_PUBLISH_ENVIRONMENT: environment },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.stdout) result.stdout.split('\n').filter(Boolean).forEach(onLog);
  if (result.stderr) result.stderr.split('\n').filter(Boolean).forEach(onLog);

  return result;
}

/**
 * Run a full build for a Marbas project.
 *
 * @param {object} options
 * @param {string} options.projectPath   Absolute or relative path to project root
 * @param {string} [options.environment] Build environment (default: 'development')
 * @param {string} [options.libRoot]     Override lib root (for testing)
 * @param {Function} [options.onLog]     Receives log lines as strings
 */
export async function build({ projectPath, environment = 'development', libRoot, onLog = () => {} } = {}) {
  const absProject = path.resolve(projectPath);
  const absLib = libRoot ? path.resolve(libRoot) : LIB_ROOT;

  if (!fs.existsSync(absProject)) {
    throw new Error(`Project path does not exist: ${absProject}`);
  }

  const env = KNOWN_ENVS.includes(environment) ? environment : 'development';

  // Read config and output path early — needed for theme copy and component hooks
  let config, outputPath;
  try {
    config = readProjectConfig(absProject);
    outputPath = resolveBuildOutputPath({ projectRoot: absProject, config, environment: env });
  } catch {
    outputPath = path.join(absProject, 'build', `public_${env}`);
  }

  onLog('[build] Running webpack…');
  const webpackBin = resolvePackageBin('webpack-cli', absLib, 'webpack');
  const webpackConfig = resolveWebpackConfigPath(env);
  const webpackResult = spawnInProject(webpackBin, ['--config', webpackConfig], {
    projectPath: absProject, environment: env, onLog
  });
  if ((webpackResult.status ?? 1) !== 0) {
    throw new Error(`Webpack failed with exit code ${webpackResult.status}`);
  }

  const themeId = config?.theme?.id;
  if (themeId) {
    try {
      const themeSrcPath = resolveThemeFile({ projectPath: absProject, themeId, libRoot: absLib });
      const themeDestDir = path.join(outputPath, '_assets', 'css');
      fs.mkdirSync(themeDestDir, { recursive: true });
      fs.copyFileSync(themeSrcPath, path.join(themeDestDir, 'theme.css'));
      onLog(`[build] Theme: ${themeId}`);
    } catch (err) {
      throw new Error(`Theme resolution failed: ${err.message}`);
    }
  }

  onLog('[build] Running Eleventy…');
  const eleventyBin = resolvePackageBin('@11ty/eleventy', absLib, 'eleventy');
  const eleventyConfig = path.join(absLib, 'tm.eleventy.js');
  const eleventyResult = spawnInProject(eleventyBin, ['--config', eleventyConfig], {
    projectPath: absProject, environment: env, onLog
  });
  if ((eleventyResult.status ?? 1) !== 0) {
    throw new Error(`Eleventy failed with exit code ${eleventyResult.status}`);
  }

  onLog('[build] Running component build hooks…');
  await runComponentBuildHooks({ projectRoot: absProject, environment: env, outputPath, log: onLog });

  onLog('[build] Done.');
}
