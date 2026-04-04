import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../_shared/crypto.ts";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

const TIKTOK_UPLOAD_INIT = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";

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

    const { video_url, title, privacy_level, allow_comments, allow_duet } = await req.json();

    if (!video_url) {
      return jsonResponse({ error: "video_url é obrigatório" }, 400);
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

    console.log("[TikTok Upload] Initializing upload...", { video_url, title });

    const initBody: Record<string, unknown> = {
      source_info: {
        source: "PULL_FROM_URL",
        video_url: video_url,
      },
      title: title || "",
      privacy_level: privacy_level || "PUBLIC",
    };

    if (allow_comments !== undefined) {
      initBody.disable_comments = !allow_comments;
    }
    if (allow_duet !== undefined) {
      initBody.disable_duet = !allow_duet;
    }

    const response = await fetch(TIKTOK_UPLOAD_INIT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(initBody),
    });

    const data = await response.json();
    console.log("[TikTok Upload] Init response:", JSON.stringify(data));

    if (!response.ok) {
      console.error("[TikTok Upload] Failed:", data);
      
      await supabaseAdmin.from("social_tokens").update({
        last_error: data.error?.message || "Upload failed",
        last_error_code: data.error?.code,
      }).eq("id", tokenData.id);

      return jsonResponse({
        error: "Falha ao inicializar upload",
        details: data.error,
      }, response.status);
    }

    const publishId = data.data?.publish_id;
    console.log("[TikTok Upload] Success! publish_id:", publishId);

    return jsonResponse({
      success: true,
      publish_id: publishId,
      status: "uploaded",
      message: "Vídeo enviado para TikTok. Aguarde processamento."
    });
  } catch (err) {
    console.error("[TikTok Upload] CRASH:", err);
    return jsonResponse({ error: "Erro inesperado", message: (err as Error).message }, 500);
  }
});
