import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Sequence type configurations
const sequenceConfigs: Record<string, { types: string[]; storyCount: number }> = {
  engajamento: { types: ["gatilho", "contexto", "valor", "conexao", "cta"], storyCount: 5 },
  aquecimento: { types: ["corte", "valor", "bastidor", "prova", "cta"], storyCount: 5 },
  venda:       { types: ["gatilho", "corte", "valor", "prova", "valor", "cta", "cta"], storyCount: 7 },
};

function getTypeInstruction(tipo: string): string {
  const map: Record<string, string> = {
    gatilho:  "Pergunta ou afirmação chocante que para o scroll",
    contexto: "Identificação com situação real do público",
    valor:    "Insight prático e direto ao ponto",
    conexao:  "Vínculo emocional com história pessoal breve",
    bastidor: "Processo real, bastidores autênticos",
    prova:    "Resultado concreto com número ou nome",
    corte:    "Quebra de crença limitante do público",
    cta:      "Ação específica: DM, link, responder",
  };
  return map[tipo] ?? "Conteúdo impactante e relevante";
}

function getTomVozDesc(tom: string): string {
  const map: Record<string, string> = {
    direto:     "direto e sem enrolação",
    emocional:  "emocional e empático",
    pragmatico: "prático e focado em resultados",
    protector:  "protetor e acolhedor como mentor",
  };
  return map[tom] ?? "direto e sem enrolação";
}

function buildPrompt(
  input: Record<string, string>,
  sequenceType: string,
  config: { types: string[]; storyCount: number }
): { system: string; user: string } {
  const system = `Você cria stories de Instagram em português brasileiro conversacional.
Tom: ${getTomVozDesc(input.tomVoz || "direto")}.
Retorne APENAS JSON. Sem texto extra. Sem markdown.`;

  const storyLines = config.types
    .slice(0, config.storyCount)
    .map((t, i) => `Story ${i + 1} [${t}]: ${getTypeInstruction(t)}`)
    .join("\n");

  const user = `Crie ${config.storyCount} stories para Instagram sobre:
- Promessa: ${input.promessa}
- Dor: ${input.dorPrincipal}
- Produto: ${input.produto || "não especificado"}
- Objetivo público: ${input.objetivo || "transformar resultados"}

Sequência (${sequenceType}):
${storyLines}

Regras: abertura diferente em cada story, máximo 150 chars por copy, tom conversacional.

Formato JSON obrigatório:
{"stories":[{"ordem":1,"tipo":"gatilho","copy":"texto","elementos":[],"cta":""},{"ordem":2,"tipo":"contexto","copy":"texto","elementos":[],"cta":""}]}`;

  return { system, user };
}

