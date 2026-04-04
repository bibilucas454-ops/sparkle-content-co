// ============================================
// SUPORTE A MÚLTIPLOS IDIOMAS
// ============================================

import { StoryType } from './types';

export type Language = 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR';

// ============================================
// TRADUÇÕES
// ============================================

interface Translations {
  // Labels
  nicho: string;
  produto: string;
  promessa: string;
  dorPrincipal: string;
  objetivo: string;
  tomVoz: string;
  ctaPrincipal: string;
  
  // Tipos de sequência
  engajamento: string;
  aquecimento: string;
  venda: string;
  
  // Tipos de story
  gatilho: string;
  contexto: string;
  valor: string;
  conexao: string;
  bastidor: string;
  prova: string;
  corte: string;
  cta: string;
  humor: string;
  depoimento: string;
  mito: string;
  desafio: string;
  resultado: string;
  ensinamento: string;
  
  // Mensagens
  gerando: string;
  pronto: string;
  erro: string;
  copiaSucesso: string;
  
  // Ações
  gerar: string;
  copiar: string;
  salvar: string;
  regenerar: string;
  
  // Placeholders
  nichoPlaceholder: string;
  produtoPlaceholder: string;
  promessaPlaceholder: string;
  dorPlaceholder: string;
  objetivoPlaceholder: string;
}

