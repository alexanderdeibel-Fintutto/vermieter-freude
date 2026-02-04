-- Drop and recreate the buildings INSERT policy to also allow inserts for owned organizations
DROP POLICY IF EXISTS "Users can insert buildings in their organization" ON public.buildings;

CREATE POLICY "Users can insert buildings in their organization"
ON public.buildings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if organization matches user's profile org
  organization_id = get_user_organization_id(auth.uid())
  OR 
  -- Also allow if user is the owner of the organization (for onboarding flow)
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id 
    AND owner_user_id = auth.uid()
  )
);