// ============================================
// PARSER SEGURO
// ============================================

import {
  GeneratedStory,
  StoryType,
  StoryGeneratorInput,
  GeneratedSequence,
  SequenceType,
  SEQUENCE_CONFIGS
} from './types';

/**
 * Parser seguro para processar saída da IA
 * Gera stories estruturados a partir de texto
 */
export class StoryParser {
  private sequenceConfigs = SEQUENCE_CONFIGS;

  /**
   * Parseia uma resposta de texto da IA para stories estruturados
   */
  parse(
    rawText: string,
    input: StoryGeneratorInput,
    sequenceType: SequenceType
  ): GeneratedStory[] {
    const stories: GeneratedStory[] = [];
    const config = this.sequenceConfigs[sequenceType];
    
    // Extrair stories do texto
    const storyBlocks = this.extractStoryBlocks(rawText);
    
    for (let i = 0; i < storyBlocks.length; i++) {
      const block = storyBlocks[i];
      const tipo = config.tipos[i % config.tipos.length];
      
      const story = this.parseStoryBlock(block, tipo, i + 1, input);
      if (story) {
        stories.push(story);
      }
    }

    // Se não extraiu stories, fazer fallback
    if (stories.length === 0) {
      return this.fallbackParse(rawText, input, sequenceType);
    }

    return stories;
  }

  /**
   * Extrai blocos de stories do texto
   */
  private extractStoryBlocks(text: string): string[] {
    const blocks: string[] = [];
    
    // Tentar diferentes separadores
    const separators = [
      /\nStory \d+:[\s\n]*/gi,
      /\n\d+[\.\)][\s\n]*/gi,
      /---+\n/gi,
      /\n\n/
    ];

    for (const separator of separators) {
      const parts = text.split(separator).filter(p => p.trim().length > 0);
      if (parts.length >= 3) {
        return parts.map(p => p.trim());
      }
    }

