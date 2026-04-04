-- Music Catalog - Catálogo principal de músicas
CREATE TABLE IF NOT EXISTS music_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    album_name VARCHAR(255),
    source_platform VARCHAR(50) DEFAULT 'instagram', -- instagram, tiktok, youtube, spotify
    preview_url TEXT,
    cover_image_url TEXT,
    duration_seconds INTEGER,
    trend_score INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT false,
    category VARCHAR(100), -- pop, rock, electronic, latin, etc
    locale VARCHAR(10), -- pt-BR, en-US, etc
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ
);

-- Content Music Selection - Associa música às publicações
CREATE TABLE IF NOT EXISTS content_music_selection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
    music_catalog_id UUID REFERENCES music_catalog(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_by_user BOOLEAN DEFAULT true,
    selected_from_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Music Sync Jobs - Controle de sincronização
CREATE TABLE IF NOT EXISTS music_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    records_fetched INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_log TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_music_catalog_trending ON music_catalog(trend_score DESC, usage_count DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_music_catalog_platform ON music_catalog(source_platform);
CREATE INDEX IF NOT EXISTS idx_music_catalog_search ON music_catalog USING gin(to_tsvector('portuguese', title || ' ' || artist));
CREATE INDEX IF NOT EXISTS idx_music_catalog_trending_flag ON music_catalog(is_trending) WHERE is_trending = true;

-- RLS
ALTER TABLE music_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_music_selection ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read music catalog" ON music_catalog FOR SELECT USING (true);
CREATE POLICY "Anyone can read trending" ON music_catalog FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage their music selections" ON content_music_selection FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read sync jobs" ON music_sync_jobs FOR SELECT USING (true);
CREATE POLICY "Service role can manage sync jobs" ON music_sync_jobs FOR ALL USING (true);

-- Comments
COMMENT ON TABLE music_catalog IS 'Catálogo de músicas com tendências e metadados';
COMMENT ON TABLE content_music_selection IS 'Associa músicas selecionadas às publicações';
COMMENT ON TABLE music_sync_jobs IS 'Jobs de sincronização de músicas de fontes externas';