export const translations: Record<Language, Translations> = {
  'pt-BR': {
    nicho: 'Nicho',
    produto: 'Produto/Serviço',
    promessa: 'Promessa',
    dorPrincipal: 'Dor Principal',
    objetivo: 'Objetivo',
    tomVoz: 'Tom de Voz',
    ctaPrincipal: 'CTA Principal',
    engajamento: 'Engajamento',
    aquecimento: 'Aquecimento',
    venda: 'Venda',
    gatilho: 'Gatilho',
    contexto: 'Contexto',
    valor: 'Valor',
    conexao: 'Conexão',
    bastidor: 'Bastidor',
    prova: 'Prova',
    corte: 'Corte de Crença',
    cta: 'Call to Action',
    humor: 'Humor',
    depoimento: 'Depoimento',
    mito: 'Mito',
    desafio: 'Desafio',
    resultado: 'Resultado',
    ensinamento: 'Ensinamento',
    gerando: 'Gerando stories...',
    pronto: 'Pronto!',
    erro: 'Erro ao gerar',
    copiaSucesso: 'Copiado!',
    gerar: 'Gerar',
    copiar: 'Copiar',
    salvar: 'Salvar',
    regenerar: 'Regenerar',
    nichoPlaceholder: 'Ex: Marketing Digital',
    produtoPlaceholder: 'Ex: Mentoria',
    promessaPlaceholder: 'Ex: Ganhar 5mil/mês',
    dorPlaceholder: 'Ex: Não consigo vender',
    objetivoPlaceholder: 'Ex: Ter renda extra'
  },
  
  'en-US': {
    nicho: 'Niche',
    produto: 'Product/Service',
    promessa: 'Promise',
    dorPrincipal: 'Main Pain',
    objetivo: 'Goal',
    tomVoz: 'Voice Tone',
    ctaPrincipal: 'Main CTA',
    engajamento: 'Engagement',
    aquecimento: 'Warm-up',
    venda: 'Sales',
    gatilho: 'Trigger',
    contexto: 'Context',
    valor: 'Value',
    conexao: 'Connection',
    bastidor: 'Behind the Scenes',
    prova: 'Proof',
    corte: 'Belief Cutting',
    cta: 'Call to Action',
    humor: 'Humor',
    depoimento: 'Testimonial',
    mito: 'Myth',
    desafio: 'Challenge',
    resultado: 'Result',
    ensinamento: 'Lesson',
    gerando: 'Generating stories...',
    pronto: 'Done!',
    erro: 'Error generating',
    copiaSucesso: 'Copied!',
    gerar: 'Generate',
    copiar: 'Copy',
    salvar: 'Save',
    regenerar: 'Regenerate',
    nichoPlaceholder: 'Ex: Digital Marketing',
    produtoPlaceholder: 'Ex: Mentoring',
    promessaPlaceholder: 'Ex: Make $5k/month',
    dorPlaceholder: "Ex: Can't sell",
    objetivoPlaceholder: 'Ex: Extra income'
  },
  
  'es-ES': {
    nicho: 'Nicho',
    produto: 'Producto/Servicio',
    promessa: 'Promesa',
    dorPrincipal: 'Dolor Principal',
    objetivo: 'Objetivo',
    tomVoz: 'Tono de Voz',
    ctaPrincipal: 'CTA Principal',
    engajamento: 'Compromiso',
    aquecimento: 'Calentamiento',
    venda: 'Venta',
    gatilho: 'Gatillo',
    contexto: 'Contexto',
    valor: 'Valor',
    conexao: 'Conexión',
    bastidor: 'Bastidores',
    prueba: 'Prueba',
    corte: 'Corte de Creencia',
    cta: 'Llamada a la Acción',
    humor: 'Humor',
    depoimento: 'Testimonio',
    mito: 'Mito',
    desafio: 'Desafío',
    resultado: 'Resultado',
    ensinamiento: 'Enseñanza',
    generando: 'Generando historias...',
    pronto: '¡Listo!',
    erro: 'Error al generar',
    copiaSuceso: '¡Copiado!',
    generar: 'Generar',
    copiar: 'Copiar',
    salvar: 'Guardar',
    regenerar: 'Regenerar',
    nichoPlaceholder: 'Ej: Marketing Digital',
    produtoPlaceholder: 'Ej: Mentoría',
    promessaPlaceholder: 'Ej: Ganar 5mil/mes',
    dorPlaceholder: 'Ej: No puedo vender',
    objetivoPlaceholder: 'Ej: Ingreso extra'
  },
  
  'fr-FR': {
    nicho: 'Niche',
    produto: 'Produit/Service',
    promessa: 'Promesse',
    dorPrincipal: 'Douleur Principale',
    objetivo: 'Objectif',
    tomVoz: 'Ton de Voix',
    ctaPrincipal: 'CTA Principal',
    engajamento: 'Engagement',
    aquecimento: 'Échauffement',
    venda: 'Vente',
    gatilho: 'Déclencheur',
    contexto: 'Contexte',
    valor: 'Valeur',
    conexao: 'Connexion',
    bastidor: ' Coulisses',
    prova: 'Preuve',
    corte: 'Croyance',
    cta: "Appel à l'Action",
    humor: 'Humour',
    depoimento: 'Témoignage',
    mito: 'Mythe',
    desafio: 'Défi',
    resultado: 'Résultat',
    ensinamento: 'Leçon',
    gerando: 'Génération des histoires...',
    pronto: 'Prêt!',
    erro: "Erreur d'generation",
    copiaSucesso: 'Copie!',
    gerar: 'Générer',
    copier: 'Copier',
    salvar: 'Sauvegarder',
    regenerer: 'Régénérer',
    nichoPlaceholder: 'Ex: Marketing Digital',
    produtoPlaceholder: 'Ex: Mentorat',
    promessaPlaceholder: 'Ex: Gagner 5k/mois',
    dorPlaceholder: "Ex: Je n'arrive pas à vendre",
    objectifPlaceholder: 'Ex: Revenu supplémentaire'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtém tradução por chave
 */
export function t(key: keyof Translations, lang: Language): string {
  return translations[lang][key] || translations['pt-BR'][key];
}

/**
 * Obtém todas as traduções para uma língua
 */
export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

/**
 * Detecta língua do navegador
 */
export function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'pt-BR';
  
  const browserLang = navigator.language;
  
  if (browserLang.startsWith('en')) return 'en-US';
  if (browserLang.startsWith('es')) return 'es-ES';
  if (browserLang.startsWith('fr')) return 'fr-FR';
  
  return 'pt-BR';
}

// ============================================
// TRANSLATOR CLASS
// ============================================

export class StoryTranslator {
  private language: Language;

  constructor(language: Language = 'pt-BR') {
    this.language = language;
  }

  setLanguage(lang: Language): void {
    this.language = lang;
  }

  getLanguage(): Language {
    return this.language;
  }

  // Traduz tipo de story
  translateStoryType(tipo: StoryType): string {
    const key = tipo as keyof Translations;
    return t(key, this.language);
  }

  // Traduz tipo de sequência
  translateSequenceType(tipo: string): string {
    return t(tipo as keyof Translations, this.language);
  }

  // Traduz objeto completo
  translateSequence(sequence: any): any {
    return {
      ...sequence,
      stories: sequence.stories.map((story: any) => ({
        ...story,
        tipo: this.translateStoryType(story.tipo)
      })),
      tipo: this.translateSequenceType(sequence.tipo)
    };
  }
}

// ============================================
// TRANSLATOR INSTANCE
// ============================================

export const defaultTranslator = new StoryTranslator();

// ============================================
// CONVERSION FUNCTION
// ============================================

/**
 * Converte stories para outro idioma
 */
export function translateStories(
  stories: any[], 
  fromLang: Language, 
  toLang: Language
): any[] {
  const fromTranslations = translations[fromLang];
  const toTranslations = translations[toLang];
  
  return stories.map(story => {
    // Converter tipo de story
    let novoTipo = story.tipo;
    const tipos = Object.keys(fromTranslations) as (keyof Translations)[];
    
    // Encontrar equivalente do tipo
    for (const tipo of tipos) {
      if (fromTranslations[tipo] === story.tipo) {
        novoTipo = toTranslations[tipo];
        break;
      }
    }
    
    return {
      ...story,
      tipo: novoTipo
    };
  });
}
