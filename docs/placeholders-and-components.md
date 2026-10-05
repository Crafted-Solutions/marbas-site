# Placeholders & Components

## What is a placeholder?

A placeholder is a named content slot within a page layout. Each layout defines which placeholders are available and where they appear on the page. You fill placeholders by listing component blocks in the page's front matter.

```yaml
Placeholder_Main:
  - componentType: Hero
    id: my-hero
    title: Hello
```

Every component block requires:
- `componentType` — the component name (case-sensitive)
- `id` — a unique identifier within the page

All other fields are component-specific (see below).

> **Convention:** Set `templateEngineOverride: njk,md` in the front matter of every page. Placeholders render without it (the layout is Nunjucks), but the Markdown body would be processed with Liquid.

### Common fields on all components

| Field | Description |
|---|---|
| `classes` | CSS classes appended to the component's root element — this is where the **style variant** goes (see below). |
| `titleCulture` / `textCulture` | Language code of the content (e.g. `de`, `en`). Set automatically by the CMS editor; safe to omit when editing files manually. |

### Style variants

The visual variant of a component is set through `classes`. Exactly these variants exist; their look is defined by the active theme:

| Class | Effect |
|---|---|
| `c-component--main` | Standard section styling (applied automatically when `classes` is empty) |
| `c-component--secondary` | Subtly set-off surface |
| `c-component--special` | Accent-tinted surface |
| `c-component--dark` | Inverted (dark) surface |
| `c-component--framed` | Modifier: bordered frame / card look |
| `c-component--mobile-media-bottom` | Modifier (TextMedia, image left/right): image below the text on mobile |

```yaml
- componentType: TextMedia
  id: approach
  classes: "c-component--secondary c-component--framed"
```

Use one variant per block. The CMS editor shows the variant as the fields `themeStyleClass`, `framed` and `mobileMediaBottom` and writes them into `classes` when saving — the templates do not read `themeStyleClass` or `framed`, so in hand-written front matter always use `classes`.

### Anchors

Every built-in component renders its block `id` as the HTML `id` of its root element, so a block
can be linked directly: a Cards block with `id: services` on `/leistungen/` is reachable at
`/leistungen/#services` (or `#services` on the same page). Use URL-safe ids (lowercase, `-`), and
avoid ids the layout uses itself: `main-content`, `main-nav`.

### Link labels

When a component has a `link` but no `linkText`, the label defaults to the page language: `weitere Informationen` for German, `More information` for English and all other languages (filter `defaultLinkText`).

### Image fields

Components with images share a common image structure:

| Field | Description |
|---|---|
| `image.src` | Path to a **local** image file, starting with `/`. Use `/_media/` for project media or `/_assets/images/` for images shipped with marbas-site. Resolved in the project first, then in the package. Remote URLs and missing files render no image (the build logs `Error processing local image`). |
| `image.alt` | Alt text for accessibility. |
| `image.caption` | Optional caption shown below the image. |
| `image.originalId` | Base filename used when the build generates responsive image variants (e.g. `my-image` → `my-image-800w.webp`). Set automatically by the CMS; when writing front matter manually, use a short slug without extension and keep it **unique per image file** — two different images with the same `originalId` overwrite each other. Without `originalId`, a name is derived from the source path. |

## Placeholder availability per layout

| Placeholder | `content_1col` | `content_2col_main_left` | `content_2col_main_right` | `content_3col_main_center` |
|---|:---:|:---:|:---:|:---:|
| `Placeholder_Hero` | ✓ | ✓ | ✓ | ✓ |
| `Placeholder_Main` | ✓ | ✓ | ✓ | ✓ |
| `Placeholder_Aside_1` | — | ✓ | ✓ | ✓ |
| `Placeholder_Aside_2` | — | — | — | ✓ |

`Placeholder_Hero` spans the full page width in all layouts — ideal for Hero components that bleed edge-to-edge.

---

## Built-in components

### Banner

A full-width image banner, optionally linked. The Banner renders **only the image and the link** — it has no title or text; use a Hero or TextMedia for that.

