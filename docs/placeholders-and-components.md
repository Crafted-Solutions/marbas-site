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

> **Important:** Pages that use components must include `templateEngineOverride: njk,md` in their front matter. Without it, the placeholders will not render.

### Common fields on all components

| Field | Description |
|---|---|
| `classes` | Additional CSS classes appended to the component's root element. |
| `titleCulture` / `textCulture` | Language code of the content (e.g. `de`, `en`). Set automatically by the CMS editor; safe to omit when editing files manually. |

**`themeStyleClass`** controls the visual variant of components that support it (TextMedia, TitleText, Video). The default value `c-component--main` applies the standard section styling. Other common values: `c-component--light`, `c-component--dark`, `c-component--accent` — the available variants depend on the active theme.

### Image fields

Components with images share a common image structure:

| Field | Description |
|---|---|
| `image.src` | Path to the image. Use `/_media/` for project-uploaded media or `/_assets/images/` for lib-provided images. |
| `image.alt` | Alt text for accessibility. |
| `image.caption` | Optional caption shown below the image. |
| `image.originalId` | Base filename used when the build generates responsive image variants (e.g. `my-image` → `my-image-800w.webp`). Set automatically by the CMS; when writing front matter manually, use a short slug without extension. |

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

A full-width image banner, optionally linked.

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
| `linkText` | string | Link label |
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
| `linkText` | string | | Link label |
| `linkAsCta` | boolean | | Render link as CTA button (default: `false`) |
| `mobileMediaBottom` | boolean | | On mobile, push image below text (default: `false`) |
| `themeStyleClass` | string | | Theme style variant (default: `c-component--main`) |
| `framed` | boolean | | Wrap in a bordered frame (default: `false`) |
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
| `linkText` | string | | Link label |
| `linkAsCta` | boolean | | Render link as CTA button (default: `false`) |
| `themeStyleClass` | string | | Theme style variant |
| `framed` | boolean | | Bordered frame (default: `false`) |
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
| `linkText` | string | | Link label |
| `linkAsCta` | boolean | | Render link as CTA button (default: `false`) |
| `mobileMediaBottom` | boolean | | Push image below text on mobile (default: `false`) |
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
| `themeStyleClass` | string | | Theme style variant |
| `framed` | boolean | | Bordered frame (default: `false`) |
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

## Custom components

You can add your own components alongside the built-in ones. A component is a Nunjucks template in `_components/<Name>/<Name>.njk` — no registration required. Components can also carry their own CSS, JavaScript, server-side PHP files, and build hooks.

See **[Custom Components](custom-components.md)** for the full guide, including:
- Template structure and the `data` variable
- Accessing `site`, `page`, and `env` in templates
- CSS and JavaScript bundling
- Server-side files (`_api/`) and build hooks
- Ejecting and customising built-in components
