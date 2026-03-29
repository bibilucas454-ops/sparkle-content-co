// ============================================
// VALIDADOR DE DIVERSIDADE
// ============================================

import {
  GeneratedStory,
  GeneratedSequence,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DiversityScore,
  DEFAULT_CONFIG,
  GenerationConfig
} from './types';

/**
 * Validador de diversidade para stories
 * Implementa todas as regras de validação anti-duplicação
 */
export class DiversityValidator {
  private config: GenerationConfig;

  constructor(config: Partial<GenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Valida uma sequência completa de stories
   */
  validate(sequence: GeneratedSequence): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const stories = sequence.stories;

    // 1. Validar cada story individualmente
    for (let i = 0; i < stories.length; i++) {
      this.validateStory(stories[i], i, errors, warnings);
    }

    // 2. Validar duplicatas entre pares
    this.validateDuplicates(stories, errors, warnings);

    // 3. Validar repetição de 3 primeiras palavras
    this.validateFirstWords(stories, errors, warnings);

    // 4. Validar estrutura sintática
    this.validateStructure(stories, errors, warnings);

    // 5. Validar CTAs repetidos
    this.validateCTAs(stories, errors, warnings);

    // 6. Calcular score de diversidade
    const scoreDiversidade = this.calculateDiversityScore(stories);

    // Remover warnings se não houver errors críticos
    const hasCriticalErrors = errors.some(e => e.severity === 'critical');
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: hasCriticalErrors ? [] : warnings,
      scoreDiversidade,
      storiesIndices: stories.map((_, i) => i)
    };
  }

  /**
   * Valida um story individualmente
   */
  private validateStory(
    story: GeneratedStory,
    index: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Verificar se copy está vazio
    if (!story.copy || story.copy.trim().length === 0) {
      errors.push({
        tipo: 'duplicata',
        storyIndex: index,
        message: `Story ${index + 1}: Conteúdo vazio`,
        severity: 'critical'
      });
    }

    // Verificar se é muito curto
    if (story.copy && story.copy.length < 20) {
      warnings.push({
        tipo: 'conteudo_curto',
        storyIndex: index,
        message: `Story ${index + 1}: Conteúdo muito curto`
      });
    }
  }

  /**
   * Valida duplicatas entre stories
   */
  private validateDuplicates(
    stories: GeneratedStory[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (let i = 0; i < stories.length; i++) {
      for (let j = i + 1; j < stories.length; j++) {
        const similarity = this.calculateSimilarity(stories[i].copy, stories[j].copy);
        
        if (similarity >= this.config.maxSimilaridade) {
          errors.push({
            tipo: 'duplicata',
            storyIndex: j,
            message: `Story ${j + 1} é ${Math.round(similarity * 100)}% similar ao story ${i + 1}`,
            severity: 'critical'
          });
        } else if (similarity >= 0.5) {
          warnings.push({
            tipo: 'similaridade_alta',
            storyIndex: j,
            message: `Story ${j + 1} tem ${Math.round(similarity * 100)}% de similaridade com ${i + 1}`
          });
        }
      }
    }
  }

  /**
   * Valida repetição das 3 primeiras palavras
   */
  private validateFirstWords(
    stories: GeneratedStory[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const firstWordsMap = new Map<string, number[]>();

    stories.forEach((story, index) => {
      const words = story.primeirasTresPalavras.toLowerCase();
      if (!firstWordsMap.has(words)) {
        firstWordsMap.set(words, []);
      }
      firstWordsMap.get(words)!.push(index);
    });

    firstWordsMap.forEach((indices, words) => {
      if (indices.length > 1) {
        errors.push({
          tipo: 'palavras_iniciais',
          storyIndex: indices[1],
          message: `Story ${indices[1] + 1} repete as 3 primeiras palavras: "${words}"`,
          severity: 'critical'
        });
      }
    });
  }

  /**
   * Valida estrutura sintática
   */
  private validateStructure(
    stories: GeneratedStory[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const structureMap = new Map<string, number[]>();

    stories.forEach((story, index) => {
      const structure = story.estruturaSintatica;
      if (!structureMap.has(structure)) {
        structureMap.set(structure, []);
      }
      structureMap.get(structure)!.push(index);
    });

    structureMap.forEach((indices, structure) => {
      if (indices.length > 1) {
        errors.push({
          tipo: 'estrutura_repetida',
          storyIndex: indices[1],
          message: `Story ${indices[1] + 1} repete estrutura sintática: "${structure}"`,
          severity: 'critical'
        });
      }
    });
  }

  /**
   * Valida CTAs repetidos
   */
  private validateCTAs(
    stories: GeneratedStory[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const ctaMap = new Map<string, number[]>();

    stories.forEach((story, index) => {
      const ctaNormalized = story.cta.toLowerCase().trim();
      if (!ctaMap.has(ctaNormalized)) {
        ctaMap.set(ctaNormalized, []);
      }
      ctaMap.get(ctaNormalized)!.push(index);
    });

    ctaMap.forEach((indices, cta) => {
      if (cta && indices.length > 1) {
        errors.push({
          tipo: 'cta_repetido',
          storyIndex: indices[1],
          message: `CTA repetido no story ${indices[1] + 1}: "${cta}"`,
          severity: 'critical'
        });
      }
    });
  }

  /**
   * Calcula similaridade entre dois textos usando Jaccard
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calcula score de diversidade
   */
  private calculateDiversityScore(stories: GeneratedStory[]): number {
    if (stories.length === 0) return 0;

    const scores: Partial<DiversityScore> = {};

    // Score de abertura (diferentes primeiros palavras)
    const firstWords = stories.map(s => s.primeirasTresPalavras.toLowerCase());
    const uniqueFirstWords = new Set(firstWords).size;
    scores.abertura = uniqueFirstWords / stories.length;

    // Score de ritmo (diferentes tamanhos de texto)
    const lengths = stories.map(s => s.copy.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const lengthVariance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
    scores.ritmo = Math.min(1, Math.sqrt(lengthVariance) / avgLength);

    // Score de estrutura (diferentes tipos)
    const types = stories.map(s => s.tipo);
    const uniqueTypes = new Set(types).size;
    scores.estrutura = uniqueTypes / Math.max(1, stories.length);

    // Score de CTA (diferentes CTAs)
    const ctas = stories.map(s => s.cta.toLowerCase());
    const uniqueCTAs = new Set(ctas).size;
    scores.cta = uniqueCTAs / stories.length;

    // Score de vocabulário (similaridade média)
    let totalSimilarity = 0;
    let pairs = 0;
    for (let i = 0; i < stories.length; i++) {
      for (let j = i + 1; j < stories.length; j++) {
        totalSimilarity += this.calculateSimilarity(stories[i].copy, stories[j].copy);
        pairs++;
      }
    }
    const avgSimilarity = pairs > 0 ? totalSimilarity / pairs : 0;
    scores.vocabulario = 1 - avgSimilarity;

    // Score overall
    scores.overall = (
      (scores.abertura || 0) * 0.25 +
      (scores.ritmo || 0) * 0.20 +
      (scores.estrutura || 0) * 0.20 +
      (scores.cta || 0) * 0.20 +
      (scores.vocabulario || 0) * 0.15
    );

    return Math.round((scores.overall || 0) * 100) / 100;
  }

  /**
   * Retorna stories que precisam ser regenerados
   */
  getWeakStories(sequence: GeneratedSequence): number[] {
    const result = this.validate(sequence);
    return result.errors
      .filter(e => e.severity === 'critical')
      .map(e => e.storyIndex);
  }

  /**
   * Retorna o score de diversidade detalhado
   */
  getDetailedScore(stories: GeneratedStory[]): DiversityScore {
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

    const firstWords = stories.map(s => s.primeirasTresPalavras.toLowerCase());
    const uniqueFirstWords = new Set(firstWords).size;
    const abertura = uniqueFirstWords / stories.length;

    const lengths = stories.map(s => s.copy.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const lengthVariance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
    const ritmo = Math.min(1, Math.sqrt(lengthVariance) / avgLength);

    const types = stories.map(s => s.tipo);
    const uniqueTypes = new Set(types).size;
    const estrutura = uniqueTypes / Math.max(1, stories.length);

    const ctas = stories.map(s => s.cta.toLowerCase());
    const uniqueCTAs = new Set(ctas).size;
    const cta = uniqueCTAs / stories.length;

    let totalSimilarity = 0;
    let pairs = 0;
    for (let i = 0; i < stories.length; i++) {
      for (let j = i + 1; j < stories.length; j++) {
        totalSimilarity += this.calculateSimilarity(stories[i].copy, stories[j].copy);
        pairs++;
      }
    }
    const avgSimilarity = pairs > 0 ? totalSimilarity / pairs : 0;
    const vocabulario = 1 - avgSimilarity;

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
}

export const defaultValidator = new DiversityValidator();
