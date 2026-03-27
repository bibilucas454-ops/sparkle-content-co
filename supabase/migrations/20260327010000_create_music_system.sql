-- Tabela de músicas em tendência
CREATE TABLE IF NOT EXISTS trending_sounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    source_platform VARCHAR(50) DEFAULT 'instagram', -- instagram, tiktok, youtube
    external_id VARCHAR(255),
    preview_url TEXT,
    popularity_score INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de músicas selecionadas por usuário
CREATE TABLE IF NOT EXISTS content_music (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    source_platform VARCHAR(50),
    external_id VARCHAR(255),
    preview_url TEXT,
    selected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para trending
CREATE INDEX IF NOT EXISTS idx_trending_sounds_popularity ON trending_sounds(popularity_score DESC, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_trending_sounds_active ON trending_sounds(is_active);

-- RLS
ALTER TABLE trending_sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_music ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trending sounds" ON trending_sounds FOR SELECT USING (true);
CREATE POLICY "Users can manage their content music" ON content_music FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE trending_sounds IS 'Armazena músicas/trends virais de redes sociais';
COMMENT ON TABLE content_music IS 'Associa músicas selecionadas às publicações';
