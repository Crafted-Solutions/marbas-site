import fs from 'fs';
import path from 'path';

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

  const environments = raw.environments || {};
  const envNames = Object.keys(environments);
  const defaultEnv = raw.defaultEnvironment || null;

  if (envNames.length === 0) {
    return [{
      id: 'environments',
      status: 'warn',
      message: 'No environments defined in marbas-project.json',
    }];
  }

  const results = [];

  if (!defaultEnv) {
    results.push({
      id: 'environments.default',
      status: 'warn',
      message: 'defaultEnvironment not set in marbas-project.json',
    });
  } else if (!environments[defaultEnv]) {
    results.push({
      id: 'environments.default',
      status: 'warn',
      message: `defaultEnvironment "${defaultEnv}" is not defined in environments`,
    });
  }

  results.push({
    id: 'environments',
    status: 'ok',
    message: `Environments: ${envNames.join(', ')}${defaultEnv ? ` (default: ${defaultEnv})` : ''}`,
  });

  return results;
}
