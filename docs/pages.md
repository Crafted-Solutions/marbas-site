# Pages

A Marbas page is a Markdown file inside the `pages/` folder of your project. The file name and folder path determine the URL; the YAML front matter controls layout, SEO, navigation, and content structure.

## File location and URLs

```
pages/index.md          → /
pages/about.md          → /about/
pages/services/web.md   → /services/web/
```

Folder nesting is unlimited. Every page is a standalone Markdown file — no routing config required.

## Front matter reference

All fields are optional unless marked **required**.

### Core

| Field | Type | Default | Description |
|---|---|---|---|
| `layout` | string | `content_1col.njk` | Page layout template. See [Layouts](#layouts). |
| `title` | string | — | Page title. Used in the `<title>` tag and navigation unless overridden. **Required** for meaningful output. |
| `pageLanguage` | string | `de` | BCP 47 language code for this page (`de`, `en`, `fr`, …). |
| `templateEngineOverride` | string | — | Must be set to `njk,md` on every page that uses components. Without this, Nunjucks shortcodes inside the layout will not execute. |
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
| `topNavigation` | boolean | `false` | Include this page in the top navigation bar. |
| `tags` | array | `[]` | Must include `menu` for the page to appear in the navigation. |
| `navigation.key` | string | — | Unique key for this page in the navigation tree. Used as `parent` reference by child pages. |
| `navigation.title` | string | value of `title` | Navigation label. Overrides the page title in menus. |
| `navigation.parent` | string | — | `key` of the parent page. Creates a nested navigation item. |
| `navigation.order` | number | `0` | Sort order within the same navigation level. Lower numbers appear first. |
| `eleventyNavigation.key` | string | — | Same as `navigation.key` — required by the Eleventy Navigation plugin. |
| `eleventyNavigation.title` | string | — | Same as `navigation.title`. |
| `eleventyNavigation.parent` | string | — | Same as `navigation.parent`. |
| `eleventyNavigation.order` | number | `0` | Same as `navigation.order`. |

To show a page in the top navigation, set **all three**: `topNavigation: true`, `tags: [menu]`, and `eleventyNavigation`. The `navigation` and `eleventyNavigation` blocks hold the same values — `navigation` is used by the CMS editor, `eleventyNavigation` by the Eleventy Navigation plugin at build time.

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

> **Note:** `templateEngineOverride: njk,md` is required on every page that uses components — without it, the component placeholders will not render.

> **Note:** The `id` field on every component block must be unique per page. The `originalId` on images is used as the base filename for responsive image variants generated by the build.

## Language variants

To provide a page in multiple languages, create one file per language using a language-code suffix:

```
pages/about.md       → /about/        (default language, e.g. German)
pages/about.en.md    → /en/about/     (English variant)
```

Set `pageLanguage` in each file to the corresponding BCP 47 code:

```yaml
# about.en.md
---
title: About us
pageLanguage: en
---
```

The available languages are configured in `pages/_data/site.json` under `i18n`.

## Markdown body

The Markdown body below the front matter is free-form content. It renders as plain HTML without any component wrappers. Use it for simple text pages (legal notices, error pages) that do not need the component system.

```markdown
---
title: Privacy Policy
layout: content_1col.njk
---

## Data we collect

We collect the minimum necessary data to operate this service…
```

## Complete example

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
