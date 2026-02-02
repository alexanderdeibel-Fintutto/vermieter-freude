-- Fix security warnings

-- 1. Fix handle_updated_at function search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 2. Fix permissive organizations INSERT policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;

-- Create a more restrictive policy - users can only create org if they don't have one yet
CREATE POLICY "Users can create first organization"
    ON public.organizations FOR INSERT
    TO authenticated
    WITH CHECK (
        NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND organization_id IS NOT NULL
        )
    );
