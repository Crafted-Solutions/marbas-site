# Component Extensions: API Files & Build Hooks

Components in marbas-site are more than Nunjucks templates. Each component can ship server-side PHP files and a Node.js build hook alongside its template — all in the same directory, discovered and processed automatically.

```
_components/
└── ContactForm/
    ├── ContactForm.njk   ← render template
    ├── client/           ← front-end JS/CSS (bundled)
    ├── _api/             ← server-side files (copied to output)
    │   └── submit.php
    └── build.js          ← build hook (runs after Eleventy)
```

---

## `_api/` — Server-side files

Any file placed inside a component's `_api/` folder is copied verbatim to `_api/<ComponentName>/` in the build output. This works for PHP scripts, `.htaccess` files, or any other asset the web server needs to serve.

### Output path

```
_components/ContactForm/_api/submit.php
→  build/public_production/_api/ContactForm/submit.php
```

The path is consistent across all environments, so you can hard-code it in your component template:

```nunjucks
{# ContactForm.njk #}
<form method="post" action="/_api/ContactForm/submit.php">
  <input type="text" name="name" placeholder="Your name">
  <input type="email" name="email" placeholder="Email">
  <textarea name="message"></textarea>
  <button type="submit">Send</button>
</form>
```

### Example: PHP form handler

```php
<?php
// _components/ContactForm/_api/submit.php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$name    = htmlspecialchars(trim($_POST['name'] ?? ''));
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$message = htmlspecialchars(trim($_POST['message'] ?? ''));

if (!$email || !$name || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

mail('hello@example.com', "Contact from $name", $message, "From: $email");

header('Location: /contact/thank-you/');
exit;
```

When you deploy the project, the PHP file is already in place — no separate upload step required.

### Subdirectories

`_api/` can contain nested folders. The full directory tree is preserved in the output:

```
_components/Search/_api/
├── index.php
└── lib/
    └── stemmer.php
→  _api/Search/index.php
→  _api/Search/lib/stemmer.php
```

---

## `build.js` — Build hooks

A `build.js` file at the root of a component directory is called automatically after Eleventy has finished rendering all pages. Use it for any post-build work that needs access to the rendered output or the full list of pages.

### Interface

`build.js` must export a default async function:

```js
// _components/Sitemap/build.js

/**
 * @param {object} context
 * @param {string} context.projectRoot   Absolute path to the project root
 * @param {string} context.environment   Active environment name (e.g. "production")
 * @param {string} context.outputPath    Absolute path to the build output directory
 * @param {string[]} context.pages       List of rendered HTML file paths
 * @param {object} context.env           Resolved env vars for this environment
 * @param {string} context.componentDir  Absolute path to this component's directory
 */
export default async function ({ outputPath, pages, env }) {
  // your post-build logic here
}
```

### Example: generate a sitemap

```js
// _components/Sitemap/build.js
import fs from 'fs';
import path from 'path';

export default async function ({ outputPath, pages, env }) {
  const baseUrl = env.SITE_URL || 'https://example.com';

  const urls = pages
    .filter((p) => p.endsWith('index.html'))
    .map((p) => {
      const rel = path.relative(outputPath, p).replace(/index\.html$/, '');
      return `  <url><loc>${baseUrl}/${rel}</loc></url>`;
    });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>'
  ].join('\n');

  fs.writeFileSync(path.join(outputPath, 'sitemap.xml'), xml, 'utf8');
  console.log(`Sitemap written: ${urls.length} URLs`);
}
```

### Example: send a deploy notification

```js
// _components/DeployNotify/build.js

export default async function ({ environment, pages, env }) {
  if (environment !== 'production') return;

  await fetch(env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `Deployed ${pages.length} pages to production.`
    })
  });
}
```

### Execution order and error handling

- Hooks run sequentially, in the order components are discovered.
- A hook that throws or rejects aborts the build immediately with a clear error message.
- Hooks from built-in library components run before project component hooks.
- Hooks receive the same `env` object as the Eleventy build — including any variables set in `config/env/.env.<environment>`.

---

## Using both together

A component can have both `_api/` files and a `build.js`. A common pattern is a search component that ships a PHP search endpoint and generates a search index at build time:

```
_components/Search/
├── Search.njk
├── client/
│   └── search.js
├── _api/
│   └── search.php        ← query handler on the server
└── build.js              ← writes search-index.json to the output
```

```js
// build.js — generates a search index from all rendered pages
import fs from 'fs';
import path from 'path';

export default async function ({ outputPath, pages }) {
  const index = pages
    .filter((p) => p.endsWith('index.html'))
    .map((p) => {
      const html = fs.readFileSync(p, 'utf8');
      const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
      const rel   = '/' + path.relative(outputPath, path.dirname(p)) + '/';
      return { title, url: rel };
    });

  fs.writeFileSync(
    path.join(outputPath, '_api', 'Search', 'index.json'),
    JSON.stringify(index),
    'utf8'
  );
}
```

The PHP script then reads `index.json` at request time to serve search results — no database required.
