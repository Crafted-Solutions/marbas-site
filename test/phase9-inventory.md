# Phase 9 — Template-Inventar

Snapshot: 2026-05-23. Referenz für Tasks 54–58.

Grep-Basis: `_includes/`, `_layouts/`, `_components/`
(Komponenten liegen unter `_includes/components/`; `_layouts/` ist leer.)

Gesamt: **58 Treffer**, davon:
- `{% include %}`: 57 statisch + 0 (`placeholder.njk` nutzt `{% renderFile %}`, nicht `{% include %}`)
- `{% extends %}`: 0
- `{% import %}` / `{% from %}`: 0

---

## Cluster 1 — Komponenten-Dispatcher (dynamisch, hot path)

**Datei:** `_includes/placeholder.njk`

| Zeile | Konstrukt | Dynamisch? | Häufigkeit | Phase-9-Strategie |
|-------|-----------|-----------|------------|-------------------|
| 15–22 | `{% renderFile libIncludesDir + "/components/" + item.componentType + "/" + item.componentType + ".njk", componentData %}` | **ja** — `item.componentType` | hot path (jede Seite mit Komponenten) | → `{% renderComponent block %}` Shortcode (Task 54) |

**Kontext:** `placeholder.njk` wird von allen Content-Layout-Includes aufgerufen
(`content_1col`, `content_2col_*`, `content_3col_*`, `footerNavigation`).
Der Dispatcher verwendet bereits `{% renderFile %}` statt `{% include %}` —
kein klassisches `{% include "components/" + type %}` mehr vorhanden.

---

## Cluster 2 — Sub-Includes in Komponenten-Templates

**Datei:** Alle Dateien unter `_includes/components/`

| Datei | Include-Aufrufe |
|-------|-----------------|
| `components/Banner/Banner.njk` | keine |
| `components/Cards/Cards.njk` | keine |
| `components/Hero/Hero.njk` | keine |
| `components/TextMedia/TextMedia.njk` | keine |
| `components/TitleText/TitleText.njk` | keine |
| `components/TitleTextImageBottom/TitleTextImageBottom.njk` | keine |
| `components/TitleTextImageLeft/TitleTextImageLeft.njk` | keine |
| `components/TitleTextImageRight/TitleTextImageRight.njk` | keine |
| `components/TitleTextImageTop/TitleTextImageTop.njk` | keine |
| `components/TwoImages/TwoImages.njk` | keine |
| `components/Video/Video.njk` | keine |
| `components/marbas/sysinfo.njk` | keine |

**Befund:** Kein einziges Sub-Include in Komponenten-Templates.
Cluster 2 ist für den aktuellen Bestand **leer** — kein Custom-Loader für
Sub-Includes (Task 55) nötig, solange keine Komponente interne Partials referenziert.

---

## Cluster 3 — Layout-Extends (`{% extends %}`)

**Befund:** 0 Treffer. Kein `{% extends %}` in Templates vorhanden.
Pages nutzen `layout:` im Frontmatter (Eleventy löst das über `dir.includes` auf).
Aktive Layouts: `base.njk` (einziges Layout, über Frontmatter `layout: base.njk`).

Phase-9-Strategie (Task 56): `addLayoutAlias('base', absPath)` mit Projekt-Override-Check.
Einfach — nur ein einziges Layout zu registrieren.

---

## Cluster 4 — Globale Partials (Header, Footer, Navigation)

Alle über `{% include %}` aufgerufen, statische Pfade. Volle Tiefe:

### `_includes/base.njk` (Haupt-Layout)

| Zeile | Include | Häufigkeit | Phase-9-Strategie |
|-------|---------|------------|-------------------|
| 13 | `./header_seo.njk` | hot path | → `{% siteMeta page %}` Shortcode |
| 18 | `./_head-assets.njk` | hot path | → `{% siteHeadAssets %}` Shortcode |
| 29 | `./topNavigation.njk` | hot path | → `{% siteHeader site %}` Shortcode |
| 82 | `./footerGlobal.njk` | hot path | → `{% siteFooter site %}` Shortcode |
| 84 | `./footerNavigation.njk` | hot path | → `{% siteFooterNav site %}` Shortcode |

### `_includes/topNavigation.njk` (Header-Dispatcher)

Wählt per `if/elif`-Kette das aktive Header-Preset aus:

| Zeile | Include | Dynamisch? | Phase-9-Strategie |
|-------|---------|-----------|-------------------|
| 7 | `header/presets/brand-nav-actions.njk` | nein (bedingt) | internes Detail von `{% siteHeader %}` |
| 9 | `header/presets/utility-brand-nav.njk` | nein (bedingt) | internes Detail von `{% siteHeader %}` |
| 11 | `header/presets/centered-nav.njk` | nein (bedingt) | internes Detail von `{% siteHeader %}` |
| 13 | `header/presets/brand-nav.njk` | nein (bedingt) | internes Detail von `{% siteHeader %}` |

### Header-Presets → Slots

| Preset | Slots (includes) |
|--------|-----------------|
| `header/presets/brand-nav-actions.njk` | `announcement`, `brand`, `nav`, `actions` |
| `header/presets/brand-nav.njk` | `announcement`, `brand`, `nav` |
| `header/presets/centered-nav.njk` | `announcement`, `brand`, `nav` |
| `header/presets/utility-brand-nav.njk` | `announcement`, `utility-links`, `brand`, `nav` |
| `header/slots/mobile-drawer.njk` | `utility-links`, `actions` |

