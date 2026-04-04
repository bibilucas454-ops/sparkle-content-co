
-- Temporary Audit Function
CREATE OR REPLACE FUNCTION public.audit_publication_queue()
RETURNS TABLE (table_name TEXT, status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT 'publication_targets'::TEXT, pt.status, COUNT(*) 
    FROM public.publication_targets pt GROUP BY pt.status
    UNION ALL
    SELECT 'publication_jobs'::TEXT, pj.status, COUNT(*) 
    FROM public.publication_jobs pj GROUP BY pj.status
    UNION ALL
    SELECT 'publications'::TEXT, p.overall_status, COUNT(*) 
    FROM public.publications p GROUP BY p.overall_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
