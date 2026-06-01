// webpack.config.js — stub for `npx webpack` compatibility
// Internal builds go through src/build/webpack/config-loader.js
import { loadWebpackConfig } from './src/build/webpack/config-loader.js';

export default loadWebpackConfig();