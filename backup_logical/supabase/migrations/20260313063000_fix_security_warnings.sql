-- Fix Security issues identified by Lovable scanner

-- 1. Fix: Any authenticated user can insert or delete all trend data (outdated)
-- 2. Fix: RLS Policy Always True (outdated)
-- Issue stems from: supabase/migrations/20260308194258_e539e3e5-62fb-43a4-b4eb-b84ce860783e.sql

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert trends" ON public.trends;
DROP POLICY IF EXISTS "Authenticated users can delete trends" ON public.trends;

-- Let's restrict insert to only super admins or the service role (backend). 
-- This typically prevents the "Any authenticated user can insert or delete all trend data" warning
-- and the "RLS Policy Always True (USING (true))" warning.
-- No new policies needed since the table already has "Anyone can view trends" for reading,
-- and inserts/updates should happen via secure Edge Functions bypassing RLS or using service_role key.
