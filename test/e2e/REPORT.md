# Lifecycle-Workflows — Validierungsbericht

**Datum:** 2026-05-22
**marbas-site Version:** siehe package.json
**Node Version:** 20+

---

## Automatisierte CLI-Tests (`lifecycle.test.js`)

Ausgeführt mit: `node --test test/e2e/lifecycle.test.js`

| Workflow | Status | Anmerkungen |
|----------|--------|-------------|
| WF1: init creates minimal project structure | ✓ bestanden | |
| WF2: eject copies Hero component into project | ✓ bestanden | Idempotenz geprüft |
| WF3: reset removes ejected component and creates trash backup | ✓ bestanden | |
| WF4: build succeeds after manually deleting an ejected file | ✓ bestanden | Resolver fällt korrekt auf Lib zurück |
| WF5: doctor runs without error on fresh project | ✓ bestanden | |
| WF6: doctor detects version drift | ✓ bestanden | `marbasSite: "0.0.1"` erkannt |

Alle 6 Tests grün.

---

## Manuelle App-Validierung

> Konsumenten-seitige App-Workflows werden als manuelle Validierung
> durchgeführt; ein automatisierter UI-Harness ist für dieses Repo
> bewusst out of scope.

| Workflow | Status |
|----------|--------|
| WF1: Neues Projekt anlegen | ☐ ausstehend |
| WF2: Komponente ejecten | ☐ ausstehend |
| WF3: Ejected Komponente resetten | ☐ ausstehend |
| WF4: App-Watcher bei manueller Löschung | ☐ ausstehend |
| WF5: Doctor-Report identisch zu CLI | ☐ ausstehend |
| WF6: Versions-Drift-Warnung in UI | ☐ ausstehend |

---

## Notizen

- `initProject()` gibt keinen Rückgabewert zurück (void) — Tests prüfen direkt das Filesystem.
- `runDoctor()` gibt `{ checks, hasError }` zurück, kein Plain-Array.
- Legacy-Config `.marbas-site-project.json` wird transparent konvertiert (vgl. `src/project/config.js`).
