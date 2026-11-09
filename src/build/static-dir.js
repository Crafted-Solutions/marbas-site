import fs from 'fs';
import path from 'path';

/**
 * Files for the site root (Task 212).
 *
 * Everything in `<project>/_static/` is copied unchanged — subfolders and dotfiles included — into the root of the
 * built site: robots.txt, ads.txt, `.well-known/…`, `.htaccess`, verification files, favicons. Before 0.25 the only
 * way was `_assets/favicons/`; that folder still works as a fallback, `_static/` wins on a name clash.
 *
 * Kept free of webpack imports: the build pipeline and the preview use the log hint without loading webpack.
 */

export const STATIC_DIR = '_static';
export const LEGACY_ROOT_DIR = '_assets/favicons';

/** System files that must never reach the web root. */
export const ROOT_COPY_IGNORE = ['**/.DS_Store', '**/Thumbs.db', '**/desktop.ini', '**/.gitkeep'];

/**
 * CopyPlugin patterns for the site root. `_static/` gets a higher priority and `force`, so on the same file name it
 * is copied last and overwrites the legacy folder.
 *
 * @param {string} outputPath  Absolute path to the build output root (public_<env>)
 * @param {string} projectRoot Absolute project root
 */
export function getRootCopyPatterns(outputPath, projectRoot) {
  const globOptions = { ignore: ROOT_COPY_IGNORE };
  return [
    {
      from: path.resolve(projectRoot, LEGACY_ROOT_DIR),
      to: outputPath,
      noErrorOnMissing: true,
      priority: 0,
      globOptions
    },
    {
      from: path.resolve(projectRoot, STATIC_DIR),
      to: outputPath,
      noErrorOnMissing: true,
      priority: 10,
      force: true,
      globOptions
    }
  ];
}

/**
 * Log hint for projects that still keep files in the legacy folder — null when there is nothing to say.
 *
 * @param {string} projectRoot
 * @returns {string|null}
 */
export function legacyRootDirNotice(projectRoot) {
  const dir = path.join(projectRoot, LEGACY_ROOT_DIR);
  let entries;
  try {
    entries = fs.readdirSync(dir).filter((name) => !['.DS_Store', 'Thumbs.db', 'desktop.ini', '.gitkeep'].includes(name));
  } catch {
    return null;
  }
  if (entries.length === 0) return null;
  return `${LEGACY_ROOT_DIR}/ is deprecated — move its files to ${STATIC_DIR}/ (copied to the site root the same way).`;
}
