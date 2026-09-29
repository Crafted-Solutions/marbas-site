# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.15.1] - 2026-09-29

### Fixed

- **`doctor` reported every library theme as "not found"** (`The "path" argument must be of type string. Received null`):
  `runDoctor` passed an explicit `libRoot: null` that replaced the checks' default. It now uses the installed lib, so
  library themes resolve and v2 palettes are checked again.
- **`doctor` ejected check:** it now compares against the lib too — an ejected library theme (`_theme/<id>.css`) is
  matched against `themes/<id>.css` and reported as "ejected" instead of "project-specific"; placeholder dotfiles
  (`.gitkeep`) are no longer listed.

### Added

- `@crafted.solutions/marbas-site/theme` exports the Base v2 palette and layout helpers (`PALETTE_KEYS`,
  `readThemeFamily`, `readPalettePresets`, `readPaletteValues`, `normalizePaletteConfig`, `paletteContrastWarnings`,
  `contrastRatio`, `LAYOUT_OPTIONS`, `readThemeLayout`) — the same logic the build and `doctor` use.

## [0.15.0] - 2026-09-29

### Added

- **Base v2 foundations:** theme families `classic` (the look up to 0.14, unchanged) and `v2` (`@family v2` in the theme).
  v2 pages are no longer boxed — sections run as full-width bands with the content in a measure; a section frame
  (`.c-v2`, label rail, `tone` paper/soft/white/alert, hairlines), form tokens for display typography and text links
  with an arrow. `<body>` gets `c-page--v2` / `c-page--classic`.
- **Palettes:** v2 themes define 8 named colours (`--p-*`) and optional presets; a project picks a preset
  (`theme.palette`) or overrides single colours (`theme.colors`) in `marbas-project.json`. Invalid values are rejected,
  weak contrasts are reported by the build and `doctor`.
- **Base v2 building blocks** (built-ins): `Intro` (editorial opening, provides the `<h1>`), `Notice`, `LinkList`
  (numbered rows), `Split` (text + list or big numbers), `Contact` (contact data + opening hours) — all with the section
  frame fields `label` and `tone`. Also usable in classic themes (bands stay inside the boxed page).
- **Header/footer from `site.json` without ejecting:** `header.tagline` (line under the name), `header.navLinks`
  (anchor/external menu entries, `tone: "alert"` for a highlighted link), footer columns with text
  (`groups[].source: "text"`) and `footer.bottomNote`. In v2 themes buttons (`.c-btn`) render as text links with ↗;
  `.c-link-arrow` is available everywhere. Classic themes keep their buttons.
- **`theme-editorial`** — the first Base v2 library theme: editorial form (large grotesque type, hairlines, labels in
  the margin, text links), Inter, default palette graphite + ink blue and presets `warm`, `nacht`, `salbei` (all AA).
  `init --theme=theme-editorial --starter` creates starter pages from the v2 building blocks. `init` without `--theme`
  is unchanged (classic).
- **`theme-druckwerk`** — sixth Base v2 library theme, a risograph/zine look: two print colours on natural paper with
  grain (off with `prefers-reduced-transparency`), per-line overprint bars behind headings, duotone intro image with
  offset, rotated stamp labels in the side rail, sticker cards, tape notes, label buttons. Print colours are theme-internal
  decoration only (fluorescent colours never carry text). Palettes: default pink + blue, `gruen-orange`, `gelb-violett` (all AA).
- **`theme-minimal-luxe`** — fifth Base v2 library theme: strong reduction, hairlines, light serif in large sizes
  (Cormorant Garamond, Jost), centred section heads, full-bleed intro image (no horizontal scroll, stays in its column
  in multi-column layouts), letter-spaced caps for labels, menu and links. Palettes: default ivory + bronze, `noir`,
  `stein` (all AA).
- **`theme-warm`** — fourth Base v2 library theme: serif headings with italics (Source Serif 4, Nunito Sans), cream
  paper with a fine grain, rounded tinted cards, organically cropped intro image, wavy top edge on colour bands (stays
  inside its column in multi-column layouts), pill buttons. Palettes: default terracotta, `salbei`, `beere` (all AA).
- **`theme-bold`** — third Base v2 library theme: huge condensed uppercase headings (Oswald), `tone: soft` and `alert`
  as full colour fields with light text (the palette is remapped inside the band), thick black rules, square uppercase
  buttons with offset shadow, black footer. Palettes: default cobalt, `signal`, `wald` (all AA, inverted pairs included).
- **`theme-product`** — second Base v2 library theme, deliberately the opposite of Editorial: floating glass header
  with underlined active item, pill labels above titles, card grid, check-mark lists, numbers and contact as cards,
  solid buttons, dark footer; Plus Jakarta Sans. Palettes: default indigo on white, `nacht` (navy + gold), `petrol` (all AA).
