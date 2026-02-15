-- Phase 1: Steuer-System - Full Tax Module
-- Tax profiles per year/country
CREATE TABLE IF NOT EXISTS tax_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  country TEXT NOT NULL DEFAULT 'DE' CHECK (country IN ('DE', 'AT', 'CH')),
  tax_number TEXT,
  tax_office_id TEXT,
  tax_office_name TEXT,
  filing_status TEXT DEFAULT 'not_started' CHECK (filing_status IN ('not_started', 'in_progress', 'ready', 'filed', 'accepted', 'rejected')),
  total_income_cents BIGINT DEFAULT 0,
  total_deductions_cents BIGINT DEFAULT 0,
  taxable_income_cents BIGINT DEFAULT 0,
  estimated_tax_cents BIGINT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, tax_year, country)
);

-- Tax declarations
CREATE TABLE IF NOT EXISTS tax_declarations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_profile_id UUID REFERENCES tax_profiles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  form_type TEXT NOT NULL CHECK (form_type IN ('anlage_v', 'anlage_kap', 'anlage_so', 'anlage_vg', 'est', 'ust', 'gew')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'ready', 'submitted', 'accepted', 'rejected', 'amended')),
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  data_json JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tax deductions / Werbungskosten
CREATE TABLE IF NOT EXISTS tax_deductions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('afa', 'maintenance', 'insurance', 'interest', 'property_tax', 'management', 'travel', 'office', 'legal', 'advertising', 'other')),
  description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  document_id UUID,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tax deadlines / Fristen
CREATE TABLE IF NOT EXISTS tax_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline_date DATE NOT NULL,
  country TEXT DEFAULT 'DE',
  form_type TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due_soon', 'overdue', 'completed')),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tax scenarios for comparison
CREATE TABLE IF NOT EXISTS tax_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scenario_data JSONB NOT NULL DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tax form data (structured form fields for Anlage V, KAP, SO etc.)
CREATE TABLE IF NOT EXISTS tax_form_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  declaration_id UUID NOT NULL REFERENCES tax_declarations(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT DEFAULT 'text',
  line_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DATEV connections
CREATE TABLE IF NOT EXISTS datev_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_number TEXT NOT NULL,
  consultant_number TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_direction TEXT DEFAULT 'export' CHECK (sync_direction IN ('export', 'import', 'both')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DATEV sync log
CREATE TABLE IF NOT EXISTS datev_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES datev_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('export', 'import')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Phase 2: Finanz- & Vermögensverwaltung
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_value_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stock', 'etf', 'bond', 'crypto', 'real_estate', 'precious_metal', 'other')),
  name TEXT NOT NULL,
  symbol TEXT,
  quantity NUMERIC(18,8) NOT NULL DEFAULT 0,
  purchase_price_cents BIGINT NOT NULL,
  current_price_cents BIGINT,
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  total_budget_cents BIGINT NOT NULL DEFAULT 0,
  spent_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  planned_cents BIGINT NOT NULL DEFAULT 0,
  actual_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  type TEXT DEFAULT 'outgoing' CHECK (type IN ('incoming', 'outgoing')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  recipient_name TEXT NOT NULL,
  recipient_address TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 19.0,
  tax_cents BIGINT DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price_cents BIGINT NOT NULL,
  total_cents BIGINT NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 19.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wealth_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  real_estate_cents BIGINT DEFAULT 0,
  investments_cents BIGINT DEFAULT 0,
  cash_cents BIGINT DEFAULT 0,
  liabilities_cents BIGINT DEFAULT 0,
  total_net_worth_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 3: Rechner & Kalkulatoren
CREATE TABLE IF NOT EXISTS calculation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  calculator_type TEXT NOT NULL CHECK (calculator_type IN ('afa', 'kaufpreis', 'rendite', 'tilgung', 'cashflow', 'wertentwicklung', 'valuation')),
  name TEXT,
  input_data JSONB NOT NULL DEFAULT '{}',
  result_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS afa_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price_cents BIGINT NOT NULL,
  building_share_percent NUMERIC(5,2) DEFAULT 85.0,
  year_built INTEGER,
  afa_rate NUMERIC(5,2),
  afa_type TEXT DEFAULT 'linear' CHECK (afa_type IN ('linear', 'degressive', 'sonder')),
  remaining_years INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 4: Erweiterte Admin-Features
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id, organization_id)
);

CREATE TABLE IF NOT EXISTS mandants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS module_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, module_id)
);

