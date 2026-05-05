-- ============================================================
-- ANÁLISE COMPLETA DE STORAGE - Execute no SQL Editor do Supabase
-- ============================================================
-- Execute cada seção separadamente

-- ============================================================
-- SEÇÃO 1: UPLOADS NÃO ASSOCIADOS A PUBLICAÇÕES ATIVAS
-- ============================================================
-- Identifica uploads que:
-- - Não estão em post_media de publicações ativas
-- - Ou estão em publicações concluídas (já publicadas)

-- Buscar publicações ativas (não publicadas ainda, não deletadas)
WITH ActivePublications AS (
  SELECT id, 'active' as pub_status
  FROM publications
  WHERE deleted_at IS NULL 
    AND (overall_status IS NULL OR overall_status NOT IN ('published', 'success', 'sucesso'))
    AND (scheduled_for IS NULL OR scheduled_for > NOW())
),
PublishedPubs AS (
  SELECT DISTINCT publication_id
  FROM publication_targets
  WHERE status IN ('published', 'publicado', 'success', 'sucesso')
)
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  u.size_bytes,
  u.size_bytes / 1024 / 1024 AS size_mb,
  u.created_at,
  u.user_id,
  CASE 
    WHEN pm.publication_id IS NOT NULL THEN 'linked_to_post_media'
    WHEN p.upload_id IS NOT NULL THEN 'linked_to_publication'
    WHEN d.upload_id IS NOT NULL THEN 'linked_to_draft'
    ELSE 'ORPHAN_NO_link'
  END AS link_status
FROM uploads u
LEFT JOIN post_media pm ON pm.upload_id = u.id
LEFT JOIN publications p ON p.upload_id = u.id
LEFT JOIN drafts d ON d.upload_id = u.id
LEFT JOIN publication_targets pt ON pt.publication_id = pm.publication_id
WHERE 1=1
  AND u.id NOT IN (SELECT upload_id FROM post_media WHERE publication_id IN (SELECT id FROM publications WHERE deleted_at IS NULL))
  AND u.id NOT IN (SELECT upload_id FROM publications WHERE deleted_at IS NULL)
  AND u.id NOT IN (SELECT upload_id FROM drafts)
ORDER BY u.created_at ASC;

-- ============================================================
-- SEÇÃO 2: CONTAGEM TOTAL DE ARQUIVOS POR STATUS
-- ============================================================
SELECT 
  'Total Uploads' AS metric,
  COUNT(*) AS count,
  SUM(COALESCE(size_bytes, 0)) / 1024 / 1024 AS total_mb
FROM uploads;

SELECT 
  'Uploads em post_media' AS metric,
  COUNT(DISTINCT upload_id)
FROM post_media;

SELECT 
  'Uploads em publicações' AS metric,
  COUNT(DISTINCT upload_id)
FROM publications
WHERE upload_id IS NOT NULL AND deleted_at IS NULL;

SELECT 
  'Uploads em drafts' AS metric,
  COUNT(DISTINCT upload_id)
FROM drafts;

-- ============================================================
-- SEÇÃO 3: PUBLICAÇÕES DELETADAS ( Soft Deletes com uploads )
-- ============================================================
SELECT 
  p.id,
  p.title,
  p.deleted_at,
  p.upload_id,
  u.file_name,
  u.file_path,
  u.size_bytes
FROM publications p
LEFT JOIN uploads u ON u.id = p.upload_id
WHERE p.deleted_at IS NOT NULL
ORDER BY p.deleted_at DESC;

-- ============================================================
-- SEÇÃO 4: POSSÍVEIS DUPLICADOS (mesmo user_id, mesmo file_name)
-- ============================================================
SELECT 
  user_id,
  file_name,
  COUNT(*) AS copies,
  ARRAY_AGG(id) AS upload_ids,
  SUM(size_bytes) / 1024 / 1024 AS total_mb
FROM uploads
GROUP BY user_id, file_name
HAVING COUNT(*) > 1
ORDER BY copies DESC;

-- ============================================================
-- SEÇÃO 5: ARQUIVOS ANTIGOS (mais de 30 dias) de publicações concluídas
-- ============================================================
WITH OldPublished AS (
  SELECT DISTINCT pm.upload_id
  FROM post_media pm
  JOIN publications p ON p.id = pm.publication_id
  WHERE p.deleted_at IS NOT NULL
    OR p.overall_status IN ('published', 'success', 'sucesso')
)
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  u.size_bytes,
  u.size_bytes / 1024 / 1024 AS size_mb,
  u.created_at,
  AGE(NOW(), u.created_at) AS age
FROM uploads u
WHERE u.id IN (SELECT upload_id FROM OldPublished)
  AND u.created_at < NOW() - INTERVAL '30 days'
ORDER BY u.created_at ASC;

-- ============================================================
-- SEÇÃO 6: RESUMO EXECUTIVO
-- ============================================================
SELECT 
  '=== RESUMO DE STORAGE ===' AS info;
  
SELECT 
  'Buckets' AS category,
  'videos' AS name,
  (SELECT COUNT(*) FROM uploads WHERE file_path LIKE 'videos/%') AS file_count,
  (SELECT COALESCE(SUM(size_bytes), 0) / 1024 / 1024 FROM uploads WHERE file_path LIKE 'videos/%') AS size_mb
UNION ALL
SELECT 
  'Buckets', 'creator-media',
  (SELECT COUNT(*) FROM uploads WHERE file_path LIKE 'creator-media/%'),
  (SELECT COALESCE(SUM(size_bytes), 0) / 1024 / 1024 FROM uploads WHERE file_path LIKE 'creator-media/%')
UNION ALL
SELECT 
  'Buckets', 'thumbnails',
  (SELECT COUNT(*) FROM uploads WHERE file_path LIKE 'thumbnails/%'),
  (SELECT COALESCE(SUM(size_bytes), 0) / 1024 / 1024 FROM uploads WHERE file_path LIKE 'thumbnails/%')
UNION ALL
SELECT 
  'Buckets', 'post-audio',
  (SELECT COUNT(*) FROM uploads WHERE file_path LIKE 'post-audio/%'),
  (SELECT COALESCE(SUM(size_bytes), 0) / 1024 / 1024 FROM uploads WHERE file_path LIKE 'post-audio/%');