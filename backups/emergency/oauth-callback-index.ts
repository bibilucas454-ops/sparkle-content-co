import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

async function exchangeYouTubeCode(code: string, redirectUri: string): Promise<TokenResponse & { accountName?: string; accountId?: string }> {
  const clientId = Deno.env.get("YOUTUBE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET")!;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

  // Get channel info
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    accountName: channel?.snippet?.title || "Canal YouTube",
    accountId: channel?.id,
  };
}

async function exchangeInstagramCode(code: string, redirectUri: string, supabaseAdmin: any, userId: string): Promise<TokenResponse & { accountName?: string; accountId?: string }> {
  const clientId = Deno.env.get("INSTAGRAM_CLIENT_ID")!;
  const clientSecret = Deno.env.get("INSTAGRAM_CLIENT_SECRET")!;

  // Exchange for short-lived token
  const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error?.message || "Erro ao trocar código Instagram");

  // Exchange for long-lived token
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`
  );
  const longData = await longRes.json();

  const accessToken = longData.access_token || tokenData.access_token;

  // 1. Fetch scopes/permissions to see what was granted
  let permsData: any;
  try {
    const permsRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${accessToken}`);
    permsData = await permsRes.json();
    console.log("[IG OAuth] GET /me/permissions response:", JSON.stringify(permsData, null, 2));
    
    // Save to database for debugging
    await supabaseAdmin.from("social_accounts").insert({
      user_id: userId,
      platform: "debug_instagram_perms",
      access_token_encrypted: JSON.stringify(permsData)
    });
  } catch (e) {
    console.error("[IG OAuth] Error fetching /me/permissions:", e);
  }

  // 2. Get Facebook Pages
  console.log(`[IG OAuth] Using Access Token: ${accessToken.substring(0, 5)}...`);
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
  );
  
  const pagesText = await pagesRes.text();
  console.log("[IG OAuth] GET /me/accounts RAW response:", pagesText);
  
  // Save to database for debugging
  await supabaseAdmin.from("social_accounts").insert({
    user_id: userId,
    platform: "debug_instagram_pages",
    access_token_encrypted: pagesText
  });
  
  let pagesData;
  try {
    pagesData = JSON.parse(pagesText);
  } catch (e) {
    console.error("[IG OAuth] Failed to parse /me/accounts response as JSON:", e);
    throw new Error("Erro ao interpretar resposta da Meta (Pages).");
  }

  // 3. Handle empty Pages case
  if (!pagesData.data || pagesData.data.length === 0) {
    console.error("[IG OAuth] /me/accounts data is empty or missing:", pagesData);
    throw new Error(`O login foi concluído, mas a Meta retornou as seguintes páginas: ${JSON.stringify(pagesData)}. Verifique no Facebook se você concedeu as permissões.`);
  }

  console.log("[IG OAuth] Pages found:", pagesData.data.map((p: any) => ({ id: p.id, name: p.name })));
  
  let igAccountName = "Conta Instagram";
  let igAccountId = "";

  // 4. Check each Page for Instagram Business Account
  for (const page of pagesData.data) {
    if (!page?.id || !page?.access_token) {
      console.log(`[IG OAuth] Page ${page.id} missing access_token in response.`);
      continue;
    }
    
    console.log(`[IG OAuth] Querying instagram_business_account for Page ID: ${page.id} Name: ${page.name}`);
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );
    const igData = await igRes.json();
    console.log(`[IG OAuth] Response for Page ${page.id} (instagram_business_account):`, JSON.stringify(igData, null, 2));

    const possibleIgAccountId = igData.instagram_business_account?.id;

    if (possibleIgAccountId) {
      igAccountId = possibleIgAccountId;
      console.log(`[IG OAuth] Found IG Business Account ID: ${igAccountId}`);
      
      try {
        const igInfoRes = await fetch(
          `https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${page.access_token}`
        );
        const igInfo = await igInfoRes.json();
        console.log(`[IG OAuth] IG Username response:`, JSON.stringify(igInfo, null, 2));
        if (igInfo.username) {
           igAccountName = igInfo.username;
        }
      } catch (e) {
        console.error("[IG OAuth] Erro ao buscar username do Instagram", e);
      }
      
      break; // Found a valid account, stop checking other pages
    } else {
      console.log(`[IG OAuth] Page ${page.id} does not have an attached instagram_business_account.`);
    }
  }

  // 5. Handle missing IG Business Account case
  if (!igAccountId) {
    throw new Error("A Página foi retornada, mas a Meta não informou nenhuma conta Instagram conectada para esta Página.");
  }

  return {
    access_token: longData.access_token || tokenData.access_token,
    refresh_token: longData.access_token, // Long-lived token acts as refresh
    expires_in: longData.expires_in || 5184000,
    accountName: igAccountName,
    accountId: igAccountId,
  };
}

