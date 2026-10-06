import fs from 'fs';
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
export function addLibAssetsPassthrough(eleventyConfig, { libRoot = DEFAULT_LIB_ROOT, projectRoot = null } = {}) {
  eleventyConfig.addPassthroughCopy({
    [path.join(libRoot, '_assets/css/base.full.css')]:     '_assets/css/base.full.css',
    [path.join(libRoot, '_assets/css/base.full.min.css')]: '_assets/css/base.full.min.css',
    [path.join(libRoot, '_assets/js/_lib')]:               '_assets/js/_lib',
    ...libImageCopies(libRoot, projectRoot)
  });
}

/**
 * Lib images (placeholder logo, starter pictures) → _assets/images. Eleventy copies them *after* webpack has copied
 * the project's _assets/images, so a lib file would overwrite a project file of the same name — on case-insensitive
 * file systems even `logo.svg` vs. the placeholder `Logo.svg` (Task 160). Project files win: colliding lib entries
 * are left out. Without a collision the whole folder is copied as before.
 */
export function libImageCopies(libRoot, projectRoot) {
  const libImages = path.join(libRoot, '_assets/images');
  const projectImages = projectRoot ? path.join(projectRoot, '_assets/images') : null;
  const taken = projectImages && fs.existsSync(projectImages)
    ? new Set(fs.readdirSync(projectImages).map((name) => name.toLowerCase()))
    : new Set();
  if (!fs.existsSync(libImages)) return {};
  const entries = fs.readdirSync(libImages).filter((name) => !name.startsWith('.'));
  if (!entries.some((name) => taken.has(name.toLowerCase()))) return { [libImages]: '_assets/images' };
  return Object.fromEntries(entries
    .filter((name) => !taken.has(name.toLowerCase()))
    .map((name) => [path.join(libImages, name), `_assets/images/${name}`]));
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
