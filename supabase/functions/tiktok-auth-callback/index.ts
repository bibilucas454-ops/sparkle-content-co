import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/crypto.ts";
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

function redirectToApp(path: string): Response {
  const appUrl = Deno.env.get("APP_URL") || "https://sparkle-content-co.lovable.app";
  return new Response(null, {
    status: 302,
    headers: { Location: `${appUrl}${path}`, ...corsHeaders },
  });
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TikTokTokenResponse> {
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY!,
    client_secret: TIKTOK_CLIENT_SECRET!,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: params.toString(),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("[TikTok OAuth] Token exchange failed:", data);
    throw new Error(data.error_description || data.error || "Failed to exchange code for token");
  }

  return data as TikTokTokenResponse;
}

async function getUserInfo(accessToken: string, openId: string) {
  const response = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.warn("[TikTok OAuth] Failed to get user info:", response.status);
    return { display_name: "TikTok User", avatar_url: null };
  }

  const data = await response.json();
  return {
    display_name: data.data?.user?.display_name || "TikTok User",
    avatar_url: data.data?.user?.avatar_url || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("[TikTok OAuth] Error from TikTok:", error);
      return redirectToApp(`/oauth/callback?error=${encodeURIComponent(error)}`);
    }

    if (!code || !stateParam) {
      return redirectToApp("/oauth/callback?error=Parâmetros inválidos");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: stateData, error: stateError } = await supabaseAdmin
      .from("oauth_states")
      .delete()
      .eq("id", stateParam)
      .select()
      .single();

    if (stateError || !stateData) {
      console.error("[TikTok OAuth] Invalid state:", stateParam, stateError);
      return redirectToApp("/oauth/callback?error=Sessão OAuth inválida ou expirada");
    }

    const userId = stateData.user_id;
    const redirectUri = stateData.redirect_uri;
    const callbackUrl = redirectUri || `${Deno.env.get("SUPABASE_URL")}/functions/v1/tiktok-auth-callback`;

    console.log("[TikTok OAuth] Exchanging code for token...", { userId, redirectUri: callbackUrl });

    const tokenData = await exchangeCodeForToken(code, callbackUrl);
    console.log("[TikTok OAuth] Token received:", {
      open_id: tokenData.open_id,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

    const userInfo = await getUserInfo(tokenData.access_token, tokenData.open_id);

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    const refreshExpiresAt = new Date(Date.now() + tokenData.refresh_expires_in * 1000).toISOString();

    const encryptedAccess = await encryptToken(tokenData.access_token);
    const encryptedRefresh = await encryptToken(tokenData.refresh_token);

    const upsertPayload = {
      user_id: userId,
      platform: "tiktok",
      account_name: userInfo.display_name,
      account_id: tokenData.open_id,
      access_token_encrypted: encryptedAccess,
      refresh_token_encrypted: encryptedRefresh,
      expires_at: expiresAt,
      refresh_expires_at: refreshExpiresAt,
      status: "connected",
      last_sync_at: new Date().toISOString(),
      last_error: null,
      last_error_code: null,
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseAdmin
      .from("social_tokens")
      .upsert(upsertPayload, { onConflict: "user_id,platform" });

    if (insertError) {
      console.error("[TikTok OAuth] Database insert error:", insertError);
      await supabaseAdmin.rpc("log_integration_event", {
        p_user_id: userId,
        p_platform: "tiktok",
        p_event_type: "auth_failure",
        p_payload: { error: insertError.message, phase: "database_upsert" }
      });
      return redirectToApp(`/oauth/callback?error=${encodeURIComponent("Erro ao salvar conta: " + insertError.message)}`);
    }

    await supabaseAdmin.rpc("log_integration_event", {
      p_user_id: userId,
      p_platform: "tiktok",
      p_event_type: "auth_success",
      p_payload: { account_name: userInfo.display_name, account_id: tokenData.open_id }
    });

    console.log("[TikTok OAuth] Success! Account connected for user:", userId);
    return redirectToApp(`/oauth/callback?success=true&platform=tiktok`);
  } catch (err) {
    console.error("[TikTok OAuth Callback] CRASH:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return redirectToApp(`/oauth/callback?error=${encodeURIComponent(msg || "Erro no callback OAuth TikTok")}`);
  }
});
