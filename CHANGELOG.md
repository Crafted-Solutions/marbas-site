# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-06-01

### Added

- Ejectable layout overrides: drop a `<project>/_includes/<name>.njk` to
  override a built-in layout.
- Global partials available as shortcodes: `{% siteHeader %}`,
  `{% siteFooter %}`, `{% siteMeta %}`, `{% siteHeadAssets %}`.
- Layout aliases with automatic project-override resolution.
- `doctor` now warns when a stale `.marbas/build-context/` directory is found
  (leftover from previous versions). The directory can be safely deleted.

### Deprecated

- `prepareBuildContext()` and `cleanupBuildContext()` are now no-ops and will be
  removed in the next major release. The `.marbas/build-context/` symlink workspace
  is no longer created. Templates are resolved via the MarbasResolver custom Nunjucks
  loader, `addLayoutAlias`, and shortcodes (`{% siteHeader %}`, `{% siteFooter %}`,
  `{% siteMeta %}`, `{% siteHeadAssets %}`, `{% renderComponent %}`).
  Existing code that imports these functions will continue to work without crashing
  until the next major release.
