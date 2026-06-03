import { checkVersion } from './checks/version.js';
import { checkEnvironments } from './checks/environments.js';
import { checkEjected } from './checks/ejected.js';
import { checkCssMode } from './checks/css-mode.js';
import { checkGitignore } from './checks/gitignore.js';
import { checkStaleBuildContext } from './checks/stale-build-context.js';
import { checkTheme } from './checks/theme.js';
import { checkLegacyConfig } from './checks/legacy-config.js';

/**
 * @param {{ projectPath: string, libRoot?: string }} opts
 * @returns {{ checks: Array, hasError: boolean }}
 */
export function runDoctor({ projectPath, libRoot = null } = {}) {
  if (!projectPath) {
    return { checks: [{ id: 'setup', status: 'error', message: 'projectPath is required' }], hasError: true };
  }

  const checks = [
    checkLegacyConfig(projectPath),
    checkVersion(projectPath),
    ...checkEnvironments(projectPath),
    ...checkEjected({ projectPath, libRoot }),
    ...checkCssMode({ projectPath }),
    ...checkGitignore(projectPath),
    ...checkStaleBuildContext(projectPath),
    ...checkTheme({ projectPath, libRoot }),
  ].flat();

  const hasError = checks.some((c) => c.status === 'error');
  return { checks, hasError };
}

const ANSI = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

const SYMBOLS = { ok: '✓', warn: '⚠', error: '✗' };
const COLORS = { ok: ANSI.green, warn: ANSI.yellow, error: ANSI.red };

/**
 * @param {{ checks: Array, hasError: boolean }} report
 * @param {{ color?: boolean }} opts
 * @returns {string}
 */
export function formatReport(report, { color = true } = {}) {
  const groups = { error: [], warn: [], ok: [] };
  for (const check of report.checks) {
    (groups[check.status] || groups.ok).push(check);
  }

  const lines = [];
  for (const status of ['error', 'warn', 'ok']) {
    for (const check of groups[status]) {
      const sym = SYMBOLS[status];
      const col = color ? COLORS[status] : '';
      const rst = color ? ANSI.reset : '';
      lines.push(`${col}${sym}${rst} ${check.message}`);
      if (check.details) lines.push(`  ${check.details}`);
    }
  }

  return lines.join('\n');
}
