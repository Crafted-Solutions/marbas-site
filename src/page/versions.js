import fs from 'fs';
import path from 'path';

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Returns the absolute path to the manifest.json for a given page.
 *
 * @param {string} archiveDir  Absolute path to the archive root (e.g. <project>/.page-versions)
 * @param {string} relativePath  Relative page path (e.g. "index.md")
 * @returns {string}
 */
export function getManifestPath(archiveDir, relativePath) {
  const pageDir = path.join(archiveDir, relativePath.replace(/\.[^.]+$/, ''));
  return path.join(pageDir, 'manifest.json');
}

/**
 * Reads the version manifest for a page. Returns null if no manifest exists.
 *
 * @param {string} archiveDir
 * @param {string} relativePath
 * @returns {object|null}
 */
export function readManifest(archiveDir, relativePath) {
  const manifestPath = getManifestPath(archiveDir, relativePath);
  if (!fs.existsSync(manifestPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Writes the version manifest for a page.
 *
 * @param {string} archiveDir
 * @param {string} relativePath
 * @param {object} manifest
 */
export function writeManifest(archiveDir, relativePath, manifest) {
  const manifestPath = getManifestPath(archiveDir, relativePath);
  ensureDirectory(path.dirname(manifestPath));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * Archives a page version file under `<archiveDir>/<page-path-without-ext>/v<NNNNNN>.md`.
 * Returns the relative path from archiveDir to the archived file.
 *
 * @param {string} archiveDir
 * @param {string} relativePath
 * @param {number} versionNumber
 * @param {string} fileContent
 * @returns {string}
 */
export function archiveVersionFile(archiveDir, relativePath, versionNumber, fileContent) {
  const archiveFileName = `v${String(versionNumber).padStart(6, '0')}.md`;
  const archiveAbsolutePath = path.join(
    archiveDir,
    relativePath.replace(/\.[^.]+$/, ''),
    archiveFileName
  );

  ensureDirectory(path.dirname(archiveAbsolutePath));
  fs.writeFileSync(archiveAbsolutePath, fileContent);

  return path.relative(path.dirname(archiveDir), archiveAbsolutePath)
    .split(path.sep).join('/');
}
