import fs from 'fs';
import path from 'path';
import { listEnvironments, isValidEnvironment } from '../../env/resolve.js';

/**
 * @param {string} projectPath
 * @returns {Array<{ id: string, status: 'ok'|'warn'|'error', message: string, details?: string }>}
 */
export function checkEnvironments(projectPath) {
  const configPath = path.join(projectPath, 'marbas-project.json');

  if (!fs.existsSync(configPath)) {
    return [{ id: 'environments', status: 'error', message: 'marbas-project.json not found' }];
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return [{ id: 'environments', status: 'error', message: `Cannot parse marbas-project.json: ${err.message}` }];
  }

  // Resolved environments = built-ins (development, production) merged with
  // those defined in marbas-project.json.
  const envNames = listEnvironments(projectPath);
  const defaultEnv = raw.defaultEnvironment || null;

  const results = [];

  if (!defaultEnv) {
    results.push({
      id: 'environments.default',
      status: 'warn',
      message: 'defaultEnvironment not set in marbas-project.json',
    });
  } else if (!isValidEnvironment(defaultEnv, projectPath)) {
    results.push({
      id: 'environments.default',
      status: 'warn',
      message: `defaultEnvironment "${defaultEnv}" is not a valid environment`,
    });
  }

  results.push({
    id: 'environments',
    status: 'ok',
    message: `Environments: ${envNames.join(', ')}${defaultEnv ? ` (default: ${defaultEnv})` : ''}`,
  });

  return results;
}
