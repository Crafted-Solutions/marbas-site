import { scanAllComponents } from './scanner.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_LIB_ROOT = path.resolve(__dirname, '../..');

/**
 * Run build.js hooks for all components that provide one.
 * Hooks run after Eleventy has completed rendering.
 * Each hook receives a context object and may be async.
 * Any hook failure aborts the build with a clear message.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} options.environment
 * @param {string} options.outputPath   Absolute path to build output directory
 * @param {Array}  [options.pages]      List of rendered page paths (optional)
 * @param {object} [options.env]        Resolved env vars for the build
 * @param {string} [options.libRoot]
 * @param {Function} [options.log]      log(message) callback
 */
export async function runComponentBuildHooks({
  projectRoot,
  environment,
  outputPath,
  pages = [],
  env = {},
  libRoot = DEFAULT_LIB_ROOT,
  log = () => {}
} = {}) {
  const components = scanAllComponents({ projectRoot, libRoot });
  const withHooks = components.filter((c) => c.buildHookPath !== null);

  if (withHooks.length === 0) return;

  log(`Running build hooks for ${withHooks.length} component(s)`);

  for (const component of withHooks) {
    log(`  Running build hook: ${component.name}`);

    let mod;
    try {
      mod = await import(component.buildHookPath);
    } catch (error) {
      throw new Error(
        `Failed to load build hook for component "${component.name}": ${error.message}`
      );
    }

    const hookFn = mod.default;
    if (typeof hookFn !== 'function') {
      throw new Error(
        `build.js in component "${component.name}" must export a default function`
      );
    }

    try {
      await hookFn({
        projectRoot,
        environment,
        outputPath,
        pages,
        env,
        componentDir: component.componentDir
      });
    } catch (error) {
      throw new Error(
        `Build hook for component "${component.name}" failed: ${error.message}`
      );
    }
  }
}
