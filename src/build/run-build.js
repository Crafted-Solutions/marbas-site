import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { loadEnvForEnvironment } from '../config/load-env.js';
import { buildEnvVars } from '../env/build-env.js';
import { withLogger } from '../logger.js';
import { runComponentBuildHooks } from '../component/build-hooks.js';
import { resolveBuildOutputPath } from '../env/output-paths.js';
import { readProjectConfig } from '../project/config.js';
import { getLibRoot } from '../eject/index.js';
import { resolvePackageBin } from './resolve-bin.js';
import { resolveThemeFile } from '../theme/resolver.js';

const LIB_ROOT = getLibRoot();
const LIB_WEBPACK_DIR = path.join(LIB_ROOT, 'src', 'build', 'webpack');

function runCliViaNode({ cliScriptPath, args = [], cwd, env = {}, logger }) {
  const childProcessOptions = logger.getChildProcessOptions?.(cwd, env) || {
    cwd,
    env: {
      ...process.env,
      ...env
    },
    stdio: logger.shouldLog?.('verbose') ? 'inherit' : 'pipe',
    windowsHide: true
  };

  const result = spawnSync(process.execPath, [cliScriptPath, ...args], {
    ...childProcessOptions,
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`Command failed (${path.basename(cliScriptPath)}), exit code ${result.status}`);
  }
}

export class BuildHandler {
  constructor({ rootDir, args, logger }) {
    this.rootDir = rootDir;
    this.logger = withLogger(logger);
    this.validEnvironments = ['development', 'local_test', 'staging', 'production'];
    this.legacyMapping = {
      develop: 'development',
      test: 'local_test',
      prod: 'production'
    };

    this.args = args;
    this.environment = null;
    this.optimize = false;
    this.serve = false;
    this.logLevel = 'normal';

    this.parseArguments();
  }

  parseArguments() {
    const envArg = this.args.find((arg) => arg.startsWith('--env='));
    const logLevelArg = this.args.find((arg) => arg.startsWith('--log-level='));

    this.optimize = this.args.includes('--optimize');
    this.serve = this.args.includes('--serve');

    if (logLevelArg) {
      this.logLevel = logLevelArg.split('=')[1];
    } else if (process.env.LOG_LEVEL) {
      this.logLevel = process.env.LOG_LEVEL;
    }

    this.logger.setLevel?.(this.logLevel);

    if (!envArg) {
      this.logger.error('❌ Environment is required!');
      this.logger.error('Usage: node scripts/build.js --env=development|local_test|staging|production [--optimize] [--serve] [--log-level=silent|minimal|normal|verbose]');
      this.logger.error('');
      this.logger.error('Available environments:');
      this.listAvailableEnvironments();
      process.exit(1);
    }

    this.environment = envArg.split('=')[1];
    if (!this.environment) {
      this.logger.error('❌ Environment value is required!');
      this.logger.error('Example: --env=development');
      process.exit(1);
    }

    if (this.legacyMapping[this.environment]) {
      this.logger.info?.(`🔄 Mapping legacy environment '${this.environment}' to '${this.legacyMapping[this.environment]}'`);
      this.environment = this.legacyMapping[this.environment];
    }
  }

  listAvailableEnvironments() {
    this.logger.error('  Standard environments:');
    this.validEnvironments.forEach((env) => {
      this.logger.error(`    ✅ ${env}`);
    });

    this.logger.error('  Legacy environments (mapped):');
    Object.entries(this.legacyMapping).forEach(([legacy, mapped]) => {
      this.logger.error(`    🔄 ${legacy} → ${mapped}`);
    });

    const envDir = path.join(this.rootDir, 'config', 'env');
    if (!fs.existsSync(envDir)) {
      return;
    }

    const envFiles = fs
      .readdirSync(envDir)
      .filter((file) => file.startsWith('.env.') && !file.endsWith('.example'))
      .map((file) => file.replace('.env.', ''))
      .sort();

    if (envFiles.length === 0) {
      return;
    }

    this.logger.error('  Available environment files:');
    envFiles.forEach((env) => {
      const indicator = this.validEnvironments.includes(env) ? '✅' : '🔧';
      this.logger.error(`    ${indicator} ${env}`);
    });
  }

