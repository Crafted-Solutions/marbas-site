import fs from 'fs';
import path from 'path';

/**
 * Detects a leftover .marbas/build-context/ directory from a previous
 * lib version that used symlink workspace materialization.
 * This directory is no longer created — it can be safely deleted.
 *
 * @param {string} projectPath
 * @returns {Array<{ id: string, status: 'ok'|'warn', message: string, details?: string }>}
 */
export function checkStaleBuildContext(projectPath) {
  const buildContextDir = path.join(path.resolve(projectPath), '.marbas', 'build-context');

  if (fs.existsSync(buildContextDir)) {
    return [{
      id: 'stale-build-context',
      status: 'warn',
      message: '.marbas/build-context/ found — stale from a previous lib version',
      details: 'This directory is no longer created or used. It can be safely deleted: rm -rf .marbas/build-context/',
    }];
  }

  return [{ id: 'stale-build-context', status: 'ok', message: 'No stale build-context directory' }];
}
