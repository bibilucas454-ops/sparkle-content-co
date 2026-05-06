import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um analista de tendências virais especializado em ${platform || "Instagram Reels e YouTube Shorts"}.
Você analisa padrões de conteúdo viral e identifica tendências emergentes.
REGRA OBRIGATÓRIA: Todo conteúdo DEVE ser em Português do Brasil. Frases curtas e impactantes.`;

    const userPrompt = `Analise as tendências atuais para ${platform || "todas as plataformas"} e gere 6 tendências virais.
Para cada tendência, forneça:
- Plataforma (Instagram ou YouTube)
- Tópico em alta
- Exemplo de hook chamativo
- Hashtags relevantes (5 hashtags separadas por espaço)
- Formato de vídeo recomendado
- Score viral (0-100)
- Categoria
- Descrição breve`;

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
              name: "return_trends",
              description: "Retorne as tendências analisadas em Português do Brasil",
              parameters: {
                type: "object",
                properties: {
                  trends: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        platform: { type: "string", description: "Instagram ou YouTube" },
                        topic: { type: "string", description: "Tópico em alta" },
                        hook: { type: "string", description: "Exemplo de hook chamativo" },
                        hashtags: { type: "string", description: "5 hashtags separadas por espaço" },
                        format: { type: "string", description: "Formato de vídeo recomendado" },
                        viral_score: { type: "integer", description: "Score viral de 0 a 100" },
                        category: { type: "string", description: "Categoria da tendência" },
                        description: { type: "string", description: "Descrição breve da tendência" },
                      },
                      required: ["platform", "topic", "hook", "hashtags", "format", "viral_score", "category", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["trends"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_trends" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("Falha na análise de tendências");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) throw new Error("Sem resposta da IA");

    const parsed = JSON.parse(toolCall.function.arguments);
    const trends = parsed.trends || [];

    // Store in database
    for (const trend of trends) {
      await supabase.from("trends").insert({
        platform: trend.platform,
        topic: trend.topic,
        hook: trend.hook,
        hashtags: trend.hashtags,
        format: trend.format,
        trending_score: Math.min(100, Math.max(0, trend.viral_score)),
        category: trend.category,
        description: trend.description,
      });
    }

    return new Response(JSON.stringify({ trends }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-trends error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
