import path from 'path';
import { merge } from 'webpack-merge';
import { getBaseConfig, getFaviconCopyConfig, getWebpackCacheConfig, projectRoot } from './base.js';
import { resolveBuildOutputPath } from '../../env/output-paths.js';
import { readProjectConfig } from '../../project/config.js';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

console.log('Loading webpack production configuration');

function resolveOutputPath() {
  try {
    const config = readProjectConfig(projectRoot);
    return resolveBuildOutputPath({ projectRoot, config, environment: 'production' });
  } catch {
    return path.join(projectRoot, 'build', 'public_production');
  }
}

const outputPath = resolveOutputPath();

const baseConfig = getBaseConfig({
  mode: 'production',
  devtool: false,
  outputPath: path.join(outputPath, '_assets'),
  environment: 'production',
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
  plugins: [
    new CopyPlugin({ patterns: [getFaviconCopyConfig(outputPath)] })
  ],
  performance: { hints: 'error', maxEntrypointSize: 200000, maxAssetSize: 200000 },
  cache: getWebpackCacheConfig(import.meta.url),
  output: { clean: true, pathinfo: false }
};

export default merge(baseConfig, productionConfig);
