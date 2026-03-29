// ============================================
// REPARO SELETIVO
// ============================================

import {
  GeneratedSequence,
  GeneratedStory,
  StoryGeneratorInput,
  RepairResult,
  IAProvider,
  StoryType,
  SEQUENCE_CONFIGS
} from './types';
import { DiversityValidator } from './validator';
import { StoryParser } from './parser';

/**
 * Serviço de reparo seletivo
 * Regenera apenas os stories com problemas, mantendo os bons
 */
export class SelectiveRepairService {
  private provider: IAProvider;
  private validator: DiversityValidator;
  private parser: StoryParser;
  private maxIterations: number;

  constructor(
    provider: IAProvider,
    maxIterations: number = 3
  ) {
    this.provider = provider;
    this.validator = new DiversityValidator();
    this.parser = new StoryParser();
    this.maxIterations = maxIterations;
  }

  /**
   * Repara uma sequência, regenerando apenas stories fracos
   */
  async repair(sequence: GeneratedSequence): Promise<RepairResult> {
    const storiesInalterados: GeneratedStory[] = [];
    const storiesReparados: GeneratedStory[] = [];
    let currentSequence = { ...sequence };
    let iteracoes = 0;

    while (iteracoes < this.maxIterations) {
      iteracoes++;

      // Validar e encontrar stories fracos
      const validation = this.validator.validate(currentSequence);
      
      if (validation.isValid) {
        return {
          storiesReparados,
          storiesInalterados: currentSequence.stories,
          iteracoes,
          success: true
        };
      }

      // Identificar stories com problemas
      const weakIndices = this.identifyWeakStories(validation.errors);
      
      if (weakIndices.length === 0) {
        break;
      }

      // Regenerar apenas stories fracos
      for (const index of weakIndices) {
        const story = currentSequence.stories[index];
        
        // Gerar novo story
        const newStory = await this.regenerateStory(
          story,
          index,
          currentSequence.stories,
          sequence.input
        );

        if (newStory) {
          storiesReparados.push(newStory);
          currentSequence.stories[index] = newStory;
        }
      }
    }

    // Verificar resultado final
    const finalValidation = this.validator.validate(currentSequence);
    
    return {
      storiesReparados,
      storiesInalterados: currentSequence.stories.filter(
        (_, i) => !storiesReparados.some(r => r.ordem === i + 1)
      ),
      iteracoes,
      success: finalValidation.isValid
    };
  }

  /**
   * Identifica indices dos stories fracos
   */
  private identifyWeakStories(errors: { storyIndex: number }[]): number[] {
    const indices = new Set<number>();
    
    for (const error of errors) {
      indices.add(error.storyIndex);
    }
    
    return Array.from(indices);
  }

  /**
   * Regenera um único story
   */
  private async regenerateStory(
    originalStory: GeneratedStory,
    index: number,
    existingStories: GeneratedStory[],
    input: StoryGeneratorInput
  ): Promise<GeneratedStory | null> {
    const tipo = originalStory.tipo;
    const config = SEQUENCE_CONFIGS[input.nicho ? 'engajamento' : 'engajamento'];
    
    // Criar prompt específico para regeneração
    const prompt = this.buildRepairPrompt(
      input,
      tipo,
      index + 1,
      existingStories,
      originalStory
    );

    try {
      const rawResponse = await this.provider.generate(prompt, {
        temperature: 0.95, // Alta temperatura para máxima variação
        maxTokens: 800
      });

      const newStories = this.parser.parse(rawResponse, input, 'engajamento');
      
      if (newStories.length > 0) {
        const newStory = newStories[0];
        newStory.ordem = index + 1;
        return newStory;
      }
    } catch (error) {
      console.error(`Erro ao regenerar story ${index + 1}:`, error);
    }

    return null;
  }

  /**
   * Constrói prompt de reparo
   */
  private buildRepairPrompt(
    input: StoryGeneratorInput,
    tipo: StoryType,
    storyNumber: number,
    existingStories: GeneratedStory[],
    originalStory: GeneratedStory
  ): string {
    // Obter tipos e palavras a evitar
    const avoidTypes = existingStories
      .filter((s, i) => i !== storyNumber - 1)
      .map(s => s.tipo);
    
    const avoidFirstWords = existingStories
      .filter((s, i) => i !== storyNumber - 1)
      .map(s => s.primeirasTresPalavras.toLowerCase());
    
    const avoidStructures = existingStories
      .filter((s, i) => i !== storyNumber - 1)
      .map(s => s.estruturaSintatica);

    return `
# REGENERAÇÃO DE STORY ${storyNumber}

## Problema identificado:
O story atual tem problemas de duplicação ou similaridade:
- Tipo: ${originalStory.tipo}
- Primeiras palavras: "${originalStory.primeirasTresPalavras}"
- Estrutura: ${originalStory.estruturaSintatica}

## Contexto:
- Nicho: ${input.nicho}
- Produto: ${input.produto}
- Promessa: ${input.promessa}
- Dor principal: ${input.dorPrincipal}

## REGRAS OBRIGATÓRIAS (CRÍTICO):
1. NUNCA use as 3 primeiras palavras: ${avoidFirstWords.join(', ')}
2. NUNCA repita estrutura: ${avoidStructures.join(', ')}
3. Use tipo diferente ou variação significativa
4. Copy totalmente diferente do original

## Stories existentes:
${existingStories.map((s, i) => `${i + 1}. [${s.tipo}] "${s.primeirasTresPalavras}..." - ${s.estruturaSintatica}`).join('\n')}

## Story original (EVITAR):
"${originalStory.copy}"

## Instrução:
Gere um NOVO story sobre o mesmo tema, mas com:
- Abertura TOTALMENTE diferente
- Estrutura sintática diferente
- Tom de voz diferente

Story ${storyNumber}:
`;
  }

  /**
   * Repara apenas um story específico
   */
  async repairSingleStory(
    sequence: GeneratedSequence,
    storyIndex: number
  ): Promise<GeneratedSequence> {
    const story = sequence.stories[storyIndex];
    
    const newStory = await this.regenerateStory(
      story,
      storyIndex,
      sequence.stories,
      sequence.input
    );

    if (newStory) {
      sequence.stories[storyIndex] = newStory;
    }

    // Revalidar
    const validation = this.validator.validate(sequence);
    sequence.scoreDiversidade = validation.scoreDiversidade;

    return sequence;
  }

  /**
   * Avalia se um story precisa de reparo
   */
  needsRepair(story: GeneratedStory, existingStories: GeneratedStory[]): boolean {
    // Verificar primeiras palavras
    for (const existing of existingStories) {
      if (existing.ordem === story.ordem) continue;
      
      if (existing.primeirasTresPalavras.toLowerCase() === 
          story.primeirasTresPalavras.toLowerCase()) {
        return true;
      }

      if (existing.estruturaSintatica === story.estruturaSintatica) {
        return true;
      }
    }

    return false;
  }
}
