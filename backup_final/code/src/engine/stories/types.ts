// ============================================
// TYPES - Engine de Stories com Variação Infinita
// ============================================

// Inputs do usuário para geração
export interface StoryGeneratorInput {
  userId: string;
  nicho: string;
  produto: string;
  preco?: number;
  promessa: string;
  tomVoz: 'direto' | 'emocional' | 'pragmatico' | 'protector';
  dorPrincipal: string;
  objetivo: string;
  nivelPublico: 'iniciante' | 'intermediario' | 'avancado';
  ctaPrincipal: 'dm' | 'link' | 'highlight';
  images?: string[];
}

// Tipos de story dentro de uma sequência
export type StoryType = 
  | 'gatilho'
  | 'contexto'
  | 'valor'
  | 'conexao'
  | 'bastidor'
  | 'prova'
  | 'corte'
  | 'cta'
  | 'humor'
  | 'depoimento'
  | 'mito'
  | 'desafio'
  | 'resultado'
  | 'ensinamento';

// Tipos de sequência
export type SequenceType = 'engajamento' | 'aquecimento' | 'venda';

// Estrutura de um story gerado
export interface GeneratedStory {
  id: string;
  ordem: number;
  tipo: StoryType;
  tipoFormat: string;
  copy: string;
  elementos: ('enquete' | 'pergunta' | 'caixa' | 'sticker' | 'contagem')[];
  cta: string;
  scoreDiversidade: number;
  hashConteudo: string;
  primeirasTresPalavras: string;
  estruturaSintatica: string;
}

// Sequência completa de stories
export interface GeneratedSequence {
  id: string;
  tipo: SequenceType;
  stories: GeneratedStory[];
  input: StoryGeneratorInput;
  scoreDiversidadeTotal: number;
  status: 'pendente' | 'validando' | 'valido' | 'regerando' | 'pronto' | 'erro';
  createdAt: Date;
  updatedAt: Date;
}

// Resultado da validação
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  scoreDiversidade: number;
  storiesIndices: number[];
}

export interface ValidationError {
  tipo: 'duplicata' | 'estrutura_repetida' | 'cta_repetido' | 'palavras_iniciais' | 'similaridade_alta';
  storyIndex: number;
  message: string;
  severity: 'critical' | 'warning';
}

export interface ValidationWarning {
  tipo: string;
  storyIndex: number;
  message: string;
}

// Provider de IA abstrato
export interface IAProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  getName(): string;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// Resultado do reparo seletivo
export interface RepairResult {
  storiesReparados: GeneratedStory[];
  storiesInalterados: GeneratedStory[];
  iteracoes: number;
  success: boolean;
}

// Score de diversidade para persistência
export interface DiversityScore {
  overall: number;
  abertura: number;
  ritmo: number;
  estrutura: number;
  cta: number;
  vocabulario: number;
}

// Histórico de geração
export interface GenerationHistory {
  id: string;
  userId: string;
  input: StoryGeneratorInput;
  output: GeneratedSequence;
  validacao: ValidationResult;
  repairs: number;
  createdAt: Date;
}

// Configuração de geração
export interface GenerationConfig {
  maxIteracoes: number;
  maxSimilaridade: number;
  minDiversidade: number;
  permitirDuplicatas: boolean;
  forcarVariacao: boolean;
}

// ============================================
// CONSTANTS
// ============================================

export const STORY_TYPES: StoryType[] = [
  'gatilho', 'contexto', 'valor', 'conexao', 
  'bastidor', 'prova', 'corte', 'cta',
  'humor', 'depoimento', 'mito', 'desafio',
  'resultado', 'ensinamento'
];

export const SEQUENCE_CONFIGS: Record<SequenceType, { dias: number; storiesPorDia: number; tipos: StoryType[] }> = {
  engajamento: {
    dias: 5,
    storiesPorDia: 5,
    tipos: ['gatilho', 'contexto', 'valor', 'conexao', 'cta']
  },
  aquecimento: {
    dias: 3,
    storiesPorDia: 5,
    tipos: ['corte', 'valor', 'bastidor', 'prova', 'cta']
  },
  venda: {
    dias: 2,
    storiesPorDia: 7,
    tipos: ['gatilho', 'corte', 'valor', 'prova', 'valor', 'cta', 'cta']
  }
};

export const DEFAULT_CONFIG: GenerationConfig = {
  maxIteracoes: 5,
  maxSimilaridade: 0.7,
  minDiversidade: 0.6,
  permitirDuplicatas: false,
  forcarVariacao: true
};
