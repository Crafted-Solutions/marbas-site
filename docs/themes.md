# Themes

Marbas ships 6 forms (Base v2: `theme-editorial`, `theme-product`, `theme-bold`, `theme-warm`, `theme-minimal-luxe`, `theme-druckwerk`) and 18 classic themes, which are **deprecated and removed in 0.50** ([switching from classic](#von-classic-umsteigen-switching-from-classic)). Every theme is a single CSS file that defines a palette, typography scale, border radii, shadows, and all component tokens through CSS custom properties. No JavaScript, no configuration beyond a single field (`theme.id`) in `marbas-project.json`.

---

## Activating a theme

### Via CLI (recommended)

```bash
marbas-site theme my-project theme-editorial
```

This writes `theme.id` to `marbas-project.json`, validates that the theme exists and — like the Marbas editor — applies the theme's recommended header, navigation and footer variants to `site.json` wherever they are still `default` (variants you set yourself are kept). Run `marbas-site build` afterwards to apply it. `marbas-site init --theme=<id>` does the same for a new project.

### Via marbas-project.json

Set `theme.id` in `marbas-project.json`:

```json
{
  "name": "my-project",
  "theme": {
    "id": "theme-bloom"
  }
}
```

The value must match the file name without the `.css` extension. The build pipeline resolves the file, copies it into the output as `_assets/css/theme.css`, and links it in the page `<head>`.

Projects without `theme.id` build without errors — no theme CSS is copied (backward-compatible). Use `marbas-site doctor` to detect unconfigured themes.

> **Variant defaults:** Each built-in theme ships with recommended header, navigation, and footer variant defaults (e.g. a glass header, pill nav style, accent footer). These are applied automatically when you first select a theme in the Marbas editor. You can override them at any time via `site.json` → `header.variant`, `header.navigationVariant`, and `footer.variant`.

---

## Switching themes

Run `marbas-site theme` again with a different theme ID — it overwrites the previous value in `marbas-project.json`:

```bash
marbas-site theme my-project theme-atlas
marbas-site build my-project --env=production
```

If you have an ejected version of the old theme in `_theme/`, it is not removed — only the `theme.id` pointer changes. The ejected file stays in place but is no longer picked up by the build unless the new theme ID matches its file name.

---

## Built-in themes

### Forms (Base v2)

A form fixes layout, typography and details; colours come from its palettes (`theme.palette`, `theme.colors`), dark mode from `theme.scheme`. See [Theme families and palettes](#theme-families-and-palettes-base-v2).

| ID | Name | Best suited for |
|---|---|---|
| `theme-editorial` | Editorial | Practices, law firms, consulting, culture — large grotesque type, hairlines instead of boxes, labels in the margin, text links with ↗. Palettes: default (graphite + ink blue), `warm`, `nacht`, `salbei` — see [Theme families and palettes](#theme-families-and-palettes-base-v2) |
| `theme-product` | Product | Software, platforms, marketplaces, apps — floating glass header, cards with soft shadows, pill labels, solid buttons, dark footer. Plus Jakarta Sans. Palettes: default (indigo on white), `nacht` (navy + gold), `petrol` |
| `theme-bold` | Bold | Brands, campaigns, products, events — huge condensed uppercase headings (Oswald), full colour fields with light text (`tone: soft`/`alert`), thick black rules, square uppercase buttons, black footer. Palettes: default (cobalt), `signal` (red), `wald` (deep green) |
| `theme-warm` | Warm | Crafts, food, farm shops, wellness — serif headings with italics (Source Serif 4 + Nunito Sans), cream paper with a fine grain, rounded tinted cards, organically cropped intro image, wavy band edges, pill buttons. Palettes: default (terracotta), `salbei` (herbs), `beere` (berry) |
| `theme-minimal-luxe` | Minimal-Luxe | Architecture, design, fashion, manufactories, hotels — strong reduction, hairlines, light serif in large sizes (Cormorant Garamond + Jost), centred section heads, full-bleed intro image, letter-spaced caps for labels/menu/links. Palettes: default (ivory + bronze), `noir`, `stein` |
| `theme-druckwerk` | Druckwerk | Culture, studios, cafés, bookshops, festivals — risograph look: two print colours on natural paper with grain, overprint bars behind headings, duotone intro image with misregistration offset, stamp labels in the margin, sticker cards, tape notes, label buttons (Jost, IBM Plex Sans/Mono). The duotone recolours every intro image. Palettes: default (pink + blue), `gruen-orange`, `gelb-violett` |

### classic themes (v1) — deprecated, removed in 0.50

The 18 classic themes still build, but they are **deprecated and will be removed with marbas-site 0.50**. Build and `doctor`
print a hint for projects that use one. New projects get a form (`init` without `--theme` uses `theme-editorial`).

| ID | Name | Was suited for | Switch to |
|---|---|---|---|
| `theme-atelier` | Atelier | Fashion, luxury retail, haute couture — extreme reduction, black/white with gold accent | Minimal-Luxe |
| `theme-atlas` | Atlas | B2B enterprise software, data platforms, ERP — IBM Carbon-inspired, precise, functional | Product |
| `theme-bloom` | Bloom | Wellness, beauty, spa — soft rose + sage, generous radii | Warm |
| `theme-campus` | Campus | Universities, research institutes, academic journals | Editorial |
| `theme-civic` | Civic | Government agencies, public institutions — USWDS-inspired, accessible, neutral | Editorial |
| `theme-fjord` | Fjord | Scandinavian SaaS products, engineering firms — minimal, cool blue-grey | Product |
| `theme-forum` | Forum | eLearning platforms, online courses — friendly violet, generous radii | Product |
| `theme-gazette` | Gazette | News portals, magazines, journalism — editorial, amber-brown, serif headlines | Editorial |
| `theme-klinik` | Klinik | Medical practices, clinics, telehealth — clinical, calming cyan-teal | Editorial |
| `theme-lumina` | Lumina | Hotels, travel booking, hospitality — warm amber-terracotta | Minimal-Luxe |
| `theme-maison` | Maison | Real estate, architecture, premium projects — warm neutrals, editorial serif | Minimal-Luxe |
| `theme-praxis` | Praxis | Law firms, tax advisory, professional services | Editorial |
| `theme-signal` | Signal | Developer tools, CLI products, API documentation | Product |
| `theme-slate` | Slate | SaaS products, tech marketing — clean slate-grey, modern blue | Product |
| `theme-studio` | Studio | Creative agencies, design studios, portfolios — maximum reduction, black on off-white | Editorial |
| `theme-tempo` | Tempo | Sports clubs, fitness brands — dark-first, high contrast, orange energy | Bold |
| `theme-terra` | Terra | Restaurants, farm-to-table, artisan food — earthy sienna tones | Warm |
| `theme-verdant` | Verdant | NGOs, environmental organisations, sustainability — forest green, organic | Warm |

### Von classic umsteigen (switching from classic)

1. **Pick the form** from the table above (or compare with `form-preview.mjs` from the marbas skills) and set `theme.id` in
   `marbas-project.json` — e.g. `marbas-site theme my-project theme-product`.
2. **Colours:** carry the brand colours over with `theme.colors` (`paper`, `ink`, `accent` …, see [palettes](#theme-families-and-palettes-base-v2));
   build and `doctor` check the contrast.
3. **Header/footer variants** (`header.variant`, `header.navigationVariant`, `footer.variant`) have no meaning for forms — remove
   them from `site.json`. Header/footer presets (`header.preset`, `footer.preset`) and all content stay.
4. **Pages:** classic components (Hero, TextMedia, Cards …) keep working in a form, but do not take on its look. Rebuild the pages
   with the Base v2 blocks (Intro, Split, LinkList, Notice, Contact) — the marbas skills do that with **marbas-build** in extension mode.

---

## Theme resolution

The build pipeline resolves a theme file in this order:

1. **Project override** — `<project>/_theme/<theme-id>.css` (ejected or custom theme)
2. **Library built-in** — `marbas-site/themes/<theme-id>.css`
3. **Error** — if neither exists the build fails with a clear message

This means you can customise any built-in theme without touching the library.

---

## Ejecting a built-in theme

Ejecting copies the library's CSS file into your project so you can edit it freely:

```bash
marbas-site eject my-project _theme/theme-bloom.css
```

The file is written to `my-project/_theme/theme-bloom.css`. From that point on, the project's copy is used instead of the library version. You can safely rename CSS custom properties, swap colour values, change fonts — the build will pick up the project file automatically.

To undo an ejection and restore the library version:

```bash
marbas-site reset my-project _theme/theme-bloom.css
```

The customised file is moved to `.marbas/trash/<timestamp>/` before being removed.

---

## Creating a theme from scratch

Create `_theme/theme-<name>.css` in your project root. The file must define all required CSS custom properties inside `:root { … }`.

```css
/* _theme/theme-acme.css */
:root {
  --t-font-sans: 'Inter', system-ui, sans-serif;
  --t-font-mono: ui-monospace, monospace;

  --t-bg:      #ffffff;
  --t-surface: #f5f5f5;
  --t-text:    #111111;
  --t-muted:   #555555;
  --t-border:  #e0e0e0;
  --t-accent:  #0055ff;

  --t-radius-sm: 0.25rem;
  --t-radius-md: 0.5rem;
  --t-radius-lg: 1rem;

  --t-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --t-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);

  /* Invert palette (used for dark/zebra blocks) */
  --t-surface-invert: #111111;
  --t-text-invert:    #ffffff;
  --t-muted-invert:   #aaaaaa;
  --t-border-invert:  #333333;
  --t-accent-invert:  #88aaff;
}
```

Activate it by setting `"theme": { "id": "theme-acme" }` in `marbas-project.json` (or run `marbas-site theme <project> theme-acme`). A `theme` block in `site.json` is ignored.

### Web fonts

Marbas does not load fonts from a CDN. Ship the files with the project and declare them in the theme:

```css
/* _theme/theme-acme.css — files in <project>/_assets/fonts/inter/ */
@font-face {
  font-family: 'Inter';
  src: url('/_assets/fonts/inter/inter-latin-wght-normal.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
```

The theme is served as `/_assets/css/theme.css`, so absolute `/_assets/fonts/…` URLs work in every
page. Without `@font-face` the browser falls back to the next font in the stack (usually the system
font). Avoid `@import` from Google Fonts — it transfers visitor IP addresses to Google (GDPR).

The **built-in themes ship their fonts** (self-hosted woff2, SIL Open Font License, see
`THIRD_PARTY_NOTICES.md`). A build copies only the fonts of the selected theme to
`_assets/fonts/`; a file with the same path in your project's `_assets/fonts/` takes precedence.

---

## Theme families and palettes (Base v2)

Themes belong to one of two families:

| Family | Look | Colours |
|---|---|---|
| `classic` | the boxed look of all themes up to 0.14 — unchanged | set in the theme file |
| `v2` | full-width bands, section frame (label rail, tone), display typography, text links | **palette** of 8 named colours |

A theme is `v2` when its CSS declares `@family v2` in a comment; everything else is `classic`. The page gets
`<body class="c-page c-page--v2">` (or `--classic`), and all Base v2 rules are scoped to it — classic sites are not affected.

**Theme = form, palette = colours.** A v2 theme defines the form (typography, spacing, lines, section frame, links) and
ships its **default palette** plus optional **presets**:

```css
/* theme-editorial.css — @family v2 */
:root { --p-paper: #f7f7f4; --p-ink: #1d2127; --p-muted: #555c66; --p-line: #d8dbe0;
        --p-accent: #27418c; --p-accent-soft: #e7ebf5; --p-alert: #9a2b2b; --p-alert-soft: #f7eceb; }
:root[data-palette="nacht"] { --p-paper: #12172a; --p-ink: #ecebe4; /* … */ --p-surface: #1a2038; }
```

`--p-surface` is optional (background of the `tone: white` band, default `#fff`). **Dark palettes must set it** —
otherwise light text sits on a white band; the contrast check reports this as "Text auf weißem Band (surface)".

`init --theme=theme-editorial --starter` creates starter pages built from the Base v2 building blocks (Intro, Notice,
LinkList, Split, Contact); without `--theme` new projects stay classic.

All colour tokens (`--t-*`) are derived from the palette. A project overrides colours only where it wants to, in
`marbas-project.json` — the theme file stays untouched:

```json
"theme": {
  "id": "theme-editorial",
  "palette": "nacht",
  "colors": { "accent": "#e0c070" }
}
```

- `palette` picks a preset of the theme (unknown names fall back to the default palette with a warning).
- `colors` overrides single values; allowed names: `paper`, `ink`, `muted`, `line`, `accent`, `accent-soft`, `alert`,
  `alert-soft`, `surface`; allowed values: `#rgb`, `#rrggbb` (with alpha) or `rgb(…)`. Anything else is rejected.
- The build and `marbas-site doctor` warn when a text/background pair of the resulting palette is below WCAG AA (4.5:1).
- `palette`/`colors` have no effect on classic themes (warning).

### Layout: the theme decides how the blocks are arranged

A v2 theme is **form = layout + typography + details**, not just colours. It declares the arrangement of the building
blocks in a comment next to `@family`:

```css
/* theme-editorial.css
   @family v2
   @layout rail=side intro=split linklist=rows split=columns notice=band cta=link */
```

| Key | Values (first = default) | Effect |
|---|---|---|
| `rail` | `top` · `side` | Section label as a line above the title · as a column on the left (editorial) |
| `intro` | `split` · `reverse` · `stacked` | Text left, image right · image left · text above, image full width below |
| `linklist` | `cards` · `rows` | Card grid · rows with hairlines (entry labels only where set, `items[].label`) |
| `split` | `columns` · `stacked` | Two columns · one below the other |
| `notice` | `box` · `band` | Tinted box · thin band between hairlines |
| `cta` | `button` · `link` | Buttons (also for the text links of the blocks) · text links with ↗ (also for `.c-btn`) |

Missing keys use the default; unknown keys or values are reported by the build and `doctor`. The resolved layout
becomes classes on `<body>` (`c-l-rail-side c-l-intro-split …`); the base CSS hangs the variants on them. Content does
not choose the layout — the theme does.

**Column layouts stay flexible.** The blocks are size containers: they adapt to the width of **their column**, not
the window. In `content_2col_*` / `content_3col_*` pages bands stay inside their column and a Split or Intro in a narrow
column stacks by itself; the column grid stays inside the page measure.

Base v2 building blocks use the section frame markup `<section class="c-v2 c-v2--{tone}">` with `tone` `paper`
(default), `soft`, `white` or `alert`, a `.c-v2__label` in the left rail and `.c-v2-link` for text links with an arrow.

### Dark mode (`theme.scheme`, since 0.17)

Every Base v2 form ships a dark palette and names it in its header comment (`@dark <preset>`): Editorial `nacht`,
Product `nacht`, Bold `nacht`, Warm `kakao`, Minimal-Luxe `noir`, Druckwerk `nachtdruck`. A project decides how to use it:

```json
"theme": {
  "id": "theme-product",
  "colors": { "accent": "#7a5e2e" },
  "scheme": { "mode": "auto", "dark": { "palette": "nacht", "colors": { "accent": "#d3af54" } } }
}
```

| `scheme.mode` | Result |
|---|---|
| `light` (default, also without `scheme`) | light only — output exactly as before, no switch, no script |
| `dark` | dark only — the dark palette is the page's palette, no switch |
| `auto` | follows the visitor's system setting; visitors can switch (footer, optionally header) |

- `scheme.dark.palette` — a preset of the theme (default: the theme's `@dark` preset); `scheme.dark.colors` — single values on
  top (the 9 palette names, like `theme.colors`). The dark block takes **all** custom properties of the preset (forms set their
  own variables there) and outranks `theme.colors`, so light brand colours never leak into the dark scheme.
- Without a usable dark palette (theme without `@dark`, no `dark.colors`) the build warns and stays light. classic themes ignore
  `scheme` (warning).
- Build and `doctor` check the dark palette for AA like the light one (reported as "Dunkel: …").
- Switch placement lives in `site.json`: `footer.schemeToggle` (default on with `auto`) and `header.schemeToggle` (default off) —
  see [Site data](site-data.md#header).
- **Privacy:** no cookies. Nothing is stored on page load; only a click on Light/Dark stores that one value in the browser's
  `localStorage` (`marbas-scheme`), "System" removes it. The value is never sent anywhere. This is strictly necessary for a function
  the visitor explicitly requested, so no consent banner is needed (assessment, not legal advice). Suggested sentence for the privacy
  policy: *„Wenn Sie die Darstellung (hell/dunkel) umschalten, speichert Ihr Browser diese Wahl lokal (localStorage), damit sie beim
  nächsten Seitenaufruf erhalten bleibt. Die Angabe wird nicht an uns übertragen und lässt sich über „System“ jederzeit löschen.“*
- With `auto`, a small inline script in `<head>` applies a stored choice before the first paint (no flash). Sites with a strict
  Content Security Policy need its hash in `script-src`.
- An ejected `_includes/base.njk` without `marbasTheme.scheme` disables dark mode (build warning).
- A logo that disappears on dark paper gets a second file: `site.json → logo.pathDark` (since 0.18, see [Site data](site-data.md#logo)).

## CSS custom properties reference

Every theme must provide the following tokens. Derived tokens (header, footer, navigation colours) can be expressed as `color-mix()` or direct values.

### Core palette

| Property | Description |
|---|---|
| `--t-font-sans` | Primary sans-serif font stack |
| `--t-font-mono` | Monospace font stack |
| `--t-bg` | Page background |
| `--t-surface` | Card / panel background |
| `--t-text` | Primary text colour |
| `--t-muted` | Secondary / subdued text |
| `--t-border` | Border colour |
| `--t-accent` | Primary accent / brand colour (links, primary button fill) |
| `--t-on-accent` | *Optional.* Text colour on accent-filled buttons (`.c-btn--primary`, header actions, footer CTA). Default `white`. Set a dark colour wherever the accent is light (dark mode, dark-first themes) — white on a light accent cannot reach 4.5:1 |
| `--t-radius-sm` | Small border radius |
| `--t-radius-md` | Medium border radius |
| `--t-radius-lg` | Large border radius |
| `--t-shadow-sm` | Subtle shadow |
| `--t-shadow-md` | Elevated shadow |

### Invert palette (dark blocks)

| Property | Description |
|---|---|
| `--t-surface-invert` | Background for inverted/dark sections |
| `--t-text-invert` | Text on inverted background |
| `--t-muted-invert` | Muted text on inverted background |
| `--t-border-invert` | Borders on inverted background |
| `--t-accent-invert` | Accent colour on inverted background |

Inside components, primary buttons are filled with `--cmp-link` and use `--cmp-on-link` for their
text (falls back to `--t-on-accent`, then `white`). The `.c-component--dark` mapping usually sets
`--cmp-link: var(--t-accent-invert)` — a light colour — so set `--cmp-on-link` there as well:

```css
@media (prefers-color-scheme: dark) {
  :root { --t-accent: #60a5fa; --t-on-accent: #0f172a; }
}
.c-component--dark { --cmp-link: var(--t-accent-invert); --cmp-on-link: var(--t-surface-invert); }
```

### Header tokens

| Property | Description |
|---|---|
| `--t-header-bg` | Header background |
| `--t-header-border` | Header bottom border |
| `--t-header-shadow` | Header shadow |
| `--t-header-brand-color` | Logo / brand text colour |
| `--t-header-brand-hover` | Brand text hover colour |
| `--t-header-brand-mark-bg` | Background of the logo mark area |
| `--t-header-brand-mark-radius` | Border radius of the logo mark area |

### Navigation tokens

| Property | Description |
|---|---|
| `--t-nav-item-color` | Navigation link colour |
| `--t-nav-item-hover-bg` | Hover background |
| `--t-nav-item-hover-color` | Hover text colour |
| `--t-nav-item-active-bg` | Active/current page background |
| `--t-nav-item-active-color` | Active/current page text colour |
| `--t-nav-toggle-bg` | Mobile hamburger button background |
| `--t-nav-toggle-border` | Mobile hamburger button border |
| `--t-nav-toggle-icon` | Mobile hamburger icon colour |
| `--t-nav-mobile-panel-bg` | Mobile drawer background |
| `--t-nav-mobile-border` | Mobile drawer border |
| `--t-nav-mobile-shadow` | Mobile drawer shadow |

### Utility bar tokens

| Property | Description |
|---|---|
| `--t-utility-bar-bg` | Utility bar background |
| `--t-utility-bar-border` | Utility bar border |
| `--t-utility-bar-color` | Utility bar text |
| `--t-utility-bar-link` | Utility bar link colour |
| `--t-utility-bar-link-hover` | Utility bar link hover colour |

### Announcement bar tokens

| Property | Description |
|---|---|
| `--t-announcement-bg` | Announcement bar background |
| `--t-announcement-color` | Announcement text colour |
| `--t-announcement-link` | Announcement link colour |
| `--t-announcement-dismiss-border` | Dismiss button border colour |

### Footer tokens

| Property | Description |
|---|---|
| `--t-footer-bg` | Footer background |
| `--t-footer-border` | Footer top border |
| `--t-footer-heading` | Footer section heading colour |
| `--t-footer-link` | Footer link colour |
| `--t-footer-link-hover` | Footer link hover colour |
| `--t-footer-bottom-link` | Bottom bar link colour |
| `--t-footer-bottom-link-hover` | Bottom bar link hover colour |
| `--t-footer-social-bg` | Social icon background |
| `--t-footer-social-color` | Social icon colour |
| `--t-footer-social-hover-bg` | Social icon hover background |
| `--t-footer-social-hover-color` | Social icon hover colour |

---

## External CSS mode (advanced)

Setting `cssMode: "external"` disables all Marbas CSS — no base stylesheet, no theme file. Use this when you want to bring your own CSS framework (Tailwind, Bootstrap, etc.).

```json
{
  "cssMode": "external"
}
```

In this mode:
- The `theme.id` field is ignored.
- No Marbas CSS is injected into the output.
- Layout structure (placeholders, column grid) still works via the Nunjucks templates.
- You are responsible for all visual styling.

> **Note:** `cssMode: "external"` is a power-user feature. The `marbas-site doctor` command will warn if component templates that rely on Marbas CSS classes are used without the base stylesheet present.
