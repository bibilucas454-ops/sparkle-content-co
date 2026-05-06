// generate-stories v4 - Zero external imports, guaranteed response
// Uses only Deno built-ins. No Supabase client needed.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sequenceConfigs: Record<string, { types: string[]; storyCount: number }> = {
  engajamento: { types: ["gatilho", "contexto", "valor", "conexao", "cta"], storyCount: 5 },
  aquecimento: { types: ["corte", "valor", "bastidor", "prova", "cta"], storyCount: 5 },
  venda:       { types: ["gatilho", "corte", "valor", "prova", "valor", "cta", "cta"], storyCount: 7 },
};

// Pure template generation — no AI, no external calls, always works
function templateFallback(input: Record<string, string>, config: { types: string[]; storyCount: number }): any[] {
  const p = input.promessa || "sua meta";
  const d = input.dorPrincipal || "seu desafio";

  const copies: Record<string, string> = {
    gatilho:  `Você ainda está preso em "${d}"? Isso tem solução.`,
    contexto: `Quem luta com ${d} sente que está sozinho. Não está.`,
    valor:    `O segredo de quem consegue ${p}: foco no próximo passo.`,
    conexao:  `Eu passei anos tentando ${p} sem sair do lugar. Entendo você.`,
    bastidor: `Por trás de ${p}: sem filtro, sem glamour. Só processo.`,
    prova:    `Uma pessoa aplicou isso 30 dias atrás. Hoje vive ${p}. Real.`,
    corte:    `${d} não é culpa sua. É um sistema que não foi feito pra você.`,
    cta:      `Quer chegar em ${p}? Me manda um direct com QUERO agora.`,
  };

  return config.types.slice(0, config.storyCount).map((tipo, i) => ({
    id:                 `story_${Date.now()}_${i}`,
    ordem:              i + 1,
    tipo,
    copy:               copies[tipo] ?? `Story ${i + 1} sobre ${p}.`,
    elementos:          [],
    cta:                tipo === "cta" ? "Manda QUERO no direct" : "",
    scoreDiversidade:   0,
    hashConteudo:       "",
    primeirasTresPalavras: (copies[tipo] ?? "").split(" ").slice(0, 3).join(" "),
    estruturaSintatica: tipo === "gatilho" ? "pergunta" : tipo === "conexao" ? "narrativa" : "afirmacao",
  }));
}

// AI generation attempt — wrapped so any error falls through to template
async function tryAIGeneration(
  input: Record<string, string>,
  sequenceType: string,
  config: { types: string[]; storyCount: number }
): Promise<any[] | null> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const openaiKey  = Deno.env.get("OPENAI_API_KEY");

  if (!lovableKey && !openaiKey) {
    console.log("[AI] No API keys configured, skipping AI");
    return null;
  }

  const storyLines = config.types
    .slice(0, config.storyCount)
    .map((t, i) => `Story ${i + 1} (${t}): foco em ${t}`)
    .join("\n");

  const systemPrompt = `Você cria stories de Instagram em português brasileiro. Retorne APENAS JSON válido, sem markdown.`;
  const userPrompt = `Crie ${config.storyCount} stories sobre:
Promessa: ${input.promessa}
Dor: ${input.dorPrincipal}

${storyLines}

Retorne: {"stories":[{"ordem":1,"tipo":"gatilho","copy":"texto curto","elementos":[],"cta":""},...]}`;

  const endpoints = [];
  if (lovableKey) {
    endpoints.push({
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      auth: `Bearer ${lovableKey}`,
      model: "openai/gpt-4o",
    });
  }
  if (openaiKey) {
    endpoints.push({
      url: "https://api.openai.com/v1/chat/completions",
      auth: `Bearer ${openaiKey}`,
      model: "gpt-4o",
    });
  }

  for (const ep of endpoints) {
    try {
      console.log("[AI] Trying:", ep.url);
      const res = await fetch(ep.url, {
        method: "POST",
        headers: { Authorization: ep.auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ep.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt },
          ],
          max_tokens: 1500,
          temperature: 0.9,
        }),
        signal: AbortSignal.timeout(25000), // 25 second timeout per attempt
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn("[AI] HTTP error:", res.status, errText.substring(0, 200));
        continue;
      }

      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content ?? "";
      if (!content) { console.warn("[AI] Empty response"); continue; }

      // Parse the JSON
      const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) { console.warn("[AI] No JSON in response"); continue; }
        parsed = JSON.parse(match[0]);
      }

      const stories = Array.isArray(parsed) ? parsed : parsed?.stories;
      if (stories?.length) {
        console.log("[AI] Success! Stories:", stories.length);
        return stories;
      }
      console.warn("[AI] No stories array in response");
    } catch (e) {
      console.warn("[AI] Error:", e instanceof Error ? e.message : String(e));
    }
  }

  return null;
}

