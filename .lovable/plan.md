

# Integration externer Rechner-Apps in Vermietify

## Zusammenfassung

Die externen Rechner-Apps (Mietenplus-Rechner, Property Costs, Betriebskosten-Helfer und weitere) werden per **Deep-Link mit Auto-Login** in Vermietify eingebunden. Da alle Apps dieselbe Datenbank nutzen, teilen sich die Nutzer automatisch ihre Gebaeude- und Mieterdaten. Die Rechner werden ueber die Sidebar-Navigation unter "Rechner" erreichbar sein.

## Architektur-Ueberblick

Die Loesung besteht aus drei Teilen:

1. **Datenbank-Registry**: Eine Tabelle `calculator_apps`, die alle verfuegbaren Rechner-Apps mit ihren URLs verwaltet
2. **Token-Weitergabe**: Ein Mechanismus, der den aktuellen Auth-Token sicher an die externe App uebergibt, sodass der Nutzer dort automatisch eingeloggt ist
3. **Kontext-Weitergabe**: Gebaeude-ID und Organisations-ID werden per URL-Parameter mitgegeben, damit die externe App sofort den richtigen Kontext zeigt

## Ablauf fuer den Nutzer

1. Nutzer klickt in der Vermietify-Sidebar auf "Rechner" und waehlt z.B. "Mietenplus-Rechner"
2. Es oeffnet sich eine Zwischenseite mit Gebaeude-Auswahl (optional) und einem "Rechner oeffnen"-Button
3. Klick oeffnet die externe App in einem neuen Tab mit Token und Kontext in der URL
4. Die externe App liest den Token, setzt die Session, und zeigt die Gebaeude des Nutzers
5. Berechnungen und Daten, die der Nutzer dort eingibt, landen in der gemeinsamen Datenbank und sind automatisch auch in Vermietify sichtbar

## Technische Details

### Schritt 1: Datenbank-Tabelle `calculator_apps`

Neue Tabelle zur Verwaltung der Rechner-Apps:

```text
calculator_apps
---------------------------------
id             UUID (PK)
slug           TEXT (unique) -- z.B. "mietenplus", "betriebskosten-helfer"
name           TEXT          -- Anzeigename
description    TEXT          -- Kurzbeschreibung
app_url        TEXT          -- Basis-URL der externen App
icon_name      TEXT          -- Lucide-Icon-Name
sort_order     INT           -- Reihenfolge in der Navigation
is_active      BOOLEAN       -- Ob der Rechner sichtbar ist
category       TEXT          -- Kategorie (z.B. "miete", "nebenkosten", "energie")
created_at     TIMESTAMP
updated_at     TIMESTAMP
```

RLS-Policy: Alle eingeloggten Nutzer duerfen lesen. Nur Admins duerfen Eintraege verwalten.

Initiale Eintraege:
- CO2-Kostenrechner (intern, URL: `/co2`)
- Mietenplus-Rechner (extern)
- Property Costs / Betriebskosten-Helfer (extern)

### Schritt 2: Rechner-Hub-Seite (`/rechner`)

Eine neue Seite, die alle verfuegbaren Rechner als Karten anzeigt:

- Zeigt Name, Beschreibung und Icon jedes Rechners
- Bei internen Rechnern (wie CO2): Direkter Link zur internen Route
- Bei externen Rechnern: Gebaeude-Auswahl-Dropdown + "Oeffnen"-Button
- Badge "Intern" vs. "Extern" zur Orientierung

### Schritt 3: Token-Weitergabe-Mechanismus

Wenn ein externer Rechner geoeffnet wird:

1. Aktuellen `access_token` aus der Supabase-Session holen
2. URL zusammenbauen: `{app_url}?token={access_token}&building_id={selected_building_id}&org_id={org_id}`
3. Externe App wird in neuem Browser-Tab geoeffnet (`window.open`)
4. Die externe App nutzt `supabase.auth.setSession()` mit dem uebergebenen Token

Hinweis: Da alle Apps denselben Supabase-Backend nutzen, ist der Token direkt gueltig. Kein zusaetzlicher Auth-Service noetig.

### Schritt 4: Navigation anpassen

Die Sidebar unter "Rechner" wird dynamisch aus der `calculator_apps`-Tabelle befuellt:

- Statischer Fallback fuer den Fall, dass die DB-Abfrage fehlschlaegt
- Interne Rechner verlinken direkt auf die Route
- Externe Rechner verlinken auf `/rechner/{slug}` (Zwischenseite mit Gebaeude-Auswahl)
- Neuer Unterpunkt "Alle Rechner" als Uebersichtsseite

### Schritt 5: Hook `useCalculatorApps`

Neuer Hook zum Laden der Rechner-Apps:

- Laed die aktiven Rechner aus der `calculator_apps`-Tabelle
- Stellt eine Funktion `openExternalApp(slug, buildingId?)` bereit
- Handhabt Token-Erstellung und URL-Aufbau
- Fallback auf statische Liste, wenn DB nicht erreichbar

### Schritt 6: Einzelner Rechner-Launcher (`/rechner/:slug`)

Zwischenseite fuer externe Rechner:

- Zeigt Name und Beschreibung des Rechners
- Dropdown mit allen Gebaeuden des Nutzers (aus `buildings`-Tabelle)
- "Rechner oeffnen"-Button, der den externen Link mit Token und Building-ID oeffnet
- Hinweis-Text: "Ihre Daten sind in beiden Apps synchronisiert"

## Neue Dateien

| Datei | Zweck |
|---|---|
| Migration SQL | Tabelle `calculator_apps` + Seed-Daten |
| `src/hooks/useCalculatorApps.ts` | Hook fuer Rechner-Daten + Launcher-Logik |
| `src/pages/rechner/CalculatorHub.tsx` | Uebersicht aller Rechner |
| `src/pages/rechner/CalculatorLauncher.tsx` | Zwischenseite mit Gebaeude-Auswahl |

## Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Dynamische Rechner-Unterpunkte aus DB laden |
| `src/App.tsx` | Neue Routen `/rechner` und `/rechner/:slug` |

## Sicherheitsaspekte

- Der Token wird nur via URL-Fragment (#) oder kurzlebiger Query-Parameter uebergeben und erscheint nicht in Server-Logs
- Externe Apps validieren den Token serverseitig ueber `supabase.auth.getUser()`
- RLS-Policies stellen sicher, dass jeder Nutzer nur seine eigenen Gebaeude sieht -- sowohl in Vermietify als auch in den externen Apps
- Tokens sind standardmaessig kurzlebig (1 Stunde); die externe App kann bei Bedarf refreshen

## Voraussetzungen auf Seite der externen Apps

Damit die Deep-Link-Integration funktioniert, muessen die externen Rechner-Apps:
1. Den `token`-URL-Parameter auslesen und via `supabase.auth.setSession()` die Session setzen
2. Den `building_id`-Parameter auslesen und das entsprechende Gebaeude vorselektieren
3. Dieselbe Supabase-Instanz (gleiche URL + Anon Key) verwenden

Da du erwaehnt hast, dass alle Apps bereits an dieselbe Datenbank angebunden sind, ist Punkt 3 bereits erfuellt. Punkte 1 und 2 erfordern kleine Anpassungen in den externen Apps (Token-Empfang beim Laden der App).

