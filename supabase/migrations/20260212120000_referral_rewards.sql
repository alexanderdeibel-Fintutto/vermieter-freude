-- #12: Referral-Belohnungen fuer Vermietify
-- Upgrade von reinem Tracking auf echte Belohnungen: 1 Monat gratis fuer BEIDE Seiten

-- Add reward columns to existing ecosystem_referrals table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecosystem_referrals' AND column_name = 'reward_type') THEN
    ALTER TABLE public.ecosystem_referrals ADD COLUMN reward_type TEXT DEFAULT 'free_month';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecosystem_referrals' AND column_name = 'reward_applied_referrer') THEN
    ALTER TABLE public.ecosystem_referrals ADD COLUMN reward_applied_referrer BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecosystem_referrals' AND column_name = 'reward_applied_referred') THEN
    ALTER TABLE public.ecosystem_referrals ADD COLUMN reward_applied_referred BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecosystem_referrals' AND column_name = 'stripe_coupon_id_referrer') THEN
    ALTER TABLE public.ecosystem_referrals ADD COLUMN stripe_coupon_id_referrer TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecosystem_referrals' AND column_name = 'stripe_coupon_id_referred') THEN
    ALTER TABLE public.ecosystem_referrals ADD COLUMN stripe_coupon_id_referred TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecosystem_referrals' AND column_name = 'reward_applied_at') THEN
    ALTER TABLE public.ecosystem_referrals ADD COLUMN reward_applied_at TIMESTAMPTZ;
  END IF;
END $$;

-- Referral reward configuration for Vermietify
CREATE TABLE IF NOT EXISTS public.referral_reward_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_type TEXT NOT NULL DEFAULT 'free_month',
  reward_description TEXT NOT NULL DEFAULT '1 Monat gratis fuer beide Seiten',
  referrer_gets TEXT NOT NULL DEFAULT '1 Monat Basic gratis (Wert: 9.99 EUR)',
  referred_gets TEXT NOT NULL DEFAULT '1 Monat Basic gratis (Wert: 9.99 EUR)',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.referral_reward_config (reward_type, reward_description, referrer_gets, referred_gets)
VALUES ('free_month', '1 Monat gratis fuer beide Seiten', '1 Monat Basic gratis (Wert: 9.99 EUR)', '1 Monat Basic gratis (Wert: 9.99 EUR)')
ON CONFLICT DO NOTHING;
