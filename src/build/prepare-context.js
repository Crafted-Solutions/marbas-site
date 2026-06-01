// DEPRECATED — no longer used.
// Templates are now resolved via MarbasResolver (custom Nunjucks loader),
// addLayoutAlias, and shortcodes. No symlink workspace is needed.
//
// These stubs remain so that any external code that imported this module
// continues to work without crashing. They will be removed in a future
// major release.

/**
 * @deprecated No-op. Will be removed in a future major release.
 */
export function prepareBuildContext() {
  // intentional no-op
}

/**
 * @deprecated No-op. Will be removed in a future major release.
 */
export function cleanupBuildContext() {
  // intentional no-op
}
