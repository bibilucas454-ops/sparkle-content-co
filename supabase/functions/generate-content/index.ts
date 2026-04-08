import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const typePrompts: Record<string, string> = {
  "viral-idea": `Gere 1 ideia de vídeo curto com POTENCIAL ULTRA VIRAL (100k+ visualizações).

ESTRUTURA OBRIGATÓRIA:
📌 TÍTULO: Curto, direto, que gera curiosidade imediata
📌 CONCEITO: O que exatamente vai acontecer no vídeo (1-2 linhas)
📌 GATILHO: Por que isso vai fazer as pessoas pararem de scrollar (identificação, curiosidade, choque, quebra de expectativa)

REGRAS CRÍTICAS:
- NADA de frases genéricas ou motivational quotes vazios
- Use histórias reais ou dados surpreendentes
- O título deve fazer a pessoa dizer "nem acredito" ou "me идентифика"
- O conceito deve ser específico, não abstrato
APENAS Português do Brasil.`;

  "hook": `Crie um HOOK (gancho) para OS PRIMEIROS 3 SEGUNDOS que PARE O SCROLL.

TÉCNICAS OBRIGATÓRIAS (use uma ou misture):
- 🔥 CURIOSIDADE: Algo quefaçaeles quererem saber mais
- 💔 DOR: Fale o queeles sentem mas não conseguem expressar
- ⚡ QUEBRA DE EXPECTATIVA: Diga o oposto do queeles esperam
- 🚀 IDENTIFICAÇÃO: Fale direto na ferida deles
- 😱 CHOQUE: Dado ou fato absurdamente surpreendente

FORMATO: APENAS a frase do hook. Máx 2 frases curtas. Sem rodeios. Sem "Você já se perguntou...". Vá direto ao ponto.

EXEMPLOS DO QUE FAZER:
- "Pareçai de fingir que tá tudo bem"
- "A frase que mudou minha vida tinha apenas 7 palavras"
- "Aos 25 anos, eu tinha tudo. E me pendurei no teto do quarto"

APENAS Português do Brasil.`;

  "script": `Escreva um roteiro para vídeo CURTO (15-30 segundos) com POTENCIAL VIRAL.

ESTRUTURA OBRIGATÓRIA:

🔥 HOOK (0-3s): Frase que para o scroll - use gatilho emocional
📖 CONTEXTO (3-10s): Desenvolva a história rapidinho - mostre que você ENTENDE a dor deles
💥 IMPACTO (10-20s): O momento clave - revelação, solução ou cliffhanger
🎯 CTA (final): O que você quer que façam (comentar, salvar, compartilhar)

REGRAS:
- Tom conversacional, como se estivesse falando com um amigo
- Use "você", não "nós" ou "a gente"
- Frases curtas, fácil de entender ouvindo
- Inclua pelo menos 1 gatilho emocional forte
- NÃO seja motivacional genérico - seja REAL
- O CTA deve ser natural, não forçado

APENAS Português do Brasil.`;

  "video-text": `Crie frases que APARECEM NA TELA durante o vídeo. Cada frase = 1 corte.

REGRAS:
- 4 a 6 frases
- Máx 6 palavras cada frase
- Use linguagem que GRITA no视觉
- Inclua pelo menos 1 frase de alto impacto emocional
- Formato: uma frase por linha

Exemplo de estilo:
- "PARA DE FINGIR"
- "NINGUEM TE CONTA ISSO"
- "O SEGREDO"
- "RESULTADO"

APENAS Português do Brasil.`;

  "caption": `Escreva uma LEGENDA ULTRA ENGAJADORA para Instagram/Reels.

STRUTURA OBRIGATÓRIA:

1️⃣ TÍTULO (1 linha): Algo que para o scroll imediatamente
- Use curiosity gap, dor, ou quebra de expectativa
- NADA de "Você não vai acreditar" ou "3 dicas..."

2️⃣ CORPO (3-5 linhas): Conecte emocionalmente
- Fale a VERDADE que ninguém conta
- Use histórias ou dados reais
- Mostre que você ENTENDE o que eles sentem
- Use linguagem natural e conversacional

3️⃣ CTA (1 linha): Forte e específico
- Não "comenta abaixo" - seja específico
- Ex: "Me conta: qual é a sua maior dificuldade HOJE?"
- Ex: "Se você já passou por isso, salva 💪"

HASHTAGS: Inclua 8-12 hashtags no final (mix alto/médio/nicho)

IMPORTANTE:
- NADA de frases motivacionais vazias
- NADA de "a gente" - use "você"
- Seja raw, real, vulnerável
- Use EMojis estrategicamente
APENAS Português do Brasil.`;

  "hashtags": `Gere EXATAMENTE 10 hashtags em português do Brasil.

MIX OBRIGATÓRIO:
- 3 hashtags de ALTO volume (milhões de posts)
- 4 hashtags de MÉDIO volume (100k-500k posts)
- 3 hashtags de NICHO específico (10k-50k posts)

REGRAS:
- Todas relevantes ao tema
- Variadas, não só as mesmas de sempre
- Formato: #hashtag (espaço entre cada)
- NADA de hashtags em inglês

Exemplo para nicho "desenvolvimento pessoal":
#desenvolvimentopessoal #motivacao #fe #superacao #mindset #autoconhecimento #crescimento #propósito #amorproprio #introspeccao

APENAS Português do Brasil.`;

  "tags": `Gere EXATAMENTE 5 tags/palavras-chave para SEO em português.
Inclua palavras-chave primárias e variações. Formate como lista separada por vírgulas. APENAS Português do Brasil.`;

  "video-prompt": `Crie um prompt detalhado para gerar o vídeo em ferramentas de IA (Runway, Pika, Sora, Grok).
Formato obrigatório:
🎨 Estilo visual:
💡 Iluminação:
🎥 Movimento de câmera:
🌍 Ambiente:
🌀 Atmosfera:
O prompt principal pode ser em inglês para compatibilidade, mas toda explicação DEVE ser em Português do Brasil.`;

  "viral-score": `Analise o potencial viral deste conteúdo. Dê uma pontuação de 0 a 100.
Avalie cada critério:
🎯 Força do Hook: /100
📤 Compartilhabilidade: /100
📈 Alinhamento com tendências: /100
❤️ Gatilho emocional: /100
✨ Originalidade: /100
📊 SCORE FINAL: /100
Explique brevemente cada nota. APENAS Português do Brasil.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. JWT signature programmatic verification to allow CORS OPTIONS preflight
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Acesso negado. Token ausente ou inválido (Requer JWT válido)." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Auth erro de acesso da Edge Function:", claimsError);
      return new Response(JSON.stringify({ error: "Sessão expirada ou JWT inválido. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { topic, platform, types, videoTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Erro de infraestrutura: LOVABLE_API_KEY não está configurada nos Secrets da Edge Function.");
    }

    const results = [];

    const titleInstruction = videoTitle
      ? `Título do vídeo definido pelo usuário: "${videoTitle}". Use este título como base principal do conteúdo.`
      : `O usuário NÃO definiu um título. Gere um título criativo e viral como parte da resposta.`;

    const isInstagram = platform.toLowerCase().includes("instagram");
    const formatInstruction = isInstagram 
      ? "\n\n📏 FORMATO INSTAGRAM:\n- Reels: 1080x1920 (9:16) - vídeo vertical\n- Stories: 1080x1920 (9:16) - formato stories\n- Carrossel: 1080x1080 (1:1) - quadrado"
      : "\n\n📏 FORMATO YOUTUBE SHORTS: 1080x1920 (9:16) - vídeo vertical";

    for (const type of types) {
      const systemPrompt = `Você é um estrategista de conteúdo viral especializado em ${platform}. Você entende algoritmos, tendências e o que faz um conteúdo viralizar. Seja específico, acionável e criativo. Nunca seja genérico. REGRA OBRIGATÓRIA: Todo o conteúdo gerado DEVE ser em Português do Brasil.`;
      const userPrompt = `${titleInstruction}\n\nTema: "${topic}" para ${platform}.${formatInstruction}\n\n${typePrompts[type] || "Gere conteúdo criativo para este tema em Português do Brasil."}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_content",
                description: "Retorne o conteúdo gerado com uma pontuação viral. Todo conteúdo DEVE ser em Português do Brasil.",
                parameters: {
                  type: "object",
                  properties: {
                    content: { type: "string", description: "The generated content text" },
                    viralScore: { type: "integer", description: "Viral potential score from 0 to 100" },
                  },
                  required: ["content", "viralScore"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_content" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        console.error("AI error:", response.status, errText);
        throw new Error("AI generation failed");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        results.push({
          type,
          content: parsed.content,
          viralScore: Math.min(100, Math.max(0, parsed.viralScore)),
        });
      } else {
        // Fallback if no tool call
        const content = data.choices?.[0]?.message?.content || "Content generation failed";
        results.push({ type, content, viralScore: Math.floor(Math.random() * 30) + 50 });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
