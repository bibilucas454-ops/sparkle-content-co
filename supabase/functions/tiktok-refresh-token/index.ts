import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, decryptToken } from "../_shared/crypto.ts";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_CLIENT_KEY = Deno.env.get("TIKTOK_CLIENT_KEY");
const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET");

interface TikTokTokenResponse {
  open_id: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  scope: string;
  token_type: string;
}

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

    const { data: tokenData, error: fetchError } = await supabaseAdmin
      .from("social_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", "tiktok")
      .single();

    if (fetchError || !tokenData) {
      return jsonResponse({ error: "Conta TikTok não encontrada" }, 404);
    }

    const currentRefreshToken = await decryptToken(tokenData.refresh_token_encrypted);
    const currentAccessToken = await decryptToken(tokenData.access_token_encrypted);

    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY!,
      client_secret: TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: currentRefreshToken,
    });

    console.log("[TikTok Refresh] Refreshing token for user:", userId);

    const response = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[TikTok Refresh] Failed:", data);
      
      await supabaseAdmin.from("social_tokens").update({
        status: "error",
        last_error: data.error_description || data.error,
        last_error_code: data.error,
      }).eq("id", tokenData.id);

      return jsonResponse({ 
        error: "Falha ao refresh token", 
        details: data.error_description || data.error 
      }, 400);
    }

    const newTokenData = data as TikTokTokenResponse;
    console.log("[TikTok Refresh] Success! New access_token received");

    const newAccessEncrypted = await encryptToken(newTokenData.access_token);
    const newRefreshEncrypted = await encryptToken(newTokenData.refresh_token);
    const expiresAt = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();
    const refreshExpiresAt = new Date(Date.now() + newTokenData.refresh_expires_in * 1000).toISOString();

    await supabaseAdmin.from("social_tokens").update({
      access_token_encrypted: newAccessEncrypted,
      refresh_token_encrypted: newRefreshEncrypted,
      expires_at: expiresAt,
      refresh_expires_at: refreshExpiresAt,
      last_sync_at: new Date().toISOString(),
      status: "connected",
      last_error: null,
      last_error_code: null,
    }).eq("id", tokenData.id);

    return jsonResponse({ 
      success: true, 
      expires_at: expiresAt,
      message: "Token refreshed successfully" 
    });
  } catch (err) {
    console.error("[TikTok Refresh] CRASH:", err);
    return jsonResponse({ error: "Erro inesperado", message: (err as Error).message }, 500);
  }
});
