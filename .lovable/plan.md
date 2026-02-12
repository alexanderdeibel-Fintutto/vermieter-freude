
# Hausmeister-Tab mit Einladungssystem

## Uebersicht
Neuer "Hausmeister"-Reiter auf der Gebaude-Detailseite, ueber den Hausmeister zu einem Gebaeude eingeladen und verwaltet werden koennen. Einladungen erfolgen per E-Mail mit einem freundlichen Text, der auf die kostenlose Nutzung der Hausmeister Pro App hinweist.

## Aenderungen

### 1. Datenbank: Neue Tabelle `building_caretakers`
- `id` (UUID, PK)
- `building_id` (FK -> buildings)
- `organization_id` (FK -> organizations)
- `email` (text, nicht null)
- `first_name`, `last_name` (text, optional)
- `phone` (text, optional)
- `status` (enum: invited, active, inactive)
- `invited_at`, `accepted_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

RLS-Policies: Nur Nutzer der gleichen Organisation koennen CRUD-Operationen durchfuehren.

### 2. Edge Function: `send-caretaker-invite`
- Empfaengt eine Liste von E-Mail-Adressen, die Gebaeude-ID und den Organisationsnamen
- Erstellt fuer jede E-Mail einen Eintrag in `building_caretakers` mit Status "invited"
- Sendet pro E-Mail eine freundliche Einladungsmail mit folgendem Inhalt:
  - Verwalter-Name (Organisation) hat eingeladen
  - Hausmeister Pro App kostenlos ausprobieren
  - Kostenlos fuer ein Gebaeude, vereinfacht Kommunikation zwischen Verwalter, Hausmeister und Mieter
- Nutzt den bestehenden E-Mail-Logging-Ansatz (email_log Tabelle)

### 3. Neue Komponente: `BuildingCaretakersTab`
- Zeigt alle zugewiesenen Hausmeister des Gebaeudes (Name, E-Mail, Telefon, Status-Badge)
- Button "Hausmeister einladen" oeffnet einen Dialog
- Statusanzeige: Eingeladen / Aktiv / Inaktiv
- Loeschen/Entfernen von Hausmeistern

### 4. Neue Komponente: `CaretakerInviteDialog`
- Eingabefeld fuer mehrere E-Mail-Adressen (kommagetrennt oder Zeile fuer Zeile)
- Optionale Felder: Vorname, Nachname, Telefon pro Eintrag
- Vorschau der Einladungsmail
- Button "Einladungen senden"

### 5. BuildingDetail.tsx anpassen
- Neuer Tab "Hausmeister" (mit Wrench-Icon) zwischen "Zaehler" und "Dokumente"
- TabsList von 5 auf 6 Spalten erweitern

## Technische Details

### Migration SQL
```sql
CREATE TABLE public.building_caretakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (building_id, email)
);

ALTER TABLE building_caretakers ENABLE ROW LEVEL SECURITY;

-- RLS: Org-basierter Zugriff
CREATE POLICY "Users can manage caretakers in their org"
  ON building_caretakers FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id(auth.uid()))
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- updated_at Trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON building_caretakers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Org-ID-Schutz
CREATE TRIGGER prevent_org_id_change
  BEFORE UPDATE ON building_caretakers
  FOR EACH ROW EXECUTE FUNCTION prevent_organization_id_change();
```

### Edge Function: `send-caretaker-invite/index.ts`
- Authentifiziert den Nutzer via Bearer-Token
- Laedt Organisationsname und Gebaeudedaten
- Erstellt Eintraege in `building_caretakers`
- Loggt E-Mails in `email_log` mit HTML-Template das den Einladungstext enthaelt

### Dateien
| Datei | Aktion |
|-------|--------|
| `supabase/migrations/...` | Neue Migration fuer `building_caretakers` |
| `supabase/functions/send-caretaker-invite/index.ts` | Neue Edge Function |
| `supabase/config.toml` | Neuen Function-Eintrag hinzufuegen |
| `src/components/buildings/BuildingCaretakersTab.tsx` | Neue Komponente |
| `src/components/buildings/CaretakerInviteDialog.tsx` | Neue Komponente |
| `src/pages/buildings/BuildingDetail.tsx` | Tab hinzufuegen |
| `src/hooks/useCaretakers.ts` | Neuer Hook fuer CRUD-Operationen |
