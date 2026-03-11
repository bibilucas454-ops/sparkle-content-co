import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function exchangeInstagramCode(code: string, redirectUri: string): Promise<TokenResponse & { accountName?: string; accountId?: string }> {
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

  // Get Instagram business account
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${longData.access_token || tokenData.access_token}`
  );
  const pagesData = await pagesRes.json();
  const page = pagesData.data?.[0];

  let igAccountName = "Conta Instagram";
  let igAccountId = "";

  if (page) {
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );
    const igData = await igRes.json();
    igAccountId = igData.instagram_business_account?.id || "";

    if (igAccountId) {
      const igInfoRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${page.access_token}`
      );
      const igInfo = await igInfoRes.json();
      igAccountName = igInfo.username || igAccountName;
    }
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

    const state = JSON.parse(atob(stateParam));
    const { userId, platform } = state;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`;

    let result: TokenResponse & { accountName?: string; accountId?: string };

    if (platform === "youtube") {
      result = await exchangeYouTubeCode(code, callbackUrl);
    } else if (platform === "instagram") {
      result = await exchangeInstagramCode(code, callbackUrl);
    } else if (platform === "tiktok") {
      result = await exchangeTikTokCode(code, callbackUrl);
    } else {
      return redirectToApp("/oauth/callback?error=Plataforma desconhecida");
    }

    // Store tokens in social_accounts
    const expiresAt = result.expires_in
      ? new Date(Date.now() + result.expires_in * 1000).toISOString()
      : null;

    // Upsert: delete existing then insert
    await supabaseAdmin
      .from("social_accounts")
      .delete()
      .eq("user_id", userId)
      .eq("platform", platform);

    const { error: insertError } = await supabaseAdmin.from("social_accounts").insert({
      user_id: userId,
      platform,
      account_name: result.accountName || null,
      account_id: result.accountId || null,
      access_token_encrypted: result.access_token,
      refresh_token_encrypted: result.refresh_token || null,
      token_expires_at: expiresAt,
    });

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
