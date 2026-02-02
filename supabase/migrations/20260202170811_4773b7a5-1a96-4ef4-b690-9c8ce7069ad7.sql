-- Drop existing RESTRICTIVE policies on buildings table
DROP POLICY IF EXISTS "Users can view buildings in their organization" ON public.buildings;
DROP POLICY IF EXISTS "Users can insert buildings in their organization" ON public.buildings;
DROP POLICY IF EXISTS "Users can update buildings in their organization" ON public.buildings;
DROP POLICY IF EXISTS "Users can delete buildings in their organization" ON public.buildings;

-- Create PERMISSIVE policies (default behavior) for buildings
CREATE POLICY "Users can view buildings in their organization"
ON public.buildings
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert buildings in their organization"
ON public.buildings
FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update buildings in their organization"
ON public.buildings
FOR UPDATE
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete buildings in their organization"
ON public.buildings
FOR DELETE
TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()));