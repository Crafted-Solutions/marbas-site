# marbas-site

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Build, preview, and deploy static websites with a structured, file-based workflow.**

`marbas-site` is an [Eleventy](https://www.11ty.dev/)-based site library and CLI. It provides a canonical set of templates, components, themes, and a build pipeline for Marbas-format website projects. It runs standalone — no Marbas backend required.

---

## Why marbas-site?

Eleventy is a powerful static site generator — but it ships with no opinions about structure, components, or deployment. You start from zero every time.

marbas-site adds a complete, opinionated layer on top:

**Structured content without templates.** Pages are Markdown files with YAML front matter. Components like Hero, Cards, or TextMedia are declared as structured blocks — no Nunjucks knowledge required to author content.

**A ready-to-use component library.** Eight built-in components cover the most common content patterns. Drop them into any page immediately. Build custom components by adding a single `.njk` file — no registration, no config.

**18 production-ready themes.** Switch themes with one line in `site.json`. Every theme is a CSS custom properties file — eject it, tweak it, or build your own from scratch.

**Multi-environment builds out of the box.** Define named environments (`development`, `staging`, `production`) with separate output directories and per-environment variables. No custom Eleventy config needed.

**Eject without forking.** Override any library default — layout, component, theme — by ejecting the file into your project. The library version is no longer used. Restore it at any time with `reset`.

**Deploy from the CLI.** `marbas-site deploy` uploads the built output to an FTP target. Credentials stay in git-ignored local files; the rest is in `marbas-project.json`.

**Server-side files travel with their component.** Place PHP scripts (or any other server-side files) in a component's `_api/` folder. The build copies them to `_api/<ComponentName>/` in the output — so a form handler or search endpoint is always shipped alongside the component that needs it, without any manual deploy steps.

**Build hooks for post-processing.** Add a `build.js` to any component and it runs automatically after Eleventy finishes rendering. Use it to generate sitemaps, resize images, send notifications, or do any build-time work that needs access to the full set of rendered pages.

**Project health checks.** `marbas-site doctor` catches version mismatches, missing credentials, stale build output, and configuration inconsistencies before they cause a failed deploy.

---

## Installation

Requires **Node.js 18** or later.

```bash
npm install -g @crafted.solutions/marbas-site
```

Until the package is published to npm, install directly from GitHub:

```bash
npm install -g github:Crafted-Solutions/marbas-site
```

Or use it without installing:

```bash
npx @crafted.solutions/marbas-site init my-site
```

---

## Quickstart

```bash
# Create a new project
marbas-site init my-site

# Build it
marbas-site build my-site --env=development

# Start a live-preview server
marbas-site preview my-site --env=development
```

After `init`, your project contains only what you own:

```
my-site/
├── marbas-project.json   # project config (environments, build paths, deploy targets)
├── pages/                # your pages (Markdown + front matter)
├── _components/          # your custom components
├── _theme/               # your theme CSS
└── _media/               # your media files
```

The build output lands in `my-site/build/public_development/` (or `public_<env>/` for other environments).

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `marbas-site init <path>` | Create a new project at `<path>` |
| `marbas-site build <path> --env=<name>` | Build the project for the given environment |
| `marbas-site preview <path> --env=<name>` | Start a live-preview server (Eleventy + Webpack watch) |
| `marbas-site deploy <path> --env=<name>` | Deploy to the configured target for the given environment |
| `marbas-site eject <path> <file>` | Copy a library default file into the project for customization |
| `marbas-site reset <path> <file>` | Remove a customized file and restore the library default (backup saved to `.marbas/trash/`) |
| `marbas-site doctor <path>` | Show project status, version check, and customized-file diffs |
| `marbas-site envs <path>` | List configured environments |

`--env` is required for `build`, `preview`, and `deploy`. If `defaultEnvironment` is set in `marbas-project.json`, it is used when `--env` is omitted.

---

## Project Structure

A fresh project contains only your content. Library defaults (layouts, includes, built-in components, themes) live inside the installed package and are invisible unless you explicitly customize them.

### Customizing library files

To modify a library default, eject it into your project:

```bash
marbas-site eject my-site _layouts/base.njk
```

The file is now local and takes precedence over the library version. Edit it freely. To restore the original:

```bash
marbas-site reset my-site _layouts/base.njk
```

The previous version is backed up to `my-site/.marbas/trash/<timestamp>/` before deletion.

### Custom components

Add a new component by dropping a Nunjucks template into `_components/`:

```
my-site/_components/Quote/Quote.njk
```

The library's component renderer picks it up automatically — no registration. A project's `_components/<Name>/<Name>.njk` always takes precedence over a built-in of the same name.

Built-in components ship inside the package (at `_includes/components/`). To customize one, eject it — it lands in your project's `_components/`, where the renderer reads overrides:

```bash
marbas-site eject my-site _components/Hero
```

This copies the built-in `Hero` into `my-site/_components/Hero/`. Edit it freely; restore the original with `marbas-site reset my-site _components/Hero`.

### Environments

Environments are defined in `marbas-project.json`:

```json
{
  "defaultEnvironment": "development",
  "environments": {
    "development": {
      "outputName": "development",
      "env": { "BASE_URL": "http://localhost:8080" }
    },
    "production": {
      "outputName": "production",
      "env": { "BASE_URL": "https://example.com" },
      "deployTarget": "ftp-prod"
    }
  }
}
```

Each environment gets its own output directory (`build/public_<outputName>/`).

---

## Extending marbas-site

Third-party packages can add CLI commands, audits, and workflows by including `"marbas-extension": true` in their `package.json`. The CLI auto-discovers installed extensions at startup.

---

## Developing marbas-site

```bash
git clone https://github.com/Crafted-Solutions/marbas-site.git
cd marbas-site
npm install
npm test
```

Tests use Node's built-in `node:test` runner — no additional test framework needed.

To run the library against a local project:

```bash
node src/cli/bin.js build /path/to/my-project --env=development
```

---

## Documentation

- [Pages & Frontmatter](docs/pages.md)
- [Placeholders & Components](docs/placeholders-and-components.md)
- [Custom Components](docs/custom-components.md)
- [Component Extensions: API Files & Build Hooks](docs/component-extensions.md)
- [Global Site Data](docs/site-data.md)
- [Themes](docs/themes.md)
- [Environments & Deployment](docs/environments.md)

---

## License

MIT — see [LICENSE](LICENSE).
