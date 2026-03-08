import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const typePrompts: Record<string, string> = {
  "viral-idea": "Generate 3 viral content ideas. Each idea should be creative, attention-grabbing, and optimized for short-form video. Format as a numbered list.",
  "script": "Write a complete short-form video script (30-60 seconds). Include: Hook (first 3 seconds), Build-up, Main point, Call-to-action. Use conversational tone.",
  "caption": "Write a caption using the AIDA framework: Attention (hook line), Interest (why they should care), Desire (paint the picture), Action (clear CTA). Include relevant emojis.",
  "hashtags": "Generate 20 strategic hashtags. Mix: 5 high-volume (1M+), 10 medium (100K-1M), 5 niche/specific. Format as a single line separated by spaces.",
  "tags": "Generate 15 relevant tags/keywords for SEO optimization. Include: primary keywords, secondary keywords, and long-tail variations. Format as comma-separated list.",
  "video-prompt": "Create a detailed AI video generation prompt. Include: visual style, camera angles, transitions, text overlays, music mood, color grading. Be specific and cinematic.",
  "viral-score": "Analyze the viral potential of this content topic. Rate from 0-100 and explain: Hook strength, Shareability, Trend alignment, Emotional trigger, Uniqueness. Format with scores for each category.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, platform, types } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const results = [];

    for (const type of types) {
      const systemPrompt = `You are a viral content strategist specializing in ${platform}. You understand algorithms, trends, and what makes content go viral. Be specific, actionable, and creative. Never be generic.`;
      const userPrompt = `Topic: "${topic}" for ${platform}.\n\n${typePrompts[type] || "Generate creative content for this topic."}`;

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
