# Lifecycle-Workflows — Test-Drehbuch

Dieses Drehbuch beschreibt alle zentralen User-Workflows für die manuelle
App-Validierung. Die CLI-Variante wird automatisiert durch `lifecycle.test.js` abgedeckt.

## Vorbereitung

```bash
CLI_BIN="node /path/to/marbas-site/src/cli/bin.js"
PROJECT="/tmp/e2e-marbas-lifecycle"
```

---

## Workflow 1 — Neues Projekt anlegen

**CLI:**
```bash
$CLI_BIN init $PROJECT
```

**Erwartet:**
- Verzeichnis `$PROJECT/` existiert
- Enthält: `marbas-project.json`, `pages/`, `_components/`, `_theme/`, `_media/`
- `pages/_data/site.json` vorhanden mit Default-Site-Konfiguration
- `pages/index.md` vorhanden
- Kein `_includes/`, kein `eleventy.config.js`, kein Webpack-Config im Projekt

**App (manuell):**
- "Neues Projekt"-Dialog → gleicher Pfad → Erstellen
- Erwartete Dateistruktur: identisch zur CLI

---

## Workflow 2 — Komponente ejecten

**CLI:**
```bash
$CLI_BIN eject $PROJECT _components/Hero
```

**Erwartet:**
- `$PROJECT/_components/Hero/Hero.njk` existiert (Kopie aus Lib `_includes/components/Hero`)
- Original in Lib unverändert
- Kein Backup angelegt (Eject ≠ Reset)

**App (manuell):**
- Rechtsklick auf Hero-Komponente → "Anpassen"
- Erwartet: gleiche Datei-Struktur im Projekt

---

## Workflow 3 — Ejected Komponente resetten

**CLI:**
```bash
$CLI_BIN reset $PROJECT _includes/components/Hero
```

**Erwartet:**
- `$PROJECT/_includes/components/Hero/` ist gelöscht
- Backup in `$PROJECT/.marbas/trash/<timestamp>/` vorhanden
- Nächster Build nutzt wieder Lib-Default (kein Fehler)

**App (manuell):**
- Rechtsklick → "Auf Standard zurücksetzen"
- Confirmation-Dialog erscheint
- Nach Bestätigung: Datei weg, Badge verschwindet

---

## Workflow 4 — Manuelles Löschen außerhalb des Tools

**Setup:** Workflow 2 nochmals ausführen (Komponente ejecten).

**CLI:**
```bash
rm -rf $PROJECT/_includes/components/Hero
$CLI_BIN build $PROJECT --env=development
```

**Erwartet:**
- Build läuft ohne Fehler durch
- Resolver fällt auf Lib-Default zurück
- Kein Crash, kein Warning über fehlende Datei

**App (manuell):**
- Datei im Finder löschen (außerhalb der App)
- Badge "angepasst" verschwindet automatisch (Filesystem-Watcher)
- Kein Modal-Dialog, kein Fehler

---

## Workflow 5 — Doctor auf bestehendem Projekt

**CLI:**
```bash
$CLI_BIN doctor $PROJECT
```

**Erwartet:**
- Kein Absturz
- Bericht enthält: Lib-Version, Projekt-Version, Environment-Liste
- Keine falschen Warnungen bei sauberem Projekt

**App (manuell):**
- Doctor-Funktion aufrufen (falls UI vorhanden)
- Erwarteter Report inhaltlich identisch zur CLI-Ausgabe

---

## Workflow 6 — Versions-Drift erkennen

**Setup:**
```bash
# Projekt mit downgrade-Version anlegen
node -e "
const fs = require('fs');
const p = '$PROJECT/marbas-project.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
c.marbasSite = '0.0.1';
fs.writeFileSync(p, JSON.stringify(c, null, 2));
"
$CLI_BIN doctor $PROJECT
```

**Erwartet:**
- `doctor` erkennt Versions-Unterschied und gibt Hinweis aus
- Build läuft trotzdem (gleiche Major-Version)

**Major-Mismatch-Test** (manuell via Script):
- `marbasSite: "99.0.0"` setzen → Build muss sich verweigern mit klarer Meldung

---

## Manuelle Validierungs-Checkliste (App)

Nach Durchführung aller Workflows:

- [ ] WF1: Projektstruktur CLI = App (gleiche Dateien)
- [ ] WF2: Eject CLI = App (gleicher Datei-Pfad, gleicher Inhalt)
- [ ] WF3: Reset CLI = App (Backup vorhanden, Datei weg)
- [ ] WF4: App-Watcher reagiert auf externe Löschung ohne Dialog
- [ ] WF5: Doctor-Report inhaltlich identisch
- [ ] WF6: Versions-Drift wird erkannt

Ergebnisse → `REPORT.md`
