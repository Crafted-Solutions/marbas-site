import fs from 'fs';
import path from 'path';

/**
 * Known lib layouts that live in _includes/ rather than _layouts/.
 * Listed explicitly because _includes/ contains many non-layout files — we only
 * want to register the ones that are actually used as Eleventy layouts.
 */
const KNOWN_INCLUDES_LAYOUTS = ['base.njk'];

/**
 * Registers Eleventy layout aliases for all lib layouts, with project-first override.
 *
 * Resolution order per layout name:
 *   1. <projectRoot>/_layouts/<name>.njk   — explicit project layout (new convention)
 *   2. <projectRoot>/_includes/<name>.njk  — ejected lib layout in project _includes/ (eject convention)
 *   3. <libRoot>/_layouts/<name>.njk       — lib layout (future home)
 *   4. <libRoot>/_includes/<name>.njk      — lib layout in _includes/ (current convention)
 *
 * Alias values are relative to <libRoot>/_includes/ because that is where
 * Eleventy's `dir.includes` points — Eleventy's TemplateLayoutPathResolver
 * resolves alias targets with getLayoutPath(alias), which prepends includesDir.
 * Passing an absolute path would result in includesDir + absolutePath (wrong).
 *
 * @param {object} eleventyConfig
 * @param {{ projectRoot: string, libRoot: string }} opts
 */
export function registerLayoutAliases(eleventyConfig, { projectRoot, libRoot }) {
  const registered = new Set();
  const includesDir = path.join(libRoot, '_includes');

  function register(name, filename) {
    if (registered.has(name)) return;
    registered.add(name);

    const projectLayout = path.join(projectRoot, '_layouts', filename);
    if (fs.existsSync(projectLayout)) {
      eleventyConfig.addLayoutAlias(name, path.relative(includesDir, projectLayout));
      return;
    }

    const projectIncludesLayout = path.join(projectRoot, '_includes', filename);
    if (fs.existsSync(projectIncludesLayout)) {
      eleventyConfig.addLayoutAlias(name, path.relative(includesDir, projectIncludesLayout));
      return;
    }

    const libLayoutsPath = path.join(libRoot, '_layouts', filename);
    if (fs.existsSync(libLayoutsPath)) {
      eleventyConfig.addLayoutAlias(name, path.relative(includesDir, libLayoutsPath));
      return;
    }

    const libIncludesPath = path.join(libRoot, '_includes', filename);
    if (fs.existsSync(libIncludesPath)) {
      eleventyConfig.addLayoutAlias(name, filename);
    }
  }

  // Scan _layouts/ for future layouts added there
  const libLayoutsDir = path.join(libRoot, '_layouts');
  if (fs.existsSync(libLayoutsDir)) {
    for (const filename of fs.readdirSync(libLayoutsDir)) {
      if (!filename.endsWith('.njk')) continue;
      register(filename.replace(/\.njk$/, ''), filename);
    }
  }

  // Register known _includes/ layouts that predate _layouts/
  for (const filename of KNOWN_INCLUDES_LAYOUTS) {
    register(filename.replace(/\.njk$/, ''), filename);
  }
}