    // Fallback: retornar texto inteiro como um bloco
    return [text];
  }

  /**
   * Parseia um bloco individual de story
   */
  private parseStoryBlock(
    block: string,
    tipo: StoryType,
    ordem: number,
    input: StoryGeneratorInput
  ): GeneratedStory | null {
    const lines = block.split('\n').filter(l => l.trim().length > 0);
    
    if (lines.length === 0) return null;

    // Extrair copy principal (primeira linha ou maior linha)
    let copy = lines[0];
    if (lines.length > 1 && lines[1].length > lines[0].length) {
      copy = lines[1];
    }
    
    // Limpar copy
    copy = this.cleanCopy(copy);

    // Detectar elementos interativos
    const elementos = this.detectElements(block);

    // Extrair CTA
    const cta = this.extractCTA(block);

    // Detectar estrutura sintática
    const estrutura = this.detectStructure(copy);

    // Gerar hash único
    const hash = this.generateHash(copy + ordem + tipo);

    // Extrair 3 primeiras palavras
    const primeiras = this.extractFirstWords(copy);

    return {
      id: this.generateId(),
      ordem,
      tipo,
      tipoFormat: this.getTipoFormat(tipo),
      copy,
      elementos,
      cta,
      scoreDiversidade: 0,
      hashConteudo: hash,
      primeirasTresPalavras: primeiras,
      estruturaSintatica: estrutura
    };
  }

  /**
   * Limpa o copy de marcadores unwanted
   */
  private cleanCopy(text: string): string {
    return text
      .replace(/^(Story \d+:|Story:|STORY \d+:)[\s\n]*/gi, '')
      .replace(/^[\d\.\)\-\*]+[\s\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Detecta elementos interativos no story
   */
  private detectElements(text: string): GeneratedStory['elementos'] {
    const elementos: GeneratedStory['elementos'] = [];
    const lower = text.toLowerCase();

    if (lower.includes('?') || lower.includes('responde') || lower.includes('pergunta')) {
      elementos.push('pergunta');
    }
    if (lower.includes('enquete') || lower.includes('vota') || lower.includes('🤚')) {
      elementos.push('enquete');
    }
    if (lower.includes('caixa') || lower.includes('coment') || lower.includes('responde aqui')) {
      elementos.push('caixa');
    }
    if (lower.includes('link') || lower.includes('bio') || lower.includes('clica')) {
      elementos.push('sticker');
    }
    if (lower.includes('contagem') || lower.includes('termina') || lower.includes('horas')) {
      elementos.push('contagem');
    }

    return elementos;
  }

  /**
   * Extrai CTA do story
   */
  private extractCTA(text: string): string {
    const ctaPatterns = [
      /me manda dm.*?([^\n]+)/gi,
      /manda dm.*?([^\n]+)/gi,
      /clica no link.*?([^\n]+)/gi,
      /link no bio.*?([^\n]+)/gi,
      /responde.*?([^\n]+)/gi,
      /me conta.*?([^\n]+)/gi
    ];

    for (const pattern of ctaPatterns) {
      const match = pattern.exec(text);
      if (match) {
        return match[0].trim();
      }
    }

    return '';
  }

  /**
   * Detecta estrutura sintática
   */
  private detectStructure(text: string): string {
    const structures = [
      { pattern: /^Você/, type: 'pergunta_inicial' },
      { pattern: /^A maior/, type: 'afirmacao_forte' },
      { pattern: /^Sabe/, type: 'pergunta_retorica' },
      { pattern: /^Eu/, type: 'narrativa_pessoal' },
      { pattern: /^O erro/, type: 'erro_maioria' },
      { pattern: /^Deixa/, type: 'convite' },
      { pattern: /^Se/, type: 'condicao' },
      { pattern: /^\d+%/i, type: 'numerico' }
    ];

    for (const { pattern, type } of structures) {
      if (pattern.test(text)) {
        return type;
      }
    }

    return 'outro';
  }

  /**
   * Extrai as 3 primeiras palavras
   */
  private extractFirstWords(text: string): string {
    const words = text.split(/\s+/).slice(0, 3);
    return words.join(' ');
  }

  /**
   * Gera hash único para o conteúdo
   */
  private generateHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retorna formato do tipo
   */
  private getTipoFormat(tipo: StoryType): string {
    const formats: Record<StoryType, string> = {
      gatilho: 'pergunta_dor',
      contexto: 'experiencia_pessoal',
      valor: 'erro_maioria',
      conexao: 'vulnerabilidade',
      bastidor: 'processo',
      prova: 'caso_sucesso',
      corte: 'mentira',
      cta: 'pergunta'
    };
    return formats[tipo];
  }

  /**
   * Fallback para quando não conseguir parsear
   */
  private fallbackParse(
    text: string,
    input: StoryGeneratorInput,
    sequenceType: SequenceType
  ): GeneratedStory[] {
    const config = this.sequenceConfigs[sequenceType];
    const stories: GeneratedStory[] = [];
    
    // Quebrar em linhas e criar stories
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    
    for (let i = 0; i < Math.min(lines.length, config.tipos.length); i++) {
      const copy = this.cleanCopy(lines[i]);
      const tipo = config.tipos[i];

      stories.push({
        id: this.generateId(),
        ordem: i + 1,
        tipo,
        tipoFormat: this.getTipoFormat(tipo),
        copy,
        elementos: this.detectElements(copy),
        cta: this.extractCTA(copy),
        scoreDiversidade: 0,
        hashConteudo: this.generateHash(copy),
        primeirasTresPalavras: this.extractFirstWords(copy),
        estruturaSintatica: this.detectStructure(copy)
      });
    }

    return stories;
  }

  /**
   * Cria uma sequência completa de stories
   */
  createSequence(
    stories: GeneratedStory[],
    input: StoryGeneratorInput,
    sequenceType: SequenceType
  ): GeneratedSequence {
    return {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tipo: sequenceType,
      stories,
      input,
      scoreDiversidade: 0,
      status: 'pendente',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export const defaultParser = new StoryParser();
