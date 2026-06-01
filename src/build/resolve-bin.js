import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { getLibRoot } from '../eject/index.js';

const require = createRequire(import.meta.url);

function resolvePackageMetadata(packageName, rootDir) {
  const entryPath = require.resolve(packageName, {
    paths: [rootDir, getLibRoot(), process.cwd()]
  });

  let currentDir = path.dirname(entryPath);
  while (true) {
    const candidate = path.join(currentDir, 'package.json');
    if (fs.existsSync(candidate)) {
      const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (pkg?.name === packageName) {
        return { packageDir: currentDir, packageJson: pkg };
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  throw new Error(`Cannot resolve package metadata for ${packageName}`);
}


/**
 * Resolve the CLI binary path for an npm package.
 *
 * @param {string} packageName
 * @param {string} rootDir         Project root to resolve from
 * @param {string} [preferredBin]  Preferred bin name (key in package.json#bin)
 * @returns {string} Absolute path to the binary script
 */
export function resolvePackageBin(packageName, rootDir, preferredBin = '') {
  const { packageDir, packageJson } = resolvePackageMetadata(packageName, rootDir);
  const { bin } = packageJson;

  let relativeBinPath = '';
  if (typeof bin === 'string') {
    relativeBinPath = bin;
  } else if (bin && typeof bin === 'object') {
    if (preferredBin && typeof bin[preferredBin] === 'string') {
      relativeBinPath = bin[preferredBin];
    } else {
      relativeBinPath = String(Object.values(bin).find((v) => typeof v === 'string') || '');
    }
  }

  if (!relativeBinPath) {
    throw new Error(`No binary entry found for package ${packageName}`);
  }

  return path.resolve(packageDir, relativeBinPath);
}