  loadEnvironmentVariables() {
    const envFile = `.env.${this.environment}`;
    const envLocalFile = `.env.${this.environment}.local`;

    let envResult;
    try {
      envResult = loadEnvForEnvironment({
        rootDir: this.rootDir,
        environment: this.environment,
        logger: this.logger,
        requirePublic: false,
        apply: true,
        preserveExisting: false
      });
    } catch (error) {
      this.logger.buildError('❌', `Error loading environment files: ${error.message}`);
      process.exit(1);
    }

    const {
      publicEnvVars,
      privateEnvVars,
      loadedFiles
    } = envResult;

    if (loadedFiles.includes(envFile)) {
      this.logger.buildStep('🔧', `Loading public environment variables from: ${envFile}`);
      this.logger.buildSuccess('✅', `Loaded ${Object.keys(publicEnvVars).length} public variables`);
    } else {
      this.logger.buildWarning('⚠️', `No public environment file found: ${envFile}`);
    }

    if (loadedFiles.includes(envLocalFile)) {
      this.logger.buildStep('🔧', `Loading private environment variables from: ${envLocalFile}`);
      this.logger.buildSuccess('✅', `Loaded ${Object.keys(privateEnvVars).length} private variables`);
    } else {
      this.logger.buildStep('📝', `No private environment file found: ${envLocalFile}`);
      this.logger.verbose?.('   Private credentials should be in this file for security');
    }

    if (loadedFiles.length === 0) {
      this.logger.buildWarning('⚠️', `No environment files found for environment: ${this.environment}`);
      this.logger.verbose?.('   Using default configuration');
    } else {
      this.logger.buildSuccess(
        '✅',
        `Total loaded: ${Object.keys({ ...publicEnvVars, ...privateEnvVars }).length} environment variables from ${loadedFiles.join(', ')}`
      );
    }

    process.env.MARBAS_PUBLISH_ENVIRONMENT = this.environment;
    process.env.NODE_ENV = this.optimize ? 'production' : 'development';
    process.env.LOG_LEVEL = this.logLevel;

    // Apply render-settings from marbas-project.json (theme, rendering, i18n)
    // only when not already set by the caller (e.g. CMS passes MARBAS_THEME_FILE via extraEnv)
    try {
      const config = readProjectConfig(this.rootDir);
      const configEnvVars = buildEnvVars({ projectPath: this.rootDir, environment: this.environment, config });
      for (const [key, value] of Object.entries(configEnvVars)) {
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // marbas-project.json absent or unreadable — skip
    }
  }

  cleanOutputDirectory() {
    const outputDir = `public_${this.environment}`;
    const absoluteOutputDir = path.join(this.rootDir, outputDir);
    this.logger.buildStep('🧹', `Cleaning output directory: ${outputDir}`);

    try {
      fs.rmSync(absoluteOutputDir, { recursive: true, force: true });
      this.logger.buildSuccess('✅', 'Output directory cleaned');
    } catch (error) {
      this.logger.buildWarning('⚠️', `Warning: Could not clean output directory: ${error.message}`);
    }
  }

  buildWebpack() {
    const webpackConfigName = process.env.WEBPACK_CONFIG || this.environment;
    const configName = webpackConfigName.replace(/\.js$/, '');
    const webpackConfigPath = path.join(LIB_WEBPACK_DIR, `${configName}.js`);

    if (!fs.existsSync(webpackConfigPath)) {
      this.logger.buildWarning('⚠️', `Environment-specific webpack config not found: ${webpackConfigPath}`);
    }

    this.logger.webpackStart?.(fs.existsSync(webpackConfigPath) ? configName : 'default');

    try {
      const webpackCli = resolvePackageBin('webpack-cli', this.rootDir, 'webpack');

      const args = fs.existsSync(webpackConfigPath)
        ? ['--config', webpackConfigPath]
        : [];

      runCliViaNode({
        cliScriptPath: webpackCli,
        args,
        cwd: this.rootDir,
        logger: this.logger
      });

      this.logger.webpackSuccess?.();
    } catch (error) {
      this.logger.buildError('❌', `Webpack build failed: ${error.message}`);
      process.exit(1);
    }
  }

  buildEleventy() {
    this.logger.eleventyStart?.(this.serve);

    try {
      const eleventyCli = resolvePackageBin('@11ty/eleventy', this.rootDir, 'eleventy');

      const eleventyConfigPath = path.join(LIB_ROOT, 'tm.eleventy.js');
      const args = ['--config', eleventyConfigPath];
      if (this.serve) args.push('--serve');

      runCliViaNode({
        cliScriptPath: eleventyCli,
        args,
        cwd: this.rootDir,
        logger: this.logger
      });

      if (!this.serve) {
        this.logger.eleventySuccess?.();
      }
    } catch (error) {
      this.logger.buildError('❌', `Eleventy build failed: ${error.message}`);
      process.exit(1);
    }
  }

  logBuildSummary() {
    this.logger.buildSummary?.({
      serve: this.serve,
      environment: this.environment,
      outputDir: `public_${this.environment}/`,
      optimize: this.optimize
    });
  }

  async runBuildHooks() {
    let outputPath;
    try {
      const config = readProjectConfig(this.rootDir);
      outputPath = resolveBuildOutputPath({ projectRoot: this.rootDir, config, environment: this.environment });
    } catch {
      outputPath = path.join(this.rootDir, 'build', `public_${this.environment}`);
    }

    await runComponentBuildHooks({
      projectRoot: this.rootDir,
      environment: this.environment,
      outputPath,
      log: (msg) => this.logger.verbose?.(msg)
    });
  }

  copyTheme() {
    let config;
    try { config = readProjectConfig(this.rootDir); } catch { return; }

    const themeId = config?.theme?.id || null;
    if (!themeId) return;

    let outputPath;
    try {
      outputPath = resolveBuildOutputPath({ projectRoot: this.rootDir, config, environment: this.environment });
    } catch {
      outputPath = path.join(this.rootDir, 'build', `public_${this.environment}`);
    }

    try {
      const src = resolveThemeFile({ projectPath: this.rootDir, themeId, libRoot: LIB_ROOT });
      const destDir = path.join(outputPath, '_assets', 'css');
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, 'theme.css'));
      this.logger.buildStep?.('🎨', `Theme: ${themeId}`);
    } catch (err) {
      this.logger.buildWarning?.('⚠️', `Theme copy failed: ${err.message}`);
    }
  }

  async run() {
    if (this.logger.shouldLog?.('minimal') ?? true) {
      this.logger.buildStart?.('Marbas Site Project - Universal Build Handler');
      this.logger.envInfo?.(this.environment, {
        optimize: this.optimize,
        serve: this.serve
      });
    }

    this.loadEnvironmentVariables();
    this.cleanOutputDirectory();
    this.copyTheme();
    this.buildWebpack();
    this.buildEleventy();
    await this.runBuildHooks();

    if (!this.serve) {
      this.logBuildSummary();
    }
  }
}

export function runBuildFromCli({
  rootDir = process.cwd(),
  args = process.argv.slice(2),
  logger
} = {}) {
  const safeLogger = withLogger(logger);

  process.on('unhandledRejection', (reason, promise) => {
    safeLogger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    safeLogger.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  const handler = new BuildHandler({ rootDir, args, logger: safeLogger });
  handler.run().catch((error) => {
    safeLogger.error('❌ Build failed:', error.message);
    process.exit(1);
  });
  return handler;
}
