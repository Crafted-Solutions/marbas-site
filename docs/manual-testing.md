# Manual Testing Guide

A hands-on walkthrough for verifying a `marbas-site` build end-to-end:
scaffolding a project, running the live-preview watcher, switching themes,
and locally overriding a component and a theme.

Everything here uses the CLI only — no editor app required.

---

## 0. Setup

You can drive the CLI in two ways.

**A) From a local clone of this repo** (what you'll use while developing
the library):

```bash
# from anywhere; point at your checkout
alias marbas-site="node /ABSOLUTE/PATH/TO/marbas-site/src/cli/bin.js"
```

**B) As an installed package** (what a consumer sees):

```bash
npm install -g @crafted.solutions/marbas-site
# then just `marbas-site …`, or `npx @crafted.solutions/marbas-site …`
```

Create a throwaway project to test against:

```bash
marbas-site init /tmp/marbas-demo --name="Demo Site"
marbas-site doctor /tmp/marbas-demo      # should report a healthy project
```

> Tip: keep the project on a path you can delete afterwards (e.g. `/tmp`).
> `marbas-site doctor <path>` is your quick health check at any step.

A scaffolded project contains roughly:

```
/tmp/marbas-demo
├── marbas-project.json     # project config (theme, environments, …)
├── pages/                  # content (e.g. index.md)
├── _components/            # your custom + ejected components (empty at first)
├── _theme/                 # your ejected/custom themes (empty at first)
└── _data/site.json         # global site data (header, footer, …)
```

Built-in components and themes live **inside the library**, not in the
project — the project only contains what you add or eject.

---

## 1. The watcher (live preview)

Start the preview server. It runs webpack in watch mode and Eleventy in
serve mode, rebuilding on every file change.

```bash
marbas-site preview /tmp/marbas-demo --env=development
# optional: --port=4000
```

Open the printed URL (default `http://localhost:3001/`).

**Verify the watcher reacts to edits:**

1. Edit `pages/index.md` — change a heading or paragraph, save.
2. The terminal logs an Eleventy rebuild; refresh the browser → your
   change is visible.
3. Add a CSS tweak in a component or theme file (see sections 3–4) while
   preview is running → webpack recompiles and the page reflects it.

Stop the watcher with `Ctrl+C`.

> Note: changing `marbas-project.json` itself (e.g. the active theme, see
> section 2) is **not** picked up live — stop and restart `preview`, or run
> a one-off `marbas-site build`.

---

## 2. Switching themes

The library ships 18 themes. The theme ID is the file name without the
extension, e.g. `theme-bloom`, `theme-atlas`, `theme-slate`.

```bash
# set the active theme (validates that the theme exists)
marbas-site theme /tmp/marbas-demo theme-bloom

# apply it
marbas-site build /tmp/marbas-demo --env=development
```

This writes `theme.id` into `marbas-project.json` and copies the theme CSS
into the build output.

**Verify:**

- `marbas-project.json` now has `"theme": { "id": "theme-bloom" }`.
- The built CSS in `build/public_development/_assets/` reflects the
  theme's palette (open the site or inspect the CSS custom properties).
- Switch again to confirm it overwrites cleanly:

  ```bash
  marbas-site theme /tmp/marbas-demo theme-atlas
  marbas-site build /tmp/marbas-demo --env=development
  ```

  The look changes from Bloom to Atlas.

Full theme list: see [themes.md](themes.md).

---

## 3. Local override of a component

Components resolve **project-first**: if `_components/<Name>/` exists in the
project, it wins over the library's built-in. Components are always ejected as
a **whole** — the entire component directory (template plus any CSS/JS) is
copied into the project, never single fragments.

Built-in components include: `Hero`, `Cards`, `Banner`, `TextMedia`,
`Video`, `TitleText`, and the `TitleTextImage*` family.

```bash
# copy the whole built-in Hero component into the project for customisation
marbas-site eject /tmp/marbas-demo _components/Hero
```

The component is written to `/tmp/marbas-demo/_components/Hero/`
(ejected from the library's `_includes/components/Hero/`). Once a project
component of that name exists, the build uses the project version exclusively
— the library's variant (including its CSS/JS) is excluded entirely.

**Verify the override takes effect:**

1. Make sure a page actually uses the component (a scaffolded `index.md`
   typically renders one; otherwise add a Hero block to `pages/index.md`).
2. Edit `_components/Hero/Hero.njk` — add a marker, e.g. wrap the title in
   `<span data-test="ejected-hero">…</span>` or change some static text.
3. Rebuild (or have `preview` running):

   ```bash
   marbas-site build /tmp/marbas-demo --env=development
   ```

4. Inspect `build/public_development/index.html` → your marker is present,
   proving the project copy is used instead of the library version.
5. `marbas-site doctor /tmp/marbas-demo` lists the component as ejected.

**Restore the library default:**

```bash
marbas-site reset /tmp/marbas-demo _components/Hero
marbas-site build /tmp/marbas-demo --env=development   # marker is gone again
```

---

## 4. Local override of a theme

Theme resolution is also project-first:
`<project>/_theme/<theme-id>.css` overrides the library's built-in of the
same name.

```bash
# copy the built-in Bloom theme into the project
marbas-site eject /tmp/marbas-demo _theme/theme-bloom.css
```

The file lands at `/tmp/marbas-demo/_theme/theme-bloom.css`.

**Verify the override takes effect:**

1. Make Bloom the active theme (so the build picks this file up):

   ```bash
   marbas-site theme /tmp/marbas-demo theme-bloom
   ```

2. Edit `_theme/theme-bloom.css` — change an obvious token, e.g. the
   accent colour:

   ```css
   :root {
     --t-accent: #ff0066;   /* loud test colour */
   }
   ```

3. Rebuild:

   ```bash
   marbas-site build /tmp/marbas-demo --env=development
   ```

4. Open the site → accent-coloured elements now use your test colour,
   proving the project theme overrides the library version.

> The active theme ID must match the ejected file's name. If you switch to
> a different theme ID, your ejected `_theme/theme-bloom.css` stays on disk
> but is no longer used until `theme.id` points back to `theme-bloom`.

**Restore the library default:**

```bash
marbas-site reset /tmp/marbas-demo _theme/theme-bloom.css
marbas-site build /tmp/marbas-demo --env=development
```

See [themes.md](themes.md#ejecting-a-built-in-theme) for more on theme
customisation.

---

## 5. Quick verification checklist

| Check | Command | Expected |
|-------|---------|----------|
| Project scaffolds | `marbas-site init <path>` | files created, `doctor` healthy |
| Watcher rebuilds | `marbas-site preview <path> --env=development` | edits appear after save/refresh |
| Theme switch | `marbas-site theme <path> theme-atlas` + build | look changes |
| Component override | eject → edit → build | marker in `index.html` |
| Component restore | `marbas-site reset <path> _components/Hero` + build | marker gone |
| Theme override | eject → edit token → build | colour change on site |
| Theme restore | `reset _theme/theme-<id>.css` + build | original colours |

---

## 6. Cleanup

```bash
rm -rf /tmp/marbas-demo
```
