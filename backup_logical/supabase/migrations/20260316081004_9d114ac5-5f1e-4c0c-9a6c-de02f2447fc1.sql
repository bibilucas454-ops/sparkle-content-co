
-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restrictive UPDATE policy that prevents plan column changes
-- by checking that the plan value remains unchanged
CREATE POLICY "Users can update own profile safe columns"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND plan IS NOT DISTINCT FROM (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
);
