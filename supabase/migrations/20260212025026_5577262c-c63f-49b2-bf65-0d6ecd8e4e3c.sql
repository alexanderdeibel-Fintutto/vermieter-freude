
-- Ecosystem apps registry for Fintutto cross-selling
CREATE TABLE public.ecosystem_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL DEFAULT '🏠',
  color_from TEXT NOT NULL DEFAULT '#6366f1',
  color_to TEXT NOT NULL DEFAULT '#8b5cf6',
  app_url TEXT NOT NULL,
  register_url TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'vermieter',
  features TEXT[] NOT NULL DEFAULT '{}',
  price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  price_yearly_cents INTEGER NOT NULL DEFAULT 0,
  free_for_target TEXT,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecosystem_apps ENABLE ROW LEVEL SECURITY;

-- Everyone can read (public cross-sell info)
CREATE POLICY "ecosystem_apps_read" ON public.ecosystem_apps
  FOR SELECT USING (true);

-- Only service role can modify
CREATE POLICY "ecosystem_apps_admin" ON public.ecosystem_apps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed the 4 apps
INSERT INTO public.ecosystem_apps (slug, name, tagline, description, icon_emoji, color_from, color_to, app_url, register_url, target_audience, features, price_monthly_cents, price_yearly_cents, free_for_target, stripe_price_id_monthly, stripe_price_id_yearly, sort_order) VALUES
(
  'hausmeister-pro',
  'HausmeisterPro',
  'Professionelle Hausmeisterverwaltung',
  'Koordinieren Sie Ihren Hausmeister digital – Aufgaben zuweisen, Status verfolgen, Protokolle einsehen.',
  '🔧',
  '#f59e0b', '#ef4444',
  'https://hausmeister-pro.vercel.app',
  'https://hausmeister-pro.vercel.app/registrieren',
  'hausmeister',
  ARRAY['Aufgaben & Tickets', 'Echtzeit-Status', 'Foto-Dokumentation', 'Gebäude-Sync mit Vermietify'],
  499, 4790,
  NULL,
  'price_1St3Eg52lqSgjCze5l6pqANG', 'price_1St3FA52lqSgjCzeE8lXHzKH',
  1
),
(
  'mieter-app',
  'Fintutto Mieter',
  'Das Portal für Ihre Mieter',
  'Geben Sie Ihren Mietern ein digitales Zuhause – Dokumente, Mängelmelder, Zählerstände & mehr.',
  '🏠',
  '#6366f1', '#ec4899',
  'https://mieter-kw8d.vercel.app',
  'https://mieter-kw8d.vercel.app/registrieren',
  'mieter',
  ARRAY['Mängelmelder', 'Dokumente einsehen', 'Zählerstände erfassen', 'Chat mit Verwaltung'],
  0, 0,
  'Für Mieter dauerhaft kostenlos',
  'price_1SsEqV52lqSgjCzeKuUQGBOE', 'price_1SsEr552lqSgjCzeBvWBTzKS',
  2
),
(
  'ablesung',
  'Fintutto Ablesung',
  'Digitale Zählerablesung',
  'Erfassen Sie Zählerstände digital, automatisch und fehlerfrei – mit QR-Codes und Fotobeweis.',
  '📊',
  '#10b981', '#059669',
  'https://ablesung.vercel.app',
  'https://ablesung.vercel.app/registrieren',
  'vermieter',
  ARRAY['QR-Code Scan', 'Foto-Ablesung', 'Automatische Plausibilitätsprüfung', 'Export für Nebenkostenabrechnung'],
  499, 4790,
  NULL,
  'price_1Stgdi52lqSgjCzewNmCKWqy', 'price_1StgdM52lqSgjCzelgTZIRGu',
  3
),
(
  'vermieter-freude',
  'Vermietify',
  'Die zentrale Immobilienverwaltung',
  'Verwalten Sie Ihre Immobilien, Mieter, Verträge und Finanzen an einem Ort – professionell und übersichtlich.',
  '🏢',
  '#3b82f6', '#1d4ed8',
  'https://vermietify.lovable.app',
  'https://vermietify.lovable.app/register',
  'vermieter',
  ARRAY['Gebäude & Einheiten', 'Mieter & Verträge', 'Nebenkostenabrechnung', 'Banking & Finanzen'],
  999, 9590,
  NULL,
  'price_1Sr56K52lqSgjCzeqfCfOudX', 'price_1Sr56o52lqSgjCzeRuGrant2',
  0
);