- **Theme decides the layout (`@layout`)**: v2 themes declare how the building blocks are arranged — section label
  above the title or as a side column (`rail`), Intro image right/left/below (`intro`), LinkList as cards or rows,
  Split in columns or stacked, Notice as box or band, CTAs as buttons or text links. Defaults for themes without
  `@layout`: label above the title, cards, boxes, buttons. `theme-editorial` declares its current arrangement and looks
  unchanged. Body gets `c-l-*` classes; an ejected `base.njk` needs `{{ marbasTheme.layoutClasses }}` (doctor warns).
- Palette value **`surface`** (optional, default `#fff`) for the `tone: white` band; the contrast check now also tests
  text on it, so a dark palette without `surface` is reported instead of rendering light text on white.

### Fixed

- Base v2: the narrow title widths (`Split layout: title` 9ch, LinkList/section title 12ch) were a base rule and
  squeezed titles in every form (e.g. five lines in Product). They now belong to `theme-editorial` only; other forms
  use the full column. Projects with an ejected/own Editorial theme add the two rules themselves (see theme-editorial.css).
- Classic built-ins (Hero, Cards, TextMedia …) and custom components in pages with a Base v2 theme ran edge to edge
  without spacing (the v2 page is unboxed). They now sit in the page measure with section spacing; in multi-column
  layouts they fill their column.
- v2 themes with multi-column page layouts (`content_2col_*`, `content_3col_*`): bands ran across the side column
  and past the window edge, the page title sat at the window edge. The column grid now stays in the page measure,
  bands stay in their column, and the building blocks adapt to their column width (container queries).
- SVG images (`image.src: *.svg`) are no longer rasterised to WebP/JPEG variants — they are copied as-is and
  rendered as a single `<img src="….svg">` (sharp at any size). Projects that linked the generated
  `/images/<id>-<w>w.webp` files of an SVG directly must link the SVG instead.
- Pages without a hero: the page title `<h1>` was rendered with the component heading size
  (`--text-2`) and came out smaller than the section headings below it (Cards headings use `--text-3`).
  It now uses `.c-page-title` (`--text-4`, like any `h1`). **Visible change:** larger titles on sub pages.
- Cards `columns: 4` silently fell back to two columns — the grid had classes for 1–3 only. The base now
  provides `c-cols-lg-4` / `c-cols-xl-4`; values outside 1–4 are clamped.

## [0.14.0] - 2026-09-28

### Added

- Built-in themes ship their web fonts (self-hosted woff2, latin + latin-ext, SIL Open Font License;
  source: Fontsource, see `THIRD_PARTY_NOTICES.md`). Until now the themes named fonts such as Inter,
  Cormorant Garamond or Playfair Display but nothing loaded them — visitors saw the system fallback.
  A build copies only the fonts of the selected theme to `_assets/fonts/`. **Sites using a built-in
  theme change their look** (the intended typeface now renders; line breaks and button widths may
  shift). The npm package grows from 0.17 MB to 2.3 MB (packed).
- Theme token `--t-on-accent` (and `--cmp-on-link` inside components) for the text colour of primary
  buttons. Default stays `white`; themes set a dark colour where the accent must be light (dark mode,
  `.c-component--dark`), where white text could not reach 4.5:1.
- CLI options accept their value as the next argument: `--name "Acme Inc"` works like `--name="Acme Inc"`.

### Changed

- All 18 built-in themes now meet WCAG AA (4.5:1) for every colour pair the base renders — links,
  primary buttons (incl. dark mode via `--t-on-accent`), active navigation, muted text, footer and
  announcement, in all four component variants. Before, 12 themes missed it in places and their header
  comments claimed "AA ✓" regardless. Visible accent changes:
  `klinik` #0891b2 → #007088 · `maison` #a07048 → #7a5a32 · `signal` #8b5cf6 → #a084ff (dark-first,
  lighter; dark button text) · `tempo` #f97316 → #ff791f. Barely visible: `bloom`, `fjord`, `forum`,
  `lumina`, `verdant` (accent a few steps darker), `slate` dark mode. Active-navigation and "special"
  tints are lighter in `bloom`, `fjord`, `forum`, `lumina`, `slate`, `tempo`, `verdant` (min. 7–10 %).

### Fixed

- `marbas-site init p --name Acme` named the project "true" (the value was dropped silently). An option
  that needs a value but has none is now an error.
- Footer contact links (phone, e-mail) used the global accent colour and were barely readable on dark
  footers (`footer.variant: contrast`). They now use the footer link colours.

## [0.13.1] - 2026-09-27

### Fixed

- Footer link groups sat in one narrow column: the flex row of the footer gave the group grid no
  width. Groups now fill the remaining space next to the brand/contact column (single column on
  mobile).
- Mobile navigation: menu entries were pushed to the bottom of the panel (the desktop
  `justify-content: flex-end` / `wrap` applied to the vertical panel).
