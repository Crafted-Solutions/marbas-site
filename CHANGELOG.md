# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `defaultLinkText` filter: language-dependent fallback label for component links
  (`de` → "weitere Informationen", otherwise "More information"; empty language
  uses `locale.defaultLanguage`). Usable in custom components:
  `{{ data.linkText or (lang | defaultLinkText) }}`.

### Changed

- Cards, TextMedia and TitleText* use `defaultLinkText` when `linkText` is empty.
  Cards previously showed the English "More" on every page; TextMedia/TitleText*
  showed "weitere Informationen" on every page.

### Fixed

- Images without `originalId` no longer collide: output files were all named
  `undefined-<w>w.<fmt>` and overwrote each other. They now get a stable name
  derived from the source path (`<basename>-<hash>-<w>w.<fmt>`). Images with
  `originalId` keep their file names.
- `linkAriaLabel` is now rendered as `aria-label` on the link of TextMedia,
  TitleText and TitleTextImage{Left,Right,Top,Bottom}.
- New projects no longer show a broken logo: the default `logo.path`
  (`/_assets/images/Logo.png`) pointed to a file that was never shipped. marbas-site
  now ships a neutral placeholder `Logo.svg` (new default) and `Logo.png` (so existing
  `site.json` files with the old default path render too).
- `htmlAttribute` escapes `"`, `<`, `>` and bare `&` in attribute values —
  an `aria-label` containing quotes no longer breaks the markup.

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
