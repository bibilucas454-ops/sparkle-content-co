import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../_shared/crypto.ts";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

const TIKTOK_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/video/info/";

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

    const { publish_id } = await req.json();
    if (!publish_id) {
      return jsonResponse({ error: "publish_id é obrigatório" }, 400);
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

    console.log("[TikTok Status] Checking publish_id:", publish_id);

    const response = await fetch(`${TIKTOK_STATUS_URL}?publish_id=${publish_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log("[TikTok Status] Response:", JSON.stringify(data));

    if (!response.ok) {
      return jsonResponse({
        error: "Falha ao verificar status",
        details: data.error,
      }, response.status);
    }

    const status = data.data?.status;
    return jsonResponse({
      success: true,
      publish_id,
      status,
      details: data.data,
    });
  } catch (err) {
    console.error("[TikTok Status] CRASH:", err);
    return jsonResponse({ error: "Erro inesperado", message: (err as Error).message }, 500);
  }
});
