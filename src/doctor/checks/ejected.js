import fs from 'fs';
import path from 'path';
import { EJECTABLE_DIRS } from '../../eject/index.js';

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function collectComponentDirs(baseDir) {
  if (!fs.existsSync(baseDir)) return [];
  return fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/**
 * @param {{ projectPath: string, libRoot?: string }} opts
 * @returns {Array<{ id: string, status: 'ok'|'warn'|'error', message: string, details?: string }>}
 */
export function checkEjected({ projectPath, libRoot = null }) {
  const absProject = path.resolve(projectPath);
  const results = [];
  let totalEjected = 0;

  for (const dirName of EJECTABLE_DIRS) {
    const projectDir = path.join(absProject, dirName);
    if (!fs.existsSync(projectDir)) continue;

    if (dirName === '_components') {
      const componentNames = collectComponentDirs(projectDir);
      for (const compName of componentNames) {
        const compDir = path.join(projectDir, compName);
        const files = walkFiles(compDir);
        if (files.length === 0) continue;

        totalEjected += files.length;

        // Built-in components live in the lib's _includes/components/.
        const hasLibDefault = libRoot
          ? fs.existsSync(path.join(libRoot, '_includes', 'components', compName))
          : null;

        const libCompDir = libRoot ? path.join(libRoot, '_includes', 'components', compName) : null;
        const libFiles = libCompDir && fs.existsSync(libCompDir)
          ? walkFiles(libCompDir).map((f) => path.relative(libCompDir, f))
          : [];
        const projectFiles = files.map((f) => path.relative(compDir, f));

        const allLibCovered = libFiles.length > 0 && libFiles.every((lf) => projectFiles.includes(lf));
        const isPartial = libFiles.length > 0 && !allLibCovered && projectFiles.length < libFiles.length;

        let status = 'ok';
        let label = 'ejected';

        if (hasLibDefault === false) {
          label = 'project-specific (no lib default)';
        } else if (isPartial) {
          label = 'partially ejected';
          status = 'warn';
        }

        results.push({
          id: `ejected._components.${compName}`,
          status,
          message: `_components/${compName} — ${label}`,
        });
      }
    } else {
      const files = walkFiles(projectDir);
      if (files.length === 0) continue;

      totalEjected += files.length;

      for (const absFile of files) {
        const rel = path.relative(absProject, absFile);
        const hasLibDefault = libRoot ? fs.existsSync(path.join(libRoot, rel)) : null;
        const label = hasLibDefault === false ? 'project-specific (no lib default)' : 'ejected';
        results.push({
          id: `ejected.${rel}`,
          status: 'ok',
          message: `${rel} — ${label}`,
        });
      }
    }
  }

  if (totalEjected === 0) {
    results.push({ id: 'ejected', status: 'ok', message: 'No ejected files' });
  }

  return results;
}
