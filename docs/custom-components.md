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

## Accessing global data

Component templates have access to all global Eleventy data alongside `data`:

| Variable | Type | Description |
|---|---|---|
| `data` | object | The component block's own front matter fields |
| `site` | object | The full `pages/_data/site.json` object |
| `page` | object | Current page data: `page.url`, `page.fileSlug`, `page.date`, … |
| `env` | object | Build environment: `env.environment`, `env.isProd` |

### Using `site` data in a component

Any field from `site.json` is accessible. This is useful for contact details, branding, or site-wide configuration:

```nunjucks
{# ContactCard.njk — renders data from site.json #}
<div class="c-contact-card">
  <p>{{ site.footer.contact.phone }}</p>
  <p><a href="mailto:{{ site.footer.contact.email }}">{{ site.footer.contact.email }}</a></p>
  <address>
    {{ site.footer.contact.address.street }}<br>
    {{ site.footer.contact.address.zip }} {{ site.footer.contact.address.city }}
  </address>
</div>
```

### Using `page` and `env`

```nunjucks
{# Only render in production #}
{% if env.isProd %}
  <script async src="https://analytics.example.com/a.js"></script>
{% endif %}

{# Link back to the current page's canonical URL #}
<link rel="canonical" href="{{ page.url | url }}">
```

### Additional global data files

Beyond `site.json`, you can place any JSON file in `pages/_data/` and it becomes a global variable in all templates — including component templates. The variable name is the file name without the extension:

```
pages/_data/team.json    →  available as  team
pages/_data/pricing.json →  available as  pricing
```

```nunjucks
{# TeamGrid.njk — uses pages/_data/team.json #}
<ul class="c-team-grid">
  {% for member in team %}
    <li class="c-team-grid__item">
      <img src="{{ member.photo }}" alt="{{ member.name }}">
      <strong>{{ member.name }}</strong>
      <span>{{ member.role }}</span>
    </li>
  {% endfor %}
</ul>
```

See the [Eleventy global data documentation](https://www.11ty.dev/docs/data-global/) for the full spec.

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
