import path from 'path';
import { fileURLToPath } from 'url';
import { scanAllComponents } from '../component/scanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_LIB_ROOT = path.resolve(__dirname, '../..');

/**
 * Register lib _assets as Eleventy passthrough copy from the package root.
 * Copies css/_lib and js/_lib directories into the output at the same relative paths.
 *
 * @param {object} eleventyConfig
 * @param {object} [options]
 * @param {string} [options.libRoot]  Absolute path to the marbas-site package root
 */
export function addLibAssetsPassthrough(eleventyConfig, { libRoot = DEFAULT_LIB_ROOT } = {}) {
  eleventyConfig.addPassthroughCopy({
    [path.join(libRoot, '_assets/css/base.full.css')]:     '_assets/css/base.full.css',
    [path.join(libRoot, '_assets/css/base.full.min.css')]: '_assets/css/base.full.min.css',
    [path.join(libRoot, '_assets/js/_lib')]:               '_assets/js/_lib',
    [path.join(libRoot, '_assets/images')]:                '_assets/images'
  });
}

/**
 * Register _api/ directories from all components as Eleventy passthrough copy.
 * Each component's _api/ lands at _api/<componentName>/ in the output.
 *
 * @param {object} eleventyConfig
 * @param {object} options
 * @param {string} options.projectRoot  Absolute path to the project root
 * @param {string} [options.libRoot]    Absolute path to the marbas-site package root
 */
export function addComponentApiPassthrough(eleventyConfig, { projectRoot, libRoot = DEFAULT_LIB_ROOT } = {}) {
  const components = scanAllComponents({ projectRoot, libRoot });
  for (const component of components) {
    if (component.apiDir) {
      eleventyConfig.addPassthroughCopy({
        [component.apiDir]: `_api/${component.name}`
      });
    }
  }
}
