import path from 'path';
import { merge } from 'webpack-merge';
import { getBaseConfig, getFaviconCopyConfig, getWebpackCacheConfig, projectRoot } from './base.js';
import { resolveBuildOutputPath } from '../../env/output-paths.js';
import { readProjectConfig } from '../../project/config.js';
import CopyPlugin from 'copy-webpack-plugin';
import { logger } from '../../logger.js';

logger.verbose('Loading webpack development configuration');

function resolveOutputPath() {
  try {
    const config = readProjectConfig(projectRoot);
    return resolveBuildOutputPath({ projectRoot, config, environment: 'development' });
  } catch {
    return path.join(projectRoot, 'build', 'public_development');
  }
}

const outputPath = resolveOutputPath();

const baseConfig = getBaseConfig({
  mode: 'development',
  devtool: 'source-map',
  outputPath: path.join(outputPath, '_assets'),
  environment: 'development',
  filenamePattern: { js: 'js/[name].bundle.js', css: 'css/[name].bundle.css' },
  enableSourceMaps: true
});

const developmentConfig = {
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all' }
      }
    }
  },
  devServer: {
    static: { directory: outputPath },
    compress: true,
    port: 9000,
    hot: true,
    open: false
  },
  plugins: [
    new CopyPlugin({ patterns: [getFaviconCopyConfig(outputPath)] })
  ],
  performance: { hints: false },
  cache: getWebpackCacheConfig(import.meta.url)
};

export default merge(baseConfig, developmentConfig);
