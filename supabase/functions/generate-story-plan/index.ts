import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------------------------------------------------------------------------
// Type info — labels and descriptions for each story type
// ---------------------------------------------------------------------------
const typeDescriptions: Record<string, { label: string; tip: string }> = {
  conexao:   { label: "Conexao",     tip: "Humanize e crie identificacao" },
  autoridade:{ label: "Autoridade",  tip: "Demonstre conhecimento e credibilidade" },
  prova:     { label: "Prova Social",tip: "Mostre resultados e validacao" },
  bastidor:  { label: "Bastidor",    tip: "Mostre os bastidores" },
  enquete:   { label: "Enquete",     tip: "Interaja com sua audiencia" },
  objecao:   { label: "Objecao",     tip: "Responda duvidas e objecoes" },
  cta:       { label: "CTA",         tip: "Chame para acao" },
};

// ---------------------------------------------------------------------------
// Objective flows — ordered type sequences per objective
// ---------------------------------------------------------------------------
const objectiveFlows: Record<string, string[]> = {
  engajar:   ["conexao", "enquete", "bastidor", "prova", "autoridade"],
  aquecer:   ["conexao", "autoridade", "bastidor", "prova", "objecao"],
  vender:    ["conexao", "prova", "autoridade", "objecao", "cta"],
  caixinha:  ["conexao", "enquete", "bastidor", "objecao", "cta"],
  direct:    ["conexao", "prova", "autoridade", "objecao", "cta"],
  nutrir:    ["conexao", "autoridade", "bastidor", "prova", "enquete"],
};

// ---------------------------------------------------------------------------
// Funnel positions — specific role of each position regardless of type
// ---------------------------------------------------------------------------
const funnelPositions: Record<number, { role: string; instruction: string }> = {
  1: {
    role: "HOOK / CONEXAO",
    instruction:
      "Este e o Story de abertura. Deve PARAR o scroll. Comece com uma afirmacao chocante, pergunta provocadora ou revelacao pessoal. NÃO explique nada ainda — apenas crie curiosidade ou identificacao imediata. Maximo 2 frases.",
  },
  2: {
    role: "IDENTIFICACAO / PROBLEMA",
    instruction:
      "Aprofunde a dor ou o desejo despertado no story anterior. Faça a pessoa se ver na situacao. Use linguagem empatica. Mostre que voce entende o problema dela por dentro. Maximo 3 frases.",
  },
  3: {
    role: "QUEBRA / INSIGHT",
    instruction:
      "Apresente um insight, reviravolta ou ensinamento que muda a perspectiva. Este story deve surpreender — dizer algo que a pessoa nao esperava ouvir. Tom: revelador, confiante, educativo. Maximo 3 frases.",
  },
  4: {
    role: "CONSTRUCAO / VALOR",
    instruction:
      "Construa sobre o insight anterior. Mostre o caminho, a prova, o bastidor ou a transformacao possivel. Concreto, especifico, com detalhe real. Deve gerar desejo de continuar. Maximo 3 frases.",
  },
  5: {
    role: "CTA / INTERACAO",
    instruction:
      "Este e o fechamento. Converta a atencao em acao. Seja direto e especifico: diga EXATAMENTE o que a pessoa deve fazer agora. Crie urgencia genuina. Maximo 2 frases.",
  },
};

// Extended positions for 7-story sequences
const funnelPositions7: Record<number, { role: string; instruction: string }> = {
  1: funnelPositions[1],
  2: funnelPositions[2],
  3: funnelPositions[3],
  4: {
    role: "PROVA / EVIDENCIA",
    instruction:
      "Mostre uma prova concreta: resultado real, depoimento, numero, antes/depois. Este story valida o que foi dito antes. Tom: impactante, comprovado. Maximo 3 frases.",
  },
  5: funnelPositions[4],
  6: {
    role: "OBJECAO / ANTECIPACAO",
    instruction:
      "Responda a principal duvida ou objecao que a pessoa poderia ter agora. Seja honesto e direto. Desarme a resistencia com um argumento solido e simpatico. Maximo 3 frases.",
  },
  7: funnelPositions[5],
};

// Minimal 3-story funnel
const funnelPositions3: Record<number, { role: string; instruction: string }> = {
  1: funnelPositions[1],
  2: funnelPositions[3],
  3: funnelPositions[5],
};

function getFunnelMap(total: number): Record<number, { role: string; instruction: string }> {
  if (total === 3) return funnelPositions3;
  if (total === 7) return funnelPositions7;
  return funnelPositions; // default: 5
}

