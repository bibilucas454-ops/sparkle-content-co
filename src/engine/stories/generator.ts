// ============================================
// SERVIÇO DE GERAÇÃO COM VARIAÇÃO INFINITA
// ============================================

import {
  StoryGeneratorInput,
  GeneratedSequence,
  GeneratedStory,
  SequenceType,
  IAProvider,
  GenerationConfig,
  DEFAULT_CONFIG,
  SEQUENCE_CONFIGS,
  StoryType
} from './types';
import { DiversityValidator } from './validator';
import { StoryParser } from './parser';

/**
 * Engine principal de geração de stories
 * Implementa variação infinita com controle de abertura, ritmo e estrutura
 */
export class StoryGeneratorEngine {
  private provider: IAProvider;
  private validator: DiversityValidator;
  private parser: StoryParser;
  private config: GenerationConfig;

  constructor(
    provider: IAProvider,
    config: Partial<GenerationConfig> = {}
  ) {
    this.provider = provider;
    this.validator = new DiversityValidator(config);
    this.parser = new StoryParser();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Gera uma sequência completa de stories
   */
  async generate(
    input: StoryGeneratorInput,
    sequenceType: SequenceType
  ): Promise<GeneratedSequence> {
    const config = SEQUENCE_CONFIGS[sequenceType];
    const totalStories = config.storiesPorDia;
    
    let sequence = this.parser.createSequence([], input, sequenceType);
    let iteracao = 0;
    let maxAttempts = this.config.maxIteracoes;

    while (iteracao < maxAttempts) {
      iteracao++;

      // Gerar stories
      const stories = await this.generateStories(input, sequenceType, totalStories, sequence.stories);
      sequence = this.parser.createSequence(stories, input, sequenceType);

      // Validar
      const validation = this.validator.validate(sequence);

      if (validation.isValid && validation.scoreDiversidade >= this.config.minDiversidade) {
        sequence.status = 'pronto';
        sequence.scoreDiversidadeTotal = validation.scoreDiversidade;
        return sequence;
      }

      // Se não válido, marcar para reparo seletivo
      if (iteracao < maxAttempts) {
        sequence.status = 'regerando';
      }
    }

    // Após todas as iterações, retornar o melhor resultado
    sequence.status = 'erro';
    return sequence;
  }

  /**
   * Gera stories com variação infinita
   */
  private async generateStories(
    input: StoryGeneratorInput,
    sequenceType: SequenceType,
    total: number,
    existingStories: GeneratedStory[]
  ): Promise<GeneratedStory[]> {
    const stories: GeneratedStory[] = [];
    const config = SEQUENCE_CONFIGS[sequenceType];
    
    // Gerar cada story com variação
    for (let i = 0; i < total; i++) {
      const tipo = config.tipos[i % config.tipos.length];
      const storyNumber = i + 1;
      const totalStories = total;
      
      // Prompt com variação infinita
      const prompt = this.buildPrompt(input, tipo, storyNumber, totalStories, stories);
      
      // Chamar IA
      const rawResponse = await this.provider.generate(prompt, {
        temperature: 0.7 + (Math.random() * 0.3), // 0.7-1.0 para variação
        maxTokens: 1500
      });

      // Parsear resposta
      const parsedStories = this.parser.parse(rawResponse, input, sequenceType);
      
      if (parsedStories.length > 0) {
        stories.push(parsedStories[0]);
      } else {
        // Fallback se parse falhar
        stories.push(this.createFallbackStory(tipo, i + 1, input));
      }
    }

    return stories;
  }

  /**
   * Constrói prompt com variação infinita
   */
  private buildPrompt(
    input: StoryGeneratorInput,
    tipo: StoryType,
    storyNumber: number,
    totalStories: number,
    existingStories: GeneratedStory[]
  ): string {
    const tomVoz = this.getTomVozDescription(input.tomVoz);
    const variacao = this.getVariacaoPrompt(storyNumber);
    
    return `
# GERAÇÃO DE STORY ${storyNumber}/${totalStories}

## Contexto
- Nicho: ${input.nicho}
- Produto: ${input.produto}
- Promessa: ${input.promessa}
- Dor principal: ${input.dorPrincipal}
- Objetivo: ${input.objetivo}
- Tom de voz: ${tomVoz}

## Estrutura do Funil
- Tipo de sequência: ${tipo}
- Story ${storyNumber} de ${totalStories}

## Regras OBRIGATÓRIAS (nunca violate):
1. NUNCA repita a frase base literalmente
2. NUNCA use as 3 primeiras palavras de qualquer story anterior
3. NUNCA repita o mesmo tipo de pergunta ou CTA
4. NUNCA repita a estrutura sintática (pergunta, afirmação, etc)
5. CADA story deve ter PAPEL ESPECÍFICO na sequência
6. O copy deve ser PRONTO PARA COPIAR E POSTAR

## Stories já gerados (EVITAR repetição):
${existingStories.map((s, i) => `${i + 1}. [${s.tipo}] "${s.primeirasTresPalavras}..." - estrutura: ${s.estruturaSintatica}`).join('\n')}

## Variação Required:
${variacao}

## Tipo deste story: ${tipo}
- Função: ${this.getTipoDescription(tipo)}
- Gere APENAS este story, pronto para usar
- Copy em português brasileiro
- Estilo conversacional
- Max 200 caracteres por story
- Inclua elemento interativo quando apropriado

Story ${storyNumber}:
`;
  }

  /**
   * Retorna descrição do tom de voz
   */
  private getTomVozDescription(tom: string): string {
    const tons: Record<string, string> = {
      direto: 'Direto, sem enrolação, autoridade silenciosa',
      emocional: 'Emocional, empático, conexão profunda',
      pragmatico: 'Prático, objetivo, focado em resultados',
      protector: 'Protetor, acolhedor, como um mentor que guia'
    };
    return tons[tom] || tons.direto;
  }

  /**
   * Retorna variação de prompt para garantir texto diferente
   */
  private getVariacaoPrompt(storyNumber: number): string {
    const variacoes = [
      'Use uma abordagem diferente: comece com pergunta provocativa',
      'Varie o início: Use uma afirmação forte agora',
      'Mude o ângulo: Conte uma micro-história pessoal',
      'Experimente: Use dados ou números para começar',
      'Inove: Comece com uma contradição interessante',
      'Altere: Use "e se" para gerar curiosidade',
      'Renove: Comece com uma observação surpreendente',
      'Diferencie: Use analogia ou metáfora'
    ];
    return variacoes[storyNumber % variacoes.length];
  }

  /**
   * Retorna descrição do tipo de story
   */
  private getTipoDescription(tipo: StoryType): string {
    const descricoes: Record<StoryType, string> = {
      gatilho: 'Parar o scroll, gerar curiosidade imediata',
      contexto: 'Estabelecer tema, criar identificação',
      valor: 'Ensinar algo prático, gerar valor',
      conexao: 'Criar vínculo emocional, humanizar',
      bastidor: 'Mostrar processo, construir credibilidade',
      prova: 'Demonstrar resultados, criar desejo',
      corte: 'Desconstruir crenças limitantes',
      cta: 'Direcionar para ação específica'
    };
    return descricoes[tipo];
  }

  /**
   * Cria story de fallback
   */
  private createFallbackStory(
    tipo: StoryType,
    ordem: number,
    input: StoryGeneratorInput
  ): GeneratedStory {
    return {
      id: `fallback_${Date.now()}_${ordem}`,
      ordem,
      tipo,
      tipoFormat: this.parser['getTipoFormat'](tipo),
      copy: `Story ${ordem} sobre ${input.promessa}. ${input.dorPrincipal}.`,
      elementos: [],
      cta: '',
      scoreDiversidade: 0,
      hashConteudo: `fallback_${ordem}`,
      primeirasTresPalavras: `Story ${ordem} sobre`,
      estruturaSintatica: 'outro'
    };
  }

  /**
   * Valida sequência existente
   */
  validate(sequence: GeneratedSequence) {
    return this.validator.validate(sequence);
  }

  /**
   * Retorna stories fracos que precisam de regeneração
   */
  getWeakStories(sequence: GeneratedSequence): number[] {
    return this.validator.getWeakStories(sequence);
  }

  /**
   * Regenera apenas stories fracos
   */
  async regenerateWeakStories(
    sequence: GeneratedSequence,
    input: StoryGeneratorInput
  ): Promise<GeneratedSequence> {
    const weakIndices = this.getWeakStories(sequence);
    
    if (weakIndices.length === 0) {
      sequence.status = 'pronto';
      return sequence;
    }

    // Regenerar cada story fraco
    for (const index of weakIndices) {
      const tipo = sequence.stories[index].tipo;
      
      const prompt = this.buildPrompt(
        input,
        tipo,
        index + 1,
        sequence.stories.length,
        sequence.stories.filter((_, i) => i !== index)
      );

      const rawResponse = await this.provider.generate(prompt, {
        temperature: 0.9,
        maxTokens: 1000
      });

      const newStories = this.parser.parse(rawResponse, input, sequence.tipo);
      
      if (newStories.length > 0) {
        sequence.stories[index] = newStories[0];
      }
    }

    // Revalidar
    const validation = this.validator.validate(sequence);
    sequence.scoreDiversidade = validation.scoreDiversidade;
    sequence.status = validation.isValid ? 'pronto' : 'erro';

    return sequence;
  }
}
