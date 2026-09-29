# Themes

Marbas ships 21 ready-to-use themes (18 classic, 3 Base v2: `theme-editorial`, `theme-product`, `theme-bold`). Every theme is a single CSS file that defines a palette, typography scale, border radii, shadows, and all component tokens through CSS custom properties. No JavaScript, no configuration beyond a single field (`theme.id`) in `marbas-project.json`.

---

## Activating a theme

### Via CLI (recommended)

```bash
marbas-site theme my-project theme-bloom
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

| ID | Name | Best suited for |
|---|---|---|
| `theme-atelier` | Atelier | Fashion, luxury retail, haute couture — extreme reduction, black/white with gold accent |
| `theme-atlas` | Atlas | B2B enterprise software, data platforms, ERP — IBM Carbon-inspired, precise, functional |
| `theme-bold` | Bold | **Base v2.** Brands, campaigns, products, events — huge condensed uppercase headings (Oswald), full colour fields with light text (`tone: soft`/`alert`), thick black rules, square uppercase buttons, black footer. Palettes: default (cobalt), `signal` (red), `wald` (deep green) |
| `theme-bloom` | Bloom | Wellness, beauty, spa — soft rose + sage, generous radii |
| `theme-campus` | Campus | Universities, research institutes, academic journals |
| `theme-editorial` | Editorial | **Base v2.** Practices, law firms, consulting, culture — large grotesque type, hairlines instead of boxes, labels in the margin, text links with ↗. Palettes: default (graphite + ink blue), `warm`, `nacht`, `salbei` — see [Theme families and palettes](#theme-families-and-palettes-base-v2) |
| `theme-civic` | Civic | Government agencies, public institutions — USWDS-inspired, accessible, neutral |
| `theme-fjord` | Fjord | Scandinavian SaaS products, engineering firms — minimal, cool blue-grey |
| `theme-forum` | Forum | eLearning platforms, online courses — friendly violet, generous radii |
| `theme-gazette` | Gazette | News portals, magazines, journalism — editorial, amber-brown, serif headlines |
| `theme-klinik` | Klinik | Medical practices, clinics, telehealth — clinical, calming cyan-teal |
| `theme-lumina` | Lumina | Hotels, travel booking, hospitality — warm amber-terracotta |
| `theme-maison` | Maison | Real estate, architecture, premium projects — warm neutrals, editorial serif |
| `theme-product` | Product | **Base v2.** Software, platforms, marketplaces, apps — floating glass header, cards with soft shadows, pill labels, solid buttons, dark footer. Plus Jakarta Sans. Palettes: default (indigo on white), `nacht` (navy + gold), `petrol` |
| `theme-praxis` | Praxis | Law firms, tax advisory, professional services |
| `theme-signal` | Signal | Developer tools, CLI products, API documentation |
| `theme-slate` | Slate | SaaS products, tech marketing — clean slate-grey, modern blue |
| `theme-studio` | Studio | Creative agencies, design studios, portfolios — maximum reduction, black on off-white |
| `theme-tempo` | Tempo | Sports clubs, fitness brands — dark-first, high contrast, orange energy |
| `theme-terra` | Terra | Restaurants, farm-to-table, artisan food — earthy sienna tones |
| `theme-verdant` | Verdant | NGOs, environmental organisations, sustainability — forest green, organic |

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
| `linklist` | `cards` · `rows` | Card grid · numbered rows with hairlines |
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
