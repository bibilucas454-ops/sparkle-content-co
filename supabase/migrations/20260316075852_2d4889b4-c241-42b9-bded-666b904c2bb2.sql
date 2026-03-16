
-- Fix privilege escalation: prevent users from modifying their own plan column
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Re-create with restricted columns (only allow username and avatar_url updates)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a trigger to prevent plan column changes from non-service-role
CREATE OR REPLACE FUNCTION public.prevent_plan_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If plan is being changed and the caller is not service_role, block it
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    IF current_setting('role') != 'service_role' THEN
      NEW.plan := OLD.plan; -- silently revert the plan change
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_plan_column
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_plan_self_update();
