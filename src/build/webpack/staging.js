import path from 'path';
import { merge } from 'webpack-merge';
import { getBaseConfig, getFaviconCopyConfig, getWebpackCacheConfig, projectRoot } from './base.js';
import { resolveBuildOutputPath } from '../../env/output-paths.js';
import { readProjectConfig } from '../../project/config.js';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

console.log('Loading webpack staging configuration');

function resolveOutputPath() {
  try {
    const config = readProjectConfig(projectRoot);
    return resolveBuildOutputPath({ projectRoot, config, environment: 'staging' });
  } catch {
    return path.join(projectRoot, 'build', 'public_staging');
  }
}

const outputPath = resolveOutputPath();

const baseConfig = getBaseConfig({
  mode: 'production',
  devtool: 'source-map',
  outputPath: path.join(outputPath, '_assets'),
  environment: 'staging',
  filenamePattern: { js: 'js/[name].bundle.js', css: 'css/[name].bundle.css' },
  enableSourceMaps: true
});

const stagingConfig = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: { comments: false },
          compress: { drop_console: false, drop_debugger: false, pure_funcs: ['console.debug'] }
        },
        extractComments: false
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ['default', {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            normalizeUrl: false,
            normalizeString: false,
            normalizePositions: false,
            normalizeRepeatStyle: false,
            normalizeCharset: false,
            convertValues: false
          }]
        }
      })
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all' }
      }
    },
    runtimeChunk: 'single'
  },
  plugins: [
    new CopyPlugin({ patterns: [getFaviconCopyConfig(outputPath)] })
  ],
  performance: { hints: 'warning', maxEntrypointSize: 300000, maxAssetSize: 300000 },
  cache: getWebpackCacheConfig(import.meta.url)
};

export default merge(baseConfig, stagingConfig);