-- Phase 5: Kommunikation erweitert
CREATE TABLE IF NOT EXISTS bulk_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'letter', 'sms')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  recipient TEXT,
  sender TEXT,
  subject TEXT,
  content_preview TEXT,
  status TEXT,
  tenant_id UUID,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 6: Compliance & Audit
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('dsgvo', 'tax', 'building', 'contract', 'energy', 'fire_safety', 'accessibility')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'warning', 'failed', 'not_applicable')),
  description TEXT NOT NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT DEFAULT 'DE',
  category TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  check_query TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  retention_years INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  legal_basis TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 7: Berichte & Analytics
CREATE TABLE IF NOT EXISTS report_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('financial', 'occupancy', 'maintenance', 'tax', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  recipients JSONB DEFAULT '[]',
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES report_definitions(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generated_data JSONB NOT NULL DEFAULT '{}',
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 8: Import/Export erweitert
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'excel', 'json', 'datev', 'sharepoint', 'google_drive')),
  target_table TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'validating', 'importing', 'completed', 'failed')),
  file_path TEXT,
  mapping_config JSONB DEFAULT '{}',
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sync_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('sharepoint', 'google_drive', 'datev', 'dropbox', 'onedrive')),
  display_name TEXT NOT NULL,
  credentials_encrypted TEXT,
  sync_folder TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 9: Mieter-Portal erweitert
CREATE TABLE IF NOT EXISTS tenant_community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  author_tenant_id UUID,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'marketplace', 'events', 'help', 'announcement')),
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_community_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES tenant_community_posts(id) ON DELETE CASCADE,
  author_tenant_id UUID,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_satisfaction_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES tenant_satisfaction_surveys(id) ON DELETE CASCADE,
  tenant_id UUID,
  answers JSONB NOT NULL DEFAULT '{}',
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_self_service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID,
  request_type TEXT NOT NULL CHECK (request_type IN ('name_change', 'subletting', 'pet_request', 'parking', 'key_copy', 'renovation', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'completed')),
  data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 10: Weitere Module
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  policy_number TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('building', 'liability', 'fire', 'water', 'glass', 'rent_loss', 'legal', 'other')),
  premium_cents BIGINT NOT NULL,
  premium_interval TEXT DEFAULT 'yearly' CHECK (premium_interval IN ('monthly', 'quarterly', 'semi_annual', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  deductible_cents BIGINT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  claim_number TEXT,
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'in_review', 'approved', 'rejected', 'settled')),
  incident_date DATE NOT NULL,
  description TEXT NOT NULL,
  claimed_amount_cents BIGINT,
  settled_amount_cents BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS energy_passports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  passport_type TEXT NOT NULL CHECK (passport_type IN ('demand', 'consumption')),
  energy_class TEXT CHECK (energy_class IN ('A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  primary_energy_kwh NUMERIC(10,2),
  valid_from DATE,
  valid_until DATE,
  issuer TEXT,
  document_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_number TEXT,
  bank_iban TEXT,
  bank_bic TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS owner_buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  share_percent NUMERIC(5,2) DEFAULT 100.0,
  since_date DATE,
  UNIQUE(owner_id, building_id)
);

CREATE TABLE IF NOT EXISTS terminations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lease_id UUID,
  tenant_id UUID,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('tenant', 'landlord', 'mutual')),
  reason TEXT,
  notice_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed', 'completed', 'withdrawn')),
  document_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_form_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE datev_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE datev_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wealth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE afa_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandants ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_self_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Seed default modules
INSERT INTO modules (code, name, description, icon, is_premium) VALUES
  ('core', 'Grundverwaltung', 'Gebäude, Einheiten, Mieter, Verträge', 'Building2', false),
  ('finance', 'Finanzen', 'Zahlungen, Banking, Betriebskosten', 'CreditCard', false),
  ('tax', 'Steuern', 'Steuererklärungen, ELSTER, DATEV', 'Receipt', true),
  ('documents', 'Dokumente', 'Dokumentenverwaltung & OCR', 'FileText', false),
  ('communication', 'Kommunikation', 'E-Mail, WhatsApp, Briefe', 'MessageSquare', false),
  ('automation', 'Automatisierung', 'Workflows & Automatisierungen', 'Zap', true),
  ('analytics', 'Berichte', 'Reports & Analytics', 'BarChart3', true),
  ('compliance', 'Compliance', 'Compliance & Audit', 'Shield', true),
  ('portal', 'Mieter-Portal', 'Self-Service Portal für Mieter', 'Users', true),
  ('calculators', 'Rechner', 'AfA, Rendite, Tilgung etc.', 'Calculator', false),
  ('insurance', 'Versicherungen', 'Versicherungsverwaltung', 'ShieldCheck', true),
  ('energy', 'Energie', 'Energieausweise & Verbrauch', 'Leaf', true)
