# Global Site Data

All site-wide settings live in a single file: `pages/_data/site.json`. Eleventy treats it as global data, so every template and component receives it as the `site` variable.

## File location

```
my-project/
└── pages/
    └── _data/
        └── site.json
```

---

## Where site data is available

`site` (and every other file in `pages/_data/`) is available in **layouts, the header and the footer** — for example the footer preset reads `site.footer.contact`, the header reads `site.logo`. If you eject a layout or a header/footer slot, you can use it there:

```nunjucks
{# e.g. in an ejected _includes/footer/slots/contact.njk #}
<p>{{ site.footer.contact.phone }}</p>
<a href="mailto:{{ site.footer.contact.email }}">{{ site.footer.contact.email }}</a>
```

**Components do not receive `site`** or other global data — they are purely data-driven and render only from their own block fields (`data`). Pass contact details or other site-wide values into the block instead. See [Custom Components → Available variables](custom-components.md#available-variables).

### Additional global data files

`site.json` is not the only global data source. Any JSON file placed in `pages/_data/` becomes a global variable in layouts and partials under the file's base name:

```
pages/_data/site.json    →  site
pages/_data/team.json    →  team
pages/_data/pricing.json →  pricing
```

See the [Eleventy global data documentation](https://www.11ty.dev/docs/data-global/) for the full spec, including JavaScript data files and computed data.

---

## Top-level fields

| Field | Type | Default | Description |
|---|---|---|---|
| `title` | string | project folder name | Site name. Appears in the browser tab title, header brand area, and footer. |
| `cssMode` | string | `"marbas"` | CSS strategy. `"marbas"` uses the built-in base + theme CSS. `"external"` disables all Marbas CSS so you can bring your own framework. See [Themes](themes.md). |

---

## Navigation

The header navigation is **driven by page front matter**, not by a list in `site.json`. A page appears in the top navigation when it is tagged `menu`, has an `eleventyNavigation.key` and its `pageLanguage` matches the language being rendered. `topNavigation` and `navigation` are the CMS editor's mirror of the same data — keep them in sync:

```yaml
---
title: About Us
pageLanguage: en
topNavigation: true
tags: [menu]
navigation:
  key: about
  title: About        # label shown in the nav (defaults to title)
  order: 2            # sort position — lower numbers appear first
eleventyNavigation:
  key: about
  title: About
  order: 2
---
```

For nested navigation (dropdown), add `parent` with the `key` of the parent page to **both** blocks. The menu shows two levels (entries and their direct children):

```yaml
---
title: Web Design
pageLanguage: en
topNavigation: true
tags: [menu]
navigation:
  key: services-design
  parent: services    # key of the parent page
  order: 1
eleventyNavigation:
  key: services-design
  parent: services
  order: 1
---
```

Pages tagged `footer` form the footer navigation (same language rule).

See [Pages & Frontmatter](pages.md#navigation) for the full navigation field reference.

---

## `locale`

Enables multi-language support. When defined, the build pipeline activates language-aware URL routing and a language switcher in the header.

| Field | Type | Default | Description |
|---|---|---|---|
| `locale.defaultLanguage` | string | `"de"` | BCP 47 code of the default language. Pages in this language are served at the root path (e.g. `/about/`). |
| `locale.languages` | array | `[{ code: "de", label: "Deutsch" }]` | List of all supported languages. Each entry needs a `code` (BCP 47) and a `label` (display name). |

```json
"locale": {
  "defaultLanguage": "en",
  "languages": [
    { "code": "en", "label": "English" },
    { "code": "de", "label": "Deutsch" },
    { "code": "fr", "label": "Français" }
  ]
}
```

With this config:
- `pages/about.md` → `/about/` (default language, English)
- `pages/de/about.md` → `/de/about/`
- `pages/fr/about.md` → `/fr/about/`

Language variants are **folders**, not file-name suffixes — `about.de.md` would be published as `/about.de/`.

Set `pageLanguage` in each page's front matter to match its language code. See [Pages & Frontmatter — Language variants](pages.md#language-variants).

---

## Favicons

Files in `<project>/_assets/favicons/` are copied to the root of the built site. New projects get a
neutral `favicon.ico` and `apple-touch-icon.png` (referenced by the base layout) — replace them with
your own files under the same names.

---

## Localized values

On multi-language sites, texts and links in `site.json` can be given per language. Use an object
with language codes instead of a plain string — a plain string still applies to all languages:

```json
"actions": [
  { "label": { "de": "Termin buchen", "en": "Book appointment" },
    "href":  { "de": "/kontakt/",     "en": "/en/contact/" } }
],
"copyright": { "de": "© 2026 Praxis Muster", "en": "© 2026 Muster Practice" }
```

The value for the page language is used (then its primary language, then `locale.defaultLanguage`,
then the first entry). Supported for: `title`, `header.announcement` (text, label, href),
`header.actions`, `header.utilityLinks`, `header.tagline`, `header.navLinks` (label, href, ariaLabel),
`footer.companyName`, `footer.intro`, `footer.copyright`, `footer.bottomNote`,
`footer.groups` (title, links, text), `footer.bottomLinks`, `footer.ctaBlock`, `footer.socialLinks`
(label, ariaLabel, href), `seo.siteName`, `seo.defaultCopyright`, `seo.defaultImage.alt`.
Links are not prefixed automatically — give per-language `href`s where the targets differ.

> The Marbas CMS site-settings form does not support localized values yet (it would overwrite them) —
> edit these values in `site.json` directly until it does.

Built-in interface texts (skip link, navigation and screen-reader labels) follow the page language
(German for `de`, English otherwise). Footer groups and bottom links with `source: "tagCollection"`
list only pages of the current language.

---

## `logo`

Controls the logo displayed in the header.

| Field | Type | Default | Description |
|---|---|---|---|
| `show` | boolean | `true` | Whether to show the logo image. |
| `path` | string | `/_assets/images/Logo.svg` | Path to the logo file, relative to the built output root. The default is a neutral placeholder shipped with marbas-site (also available as `Logo.png`). Put your own logo in the project's `_assets/images/` (copied as is) — not `_media/` (only images used by components are processed and published from there). Before 0.20 do not name it `logo.svg`/`logo.png`: on case-insensitive file systems (macOS, Windows) the placeholder `Logo.svg` overwrote it; since 0.20 project images always win. |
| `pathDark` | string | — | Optional logo for the dark scheme (since 0.18, needs `theme.scheme` `dark`/`auto` and a v2 theme). The header then renders both images and shows the matching one (system setting and switch); the second image is hidden from screen readers. |

```json
"logo": {
  "show": true,
  "path": "/_assets/images/firma-logo.svg",
  "pathDark": "/_assets/images/firma-logo-dunkel.svg"
}
```

---

## `header`

| Field | Type | Default | Description |
|---|---|---|---|
| `preset` | string | `"brand-nav"` | Layout preset. See [Header presets](#header-presets). |
| `variant` | string | `"default"` | Visual style variant: `"default"`, `"compact"`, `"accent"`, `"line"`, `"glass"`. **classic themes only** — forms (Base v2) design the header themselves; `doctor` warns when a form project sets one. |
| `showCompanyName` | boolean | `true` | Display the site title next to the logo. |
| `navigationVariant` | string | `"default"` | Nav item style: `"default"`, `"compact"`, `"pill"`, `"underline"`. **classic themes only** (no effect in forms). |
| `sticky` | boolean | `false` | Fix the header to the top of the viewport while scrolling. |
| `tagline` | string | — | Optional second line under the company name (e.g. "Internistische Rheumatologie · Berlin"). Shown when `showCompanyName` is on. |
| `schemeToggle` | boolean | `false` | Light/dark icon button in the header (also visible on mobile). Only with `theme.scheme.mode: "auto"` (0.17), see [Dark mode](themes.md#dark-mode-themescheme-since-017). |
| `navLinks` | array | — | Optional extra menu entries after the page menu — see [`header.navLinks`](#headernavlinks). |

### `header.navLinks`

The page menu comes from front matter (see above). `navLinks` adds entries that are not pages:
anchors on a one-pager, an external portal, a highlighted emergency link. Up to six.

| Field | Type | Description |
|---|---|---|
| `label` | string | Menu text (entries without label or href are skipped) |
| `href` | string | Target as written: `#kontakt`, `/#kontakt`, `https://…` (no language prefix is added) |
| `tone` | string | `"alert"` = warning colour with ↗ (e.g. "Akute Beschwerden"); otherwise omit |
| `external` | boolean | Open in a new tab (`target="_blank" rel="noopener noreferrer"`) |
| `ariaLabel` | string | Optional accessible name |

```json
"navLinks": [
  { "label": "Kontakt & Zeiten", "href": "#kontakt" },
  { "label": "Akute Beschwerden", "href": "#akut", "tone": "alert" }
]
```

### `header.announcement`

A dismissible announcement bar above the header.

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `false` | Show the announcement bar. |
| `id` | string | `""` | Unique ID used to remember dismissal in `localStorage`. |
| `text` | string | `""` | Announcement message. |
| `label` | string | `""` | Link label (optional). |
| `href` | string | `""` | Link URL (optional). |

### `header.utilityLinks`

A small link row rendered in the `utility-brand-nav` preset above the main header.

```json
"utilityLinks": {
  "source": "manual",
  "links": [
    { "label": "Login", "href": "/login/" },
    { "label": "Register", "href": "/register/" }
  ]
}
```

Set `source` to `"tagCollection"` to auto-populate from Eleventy tag collections:

```json
"utilityLinks": {
  "source": "tagCollection",
  "tags": ["utility"],
  "limit": 5
}
```

### `header.actions`

Up to two call-to-action buttons shown on the right side of the header (only in `brand-nav-actions` and `utility-brand-nav` presets).

| Field | Type | Description |
|---|---|---|
| `label` | string | Button label |
| `href` | string | Link URL |
| `style` | string | Button style: `"primary"`, `"secondary"`, `"outline"` |

```json
"actions": [
  { "label": "Get started", "href": "/contact/", "style": "primary" },
  { "label": "Documentation", "href": "/docs/", "style": "outline" }
]
```

### `header.mobile`

| Field | Type | Default | Description |
|---|---|---|---|
| `showActionsInDrawer` | boolean | `true` | Presets `brand-nav-actions` and `utility-brand-nav`: on phones (< 768 px) the `header.actions` buttons leave the header row and appear at the end of the menu panel (the header stays one row: brand · menu button). `false` keeps them in the header row (it may wrap). Desktop is unaffected (since 0.19; `utility-brand-nav` since 0.23.1). |
| `drawer` | boolean | `true` | No effect (legacy; the menu panel is always used on phones). |
| `showUtilityLinksInDrawer` | boolean | `true` | No effect (legacy). |

---

## Header presets

The app shows the presets as **"Elements of the header"** with the names in the second column (the values in `site.json` stay as written here).

| Preset | App name (de) | Description |
|---|---|---|
| `brand-nav` | Logo + Menü | Logo + company name on the left, navigation on the right. The standard layout for most sites. |
| `brand-nav-actions` | Logo + Menü + Buttons | Like `brand-nav` with up to two CTA buttons added to the right. |
| `centered-nav` | Zentriert | Logo centered above a horizontal navigation bar — common for editorial and portfolio sites. |
| `utility-brand-nav` | Mit Leiste oben | A slim utility link bar above the main header. Main header shows logo, name, navigation, and actions. |

---

## `footer`

| Field | Type | Default | Description |
|---|---|---|---|
| `preset` | string | `"simple"` | Layout preset. See [Footer presets](#footer-presets). |
| `variant` | string | `"default"` | Visual style: `"default"`, `"compact"`, `"accent"`, `"contrast"`. **classic themes only** — in a form `contrast` can turn the footer dark without the form having designed it; `doctor` warns. |
| `companyName` | string | value of `title` | Company name shown in the footer. |
| `copyright` | string | `"© <year> <title>"` | Copyright line at the bottom of the footer. |
| `intro` | string | `""` | Short intro text below the company name (used in `editorial` preset). |
| `bottomNote` | string | — | Optional short note on the right of the bottom bar (e.g. "Rechtliche Pflichtangaben ergänzen"). HTML allowed. |
| `schemeToggle` | boolean | `true` | „Hell · Dunkel · System“ in the bottom bar. Only with `theme.scheme.mode: "auto"` (0.17); `false` hides it. |

### `footer.contact`

| Field | Type | Description |
|---|---|---|
| `phone` | string | Phone number |
| `email` | string | Email address |
| `address.street` | string | Street and number |
| `address.zip` | string | Postal code |
| `address.city` | string | City |
| `address.country` | string | Country |

### `footer.groups`

Up to four link groups, each with a title and a list of links. Used in the `columns` and related presets.

```json
"groups": [
  {
    "title": "Services",
    "source": "manual",
    "links": [
      { "label": "Web Design", "href": "/services/design/" },
      { "label": "Development", "href": "/services/dev/" }
    ]
  }
]
```

Groups also support `"source": "tagCollection"` to auto-populate from Eleventy tag collections (same syntax as `utilityLinks`).

A column with **text instead of links** uses `"source": "text"` (short HTML, localizable):

```json
{ "title": "Für Fachkreise", "source": "text", "text": "<p>Informationen für zuweisende Ärzt:innen folgen.</p>" }
```

### `footer.socialLinks`

Up to eight social media links. The `platform` value is used to render the matching icon.

| Field | Type | Description |
|---|---|---|
| `platform` | string | Platform key with a built-in icon: `"x"` (alias `"twitter"`), `"instagram"`, `"linkedin"`, `"github"`, `"facebook"`, `"youtube"`, `"tiktok"`, `"xing"`. Other values get a neutral link icon. |
| `label` | string | Accessible label |
| `href` | string | Profile URL |
| `ariaLabel` | string | Screen-reader label (optional, falls back to `label`) |

### `footer.ctaBlock`

An optional call-to-action panel inside the footer (used in `columns-cta` and `editorial` presets).

| Field | Type | Description |
|---|---|---|
| `enabled` | boolean | Show the CTA block |
| `title` | string | CTA heading |
| `text` | string | CTA body text |
| `label` | string | Button label |
| `href` | string | Button URL |

### `footer.bottomLinks`

Links in the thin bar at the very bottom of the footer (imprint, privacy, etc.).

```json
"bottomLinks": {
  "source": "manual",
  "links": [
    { "label": "Imprint", "href": "/imprint/" },
    { "label": "Privacy", "href": "/privacy/" }
  ]
}
```

---

## Footer presets

The app shows the presets as **"Elements of the footer"** with the names in the second column.

| Preset | App name (de) | Description |
|---|---|---|
| `simple` | Einzeilig | Company name/intro and contact details in one row, plus bottom links. |
| `columns` | Spalten | Brand column (company name, intro, contact) next to the link groups. |
| `columns-social` | Spalten + Social | Like `columns` with social icons in the brand column. |
| `columns-cta` | Spalten + Aktionsfläche | Like `columns` with a CTA panel above the columns. |
| `editorial` | Redaktionell | Rich layout: intro, social icons, contact, link groups and a full bottom bar. |

Which `footer` data each preset shows:

| Preset | intro | contact | groups | socialLinks | ctaBlock | bottomLinks |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `simple` | ✓ | ✓ | – | – | – | ✓ |
| `columns` | ✓ | ✓ | ✓ | – | – | ✓ |
| `columns-social` | ✓ | ✓ | ✓ | ✓ | – | ✓ |
| `columns-cta` | ✓ | ✓ | ✓ | – | ✓ | ✓ |
| `editorial` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Phone numbers are shown as written; the `tel:` link keeps only `+` and digits (`030 / 4737 8115` →
`tel:03047378115`, `+49 (0)30 …` → `tel:+4930…`).

---

## `seo`

Site-wide SEO defaults. Every field can be overridden per page in the page's front matter.

| Field | Type | Default | Description |
|---|---|---|---|
| `siteName` | string | `""` | Appended to page titles in `<title>` tags: `"Page Title — Site Name"`. |
| `defaultAuthor` | string | `""` | Author meta tag value. |
| `defaultCopyright` | string | `""` | Copyright meta tag value. |
| `twitterSiteHandle` | string | `""` | Twitter/X site handle (without `@`) for `twitter:site`. |
| `defaultTwitterCreatorHandle` | string | `""` | Default `twitter:creator` handle. |

### `seo.defaultImage`

Default social sharing image used when a page does not define its own `seoImage`.

| Field | Type | Description |
|---|---|---|
| `src` | string | Image path |
| `alt` | string | Image alt text |
| `width` | string | Image width in px (as string) |
| `height` | string | Image height in px (as string) |
| `type` | string | MIME type, e.g. `"image/jpeg"` |

---

## Complete example

```json
{
  "title": "Acme Corp",
  "cssMode": "marbas",

  "logo": {
    "show": true,
    "path": "/_assets/images/firma-logo.svg"
  },

  "header": {
    "preset": "brand-nav-actions",
    "variant": "default",
    "showCompanyName": true,
    "navigationVariant": "default",
    "sticky": false,
    "announcement": {
      "enabled": true,
      "id": "summer-sale-2025",
      "text": "Summer sale — up to 40% off selected plans.",
      "label": "View offers",
      "href": "/sale/"
    },
    "actions": [
      { "label": "Get started", "href": "/contact/", "style": "primary" }
    ],
    "mobile": {
      "drawer": true,
      "showActionsInDrawer": true
    }
  },

  "footer": {
    "preset": "columns-social",
    "variant": "default",
    "companyName": "Acme Corp",
    "copyright": "© 2025 Acme Corp",
    "groups": [
      {
        "title": "Company",
        "source": "manual",
        "links": [
          { "label": "About", "href": "/about/" },
          { "label": "Blog", "href": "/blog/" },
          { "label": "Careers", "href": "/careers/" }
        ]
      },
      {
        "title": "Services",
        "source": "manual",
        "links": [
          { "label": "Web Design", "href": "/services/design/" },
          { "label": "Development", "href": "/services/dev/" }
        ]
      }
    ],
    "contact": {
      "phone": "+49 30 1234567",
      "email": "hello@acme.example",
      "address": {
        "street": "Musterstraße 42",
        "zip": "10115",
        "city": "Berlin",
        "country": "Germany"
      }
    },
    "socialLinks": [
      { "platform": "linkedin", "label": "LinkedIn", "href": "https://linkedin.com/company/acme" },
      { "platform": "twitter", "label": "Twitter", "href": "https://twitter.com/acme" }
    ],
    "bottomLinks": {
      "source": "manual",
      "links": [
        { "label": "Imprint", "href": "/imprint/" },
        { "label": "Privacy", "href": "/privacy/" }
      ]
    }
  },

  "seo": {
    "siteName": "Acme Corp",
    "defaultAuthor": "Acme Corp Editorial Team",
    "twitterSiteHandle": "acme",
    "defaultImage": {
      "src": "/_media/og-default.jpg",
      "alt": "Acme Corp — Building the web",
      "width": "1200",
      "height": "630",
      "type": "image/jpeg"
    }
  },

  "locale": {
    "defaultLanguage": "en",
    "languages": [
      { "code": "en", "label": "English" },
      { "code": "de", "label": "Deutsch" }
    ]
  }
}
```

> **Navigation items** are not configured here. They come from page front matter — add `topNavigation: true` and a `navigation` block to any page you want to appear in the header. See [Pages & Frontmatter](pages.md#navigation).
