-- ============================================================
-- RELATÓRIO DE STORAGE - Execute no SQL Editor do Supabase
-- ============================================================
-- Copie e execute cada bloco separadamente

-- ============================================================
-- BLOCO 1: RESUMO TOTAL
-- ============================================================
SELECT 
  'RESUMO TOTAL DE STORAGE' AS relatorio,
  COUNT(*) AS total_uploads,
  ROUND(COALESCE(SUM(size_bytes), 0) / 1024 / 1024, 2) AS total_mb
FROM uploads;

-- ============================================================
-- BLOCO 2: POR BUCKET
-- ============================================================
SELECT 
  CASE 
    WHEN file_path LIKE 'videos/%' THEN 'videos'
    WHEN file_path LIKE 'creator-media/%' THEN 'creator-media'
    WHEN file_path LIKE 'thumbnails/%' THEN 'thumbnails'
    WHEN file_path LIKE 'post-audio/%' THEN 'post-audio'
    WHEN file_path LIKE '%agendados%' THEN 'agendados (subdir)'
    ELSE 'outros'
  END AS bucket,
  COUNT(*) AS arquivos,
  ROUND(COALESCE(SUM(size_bytes), 0) / 1024 / 1024, 2) AS mb,
  ROUND(COALESCE(AVG(size_bytes), 0) / 1024 / 1024, 2) AS media_mb
FROM uploads
GROUP BY 1
ORDER BY 3 DESC;

-- ============================================================
-- BLOCO 3: TOP 30 MAIORES ARQUIVOS
-- ============================================================
SELECT 
  id,
  file_name,
  file_path,
  ROUND(size_bytes / 1024 / 1024, 2) AS mb,
  created_at,
  user_id
FROM uploads
WHERE size_bytes IS NOT NULL
ORDER BY size_bytes DESC
LIMIT 30;

-- ============================================================
-- BLOCO 4: UPLOADS ÓRFÃOS (não vinculados a publicações)
-- ============================================================
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  ROUND(u.size_bytes / 1024 / 1024, 2) AS mb,
  u.created_at,
  u.user_id,
  'ORPHAN' AS status
FROM uploads u
WHERE NOT EXISTS (SELECT 1 FROM post_media pm WHERE pm.upload_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM publications p WHERE p.upload_id = u.id AND p.deleted_at IS NULL)
  AND NOT EXISTS (SELECT 1 FROM drafts d WHERE d.upload_id = u.id)
ORDER BY u.size_bytes DESC;

-- ============================================================
-- BLOCO 5: PUBLICAÇÕES DELETADAS COM ARQUIVOS
-- ============================================================
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  ROUND(u.size_bytes / 1024 / 1024, 2) AS mb,
  p.deleted_at,
  p.title
FROM uploads u
JOIN publications p ON p.upload_id = u.id
WHERE p.deleted_at IS NOT NULL
ORDER BY p.deleted_at DESC;

-- ============================================================
-- BLOCO 6: ARQUIVOS MUITO ANTIGOS (+60 dias) DE PUBLICAÇÕES PUBLICADAS
-- ============================================================
WITH PublishedUploads AS (
  SELECT DISTINCT pm.upload_id
  FROM post_media pm
  JOIN publications p ON p.id = pm.publication_id
  WHERE p.overall_status IN ('published', 'success')
    AND p.deleted_at IS NULL
)
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  ROUND(u.size_bytes / 1024 / 1024, 2) AS mb,
  u.created_at,
  AGE(NOW(), u.created_at) AS idade,
  'OLD_PUBLISHED_CAN_DELETE' AS acao
FROM uploads u
WHERE u.id IN (SELECT upload_id FROM PublishedUploads)
  AND u.created_at < NOW() - INTERVAL '60 days'
ORDER BY u.created_at ASC;

-- ============================================================
-- BLOCO 7: CONTAGEM POR STATUS DE PUBLICAÇÃO
-- ============================================================
SELECT 
  COALESCE(p.overall_status, 'sem_publicacao') AS status,
  COUNT(DISTINCT pm.upload_id) AS uploads,
  ROUND(SUM(u.size_bytes) / 1024 / 1024, 2) AS mb
FROM post_media pm
JOIN publications p ON p.id = pm.publication_id
JOIN uploads u ON u.id = pm.upload_id
GROUP BY 1;

-- ============================================================
-- BLOCO 8: UPLOADS AGENDADOS ANTIGOS
-- ============================================================
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  ROUND(u.size_bytes / 1024 / 1024, 2) AS mb,
  p.scheduled_for,
  p.overall_status
FROM uploads u
JOIN publications p ON p.upload_id = u.id
WHERE p.scheduled_for < NOW() - INTERVAL '30 days'
  AND p.deleted_at IS NULL
  AND p.overall_status NOT IN ('published', 'success')
ORDER BY p.scheduled_for ASC;