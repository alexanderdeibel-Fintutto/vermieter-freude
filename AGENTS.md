# AGENTS.md — Vermietify

> **Für jeden Agenten, der an diesem Repository arbeitet: Diese Datei ZUERST lesen.**
> Sie ist die einzige Quelle der Wahrheit für Architektur, Deployment und kritische Regeln.

---

## 1. Vercel Kostenoptimierung

Die `vercel.json` enthält einen `ignoreCommand`, der sicherstellt, dass Vercel nur dann baut, wenn sich tatsächlich Dateien geändert haben. Dieser Befehl darf **niemals** entfernt werden.

**Kritische Regel:** Niemals direkt auf `main` pushen, um etwas auszuprobieren. Feature-Branches (`feature/fix-name`) verwenden.

---

## 2. Regressionstests — Pflicht vor Änderungen an kritischen Dateien

Vor jeder Änderung an den Kern-Dateien (Abschnitt 3) MÜSSEN die Regressionstests lokal grün sein:

```bash
npm run test
# oder direkt:
./node_modules/.bin/vitest run src/test/regression/ --reporter=verbose
```

**Wenn ein Test rot wird: KEIN Commit, KEIN Push.**

---

## 3. Kritische Stellen — Diese Dateien niemals ohne Tests ändern

### 3a. `src/config/plans.ts`

Die **einzige Quelle der Wahrheit** für alle Plan-Limits.

| Plan | properties | units | portalCredits |
|---|---|---|---|
| `starter` | `1` | `5` | `3` |
| `basic` | `3` | `25` | `10` |
| `professional` | `10` | `100` | `50` |
| `enterprise` | `-1` (∞) | `-1` (∞) | `-1` (∞) |

**Invarianten:**
- `-1` bedeutet immer "unbegrenzt" — darf nicht auf eine feste Zahl geändert werden.
- Höhere Pläne müssen immer mehr Limits haben als niedrigere.
- Starter-Plan hat genau 3 portalCredits — nicht mehr (würde Basic entwerten).

### 3b. `src/lib/validationSchemas.ts`

Validierungsregeln für alle Formulare.

**Was niemals geändert werden darf:**
- `POSTAL_CODE_PATTERN`: Genau 5 Ziffern (`/^[0-9]{5}$/`)
- `MIN_YEAR`: `1800` (älteste erlaubte Baujahre)
- Gebäudetypen-Enum: `['apartment', 'house', 'commercial', 'mixed']` — alle 4 müssen vorhanden sein

### 3c. `src/hooks/useSubscription.tsx`

Subscription-Logik. Wenn kein Plan gefunden wird, **muss** auf den Starter-Plan zurückgefallen werden — niemals auf Enterprise oder null.

---

## 4. Architektur

```
src/
├── config/plans.ts          ← Plan-Registry (kritisch)
├── lib/validationSchemas.ts ← Validierungsregeln (kritisch)
├── hooks/useAuth.tsx        ← Authentifizierung
├── hooks/useSubscription.tsx← Plan-Zuordnung (kritisch)
├── hooks/useRoles.ts        ← Rollen & Berechtigungen
├── components/              ← UI-Komponenten
└── pages/                   ← Seiten-Komponenten
```

---

## 5. Neue Bugs dokumentieren

Wenn du einen Bug in einer kritischen Datei fixst:

1. Test in `src/test/regression/core-logic.test.ts` schreiben
2. Bug in Abschnitt 3 dokumentieren
3. Commit-Message mit `[REG-XXX]` kennzeichnen

---

## 6. CI-Workflow aktivieren (einmalig)

```bash
cp docs/workflows/ci-with-regression-guard.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: activate regression guard workflow"
git push
```