// ---------------------------------------------------------------------------
// Type-specific writing instructions
// ---------------------------------------------------------------------------
const typeWritingInstructions: Record<string, string> = {
  conexao:
    "Estilo: pessoal, vulneravel, acolhedor. Use 'eu' e 'voce'. Compartilhe algo real sobre si.",
  autoridade:
    "Estilo: confiante, educativo, especialista. Demonstre dominio sem arrogancia. Dados ou insights.",
  prova:
    "Estilo: concreto, impactante, persuasivo. Use resultados reais, numeros ou depoimentos.",
  bastidor:
    "Estilo: autentico, revelador, sem filtros. Mostre o processo real, os erros, a rotina.",
  enquete:
    "Estilo: interativo, curioso, divertido. Termine com uma pergunta direta ou opcoes de resposta.",
  objecao:
    "Estilo: empático, prestativo, direto. Cite a objecao textualmente e responda com clareza.",
  cta:
    "Estilo: urgente, especifico, orientado a acao. Diga o passo exato: 'manda direct', 'clica no link', 'responde aqui'.",
};

// ---------------------------------------------------------------------------
// Template fallbacks — guaranteed unique per type and position
// ---------------------------------------------------------------------------
function generateTemplateFallbacks(topic: string, total: number): Array<{
  order: number; type: string; typeLabel: string; content: string; tip: string;
}> {
  const templates = [
    {
      type: "conexao",
      templates: [
        `Posso ser honesto com voce? ${topic} foi a coisa que mais me desafiou — e que mais me transformou. Ja sentiu isso?`,
        `Sabe aquele momento em que voce percebe que algo precisa mudar? Foi exatamente assim que comecei com ${topic}.`,
        `Eu nao comecei achando que sabia tudo sobre ${topic}. Comecei com duvidas, erros e muito aprendizado. E voce?`,
      ],
    },
    {
      type: "objecao",
      templates: [
        `"Mas isso e para mim?" — A pergunta que mais ouco sobre ${topic}. Resposta honesta: se voce esta aqui, ja e um sinal.`,
        `O maior mito sobre ${topic}: que e complicado demais. A verdade e que o maior obstaculo e o primeiro passo.`,
        `"Nao tenho tempo para isso." Entendo. Mas quanto tempo voce ja gastou sem resolver ${topic}?`,
      ],
    },
    {
      type: "autoridade",
      templates: [
        `Depois de anos trabalhando com ${topic}, aprendi: a maioria das pessoas pula a etapa mais importante.`,
        `Uma coisa que mudou completamente minha relacao com ${topic}: parar de buscar perfeicao e comecar pela consistencia.`,
        `${topic} nao e sobre fazer mais. E sobre fazer o que importa, da forma certa, no momento certo.`,
      ],
    },
    {
      type: "prova",
      templates: [
        `Um cliente chegou para mim desesperado com ${topic}. Em 30 dias, o resultado foi completamente diferente do que esperava — para melhor.`,
        `Antes: travado, sem resultado, sem direcao. Depois de aplicar o metodo em ${topic}: clareza, progresso e resultado real.`,
        `Nao e teoria. E o que aconteceu de verdade quando alguem aplicou isso em ${topic}.`,
      ],
    },
    {
      type: "bastidor",
      templates: [
        `Por tras das cameras: como e meu processo real com ${topic} no dia a dia. Sem filtro, sem edicao — so a verdade.`,
        `Hoje vou te mostrar o que ninguem mostra sobre ${topic}. O caos, o processo, os erros incluidos.`,
        `Bastidor real: como fica minha rotina quando estou trabalhando em ${topic}. Nao e glamour — e processo.`,
      ],
    },
    {
      type: "enquete",
      templates: [
        `Pergunta rapida: qual e o seu maior desafio com ${topic} agora? A ou B? Responde ali em cima — vou comentar cada resposta.`,
        `Teste rapido sobre ${topic}: voce ja tentou isso antes? Responde com o emoji certo. Vou revelar o resultado amanha.`,
        `Qual dessas frases te representa mais quando o assunto e ${topic}? Vota ai — voce vai se surpreender com o resultado.`,
      ],
    },
    {
      type: "cta",
      templates: [
        `Pronto para dar o proximo passo com ${topic}? Manda um direct agora com a palavra QUERO. Respondo pessoalmente.`,
        `Se esse conteudo fez sentido para voce — salva, compartilha e me manda uma mensagem. Quero saber sua historia com ${topic}.`,
        `Nao deixa para amanha. Clica no link da bio agora e descobre como posso te ajudar com ${topic} de forma real.`,
      ],
    },
  ];

  const flow = objectiveFlows.vender;
  const stories = [];
  const funnelMap = getFunnelMap(total);

  for (let i = 0; i < total; i++) {
    const typeId = flow[i % flow.length];
    const typeTemplates = templates.find((t) => t.type === typeId) ?? templates[0];
    const content = typeTemplates.templates[i % typeTemplates.templates.length];
    const typeInfo = typeDescriptions[typeId];
    stories.push({
      order: i + 1,
      type: typeId,
      typeLabel: typeInfo.label,
      content,
      tip: `${funnelMap[i + 1]?.role ?? ""} — ${typeInfo.tip}`,
    });
  }
  return stories;
}

