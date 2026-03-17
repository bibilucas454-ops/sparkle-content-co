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

    const { data: accounts, error } = await supabaseAdmin.from("social_accounts").select("*");
    if (error) return new Response(error.message, { status: 500 });

    let migrated = 0;
    for (const acc of accounts) {
      // Very basic check to try and prevent double encryption (AES output is base64 and longer than typical oauth tokens but doesn't have a specific header. If it decrypts cleanly it might be encrypted, but if it throws or returns same string it's plain text)
      const testAccess = acc.access_token_encrypted;
      let alreadyEncrypted = false;
      try {
         // Attempt to decrypt it. If it successfully decrypts to something different or the same length, but throws otherwise. Our decrypt function catches and returns the original if it fails.
         const res = await decryptToken(testAccess);
         if (res !== testAccess) alreadyEncrypted = true; 
      } catch (e) {}

      if (!alreadyEncrypted) {
         const encAccess = await encryptToken(acc.access_token_encrypted);
         const encRefresh = acc.refresh_token_encrypted ? await encryptToken(acc.refresh_token_encrypted) : null;

         await supabaseAdmin.from("social_accounts").update({
            access_token_encrypted: encAccess,
            refresh_token_encrypted: encRefresh
         }).eq("id", acc.id);
         migrated++;
      }
    }
    
    return new Response(`Migrated ${migrated} accounts to AES-GCM.`, { status: 200 });
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
    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Token inválido ou malformatado" }), {
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
          error: `Credencial ausente: ${config.clientIdEnv}. Configure nas variáveis de ambiente do Supabase.`,
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
      console.error("Error creating oauth state:", stateError);
      return new Response(JSON.stringify({ error: "Erro ao gerar estado seguro para autenticação." }), {
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
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
