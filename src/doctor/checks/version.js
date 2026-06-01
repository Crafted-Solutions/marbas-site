import fs from 'fs';
import path from 'path';

function getToolVersion() {
  // src/doctor/checks/version.js → ../../../package.json
  const pkgPath = new URL('../../../package.json', import.meta.url).pathname;
  if (fs.existsSync(pkgPath)) {
    try {
      return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
    } catch {
      // fall through
    }
  }
  return '0.0.0';
}

/**
 * @param {string} projectPath
 * @returns {{ id: string, status: 'ok'|'warn'|'error', message: string, details?: string }}
 */
export function checkVersion(projectPath) {
  const toolVersion = getToolVersion();
  const configPath = path.join(projectPath, 'marbas-project.json');

  if (!fs.existsSync(configPath)) {
    return {
      id: 'version',
      status: 'error',
      message: 'marbas-project.json not found',
    };
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return { id: 'version', status: 'error', message: `Cannot parse marbas-project.json: ${err.message}` };
  }

  const projectVersion = raw.marbasSite || null;

  if (!projectVersion) {
    return {
      id: 'version',
      status: 'warn',
      message: 'marbasSite version not set in marbas-project.json',
      details: `Tool version: ${toolVersion}`,
    };
  }

  const toolMajor = parseInt(toolVersion.split('.')[0], 10);
  const projMajor = parseInt(String(projectVersion).split('.')[0], 10);

  if (toolMajor !== projMajor) {
    return {
      id: 'version',
      status: 'error',
      message: `Major version mismatch: project expects ${projectVersion}, tool is ${toolVersion}`,
      details: 'Update the tool or set marbasSite in marbas-project.json to match.',
    };
  }

  if (projectVersion !== toolVersion) {
    return {
      id: 'version',
      status: 'warn',
      message: `Minor version drift: project ${projectVersion}, tool ${toolVersion}`,
    };
  }

  return { id: 'version', status: 'ok', message: `Version ${toolVersion} matches project` };
}