ON CONFLICT DO NOTHING;

-- Seed default permissions
INSERT INTO permissions (code, name, description, module) VALUES
  ('buildings.read', 'Gebäude lesen', 'Gebäudedaten anzeigen', 'core'),
  ('buildings.write', 'Gebäude bearbeiten', 'Gebäudedaten ändern', 'core'),
  ('tenants.read', 'Mieter lesen', 'Mieterdaten anzeigen', 'core'),
  ('tenants.write', 'Mieter bearbeiten', 'Mieterdaten ändern', 'core'),
  ('contracts.read', 'Verträge lesen', 'Vertragsdaten anzeigen', 'core'),
  ('contracts.write', 'Verträge bearbeiten', 'Vertragsdaten ändern', 'core'),
  ('payments.read', 'Zahlungen lesen', 'Zahlungsdaten anzeigen', 'finance'),
  ('payments.write', 'Zahlungen bearbeiten', 'Zahlungen erfassen', 'finance'),
  ('tax.read', 'Steuern lesen', 'Steuerdaten anzeigen', 'tax'),
  ('tax.write', 'Steuern bearbeiten', 'Steuerdaten ändern', 'tax'),
  ('admin.full', 'Admin Vollzugriff', 'Vollständiger Administrationszugriff', 'core'),
  ('reports.read', 'Berichte lesen', 'Berichte anzeigen', 'analytics'),
  ('reports.write', 'Berichte erstellen', 'Berichte erstellen & ändern', 'analytics'),
  ('compliance.read', 'Compliance lesen', 'Compliance-Daten anzeigen', 'compliance'),
  ('compliance.write', 'Compliance bearbeiten', 'Compliance-Prüfungen durchführen', 'compliance')
ON CONFLICT DO NOTHING;

-- Seed default compliance rules for Germany
INSERT INTO compliance_rules (country, category, rule_name, description, severity) VALUES
  ('DE', 'dsgvo', 'Datenschutzerklärung', 'Mieter müssen eine Datenschutzerklärung erhalten', 'high'),
  ('DE', 'dsgvo', 'Datenminimierung', 'Nur notwendige personenbezogene Daten erheben', 'high'),
  ('DE', 'dsgvo', 'Löschkonzept', 'Personenbezogene Daten nach Zweckerfüllung löschen', 'high'),
  ('DE', 'building', 'Rauchmelder', 'Rauchmelder in allen Schlaf- und Aufenthaltsräumen', 'critical'),
  ('DE', 'building', 'Trinkwasserprüfung', 'Legionellenprüfung alle 3 Jahre bei Großanlagen', 'high'),
  ('DE', 'building', 'Aufzugsprüfung', 'Jährliche Prüfung durch zugelassene Überwachungsstelle', 'critical'),
  ('DE', 'energy', 'Energieausweis', 'Gültiger Energieausweis bei Neuvermietung vorlegen', 'high'),
  ('DE', 'energy', 'Heizkostenabrechnung', 'Jährliche verbrauchsabhängige Heizkostenabrechnung', 'high'),
  ('DE', 'contract', 'Mietpreisbremse', 'Prüfung der Mietpreisbremse bei Neuvermietung', 'medium'),
  ('DE', 'contract', 'Kautionslimit', 'Maximal 3 Nettokaltmieten als Kaution', 'high'),
  ('DE', 'tax', 'Grundsteuer', 'Fristgerechte Grundsteuererklärung', 'high'),
  ('DE', 'tax', 'Umsatzsteuer', 'USt-Voranmeldung bei Option zur Steuerpflicht', 'high'),
  ('DE', 'fire_safety', 'Brandschutzordnung', 'Aktuelle Brandschutzordnung aushängen', 'critical'),
  ('DE', 'fire_safety', 'Fluchtwegeplan', 'Flucht- und Rettungsplan in Mehrfamilienhäusern', 'high')
ON CONFLICT DO NOTHING;
