import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------------------------------------------------------------------------
// Type descriptions — no non-Portuguese/non-ASCII characters
// ---------------------------------------------------------------------------
const typeDescriptions: Record<string, { label: string; prompt: string; tip: string }> = {
  conexao: {
    label: "Conexao",
    prompt: `Crie um Story de CONEXAO e HUMANIZACAO. O objetivo e criar proximidade com a audiencia.
Estrutura:
- Apresente-se de forma pessoal
- Compartilhe uma vulnerabilidade ou experiencia real
- Faca conexao emocional com quem le
Tom: pessoal, autentico, acolhedor. ESCREVA APENAS EM PORTUGUES DO BRASIL.`,
    tip: "Humanize e crie identificacao",
  },
  autoridade: {
    label: "Autoridade",
    prompt: `Crie um Story de AUTORIDADE e EXPERTISE. O objetivo e demonstrar conhecimento e credibilidade.
Estrutura:
- Compartilhe uma dica ou insight profissional
- Mostre conhecimento profundo sobre o tema
- Estabeleca autoridade no nicho
Tom: confiante, educativo, profissional. ESCREVA APENAS EM PORTUGUES DO BRASIL.`,
    tip: "Demonstre conhecimento e credibilidade",
  },
  prova: {
    label: "Prova Social",
    prompt: `Crie um Story de PROVA SOCIAL. O objetivo e mostrar resultados e validacao.
Estrutura:
- Compartilhe um resultado ou transformacao real
- Mostre um depoimento ou feedback de cliente
- Evidencie prova concreta
Tom: impactante, comprovado, persuasivo. ESCREVA APENAS EM PORTUGUES DO BRASIL.`,
    tip: "Mostre resultados e validacao",
  },
  bastidor: {
    label: "Bastidor",
    prompt: `Crie um Story de BASTIDOR e PROCESSO. O objetivo e humanizar e mostrar o lado behind-the-scenes.
Estrutura:
- Mostre como voce faz algo no dia a dia
- Revele o processo real, sem filtros
- Humanize sua rotina ou trabalho
Tom: autentico, curioso, revelador. ESCREVA APENAS EM PORTUGUES DO BRASIL.`,
    tip: "Mostre os bastidores",
  },
  enquete: {
    label: "Enquete",
    prompt: `Crie um Story de ENQUETE e INTERACAO. O objetivo e engajar e criar participacao.
Estrutura:
- Faca uma pergunta direta e envolvente
- Ofereça opcoes claras de resposta
- Crie curiosidade sobre o resultado
Tom: interativo, curioso, divertido. ESCREVA APENAS EM PORTUGUES DO BRASIL.`,
    tip: "Interaja com sua audiencia",
  },
  objecao: {
    label: "Objecao",
    prompt: `Crie um Story de OBJECAO e RESPOSTA. O objetivo e responder duvidas e objecoes comuns.
Estrutura:
- Identifique uma objecao frequente do seu publico
- Responda de forma clara e direta
- Desarme a resistencia com argumento solido
Tom: prestativo, persuasivo, solucionador. ESCREVA APENAS EM PORTUGUES DO BRASIL.`,
    tip: "Responda duvidas e objecoes",
  },
  cta: {
    label: "CTA",
    prompt: `Crie um Story de CALL TO ACTION (CHAMADA PARA ACAO). O objetivo e levar a audiencia ao proximo passo.
Estrutura:
- Crie urgencia ou desejo genuino
- Diga exatamente o que a pessoa deve fazer agora
- Facilite a acao (link, direct, swipe up, etc)
Tom: direto, urgente, orientado a acao. ESCREVA APENAS EM PORTUGUES DO BRASIL.`,
    tip: "Chame para acao",
  },
};

