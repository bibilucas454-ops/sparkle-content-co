
-- Migration: 20260324100000_create_metrics_view.sql
-- Goal: Create a metrics view for publication analytics

-- Drop existing view if exists
DROP VIEW IF EXISTS publication_metrics CASCADE;

-- Create comprehensive metrics view
CREATE OR REPLACE VIEW publication_metrics AS
SELECT 
    p.user_id,
    p.id as publication_id,
    p.title,
    p.created_at as publication_created_at,
    p.scheduled_for,
    p.overall_status,
    pt.id as target_id,
    pt.platform,
    pt.status as target_status,
    pt.published_at,
    pt.platform_post_url,
    pt.error_message,
    COALESCE(
        (SELECT COUNT(*) FROM publication_attempts pa WHERE pa.publication_job_id = (
            SELECT id FROM publication_jobs WHERE publication_target_id = pt.id LIMIT 1
        )), 0
    ) as attempt_count
FROM publications p
LEFT JOIN publication_targets pt ON pt.publication_id = p.id
WHERE p.user_id IS NOT NULL;

-- Create user publication summary
DROP VIEW IF EXISTS user_publication_summary CASCADE;

CREATE OR REPLACE VIEW user_publication_summary AS
SELECT 
    p.user_id,
    COUNT(DISTINCT p.id) as total_publications,
    COUNT(DISTINCT CASE WHEN p.overall_status = 'published' THEN p.id END) as published_count,
    COUNT(DISTINCT CASE WHEN p.overall_status IN ('failed', 'erro') THEN p.id END) as failed_count,
    COUNT(DISTINCT CASE WHEN p.overall_status IN ('pendente', 'queued', 'scheduled', 'ready') THEN p.id END) as pending_count,
    COUNT(DISTINCT pt.id) as total_targets,
    COUNT(DISTINCT CASE WHEN pt.status = 'publicado' THEN pt.id END) as successful_posts,
    COUNT(DISTINCT CASE WHEN pt.status = 'erro' THEN pt.id END) as failed_posts,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT pt.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN pt.status = 'publicado' THEN pt.id END)::numeric / COUNT(DISTINCT pt.id)::numeric) * 100 
            ELSE 0 
        END, 2
    ) as success_rate_percent
FROM publications p
LEFT JOIN publication_targets pt ON pt.publication_id = p.id
WHERE p.user_id IS NOT NULL
GROUP BY p.user_id;

-- Create platform-specific metrics
DROP VIEW IF EXISTS platform_metrics CASCADE;

CREATE OR REPLACE VIEW platform_metrics AS
SELECT 
    pt.platform,
    COUNT(DISTINCT pt.id) as total_attempts,
    COUNT(DISTINCT CASE WHEN pt.status = 'publicado' THEN pt.id END) as successful_posts,
    COUNT(DISTINCT CASE WHEN pt.status = 'erro' THEN pt.id END) as failed_posts,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT pt.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN pt.status = 'publicado' THEN pt.id END)::numeric / COUNT(DISTINCT pt.id)::numeric) * 100 
            ELSE 0 
        END, 2
    ) as success_rate_percent,
    COUNT(DISTINCT pt.publication_id) as unique_publications
FROM publication_targets pt
GROUP BY pt.platform;
