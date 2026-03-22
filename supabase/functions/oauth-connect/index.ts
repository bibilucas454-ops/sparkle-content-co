import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, decryptToken } from "../_shared/crypto.ts";

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
    scopes: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management",
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

    // --- Main OAuth logic ---
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
      return new Response(JSON.stringify({ error: "Token inválido", details: e.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          error: `Credencial ausente: ${config.clientIdEnv}.`,
          missingSecret: config.clientIdEnv,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callbackUrl = redirectUri || `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`;

    // Build state param with user info
    // Generate state in DB to prevent CSRF / State tampering
    const { data: stateData, error: stateError } = await supabase
      .from("oauth_states")
      .insert({
        user_id: userId,
        platform,
        redirect_uri: callbackUrl,
      })
      .select("id")
      .single();

    if (stateError || !stateData) {
      console.error("[OAuth Connect] Error creating state:", stateError);
      return new Response(JSON.stringify({ error: "Erro ao gerar estado seguro.", details: stateError?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const state = stateData.id;

    // Build OAuth URL per platform
    let authorizationUrl: string;

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
    console.error(`[OAuth Connect] GLOBAL CRASH:`, err);
    return new Response(
      JSON.stringify({ 
        error: "Exceção inesperada na Edge Function", 
        message: err.message,
        stack: err.stack 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