async function callLovableAI(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 2000,
      temperature: 0.9,
    }),
  });
  if (!res.ok) throw new Error(`Lovable Gateway ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta vazia do AI");
  return content.trim();
}

async function callOpenAI(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 2000,
      temperature: 0.9,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta vazia do OpenAI");
  return content.trim();
}

function parseAIStories(raw: string): any[] {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON inválido na resposta do AI");
    parsed = JSON.parse(match[0]);
  }
  const stories = Array.isArray(parsed) ? parsed : parsed?.stories;
  if (!stories?.length) throw new Error("Nenhum story encontrado na resposta");
  return stories;
}

function templateFallback(
  input: Record<string, string>,
  config: { types: string[]; storyCount: number }
): any[] {
  const copies: Record<string, (p: string, d: string) => string> = {
    gatilho:  (p) => `Você ainda está travado em ${p}? Isso muda agora.`,
    contexto: (_, d) => `Todo mundo que passa por ${d} sente que está sozinho. Não está.`,
    valor:    (p) => `O segredo de quem consegue ${p}: consistência antes de estratégia.`,
    conexao:  (_, d) => `Conheço a sensação de ${d}. Foi meu ponto de virada mais importante.`,
    bastidor: (p) => `Bastidor real de como chegamos a ${p}: sem filtro, com trabalho.`,
    prova:    (p) => `Alguém aplicou isso há 30 dias. Hoje vive ${p}. Resultado real.`,
    corte:    (_, d) => `Isso que te acontece com ${d}? Não é falta de esforço. É sistema errado.`,
    cta:      () => `Quer saber como aplicar isso? Me manda um direct com QUERO.`,
  };

  return config.types.slice(0, config.storyCount).map((tipo, i) => ({
    ordem: i + 1,
    tipo,
    copy: (copies[tipo] ?? copies.gatilho)(input.promessa || "sua meta", input.dorPrincipal || "seu desafio"),
    elementos: [],
    cta: tipo === "cta" ? "Me manda QUERO no direct" : "",
  }));
}

function enrichStories(stories: any[], config: { types: string[] }): any[] {
  return stories.map((s: any, idx: number) => {
    const copy: string = String(s.copy || s.content || "");
    return {
      id: `story_${Date.now()}_${idx}`,
      ordem: s.ordem || s.order || idx + 1,
      tipo: s.tipo || s.type || config.types[idx % config.types.length],
      copy,
      elementos: Array.isArray(s.elementos) ? s.elementos : [],
      cta: s.cta || "",
      scoreDiversidade: 0,
      hashConteudo: "",
      primeirasTresPalavras: copy.split(" ").slice(0, 3).join(" "),
      estruturaSintatica: copy.endsWith("?") ? "pergunta" : copy.startsWith("Eu ") ? "narrativa" : "afirmacao",
    };
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[generate-stories] v3 - Request:", req.method, new Date().toISOString());

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // --- Parse body ---
    let body: any;
    try {
      body = await req.json();
      console.log("[generate-stories] Body keys:", Object.keys(body || {}));
    } catch {
      return new Response(JSON.stringify({ error: "Corpo da requisição inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { input, sequenceType } = body || {};

    // --- Validate input ---
    if (!input || !sequenceType) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: input, sequenceType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sequenceConfigs[sequenceType]) {
      return new Response(
        JSON.stringify({ error: `sequenceType inválido: "${sequenceType}". Use: engajamento, aquecimento, venda` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!input.promessa || !input.dorPrincipal) {
      return new Response(JSON.stringify({ error: "Preencha: promessa e dorPrincipal" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = sequenceConfigs[sequenceType];
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const openaiKey  = Deno.env.get("OPENAI_API_KEY");

    console.log("[generate-stories] Keys available - Lovable:", !!lovableKey, "OpenAI:", !!openaiKey);

    let rawStories: any[] | null = null;

    // Attempt 1: Lovable Gateway
    if (lovableKey) {
      try {
        const { system, user } = buildPrompt(input, sequenceType, config);
        const raw = await callLovableAI(lovableKey, system, user);
        rawStories = parseAIStories(raw);
        console.log("[generate-stories] Lovable OK, stories:", rawStories.length);
      } catch (e) {
        console.warn("[generate-stories] Lovable failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // Attempt 2: OpenAI
    if (!rawStories && openaiKey) {
      try {
        const { system, user } = buildPrompt(input, sequenceType, config);
        const raw = await callOpenAI(openaiKey, system, user);
        rawStories = parseAIStories(raw);
        console.log("[generate-stories] OpenAI OK, stories:", rawStories.length);
      } catch (e) {
        console.warn("[generate-stories] OpenAI failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // Attempt 3: Template fallback (always works)
    if (!rawStories || rawStories.length === 0) {
      console.warn("[generate-stories] Using template fallback");
      rawStories = templateFallback(input, config);
    }

    const enrichedStories = enrichStories(rawStories, config);

    const uniqueOpenings = new Set(enrichedStories.map((s) => s.primeirasTresPalavras.toLowerCase())).size;
    const uniqueTypes    = new Set(enrichedStories.map((s) => s.tipo)).size;
    const score = (uniqueOpenings / enrichedStories.length) * 0.4 + (uniqueTypes / 5) * 0.6;

    const sequence = {
      id:              `seq_${Date.now()}`,
      tipo:            sequenceType,
      stories:         enrichedStories,
      input,
      scoreDiversidade: Math.round(score * 100) / 100,
      status:          "pronto",
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    console.log(`[generate-stories] Done — ${enrichedStories.length} stories`);

    return new Response(JSON.stringify({ sequence }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno inesperado";
    console.error("[generate-stories] Unexpected error:", msg, err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
