-- Create finapi_connections table
CREATE TABLE public.finapi_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  finapi_user_id TEXT,
  bank_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_logo_url TEXT,
  bank_bic TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'update_required', 'disconnected')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.finapi_connections(id) ON DELETE CASCADE,
  finapi_account_id TEXT,
  iban TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'credit_card', 'loan', 'securities', 'other')),
  balance_cents INTEGER NOT NULL DEFAULT 0,
  balance_date TIMESTAMP WITH TIME ZONE,
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank_transactions table
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  finapi_transaction_id TEXT,
  booking_date DATE NOT NULL,
  value_date DATE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  counterpart_name TEXT,
  counterpart_iban TEXT,
  purpose TEXT,
  booking_text TEXT,
  transaction_type TEXT DEFAULT 'other' CHECK (transaction_type IN ('rent', 'deposit', 'utility', 'maintenance', 'other')),
  matched_payment_id UUID,
  matched_tenant_id UUID REFERENCES public.tenants(id),
  matched_lease_id UUID REFERENCES public.leases(id),
  match_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('unmatched', 'auto', 'manual', 'ignored')),
  match_confidence NUMERIC,
  matched_at TIMESTAMP WITH TIME ZONE,
  matched_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_rules table
CREATE TABLE public.transaction_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_type TEXT NOT NULL CHECK (action_type IN ('assign_tenant', 'book_as', 'ignore')),
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  match_count INTEGER NOT NULL DEFAULT 0,
  last_match_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.finapi_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finapi_connections
CREATE POLICY "Users can view connections in their organization"
ON public.finapi_connections FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create connections in their organization"
ON public.finapi_connections FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update connections in their organization"
ON public.finapi_connections FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete connections in their organization"
ON public.finapi_connections FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for bank_accounts
CREATE POLICY "Users can view accounts in their organization"
ON public.bank_accounts FOR SELECT
USING (connection_id IN (
  SELECT id FROM public.finapi_connections 
  WHERE organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can create accounts in their organization"
ON public.bank_accounts FOR INSERT
WITH CHECK (connection_id IN (
  SELECT id FROM public.finapi_connections 
  WHERE organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can update accounts in their organization"
ON public.bank_accounts FOR UPDATE
USING (connection_id IN (
  SELECT id FROM public.finapi_connections 
  WHERE organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can delete accounts in their organization"
ON public.bank_accounts FOR DELETE
USING (connection_id IN (
  SELECT id FROM public.finapi_connections 
  WHERE organization_id = public.get_user_organization_id(auth.uid())
));

-- RLS Policies for bank_transactions
CREATE POLICY "Users can view transactions in their organization"
ON public.bank_transactions FOR SELECT
USING (account_id IN (
  SELECT ba.id FROM public.bank_accounts ba
  JOIN public.finapi_connections fc ON ba.connection_id = fc.id
  WHERE fc.organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can create transactions in their organization"
ON public.bank_transactions FOR INSERT
WITH CHECK (account_id IN (
  SELECT ba.id FROM public.bank_accounts ba
  JOIN public.finapi_connections fc ON ba.connection_id = fc.id
  WHERE fc.organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can update transactions in their organization"
ON public.bank_transactions FOR UPDATE
USING (account_id IN (
  SELECT ba.id FROM public.bank_accounts ba
  JOIN public.finapi_connections fc ON ba.connection_id = fc.id
  WHERE fc.organization_id = public.get_user_organization_id(auth.uid())
));

-- RLS Policies for transaction_rules
CREATE POLICY "Users can view rules in their organization"
ON public.transaction_rules FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create rules in their organization"
ON public.transaction_rules FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update rules in their organization"
ON public.transaction_rules FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete rules in their organization"
ON public.transaction_rules FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_finapi_connections_updated_at
  BEFORE UPDATE ON public.finapi_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_transaction_rules_updated_at
  BEFORE UPDATE ON public.transaction_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_bank_transactions_account_id ON public.bank_transactions(account_id);
CREATE INDEX idx_bank_transactions_booking_date ON public.bank_transactions(booking_date);
CREATE INDEX idx_bank_transactions_match_status ON public.bank_transactions(match_status);
CREATE INDEX idx_bank_accounts_connection_id ON public.bank_accounts(connection_id);