const objectiveFlows: Record<string, string[]> = {
  engajar: ["conexao", "enquete", "bastidor", "prova", "autoridade"],
  aquecer: ["conexao", "autoridade", "bastidor", "prova", "objecao"],
  vender: ["conexao", "prova", "autoridade", "objecao", "cta"],
  caixinha: ["conexao", "enquete", "bastidor", "objecao", "cta"],
  direct: ["conexao", "prova", "cta", "bastidor", "cta"],
  nutrir: ["conexao", "autoridade", "bastidor", "prova", "enquete"],
};

// ---------------------------------------------------------------------------
// Unique template fallbacks — used when no API key is available or AI fails
// ---------------------------------------------------------------------------
const templateFallbacks: Record<string, (topic: string) => string> = {
  conexao: (t) =>
    `Posso te contar uma coisa? ${t} e algo que tambem me desafiou muito. Mas aprendi que a chave e [insight]. Voce ja passou por isso? Me conta nos comentarios!`,
  autoridade: (t) =>
    `Uma coisa que me levou anos para aprender sobre ${t}: [dica profissional]. E isso muda tudo. Salva esse story!`,
  prova: (t) =>
    `Resultado real de um cliente sobre ${t}: antes era [problema]. Depois: [resultado]. Isso e possivel para voce tambem.`,
  bastidor: (t) =>
    `Por tras das cameras: como eu realmente trabalho com ${t} no dia a dia. Sem filtros, sem perfeccao — so processo real.`,
  enquete: (t) =>
    `Pergunta rapida sobre ${t}: voce prefere [opcao A] ou [opcao B]? Responde ali em cima. Vou revelar o resultado amanha!`,
  objecao: (t) =>
    `"Mas e se nao funcionar para mim?" — A duvida mais comum sobre ${t}. A resposta honesta: [resposta direta]. Simples assim.`,
  cta: (t) =>
    `Pronto para transformar sua relacao com ${t}? Manda um direct agora com a palavra QUERO e eu te envio os proximos passos. Soa bem?`,
};

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
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.8,
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
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.8,
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
// Generate one story: try Lovable → try OpenAI → fallback template
// ---------------------------------------------------------------------------
async function generateStoryContent(
  topic: string,
  typeId: string,
  typeInfo: { label: string; prompt: string; tip: string },
  objectiveLabel: string,
  order: number,
  total: number,
  lovableKey: string | undefined,
  openaiKey: string | undefined,
  previousContents: string[] = []
): Promise<string> {
  const isFirst = order === 1;
  const isLast = order === total;
  const progressPosition = isFirst ? "ABERTURA" : isLast ? "FECHAMENTO" : "DESENVOLVIMENTO";
  
  let diversityInstruction = "";
  if (previousContents.length > 0) {
    const prevSample = previousContents.slice(-2).join(" | ");
    diversityInstruction = `\nIMPORTANTE: Este story DEVE ser DIFERENTE dos anteriores. Evite repetição de palavras, frases ou estrutura. Anterior: "${prevSample}"`;
  }

  const systemPrompt = `Voce e um especialista em criacao de conteudo para Instagram Stories. Voce entende de funis de conteudo, engajamento e conversao. Crie stories estrategicos e impactantes com DIVERSIDADE e PROGRESSAO. TODO conteudo DEVE ser em Portugues do Brasil. IMPORTANTE: Cada story deve ser UNICO e COMPLEMENTAR ao anterior.`;

  const userPrompt = `${typeInfo.prompt}

Tema geral: "${topic}"
Objetivo da sequencia: ${objectiveLabel}
Posicao na sequencia: Story ${order} de ${total} (${progressPosition})${diversityInstruction}

Gera APENAS o conteudo do story — de 1 a 3 frases curtas, diretas e impactantes. Sem titulos, sem explicacoes extras. Cada story deve ser unico e progredir na narrativa.`;

  // Attempt 1: Lovable Gateway
  if (lovableKey) {
    try {
      return await callLovableAI(lovableKey, systemPrompt, userPrompt);
    } catch (e) {
      console.warn("[AI] Lovable failed, trying OpenAI:", e instanceof Error ? e.message : e);
    }
  }

  // Attempt 2: OpenAI direct
  if (openaiKey) {
    try {
      return await callOpenAI(openaiKey, systemPrompt, userPrompt);
    } catch (e) {
      console.warn("[AI] OpenAI failed, using template:", e instanceof Error ? e.message : e);
    }
  }

  // Attempt 3: Template fallback (always succeeds)
  console.log(`[AI] Using template fallback for type: ${typeId}`);
  const fallbackFn = templateFallbacks[typeId] ?? templateFallbacks.conexao;
  return fallbackFn(topic);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[generate-story-plan] Request received:", req.method, new Date().toISOString());

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[Auth] Token ausente ou invalido");
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
      console.error("[Auth] Sessao invalida:", userError?.message);
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

    // --- Validate required fields ---
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
        JSON.stringify({ error: "Campo obrigatorio invalido: sequenceLength (deve ser numero entre 1 e 10)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!selectedTypes || !Array.isArray(selectedTypes) || selectedTypes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatorio invalido: selectedTypes (deve ser array nao-vazio)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Input] Validated:", { topic: topic.substring(0, 50), objective, sequenceLength, selectedTypes });

    // --- API keys (optional — falls back to templates if absent) ---
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!lovableKey && !openaiKey) {
      console.warn("[Config] No AI API key found. Will use template fallbacks for all stories.");
    } else {
      console.log("[Config] API keys:", { lovable: !!lovableKey, openai: !!openaiKey });
    }

    // --- Build sequence ---
    const flow = objectiveFlows[objective] ?? objectiveFlows.engajar;
    const validSelectedTypes = selectedTypes.filter((t) => typeDescriptions[t]);
    const orderedTypes = flow.filter((t) => validSelectedTypes.includes(t));
    const finalTypes = orderedTypes.length > 0 ? orderedTypes : validSelectedTypes;

    if (finalTypes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum tipo de story valido selecionado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const objectiveLabel =
      {
        engajar: "ENGAJAR e criar conexao",
        aquecer: "AQUECER a audiencia para uma oferta",
        vender: "VENDER ou converter",
        caixinha: "RECEBER perguntas no direct",
        direct: "LEVAR para conversacao privada",
        nutrir: "NUTRIR e educar a audiencia",
      }[objective] ?? "engajar";

    // --- Generate stories ---
    const stories: Array<{
      order: number;
      type: string;
      typeLabel: string;
      content: string;
      tip?: string;
    }> = [];

    const previousContents: string[] = [];
    const usedTypes: string[] = [];

    for (let i = 0; i < sequenceLength; i++) {
      let typeId: string;
      
      if (i < finalTypes.length) {
        typeId = finalTypes[i];
      } else {
        const availableTypes = finalTypes.filter(t => !usedTypes.includes(t));
        if (availableTypes.length > 0) {
          typeId = availableTypes[i % availableTypes.length];
        } else {
          usedTypes.length = 0;
          typeId = finalTypes[i % finalTypes.length];
        }
      }
      
      usedTypes.push(typeId);
      const typeInfo = typeDescriptions[typeId];

      if (!typeInfo) {
        console.warn(`[Gen] Unknown typeId: ${typeId}, skipping`);
        continue;
      }

      console.log(`[Gen] Generating story ${i + 1}/${sequenceLength} — type: ${typeId}`);

      const content = await generateStoryContent(
        topic.trim(),
        typeId,
        typeInfo,
        objectiveLabel,
        i + 1,
        sequenceLength,
        lovableKey,
        openaiKey,
        previousContents
      );

      previousContents.push(content);

      stories.push({
        order: i + 1,
        type: typeId,
        typeLabel: typeInfo.label,
        content,
        tip: typeInfo.tip,
      });
    }

    console.log(`[generate-story-plan] Done. Generated ${stories.length} stories.`);

    return new Response(JSON.stringify({ success: true, stories }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-story-plan] Unexpected error:", e instanceof Error ? e.message : e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro interno inesperado",
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
