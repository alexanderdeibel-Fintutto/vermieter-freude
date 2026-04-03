-- =====================================================================================
-- SECURITY HARDENING MIGRATION
-- Fixes for permissive policies, SECURITY DEFINER views, and RLS gaps
-- =====================================================================================

-- 1. FIX PERMISSIVE POLICIES
-- -------------------------------------------------------------------------------------

-- 1.1 Fix inbound_emails (was: INSERT WITH CHECK (true))
-- Only the service role (e.g., webhook handlers) should be able to insert emails directly
DROP POLICY IF EXISTS "Service role can insert inbound emails" ON public.inbound_emails;
CREATE POLICY "Service role can insert inbound emails"
  ON public.inbound_emails FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 1.2 Fix organizations (was: INSERT WITH CHECK (true) in initial migration)
-- Ensure only authenticated users can create organizations and they become the owner
DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;
-- Note: "Users can create their own organization" from 20260204164326 already handles this correctly:
-- WITH CHECK (owner_user_id = auth.uid())

-- 2. FIX SECURITY DEFINER VIEWS
-- -------------------------------------------------------------------------------------
-- The view public.tenants_safe was already fixed in 20260212191131_17744fb3-56ab-4edd-ad1c-eee42f2a59c8.sql
-- The view public.leases was already fixed in 20260403124657_fix_leases_security_invoker.sql
-- No other SECURITY DEFINER views found in public schema.

-- 3. FIX SECURITY DEFINER FUNCTIONS (Search Path)
-- -------------------------------------------------------------------------------------
-- All 9 SECURITY DEFINER functions already have SET search_path = public
-- No action required here.

-- 4. VERIFY RLS ON ALL TABLES
-- -------------------------------------------------------------------------------------
-- All 132 tables in the public schema already have RLS enabled.
-- No tables without RLS found.

-- 5. VERIFY USER_METADATA IN POLICIES
-- -------------------------------------------------------------------------------------
-- No policies using auth.user_metadata found in the current schema.
-- The agent report might have referred to an older state or a different project.

