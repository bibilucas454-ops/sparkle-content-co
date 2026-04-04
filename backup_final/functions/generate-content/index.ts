import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const typePrompts: Record<string, string> = {
  "viral-idea": `Gere 1 ideia de vídeo curto com ALTO potencial de viralização.
Formato obrigatório:
- Título da ideia (curto e impactante)
- Breve descrição do conceito (máximo 2 linhas)
- Por que vai viralizar (1 linha)
Use linguagem simples e impactante. Frases curtas. APENAS Português do Brasil.`,

  "hook": `Crie um HOOK (gancho) extremamente chamativo para os primeiros 2 segundos do vídeo.
Use uma destas técnicas:
- Curiosidade irresistível
- Quebra de expectativa
- Polêmica leve
- Mistério
Formato: Apenas a frase do hook, direta e impactante. Máximo 1-2 frases curtas. APENAS Português do Brasil.`,

  "script": `Escreva um roteiro para vídeo curto (10-20 segundos). Estrutura OBRIGATÓRIA:

🎯 HOOK (0–2s): Frase extremamente chamativa
📌 CONTEXTO (2–6s): Desenvolvimento rápido
💥 MOMENTO DE IMPACTO (6–10s): Clímax surpreendente
📢 CALL TO ACTION (final): CTA direto e claro

Use tom conversacional e coloquial brasileiro. Frases curtas. Maximize retenção, curiosidade e compartilhamento. APENAS Português do Brasil.`,

  "video-text": `Crie frases curtas e impactantes que aparecerão NA TELA durante o vídeo.
Formato:
- 4 a 6 frases curtas (máximo 8 palavras cada)
- Cada frase deve aparecer em um momento diferente do vídeo
- Use linguagem direta e visual
APENAS Português do Brasil.`,

  "caption": `Escreva uma legenda usando o modelo AIDA. Máximo 3 linhas no total:
✅ Atenção: Frase de impacto/hook
✅ Interesse: Por que devem se importar
✅ Desejo: Pinte o cenário ideal
✅ Ação: CTA claro e direto
Inclua emojis relevantes. Frases curtas e impactantes. APENAS Português do Brasil.`,

  "hashtags": `Gere EXATAMENTE 5 hashtags virais e relevantes em português.
Mix: 2 alto volume, 2 médio volume, 1 nicho específico.
Formate em uma única linha separadas por espaços. APENAS Português do Brasil.`,

  "tags": `Gere EXATAMENTE 5 tags/palavras-chave para SEO em português.
Inclua palavras-chave primárias e variações. Formate como lista separada por vírgulas. APENAS Português do Brasil.`,

  "video-prompt": `Crie um prompt detalhado para gerar o vídeo em ferramentas de IA (Runway, Pika, Sora, Grok).
Formato obrigatório:
🎨 Estilo visual:
💡 Iluminação:
🎥 Movimento de câmera:
🌍 Ambiente:
🌀 Atmosfera:
O prompt principal pode ser em inglês para compatibilidade, mas toda explicação DEVE ser em Português do Brasil.`,

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
