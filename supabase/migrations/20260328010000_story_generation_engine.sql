-- ============================================
-- ENGINE DE STORIES - MIGRATION
-- Tabela para persistência de stories gerados
-- ============================================

-- Criar tabela de generations de stories
CREATE TABLE IF NOT EXISTS story_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Inputs do usuário
    nicho TEXT NOT NULL,
    produto TEXT,
    promessa TEXT NOT NULL,
    tom_voz TEXT NOT NULL CHECK (tom_voz IN ('direto', 'emocional', 'pragmatico', 'protector')),
    dor_principal TEXT NOT NULL,
    objetivo TEXT,
    nivel_publico TEXT DEFAULT 'intermediario' CHECK (nivel_publico IN ('iniciante', 'intermediario', 'avancado')),
    cta_principal TEXT NOT NULL CHECK (cta_principal IN ('dm', 'link', 'highlight')),
    
    -- Configuração da sequência
    tipo_sequence TEXT NOT NULL CHECK (tipo_sequence IN ('engajamento', 'aquecimento', 'venda')),
    
    -- Stories gerados (JSONB)
    stories JSONB NOT NULL DEFAULT '[]',
    
    -- Scores de diversidade
    score_diversidade DECIMAL(5,4) DEFAULT 0,
    score_abertura DECIMAL(5,4) DEFAULT 0,
    score_ritmo DECIMAL(5,4) DEFAULT 0,
    score_estrutura DECIMAL(5,4) DEFAULT 0,
    score_cta DECIMAL(5,4) DEFAULT 0,
    score_vocabulario DECIMAL(5,4) DEFAULT 0,
    
    -- Metadados
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'validando', 'valido', 'regerando', 'pronto', 'erro')),
    iteracoes INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_story_generations_user_id ON story_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_story_generations_nicho ON story_generations(nicho);
CREATE INDEX IF NOT EXISTS idx_story_generations_tipo ON story_generations(tipo_sequence);
CREATE INDEX IF NOT EXISTS idx_story_generations_score ON story_generations(score_diversidade DESC);
CREATE INDEX IF NOT EXISTS idx_story_generations_created ON story_generations(created_at DESC);

-- Row Level Security
ALTER TABLE story_generations ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem suas próprias gerações
CREATE POLICY "Users can manage own story generations"
    ON story_generations
    FOR ALL
    USING (auth.uid() = user_id);

-- Criar view para estatísticas
CREATE OR REPLACE VIEW story_generation_stats AS
SELECT 
    user_id,
    nicho,
    tipo_sequence,
    COUNT(*) as total_generations,
    AVG(score_diversidade)::DECIMAL(5,4) as avg_score,
    MAX(score_diversidade) as max_score,
    MIN(score_diversidade) as min_score,
    COUNT(CASE WHEN status = 'pronto' THEN 1 END) as successful_generations,
    COUNT(CASE WHEN status = 'erro' THEN 1 END) as failed_generations,
    AVG(iteracoes)::DECIMAL(3,1) as avg_iterations,
    MIN(created_at) as first_generation,
    MAX(created_at) as last_generation
FROM story_generations
GROUP BY user_id, nicho, tipo_sequence;

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_story_generations_updated_at
    BEFORE UPDATE ON story_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Comentários
COMMENT ON TABLE story_generations IS 'Tabela para armazenar sequências de stories gerados pela MINDMAX Engine';
COMMENT ON COLUMN story_generations.stories IS 'Array de stories gerados em formato JSON';
COMMENT ON COLUMN story_generations.score_diversidade IS 'Score geral de diversidade (0-1)';
COMMENT ON COLUMN story_generations.status IS 'Status atual: pendente, validando, valido, regerando, pronto, erro';
