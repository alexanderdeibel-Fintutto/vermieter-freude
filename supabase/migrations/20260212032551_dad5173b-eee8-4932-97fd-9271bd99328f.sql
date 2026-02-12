
-- Referral tracking table for ecosystem app invitations
CREATE TABLE public.ecosystem_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL,
  app_slug TEXT NOT NULL,
  app_name TEXT NOT NULL,
  invited_email TEXT NOT NULL,
  invited_name TEXT,
  invited_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'email', -- email, link, manual
  status TEXT NOT NULL DEFAULT 'sent', -- sent, clicked, registered, active
  clicked_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_ecosystem_referrals_org ON public.ecosystem_referrals(organization_id);
CREATE INDEX idx_ecosystem_referrals_status ON public.ecosystem_referrals(status);
CREATE INDEX idx_ecosystem_referrals_app ON public.ecosystem_referrals(app_slug);

-- RLS
ALTER TABLE public.ecosystem_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org referrals"
ON public.ecosystem_referrals FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create referrals for own org"
ON public.ecosystem_referrals FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update own org referrals"
ON public.ecosystem_referrals FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_ecosystem_referrals_updated_at
BEFORE UPDATE ON public.ecosystem_referrals
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
