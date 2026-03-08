import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const typePrompts: Record<string, string> = {
  "viral-idea": "Gere 10 ideias de vídeos virais. Cada ideia deve ser criativa, chamativa e otimizada para vídeos curtos. Formate como lista numerada. IMPORTANTE: Todo o conteúdo DEVE ser em Português do Brasil.",
  "script": "Escreva um roteiro completo para vídeo curto (10-20 segundos). Estrutura obrigatória: Hook (primeiros 2 segundos - extremamente chamativo), Contexto (desenvolvimento rápido), Clímax (momento de impacto), Call to Action (CTA claro). Use tom conversacional e coloquial brasileiro. O conteúdo deve maximizar retenção, curiosidade e compartilhamento. IMPORTANTE: Todo o conteúdo DEVE ser em Português do Brasil.",
  "caption": "Escreva uma legenda usando o modelo AIDA: Atenção (frase de impacto/hook), Interesse (por que devem se importar), Desejo (pinte o cenário ideal), Ação (CTA claro e direto). Inclua emojis relevantes. IMPORTANTE: Todo o conteúdo DEVE ser em Português do Brasil.",
  "hashtags": "Gere 5 hashtags virais estratégicas em português. Mix: 2 alto volume (1M+), 2 médio (100K-1M), 1 nicho/específico. Formate em uma única linha separadas por espaços. IMPORTANTE: Todo o conteúdo DEVE ser em Português do Brasil.",
  "tags": "Gere 5 tags/palavras-chave relevantes para SEO em português. Inclua: palavras-chave primárias, secundárias e variações long-tail. Formate como lista separada por vírgulas. IMPORTANTE: Todo o conteúdo DEVE ser em Português do Brasil.",
  "video-prompt": "Crie um prompt detalhado para geração de vídeo por IA. Inclua: estilo visual, ângulos de câmera, transições, sobreposições de texto, clima da música, colorização. Seja específico e cinematográfico. IMPORTANTE: O prompt pode ser em inglês para compatibilidade com ferramentas de IA, mas a descrição/explicação deve ser em Português do Brasil.",
  "viral-score": "Analise o potencial viral deste tópico de conteúdo. Avalie de 0 a 100 e explique: Força do Hook, Compartilhabilidade, Alinhamento com tendências, Gatilho emocional, Originalidade. Formate com pontuações para cada categoria. IMPORTANTE: Todo o conteúdo DEVE ser em Português do Brasil.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, platform, types } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const results = [];

    for (const type of types) {
      const systemPrompt = `Você é um estrategista de conteúdo viral especializado em ${platform}. Você entende algoritmos, tendências e o que faz um conteúdo viralizar. Seja específico, acionável e criativo. Nunca seja genérico. REGRA OBRIGATÓRIA: Todo o conteúdo gerado DEVE ser em Português do Brasil.`;
      const userPrompt = `Tema: "${topic}" para ${platform}.\n\n${typePrompts[type] || "Gere conteúdo criativo para este tema em Português do Brasil."}`;

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
                description: "Return the generated content with a viral score",
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
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
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
