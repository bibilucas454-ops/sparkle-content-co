import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sequence type configurations
const sequenceConfigs = {
  engajamento: {
    desc: "Conectar e identificar dor",
    types: ["gatilho", "contexto", "valor", "conexao", "cta"],
    storyCount: 5,
  },
  aquecimento: {
    desc: "Criar desejo e preparar",
    types: ["corte", "valor", "bastidor", "prova", "cta"],
    storyCount: 5,
  },
  venda: {
    desc: "Converter e fechar",
    types: ["gatilho", "corte", "valor", "prova", "valor", "cta", "cta"],
    storyCount: 7,
  },
};

// ---------------------------------------------------------------------------
// Build the master prompt for story generation
// ---------------------------------------------------------------------------
function buildStoriesPrompt(input: {
  nicho: string;
  produto: string;
  promessa: string;
  dorPrincipal: string;
  objetivo: string;
  tomVoz: string;
}, sequenceType: string, config: { types: string[]; storyCount: number }): { system: string; user: string } {
  const system = `Você é especialista em marketing de conteúdo para Instagram Stories.
Gere stories em português brasileiro conversacional, prontos para copiar e postar.
PROIBIDO: linguagem robótica, formalidade excessiva, repetição de estruturas.
Retorne APENAS JSON puro, sem markdown, sem código.`;

  const storyInstructions = config.types.slice(0, config.storyCount).map((tipo, i) => (
    `Story ${i + 1} (${tipo.toUpperCase()}): ${getTypeInstruction(tipo)}`
  )).join("\n");

  const user = `Gere uma sequência de ${config.storyCount} stories para Instagram.

CONTEXTO:
- Nicho: ${input.nicho}
- Produto: ${input.produto || "não especificado"}
- Promessa: ${input.promessa}
- Dor principal: ${input.dorPrincipal}
- Objetivo do público: ${input.objetivo || "transformar resultados"}
- Tom de voz: ${getTomVozDesc(input.tomVoz)}

REGRAS OBRIGATÓRIAS:
1. Cada story deve ter abertura COMPLETAMENTE diferente dos outros
2. NUNCA repita as 3 primeiras palavras entre stories
3. Máximo 150 caracteres por copy
4. Tom conversacional, como se estiver falando com um amigo
5. Inclua elemento interativo quando relevante (pergunta, enquete)

SEQUÊNCIA (${sequenceType}):
${storyInstructions}

Retorne JSON puro neste formato exato:
{"stories":[{"ordem":1,"tipo":"gatilho","copy":"texto aqui","elementos":["pergunta"],"cta":"ação aqui"},...]}`
;

  return { system, user };
}

function getTypeInstruction(tipo: string): string {
  const map: Record<string, string> = {
    gatilho:  "Comece com pergunta ou afirmação que para o scroll imediatamente",
    contexto: "Crie identificação mostrando situação real do público",
    valor:    "Entregue insight prático e acionável",
    conexao:  "Crie vínculo emocional com história pessoal",
    bastidor: "Mostre processo real, bastidores autênticos",
    prova:    "Apresente resultado concreto de cliente ou seu",
    corte:    "Quebre uma crença limitante que impede o público",
    cta:      "Direcione para ação específica (DM, link, responder)",
  };
  return map[tipo] ?? "Crie conteúdo relevante e impactante";
}

function getTomVozDesc(tom: string): string {
  const map: Record<string, string> = {
    direto:     "Direto, sem enrolação, autoridade silenciosa",
    emocional:  "Emocional, empático, conexão profunda",
    pragmatico: "Prático, objetivo, focado em resultados",
    protector:  "Protetor, acolhedor, mentor que guia",
  };
  return map[tom] ?? map.direto;
}