// ---------------------------------------------------------------------------
// Build the master prompt — generates ALL stories in one call
// ---------------------------------------------------------------------------
function buildMasterPrompt(
  topic: string,
  objectiveLabel: string,
  sequence: Array<{ position: number; typeId: string; role: string; instruction: string; writingStyle: string }>
): { system: string; user: string } {
  const system = `Você é influenciador. Manda story como pra amigo.

Regras:
- Linguagem natural, dia a dia
- 1-2 frases por story
- Cada um diferente do outro
- Sem técnica, sem formalidade
- Parece que gravou agora`;

  const user = `Tema: "${topic}"

Story 1: pergunta forte que para scroll
Story 2: identificação com problema
Story 3: história pessoal sua
Story 4: quebra objeção
Story 5: pede ação direto

Exemplo estilo: {"stories": [{"position":1,"content":"E se a resposta estivesse na pergunta errada?"},{"position":2,"content":"Você não está preso por não saber. Está preso porque aceitou isso como normal."},{"position":3,"content":"Eu pasei 10 anos achando que era assim mesmo."},{"position":4,"content":"Antes que você diga que é tarde: pare com isso."},{"position":5,"content":"Quer mesmo continuar assim? Me conta aqui."}]}

Retorna JSON puro. Cada story único.`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// Call Lovable AI Gateway
// ---------------------------------------------------------------------------
async function callLovableAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  console.log("[AI] Trying Lovable Gateway...");
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 1.1,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[AI] Lovable Gateway error:", response.status, errText);
    throw new Error(`Lovable Gateway ${response.status}: ${errText}`);
  }

  const data = await response.json();
  console.log("[AI] Lovable Gateway response OK");
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Lovable Gateway: resposta vazia");
  return content.trim();
}

// ---------------------------------------------------------------------------
// Call OpenAI directly
// ---------------------------------------------------------------------------
async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  console.log("[AI] Trying OpenAI...");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 1.1,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[AI] OpenAI error:", response.status, errText);
    throw new Error(`OpenAI ${response.status}: ${errText}`);
  }

  const data = await response.json();
  console.log("[AI] OpenAI response OK");
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI: resposta vazia");
  return content.trim();
}

