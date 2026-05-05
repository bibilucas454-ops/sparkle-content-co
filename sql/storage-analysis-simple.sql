-- ============================================================
-- ANÁLISE DE STORAGE - Execute tudo de uma vez no SQL Editor
-- ============================================================

-- 1) RESUMO GERAL
SELECT 
  '=== RESUMO DE STORAGE ===' AS info;
  
SELECT 
  'Total Uploads' AS metric,
  COUNT(*) AS count,
  ROUND(SUM(COALESCE(size_bytes, 0)) / 1024 / 1024, 2) AS total_mb
FROM uploads;

-- 2) POR BUCKET
SELECT 
  CASE 
    WHEN file_path LIKE 'videos%' THEN 'videos'
    WHEN file_path LIKE 'creator-media%' THEN 'creator-media'
    WHEN file_path LIKE 'thumbnails%' THEN 'thumbnails'
    WHEN file_path LIKE 'post-audio%' THEN 'post-audio'
    ELSE 'outros'
  END AS bucket,
  COUNT(*) AS arquivos,
  ROUND(SUM(COALESCE(size_bytes, 0)) / 1024 / 1024, 2) AS mb
FROM uploads
GROUP BY 1
ORDER BY 2 DESC;

-- 3) POR STATUS DA PUBLICAÇÃO
SELECT 
  p.overall_status,
  COUNT(DISTINCT pm.upload_id) AS uploads_usados,
  ROUND(SUM(u.size_bytes) / 1024 / 1024, 2) AS mb
FROM publications p
LEFT JOIN post_media pm ON pm.publication_id = p.id
LEFT JOIN uploads u ON u.id = pm.upload_id
WHERE p.deleted_at IS NULL
GROUP BY 1;

-- 4) UPLOADS ÓRFÃOS (não vinculados a nenhuma publicação ativa)
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  u.size_bytes,
  ROUND(u.size_bytes / 1024 / 1024, 2) AS mb,
  u.created_at,
  u.user_id,
  'ORPHAN' AS status
FROM uploads u
WHERE NOT EXISTS (
  SELECT 1 FROM post_media pm WHERE pm.upload_id = u.id
)
AND NOT EXISTS (
  SELECT 1 FROM publications p WHERE p.upload_id = u.id AND p.deleted_at IS NULL
)
AND NOT EXISTS (
  SELECT 1 FROM drafts d WHERE d.upload_id = u.id
)
ORDER BY u.size_bytes DESC;

-- 5) UPLOADS DE PUBLICAÇÕES DELETADAS (soft deleted)
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  u.size_bytes,
  ROUND(u.size_bytes / 1024 / 1024, 2) AS mb,
  u.created_at,
  p.deleted_at,
  p.title,
  'DELETED_PUB' AS status
FROM uploads u
JOIN publications p ON p.upload_id = u.id
WHERE p.deleted_at IS NOT NULL
ORDER BY p.deleted_at DESC;

-- 6) POSSÍVEIS DUPLICADOS
SELECT 
  user_id,
  file_name,
  COUNT(*) AS copies,
  ROUND(SUM(size_bytes) / 1024 / 1024, 2) AS total_mb,
  ARRAY_AGG(id) AS ids
FROM uploads
GROUP BY user_id, file_name
HAVING COUNT(*) > 1
ORDER BY copies DESC;

-- 7) ARQUIVOS ANTIGOS (+30 dias) DE PUBLICAÇÕES CONCLUÍDAS
WITH PublishedUploads AS (
  SELECT DISTINCT pm.upload_id
  FROM post_media pm
  JOIN publications p ON p.id = pm.publication_id
  WHERE p.overall_status IN ('published', 'success')
)
SELECT 
  u.id,
  u.file_name,
  u.file_path,
  ROUND(u.size_bytes / 1024 / 1024, 2) AS mb,
  u.created_at,
  AGE(NOW(), u.created_at) AS age,
  'OLD_PUBLISHED' AS status
FROM uploads u
WHERE u.id IN (SELECT upload_id FROM PublishedUploads)
  AND u.created_at < NOW() - INTERVAL '30 days'
ORDER BY u.created_at ASC;