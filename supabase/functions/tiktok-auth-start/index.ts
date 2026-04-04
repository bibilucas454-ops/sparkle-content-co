import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, decryptToken } from "../_shared/crypto.ts";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_CLIENT_KEY = Deno.env.get("TIKTOK_CLIENT_KEY");
const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET");

const TIKTOK_SCOPES = [
  "user.info.basic",
  "video.upload",
  "video.publish"
].join(",");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      return jsonResponse({ error: "Token inválido" }, 401);
    }

    const { redirectUri } = await req.json();
    const callbackUrl = redirectUri || `${Deno.env.get("SUPABASE_URL")}/functions/v1/tiktok-auth-callback`;

    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
      return jsonResponse({
        error: "Credenciais TikTok não configuradas",
        missing: {
          client_key: !TIKTOK_CLIENT_KEY,
          client_secret: !TIKTOK_CLIENT_SECRET
        }
      }, 400);
    }

    const { data: stateData, error: stateError } = await supabase
      .from("oauth_states")
      .insert({
        user_id: userId,
        platform: "tiktok",
        redirect_uri: callbackUrl,
      })
      .select("id")
      .single();

    if (stateError || !stateData) {
      console.error("[TikTok Auth] Error creating state:", stateError);
      return jsonResponse({ error: "Erro ao gerar estado OAuth", details: stateError?.message }, 500);
    }

    const state = stateData.id;

    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: TIKTOK_SCOPES,
      state: state,
    });

    const authUrl = `${TIKTOK_AUTH_URL}?${params.toString()}`;
    console.log("[TikTok Auth] Generated auth URL:", authUrl);

    return jsonResponse({ url: authUrl, state });
  } catch (err) {
    console.error("[TikTok Auth Start] GLOBAL CRASH:", err);
    return jsonResponse({ error: "Erro inesperado", message: err.message }, 500);
  }
});
