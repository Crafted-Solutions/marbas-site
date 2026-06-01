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

## Using site data in components

Every component template has access to the full `site` object. Use dot-notation to reach any nested field:

```nunjucks
{# Render contact details from site.json #}
<p>{{ site.title }}</p>
<p>{{ site.footer.contact.phone }}</p>
<a href="mailto:{{ site.footer.contact.email }}">{{ site.footer.contact.email }}</a>
```

This is useful for components that display brand information, contact details, or any other site-wide content without repeating it in every page's front matter.

### Additional global data files

`site.json` is not the only global data source. Any JSON file placed in `pages/_data/` becomes a global variable available in all templates under the file's base name:

```
pages/_data/site.json    →  site
pages/_data/team.json    →  team
pages/_data/pricing.json →  pricing
```

```nunjucks
{# TeamGrid.njk — data from pages/_data/team.json #}
{% for member in team %}
  <div class="c-team-card">
    <img src="{{ member.photo }}" alt="{{ member.name }}">
    <strong>{{ member.name }}</strong>
  </div>
{% endfor %}
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

The header navigation is **driven by page front matter**, not by a list in `site.json`. Any page with `topNavigation: true` in its front matter appears in the top navigation bar.

```yaml
---
title: About Us
topNavigation: true
navigation:
  key: about
  title: About        # label shown in the nav (defaults to title)
  order: 2            # sort position — lower numbers appear first
---
```

For nested navigation, use `parent` to reference the `key` of the parent page:

```yaml
---
title: Web Design
topNavigation: true
navigation:
  key: services-design
  parent: services    # key of the parent page
  order: 1
---
```

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
- `pages/about.de.md` → `/de/about/`
- `pages/about.fr.md` → `/fr/about/`

Set `pageLanguage` in each page's front matter to match its language code. See [Pages & Frontmatter — Language variants](pages.md#language-variants).

---

## `logo`

Controls the logo displayed in the header.

| Field | Type | Default | Description |
|---|---|---|---|
| `show` | boolean | `true` | Whether to show the logo image. |
| `path` | string | `/_assets/images/Logo.png` | Path to the logo file, relative to the built output root. |

```json
"logo": {
  "show": true,
  "path": "/_media/logo.svg"
}
```

---

## `header`

| Field | Type | Default | Description |
|---|---|---|---|
| `preset` | string | `"brand-nav"` | Layout preset. See [Header presets](#header-presets). |
| `variant` | string | `"default"` | Visual style variant: `"default"`, `"compact"`, `"accent"`, `"line"`, `"glass"`. |
| `showCompanyName` | boolean | `true` | Display the site title next to the logo. |
| `navigationVariant` | string | `"default"` | Nav item style: `"default"`, `"compact"`, `"pill"`, `"underline"`. |
| `sticky` | boolean | `false` | Fix the header to the top of the viewport while scrolling. |

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
| `drawer` | boolean | `true` | Use a slide-in drawer for mobile navigation. |
| `showUtilityLinksInDrawer` | boolean | `true` | Include utility links in the mobile drawer. |
| `showActionsInDrawer` | boolean | `true` | Include action buttons in the mobile drawer. |

---

## Header presets

| Preset | Description |
|---|---|
| `brand-nav` | Logo + company name on the left, navigation on the right. The standard layout for most sites. |
| `brand-nav-actions` | Like `brand-nav` with up to two CTA buttons added to the right. |
| `centered-nav` | Logo centered above a horizontal navigation bar — common for editorial and portfolio sites. |
| `utility-brand-nav` | A slim utility link bar above the main header. Main header shows logo, name, navigation, and actions. |

---

## `footer`

| Field | Type | Default | Description |
|---|---|---|---|
| `preset` | string | `"simple"` | Layout preset. See [Footer presets](#footer-presets). |
| `variant` | string | `"default"` | Visual style: `"default"`, `"compact"`, `"accent"`, `"contrast"`. |
| `companyName` | string | value of `title` | Company name shown in the footer. |
| `copyright` | string | `"© <year> <title>"` | Copyright line at the bottom of the footer. |
| `intro` | string | `""` | Short intro text below the company name (used in `editorial` preset). |

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

### `footer.socialLinks`

Up to eight social media links. The `platform` value is used to render the matching icon.

| Field | Type | Description |
|---|---|---|
| `platform` | string | Platform key, e.g. `"twitter"`, `"instagram"`, `"linkedin"`, `"github"`, `"facebook"`, `"youtube"`, `"tiktok"`, `"xing"` |
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

| Preset | Description |
|---|---|
| `simple` | Single row with company name, optional contact details, and bottom links. |
| `columns` | Multi-column layout: contact block on the left, link groups in the remaining columns. |
| `columns-social` | Like `columns` with a social icon row added. |
| `columns-cta` | Like `columns` with a CTA panel replacing one column. |
| `editorial` | Rich layout with intro text, link groups, CTA block, social icons, and a full bottom bar. |

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
    "path": "/_media/logo.svg"
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