**Allowed in:** `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | string | ✓ | Unique block ID |
| `image.src` | string | ✓ | Path to image file |
| `image.alt` | string | | Alt text |
| `image.originalId` | string | | Base filename for responsive image variants (slug without extension). |
| `image.width` | string | | Image width in px (for aspect-ratio hint) |
| `image.height` | string | | Image height in px |
| `link` | string | | URL the banner links to |
| `linkAriaLabel` | string | | Screen-reader label for the link |
| `classes` | string | | Additional CSS classes |

```yaml
- componentType: Banner
  id: promo-banner
  image:
    src: /_media/summer-sale.jpg
    alt: Summer sale — up to 40% off
    originalId: summer-sale
  link: /sale/
  linkAriaLabel: View summer sale offers
```

---

### Cards

A grid of teaser cards with optional headline.

**Allowed in:** `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | string | ✓ | Unique block ID |
| `headline` | string | | Section headline above the cards |
| `ariaLabelHeadline` | string | | Screen-reader label for the headline |
| `columns` | number | | Number of columns (default: `3`) |
| `cards` | array | | List of card items (see below) |
| `classes` | string | | Additional CSS classes |

**Card item fields:**

| Field | Type | Description |
|---|---|---|
| `headline` | string | Card title |
| `body` | string | Card body text |
| `image.src` | string | Card image path |
| `image.alt` | string | Card image alt text |
| `link` | string | Card link URL |
| `linkText` | string | Link label (default: [language-dependent](#link-labels)) |
| `linkAriaLabel` | string | Screen-reader label for the link |
| `linkAsCta` | boolean | Render the link as a call-to-action button (default: `false`) |

```yaml
- componentType: Cards
  id: services
  headline: What we offer
  columns: 3
  cards:
    - headline: Web Design
      body: Beautiful, accessible websites tailored to your brand.
      link: /services/design/
      linkText: Learn more
      linkAsCta: true
    - headline: Development
      body: Robust, fast front-end and back-end solutions.
      link: /services/dev/
      linkText: Learn more
```

---

### Hero

A large hero section with image, title, text, and optional CTA.

**Allowed in:** `Placeholder_Hero`, `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | string | ✓ | Unique block ID |
| `image.src` | string | ✓ | Hero image path |
| `image.alt` | string | | Image alt text |
| `image.originalId` | string | | Base filename for responsive image variants (slug without extension). |
| `title` | string | | Main heading |
| `text` | string (HTML) | | Body text. Supports rich text HTML (`<p>`, `<strong>`, `<a>`, …). |
| `flushNav` | boolean | | Remove gap between navigation and hero (default: `false`) |
| `invertTextColor` | boolean | | Use light text on dark images (default: `false`) |
| `showContentBox` | boolean | | Wrap text in a semi-transparent box (default: `false`) |
| `classes` | string | | Additional CSS classes |

```yaml
- componentType: Hero
  id: page-hero
  title: Building the web, one site at a time
  text: "<p>We help small businesses establish a strong online presence.</p>"
  image:
    src: /_media/hero.jpg
    alt: Team collaborating in a modern office
    originalId: hero
  flushNav: true
  invertTextColor: true
```

---

### TextMedia

A text block with optional image, positioned above, below, left, or right of the text.

**Allowed in:** `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | string | ✓ | Unique block ID |
| `title` | string | | Section heading |
| `text` | string | | Body text. Supports inline HTML. |
| `imagePosition` | string | | Where to place the image: `none`, `top`, `bottom`, `left`, `right` (default: `none`) |
| `imageSize` | string | | Image column width when positioned left/right: `wide` (8 cols) or `slim` (4 cols) (default: `wide`) |
| `image.src` | string | | Image path |
| `image.alt` | string | | Image alt text |
| `image.originalId` | string | | Base filename for responsive image variants (slug without extension). |
| `link` | string | | Optional link URL |
| `linkText` | string | | Link label (default: [language-dependent](#link-labels)) |
| `linkAsCta` | boolean | | Render link as CTA button (default: `false`) |
| `mobileMediaBottom` | boolean | | On mobile, push image below text (default: `false`) |
| `themeStyleClass` | string | | CMS editor field, not read by the template — put the variant into `classes` ([Style variants](#style-variants)) |
| `framed` | boolean | | CMS editor field, not read by the template — use `c-component--framed` in `classes` |
| `classes` | string | | Additional CSS classes |

```yaml
- componentType: TextMedia
  id: about-intro
  title: Our approach
  text: We start every project by listening. Only then do we design.
  imagePosition: right
  imageSize: slim
  image:
    src: /_media/approach.jpg
    alt: Sketch on a whiteboard
    originalId: approach
  link: /about/
  linkText: Meet the team
  linkAsCta: true
```

---

### TitleText

A simple heading + text block with optional link. Use for section introductions and call-to-action paragraphs.

**Allowed in:** `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | string | ✓ | Unique block ID |
| `title` | string | | Heading text |
| `text` | string | | Body text. Supports inline HTML. |
| `link` | string | | Optional link URL |
| `linkText` | string | | Link label (default: [language-dependent](#link-labels)) |
| `linkAsCta` | boolean | | Render link as CTA button (default: `false`) |
| `themeStyleClass` | string | | CMS editor field, not read by the template — put the variant into `classes` ([Style variants](#style-variants)) |
| `framed` | boolean | | CMS editor field, not read by the template — use `c-component--framed` in `classes` |
| `classes` | string | | Additional CSS classes |

```yaml
- componentType: TitleText
  id: contact-intro
  title: Get in touch
  text: We respond to all enquiries within one business day.
  link: /contact/
  linkText: Contact us
  linkAsCta: true
```

---

### TitleTextImage variants

Four components that combine a title, text, link, and image in a fixed two-column layout. Choose the variant that matches where you want the image.

| Component | Image position |
|---|---|
| `TitleTextImageLeft` | Image on the left |
| `TitleTextImageRight` | Image on the right |
| `TitleTextImageTop` | Image above |
| `TitleTextImageBottom` | Image below |

**Allowed in:** `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | string | ✓ | Unique block ID |
| `title` | string | | Heading text |
| `text` | string | | Body text. Supports inline HTML. |
| `image.src` | string | ✓ | Image path |
| `image.alt` | string | | Image alt text |
| `image.originalId` | string | | Base filename for responsive image variants (slug without extension). |
| `variantName` | string | | `wide_image` or `slim_image` (left/right only, default: `wide_image`) |
| `link` | string | | Optional link URL |
| `linkText` | string | | Link label (default: [language-dependent](#link-labels)) |
| `linkAsCta` | boolean | | Render link as CTA button (default: `false`) |
| `mobileMediaBottom` | boolean | | CMS editor field, not read by this template — use `c-component--mobile-media-bottom` in `classes` |
| `classes` | string | | Additional CSS classes |

```yaml
- componentType: TitleTextImageRight
  id: feature-1
  title: Fast and reliable
  text: Our infrastructure is built for uptime and speed.
  image:
    src: /_media/infrastructure.jpg
    alt: Server room
    originalId: infrastructure
  variantName: slim_image
  link: /features/
  linkText: All features
```

---

### TwoImages

Two images displayed side by side.

**Allowed in:** `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | string | ✓ | Unique block ID |
| `image1.src` | string | ✓ | First image path |
| `image1.alt` | string | | First image alt text |
| `image2.src` | string | ✓ | Second image path |
| `image2.alt` | string | | Second image alt text |
| `classes` | string | | Additional CSS classes |

```yaml
- componentType: TwoImages
  id: gallery-pair
  image1:
    src: /_media/project-a.jpg
    alt: Project A — storefront view
    originalId: project-a
  image2:
    src: /_media/project-b.jpg
    alt: Project B — interior
    originalId: project-b
```

---

### Video

An embedded HTML5 video player with optional headline.

**Allowed in:** `Placeholder_Main`, `Placeholder_Aside_1`, `Placeholder_Aside_2`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | string | ✓ | Unique block ID |
| `video.webm` | string | | Path to `.webm` source |
| `video.mp4` | string | | Path to `.mp4` source |
| `video.poster` | string | | Poster image shown before playback |
| `videoHeadline` | string | | Heading above the player |
| `ariaLabelHeadline` | string | | Screen-reader label for the heading |
| `autoplay` | boolean | | Auto-play on load (default: `false`) |
| `muted` | boolean | | Mute audio (default: `false`). Required for autoplay in most browsers. |
| `loop` | boolean | | Loop playback (default: `false`) |
| `themeStyleClass` | string | | CMS editor field, not read by the template — put the variant into `classes` ([Style variants](#style-variants)) |
| `framed` | boolean | | CMS editor field, not read by the template — use `c-component--framed` in `classes` |
| `classes` | string | | Additional CSS classes |

```yaml
- componentType: Video
  id: product-demo
  videoHeadline: See it in action
  video:
    mp4: /_media/demo.mp4
    webm: /_media/demo.webm
    poster: /_media/demo-poster.jpg
  autoplay: false
  muted: false
```

---

## Base v2 components

Five building blocks for the Base v2 look (no boxes, hairlines, full-width bands, display typography — see
[themes.md](themes.md#theme-families-and-palettes-base-v2)). They work in every theme, but are designed for v2 themes;
in classic themes their bands stay inside the boxed page. Common fields:

| Field | Meaning |
|---|---|
| `label` | Section label in the left rail (e.g. `01 / Orientierung`) |
| `tone` | Band colour: `paper` (default), `soft` (accent tint), `white`, `alert` (warning tint) |

### Intro

Editorial opening block — **provides the page `<h1>`** (like Hero); only in `Placeholder_Hero`.
Fields: `label`, `headline` (h1, may contain `<br>`), `lead`, `text` (html), `links[] {label, href}` (text links with ↗),
`image {src, alt, originalId}`, `tone`.

### Notice

Slim notice band. Fields: `label`, `text` (html), `meta` (right-aligned, e.g. a date), `tone`.

### LinkList

Paths or concerns as rows or cards — the form decides (`@layout linklist`). Each entry: optional label, title, text, arrow;
the whole entry is the link.
Fields: `label`, `headline`, `text` (html), `items[] {label, title, text, href, tone}` (`tone: alert` highlights an entry), `tone`.

Entries are **not numbered automatically** (since 0.16). Give entries a label (`items[].label`, e.g. `"01"`, `"Step 1"`)
only when they are a real sequence; alternatives ("Looking for a coin?" / "Have one to spare?") stay without. Use labels
of similar length — each row aligns its own label column.

### Split

Two columns. `layout: text` (default): headline, text and link on the left, list or big numbers on the right;
`layout: title`: headline on the left, text on the right.
Fields: `label`, `layout`, `headline`, `text` (html), `mutedText` (html), `note` (side note with a line), `link`, `linkText`,
`list {title, items[], note}` (items as strings or `{value}`), `numbers[] {label, detail, value, href}` (without `href` a
`tel:` link is built from `value`), `tone`.

### Contact

Contact data and opening hours as rows. Components do not see `site.*` — enter the data in the block.
Fields: `label`, `headline`, `text` (html), `details[] {term, value (html)}`, `notes` (html), `hoursTitle`,
`hours[] {day, time}`, `link`, `linkText`, `tone`.

## Custom components

You can add your own components alongside the built-in ones. A component is a Nunjucks template in `_components/<Name>/<Name>.njk` — no registration required. Components can also carry their own CSS, JavaScript, server-side PHP files, and build hooks.

See **[Custom Components](custom-components.md)** for the full guide, including:
- Template structure and the `data` variable
- The variables available in a component template (`data`, `lang`, `placeholder_sizes`, `page`)
- CSS and JavaScript bundling
- Server-side files (`_api/`) and build hooks
- Ejecting and customising built-in components
