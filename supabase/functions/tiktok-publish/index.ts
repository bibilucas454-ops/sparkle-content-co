import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../_shared/crypto.ts";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

const TIKTOK_DIRECT_POST = "https://open.tiktokapis.com/v2/post/publish/content/init/";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      return jsonResponse({ error: "Token inválido" }, 401);
    }

    const { 
      video_url, 
      title, 
      description,
      privacy_level = "PUBLIC",
      disable_comments = false,
      disable_duet = false,
      disable_stitch = false,
      video_id 
    } = await req.json();

    if (!video_url && !video_id) {
      return jsonResponse({ error: "video_url ou video_id é obrigatório" }, 400);
    }

    const { data: tokenData, error: fetchError } = await supabaseAdmin
      .from("social_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", "tiktok")
      .single();

    if (fetchError || !tokenData) {
      return jsonResponse({ error: "Conta TikTok não conectada" }, 404);
    }

    const accessToken = await decryptToken(tokenData.access_token_encrypted);

    console.log("[TikTok Direct Post] Publishing...", { video_url, title });

    const postBody: Record<string, unknown> = {
      source_info: {
        source: video_url ? "PULL_FROM_URL" : "VIDEO_ID",
        video_url: video_url,
        video_id: video_id,
      },
      title: title || description || "",
      privacy_level,
      disable_comments,
      disable_duet,
      disable_stitch,
    };

    const response = await fetch(TIKTOK_DIRECT_POST, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(postBody),
    });

    const data = await response.json();
    console.log("[TikTok Direct Post] Response:", JSON.stringify(data));

    if (!response.ok) {
      console.error("[TikTok Direct Post] Failed:", data);
      return jsonResponse({
        error: "Falha ao publicar",
        details: data.error,
      }, response.status);
    }

    const publishId = data.data?.publish_id;
    console.log("[TikTok Direct Post] Success! publish_id:", publishId);

    return jsonResponse({
      success: true,
      publish_id: publishId,
      status: "published",
      message: "Vídeo publicado com sucesso!"
    });
  } catch (err) {
    console.error("[TikTok Direct Post] CRASH:", err);
    return jsonResponse({ error: "Erro inesperado", message: (err as Error).message }, 500);
  }
});