// ---------------------------------------------------------------------------
// Parse AI JSON response — extract stories array
// ---------------------------------------------------------------------------
function parseAIResponse(
  raw: string,
  sequence: Array<{ position: number; typeId: string }>
): Array<{ position: number; type: string; content: string }> {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  let parsed: { stories?: Array<{ position?: number; type?: string; content?: string }> };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response is not valid JSON");
    parsed = JSON.parse(match[0]);
  }

  if (!parsed?.stories || parsed.stories.length === 0) {
    if (cleaned.includes("{")) {
      const arrMatch = cleaned.match(/"stories"\s*:\s*\[([\s\S]*)\]/);
      if (arrMatch) {
        const storiesStr = `[${arrMatch[1]}]`;
        parsed = { stories: JSON.parse(storiesStr) };
      }
    }
    if (!parsed?.stories?.length) {
      throw new Error("AI response missing 'stories' array");
    }
  }

  const stories = parsed.stories!.filter(s => s.content?.trim());
  if (stories.length === 0) throw new Error("No valid stories found");

  const result = stories.map((s, i) => ({
    position: s.position ?? (i + 1),
    type: s.type ?? sequence[i]?.typeId ?? "conexao",
    content: s.content!.trim()
  }));

  return result.slice(0, sequence.length);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[generate-story-plan] Request received:", req.method, new Date().toISOString());

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Token ausente ou invalido." }),
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
        JSON.stringify({ error: "Sessao expirada. Faca login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("[Auth] User authenticated:", userData.user.id);

    // --- Parse body ---
    let topic: string | undefined;
    let objective: string | undefined;
    let sequenceLength: number | undefined;
    let selectedTypes: string[] | undefined;

    try {
      const body = await req.json();
      console.log("[Input] Raw body:", JSON.stringify(body));
      topic = body.topic;
      objective = body.objective;
      sequenceLength = body.sequenceLength;
      selectedTypes = body.selectedTypes;
    } catch (parseErr) {
      console.error("[Input] JSON parse error:", parseErr);
      return new Response(
        JSON.stringify({ error: "Corpo da requisicao invalido. Envie JSON valido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Validate ---
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatorio ausente: topic" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!objective || typeof objective !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo obrigatorio ausente: objective" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!sequenceLength || typeof sequenceLength !== "number" || sequenceLength < 1 || sequenceLength > 10) {
      return new Response(
        JSON.stringify({ error: "Campo invalido: sequenceLength deve ser numero entre 1 e 10" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!selectedTypes || !Array.isArray(selectedTypes) || selectedTypes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campo invalido: selectedTypes deve ser array nao-vazio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Input] Validated:", { topic: topic.substring(0, 60), objective, sequenceLength, selectedTypes });

    // --- API keys ---
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    // --- Build sequence plan ---
    const baseFlow = objectiveFlows[objective] ?? objectiveFlows.engajar;
    const validTypes = selectedTypes.filter((t) => typeDescriptions[t]);
    
    // Intersect flow with selected types. If intersection is empty, use selected types in order.
    const intersected = baseFlow.filter((t) => validTypes.includes(t));
    const baseSequence = intersected.length >= 3 ? intersected : validTypes;

    if (baseSequence.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum tipo de story valido selecionado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fill to sequenceLength, cycling through base sequence without consecutive repeats
    const typePlan: string[] = [];
    let lastUsed = "";
    for (let i = 0; i < sequenceLength; i++) {
      const available = baseSequence.filter((t) => t !== lastUsed || baseSequence.length === 1);
      const typeId = available[i % available.length];
      typePlan.push(typeId);
      lastUsed = typeId;
    }

    const funnelMap = getFunnelMap(sequenceLength);

    const sequence = typePlan.map((typeId, i) => ({
      position: i + 1,
      typeId,
      role: funnelMap[i + 1]?.role ?? `STORY ${i + 1}`,
      instruction: funnelMap[i + 1]?.instruction ?? "Crie conteudo relevante e impactante.",
      writingStyle: typeWritingInstructions[typeId] ?? "",
    }));

    const objectiveLabel =
      {
        engajar: "ENGAJAR e criar conexao com a audiencia",
        aquecer: "AQUECER a audiencia para uma oferta",
        vender: "VENDER ou converter em cliente",
        caixinha: "RECEBER perguntas no direct",
        direct: "LEVAR para conversacao privada",
        nutrir: "NUTRIR e educar a audiencia",
      }[objective] ?? "engajar";

    // --- No API keys — use templates ---
    if (!lovableKey && !openaiKey) {
      console.warn("[Config] No AI API key. Using template fallbacks.");
      const templateStories = generateTemplateFallbacks(topic.trim(), sequenceLength);
      return new Response(JSON.stringify({ success: true, stories: templateStories }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Generate ALL stories in a single AI call ---
    const { system, user } = buildMasterPrompt(topic.trim(), objectiveLabel, sequence);

    let rawResponse: string | null = null;

    // Attempt 1: Lovable Gateway
    if (lovableKey) {
      try {
        rawResponse = await callLovableAI(lovableKey, system, user);
      } catch (e) {
        console.warn("[AI] Lovable failed:", e instanceof Error ? e.message : e);
      }
    }

    // Attempt 2: OpenAI
    if (!rawResponse && openaiKey) {
      try {
        rawResponse = await callOpenAI(openaiKey, system, user);
      } catch (e) {
        console.warn("[AI] OpenAI failed:", e instanceof Error ? e.message : e);
      }
    }

    // Attempt 3: Template fallbacks
    if (!rawResponse) {
      console.warn("[AI] All AI attempts failed. Using template fallbacks.");
      const templateStories = generateTemplateFallbacks(topic.trim(), sequenceLength);
      return new Response(JSON.stringify({ success: true, stories: templateStories }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse response ---
    let parsed: Array<{ position: number; type: string; content: string }>;
    try {
      parsed = parseAIResponse(rawResponse, sequence);
    } catch (parseErr) {
      console.error("[Parse] Failed to parse AI response:", parseErr, "Raw:", rawResponse.substring(0, 500));
      // Graceful degradation: use templates
      const templateStories = generateTemplateFallbacks(topic.trim(), sequenceLength);
      return new Response(JSON.stringify({ success: true, stories: templateStories }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Build final story objects ---
    const stories = parsed.map((p) => {
      const typeInfo = typeDescriptions[p.type] ?? typeDescriptions.conexao;
      const funnelRole = funnelMap[p.position]?.role ?? "";
      return {
        order: p.position,
        type: p.type,
        typeLabel: typeInfo.label,
        content: p.content,
        tip: `${funnelRole} — ${typeInfo.tip}`,
      };
    });

    console.log(`[generate-story-plan] Done. Generated ${stories.length} stories in a single AI call.`);

    return new Response(JSON.stringify({ success: true, stories }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-story-plan] Unexpected error:", e instanceof Error ? e.message : e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno inesperado", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
