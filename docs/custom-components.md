# Custom Components

Custom components let you extend the built-in component library with your own Nunjucks templates. A component is a self-contained directory inside `_components/` — no registration, no configuration. The build pipeline picks it up automatically.

---

## Directory structure

```
my-project/
└── _components/
    └── Testimonial/
        └── Testimonial.njk
```

The directory name is the component type. It must start with an uppercase letter and match the file name exactly. The component is immediately available in any placeholder:

```yaml
Placeholder_Main:
  - componentType: Testimonial
    id: client-quote
    quote: "Working with them changed everything."
    author: Jane Smith
    role: CEO, Acme Corp
```

---

## The component template

Inside `Testimonial.njk`, the component's front matter data is available via the `data` variable:

```nunjucks
<figure class="c-testimonial">
  <blockquote class="c-testimonial__quote">
    <p>{{ data.quote }}</p>
  </blockquote>
  <figcaption class="c-testimonial__attribution">
    {{ data.author }}{% if data.role %}, <span>{{ data.role }}</span>{% endif %}
  </figcaption>
</figure>
```

Every field declared in the page front matter block is available on `data`. There is no schema required — add any fields you need and access them directly.

---

## Available variables

Components are **purely data-driven**: a template renders only from its own block, so the same block always produces the same output, whichever page it is placed on. These variables are available — and only these:

| Variable | Type | Description |
|---|---|---|
| `data` | object | The component block's own front matter fields |
| `lang` | string | Language of the page (`pageLanguage`) |
| `placeholder_sizes` | array | Column widths of the placeholder the block sits in — pass it to `processLocalImage` for correct responsive sizes |
| `page` | object | Current page: `page.url`, `page.fileSlug`, `page.inputPath`, … |

`site`, `env`, `collections`, other files in `pages/_data/` and page front matter fields such as `title` are **not** available inside components. This is intentional — it keeps components independent of the site configuration and free of name clashes with page fields.

### Site-wide data such as contact details

Pass everything a component needs as block fields:

```yaml
Placeholder_Aside_1:
  - componentType: ContactCard
    id: contact
    phone: "+49 30 123456"
    email: hello@example.com
    address:
      street: Musterstraße 1
      zip: "10115"
      city: Berlin
```

```nunjucks
{# ContactCard.njk #}
<div class="c-contact-card">
  <p><a href="tel:{{ data.phone | replace(' ', '') }}">{{ data.phone }}</a></p>
  <p><a href="mailto:{{ data.email }}">{{ data.email }}</a></p>
  <address>
    {{ data.address.street }}<br>
    {{ data.address.zip }} {{ data.address.city }}
  </address>
</div>
```

Global data files (`pages/_data/*.json`, including `site.json`) remain available in **layouts, header and footer** — for example the footer's contact block reads `site.footer.contact`.

### Helpers you can use

| Helper | Use |
|---|---|
| `{{ data.link \| locale_url }}` | Adds the language prefix to internal links on non-default-language pages |
| `{{ data.linkText or (lang \| defaultLinkText) }}` | Language-dependent fallback link label (`weitere Informationen` / `More information`) |
| `{% set img = data.image \| processLocalImage({"sizes": [12,12,12,6,6,6], "placeholder_sizes": placeholder_sizes}) %}{{ img.html \| safe }}` | Responsive image processing for a local image (`src`, `alt`, `originalId`) |
| `{{ "aria-label" \| htmlAttribute(data.ariaLabel) \| safe }}` | Renders an escaped attribute only when the value is set |
| `{{ lang \| getLangAttribute(data.titleCulture) }}` | `lang="…"` when a text differs from the page language |

To pick up the theme's style variants, reuse the built-in markup: a root element with `c-component` plus the variant from `data.classes` (default `c-component--main`), headings with `c-component__headline`, rich text in `c-richtext`, buttons with `c-btn`.

---

## CSS and JavaScript

Any `.css` or `.js` file inside the component directory is automatically bundled into the site's asset bundle. No imports needed — just place the file next to the template.

```
_components/
└── Testimonial/
    ├── Testimonial.njk
    ├── Testimonial.css
    └── Testimonial.js
```

For larger components, organising front-end files in a `client/` subfolder is a common convention — but any `.css` or `.js` file at any depth is included.

The bundle is global — styles and scripts apply to every page. Always scope component styles with a unique class:

```css
/* Testimonial.css */
.c-testimonial {
  border-left: 4px solid var(--t-accent);
  padding: 1rem 1.5rem;
  margin: 2rem 0;
}

.c-testimonial__quote {
  font-size: 1.125rem;
  color: var(--t-text);
}

.c-testimonial__attribution {
  font-size: 0.875rem;
  color: var(--t-muted);
  margin-top: 0.75rem;
}
```

```js
// Testimonial.js
document.querySelectorAll('.c-testimonial').forEach((el) => {
  el.addEventListener('click', () => el.classList.toggle('is-expanded'));
});
```

> Theme CSS custom properties (`--t-accent`, `--t-muted`, etc.) are available in component stylesheets. See [Themes](themes.md) for the full token reference.

---

## Server-side files and build hooks

Components can also carry PHP scripts (or any server-side files) in an `_api/` subfolder, and run post-build logic via a `build.js` hook:

```
_components/
└── ContactForm/
    ├── ContactForm.njk
    ├── ContactForm.css
    ├── _api/
    │   └── submit.php      ← copied to output/_api/ContactForm/
    └── build.js            ← runs after Eleventy finishes
```

See [Component Extensions: API Files & Build Hooks](component-extensions.md) for full documentation and examples.

---

## Ejecting a built-in component

To customise a built-in component, eject it into your project:

```bash
marbas-site eject my-project _components/Hero
```

The full component directory is copied to `my-project/_components/Hero/`. Edit `Hero.njk`, the CSS, or the JS freely — the library version is no longer used for this project.

To restore the original:

```bash
marbas-site reset my-project _components/Hero
```

The customised version is backed up to `.marbas/trash/<timestamp>/` before being removed.
