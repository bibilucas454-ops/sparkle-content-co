import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const typeDescriptions: Record<string, { label: string; prompt: string; tip: string }> = {
  conexao: {
    label: "Conexão",
    prompt: `Crie um Story de CONEXÃO/HUMANIZAÇÃO. O objetivo é criar proximidade com a audiência.
Estrutura:
- Apresente-se de forma pessoal
- Compartilhe uma vulnerabilidade ou experiência
- Faça conexão emocional
Tom: pessoal, autêntico, acolhedor. EM PORTUGUÊS DO BRASIL.`,
    tip: "Humanize e crie identificação"
  },
  autoridade: {
    label: "Autoridade",
    prompt: `Crie um Story de AUTORIDADE/EXPERTISE. O objetivo é demonstrar conhecimento e credibilidade.
Estrutura:
- Compartilhe uma dica ou insight profissional
- Mostre conhecimento profundo
- Estabeleça autoridade no nicho
Tom: confiante, educativo, profissional. EM PORTUGUÊS DO BRASIL.`,
    tip: "Demonstre conhecimento e credibilidade"
  },
  prova: {
    label: "Prova Social",
    prompt: `Crie um Story de PROVA SOCIAL. O objetivo é mostrar resultados e validação.
Estrutura:
- Compartilhe um resultado ou transformação
- Mostre depoimento ou feedback
- Evidencie prova concreta
Tom: impactante, comprovado, persuasivo. EM PORTUGUÊS DO BRASIL.`,
    tip: "Mostre resultados e validação"
  },
  bastidor: {
    label: "Bastidor",
    prompt: `Crie um Story de BASTIDOR/PROCESSO. O objetivo é humanizar e mostrar o lado behind-the-scenes.
Estrutura:
- Mostre como você faz algo
- Revele o processo
- Humanize sua rotina ou trabalho
Tom: autêntico,好奇, revelador. EM PORTUGUÊS DO BRASIL.`,
    tip: "Mostre os por trás das câmeras"
  },
  enquete: {
    label: "Enquete",
    prompt: `Crie um Story de ENQUETE/INTERAÇÃO. O objetivo é engajar e criar互动.
Estrutura:
- Faça uma pergunta direta
- Ofereça opções de resposta
- Crie curiosidade sobre o resultado
Tom: interativo, curioso, divertido. EM PORTUGUÊS DO BRASIL.`,
    tip: "Interaja com sua audiência"
  },
  objecao: {
    label: "Objeção",
    prompt: `Crie um Story de OBJEÇÃO/RESPOSTA. O objetivo é responder dúvidas e objeções comuns.
Estrutura:
- Identifique uma objeção frequente
- Responda de forma clara
- Desarme a resistência
Tom: prestativo, убедительный, solucionador. EM PORTUGUÊS DO BRASIL.`,
    tip: "Responda dúvidas e objeções"
  },
  cta: {
    label: "CTA",
    prompt: `Crie um Story de CALL TO ACTION (CHAMADA PARA AÇÃO). O objetivo é levar a audiência para próximo passo.
Estrutura:
- Crie urgência ou desejo
- Diga exatamente o que fazer
- Facilite a ação (link, direct, etc)
Tom: direto, urgent, ação. EM PORTUGUÊS DO BRASIL.`,
    tip: "Chame para ação"
  },
};

const objectiveFlows: Record<string, string[]> = {
  engajar: ["conexao", "enquete", "bastidor", "prova", "autoridade"],
  aquecer: ["conexao", "autoridade", "bastidor", "prova", "objecao"],
  vender: ["conexao", "prova", "autoridade", "objecao", "cta"],
  caixinha: ["conexao", "enquete", "bastidor", "pergunta", "cta"],
  direct: ["conexao", "prova", "cta", "bastidor", "cta"],
  nutrir: ["conexao", "autoridade", "bastidor", "prova", "enquete"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Acesso negado. Token ausente ou inválido." }), {
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
      return new Response(JSON.stringify({ error: "Sessão expirada. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, objective, sequenceLength, selectedTypes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Erro de infraestrutura: LOVABLE_API_KEY não configurada.");
    }

    const flow = objectiveFlows[objective] || objectiveFlows.engajar;
    const orderedTypes = flow.filter(t => selectedTypes.includes(t));
    const finalTypes = orderedTypes.length > 0 ? orderedTypes : selectedTypes.slice(0, sequenceLength);
    
    const stories: Array<{ order: number; type: string; typeLabel: string; content: string; tip?: string }> = [];
    
    let typeIndex = 0;
    for (let i = 0; i < sequenceLength; i++) {
      const typeId = finalTypes[typeIndex % finalTypes.length];
      const typeInfo = typeDescriptions[typeId];
      
      if (!typeInfo) {
        typeIndex++;
        continue;
      }

      const systemPrompt = `Você é um especialista em criação de conteúdo para Instagram Stories. Você entende de funis de conteúdo, engajamento e conversão. Crie stories estratégicos que sigam a lógica de funil. TODO conteúdo DEVE ser em Português do Brasil.`;
      
      const objectiveLabel = {
        engajar: "ENGAJAR e criar conexão",
        aquecer: "AQUECER a audiência para uma oferta",
        vender: "VENDER ou converter",
        caixinha: "RECEBER perguntas no direct",
        direct: "LEVAR para conversação privada",
        nutrir: "NUTRIR e educar a audiência"
      }[objective] || "engajar";

      const userPrompt = `${typeInfo.prompt}

Tema geral: "${topic}"
Objetivo da sequência: ${objectiveLabel}
Ordem na sequência: ${i + 1} de ${sequenceLength}

Formato: 1080x1920 (Stories - Proporção 9:16)

Story #${i + 1} - ${typeInfo.label}:
Gere apenas o conteúdo deste story (1-3 frases curtas, impactantes).`;

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
                name: "return_story",
                description: "Retorne o story gerado",
                parameters: {
                  type: "object",
                  properties: {
                    content: { type: "string", description: "O conteúdo do story gerado" },
                  },
                  required: ["content"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_story" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI error:", response.status, errText);
        stories.push({
          order: i + 1,
          type: typeId,
          typeLabel: typeInfo.label,
          content: `[Story de ${typeInfo.label} sobre ${topic}]`,
          tip: typeInfo.tip,
        });
      } else {
        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        
        if (toolCall) {
          const parsed = JSON.parse(toolCall.function.arguments);
          stories.push({
            order: i + 1,
            type: typeId,
            typeLabel: typeInfo.label,
            content: parsed.content,
            tip: typeInfo.tip,
          });
        } else {
          stories.push({
            order: i + 1,
            type: typeId,
            typeLabel: typeInfo.label,
            content: data.choices?.[0]?.message?.content || `[Story de ${typeInfo.label}]`,
            tip: typeInfo.tip,
          });
        }
      }
      
      typeIndex++;
    }

    return new Response(JSON.stringify({ stories }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-story-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
