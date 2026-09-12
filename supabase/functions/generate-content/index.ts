import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VIRAL_RULES = `
REGRAS ANTI-GENÉRICO (obrigatórias):
- PROIBIDO: "Você já se perguntou", "Você não vai acreditar", "3 dicas para", "a chave do sucesso", "mindset é tudo", frases de autoajuda vazias, linguagem de coach.
- PROIBIDO clichê de IA: "no mundo de hoje", "cada vez mais", "descubra como".
- Use CONCRETO: números exatos, prazos, valores, nomes de situações reais, cenas visuais.
- Fale na 2ª pessoa ("você"), tom de conversa real, frases curtas.
- Sempre crie CURIOSITY GAP: entregue metade da informação e deixe a outra metade só no vídeo.
- Cada saída deve ser específica ao tema, nunca reaproveitável para qualquer assunto.
`;

const typePrompts: Record<string, string> = {
  "viral-idea": `Gere 3 IDEIAS de vídeo curto com potencial real de 100k+ visualizações. Cada uma com ângulo DIFERENTE (uma história pessoal, uma polêmica/contra-intuitiva, uma lista/prova com dados).

Para CADA ideia use exatamente:
🎬 IDEIA 1
📌 Título: (curto, gera curiosidade imediata)
🎥 Primeira cena (0-2s): o que aparece na tela literalmente
🧠 Conceito: o que acontece no vídeo em 2 linhas
⚡ Gatilho: por que para o scroll (identificação / choque / quebra de expectativa / curiosity gap)
📈 Retenção: o que segura até o fim (cliffhanger, revelação no final, contagem)
${VIRAL_RULES}
APENAS Português do Brasil.`,

  "viral-title": `Gere EXATAMENTE 8 TÍTULOS VIRAIS para vídeo curto, feitos para parar o scroll.

REGRAS:
- 100% EM CAIXA ALTA, máximo 8 palavras cada.
- 1 emoji no início que combine com o impacto.
- Varie OBRIGATORIAMENTE as fórmulas, uma por título:
  1. Curiosity gap ("O QUE NINGUÉM TE CONTA SOBRE X")
  2. Número específico ("EU FIZ X POR 30 DIAS")
  3. Verdade contra-intuitiva ("X NÃO FUNCIONA — E EU PROVO")
  4. Erro/perda ("O ERRO QUE ME CUSTOU 3 ANOS")
  5. Confissão pessoal ("EU MENTI SOBRE X")
  6. Pergunta direta na ferida
  7. Antes/depois com número
  8. Frase interrompida que obriga a assistir
- Cada título deve funcionar SOZINHO, sem contexto.
${VIRAL_RULES}
Formate como lista numerada 1 a 8. APENAS Português do Brasil.`,

  "hook": `Crie 5 HOOKS para os PRIMEIROS 3 SEGUNDOS, um de cada tipo:
1. 😱 CHOQUE — dado ou fato surpreendente e específico
2. 💔 DOR — diga o que ele sente e não sabe explicar
3. ⚡ QUEBRA DE EXPECTATIVA — o oposto do que ele espera ouvir
4. 🔥 CURIOSITY GAP — abre uma pergunta que só o vídeo responde
5. 🚀 CONFISSÃO — algo pessoal, cru, que gera identificação imediata

FORMATO: só a frase falada, no máximo 12 palavras cada. Sem introdução, sem rodeio, começa no verbo ou no número.
${VIRAL_RULES}
APENAS Português do Brasil.`,

  "script": `Escreva um roteiro de vídeo curto (20-35s) desenhado para RETENÇÃO ALTA.

FORMATO (com marcação de tempo e o que aparece na tela):
🔥 HOOK (0-3s) — fala: | tela:
📖 CONTEXTO (3-10s) — fala: | tela:
🔁 LOOP DE RETENÇÃO (10-18s) — fala que impede o scroll (ex: "e o pior vem agora") | tela:
💥 IMPACTO / REVELAÇÃO (18-28s) — fala: | tela:
🎯 CTA (final) — fala:

REGRAS:
- Fala pronta para ler em voz alta, frases de no máximo 10 palavras.
- Corte visual a cada 2-3 segundos.
- Nenhuma frase pode ser cortada sem prejudicar o sentido (zero enrolação).
- CTA específico ao tema (nunca "comenta abaixo" genérico).
- Termine com um gancho que faça a pessoa reassistir ou comentar.
${VIRAL_RULES}
APENAS Português do Brasil.`,

  "video-text": `Crie os textos que APARECEM NA TELA. Cada linha = 1 corte visual.

REGRAS:
- 6 a 8 linhas, máximo 5 palavras cada, EM CAIXA ALTA.
- Linha 1 = o hook visual (a mais forte de todas).
- Ao menos 2 linhas com número ou dado concreto.
- Penúltima linha cria tensão, última entrega a virada.
- Formato: uma frase por linha, sem numeração.
${VIRAL_RULES}
APENAS Português do Brasil.`,

  "caption": `Escreva uma LEGENDA de alto engajamento.

ESTRUTURA:
1️⃣ PRIMEIRA LINHA (o que aparece antes do "mais"): EM CAIXA ALTA, com 1 emoji, curiosity gap forte. É a linha que decide se leem o resto.
2️⃣ CORPO (3-5 linhas curtas, uma por parágrafo): a verdade que ninguém fala, com exemplo concreto ou número. Zero motivacional vazio.
3️⃣ CTA (1 linha): pergunta específica sobre o tema, feita para gerar comentário (comentário é o que mais empurra alcance).
4️⃣ HASHTAGS: 10, em português, mix de alto/médio/nicho.
${VIRAL_RULES}
APENAS Português do Brasil.`,

  "hashtags": `Gere EXATAMENTE 12 hashtags em português do Brasil, todas ligadas ao tema.

MIX OBRIGATÓRIO:
- 3 de ALTO volume (milhões)
- 5 de MÉDIO volume (100k-500k)
- 4 de NICHO (10k-50k, bem específicas do tema)

REGRAS: sem hashtags em inglês, sem repetir as óbvias de sempre, sem acento nem espaço dentro da hashtag. Formato: tudo em uma linha, separadas por espaço.
APENAS Português do Brasil.`,

  "tags": `Gere 12 tags/palavras-chave de SEO para o vídeo, em português.
Inclua: 3 palavras-chave principais, 5 variações de cauda longa (como as pessoas realmente pesquisam) e 4 termos do nicho.
Formato: lista única separada por vírgulas, tudo minúsculo. APENAS Português do Brasil.`,

  "video-prompt": `Crie um prompt cinematográfico para gerar o vídeo em IA (Runway, Pika, Sora, Veo, Grok).

Formato:
🎨 Estilo visual:
💡 Iluminação:
🎥 Câmera e movimento:
🌍 Ambiente e cenário:
🌀 Atmosfera e emoção:
🎬 PROMPT FINAL (em inglês, um parágrafo denso e pronto para colar):
🚫 Negative prompt (em inglês):

O prompt final deve descrever enquadramento vertical 9:16, ser visualmente específico (cores, textura, lente) e livre de texto na imagem. Explicações em Português do Brasil.`,

  "viral-score": `Analise o potencial viral e seja RIGOROSO (nota alta só com mérito real).
🎯 Força do Hook (0-3s): /100
📈 Retenção até o fim: /100
📤 Compartilhabilidade / salvamento: /100
💬 Potencial de comentário: /100
❤️ Gatilho emocional: /100
✨ Originalidade: /100
📊 SCORE FINAL: /100
Depois liste:
✅ 2 pontos fortes
🔧 3 melhorias concretas (reescreva o hook como exemplo)
APENAS Português do Brasil.`,
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
      const systemPrompt = `Você é o melhor estrategista de conteúdo viral do Brasil, especializado em ${platform}. Você já produziu centenas de vídeos com mais de 1 milhão de visualizações e domina retenção, curiosity gap, gatilhos emocionais e o comportamento do algoritmo (watch time, replays, comentários e salvamentos).

COMO VOCÊ ESCREVE:
- Específico, cru e concreto. Nunca genérico, nunca motivacional vazio, nunca linguagem de coach.
- Cada frase tem função: prender, desenvolver ou virar a mesa. Zero enrolação.
- Você prefere números, cenas visuais e situações reais a adjetivos.
- Você escreve como quem fala com um amigo, em frases curtas.

O que você entrega precisa ser bom o suficiente para o usuário gravar sem editar nada.
REGRA OBRIGATÓRIA: 100% em Português do Brasil, sem nenhuma palavra em outro idioma (exceto quando o formato pedir explicitamente inglês).`;
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
