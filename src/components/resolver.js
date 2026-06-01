import fs from 'fs';
import path from 'path';

/**
 * Resolves the template path for a component type.
 * Project directory takes precedence over lib — this is the eject/override mechanism for components.
 *
 * @param {string} type  Component type name (e.g. "Hero")
 * @param {{ projectRoot: string, libRoot: string }} opts
 * @returns {string|null}  Absolute path to the template file, or null if not found in either location
 */
export function resolveComponentPath(type, { projectRoot, libRoot }) {
  if (!type) return null;

  const projectPath = path.join(projectRoot, '_components', type, `${type}.njk`);
  if (fs.existsSync(projectPath)) return projectPath;

  const libPath = path.join(libRoot, '_includes', 'components', type, `${type}.njk`);
  if (fs.existsSync(libPath)) return libPath;

  return null;
}
