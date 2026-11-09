import path from 'path';
import { merge } from 'webpack-merge';
import { getBaseConfig, getWebpackCacheConfig, projectRoot } from './base.js';
import { resolveBuildOutputPath } from '../../env/output-paths.js';
import { readProjectConfig } from '../../project/config.js';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

console.log('Loading webpack production configuration');

// The production webpack base also serves any custom environment whose
// `mode` is production — so the output path follows the actual target env.
const targetEnvironment = process.env.MARBAS_PUBLISH_ENVIRONMENT || 'production';

function resolveOutputPath() {
  try {
    const config = readProjectConfig(projectRoot);
    return resolveBuildOutputPath({ projectRoot, config, environment: targetEnvironment });
  } catch {
    return path.join(projectRoot, 'build', `public_${targetEnvironment}`);
  }
}

const outputPath = resolveOutputPath();

const baseConfig = getBaseConfig({
  mode: 'production',
  devtool: false,
  outputPath: path.join(outputPath, '_assets'),
  environment: targetEnvironment,
  filenamePattern: { js: 'js/[name].bundle.js', css: 'css/[name].bundle.css' },
  enableSourceMaps: false
});

const productionConfig = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: { comments: false },
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            passes: 2
          },
          mangle: { safari10: true }
        },
        extractComments: false,
        parallel: true
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ['default', {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            reduceIdents: false,
            normalizeUrl: false,
            normalizeString: false,
            normalizePositions: false,
            normalizeRepeatStyle: false,
            normalizeCharset: false,
            convertValues: false
          }]
        },
        parallel: true
      })
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 250000,
      cacheGroups: {
        vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all', priority: 10 },
        common: { name: 'common', minChunks: 2, chunks: 'all', enforce: true }
      }
    },
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    chunkIds: 'deterministic'
  },
  // the site root (_static/, legacy _assets/favicons/) is copied by the base config (Task 212)
  performance: {
    hints: 'error',
    maxEntrypointSize: 200000,
    maxAssetSize: 200000,
    // Files copied to the site root (`../robots.txt`, a PDF in _static/) are delivered as they are — the size limit
    // guards the bundles and _assets/ (images, fonts), not downloads (Task 212). Source maps as by webpack default.
    assetFilter: (assetFilename) => !/^\.\.[\\/]/.test(assetFilename) && !/\.map$/.test(assetFilename)
  },
  cache: getWebpackCacheConfig(import.meta.url),
  output: { clean: true, pathinfo: false }
};

export default merge(baseConfig, productionConfig);
