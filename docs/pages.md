# Pages

A Marbas page is a Markdown file inside the `pages/` folder of your project. The file name and folder path determine the URL; the YAML front matter controls layout, SEO, navigation, and content structure.

## File location and URLs

```
pages/index.md          → /
pages/about.md          → /about/
pages/services/web.md   → /services/web/
```

Folder nesting is unlimited. Every page is a standalone Markdown file — no routing config required.
Pages in a language folder (`pages/en/…`) are language variants — see [Language variants](#language-variants).

## Front matter reference

All fields are optional unless marked **required**.

### Core

| Field | Type | Default | Description |
|---|---|---|---|
| `layout` | string | — | Page layout template. See [Layouts](#layouts). **Always set it** — there is no default: a page without `layout` is written as bare HTML without header, footer or CSS. |
| `title` | string | — | Page title. Used in the `<title>` tag and navigation unless overridden. **Required** for meaningful output. |
| `pageLanguage` | string | — | BCP 47 language code for this page (`de`, `en`, `fr`, …). **Always set it** — the navigation menus only list pages whose `pageLanguage` matches the current page. Must match the language folder (see [Language variants](#language-variants)). |
| `templateEngineOverride` | string | — | Set to `njk,md` (convention, written by the CMS and the starter). Controls how the **Markdown body** is processed: with it, Nunjucks; without it, Liquid. Placeholders render either way, because the layout is always Nunjucks. |
| `permalink` | string | derived from file path | Override the output URL. Example: `/custom-path/`. |

### SEO

| Field | Type | Default | Description |
|---|---|---|---|
| `seoTitle` | string | value of `title` | Overrides the `<title>` tag without changing the visible page title. |
| `seoDescription` | string | — | Meta description shown in search results. |
| `seoKeywords` | string | — | Comma-separated keywords. |
| `seoAuthor` | string | `site.seo.defaultAuthor` | Overrides the author meta tag for this page. |
| `seoCopyright` | string | `site.seo.defaultCopyright` | Overrides the copyright meta tag. |
| `seoCanonicalUrl` | string | — | Explicit canonical URL. Set when the same content is accessible at multiple URLs. |
| `robotsNoIndex` | boolean | `false` | Adds `<meta name="robots" content="noindex">`. |
| `robotsNoFollow` | boolean | `false` | Adds `<meta name="robots" content="nofollow">`. |

### Social image (per-page override)

Overrides the site-wide default social image (`site.seo.defaultImage`) for this page only.

```yaml
seoImage:
  src: /_media/my-page-og.jpg
  alt: Description of the image
  width: "1200"
  height: "630"
  type: image/jpeg
```

### Twitter / X

| Field | Type | Default | Description |
|---|---|---|---|
| `seoTwitterCardType` | string | `summary_large_image` | Twitter card type. Values: `summary_large_image`, `summary`. |
| `seoTwitterCreatorHandle` | string | `site.seo.defaultTwitterCreatorHandle` | Twitter handle of the content author, without `@`. |

### Navigation

| Field | Type | Default | Description |
|---|---|---|---|
| `topNavigation` | boolean | `false` | Marks the page as a menu page in the CMS editor. Has **no effect on the build by itself** — the menu is built from `tags: [menu]`. |
| `tags` | array | `[]` | Must include `menu` for the page to appear in the top navigation, `footer` for the footer navigation. |
| `navigation.key` | string | — | Unique key for this page in the navigation tree. Used as `parent` reference by child pages. |
| `navigation.title` | string | value of `title` | Navigation label. Overrides the page title in menus. |
| `navigation.parent` | string | — | `key` of the parent page. Creates a nested navigation item. |
| `navigation.order` | number | `0` | Sort order within the same navigation level. Lower numbers appear first. |
| `eleventyNavigation.key` | string | — | Same as `navigation.key` — required by the Eleventy Navigation plugin. |
| `eleventyNavigation.title` | string | — | Same as `navigation.title`. |
| `eleventyNavigation.parent` | string | — | Same as `navigation.parent`. |
| `eleventyNavigation.order` | number | `0` | Same as `navigation.order`. |

The header menu is built from all pages tagged `menu` whose `pageLanguage` equals the current page's language, arranged by `eleventyNavigation`. To show a page in the top navigation, set:

1. `tags: [menu]` — puts the page into the menu collection
2. `eleventyNavigation` with at least `key` — pages without a key are skipped
3. `pageLanguage` — must match the language the menu is rendered for
4. `topNavigation: true` and a `navigation` block with the **same values** as `eleventyNavigation` — the CMS editor reads and writes these; keep them mirrored so the CMS does not drop the `menu` tag on the next save

The menu renders **two levels**: top-level entries and their direct children (dropdown). Deeper `parent` chains are not displayed.

```yaml
topNavigation: true
tags: [menu]
navigation:
  key: services
  title: Services
  order: 2
eleventyNavigation:
  key: services
  title: Services
  order: 2
```

For nested navigation (dropdown), set `parent` to the `key` of the parent page:

```yaml
topNavigation: true
tags: [menu]
navigation:
  key: web-design
  title: Web Design
  parent: services
  order: 1
eleventyNavigation:
  key: web-design
  title: Web Design
  parent: services
  order: 1
```

## Layouts

The `layout` field controls which column structure is used and which placeholders are available for components.

| Layout | Columns | Available placeholders |
|---|---|---|
| `content_1col.njk` | 1 | `Placeholder_Hero`, `Placeholder_Main` |
| `content_2col_main_left.njk` | 2 (main left, aside right) | `Placeholder_Hero`, `Placeholder_Main`, `Placeholder_Aside_1` |
| `content_2col_main_right.njk` | 2 (aside left, main right) | `Placeholder_Hero`, `Placeholder_Main`, `Placeholder_Aside_1` |
| `content_3col_main_center.njk` | 3 (aside, main, aside) | `Placeholder_Hero`, `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2` |
| `base.njk` | 1 | none — renders the Markdown body (see [Markdown body](#markdown-body)) |

A placeholder that the chosen layout does not list is silently not rendered.

## Placeholders and components in front matter

Components are placed inside named placeholders directly in the front matter. Each placeholder holds a list of component blocks. Each block has a `componentType` that identifies the component and an `id` that must be unique within the page.

```yaml
---
layout: content_2col_main_left.njk
title: Homepage
pageLanguage: de
templateEngineOverride: njk,md

Placeholder_Hero:
  - componentType: Hero
    id: hero-main
    title: Welcome to Our Site
    text: "<p>We build great things.</p>"
    image:
      src: /_media/hero.jpg
      alt: Team at work
      originalId: hero-main

Placeholder_Main:
  - componentType: TextMedia
    id: intro-block
    title: What we do
    text: We design and build digital products.
    imagePosition: right
    image:
      src: /_media/what-we-do.jpg
      alt: Design process
      originalId: what-we-do
  - componentType: Cards
    id: services-cards
    headline: Our Services
    columns: 3
    cards:
      - headline: Web Design
        body: Beautiful, accessible websites.
        link: /services/web/
        linkText: Learn more
      - headline: Development
        body: Robust front-end and back-end.
        link: /services/dev/
        linkText: Learn more

Placeholder_Aside_1:
  - componentType: Banner
    id: cta-sidebar
    link: /contact/
    image:
      src: /_media/sidebar-banner.jpg
      alt: Get in touch
      originalId: sidebar-banner
---

The Markdown body is rendered as free text — it does not interact with placeholder components.
```

> **Note:** Set `templateEngineOverride: njk,md` on every page (convention). Placeholders render without it, but the Markdown body would be processed with Liquid instead of Nunjucks.

> **Note:** The `id` field on every component block must be unique per page. The `originalId` on images is used as the base filename for responsive image variants generated by the build — set it on every image and keep it unique per image file. Image `src` must be a local file with a leading `/` (project first, then the marbas-site package); remote URLs are not processed.

## Language variants

Pages of the default language live at the root of `pages/`. Every other language gets its **own folder** named after the language code, mirroring the default-language structure:

```
pages/about.md            → /about/          (default language, e.g. German)
pages/en/about.md         → /en/about/       (English variant)
pages/en/services/web.md  → /en/services/web/
```

Set `pageLanguage` in each file to the code of its folder (root files: the default language):

```yaml
# pages/en/about.md
---
title: About us
pageLanguage: en
---
```

> A language suffix in the file name (`about.en.md`) is **not** a language variant — it is published as `/about.en/`.

The available languages are configured in `pages/_data/site.json` under `locale` (see [Global Site Data → `locale`](site-data.md#locale)):

```json
"locale": {
  "defaultLanguage": "de",
  "languages": [
    { "code": "de", "label": "Deutsch" },
    { "code": "en", "label": "English" }
  ]
}
```

Navigation keys are per language: each language variant needs its own `navigation`/`eleventyNavigation` block, and `parent` refers to a key in the same language. Links in components (`/contact/`) automatically get the language prefix (`/en/contact/`) on non-default-language pages.

## Markdown body

The Markdown body below the front matter is free-form content. It is rendered **only with `layout: base.njk`** (header, footer and the page title as `<h1>`, no placeholders). The `content_*` layouts render placeholders only and ignore the body. Use it for simple text pages (legal notices, error pages) that do not need the component system — or use a `TextMedia` block with `imagePosition: none` in a `content_*` layout instead.

```markdown
---
title: Privacy Policy
layout: base.njk
pageLanguage: de
templateEngineOverride: njk,md
---

## Data we collect

We collect the minimum necessary data to operate this service…
```

## Complete example

`pages/about.md` of a site whose default language is English (`locale.defaultLanguage: en`):

```yaml
---
layout: content_2col_main_left.njk
title: About Us
seoTitle: About Our Team — Acme Corp
seoDescription: Learn about the people behind Acme Corp and our mission.
pageLanguage: en
templateEngineOverride: njk,md
topNavigation: true
tags:
  - menu
navigation:
  key: about
  title: About
  order: 3
eleventyNavigation:
  key: about
  title: About
  order: 3
robotsNoIndex: false
Placeholder_Hero:
  - componentType: Hero
    id: about-hero
    title: Meet the team
    text: "<p>We are a small team with big ambitions.</p>"
    image:
      src: /_media/team.jpg
      alt: The Acme team in the office
      originalId: team
Placeholder_Main:
  - componentType: TextMedia
    id: mission
    title: Our mission
    text: We believe in open, accessible web experiences for everyone.
    imagePosition: left
    image:
      src: /_media/mission.jpg
      alt: Team whiteboarding
      originalId: mission
Placeholder_Aside_1:
  - componentType: Banner
    id: contact-cta
    link: /contact/
    image:
      src: /_media/contact-banner.jpg
      alt: Contact us
      originalId: contact-banner
---
```
