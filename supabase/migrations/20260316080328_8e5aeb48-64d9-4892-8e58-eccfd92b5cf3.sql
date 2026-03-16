
-- Add DELETE policy for oauth_states so users can clean up their own states
CREATE POLICY "Users can delete own oauth states"
ON public.oauth_states FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Additionally, revoke direct UPDATE on the plan column from authenticated role
REVOKE UPDATE (plan) ON public.profiles FROM authenticated;
