// ============================================
// TEMPLATES PRONTOS POR NICHO
// ============================================

import { StoryType } from './types';

// Tipos de nicho suportados
export type NicheType = 
  | 'marketing_digital'
  | 'empreendedorismo'
  | 'financas'
  | 'saude'
  | 'relacionamentos'
  | 'desenvolvimento_pessoal'
  | 'educacao'
  | 'tech'
  | 'lifestyle';

// Templates por tipo de story
export interface StoryTemplate {
  tipo: StoryType;
  abertura: string[];
  contextos: string[];
  valores: string[];
  ctas: string[];
}

export interface NicheTemplates {
  nicho: NicheType;
  dor: string;
  promise: string;
  templates: Record<StoryType, StoryTemplate>;
}

// Templates por nicho
export const NICHE_TEMPLATES: Record<NicheType, NicheTemplates> = {
  marketing_digital: {
    nicho: 'marketing_digital',
    dor: 'não conseguir vender online',
    promise: 'faturar R$10mil/mês online',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: [
          'Você sabe por que 90% dos marketers não vendem?',
          'O erro que eu cometi no início da minha carreira...',
          'Qual é a sua maior frustração com marketing digital?'
        ],
        contextos: [
          'Eu tentei de tudo: anúncios, conteúdo, parcerias...',
          'Depois de ajudar 200+ empreendedores, percebi algo...',
          'Sabe o que separa quem vende de quem não vende?'
        ],
        valores: [
          'Foque em UM canal até dominar. Mais que isso = dispersão.',
          'Tráfego é resultado de posicionamento forte.',
          'Venda antes de criar produto. Valide primeiro.'
        ],
        ctas: [
          'Me conta sua maior dificuldade nos comments',
          'Quer saber mais? Manda DM',
          'Se identificou? Responde aqui'
        ]
      },
      corte: {
        tipo: 'corte',
        abertura: [
          'A maior MENTIRA do marketing digital é que você precisa de muito dinheiro.',
          'Você NÃO precisa de 10k seguidores para vender.',
          'Esquece o funil mirabolante. O básico funciona.'
        ],
        contextos: [
          'Eu comecei com R$0 e sem audiência.',
          'O mercado não espera você ficar pronto.',
          'Pare de estudar. Comece a executar.'
        ],
        valores: [
          'Método > Dinheiro. Execute com o que tem.',
          'Posicionamento > Tráfego. Sem isso, anúncios não funcionam.',
          'Validação > Produto. Venda antes de criar.'
        ],
        ctas: [
          'Quer o método? Manda DM com MÉTODO',
          'Quer saber como eu fiz? Me chama',
          'Bora sair do zero? Responde aqui'
        ]
      },
      prova: {
        tipo: 'prova',
        abertura: [
          'Esse cara fechou R$15mil em 30 dias...',
          'Ela começou do zero. Hoje fatura 5 dígitos.',
          'Resultado real: de R$0 para R$8.400 em 45 dias.'
        ],
        contextos: [
          'Estava no mesmo lugar que você.',
          'Aplicou EXATAMENTE o que ensino.',
          'Sem experiência. Sem audiência. Só execução.'
        ],
        valores: [
          'Não é sobre sorte. É sobre método.',
          'Executou + Teve paciência = Resultado.',
          'Seguiu o passo a passo.'
        ],
        ctas: [
          'Quer ser o próximo? Me conta sua situação',
          'Quer saber como ele fez? Manda DM',
          'Resultado inspirou você? Responde aqui'
        ]
      },
      // Tipos padrão
      contexto: {
        tipo: 'contexto',
        abertura: [
          'Deixa eu te contar uma história...',
          'Isso aconteceu comigo há 2 anos...',
          'Sabe o que eu aprendi essa semana?'
        ],
        contextos: [
          'Foi difícil. Mas ensinou muito.',
          'Eu percebi que precisava mudar.',
          'A partir daí, tudo mudou.'
        ],
        valores: [
          'A experiência ensina melhor que qualquer curso.',
          'Erros são aprendizados.',
          'Cada obstacle te fortalece.'
        ],
        ctas: [
          'Me conta nos comments',
          'Quer saber mais?',
          'Bora continuar?'
        ]
      },
      valor: {
        tipo: 'valor',
        abertura: [
          'Vou te ensinar algo agora...',
          'Isso mudou minha forma de trabalhar.',
          'Fica até o final que vou te mostrar.'
        ],
        contextos: [
          'É simples. Mas poucos fazem.',
          'A diferença está nos detalhes.',
          'Isso separa quem cresce de quem estagna.'
        ],
        valores: [
          'Foco > Quantidade. Execute 1 coisa bem feita.',
          'Rotina > Motivação. Construa hábito.',
          'Estratégia > Tática. Pense antes de agir.'
        ],
        ctas: [
          'Aplicou? Me conta o resultado',
          'Quer aprender mais?',
          'Compartilha com alguém que precisa'
        ]
      },
      conexao: {
        tipo: 'conexao',
        abertura: [
          'Eu sei como isso é difícil...',
          'Você não está sozinho nessa.',
          'Já passei por isso. E sei como dói.'
        ],
        contextos: [
          ' foram os piores dias. Mas aprendi.',
          'Eu quase desisti. Mas segui.',
          'A frustração me ensinou muito.'
        ],
        valores: [
          'Força vem da superação.',
          'Você é mais forte do que pensa.',
          'Cada desafio te aproxima do objetivo.'
        ],
        ctas: [
          'Me conta sua história',
          'Se identificou? Responde aqui',
          'Você não está sozinho'
        ]
      },
      bastidor: {
        tipo: 'bastidor',
        abertura: [
          'Olha só o que eu fiz hoje...',
          'Esse é o meu processo real.',
          'Deixa eu te mostrar como funciona.'
        ],
        contextos: [
          'Não é glamouroso. Mas funciona.',
          'Isso acontece por trás das câmeras.',
          'Todo dia é assim.'
        ],
        valores: [
          'Processo documentado é mentoria.',
          'Bastidores constroem autoridade.',
          'Mostre quem você é. Não o que finge.'
        ],
        ctas: [
          'Quer ver mais? Me segue',
          'Gostou? Compartilha',
          'Pergunta? Manda DM'
        ]
      },
      cta: {
        tipo: 'cta',
        abertura: [
          'Última chamada...',
          'Se quer mudar, agora é a hora.',
          'O que você vai fazer com isso?'
        ],
        contextos: [
          'Não deixe para depois.',
          'O momento é agora.',
          'Decisão de hoje, resultado de amanhã.'
        ],
        valores: [
          'Ação gera resultado.',
          'Apenas 1 passo já muda tudo.',
          'Comece agora. Ajustes vem depois.'
        ],
        ctas: [
          'Manda DM com QUERO',
          'Clique no link',
          'Responde SIM se você vai agir'
        ]
      },
      humor: {
        tipo: 'humor',
        abertura: [
          'A vida do empreendedor em 1 story...',
          'Quem nunca, né? 😂',
          'Isso me lembra uma história...'
        ],
        contextos: [
          'Todo mundo passa por isso.',
          'A gente ri pra não chorar.',
          'Isso é o dia a dia.'
        ],
        valores: [
          'Humor alivia a tensão.',
          'Rir de si mesmo é força.',
          'Levantei, balancei, segui.'
        ],
        ctas: [
          'Se identificou? Marca um amigo',
          'Ri? Deixa o emoji 😂',
          'Me conta tua história'
        ]
      },
      depoimento: {
        tipo: 'depoimento',
        abertura: [
          'Esse relato me emocionou...',
          'O que esse aluno me disse...',
          'Mensagem que recebi hoje:'
        ],
        contextos: [
          'Ele estava no zero. Hoje está em outro nível.',
          'Ela aplicou. Funcionou.',
          'Resultado fala louder que palavras.'
        ],
        valores: [
          'Prova social é poder.',
          'Resultados reais mudam crenças.',
          'Outros conseguem. Você também.'
        ],
        ctas: [
          'Quer ter uma história assim?',
          'Me mande sua história também',
          'Bora construir a sua?'
        ]
      },
      mito: {
        tipo: 'mito',
        abertura: [
          'Você ainda acredita nisso?',
          'Esse mito está te sabotando.',
          'Todo mundo fala. Ninguém prova.'
        ],
        contextos: [
          'A realidade é outra.',
          'Provei isso na prática.',
          'Os números mostram o contrário.'
        ],
        valores: [
          'Questionar tudo. Testar sempre.',
          'Mitos limitam. Dados libertam.',
          'Pense crítico. Execute实证.'
        ],
        ctas: [
          'Quer que eu desmascare outro?',
          'Me conta qual mito você acredita',
          'Aprendeu algo? Compartilha'
        ]
      },
      desafio: {
        tipo: 'desafio',
        abertura: [
          'Desafio dos 30 dias.',
          'Você consegue fazer isso?',
          'Teste agora:'
        ],
        contextos: [
          'Poucos conseguem. Você vai ser um deles?',
          'É difícil. Mas vale a pena.',
          'Sem esforço, sem resultado.'
        ],
        valores: [
          'Desafios revelam capacidades.',
          'Sair da zona de conforto é preciso.',
          'Você é mais capaz do que imagina.'
        ],
        ctas: [
          'Aceita o desafio? Responde SIM',
          'Me conta quando completar',
          'Tag um amigo que precisa'
        ]
      },
      resultado: {
        tipo: 'resultado',
        abertura: [
          'Números não mentem.',
          'Esse é o resultado de 90 dias.',
          'De zero para esse valor em...'
        ],
        contextos: [
          'Trabalho + Método = Resultado.',
          'Não foi sorte. Foi execução.',
          'Isso é possível pra qualquer um.'
        ],
        valores: [
          'Métricas motivam.',
          'Dados mostram a verdade.',
          'Resultado justifica o processo.'
        ],
        ctas: [
          'Quer esses números no seu negócio?',
          'Me chama que te mostro como',
          'Bora começar?'
        ]
      },
      ensinamento: {
        tipo: 'ensinamento',
        abertura: [
          'A maior lição que eu aprendi...',
          'Isso mudou minha vida.',
          'Se eu pudesse voltar no tempo...'
        ],
        contextos: [
          'Demorei anos pra descobrir.',
          'Isso custou caro. Mas valeu.',
          'Eu gostaria de ter sabido antes.'
        ],
        valores: [
          'Lições aprendidas são tesouros.',
          'Erros ensinam mais que acertos.',
          'Compartilhe conhecimento.'
        ],
        ctas: [
          'Aprendeu algo? Compartilha',
          'Qual lição mais impactou você?',
          'Me conta nos comments'
        ]
      }
    }
  },

  // Templates para empreendedorismo
  empreendedorismo: {
    nicho: 'empreendedorismo',
    dor: 'não conseguir construir negócio próprio',
    promise: 'ter empresa/sólida e lucrativa',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: [
          'Por que 80% dos negócios fecham no 1º ano?',
          'Você quer empreender ou apenas sonhar?',
          'Qual é sua maior barreira como empreendedor?'
        ],
        contextos: [
          'Eu empreendi 3 vezes. 2 falharam.',
          'O mercado não perdoa amadorismo.',
          'Sabe a diferença entre Sonho e Negócio?'
        ],
        valores: [
          'Negócio precisa gerar lucro. Não importa o tamanho.',
          'Empreender é resolver problemas. Constantemente.',
          'Sem cliente, não há empresa.'
        ],
        ctas: [
          'Me conta sua maior dúvida',
          'Quer ajuda? Manda DM',
          'Responde aqui'
        ]
      },
      // Outros tipos seguem estrutura similar...
      contexto: {
        tipo: 'contexto',
        abertura: ['Deixa eu te contar...', 'Isso aconteceu...', 'Sabe o que eu percebi?'],
        contextos: ['A jornada foi longa.', 'Aprendi muito no caminho.', 'Cada passo contou.'],
        valores: ['Erros ensinam.', 'Persistência vence.', 'Experiência tem valor.'],
        ctas: ['Me conta', 'Quer saber mais?', 'Bora?']
      },
      valor: {
        tipo: 'valor',
        abertura: ['Vou te ensinar...', 'Isso é fundamental.', 'Fica até o fim.'],
        contextos: ['Todo começo é difícil.', 'O segredo está nos detalhes.', 'Pequenas ações, grandes resultados.'],
        valores: ['Foque no cliente.', 'Cashflow é vida.', 'Escala depois.'],
        ctas: ['Aprendeu?', 'Compartilha', 'Me conta']
      },
      conexao: {
        tipo: 'conexao',
        abertura: ['Eu sei como é...', 'Você não está sozinho.', 'Já passei por isso.'],
        contextos: ['Foi difícil.', 'Quase desisti.', 'Mas segui.'],
        valores: ['Força na adversidade.', 'Você consegue.', 'Superação gera força.'],
        ctas: ['Me conta tua história', 'Responde aqui', 'Você consegue']
      },
      bastidor: {
        tipo: 'bastidor',
        abertura: ['Olha meu dia...', 'Esse é o processo...', 'Deixa eu te mostrar.'],
        contextos: ['Não é fácil.', 'Todo dia é luta.', 'Mas amo o que faço.'],
        valores: ['Bastidores criam conexão.', 'Processo é mentoria.', 'Authenticidade vende.'],
        ctas: ['Quer mais?', 'Me segue', 'Pergunta?']
      },
      prova: {
        tipo: 'prova',
        abertura: ['Esse empresário...', 'Ela começou...', 'Resultado:'],
        contextos: ['Estava no mesmo lugar.', 'Aplicou o método.', 'Funcionou.'],
        valores: ['Prova social é poderosa.', 'Resultados mudam crenças.', 'Você pode também.'],
        ctas: ['Quer esse resultado?', 'Me conta', 'Bora?']
      },
      corte: {
        tipo: 'corte',
        abertura: ['Mentira #1:', 'Você não precisa disso:', 'Esquece isso:'],
        contextos: ['A realidade é outra.', 'O mercado prova.', 'Dados mostram.'],
        valores: ['Método > Sorte.', 'Execução > Planejamento.', 'Resultado > Promessa.'],
        ctas: ['Entendeu?', 'Quer mais?', 'Me chama']
      },
      cta: {
        tipo: 'cta',
        abertura: ['Última chance:', 'Agora ou nunca:', 'O momento é agora:'],
        contextos: ['Não espere.', 'Decisão hoje.', 'Ação agora.'],
        valores: ['Ação gera resultado.', 'Comece já.', 'O primeiro passo é o que importa.'],
        ctas: ['Manda DM', 'Clique', 'Responde']
      },
      humor: {
        tipo: 'humor',
        abertura: ['Empreendedorismo em 1 story 😂', 'Todo dia é uma aventura', 'Isso me Defines 😂'],
        contextos: ['Todo mundo passa.', 'A gente segue.', 'Comédia no tragedy.'],
        valores: ['Humor ajuda.', 'Rir é terapia.', 'Levantei e sigo.'],
        ctas: ['Ri? Marca', 'Emoji 😂', 'Conta']
      },
      depoimento: {
        tipo: 'depoimento',
        abertura: ['Esse relato...', 'Mensagem:', 'O que ele disse:'],
        contextos: ['Começou do zero.', 'Aplicou.', 'Resultado veio.'],
        valores: ['Histórias inspiram.', 'Prova move.', 'Exemplos motivam.'],
        ctas: ['Quer story assim?', 'Me manda', 'Bora']
      },
      mito: {
        tipo: 'mito',
        abertura: ['Mito comum:', 'Todo mundo fala:', 'Realidade:'],
        contextos: ['Não é assim.', 'Na prática.', 'Os dados mostram.'],
        valores: ['Questione.', 'Teste.', 'Prove.'],
        ctas: ['Qual mito?', 'Quer mais?', 'Aprendeu?']
      },
      desafio: {
        tipo: 'desafio',
        abertura: ['Desafio:', 'Teste:', 'Você consegue?:'],
        contextos: ['7 dias.', '30 dias.', 'Não é fácil.'],
        valores: ['Desafio gera成长.', 'Fora da zona conforto.', 'Capacidade.'],
        ctas: ['Aceita?', 'Responde SIM', 'Me conta']
      },
      resultado: {
        tipo: 'resultado',
        abertura: ['Números:', 'Resultado:', 'Em 90 dias:'],
        contextos: ['Trabalho.', 'Método.', 'Execução.'],
        valores: ['Dados não mentem.', 'Métricas importam.', 'Resultado é verdade.'],
        ctas: ['Quer esses números?', 'Me chama', 'Bora']
      },
      ensinamento: {
        tipo: 'ensinamento',
        abertura: ['Lição:', 'Se eu soubesse antes...', 'Maior aprendizado:'],
        contextos: ['Custo caro.', 'Demorei.', 'Valeu a pena.'],
        valores: ['Lições valem.', 'Erros ensinam.', 'Compartilhe.'],
        ctas: ['Aprendeu?', 'Me conta', 'Compartilha']
      }
    }
  },

  // Templates para outros nichos (versão simplificada)
  financas: {
    nicho: 'financas',
    dor: 'não conseguir economizar / investir',
    promise: 'ter estabilidade financeira',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: ['Você sabe onde entra seu dinheiro?', 'Quanto você economiza por mês?', 'Finanças pessoais: mito ou verdade?'],
        contextos: ['A maioria não controla.', 'Eu também não控制ava.', 'Sabe a diferença?'],
        valores: ['Controle = Liberdade.', 'Sem rencana, sem resultado.', 'Primeiro passo: saber onde gasta.'],
        ctas: ['Me conta', 'Quer ajuda?', 'Responde']
      },
      contexto: {
        tipo: 'contexto',
        abertura: ['Sabe o que eu aprendi?', 'Isso mudou tudo.', 'Deixa eu te contar.'],
        contextos: ['Foi um caminho.', 'Aprendi na prática.', 'Com erros e acertos.'],
        valores: ['Experiência teaches.', 'Prática > Teoria.', 'Cada passo.'],
        ctas: ['Quer saber mais?', 'Me conta', 'Bora?']
      },
      valor: {
        tipo: 'valor',
        abertura: ['Vou te ensinar.', 'Dica penting.', 'Fica até o fim.'],
        contextos: ['Simples mas poderoso.', 'Isso muda jogo.', 'Poucos fazem.'],
        valores: ['Poupe antes de gastar.', 'Reserve 10%.', 'Investir = fazer dinheiro trabalhar.'],
        ctas: ['Aplicou?', 'Compartilha', 'Me conta']
      },
      conexao: {
        tipo: 'conexao',
        abertura: ['Eu sei a sensação.', 'Já passou por isso?', 'Você não tá sozinho.'],
        contextos: ['Foi difícil.', 'Quase.', 'Mas supera.'],
        valores: ['Superação.', 'Força.', 'Capacidade.'],
        ctas: ['Me conta', 'Responde', 'Você consegue']
      },
      bastidor: {
        tipo: 'bastidor',
        abertura: ['Olha minhas numbers.', 'Meu controle:', 'Assim que faço.'],
        contextos: ['Não é glamour.', 'É disciplina.', 'Rotina.'],
        valores: ['Dados guiam.', 'Controle é key.', 'Processo.'],
        ctas: ['Quer mais?', 'Me segue', 'Pergunta?']
      },
      prova: {
        tipo: 'prova',
        abertura: ['Deu certo pra ela.', 'Ele conseguiu.', 'Esse caso:'],
        contextos: ['Aplicou.', 'Seguiu.', 'Resultado veio.'],
        valores: ['Funciona.', 'Prova.', 'Você pode.'],
        ctas: ['Quer esse resultado?', 'Me conta', 'Bora']
      },
      corte: {
        tipo: 'corte',
        abertura: ['Mentira do mercado:', 'Você não precisa:', 'Esquece isso:'],
        contextos: ['Realidade.', 'Dados.', 'Prática.'],
        valores: ['Poupança > Dívida.', 'Investimento > Gasto.', 'Longo prazo > Curto.'],
        ctas: ['Entendeu?', 'Quer mais?', 'Me chama']
      },
      cta: {
        tipo: 'cta',
        abertura: ['Comece hoje:', 'Última chance:', 'Agora:'],
        contextos: ['Primeiro passo.', 'Decisão.', 'Ação.'],
        valores: ['Ação.', 'Começo.', 'Execução.'],
        ctas: ['Manda DM', 'Responde SIM', 'Clique']
      },
      humor: {
        tipo: 'humor',
        abertura: ['Finanças 😂', 'Todo mundo:', 'Quando vejo meu extrato 😂'],
        contextos: ['Isso acontece.', 'A gente tenta.', 'Ri.'],
        valores: ['Humor ajuda.', 'Rir.', 'Levantei.'],
        ctas: ['Ri? Marca', 'Emoji 😂', 'Conta']
      },
      depoimento: {
        tipo: 'depoimento',
        abertura: ['Ele me disse:', 'Ela contou:', 'Depoimento:'],
        contextos: ['Estava endividado.', 'Sem controle.', 'Aplicou.'],
        valores: ['Histórias.', 'Prova.', 'Inspiração.'],
        ctas: ['Quer story assim?', 'Me manda', 'Bora']
      },
      mito: {
        tipo: 'mito',
        abertura: ['Mito:', 'Todo mundo pensa:', 'Mas a verdade:'],
        contextos: ['Não é assim.', 'Dados.', 'Realidade.'],
        valores: ['Questione.', 'Teste.', 'Prove.'],
        ctas: ['Qual mito?', 'Quer mais?', 'Aprendeu?']
      },
      desafio: {
        tipo: 'desafio',
        abertura: ['Desafio 30 dias:', 'Teste:', 'Você consegue?:'],
        contextos: ['Reserve.', 'Controle.', 'Invista.'],
        valores: ['Desafio.', 'Fora zona.', 'Capacidade.'],
        ctas: ['Aceita?', 'Responde', 'Me conta']
      },
      resultado: {
        tipo: 'resultado',
        abertura: ['Em 1 ano:', 'Resultado:', 'Numbers:'],
        contextos: ['Aplicou.', 'Seguiu.', 'Resultado.'],
        valores: ['Dados.', 'Métricas.', 'Verdade.'],
        ctas: ['Quer assim?', 'Me chama', 'Bora']
      },
      ensinamento: {
        tipo: 'ensinamento',
        abertura: ['Lição mais importante:', 'Se soubesse antes...', 'Aprendizado:'],
        contextos: ['Custou.', 'Demorei.', 'Valeu.'],
        valores: ['Lições.', 'Erros.', 'Compartilhe.'],
        ctas: ['Aprendeu?', 'Me conta', 'Compartilha']
      }
    }
  },

  // Nichos padrão para os outros
  saude: {
    nicho: 'saude',
    dor: 'não conseguir ter hábitos saudáveis',
    promise: 'viver com mais saúde e energia',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: ['Você tenta e não consegue?', 'Qual seu maior desafio com saúde?', 'Por que tão difícil manter hábitos?'],
        contextos: ['Eu já estive lá.', 'A mudança é dura.', 'Sabe por quê?'],
        valores: ['Pequenos passos.', 'Consistência > Intensidade.', 'Rotina wins.'],
        ctas: ['Me conta', 'Quer ajuda?', 'Responde']
      },
      contexto: { tipo: 'contexto', abertura: [], contextos: [], valores: [], ctas: [] },
      valor: { tipo: 'valor', abertura: [], contextos: [], valores: [], ctas: [] },
      conexao: { tipo: 'conexao', abertura: [], contextos: [], valores: [], ctas: [] },
      bastidor: { tipo: 'bastidor', abertura: [], contextos: [], valores: [], ctas: [] },
      prova: { tipo: 'prova', abertura: [], contextos: [], valores: [], ctas: [] },
      corte: { tipo: 'corte', abertura: [], contextos: [], valores: [], ctas: [] },
      cta: { tipo: 'cta', abertura: [], contextos: [], valores: [], ctas: [] },
      humor: { tipo: 'humor', abertura: [], contextos: [], valores: [], ctas: [] },
      depoimento: { tipo: 'depoimento', abertura: [], contextos: [], valores: [], ctas: [] },
      mito: { tipo: 'mito', abertura: [], contextos: [], valores: [], ctas: [] },
      desafio: { tipo: 'desafio', abertura: [], contextos: [], valores: [], ctas: [] },
      resultado: { tipo: 'resultado', abertura: [], contextos: [], valores: [], ctas: [] },
      ensinamento: { tipo: 'ensinamento', abertura: [], contextos: [], valores: [], ctas: [] }
    }
  },
  relacionamentos: {
    nicho: 'relacionamentos',
    dor: 'dificuldade em manter relacionamentos',
    promise: 'ter relacionamentos saudáveis',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: ['Relacionamentos são difíceis?', 'Você sente que algo falta?', 'Qual sua maior dificuldade?'],
        contextos: ['Eu já sofri.', 'Aprendi muito.', 'Sabe o que importa?'],
        valores: ['Comunicação.', 'Respeito.', 'Empatia.'],
        ctas: ['Me conta', 'Quer conversar?', 'Responde']
      },
      contexto: { tipo: 'contexto', abertura: [], contextos: [], valores: [], ctas: [] },
      valor: { tipo: 'valor', abertura: [], contextos: [], valores: [], ctas: [] },
      conexao: { tipo: 'conexao', abertura: [], contextos: [], valores: [], ctas: [] },
      bastidor: { tipo: 'bastidor', abertura: [], contextos: [], valores: [], ctas: [] },
      prova: { tipo: 'prova', abertura: [], contextos: [], valores: [], ctas: [] },
      corte: { tipo: 'corte', abertura: [], contextos: [], valores: [], ctas: [] },
      cta: { tipo: 'cta', abertura: [], contextos: [], valores: [], ctas: [] },
      humor: { tipo: 'humor', abertura: [], contextos: [], valores: [], ctas: [] },
      depoimento: { tipo: 'depoimento', abertura: [], contextos: [], valores: [], ctas: [] },
      mito: { tipo: 'mito', abertura: [], contextos: [], valores: [], ctas: [] },
      desafio: { tipo: 'desafio', abertura: [], contextos: [], valores: [], ctas: [] },
      resultado: { tipo: 'resultado', abertura: [], contextos: [], valores: [], ctas: [] },
      ensinamento: { tipo: 'ensinamento', abertura: [], contextos: [], valores: [], ctas: [] }
    }
  },
  desenvolvimento_pessoal: {
    nicho: 'desenvolvimento_pessoal',
    dor: 'não conseguir evoluir pessoalmente',
    promise: 'se tornar a melhor versão',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: ['Por que você não evolve?', 'O que te impede de mudar?', 'Você quer melhorar?'],
        contextos: ['Eu já estive preso.', 'A mudança é difícil.', 'Sabe o segredo?'],
        valores: ['Autoconhecimento.', 'Hábitos.', 'Disciplina.'],
        ctas: ['Me conta', 'Quer ajuda?', 'Responde']
      },
      contexto: { tipo: 'contexto', abertura: [], contextos: [], valores: [], ctas: [] },
      valor: { tipo: 'valor', abertura: [], contextos: [], valores: [], ctas: [] },
      conexao: { tipo: 'conexao', abertura: [], contextos: [], valores: [], ctas: [] },
      bastidor: { tipo: 'bastidor', abertura: [], contextos: [], valores: [], ctas: [] },
      prova: { tipo: 'prova', abertura: [], contextos: [], valores: [], ctas: [] },
      corte: { tipo: 'corte', abertura: [], contextos: [], valores: [], ctas: [] },
      cta: { tipo: 'cta', abertura: [], contextos: [], valores: [], ctas: [] },
      humor: { tipo: 'humor', abertura: [], contextos: [], valores: [], ctas: [] },
      depoimento: { tipo: 'depoimento', abertura: [], contextos: [], valores: [], ctas: [] },
      mito: { tipo: 'mito', abertura: [], contextos: [], valores: [], ctas: [] },
      desafio: { tipo: 'desafio', abertura: [], contextos: [], valores: [], ctas: [] },
      resultado: { tipo: 'resultado', abertura: [], contextos: [], valores: [], ctas: [] },
      ensinamento: { tipo: 'ensinamento', abertura: [], contextos: [], valores: [], ctas: [] }
    }
  },
  educacao: {
    nicho: 'educacao',
    dor: 'dificuldade em aprender',
    promise: 'aprender mais rápido e melhor',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: ['Por que você não aprende?', 'Estudou mas não lembra?', 'Qual sua maior dificuldade?'],
        contextos: ['Eu também struggled.', 'A method importa.', 'Sabe como aprender?'],
        valores: ['Método > Quantidade.', 'Prática.', 'Repetição.'],
        ctas: ['Me conta', 'Quer técnica?', 'Responde']
      },
      contexto: { tipo: 'contexto', abertura: [], contextos: [], valores: [], ctas: [] },
      valor: { tipo: 'valor', abertura: [], contextos: [], valores: [], ctas: [] },
      conexao: { tipo: 'conexao', abertura: [], contextos: [], valores: [], ctas: [] },
      bastidor: { tipo: 'bastidor', abertura: [], contextos: [], valores: [], ctas: [] },
      prova: { tipo: 'prova', abertura: [], contextos: [], valores: [], ctas: [] },
      corte: { tipo: 'corte', abertura: [], contextos: [], valores: [], ctas: [] },
      cta: { tipo: 'cta', abertura: [], contextos: [], valores: [], ctas: [] },
      humor: { tipo: 'humor', abertura: [], contextos: [], valores: [], ctas: [] },
      depoimento: { tipo: 'depoimento', abertura: [], contextos: [], valores: [], ctas: [] },
      mito: { tipo: 'mito', abertura: [], contextos: [], valores: [], ctas: [] },
      desafio: { tipo: 'desafio', abertura: [], contextos: [], valores: [], ctas: [] },
      resultado: { tipo: 'resultado', abertura: [], contextos: [], valores: [], ctas: [] },
      ensinamento: { tipo: 'ensinamento', abertura: [], contextos: [], valores: [], ctas: [] }
    }
  },
  tech: {
    nicho: 'tech',
    dor: 'não acompanhar tecnologia',
    promise: 'dominar tecnologia',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: ['Tech te assusta?', 'Você está por dentro?', 'O que mais confunde?'],
        contextos: ['Eu também era lost.', 'Mudou muito.', 'Sabe o que importa?'],
        valores: ['Aprendizado contínuo.', 'Prática.', 'Curiosidade.'],
        ctas: ['Me conta', 'Quer aprender?', 'Responde']
      },
      contexto: { tipo: 'contexto', abertura: [], contextos: [], valores: [], ctas: [] },
      valor: { tipo: 'valor', abertura: [], contextos: [], valores: [], ctas: [] },
      conexao: { tipo: 'conexao', abertura: [], contextos: [], valores: [], ctas: [] },
      bastidor: { tipo: 'bastidor', abertura: [], contextos: [], valores: [], ctas: [] },
      prova: { tipo: 'prova', abertura: [], contextos: [], valores: [], ctas: [] },
      corte: { tipo: 'corte', abertura: [], contextos: [], valores: [], ctas: [] },
      cta: { tipo: 'cta', abertura: [], contextos: [], valores: [], ctas: [] },
      humor: { tipo: 'humor', abertura: [], contextos: [], valores: [], ctas: [] },
      depoimento: { tipo: 'depoimento', abertura: [], contextos: [], valores: [], ctas: [] },
      mito: { tipo: 'mito', abertura: [], contextos: [], valores: [], ctas: [] },
      desafio: { tipo: 'desafio', abertura: [], contextos: [], valores: [], ctas: [] },
      resultado: { tipo: 'resultado', abertura: [], contextos: [], valores: [], ctas: [] },
      ensinamento: { tipo: 'ensinamento', abertura: [], contextos: [], valores: [], ctas: [] }
    }
  },
  lifestyle: {
    nicho: 'lifestyle',
    dor: 'não viver a vida que quer',
    promise: 'ter o estilo de vida dos sonhos',
    templates: {
      gatilho: {
        tipo: 'gatilho',
        abertura: ['Você vive ou só sobrevive?', 'Sonha mas não realiza?', 'O que te impede?'],
        contextos: ['Eu também wanted mais.', 'A vida é curta.', 'Sabe o segredo?'],
        valores: ['Ação.', 'Coragem.', 'Decisão.'],
        ctas: ['Me conta', 'Quer mudar?', 'Responde']
      },
      contexto: { tipo: 'contexto', abertura: [], contextos: [], valores: [], ctas: [] },
      valor: { tipo: 'valor', abertura: [], contextos: [], valores: [], ctas: [] },
      conexao: { tipo: 'conexao', abertura: [], contextos: [], valores: [], ctas: [] },
      bastidor: { tipo: 'bastidor', abertura: [], contextos: [], valores: [], ctas: [] },
      prova: { tipo: 'prova', abertura: [], contextos: [], valores: [], ctas: [] },
      corte: { tipo: 'corte', abertura: [], contextos: [], valores: [], ctas: [] },
      cta: { tipo: 'cta', abertura: [], contextos: [], valores: [], ctas: [] },
      humor: { tipo: 'humor', abertura: [], contextos: [], valores: [], ctas: [] },
      depoimento: { tipo: 'depoimento', abertura: [], contextos: [], valores: [], ctas: [] },
      mito: { tipo: 'mito', abertura: [], contextos: [], valores: [], ctas: [] },
      desafio: { tipo: 'desafio', abertura: [], contextos: [], valores: [], ctas: [] },
      resultado: { tipo: 'resultado', abertura: [], contextos: [], valores: [], ctas: [] },
      ensinamento: { tipo: 'ensinamento', abertura: [], contextos: [], valores: [], ctas: [] }
    }
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtém templates por nicho
 */
export function getTemplates(nicho: NicheType): NicheTemplates {
  return NICHE_TEMPLATES[nicho] || NICHE_TEMPLATES.marketing_digital;
}

/**
 * Obtém template específico por tipo
 */
export function getTemplateByType(
  nicho: NicheType,
  tipo: StoryType
): StoryTemplate {
  const templates = getTemplates(nicho);
  return templates.templates[tipo];
}

/**
 * Obtém abertura aleatória por tipo
 */
export function getRandomAbertura(nicho: NicheType, tipo: StoryType): string {
  const template = getTemplateByType(nicho, tipo);
  const aberturas = template.abertura;
  return aberturas[Math.floor(Math.random() * aberturas.length)];
}

/**
 * Obtém CTA aleatório por tipo
 */
export function getRandomCTA(nicho: NicheType, tipo: StoryType): string {
  const template = getTemplateByType(nicho, tipo);
  const ctas = template.ctas;
  return ctas[Math.floor(Math.random() * ctas.length)];
}
