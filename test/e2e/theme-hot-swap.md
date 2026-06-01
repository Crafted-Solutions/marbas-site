# Theme-Hot-Swap Validierung

**Datum:** 2026-05-21  
**Task:** 45-theme-hot-swap-validierung  
**Ergebnis: Stabil — Hot-Swap-Pfad bleibt Default**

---

## Implementierungsanalyse

### Datenpfade (kein Webpack-Konflikt)

`setActiveTheme` schreibt ausschließlich in `<output>/_assets/css/theme.css`.  
Webpack schreibt niemals in `theme.css` — die MiniCssExtractPlugin-Ausgabe
geht nach `css/lib.bundle.css` und `css/custom.bundle.css`. Die CopyPlugin-Patterns
erfassen nur `_assets/images`, `_assets/fonts` und `_assets/favicons`.

→ **Keine Race-Condition zwischen Webpack-Rebuild und Theme-Swap.**

### Atomischer Schreibpfad

`setActiveTheme` verwendet Copy-then-Rename:
```
fs.copyFileSync(src, theme.css.tmp)
fs.renameSync(theme.css.tmp, theme.css)
```
POSIX-Rename ist atomar. Browser sieht entweder das alte oder das neue Theme —
kein halb-geschriebener Zustand.

### Live-Reload durch Eleventy-Dev-Server

Eleventy v3 (`@11ty/eleventy-dev-server`) beobachtet das Output-Verzeichnis.
CSS-Änderungen werden per CSS-Injection (ohne Full-Page-Reload) an den Browser
geschickt. Da `theme.css` im Output-Dir liegt, registriert der Watcher die
Dateiänderung nach jedem `setActiveTheme`-Aufruf.

---

## Automatisierter Smoke-Test

Datei: `test/preview/theme-swap.test.js`

- Startet eine minimale HTTP-Dateiablage gegen das Output-Dir
- Prüft: GET `/_assets/css/theme.css` → Inhalt von Theme A
- Ruft `setActiveTheme` auf (Theme B)
- Prüft: GET `/_assets/css/theme.css` → Inhalt von Theme B (unterschiedlich)
- Validiert atomische Rename-Eigenschaft (kein `.tmp`-Rückstand)

Ergebnis: **Alle Tests grün.**

---

## Manuelle Browser-Validierung (noch ausstehend)

Folgende Schritte sind manuell zu bestätigen, bevor Task 45 auf `done` gesetzt wird:

1. Fixture-Projekt mit `theme-atelier`, `theme-bloom`, `theme-default` starten:
   ```bash
   marbas-site preview <projekt-pfad> --env=development
   ```
2. Browser öffnen auf `http://localhost:3001/`
3. `setActiveTheme({ projectPath, themeId: 'atelier', environment: 'development' })` aufrufen  
   → Browser zeigt CSS-Hot-Reload ohne Page-Reload
4. Wechsel zu `theme-bloom`, zurück zu `theme-default` — je 1×
5. Gleichzeitig: Komponenten-Datei in `_components/` bearbeiten (Webpack rebuild)
   + Theme wechseln in schneller Folge → kein Half-State

---

## Varianten-Defaults-Hinweis (Task 09)

Theme-Wechsel darf **nicht** automatisch Variant-Defaults überschreiben.
Die Soft-Default-Logik aus Task 09 (`applyVariantDefaultsToSiteSettings`) wird
nur auf User-Bestätigung hin angewandt. `setActiveTheme` berührt diese Daten
nicht — es schreibt ausschließlich `theme.css`.

---

## Entscheidung

| Frage | Antwort |
|-------|---------|
| Hot-Swap stabil (kein Webpack-Konflikt)? | ✅ Ja |
| Atomisches Schreiben? | ✅ Ja |
| Live-Reload via Eleventy? | ✅ Ja (Standard-Verhalten) |
| Fallback (Preview-Restart) nötig? | ❌ Nein |
| `restartOnThemeChange` aktivieren? | ❌ Nein |

**Hot-Swap-Pfad bleibt Default. Kein Restart-Fallback erforderlich.**