- Pages without a theme: the base now defines neutral colour tokens (`--t-bg`, `--t-surface`,
  `--t-text`, `--t-muted`, `--t-border`, `--t-accent` and the invert set) — the mobile menu panel
  was transparent. Themes override them as before.
- `base.full.css` is again generated from the theme library sources (hero radius variables were
  only present in the shipped file).

## [0.13.0] - 2026-09-27

*Not published to npm — contained in 0.13.1.*

### Added

- Localized `site.json` values: texts and links can be objects per language
  (`{ "de": "…", "en": "…" }`); new filters `t` and `uiText`. The normalizer keeps them (it
  previously turned any non-string into `""`).

- Front matter `translationKey` links translations with different slugs
  (`/ueber-uns/` ↔ `/en/about-us/`); CMS page ids (`marbasCmsI18n.sourcePageId`) are used as well.

- Built-in components render their block `id` as HTML `id` — blocks can be linked as anchors
  (`/page/#services`).
- Block flag `providesH1: true`: a custom component that renders the page's `<h1>` suppresses the
  page-title `<h1>` (previously only `componentType: Hero` did).

- `marbas-site init` options `--lang=<code>` (default language; writes `locale` to `site.json`,
  non-German languages get an English starter: Home, About us, Imprint, Privacy) and
  `--theme=<id>` (activates the theme incl. its header/nav/footer variants).
- New projects get `_assets/favicons/favicon.ico` and `apple-touch-icon.png` (the base layout
  links both; they were missing → 404).

### Changed

- `init --name` now also sets `site.json` title, `footer.companyName`, `footer.copyright` and
  `seo.siteName` (previously the folder name).
- New projects have `theme.languageSwitcher: false` (one language). Enable it when you add
  languages to `locale`.
- `marbas-site theme` applies the theme's variant defaults to `site.json` where the site still
  uses `default` (same as the Marbas editor); hand-set variants are kept.
- Project `.gitignore` covers `.cache/` and the generated `_webpack/lib-entry.js` /
  `_webpack/custom-js-entry.js`.
- German starter: no `"#"` links (cards without links, banner links to `/ueber-uns/`); legal
  pages no longer repeat their title as a second heading.

### Fixed

- Built-in interface texts (skip link, "open/close navigation", main/service navigation,
  submenu, announcement, legal navigation) were always German; they now follow the page language.
- Footer groups and bottom links with `source: "tagCollection"` never showed any link (Nunjucks
  `slice(0, n)` returns groups, not the first n items) and did not filter by language.
- `init` without `--starter`: the start page now has `pageLanguage` (menus and footer lists filter
  by it) and a title in the project language.
- Mobile navigation, submenu toggles and the announcement dismiss button did nothing on
  CLI-built sites: the base layout loaded `/_assets/js/full.js` and `/_assets/js/languageSwitcher.js`,
  but the build ships them under `/_assets/js/_lib/` (404).
- Language switcher: links to the actual translation (same path, `translationKey` or CMS link);
  pages without a translation lead to the start page of the target language instead of a 404 and
  are marked "not translated"; slugs starting with a language code (`/design/`) are no longer
  mangled; language labels were empty (`label` vs. `name`); debug logging removed; the switcher is
  only rendered when more than one language is configured.
- `hreflang` / `og:locale:alternate` are only written for language versions that exist (plus
  `x-default`); previously every configured language was listed.
- Footer social links now show their platform icon (they rendered an empty box). Icons for
  X/Twitter, Instagram, GitHub, Facebook, YouTube, TikTok and Xing come from Simple Icons (CC0),
  LinkedIn from the theme library; unknown platforms get a neutral link icon. See
  `THIRD_PARTY_NOTICES.md`.
- Footer presets `columns`, `columns-social` and `columns-cta` now render `footer.contact`
  (it was silently dropped). Sites using these presets with contact data will show it after
  updating.
- Footer address lines are separated (street, postcode/city, country were run together).
- `tel:` links keep only `+` and digits (new filter `telHref`): `030 / 4737 8115` no longer
  produces an invalid `tel:030/47378115`; the `(0)` trunk prefix is dropped.

## [0.12.1] - 2026-09-27

*Not published to npm — contained in 0.13.0.*

### Fixed

- The build ignored `locale` from `pages/_data/site.json` and always assumed a German-only
  site: the language switcher offered only German, `hreflang` listed German on English-only
  sites, and — together with the component-link fix in 0.12.0 — component links on sites
  whose default language is not German got a bogus language prefix (`/en/contact/` on an
  English-only site). `tm.eleventy.js` now reads `site.locale`; a missing `defaultLanguage`
  falls back to the first configured language.

## [0.12.0] - 2026-09-27

*Not published to npm — superseded by 0.12.1 (regression for non-German default languages).*

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
