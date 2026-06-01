import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const LIB_ROOT = path.resolve(path.dirname(__filename), '../..');

// Directories within the lib that users may eject files from
export const EJECTABLE_DIRS = ['_includes', '_layouts', '_components', '_theme'];

export function getLibRoot() {
  // Host-agnostic: the library resolves its own physical root by default.
  // A host that relocates the package to a different physical path (e.g. a
  // bundler that unpacks node_modules elsewhere) can point MARBAS_LIB_ROOT at
  // the real location.
  const override = process.env.MARBAS_LIB_ROOT;
  if (override && fs.existsSync(override)) return override;
  return LIB_ROOT;
}

function isEjectablePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\//, '');
  return EJECTABLE_DIRS.some((dir) => normalized.startsWith(dir + '/') || normalized === dir);
}

function resolveLibSource(relativePath, libRoot) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\//, '');
  return path.join(libRoot, normalized);
}

/**
 * Map a user-supplied eject/reset target to its lib source and project destination.
 *
 * Two dirs differ between the library layout and the project's override layout,
 * so they are remapped (users may address either form):
 *
 * - Components: built-ins live in the lib at `_includes/components/<Type>/`, but
 *   project overrides resolve from `_components/<Type>/` (the friendly dir —
 *   see src/components/resolver.js).
 * - Themes: built-ins live in the lib at `themes/<theme-id>.css`, but project
 *   overrides resolve from `_theme/<theme-id>.css` (see src/theme/resolver.js).
 *
 * All other paths (layouts, includes) are path-preserving.
 *
 * @param {string} rel  Normalised relative path (no leading slash)
 * @returns {{ libRel: string, projectRel: string }}
 */
export function mapComponentPaths(rel) {
  const componentMatch = rel.match(/^(?:_components|_includes\/components)\/(.+)$/);
  if (componentMatch) {
    const rest = componentMatch[1];
    return {
      libRel: `_includes/components/${rest}`,
      projectRel: `_components/${rest}`
    };
  }

  const themeMatch = rel.match(/^(?:_theme|themes)\/(.+)$/);
  if (themeMatch) {
    const rest = themeMatch[1];
    return {
      libRel: `themes/${rest}`,
      projectRel: `_theme/${rest}`
    };
  }

  return { libRel: rel, projectRel: rel };
}

/**
 * Eject a lib file or component directory into the project for local customisation.
 * Copying is idempotent: calling eject on an already-ejected path prints a notice
 * and returns without overwriting.
 *
 * @param {object} options
 * @param {string} options.projectPath   Absolute or relative project root
 * @param {string} options.relativePath  Path relative to project/lib root (e.g. "_includes/base.njk")
 * @param {string} [options.libRoot]     Override lib root (for testing)
 * @returns {{ status: 'ejected' | 'already-ejected' | 'error', message: string }}
 */
export function eject({ projectPath, relativePath, libRoot } = {}) {
  const absProject = path.resolve(projectPath);
  const absLib = libRoot ? path.resolve(libRoot) : LIB_ROOT;
  const rel = (relativePath || '').replace(/\\/g, '/').replace(/^\//, '');

  if (!rel) {
    return { status: 'error', message: 'relativePath is required' };
  }

  if (!isEjectablePath(rel)) {
    return {
      status: 'error',
      message: `"${rel}" is not in an ejectable directory (${EJECTABLE_DIRS.join(', ')})`
    };
  }

  const { libRel, projectRel } = mapComponentPaths(rel);

  const libSrc = resolveLibSource(libRel, absLib);
  if (!fs.existsSync(libSrc)) {
    return { status: 'error', message: `No lib default found for "${rel}"` };
  }

  const projectDest = path.join(absProject, projectRel);

  if (fs.existsSync(projectDest)) {
    return { status: 'already-ejected', message: `"${projectRel}" is already ejected in this project` };
  }

  fs.mkdirSync(path.dirname(projectDest), { recursive: true });

  const stat = fs.statSync(libSrc);
  if (stat.isDirectory()) {
    fs.cpSync(libSrc, projectDest, { recursive: true });
  } else {
    fs.copyFileSync(libSrc, projectDest);
  }

  return { status: 'ejected', message: `Ejected "${projectRel}" into project` };
}
