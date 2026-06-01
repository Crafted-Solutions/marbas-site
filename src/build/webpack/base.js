import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import autoprefixer from 'autoprefixer';
import { glob } from 'glob';
import { logger } from '../../logger.js';

const libRequire = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// libRoot = marbas-site package root (where _components/, _assets/, etc. live)
const libRoot = path.resolve(__dirname, '../../..');

// projectRoot = the calling project's directory (resolved at webpack-run time)
const projectRoot = process.cwd();

/**
 * Generate the lib JS entry file based on env vars.
 */
export function getLibJsEntry() {
  const useCmsStyles = process.env.MARBAS_USE_CMS_STYLES !== '0';
  const useLanguageSwitcher = process.env.MARBAS_USE_LANGUAGE_SWITCHER !== '0';
  const entryFile = path.resolve(projectRoot, '_webpack/lib-entry.js');

  const lines = [];
  if (useCmsStyles) {
    lines.push(`
document.addEventListener('DOMContentLoaded', () => {
  const navToggler = document.querySelector('.navbar-toggler');
  const navCollapse = document.querySelector('.navbar-collapse');
  if (navToggler && navCollapse) {
    navToggler.addEventListener('click', () => {
      navCollapse.classList.toggle('show');
      navToggler.setAttribute('aria-expanded', navCollapse.classList.contains('show'));
    });
    document.addEventListener('click', (event) => {
      if (!navToggler.contains(event.target) && !navCollapse.contains(event.target)) {
        navCollapse.classList.remove('show');
        navToggler.setAttribute('aria-expanded', 'false');
      }
    });
  }
});`);
  }
  if (lines.length === 0) {
    lines.push('// CMS styles and language switcher disabled');
  }

  fs.mkdirSync(path.dirname(entryFile), { recursive: true });
  fs.writeFileSync(entryFile, lines.join('\n'));
  logger.verbose(`Created lib JS entry (useCmsStyles=${useCmsStyles}, useLanguageSwitcher=${useLanguageSwitcher})`);
  return './_webpack/lib-entry.js';
}

/**
 * Create an entry for custom JS and component-local CSS/JS files.
 * Globs the project's _components/ and the lib's _includes/components/.
 * When the same component name exists in both, the project version wins (lib excluded).
 *
 * @param {object} [options]
 * @param {string} [options.projectRoot]  Defaults to process.cwd()
 * @param {string} [options.libRoot]  Defaults to marbas-site package root
 */
export function getCustomJsEntry({ projectRoot: pRoot = projectRoot, libRoot: lRoot = libRoot } = {}) {
  const entryFile = path.resolve(pRoot, '_webpack/custom-js-entry.js');

  const jsFiles = glob.sync(path.resolve(pRoot, '_assets/js/**/*.js'))
    .filter((filePath) => !filePath.replace(/\\/g, '/').includes('/_assets/js/_lib/'))
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  // Collect project component names for override detection
  const projectComponentDirs = glob.sync(`${pRoot}/_components/*/`)
    .map((dir) => path.basename(dir.replace(/\/$/, '')));
  const projectComponentNames = new Set(projectComponentDirs);

  // Exclude server-side files from webpack bundle: build hooks and _api/ dirs
  const isClientSideComponentFile = (filePath) => {
    const normalized = filePath.replace(/\\/g, '/');
    const basename = path.basename(normalized);
    return basename !== 'build.js' && !normalized.includes('/_api/');
  };

  const projectComponentJsFiles = glob.sync(path.resolve(pRoot, '_components/**/*.js'))
    .filter(isClientSideComponentFile)
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  const projectComponentCssFiles = glob.sync(path.resolve(pRoot, '_components/**/*.css'))
    .filter(isClientSideComponentFile)
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  // Lib built-in components live in _includes/components/ (idiomatic Eleventy).
  // Excluded when the project has a component with the same name (project wins).
  const libComponentsRoot = path.join(lRoot, '_includes', 'components');
  const libComponentJsFiles = glob.sync(path.resolve(libComponentsRoot, '**/*.js'))
    .filter((filePath) => {
      const rel = path.relative(libComponentsRoot, filePath);
      const componentName = rel.split(path.sep)[0];
      return !projectComponentNames.has(componentName);
    })
    .filter(isClientSideComponentFile)
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  const libComponentCssFiles = glob.sync(path.resolve(libComponentsRoot, '**/*.css'))
    .filter((filePath) => {
      const rel = path.relative(libComponentsRoot, filePath);
      const componentName = rel.split(path.sep)[0];
      return !projectComponentNames.has(componentName);
    })
    .filter(isClientSideComponentFile)
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  const customFiles = [
    ...jsFiles,
    ...projectComponentJsFiles,
    ...projectComponentCssFiles,
    ...libComponentJsFiles,
    ...libComponentCssFiles
  ];

  fs.mkdirSync(path.dirname(entryFile), { recursive: true });

  if (customFiles.length > 0) {
    const imports = customFiles.map((file) => {
      const relativePath = path.relative(pRoot, file).replace(/\\/g, '/');
      return `import '../${relativePath}';`;
    }).join('\n');
    fs.writeFileSync(entryFile, imports);
    logger.verbose(
      `Created custom JS entry with ${jsFiles.length} asset JS, ` +
      `${projectComponentJsFiles.length + libComponentJsFiles.length} component JS and ` +
      `${projectComponentCssFiles.length + libComponentCssFiles.length} component CSS files`
    );
  } else {
    logger.verbose('No custom JS or component files found');
    fs.writeFileSync(entryFile, '// No custom JS or component files');
  }

  return './_webpack/custom-js-entry.js';
}

