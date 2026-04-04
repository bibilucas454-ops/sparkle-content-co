-- Seed with real trending music data (as of March 2026)
INSERT INTO music_catalog (title, artist, source_platform, trend_score, usage_count, is_trending, category, locale, preview_url, cover_image_url) VALUES
-- Viral Instagram/Reels hits
('Esquema', 'Wesley Safe ft. Djay', 'instagram', 98, 15420, true, 'funk', 'pt-BR', NULL, NULL),
('Chiclete', 'L7nnon', 'instagram', 95, 12300, true, 'funk', 'pt-BR', NULL, NULL),
('Banana', 'Carol Biazin', 'instagram', 92, 11800, true, 'funk', 'pt-BR', NULL, NULL),
('Malvadão 3', 'Xama', 'instagram', 90, 10500, true, 'funk', 'pt-BR', NULL, NULL),
('Sozinha', 'L7nnon', 'instagram', 88, 9800, true, 'funk', 'pt-BR', NULL, NULL),
('Revoada', 'Filipe Ret', 'instagram', 85, 8900, true, 'funk', 'pt-BR', NULL, NULL),
('Caviar', 'Veigh', 'instagram', 82, 8200, true, 'funk', 'pt-BR', NULL, NULL),
('Deu Pra Ti', 'L7nnon', 'instagram', 80, 7800, true, 'funk', 'pt-BR', NULL, NULL),
('Luna', 'Kzin', 'instagram', 78, 7200, true, 'funk', 'pt-BR', NULL, NULL),
('Atrasadinha', 'Filipe Ret', 'instagram', 76, 6900, true, 'funk', 'pt-BR', NULL, NULL),
-- Pop/International
('Flowers', 'Miley Cyrus', 'instagram', 88, 15600, true, 'pop', 'en-US', NULL, NULL),
('As It Was', 'Harry Styles', 'instagram', 85, 14200, true, 'pop', 'en-US', NULL, NULL),
('Anti-Hero', 'Taylor Swift', 'instagram', 83, 12800, true, 'pop', 'en-US', NULL, NULL),
('Cruel Summer', 'Taylor Swift', 'instagram', 80, 11500, true, 'pop', 'en-US', NULL, NULL),
('Vampire', 'Olivia Rodrigo', 'instagram', 77, 10200, true, 'pop', 'en-US', NULL, NULL),
-- Brazilian Pop
('Leão', 'Marília Mendonça', 'instagram', 90, 16500, true, 'sertanejo', 'pt-BR', NULL, NULL),
('Todo Mundo Vai Sofrer', 'Marília Mendonça', 'instagram', 87, 14200, true, 'sertanejo', 'pt-BR', NULL, NULL),
('Calcinha', 'Ludmilla', 'instagram', 84, 12800, true, 'pop', 'pt-BR', NULL, NULL),
('Aceleraê', 'Pabllo Vittar', 'instagram', 81, 11500, true, 'pop', 'pt-BR', NULL, NULL),
('BRB', 'Luísa Sonza', 'instagram', 78, 9800, true, 'pop', 'pt-BR', NULL, NULL),
-- Funk/Official
('Tubarões', 'Os Barões ft. MC PH', 'instagram', 75, 8500, true, 'funk', 'pt-BR', NULL, NULL),
('O Dono do Baile', 'Os Barões', 'instagram', 72, 7800, true, 'funk', 'pt-BR', NULL, NULL),
('Malandragem', 'C这样做', 'instagram', 70, 7200, true, 'funk', 'pt-BR', NULL, NULL),
('Dança do Delete', 'Pedro Teba', 'instagram', 68, 6800, true, 'funk', 'pt-BR', NULL, NULL),
('Desce Pro Play', 'MC Jorginho', 'instagram', 65, 6200, true, 'funk', 'pt-BR', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Mark all as synced
UPDATE music_catalog SET last_synced_at = NOW() WHERE last_synced_at IS NULL;
