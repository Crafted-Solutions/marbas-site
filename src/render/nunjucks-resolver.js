import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nunjucks = require('nunjucks');

/**
 * Custom Nunjucks loader that resolves templates with project-first precedence.
 *
 * Resolution order for every include name:
 *   1. <projectRoot>/_includes/<name>   — ejected / project-owned file
 *   2. <libRoot>/_includes/<name>       — lib default
 *   3. null → next loader in chain
 *
 * Relative paths (starting with ./ or ../) are resolved against the including
 * template's directory, then looked up via the same project-first order.
 */
export class MarbasResolver extends nunjucks.Loader {
  constructor({ projectRoot, libRoot }) {
    super();
    this.projectRoot = projectRoot;
    this.libRoot = libRoot;
    this.cache = {};          // required by nunjucks getTemplate cache lookup
    this.pathsToNames = {};   // required by Eleventy's per-template cache invalidation
  }

  /**
   * Resolve a relative include path to a logical name that getSource can look up.
   * Non-relative names pass through unchanged.
   */
  resolve(from, to) {
    if (!this.isRelative(to)) return to;

    const fromDir = path.dirname(from);
    const projectIncludes = path.join(this.projectRoot, '_includes');
    const libIncludes = path.join(this.libRoot, '_includes');

    let contextDir = '';
    if (fromDir.startsWith(projectIncludes)) {
      contextDir = path.relative(projectIncludes, fromDir);
    } else if (fromDir.startsWith(libIncludes)) {
      contextDir = path.relative(libIncludes, fromDir);
    } else {
      // Unknown root (e.g. absolute path outside known trees) — absolute fallback
      return path.resolve(fromDir, to);
    }

    // Return a logical name relative to _includes root, e.g. "header/slots/nav.njk"
    return path.normalize(path.join(contextDir, to));
  }

  getSource(name) {
    const filePath = this._findFile(name);
    if (!filePath) return null;

    const src = fs.readFileSync(filePath, 'utf8');
    this.pathsToNames[filePath] = name;
    return { src, path: filePath, noCache: false };
  }

  _findFile(name) {
    // Absolute paths (fallback from unknown-root resolve) — direct lookup
    if (path.isAbsolute(name)) {
      return fs.existsSync(name) ? name : null;
    }

    const projectPath = path.join(this.projectRoot, '_includes', name);
    if (fs.existsSync(projectPath)) return projectPath;

    const libPath = path.join(this.libRoot, '_includes', name);
    if (fs.existsSync(libPath)) return libPath;

    return null;
  }
}
