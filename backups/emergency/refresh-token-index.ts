import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, decryptToken } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { platform, userId: bodyUserId } = await req.json();
    
    // Use the userId from body if it's an internal call (service role) or from token
    const targetUserId = bodyUserId || userId;

    const { data: account } = await supabaseAdmin
      .from("social_tokens")
      .select("*")
      .eq("platform", platform)
      .eq("user_id", targetUserId)
      .single();

    if (!account || !account.refresh_token_encrypted) {
      return new Response(JSON.stringify({ error: "Conta não encontrada ou sem refresh token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let tokenData: any;

    if (platform === "youtube") {
      const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
      const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");
      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ error: "Credenciais YouTube não configuradas" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: await decryptToken(account.refresh_token_encrypted),
          grant_type: "refresh_token",
        }),
      });
      tokenData = await res.json();
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
    } else if (platform === "tiktok") {
      const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
      const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");
      if (!clientKey || !clientSecret) {
        return new Response(JSON.stringify({ error: "Credenciais TikTok não configuradas" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          refresh_token: await decryptToken(account.refresh_token_encrypted),
          grant_type: "refresh_token",
        }),
      });
      tokenData = await res.json();
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
    } else if (platform === "instagram") {
      // Instagram long-lived tokens can be refreshed
      const res = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get("INSTAGRAM_CLIENT_ID")}&client_secret=${Deno.env.get("INSTAGRAM_CLIENT_SECRET")}&fb_exchange_token=${await decryptToken(account.access_token_encrypted)}`
      );
      tokenData = await res.json();
      if (tokenData.error) throw new Error(tokenData.error.message);
      tokenData.refresh_token = tokenData.access_token;
    } else {
      return new Response(JSON.stringify({ error: "Plataforma não suportada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin.from("social_tokens").update({
      access_token_encrypted: await encryptToken(tokenData.access_token),
      refresh_token_encrypted: tokenData.refresh_token 
        ? await encryptToken(tokenData.refresh_token) 
        : account.refresh_token_encrypted,
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      last_refreshed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", account.id);

    return new Response(JSON.stringify({ success: true, message: "Token atualizado com sucesso" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Erro ao atualizar token" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