export function getStatsConfig() {
  switch (process.env.LOG_LEVEL || 'normal') {
    case 'silent': return 'errors-only';
    case 'minimal': return 'minimal';
    case 'verbose': return 'verbose';
    default: return 'normal';
  }
}

/**
 * Webpack filesystem cache — disabled when MARBAS_DISABLE_WEBPACK_CACHE=1.
 * Hosts that relocate the package (where filesystem cache paths are unstable)
 * can set that env var to opt out.
 */
export function getWebpackCacheConfig(configUrl) {
  const disableCache = process.env.MARBAS_DISABLE_WEBPACK_CACHE === '1';

  if (disableCache) return false;

  return {
    type: 'filesystem',
    buildDependencies: { config: [configUrl] }
  };
}

/**
 * Static asset copy patterns for CopyPlugin.
 *
 * @param {string} outputPath  Absolute path to the build output directory
 * @param {string} [pRoot]     Project root (defaults to process.cwd())
 */
export function getStaticAssetCopyPatterns(outputPath, pRoot = projectRoot) {
  return [
    {
      from: path.resolve(pRoot, '_assets/images'),
      to: path.join(outputPath, '_assets/images'),
      noErrorOnMissing: true
    },
    {
      from: path.resolve(pRoot, '_assets/fonts'),
      to: path.join(outputPath, '_assets/fonts'),
      noErrorOnMissing: true
    },
    {
      from: path.resolve(pRoot, '_assets/favicons'),
      to: outputPath,
      noErrorOnMissing: true
    }
  ];
}

/**
 * Favicon copy config entry for CopyPlugin.
 *
 * @param {string} outputPath  Absolute path to the build output directory
 * @param {string} [pRoot]     Project root (defaults to process.cwd())
 */
export function getFaviconCopyConfig(outputPath, pRoot = projectRoot) {
  return {
    from: path.resolve(pRoot, '_assets/favicons'),
    to: outputPath,
    noErrorOnMissing: true
  };
}

/**
 * Get base webpack configuration.
 *
 * @param {object} options
 * @param {string} options.outputPath  Absolute path for webpack output (e.g. <project>/build/public_development/_assets)
 */
export function getBaseConfig(options = {}) {
  const {
    mode = 'development',
    devtool = 'source-map',
    outputPath,
    environment = 'development',
    filenamePattern = { js: 'js/[name].bundle.js', css: 'css/[name].bundle.css' },
    enableSourceMaps = true,
    publicPath = '/'
  } = options;

  return {
    mode,
    devtool,
    stats: getStatsConfig(),

    entry: {
      main: getLibJsEntry(),
      custom: getCustomJsEntry()
    },

    output: {
      path: outputPath ? path.resolve(outputPath) : path.resolve(projectRoot, '_src_assets'),
      filename: filenamePattern.js,
      publicPath,
      clean: false
    },

    // Resolve loaders and modules from the lib's node_modules so slim projects
    // (no node_modules of their own) can use babel-loader, css-loader, etc.
    resolveLoader: {
      modules: [path.join(libRoot, 'node_modules'), 'node_modules']
    },
    resolve: {
      modules: [path.join(libRoot, 'node_modules'), 'node_modules']
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: libRequire.resolve('babel-loader'),
            options: {
              configFile: false,
              babelrc: false,
              presets: [libRequire.resolve('@babel/preset-env')]
            }
          }
        },
        {
          test: /\.(scss|css)$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: libRequire.resolve('css-loader'),
              options: { sourceMap: enableSourceMaps, url: false, import: false }
            },
            ...(mode === 'development' ? [{
              loader: libRequire.resolve('postcss-loader'),
              options: {
                sourceMap: enableSourceMaps,
                postcssOptions: { plugins: [autoprefixer()] }
              }
            }] : []),
            {
              loader: libRequire.resolve('sass-loader'),
              options: { sourceMap: enableSourceMaps }
            }
          ]
        }
      ]
    },

    plugins: [
      new MiniCssExtractPlugin({ filename: filenamePattern.css }),
      new CopyPlugin({ patterns: outputPath ? getStaticAssetCopyPatterns(path.dirname(outputPath)) : [] })
    ]
  };
}

export { projectRoot, libRoot };