Slots: `announcement`, `brand`, `nav`, `actions`, `utility-links` — alles statische Pfade, keine Variablen.

Phase-9-Strategie: Die Preset/Slot-Struktur bleibt intern als Dateien. Nur der Einstiegspunkt
(`topNavigation.njk`) wird nach außen als `{% siteHeader site %}` Shortcode gekapselt.
Preset-Auswahl und Slot-Includes bleiben file-basiert — der Custom-Loader aus Task 55
deckt diese ab (auch wenn heute keine Sub-Includes in Komponenten existieren, sind
Header/Footer-Slot-Includes eine weitere Anwendung davon).

### `_includes/footerGlobal.njk` (Footer-Dispatcher)

Wählt per `if/elif`-Kette das aktive Footer-Preset aus:

| Zeile | Include | Dynamisch? | Phase-9-Strategie |
|-------|---------|-----------|-------------------|
| 7 | `footer/presets/columns.njk` | nein (bedingt) | internes Detail von `{% siteFooter %}` |
| 9 | `footer/presets/columns-social.njk` | nein (bedingt) | internes Detail |
| 11 | `footer/presets/columns-cta.njk` | nein (bedingt) | internes Detail |
| 13 | `footer/presets/editorial.njk` | nein (bedingt) | internes Detail |
| 15 | `footer/presets/simple.njk` | nein (bedingt) | internes Detail |

### Footer-Presets → Slots

| Preset | Slots |
|--------|-------|
| `footer/presets/columns.njk` | `intro`, `groups`, `bottom` |
| `footer/presets/columns-social.njk` | `intro`, `social`, `groups`, `bottom` |
| `footer/presets/columns-cta.njk` | `cta-block`, `intro`, `groups`, `bottom` |
| `footer/presets/editorial.njk` | `intro`, `social`, `contact`, `groups`, `bottom` |
| `footer/presets/simple.njk` | `intro`, `contact`, `bottom` |

Footer-Slots: `intro`, `groups`, `bottom`, `social`, `contact`, `cta-block` — alle statisch.

### Content-Layouts (Placeholder-Dispatcher)

| Datei | Include | Häufigkeit | Phase-9-Strategie |
|-------|---------|------------|-------------------|
| `content_1col.njk` | `./placeholder.njk` (1×) | hot path | bleibt — wird via Shortcode in Cluster 1 gelöst |
| `content_2col_main_left.njk` | `./placeholder.njk` (2×) | mittel | dto. |
| `content_2col_main_right.njk` | `./placeholder.njk` (2×) | mittel | dto. |
| `content_3col_main_center.njk` | `./placeholder.njk` (3×) | selten | dto. |
| `footerNavigation.njk` | `./placeholder.njk` (1×) | mittel | dto. |

---

## Cluster 5 — Macros (`{% import %}` / `{% from %}`)

**Befund:** 0 Treffer. Keine Macro-Imports in Templates vorhanden.
Task 58 (Macros evaluieren) ist minimal — kein Bestand zu migrieren.

---

## Cluster 6 — Sonstiges

| Datei | Include | Anmerkung |
|-------|---------|-----------|
| `_includes/topNavigation copy.njk` | (enthält Header-Includes, exakt wie `topNavigation.njk`) | **Dead file** — sollte vor Phase 9 entfernt werden |
| `_includes/topNavigation_temp.njk` | (enthält Header-Includes) | **Dead file** — sollte vor Phase 9 entfernt werden |

---

## Zusammenfassung Phase-9-Arbeitsaufwand

| Task | Inhalt | Befund | Aufwand |
|------|--------|--------|---------|
| 54 `renderComponent` | `{% renderFile %}` in `placeholder.njk` → project-first Resolver | ✅ erledigt — `resolveComponentTemplatePath`-Filter + `src/components/resolver.js` | — |
| 55 Custom Loader | Sub-Includes in Komponenten | **0 in Komponenten**, aber Header/Footer-Slot-Includes brauchen es | mittel |
| 56 Layout-Aliases | `{% extends %}` + Frontmatter `layout:` | 0 extends, 1 Layout (`base.njk`) | minimal |
| 57 Globale Partials | Header/Footer aus `base.njk` | 5 Shortcodes (`siteMeta`, `siteHeadAssets`, `siteHeader`, `siteFooter`, `siteFooterNav`) | mittel |
| 58 Macros | `{% import %}` / `{% from %}` | **0 Treffer** | keine Arbeit |
| 59 Verifikation | Build ohne prepareBuildContext | nach 54–58 | mittel |

**Gesamt-Befund:** Deutlich weniger Aufwand als im Plan geschätzt. Keine dynamischen
`{% include %}` in Komponenten, keine Macros, nur ein Layout. Kritischer Pfad:
Cluster 1 (Dispatcher), Cluster 4 (Header/Footer-Shortcodes), und der Custom-Loader
für Header/Footer-Slot-Includes.

Die zwei Dead-Files (`topNavigation copy.njk`, `topNavigation_temp.njk`) sollten
vor Start von Task 57 entfernt werden.