async function exchangeTikTokCode(code: string, redirectUri: string): Promise<TokenResponse & { accountName?: string; accountId?: string }> {
  const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY")!;
  const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET")!;

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

  // Get user info
  const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,open_id", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    accountName: userData.data?.user?.display_name || "Conta TikTok",
    accountId: tokenData.open_id || userData.data?.user?.open_id,
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
      return redirectToApp(`/oauth/callback?error=${encodeURIComponent(error)}`);
    }

    if (!code || !stateParam) {
      return redirectToApp("/oauth/callback?error=Parâmetros inválidos");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Validate secure state instead of decoding unsafe Base64
    const { data: stateData, error: stateError } = await supabaseAdmin
      .from("oauth_states")
      .delete() // 1-time use, prevents replay attacks
      .eq("id", stateParam)
      .select()
      .single();

    if (stateError || !stateData) {
      console.error("Invalid or expired OAuth state:", stateParam);
      return redirectToApp("/oauth/callback?error=Sessão OAuth inválida ou expirada");
    }

    const userId = stateData.user_id;
    const platform = stateData.platform;
    const redirectUri = stateData.redirect_uri;

    const callbackUrl = redirectUri || `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`;

    let result: TokenResponse & { accountName?: string; accountId?: string };

    if (platform === "youtube") {
      result = await exchangeYouTubeCode(code, callbackUrl);
    } else if (platform === "instagram") {
      result = await exchangeInstagramCode(code, callbackUrl, supabaseAdmin, userId);
    } else if (platform === "tiktok") {
      result = await exchangeTikTokCode(code, callbackUrl);
    } else {
      return redirectToApp("/oauth/callback?error=Plataforma desconhecida");
    }

    // Store tokens in social_tokens (standardized table)
    const expiresAt = result.expires_in
      ? new Date(Date.now() + result.expires_in * 1000).toISOString()
      : null;

    // Encrypt the sensitive tokens before saving
    const encryptedAccess = await encryptToken(result.access_token);
    const encryptedRefresh = result.refresh_token 
      ? await encryptToken(result.refresh_token) 
      : null;

    // Upsert into social_tokens
    const { error: insertError } = await supabaseAdmin
      .from("social_tokens")
      .upsert({
        user_id: userId,
        platform,
        account_name: result.accountName || null,
        account_id: result.accountId || null,
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,platform" });

    if (insertError) {
      return redirectToApp(`/oauth/callback?error=${encodeURIComponent("Erro ao salvar conta: " + insertError.message)}`);
    }

    return redirectToApp(`/oauth/callback?success=true&platform=${platform}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return redirectToApp(`/oauth/callback?error=${encodeURIComponent(err.message || "Erro no callback OAuth")}`);
  }
});

function redirectToApp(path: string): Response {
  // Use the app URL from env or construct from Supabase URL
  const appUrl = Deno.env.get("APP_URL") || "https://sparkle-content-co.lovable.app";
  return new Response(null, {
    status: 302,
    headers: { Location: `${appUrl}${path}`, ...corsHeaders },
  });
}
