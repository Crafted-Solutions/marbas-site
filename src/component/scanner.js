import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_LIB_ROOT = path.resolve(__dirname, '../..');

/**
 * Scan a single component directory and return its capabilities.
 *
 * @param {string} componentDir  Absolute path to the component directory
 * @returns {{ name, componentDir, templatePath, apiDir, apiFiles, clientFiles, buildHookPath, schemaPath, aiPath }}
 */
export function scanComponent(componentDir) {
  const name = path.basename(componentDir);

  const templateFile = path.join(componentDir, `${name}.njk`);
  const buildHookFile = path.join(componentDir, 'build.js');
  const schemaFile = path.join(componentDir, 'schema.json');
  const aiFile = path.join(componentDir, 'ai.json');

  const apiDir = path.join(componentDir, '_api');
  const apiFiles = fs.existsSync(apiDir)
    ? listFilesRecursive(apiDir)
    : [];

  const clientDir = path.join(componentDir, 'client');
  const clientFiles = fs.existsSync(clientDir)
    ? listFilesRecursive(clientDir).filter((f) => /\.(js|css)$/.test(f))
    : [];

  return {
    name,
    componentDir,
    templatePath: fs.existsSync(templateFile) ? templateFile : null,
    apiDir: apiFiles.length > 0 ? apiDir : null,
    apiFiles,
    clientFiles,
    buildHookPath: fs.existsSync(buildHookFile) ? buildHookFile : null,
    // App-only metadata — detected for forward-compat, not processed by lib
    schemaPath: fs.existsSync(schemaFile) ? schemaFile : null,
    aiPath: fs.existsSync(aiFile) ? aiFile : null
  };
}

/**
 * Scan all components from both project and lib roots.
 * Project components shadow lib components with the same name (complete override, not file-wise).
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} [options.libRoot]
 * @returns {Array}
 */
export function scanAllComponents({ projectRoot, libRoot = DEFAULT_LIB_ROOT } = {}) {
  const projectComponentsDir = path.join(projectRoot, '_components');
  // Lib built-ins live in _includes/components/ (idiomatic Eleventy includes location).
  const libComponentsDir = path.join(libRoot, '_includes', 'components');

  const projectComponentNames = new Set(
    fs.existsSync(projectComponentsDir)
      ? readSubdirectoryNames(projectComponentsDir)
      : []
  );

  const projectComponents = [...projectComponentNames].map((name) =>
    scanComponent(path.join(projectComponentsDir, name))
  );

  const libComponentNames = fs.existsSync(libComponentsDir)
    ? readSubdirectoryNames(libComponentsDir).filter((name) => !projectComponentNames.has(name))
    : [];

  const libComponents = libComponentNames.map((name) =>
    scanComponent(path.join(libComponentsDir, name))
  );

  return [...projectComponents, ...libComponents];
}

function readSubdirectoryNames(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function listFilesRecursive(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(full));
    } else {
      results.push(full);
    }
  }
  return results;
}
