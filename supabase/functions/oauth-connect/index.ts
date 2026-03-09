import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Platform OAuth configurations
const PLATFORM_CONFIG: Record<string, {
  authUrl: string;
  scopes: string;
  clientIdEnv: string;
  clientSecretEnv: string;
}> = {
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile",
    clientIdEnv: "YOUTUBE_CLIENT_ID",
    clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
  },
  instagram: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    scopes: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scopes: "user.info.basic,video.publish,video.upload",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { platform, redirectUri } = await req.json();

    if (!platform || !PLATFORM_CONFIG[platform]) {
      return new Response(JSON.stringify({ error: "Plataforma inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = PLATFORM_CONFIG[platform];
    const clientId = Deno.env.get(config.clientIdEnv);

    if (!clientId) {
      return new Response(
        JSON.stringify({
          error: `Credencial ausente: ${config.clientIdEnv}. Configure nas variáveis de ambiente do Supabase.`,
          missingSecret: config.clientIdEnv,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build state param with user info
    const state = btoa(JSON.stringify({ userId, platform, ts: Date.now() }));

    // Build OAuth URL per platform
    let authorizationUrl: string;
    const callbackUrl = redirectUri || `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`;

    if (platform === "youtube") {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: config.scopes,
        access_type: "offline",
        prompt: "consent",
        state,
      });
      authorizationUrl = `${config.authUrl}?${params.toString()}`;
    } else if (platform === "instagram") {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: config.scopes,
        state,
      });
      authorizationUrl = `${config.authUrl}?${params.toString()}`;
    } else {
      // TikTok
      const params = new URLSearchParams({
        client_key: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: config.scopes,
        state,
      });
      authorizationUrl = `${config.authUrl}?${params.toString()}`;
    }

    return new Response(
      JSON.stringify({ url: authorizationUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
