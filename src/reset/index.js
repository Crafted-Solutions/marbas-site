import fs from 'fs';
import path from 'path';
import { EJECTABLE_DIRS, mapComponentPaths } from '../eject/index.js';

function isEjectablePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\//, '');
  return EJECTABLE_DIRS.some((dir) => normalized.startsWith(dir + '/') || normalized === dir);
}

function makeTrashPath(projectPath, relativePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(projectPath, '.marbas', 'trash', timestamp, relativePath);
}

/**
 * Reset an ejected file/directory back to lib defaults by moving it to trash.
 * Idempotent: if the path is not ejected (doesn't exist in project), returns a notice.
 * Atomic: the source is only removed after the backup succeeds.
 *
 * @param {object} options
 * @param {string} options.projectPath   Absolute or relative project root
 * @param {string} options.relativePath  Path relative to project root (e.g. "_includes/base.njk")
 * @param {boolean} [options.force]      Skip confirmation (always true in programmatic use)
 * @returns {{ status: 'reset' | 'nothing-to-do' | 'error', message: string, backupPath?: string }}
 */
export function reset({ projectPath, relativePath } = {}) {
  const absProject = path.resolve(projectPath);
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

  // Built-in component overrides live in the project's _components/ (see eject remap).
  const { projectRel } = mapComponentPaths(rel);

  const projectSrc = path.join(absProject, projectRel);

  if (!fs.existsSync(projectSrc)) {
    return { status: 'nothing-to-do', message: `"${projectRel}" is not ejected — nothing to reset` };
  }

  const trashDest = makeTrashPath(absProject, projectRel);

  // Write backup first — only delete if backup succeeds
  try {
    fs.mkdirSync(path.dirname(trashDest), { recursive: true });
    const srcStat = fs.statSync(projectSrc);
    if (srcStat.isDirectory()) {
      fs.cpSync(projectSrc, trashDest, { recursive: true });
    } else {
      fs.copyFileSync(projectSrc, trashDest);
    }
  } catch (err) {
    return {
      status: 'error',
      message: `Backup failed — source left untouched: ${err.message}`
    };
  }

  // Backup succeeded — now remove the project copy
  fs.rmSync(projectSrc, { recursive: true, force: true });

  return {
    status: 'reset',
    message: `"${rel}" reset to lib default (backup: .marbas/trash/…)`,
    backupPath: trashDest
  };
}
