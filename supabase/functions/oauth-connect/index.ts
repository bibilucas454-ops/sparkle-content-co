import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, decryptToken } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-auth-token",
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
    scopes:
      "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile",
    clientIdEnv: "YOUTUBE_CLIENT_ID",
    clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
  },
  instagram: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    scopes: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scopes: "user.info.basic,video.upload",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Ad hoc endpoint: Encrypt existing tokens to migrate old data
  if (new URL(req.url).pathname.endsWith("encrypt-migrator")) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: accounts, error } = await supabaseAdmin.from("social_tokens").select("*");
    if (error) return new Response(error.message, { status: 500 });

    let migrated = 0;
    for (const acc of accounts) {
      const testAccess = acc.access_token_encrypted;
      let alreadyEncrypted = false;
      try {
         const res = await decryptToken(testAccess);
         if (res !== testAccess) alreadyEncrypted = true; 
      } catch (e) {}

      if (!alreadyEncrypted) {
         const encAccess = await encryptToken(acc.access_token_encrypted);
         const encRefresh = acc.refresh_token_encrypted ? await encryptToken(acc.refresh_token_encrypted) : null;

         await supabaseAdmin.from("social_tokens").update({
            access_token_encrypted: encAccess,
            refresh_token_encrypted: encRefresh
         }).eq("id", acc.id);
         migrated++;
      }
    }
    return new Response(`Migrated ${migrated} accounts to AES-GCM.`, { status: 200 });
  }

  let platform: string | undefined;

  try {
    // 1. JWT Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[OAuth Connect] Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Sessão expirada. Faça login novamente." }), {
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
      console.error("[OAuth Connect] Failed to parse JWT payload:", e.message);
      return new Response(JSON.stringify({ error: "Token de acesso inválido. Reconecte ao app." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse Payload
    const body = await req.json().catch(() => ({}));
    platform = body.platform;
    const redirectUri = body.redirectUri;
    console.log(`[OAuth Connect] Request for ${platform} by user ${userId}`);

    if (!platform || !PLATFORM_CONFIG[platform]) {
      return new Response(JSON.stringify({ error: `Plataforma '${platform}' não suportada.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = PLATFORM_CONFIG[platform];
    const clientId = Deno.env.get(config.clientIdEnv);

    if (!clientId) {
      console.error(`[OAuth Connect] Missing env var: ${config.clientIdEnv}`);
      return new Response(
        JSON.stringify({
          error: `Configuração ausente no Supabase: ${config.clientIdEnv}.`,
          missingSecret: config.clientIdEnv,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Resolve Redirect URI
    const callbackUrl = redirectUri || Deno.env.get("TIKTOK_REDIRECT_URI") || `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`;
    console.log(`[OAuth Connect] Using Redirect URI: ${callbackUrl}`);

    // 4. Generate State
    const { data: stateData, error: stateError } = await supabase
      .from("oauth_states")
      .insert({ user_id: userId, platform, redirect_uri: callbackUrl })
      .select("id")
      .single();

    if (stateError || !stateData) {
      console.error("[OAuth Connect] DB Error generating state:", stateError);
      return new Response(JSON.stringify({ error: "Erro ao iniciar sessão segura de autenticação. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const state = stateData.id;

    // 5. Build Authorization URL
    let authorizationUrl: string;
    const commonParams = { response_type: "code", state };

    if (platform === "youtube") {
      const params = new URLSearchParams({
        ...commonParams,
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: config.scopes,
        access_type: "offline",
        prompt: "consent",
      });
      authorizationUrl = `${config.authUrl}?${params.toString()}`;
    } else if (platform === "instagram") {
      const params = new URLSearchParams({
        ...commonParams,
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: config.scopes,
      });
      authorizationUrl = `${config.authUrl}?${params.toString()}`;
    } else {
      // TikTok
      const params = new URLSearchParams({
        ...commonParams,
        client_key: clientId,
        redirect_uri: callbackUrl,
        scope: config.scopes,
      });
      authorizationUrl = `${config.authUrl}?${params.toString()}`;
    }

    console.log(`[OAuth Connect] Redirecting user to: ${authorizationUrl}`);
    return new Response(JSON.stringify({ url: authorizationUrl }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err: any) {
    console.error("[OAuth Connect] Fatal Exception:", err.message);
    return new Response(JSON.stringify({ 
      error: "Erro interno no servidor de autenticação.", 
      details: err.message,
      debug: {
        platform: platform || "unknown",
        hasKey: platform ? !!Deno.env.get(PLATFORM_CONFIG[platform]?.clientIdEnv || "") : false,
        dbError: !!err.code, 
        stack: err.stack?.split('\n')[0]
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