// ---------------------------------------------------------------------------
// Call Lovable AI Gateway (primary)
// ---------------------------------------------------------------------------
async function callLovableAI(apiKey: string, system: string, user: string): Promise<string> {
  console.log("[AI] Trying Lovable Gateway...");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 2000,
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[AI] Lovable Gateway error:", res.status, err);
    throw new Error(`Lovable Gateway ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Lovable Gateway: resposta vazia");
  console.log("[AI] Lovable Gateway OK");
  return content.trim();
}

// ---------------------------------------------------------------------------
// Call OpenAI directly (fallback)
// ---------------------------------------------------------------------------
async function callOpenAI(apiKey: string, system: string, user: string): Promise<string> {
  console.log("[AI] Trying OpenAI...");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 2000,
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[AI] OpenAI error:", res.status, err);
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI: resposta vazia");
  console.log("[AI] OpenAI OK");
  return content.trim();
}

// ---------------------------------------------------------------------------
// Parse AI JSON response
// ---------------------------------------------------------------------------
function parseStoriesResponse(raw: string, config: { types: string[]; storyCount: number }): any[] {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response is not valid JSON");
    parsed = JSON.parse(match[0]);
  }

  // Accept both {"stories":[...]} and direct array [...]
  let stories = Array.isArray(parsed) ? parsed : parsed?.stories;
  if (!stories || stories.length === 0) throw new Error("No stories found in response");
  return stories;
}

// ---------------------------------------------------------------------------
// Template fallback — guaranteed to always work
// ---------------------------------------------------------------------------
function generateTemplateFallback(
  input: { promessa: string; dorPrincipal: string },
  config: { types: string[]; storyCount: number }
): any[] {
  const templates = {
    gatilho:  (p: string) => `Você ainda está travado em ${p}? Tem algo que ninguém te contou.`,
    contexto: (p: string) => `${p} parece impossível até você descobrir o que realmente está te impedindo.`,
    valor:    (p: string) => `O segredo de quem consegue ${p}: foco no próximo passo, não no caminho inteiro.`,
    conexao:  (_: string, d: string) => `Me identifico demais com quem sofre com ${d}. Por isso comecei tudo isso.`,
    bastidor: (p: string) => `Por trás dos bastidores de como chegamos a ${p}: sem filtro, sem glamour.`,
    prova:    (p: string) => `Alguém aplicou isso semana passada e já viu diferença em ${p}. Resultado real.`,
    corte:    (_: string, d: string) => `Para de acreditar que ${d} é culpa sua. Isso é um sistema quebrado, não você.`,
    cta:      (_: string, __: string) => `Quer saber como? Me manda um direct agora com a palavra QUERO.`,
  };

  return config.types.slice(0, config.storyCount).map((tipo, i) => {
    const fn = templates[tipo as keyof typeof templates] ?? templates.gatilho;
    return {
      ordem: i + 1,
      tipo,
      copy: fn(input.promessa, input.dorPrincipal),
      elementos: i === config.storyCount - 1 ? ["cta"] : [],
      cta: i === config.storyCount - 1 ? "Manda um direct com QUERO" : "",
    };
  });
}

// ---------------------------------------------------------------------------
// Enrich stories with metadata
// ---------------------------------------------------------------------------
function enrichStories(stories: any[], config: { types: string[] }): any[] {
  return stories.map((story: any, idx: number) => {
    const copy: string = story.copy || story.content || "";
    const words = copy.split(" ");
    return {
      id: `story_${Date.now()}_${idx}`,
      ordem: story.ordem || story.order || idx + 1,
      tipo: story.tipo || story.type || config.types[idx % config.types.length],
      copy,
      elementos: story.elementos || story.elements || [],
      cta: story.cta || "",
      scoreDiversidade: 0,
      hashConteudo: "",
      primeirasTresPalavras: words.slice(0, 3).join(" "),
      estruturaSintatica: copy.endsWith("?") ? "pergunta" : copy.startsWith("Eu ") || copy.startsWith("Me ") ? "narrativa" : "afirmacao",
    };
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[generate-stories] Request received:", req.method, new Date().toISOString());

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Token ausente ou inválido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Sessão expirada. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("[Auth] User authenticated:", userData.user.id);

    // Parse body
    let input: any;
    let sequenceType: string;
    try {
      const body = await req.json();
      input = body.input;
      sequenceType = body.sequenceType;
    } catch {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate
    if (!input) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatório ausente: input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!sequenceType || !sequenceConfigs[sequenceType as keyof typeof sequenceConfigs]) {
      return new Response(
        JSON.stringify({ error: "sequenceType inválido. Use: engajamento, aquecimento ou venda." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!input.nicho || !input.promessa || !input.dorPrincipal) {
      return new Response(
        JSON.stringify({ error: "Preencha: nicho, promessa e dorPrincipal" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = sequenceConfigs[sequenceType as keyof typeof sequenceConfigs];
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    let rawStories: any[] | null = null;

    // Attempt 1: Lovable Gateway
    if (lovableKey) {
      try {
        const { system, user } = buildStoriesPrompt(input, sequenceType, config);
        const raw = await callLovableAI(lovableKey, system, user);
        rawStories = parseStoriesResponse(raw, config);
      } catch (e) {
        console.warn("[AI] Lovable failed:", e instanceof Error ? e.message : e);
      }
    }

    // Attempt 2: OpenAI
    if (!rawStories && openaiKey) {
      try {
        const { system, user } = buildStoriesPrompt(input, sequenceType, config);
        const raw = await callOpenAI(openaiKey, system, user);
        rawStories = parseStoriesResponse(raw, config);
      } catch (e) {
        console.warn("[AI] OpenAI failed:", e instanceof Error ? e.message : e);
      }
    }

    // Attempt 3: Template fallback
    if (!rawStories) {
      console.warn("[AI] All AI attempts failed. Using template fallbacks.");
      rawStories = generateTemplateFallback(input, config);
    }

    const enrichedStories = enrichStories(rawStories, config);

    // Calculate diversity score
    const uniqueOpenings = new Set(enrichedStories.map((s) => s.primeirasTresPalavras.toLowerCase())).size;
    const uniqueTypes = new Set(enrichedStories.map((s) => s.tipo)).size;
    const score = (uniqueOpenings / enrichedStories.length) * 0.4 + (uniqueTypes / 5) * 0.6;

    const sequence = {
      id: `seq_${Date.now()}`,
      tipo: sequenceType,
      stories: enrichedStories,
      input,
      scoreDiversidade: Math.round(score * 100) / 100,
      status: "pronto",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(`[generate-stories] Done. Generated ${enrichedStories.length} stories.`);

    return new Response(
      JSON.stringify({ sequence }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-stories] Unexpected error:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
