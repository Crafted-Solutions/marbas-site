/**
 * Workaround for an Eleventy watch bug (3.1.2 – 3.1.x): stale content after a page change.
 *
 * When any watched path starts with `../` — here `dir.includes`, which points at the lib's `_includes/`
 * whenever the lib lives outside the project (desktop app, monorepo) — Eleventy moves the file watcher's
 * `cwd` up to the common parent folder (GlobRemap, added for eleventy#3854) but does not map the reported
 * paths back. A change to `pages/about.md` then arrives as `./<parent>/<project>/pages/about.md`, matches
 * no template, the cached page content is kept, and the rebuild writes the old content.
 *
 * Fix: for watch runs, make the instance method `GlobRemap#getCwd()` return '' so the watcher stays on the project
 * folder. Only the watcher asks the instance (Eleventy.js `remapper.getCwd()`); Eleventy's file search uses the static
 * `GlobRemap.getCwd()` and keeps its remapping. Changes to files outside the project (lib templates) still trigger a
 * rebuild.
 *
 * This patches Eleventy internals, so it is fenced: only for the affected version range, only when the
 * expected function exists. Eleventy 4 rewrote the watcher without the remap — remove this file then.
 * Guarded by test/preview/watch-content.test.js.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const ELEVENTY_PACKAGE = '@11ty/eleventy';
const GLOB_REMAP_FILE = path.join('src', 'Util', 'GlobRemap.js');

/**
 * Affected: 3.1.2 up to (not including) 4.0.0. Pre-releases of 3.1.2 itself are not (the remap arrived with the
 * final 3.1.2). Later 3.x lines are assumed affected until proven otherwise — the warning below tells us.
 */
export function isAffectedEleventyVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/.exec(String(version || ''));
  if (!match) return false;
  const [major, minor, patch] = match.slice(1, 4).map(Number);
  if (major !== 3) return false;
  if (minor > 1) return true;
  if (minor < 1 || patch < 2) return false;
  return !(patch === 2 && match[4]);
}

export function isWatchRun({ argv = process.argv, env = process.env } = {}) {
  if (env.ELEVENTY_RUN_MODE === 'serve' || env.ELEVENTY_RUN_MODE === 'watch') return true;
  return argv.some((arg) => arg === '--serve' || arg === '--watch');
}

function readEleventyPackage(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return pkg.name === ELEVENTY_PACKAGE ? pkg : null;
  } catch {
    return null;
  }
}

/**
 * The Eleventy installation that is running this process: `{ root, version }`, or null. Taken from the started
 * script (`…/@11ty/eleventy/cmd.cjs`), never resolved by package name — a project may bring its own Eleventy, and
 * patching another copy than the running one would do nothing.
 */
export function findRunningEleventy({ argv = process.argv } = {}) {
  if (!argv[1]) return null;
  let root;
  try {
    root = path.dirname(fs.realpathSync(argv[1]));
  } catch {
    return null;
  }
  const pkg = readEleventyPackage(root);
  return pkg ? { root, version: String(pkg.version || '') } : null;
}

/**
 * @returns {Promise<{ applied: boolean, reason: string, version?: string }>}
 *   reason: 'applied' | 'not-watch' | 'eleventy-not-found' | 'version-not-affected' | 'internals-changed'
 */
export async function applyEleventyWatchFix({ argv = process.argv, env = process.env, log = console.warn } = {}) {
  if (!isWatchRun({ argv, env })) return { applied: false, reason: 'not-watch' };

  const eleventy = findRunningEleventy({ argv });
  if (!eleventy) {
    log('[marbas-site] Eleventy was not started through its CLI — watch path fix not applied. '
      + 'The preview may show stale content after a page change.');
    return { applied: false, reason: 'eleventy-not-found' };
  }

  const { root, version } = eleventy;
  if (!isAffectedEleventyVersion(version)) return { applied: false, reason: 'version-not-affected', version };

  try {
    const { default: GlobRemap } = await import(pathToFileURL(path.join(root, GLOB_REMAP_FILE)).href);
    if (typeof GlobRemap?.prototype?.getCwd !== 'function') throw new Error('GlobRemap#getCwd is missing');
    GlobRemap.prototype.getCwd = () => '';
    return { applied: true, reason: 'applied', version };
  } catch (error) {
    log(`[marbas-site] Eleventy ${version}: watch path fix could not be applied (${error.message}). `
      + 'The preview may show stale content after a page change.');
    return { applied: false, reason: 'internals-changed', version };
  }
}
