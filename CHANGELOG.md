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

- Starter: the CTA banner no longer carries `title`/`text` (the Banner component
  renders image + link only); starter pages now have a `seoDescription`.

### Documentation

- Corrected docs that contradicted the engine: language variants are folders
  (`pages/en/about.md`), not file suffixes; language config lives in
  `site.json → locale`; the menu needs `tags: [menu]` + `eleventyNavigation`
  + matching `pageLanguage` (`topNavigation` alone has no build effect; two menu
  levels); only the style variants `main`/`secondary`/`special`/`dark`
  (+ `framed`, `mobile-media-bottom`) exist and belong into `classes`;
  `theme.id` belongs into `marbas-project.json`; `layout` has no default; the
  Markdown body renders only with `base.njk`; `templateEngineOverride` is a
  convention, not a requirement.
- Custom components: documented the variables that are actually available
  (`data`, `lang`, `placeholder_sizes`, `page`). Components are purely
  data-driven by design — `site`, `env` and `_data` files are not passed in.
- `examples/basic` pages set `templateEngineOverride: njk,md`.
- Backfilled this changelog for 0.5.1–0.11.0.

### Fixed

- Images without `originalId` no longer collide: output files were all named
  `undefined-<w>w.<fmt>` and overwrote each other. They now get a stable name
  derived from the source path (`<basename>-<hash>-<w>w.<fmt>`). Images with
  `originalId` keep their file names.
- Links inside components keep the language prefix on non-default-language pages
  (`/en/contact/` instead of `/contact/`): `locale_url` now falls back to the
  component's `lang` when `pageLanguage` is not in the render context.
- `linkAriaLabel` is now rendered as `aria-label` on the link of TextMedia,
  TitleText and TitleTextImage{Left,Right,Top,Bottom}.
- New projects no longer show a broken logo: the default `logo.path`
  (`/_assets/images/Logo.png`) pointed to a file that was never shipped. marbas-site
  now ships a neutral placeholder `Logo.svg` (new default) and `Logo.png` (so existing
  `site.json` files with the old default path render too).
- `htmlAttribute` escapes `"`, `<`, `>` and bare `&` in attribute values —
  an `aria-label` containing quotes no longer breaks the markup.

## [0.11.0] - 2026-06-07

### Added

- `isCustomTheme()` helper to check whether a project ships its own theme file.

## [0.10.1] - 2026-06-07

### Fixed

- Logger: level gating; new `--log-level` flag for `build` and `preview`.

## [0.10.0] - 2026-06-07

*Not published to npm — contained in 0.10.1.*

### Added

- Project-local webpack configuration per environment: `_webpack/<env>.js`.

## [0.9.0] - 2026-06-07

*Not published to npm — contained in 0.10.1.*

### Added

- `marbas-site env add` / `env remove` to manage environments from the CLI.

## [0.8.0] - 2026-06-06

### Changed

- CLI and app build share one pipeline core (`src/build/pipeline.js`). The app
  path now always emits `custom.bundle.css` and cleans the resolved build output
  path.

## [0.7.1] – [0.7.7] - 2026-06-04 – 2026-06-05

*Published to npm: 0.7.1, 0.7.3, 0.7.4, 0.7.5, 0.7.6.*

### Changed

- The theme lives solely in `marbas-project.json → theme.id`; a `theme` block in
  `site.json` is dropped during normalization (0.7.5).
- Internal: slimmer `tm.eleventy.js`, logger contract enforced via
  `withLogger` (0.7.3, 0.7.4); test runner picks up all test files (0.7.7).

### Fixed

- `preview` copies the configured `theme.css` into the output on start (0.7.1).

## [0.7.0] - 2026-06-03

### Changed

- Dynamic environment model: built-in `development`/`production` plus custom
  environments from `marbas-project.json`, with clear errors instead of silent
  fallbacks. `init` seeds `development` + `production`; `reinit` keeps legacy
  default environments as custom ones. New export `./env`.

### Removed

- Fixed environment list (`local_test`, `staging` webpack configs).

## [0.6.0] – [0.6.3] - 2026-06-03

*Not published to npm.*

### Added

- `marbas-site reinit` command; `doctor` detects legacy configuration (0.6.0).

### Fixed

- `preview` passes theme/rendering environment variables from
  `marbas-project.json` (0.6.2).
- The theme is copied after webpack so `clean: true` no longer removes it (0.6.3).

## [0.5.1] – [0.5.4] - 2026-06-01 – 2026-06-03

*Not published to npm.*

### Added

- `init --starter` with example pages, images and components.
- Render settings in `marbas-project.json`: `theme.id`, `rendering`, `i18n` (0.5.2).

### Fixed

- Starter pages as flat `.md` files, with `tags: [menu]`, `eleventyNavigation`,
  `templateEngineOverride` and `originalId` (0.5.1).
- Rendering mode defaults to `globalData` (0.5.3).
- `build` applies the theme copy and render environment variables from
  `marbas-project.json` (0.5.4).

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