// Enrich raw stories with required metadata fields
function enrichStories(stories: any[], config: { types: string[] }): any[] {
  return stories.map((s: any, idx: number) => {
    const copy = String(s.copy || s.content || "");
    return {
      id:                   s.id || `story_${Date.now()}_${idx}`,
      ordem:                s.ordem || s.order || idx + 1,
      tipo:                 s.tipo || s.type || config.types[idx % config.types.length],
      copy,
      elementos:            Array.isArray(s.elementos) ? s.elementos : [],
      cta:                  s.cta || "",
      scoreDiversidade:     s.scoreDiversidade ?? 0,
      hashConteudo:         s.hashConteudo || "",
      primeirasTresPalavras: copy.split(" ").slice(0, 3).join(" "),
      estruturaSintatica:   copy.endsWith("?") ? "pergunta" : copy.startsWith("Eu ") ? "narrativa" : "afirmacao",
    };
  });
}

// Build and return the sequence response
function buildSequenceResponse(
  stories: any[],
  sequenceType: string,
  input: Record<string, string>,
  config: { types: string[] }
): Response {
  const enriched = enrichStories(stories, config);
  const uniqueOpenings = new Set(enriched.map((s) => s.primeirasTresPalavras.toLowerCase())).size;
  const uniqueTypes    = new Set(enriched.map((s) => s.tipo)).size;
  const score = (uniqueOpenings / enriched.length) * 0.4 + (uniqueTypes / 5) * 0.6;

  const sequence = {
    id:               `seq_${Date.now()}`,
    tipo:             sequenceType,
    stories:          enriched,
    input,
    scoreDiversidade: Math.round(score * 100) / 100,
    status:           "pronto",
    createdAt:        new Date().toISOString(),
    updatedAt:        new Date().toISOString(),
  };

  return new Response(JSON.stringify({ sequence }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log("[generate-stories] v4 Request:", req.method, new Date().toISOString());

  // We wrap EVERYTHING in a try-catch that always returns 200
  // This guarantees no non-2xx response except for true malformed requests
  try {
    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      console.warn("[generate-stories] Invalid JSON body");
      return new Response(JSON.stringify({ error: "JSON inválido no corpo da requisição" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const input: Record<string, string> = body.input || {};
    const sequenceType: string = body.sequenceType || "";

    console.log("[generate-stories] input keys:", Object.keys(input), "sequenceType:", sequenceType);

    // Validate required fields
    if (!sequenceType) {
      return new Response(JSON.stringify({ error: "sequenceType é obrigatório (engajamento/aquecimento/venda)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = sequenceConfigs[sequenceType];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `sequenceType inválido: "${sequenceType}"` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize input to avoid undefined errors
    const safeInput: Record<string, string> = {
      nicho:         input.nicho        || "geral",
      produto:       input.produto      || "",
      promessa:      input.promessa     || "alcançar seus objetivos",
      dorPrincipal:  input.dorPrincipal || "superar desafios",
      objetivo:      input.objetivo     || "",
      tomVoz:        input.tomVoz       || "direto",
      userId:        input.userId       || "",
    };

    // Try AI first, fall back to templates — this block NEVER throws
    let rawStories: any[] | null = null;
    try {
      rawStories = await tryAIGeneration(safeInput, sequenceType, config);
    } catch (aiErr) {
      console.error("[generate-stories] AI block error:", aiErr instanceof Error ? aiErr.message : String(aiErr));
    }

    if (!rawStories || rawStories.length === 0) {
      console.log("[generate-stories] Using template fallback");
      rawStories = templateFallback(safeInput, config);
    }

    console.log("[generate-stories] Returning", rawStories.length, "stories");
    return buildSequenceResponse(rawStories, sequenceType, safeInput, config);

  } catch (fatal) {
    // Last resort — should never happen but guarantees a response
    console.error("[generate-stories] FATAL:", fatal instanceof Error ? fatal.message : String(fatal));
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
