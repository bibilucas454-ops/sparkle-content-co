// ============================================
// ENGINE DE STORIES - INDEX
// ============================================

// Types
export * from './types';

// Providers
export * from './providers';

// Services
export { StoryGeneratorEngine } from './generator';
export { DiversityValidator, defaultValidator } from './validator';
export { StoryParser, defaultParser } from './parser';
export { SelectiveRepairService } from './repair';
export { StoryPersistenceService } from './persistence';

// Factory
export { createIAProvider, type ProviderType } from './providers';

// Templates
export * from './templates';

// Internacionalização
export * from './i18n';

// ============================================
// FACADE PRINCIPAL
// ============================================

import {
  StoryGeneratorInput,
  GeneratedSequence,
  SequenceType,
  IAProvider,
  GenerationConfig,
  DEFAULT_CONFIG,
  StoryType
} from './types';
import { StoryGeneratorEngine } from './generator';
import { DiversityValidator } from './validator';
import { SelectiveRepairService } from './repair';
import { StoryPersistenceService } from './persistence';
import { createIAProvider, ProviderType } from './providers';

/**
 * Interface simplificada para usar a engine
 */
export interface StoryEngineConfig {
  provider: ProviderType;
  apiKey: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  config?: Partial<GenerationConfig>;
}

/**
 * Facade principal da Engine de Stories
 */
export class StoryEngine {
  private generator: StoryGeneratorEngine;
  private validator: DiversityValidator;
  private repairService: SelectiveRepairService;
  private persistence?: StoryPersistenceService;

  constructor(config: StoryEngineConfig) {
    const provider = createIAProvider(config.provider, config.apiKey);
    
    this.generator = new StoryGeneratorEngine(provider, config.config);
    this.validator = new DiversityValidator(config.config);
    this.repairService = new SelectiveRepairService(provider);

    if (config.supabaseUrl && config.supabaseKey) {
      this.persistence = new StoryPersistenceService(
        config.supabaseUrl,
        config.supabaseKey
      );
    }
  }

  /**
   * Gera uma sequência completa de stories
   */
  async generate(
    input: StoryGeneratorInput,
    sequenceType: SequenceType,
    saveToDb: boolean = false
  ): Promise<GeneratedSequence> {
    // Gerar sequência
    const sequence = await this.generator.generate(input, sequenceType);

    // Salvar se configurado
    if (saveToDb && this.persistence) {
      await this.persistence.save(sequence);
    }

    return sequence;
  }

  /**
   * Valida uma sequência existente
   */
  validate(sequence: GeneratedSequence) {
    return this.generator.validate(sequence);
  }

  /**
   * Repara stories fracos
   */
  async repair(sequence: GeneratedSequence): Promise<GeneratedSequence> {
    const repairResult = await this.repairService.repair(sequence);
    
    if (!repairResult.success) {
      throw new Error('Não foi possível reparar todos os stories');
    }

    return sequence;
  }

  /**
   * Gera e repara automaticamente
   */
  async generateWithRepair(
    input: StoryGeneratorInput,
    sequenceType: SequenceType,
    saveToDb: boolean = false
  ): Promise<GeneratedSequence> {
    let sequence = await this.generate(input, sequenceType, false);
    
    // Se não válido, tentar reparar
    const validation = this.generator.validate(sequence);
    
    if (!validation.isValid) {
      sequence = await this.repair(sequence);
    }

    // Salvar se configurado
    if (saveToDb && this.persistence) {
      await this.persistence.save(sequence);
    }

    return sequence;
  }

  /**
   * Salva sequência manualmente
   */
  async save(sequence: GeneratedSequence): Promise<string> {
    if (!this.persistence) {
      throw new Error('Persistência não configurada');
    }
    return this.persistence.save(sequence);
  }

  /**
   * Busca sequência por ID
   */
  async getById(id: string): Promise<GeneratedSequence | null> {
    if (!this.persistence) {
      throw new Error('Persistência não configurada');
    }
    return this.persistence.getById(id);
  }

  /**
   * Lista sequências do usuário
   */
  async listByUser(userId: string, limit?: number): Promise<GeneratedSequence[]> {
    if (!this.persistence) {
      throw new Error('Persistência não configurada');
    }
    return this.persistence.listByUser(userId, limit);
  }

  /**
   * Obtém score detalhado
   */
  getDetailedScore(sequence: GeneratedSequence) {
    return this.validator.getDetailedScore(sequence.stories);
  }

  /**
   * Obtém stories que precisam de reparo
   */
  getWeakStories(sequence: GeneratedSequence): number[] {
    return this.generator.getWeakStories(sequence);
  }
}

/**
 * Cria uma nova instância da engine
 */
export function createStoryEngine(config: StoryEngineConfig): StoryEngine {
  return new StoryEngine(config);
}

// ============================================
// EXEMPLO DE USO
// ============================================

/*
// 1. Criar engine
const engine = createStoryEngine({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_KEY!,
  config: {
    maxIteracoes: 3,
    minDiversidade: 0.7
  }
});

// 2. Gerar stories
const input: StoryGeneratorInput = {
  userId: 'user_123',
  nicho: 'marketing digital',
  produto: 'mentoria',
  promessa: 'ganhar 5mil por mês',
  tomVoz: 'direto',
  dorPrincipal: 'não conseguir vender',
  objetivo: 'ter renda extra',
  nivelPublico: 'intermediario',
  ctaPrincipal: 'dm'
};

const sequence = await engine.generateWithRepair(input, 'engajamento');

console.log('Stories gerados:', sequence.stories.map(s => s.copy));
console.log('Score:', sequence.scoreDiversidade);

// 3. Acessar stories prontos para copiar
sequence.stories.forEach(story => {
  console.log(`Story ${story.ordem}: ${story.copy}`);
  console.log(`CTA: ${story.cta}`);
});
*/
