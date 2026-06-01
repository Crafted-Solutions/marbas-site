# marbas-basic-example

Beispielprojekt für [marbas-site](../../README.md).

Dieses Projekt zeigt die grundlegende Struktur einer Marbas-Website und
demonstriert alle eingebauten Komponenten.

## Voraussetzungen

`marbas-site` muss global installiert oder via `npx` verfügbar sein.

## Build

```bash
marbas-site build /pfad/zu/examples/basic --env=development
```

Output liegt in `build/public_development/`.

## Preview

```bash
marbas-site preview /pfad/zu/examples/basic --env=development
```

## Projektstruktur

```
marbas-basic-example/
├── marbas-project.json   # Projekt-Konfiguration (Environments, Build-Pfade)
├── pages/                # Website-Seiten als Markdown-Dateien
│   ├── _data/site.json   # Globale Site-Konfiguration (Titel, Header, Footer)
│   ├── index.md          # Startseite
│   └── showcase/
│       └── index.md      # Komponenten-Demo
├── _components/          # Eigene Komponenten (leer — Lib-Defaults aktiv)
├── _theme/               # Theme-Anpassungen (leer — Lib-Default-Theme aktiv)
└── _media/               # Nutzer-Medien (Bilder, Videos)
```
