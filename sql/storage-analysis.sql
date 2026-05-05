-- ============================================================
-- ANÁLISE DE STORAGE - Execute no SQL Editor do Supabase
-- ============================================================
-- Este script lista todos os arquivos e identifica órfãos

-- 1) Buscar todos os uploads no banco
SELECT 
  id, 
  file_name, 
  file_path, 
  thumbnail_path, 
  size_bytes, 
  user_id, 
  created_at
FROM uploads
ORDER BY created_at DESC;

-- 2) Contagem por bucket (analisando paths)
SELECT 
  CASE 
    WHEN file_path LIKE 'videos/%' THEN 'videos'
    WHEN file_path LIKE 'creator-media/%' THEN 'creator-media'
    WHEN file_path LIKE 'thumbnails/%' THEN 'thumbnails'
    WHEN file_path LIKE 'post-audio/%' THEN 'post-audio'
    ELSE 'outros'
  END AS bucket,
  COUNT(*) AS total_arquivos,
  SUM(COALESCE(size_bytes, 0)) AS total_bytes,
  SUM(COALESCE(size_bytes, 0)) / 1024 / 1024 AS total_mb
FROM uploads
GROUP BY 1
ORDER BY 2 DESC;

-- 3) Arquivos maiores (top 20)
SELECT 
  id, 
  file_name, 
  file_path, 
  size_bytes, 
  size_bytes / 1024 / 1024 AS size_mb,
  created_at
FROM uploads
WHERE size_bytes IS NOT NULL
ORDER BY size_bytes DESC
LIMIT 20;

-- 4) Verificar publicações e suas mídias
SELECT 
  p.id AS publication_id,
  p.title,
  p.overall_status,
  p.deleted_at,
  pm.upload_id,
  u.file_name,
  u.file_path,
  u.size_bytes
FROM publications p
LEFT JOIN post_media pm ON pm.publication_id = p.id
LEFT JOIN uploads u ON u.id = pm.upload_id
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 50;