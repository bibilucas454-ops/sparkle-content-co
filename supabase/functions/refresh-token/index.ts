import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, decryptToken } from "../_shared/crypto.ts";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

// corsHeaders imported from _shared

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey
  );

  let userId: string | undefined;
  let targetUserId: string | undefined;
  let platform: string | undefined;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, message: "Não autorizado" }, 401);
    }

    const bearerToken = authHeader.replace("Bearer ", "");

    // Support two authentication modes:
    // 1. Internal service call: Authorization = service_role key (from publish-video / cron-scheduler)
    // 2. User call: Authorization = user JWT (from frontend)
    const isInternalServiceCall = bearerToken === serviceRoleKey;

    if (isInternalServiceCall) {
      // Internal call — userId MUST come from the request body
      console.log("[Refresh Token] Chamada interna via service_role detectada.");
    } else {
      // User JWT — extract userId from token
      try {
        const payload = JSON.parse(atob(bearerToken.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        return jsonResponse({ success: false, message: "Token inválido" }, 401);
      }
    }

    const body = await req.json();
    platform = body.platform;
    const bodyUserId = body.userId;

    // Resolve the target user:
    // - For internal calls, bodyUserId is mandatory
    // - For user calls, bodyUserId overrides if provided (backward compat), otherwise use JWT userId
    targetUserId = bodyUserId || userId;

    if (!targetUserId) {
      return jsonResponse({ success: false, message: "userId não fornecido" }, 400);
    }

    if (!platform) {
      return jsonResponse({ success: false, message: "platform não fornecido" }, 400);
    }

    console.log(`[Refresh Token] Iniciando renovação para o usuário ${targetUserId} na plataforma ${platform}...`);

    const { data: account } = await supabaseAdmin
      .from("social_tokens")
      .select("*")
      .eq("platform", platform)
      .eq("user_id", targetUserId)
      .single();

    if (!account) {
      return jsonResponse({ success: false, message: `Conta ${platform} não encontrada para o usuário.` }, 404);
    }

    if (!account.refresh_token_encrypted) {
      console.error(`[Refresh Token] ERRO: refresh_token_encrypted está NULL no banco para platform=${platform} user=${targetUserId}. O usuário precisa reconectar a conta!`);
      await supabaseAdmin.from("social_tokens").update({ 
        status: 'error', 
        last_error: "Refresh token ausente no banco.",
        last_error_code: 'MISSING_REFRESH_TOKEN'
      }).eq("id", account.id);
      
      return jsonResponse({ success: false, message: "Refresh token ausente no banco. Reconecte a conta.", details: { missingRefreshToken: true } }, 400);
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

      console.log(`[Refresh Token] Chamando Google OAuth token endpoint para renovação...`);
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
      console.log(`[Refresh Token] Resposta do Google (YouTube): error=${tokenData.error || "nenhum"}, has_access_token=${!!tokenData.access_token}`);
      if (tokenData.error) {
        console.error(`[Refresh Token] YouTube retornou erro:`, JSON.stringify(tokenData));
        if (tokenData.error === "invalid_grant" || tokenData.error === "invalid_request") {
          console.error(`[Refresh Token] Erro PERMANENTE (YouTube): O acesso foi revogado ou o refresh token expirou.`);
          await supabaseAdmin.from("social_tokens").update({ 
            status: 'needs_reauth', 
            last_error: tokenData.error_description || tokenData.error,
            last_error_code: tokenData.error
          }).eq("id", account.id);
          throw new Error(`PERMANENT_AUTH_ERROR: ${tokenData.error_description || tokenData.error}`);
        }
        await supabaseAdmin.from("social_tokens").update({ 
          status: 'error', 
          last_error: tokenData.error_description || tokenData.error,
          last_error_code: tokenData.error
        }).eq("id", account.id);
        throw new Error(tokenData.error_description || tokenData.error);
      }
    } else if (platform === "instagram") {
      // Instagram long-lived tokens can be refreshed
      const res = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get("INSTAGRAM_CLIENT_ID")}&client_secret=${Deno.env.get("INSTAGRAM_CLIENT_SECRET")}&fb_exchange_token=${await decryptToken(account.access_token_encrypted)}`
      );
      tokenData = await res.json();
      if (tokenData.error) {
        console.error(`[Refresh Token] Instagram retornou erro:`, tokenData);
        if (tokenData.error.code === 190 || tokenData.error.code === 104 || tokenData.error.type === "OAuthException") {
          console.error(`[Refresh Token] Erro PERMANENTE (Instagram): Sessão expirada ou acesso revogado.`);
          await supabaseAdmin.from("social_tokens").update({ 
            status: 'needs_reauth', 
            last_error: tokenData.error.message,
            last_error_code: tokenData.error.code?.toString()
          }).eq("id", account.id);
          throw new Error(`PERMANENT_AUTH_ERROR: ${tokenData.error.message}`);
        }
        await supabaseAdmin.from("social_tokens").update({ 
          status: 'error', 
          last_error: tokenData.error.message,
          last_error_code: tokenData.error.code?.toString()
        }).eq("id", account.id);
        throw new Error(tokenData.error.message);
      }
      tokenData.refresh_token = tokenData.access_token;
    } else {
      return jsonResponse({ success: false, message: "Plataforma não suportada" }, 400);
    }

    await supabaseAdmin.from("social_tokens").update({
      access_token_encrypted: await encryptToken(tokenData.access_token),
      refresh_token_encrypted: tokenData.refresh_token
        ? await encryptToken(tokenData.refresh_token)
        : account.refresh_token_encrypted,
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      last_error: null,
      last_error_code: null,
      last_refreshed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", account.id);

    await supabaseAdmin.rpc("log_integration_event", {
      p_user_id: targetUserId,
      p_platform: platform,
      p_event_type: 'token_refresh',
      p_payload: { success: true }
    });

    console.log(`[Refresh Token] Sucesso! Token atualizado e persistido para ${platform}.`);

    return jsonResponse({ success: true, message: "Token atualizado com sucesso" });
  } catch (err: any) {
    console.error(`[Refresh Token] Falha geral detectada:`, err.message);
    const isPermanent = err.message?.includes("PERMANENT_AUTH_ERROR");
    
    await supabaseAdmin.rpc("log_integration_event", {
      p_user_id: targetUserId,
      p_platform: platform,
      p_event_type: 'token_refresh_failure',
      p_payload: { error: err.message, isPermanent }
    });

    return jsonResponse({ 
      success: false, 
      message: err.message || "Erro ao atualizar token", 
      details: { isPermanent } 
    }, isPermanent ? 401 : 500);
  }
});
