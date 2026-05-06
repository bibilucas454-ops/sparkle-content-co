DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'audit_publication_queue') THEN
    ALTER FUNCTION public.audit_publication_queue() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.audit_publication_queue() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.audit_publication_queue() TO service_role;
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'audit_publication_queue: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'delete_old_oauth_states') THEN
    ALTER FUNCTION public.delete_old_oauth_states() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.delete_old_oauth_states() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.delete_old_oauth_states() TO service_role;
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'delete_old_oauth_states: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'handle_new_user: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'invoke_cron_scheduler') THEN
    ALTER FUNCTION public.invoke_cron_scheduler() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.invoke_cron_scheduler() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.invoke_cron_scheduler() TO service_role;
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'invoke_cron_scheduler: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'trigger_immediate_processing') THEN
    ALTER FUNCTION public.trigger_immediate_processing() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.trigger_immediate_processing() FROM PUBLIC;
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'trigger_immediate_processing: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'prevent_plan_self_update') THEN
    ALTER FUNCTION public.prevent_plan_self_update() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.prevent_plan_self_update() FROM PUBLIC;
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'prevent_plan_self_update: %', SQLERRM;
END $$;

DO $$ BEGIN
  REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
  REVOKE EXECUTE ON FUNCTION public.delete_old_oauth_states() FROM authenticated;
  REVOKE EXECUTE ON FUNCTION public.invoke_cron_scheduler() FROM authenticated;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'bulk grant/revoke: %', SQLERRM;
END $$;