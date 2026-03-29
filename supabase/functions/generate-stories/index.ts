import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tipos de sequência
const sequencePrompts = {
  engajamento: {
    desc: 'Conectar e identificar dor',
    types: ['gatilho', 'contexto', 'valor', 'conexao', 'cta'],
    prompt: `Gere uma sequência de 5 STORIES para Instagram com as seguintes características:

CADA STORY DEVE TER:
- Tipo específico (gatilho, contexto, valor, conexão, CTA)
- Copy pronto para copiar e postar
- Tom: {tomVoz}
- Nicho: {nicho}
- Produto: {produto}
- Promessa: {promessa}
- Dor: {dorPrincipal}

REGRAS OBRIGATÓRIAS:
1. NUNCA repita frases ou estruturas
2. Cada story deve ter abertura DIFERENTE
3. NUNCA repita o tipo de pergunta ou CTA
4. Use linguagem conversacional brasileira
5. Máximo 150 caracteres por story
6. Inclua elemento interativo (enquete, pergunta, sticker) quando apropriado

Sequência:
STORY 1 (GATILHO): Comece com pergunta provocativa sobre a dor
STORY 2 (CONTEXTO): Mostre experiência pessoal
STORY 3 (VALOR): Ensine algo prático
STORY 4 (CONEXÃO): Crie identificação emocional
STORY 5 (CTA): Peça ação (responder, DM, comentar)

Responda em formato JSON:
[
  {"ordem": 1, "tipo": "gatilho", "copy": "...", "elementos": ["pergunta"], "cta": "..."},
  {"ordem": 2, "tipo": "contexto", "copy": "...", "elementos": [], "cta": "..."},
  ...
]`
  },
  aquecimento: {
    desc: 'Criar desejo e preparar',
    types: ['corte', 'valor', 'bastidor', 'prova', 'cta'],
    prompt: `Gere uma sequência de 5 STORIES para Instagram (FASE AQUECIMENTO):

CADA STORY DEVE TER:
- Tipo específico (corte, valor, bastidor, prova, CTA)
- Copy pronto para copiar e postar
- Tom: {tomVoz}
- Nicho: {nicho}
- Promessa: {promessa}

REGRAS OBRIGATÓRIAS:
1. Corte crenças limitantes do público
2. Mostre método/solução
3. Use bastidores reais
4. Apresente provas sociais
5. NUNCA repita estruturas ou aberturas
6. Use linguagem conversacional brasileira
7. Máximo 150 caracteres

Sequência:
STORY 1 (CORTE): Desconstrua uma crença limitante
STORY 2 (VALOR): Apresente o método
STORY 3 (BASTIDOR): Mostre processo real
STORY 4 (PROVA): Mostre resultado de cliente
STORY 5 (CTA): Prepare para oferta

Responda em JSON:
[
  {"ordem": 1, "tipo": "corte", "copy": "...", "elementos": [], "cta": "..."},
  ...
]`
  },
  venda: {
    desc: 'Converter e fechar',
    types: ['gatilho', 'corte', 'valor', 'prova', 'valor', 'cta', 'cta'],
    prompt: `Gere uma sequência de 7 STORIES para Instagram (FASE VENDA):

CADA STORY DEVE TER:
- Copy pronto para copiar e postar
- Tom direto e persuasivo
- Promessa: {promessa}
- Produto: {produto}

REGRAS OBRIGATÓRIAS:
1. Crie urgência REAL (não forçada)
2. Mostre diferenciação
3. Use prova social poderosa
4. Detalhe a oferta claramente
5. NUNCA repita CTA
6. Máximo 150 caracteres
7. Variedade de estruturas

Sequência:
STORY 1 (GATILHO): Problema + emoção
STORY 2 (CORTE): Crença que impede compra
STORY 3 (VALOR): Apresentar solução/oferta
STORY 4 (PROVA): Resultado de cliente
STORY 5 (DETALHES): O que está incluído
STORY 6 (URGÊNCIA): Escassez real
STORY 7 (FECHAMENTO): CTA final

Responda em JSON:
[
  {"ordem": 1, "tipo": "gatilho", "copy": "...", "elementos": ["sticker"], "cta": "..."},
  ...
]`
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header. Faça login novamente.");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user. Faça login novamente.");
    }

    // Get and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      throw new Error("Invalid request body. Tente novamente.");
    }

    const { input, sequenceType } = body;

    if (!input) {
      throw new Error("Missing input data");
    }
    
    if (!sequenceType) {
      throw new Error("Missing sequenceType. Selecione o tipo de sequência.");
    }

    if (!input.nicho || !input.promessa || !input.dorPrincipal) {
      throw new Error("Preencha: nicho, promessa e dorPrincipal");
    }

    // Get OpenAI key
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured. Configure a chave da OpenAI no painel do Supabase.");
    }

    const config = sequencePrompts[sequenceType as keyof typeof sequencePrompts];
    if (!config) {
      throw new Error("Invalid sequence type");
    }

    // Build prompt
    let prompt = config.prompt
      .replace(/{tomVoz}/g, input.tomVoz || 'direto')
      .replace(/{nicho}/g, input.nicho || 'marketing digital')
      .replace(/{produto}/g, input.produto || 'curso')
      .replace(/{promessa}/g, input.promessa || 'ganhar dinheiro')
      .replace(/{dorPrincipal}/g, input.dorPrincipal || 'não conseguir vender');

    // Call OpenAI
    let openaiResponse;
    try {
      openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 2000
        })
      });
    } catch (networkError) {
      console.error("Network error calling OpenAI:", networkError);
      throw new Error("Erro de conexão com a OpenAI. Tente novamente.");
    }

    if (!openaiResponse.ok) {
      const err = await openaiResponse.text();
      console.error("OpenAI API error:", err);
      if (err.includes('api key')) {
        throw new Error("API Key da OpenAI inválida ou expirada");
      } else if (err.includes('rate limit')) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns minutos.");
      }
      throw new Error(`Erro da OpenAI: ${err.substring(0, 100)}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content || "";

    // Parse JSON response
    let stories = [];
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        stories = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      // Try to fix common issues
      const fixedContent = content
        .replace(/'/g, '"')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      
      try {
        stories = JSON.parse(fixedContent);
      } catch {
        // If still fails, create basic stories
        stories = content.split('\n').filter((l: string) => l.trim().length > 10).slice(0, 5).map((line: string, idx: number) => ({
          ordem: idx + 1,
          tipo: config.types[idx % config.types.length],
          copy: line.replace(/^\d+[\.\)]\s*/, '').substring(0, 150),
          elementos: [],
          cta: ''
        }));
      }
    }

    // Ensure we have stories
    if (!stories || stories.length === 0) {
      throw new Error("No stories generated");
    }

    // Add metadata to stories
    const enrichedStories = stories.map((story: any, idx: number) => ({
      id: `story_${Date.now()}_${idx}`,
      ordem: story.ordem || idx + 1,
      tipo: story.tipo || config.types[idx % config.types.length],
      copy: story.copy || '',
      elementos: story.elementos || [],
      cta: story.cta || '',
      scoreDiversidade: 0,
      hashConteudo: '',
      primeirasTresPalavras: (story.copy || '').split(' ').slice(0, 3).join(' '),
      estruturaSintatica: story.copy?.startsWith('Você') ? 'pergunta' : 
                         story.copy?.startsWith('A maior') ? 'afirmacao' : 
                         story.copy?.startsWith('Eu') ? 'narrativa' : 'outro'
    }));

    // Calculate diversity score
    const uniqueOpenings = new Set(enrichedStories.map((s: any) => s.primeirasTresPalavras.toLowerCase())).size;
    const uniqueTypes = new Set(enrichedStories.map((s: any) => s.tipo)).size;
    const score = (uniqueOpenings / enrichedStories.length * 0.4) + (uniqueTypes / 5 * 0.6);

    const sequence = {
      id: `seq_${Date.now()}`,
      tipo: sequenceType,
      stories: enrichedStories,
      input,
      scoreDiversidade: Math.round(score * 100) / 100,
      status: 'pronto',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({ sequence }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge Function Error:", error);
    
    let errorMessage = 'Erro interno';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY') || error.message.includes('API key')) {
        errorMessage = 'API Key da OpenAI não configurada no servidor';
        statusCode = 503;
      } else if (error.message.includes('Invalid user') || error.message.includes('auth')) {
        errorMessage = 'Erro de autenticação';
        statusCode = 401;
      } else if (error.message.includes('Missing')) {
        errorMessage = error.message;
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
