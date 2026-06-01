import fs from 'fs';
import path from 'path';

const RECOMMENDED = [
  '.marbas/trash/',
  'node_modules/',
  'build/',
];

/**
 * @param {string} projectPath
 * @returns {Array<{ id: string, status: 'ok'|'warn'|'error', message: string, details?: string }>}
 */
export function checkGitignore(projectPath) {
  const absProject = path.resolve(projectPath);
  const gitignorePath = path.join(absProject, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    return [{
      id: 'gitignore',
      status: 'warn',
      message: '.gitignore not found',
      details: `Recommended entries: ${RECOMMENDED.join(', ')}`,
    }];
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n').map((l) => l.trim());

  const missing = RECOMMENDED.filter((entry) => {
    const bare = entry.replace(/\/$/, '');
    return !lines.some((l) => l === entry || l === bare || l === `/${entry}` || l === `/${bare}`);
  });

  if (missing.length > 0) {
    return [{
      id: 'gitignore',
      status: 'warn',
      message: `.gitignore is missing recommended entries: ${missing.join(', ')}`,
    }];
  }

  return [{ id: 'gitignore', status: 'ok', message: '.gitignore contains all recommended entries' }];
}
