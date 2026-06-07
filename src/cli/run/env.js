import { readProjectConfig, writeProjectConfig } from '../../project/config.js';
import { BUILTIN_ENVIRONMENTS, normalizeMode } from '../../env/resolve.js';

const KEY_RE = /^[a-z0-9_]+$/;

export function runEnvAdd({ projectPath, key, flags }) {
  if (!projectPath || !key) {
    process.stderr.write('Usage: marbas-site env add <path> <key> [--mode=development|production] [--output=<name>]\n');
    process.exit(1);
  }

  if (!KEY_RE.test(key)) {
    process.stderr.write(`Invalid environment key "${key}". Only lowercase letters, digits and underscores are allowed.\n`);
    process.exit(1);
  }

  if (BUILTIN_ENVIRONMENTS[key]) {
    process.stderr.write(`Cannot add built-in environment "${key}".\n`);
    process.exit(1);
  }

  let config;
  try {
    config = readProjectConfig(projectPath);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }

  if (config.environments[key]) {
    process.stderr.write(`Environment "${key}" already exists.\n`);
    process.exit(1);
  }

  const mode = normalizeMode(flags.mode);
  const outputName = (typeof flags.output === 'string' && flags.output) ? flags.output : key;

  config.environments[key] = { outputName, mode, env: {} };

  try {
    writeProjectConfig(projectPath, config);
  } catch (err) {
    process.stderr.write(`Failed to write marbas-project.json: ${err.message}\n`);
    process.exit(1);
  }

  process.stdout.write(`Environment "${key}" added (mode: ${mode}, output: ${outputName}).\n`);
}

export function runEnvRemove({ projectPath, key }) {
  if (!projectPath || !key) {
    process.stderr.write('Usage: marbas-site env remove <path> <key>\n');
    process.exit(1);
  }

  if (BUILTIN_ENVIRONMENTS[key]) {
    process.stderr.write(`Cannot remove built-in environment "${key}".\n`);
    process.exit(1);
  }

  let config;
  try {
    config = readProjectConfig(projectPath);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }

  if (!config.environments[key]) {
    process.stderr.write(`Environment "${key}" does not exist.\n`);
    process.exit(1);
  }

  delete config.environments[key];

  if (Object.keys(config.environments).length === 0) {
    process.stderr.write(`Cannot remove "${key}": it is the only environment in marbas-project.json. Add another environment first.\n`);
    process.exit(1);
  }

  if (config.defaultEnvironment === key) {
    config.defaultEnvironment = 'development';
    process.stdout.write(`defaultEnvironment was "${key}" — reset to "development".\n`);
  }

  try {
    writeProjectConfig(projectPath, config);
  } catch (err) {
    process.stderr.write(`Failed to write marbas-project.json: ${err.message}\n`);
    process.exit(1);
  }

  process.stdout.write(`Environment "${key}" removed.\n`);
}
