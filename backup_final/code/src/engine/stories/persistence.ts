// ============================================
// PERSISTÊNCIA EM BANCO COM SCORE
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  GeneratedSequence,
  GeneratedStory,
  StoryGeneratorInput,
  DiversityScore,
  GenerationHistory
} from './types';

interface StoryGenerationRecord {
  id: string;
  user_id: string;
  nicho: string;
  produto: string;
  promessa: string;
  tom_voz: string;
  dor_principal: string;
  objetivo: string;
  cta_principal: string;
  tipo_sequence: string;
  stories: GeneratedStory[];
  score_diversidade: number;
  score_abertura: number;
  score_ritmo: number;
  score_estrutura: number;
  score_cta: number;
  score_vocabulario: number;
  status: string;
  iteracoes: number;
  created_at: string;
  updated_at: string;
}

/**
 * Serviço de persistência para stories
 * Salva e recupera sequências do banco de dados
 */
export class StoryPersistenceService {
  private supabase: SupabaseClient;
  private tableName: string = 'story_generations';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Salva uma sequência gerada
   */
  async save(sequence: GeneratedSequence): Promise<string> {
    const record = this.toRecord(sequence);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(record)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao salvar: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Atualiza uma sequência existente
   */
  async update(sequence: GeneratedSequence): Promise<void> {
    const record = this.toRecord(sequence);
    record.updated_at = new Date().toISOString();

    const { error } = await this.supabase
      .from(this.tableName)
      .update(record)
      .eq('id', sequence.id);

    if (error) {
      throw new Error(`Erro ao atualizar: ${error.message}`);
    }
  }

  /**
   * Busca uma sequência pelo ID
   */
  async getById(id: string): Promise<GeneratedSequence | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar: ${error.message}`);
    }

    return this.fromRecord(data);
  }

  /**
   * Lista sequências de um usuário
   */
  async listByUser(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<GeneratedSequence[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Erro ao listar: ${error.message}`);
    }

    return data.map(d => this.fromRecord(d));
  }

  /**
   * Busca sequências por nicho
   */
  async getByNiche(
    nicho: string,
    limit: number = 10
  ): Promise<GeneratedSequence[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('nicho', nicho)
      .order('score_diversidade', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erro ao buscar por nicho: ${error.message}`);
    }

    return data.map(d => this.fromRecord(d));
  }

  /**
   * Remove uma sequência
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar: ${error.message}`);
    }
  }

  /**
   * Converte sequência para registro de banco
   */
  private toRecord(sequence: GeneratedSequence): StoryGenerationRecord {
    const score = this.calculateScore(sequence.stories);
    
    return {
      id: sequence.id,
      user_id: sequence.input.userId,
      nicho: sequence.input.nicho,
      produto: sequence.input.produto,
      promessa: sequence.input.promessa,
      tom_voz: sequence.input.tomVoz,
      dor_principal: sequence.input.dorPrincipal,
      objetivo: sequence.input.objetivo,
      cta_principal: sequence.input.ctaPrincipal,
      tipo_sequence: sequence.tipo,
      stories: sequence.stories as any,
      score_diversidade: score.overall,
      score_abertura: score.abertura,
      score_ritmo: score.ritmo,
      score_estrutura: score.estrutura,
      score_cta: score.cta,
      score_vocabulario: score.vocabulario,
      status: sequence.status,
      iteracoes: 1,
      created_at: sequence.createdAt.toISOString(),
      updated_at: sequence.updatedAt.toISOString()
    };
  }

  /**
   * Converte registro de banco para sequência
   */
  private fromRecord(record: StoryGenerationRecord): GeneratedSequence {
    const input: StoryGeneratorInput = {
      userId: record.user_id,
      nicho: record.nicho,
      produto: record.produto,
      promessa: record.promessa,
      tomVoz: record.tom_voz as any,
      dorPrincipal: record.dor_principal,
      objetivo: record.objetivo,
      nivelPublico: 'intermediario',
      ctaPrincipal: record.cta_principal as any
    };

    return {
      id: record.id,
      tipo: record.tipo_sequence as any,
      stories: record.stories as GeneratedStory[],
      input,
      scoreDiversidade: record.score_diversidade,
      status: record.status as any,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };
  }

  /**
   * Calcula score de diversidade detalhado
   */
  private calculateScore(stories: GeneratedStory[]): DiversityScore {
    if (stories.length === 0) {
      return {
        overall: 0,
        abertura: 0,
        ritmo: 0,
        estrutura: 0,
        cta: 0,
        vocabulario: 0
      };
    }

    // Score de abertura
    const firstWords = stories.map(s => s.primeirasTresPalavras.toLowerCase());
    const uniqueFirstWords = new Set(firstWords).size;
    const abertura = uniqueFirstWords / stories.length;

    // Score de ritmo
    const lengths = stories.map(s => s.copy.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const lengthVariance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
    const ritmo = Math.min(1, Math.sqrt(lengthVariance) / avgLength);

    // Score de estrutura
    const types = stories.map(s => s.tipo);
    const uniqueTypes = new Set(types).size;
    const estrutura = uniqueTypes / Math.max(1, stories.length);

    // Score de CTA
    const ctas = stories.map(s => s.cta.toLowerCase());
    const uniqueCTAs = new Set(ctas).size;
    const cta = uniqueCTAs / stories.length;

    // Score de vocabulário (similaridade média)
    const calculateSimilarity = (text1: string, text2: string): number => {
      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      return intersection.size / union.size;
    };

    let totalSimilarity = 0;
    let pairs = 0;
    for (let i = 0; i < stories.length; i++) {
      for (let j = i + 1; j < stories.length; j++) {
        totalSimilarity += calculateSimilarity(stories[i].copy, stories[j].copy);
        pairs++;
      }
    }
    const avgSimilarity = pairs > 0 ? totalSimilarity / pairs : 0;
    const vocabulario = 1 - avgSimilarity;

    // Score overall
    const overall = (
      abertura * 0.25 +
      ritmo * 0.20 +
      estrutura * 0.20 +
      cta * 0.20 +
      vocabulario * 0.15
    );

    return {
      overall: Math.round(overall * 100) / 100,
      abertura: Math.round(abertura * 100) / 100,
      ritmo: Math.round(ritmo * 100) / 100,
      estrutura: Math.round(estrutura * 100) / 100,
      cta: Math.round(cta * 100) / 100,
      vocabulario: Math.round(vocabulario * 100) / 100
    };
  }

  /**
   * Retorna estatísticas do usuário
   */
  async getUserStats(userId: string): Promise<{
    totalSequencias: number;
    promedioScore: number;
    sequenciasPorNicho: Record<string, number>;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('nicho, score_diversidade')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const totalSequencias = data.length;
    const promedioScore = data.reduce((sum, r) => sum + r.score_diversidade, 0) / totalSequencias;
    
    const sequenciasPorNicho: Record<string, number> = {};
    for (const row of data) {
      sequenciasPorNicho[row.nicho] = (sequenciasPorNicho[row.nicho] || 0) + 1;
    }

    return {
      totalSequencias,
      promedioScore: Math.round(promedioScore * 100) / 100,
      sequenciasPorNicho
    };
  }
}
