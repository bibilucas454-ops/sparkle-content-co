import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

// =============================================================
// refresh-youtube-token
// Renova o access_token do YouTube usando o refresh_token salvo.
// Aceita duas formas de autenticação:
//  1) JWT do usuário (frontend) — renova a conta YouTube do próprio usuário.
//  2) service_role (chamada interna / cron) — exige `userId` no body.
// A lógica de troca com o Google e a persistência segura ficam centralizadas
// na Edge Function `refresh-token` (platform = "youtube"), que esta função invoca.
// =============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, message: "Não autorizado" }, 401);
    }

    const bearerToken = authHeader.replace("Bearer ", "");
    const isInternalServiceCall = bearerToken === serviceRoleKey;

    let userId: string | undefined;
    if (!isInternalServiceCall) {
      try {
        const payload = JSON.parse(atob(bearerToken.split(".")[1]));
        userId = payload.sub;
      } catch (_e) {
        return jsonResponse({ success: false, message: "Token inválido" }, 401);
      }
    }

    let bodyUserId: string | undefined;
    try {
      const body = await req.json();
      bodyUserId = body?.userId;
    } catch (_e) {
      // body opcional
    }

    const targetUserId = bodyUserId || userId;
    if (!targetUserId) {
      return jsonResponse({ success: false, message: "userId não fornecido" }, 400);
    }

    // Garante que existe uma conta YouTube conectada para este usuário.
    const { data: account } = await supabaseAdmin
      .from("social_tokens")
      .select("id, status, refresh_token_encrypted, last_refreshed_at, expires_at")
      .eq("platform", "youtube")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!account) {
      return jsonResponse({ success: false, message: "Conta YouTube não encontrada." }, 404);
    }

    if (!account.refresh_token_encrypted) {
      return jsonResponse({
        success: false,
        message: "Refresh token ausente. Reconecte a conta do YouTube.",
        details: { reconnectRequired: true },
      }, 400);
    }

    // Delega a renovação para a função central (troca com o Google + persistência segura).
    const { data, error } = await supabaseAdmin.functions.invoke("refresh-token", {
      body: { platform: "youtube", userId: targetUserId },
      headers: { Authorization: `Bearer ${serviceRoleKey}` },
    });

    if (error) {
      return jsonResponse({
        success: false,
        message: error.message || "Falha ao renovar token do YouTube.",
      }, 500);
    }

    return jsonResponse(data ?? { success: true, message: "Token do YouTube renovado." });
  } catch (err: any) {
    console.error("[refresh-youtube-token] Erro:", err?.message || err);
    return jsonResponse({ success: false, message: err?.message || "Erro inesperado." }, 500);
  }
});
