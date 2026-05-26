import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(supabase: any, userId: string, platform: string): Promise<{ token: string; accountId: string | null } | null> {
  const { data: tokenRow } = await supabase
    .from("social_tokens")
    .select("access_token_encrypted, account_id, status")
    .eq("user_id", userId)
    .eq("platform", platform)
    .maybeSingle();
  if (!tokenRow?.access_token_encrypted) return null;
  // Não tenta postar com contas em estado terminal — evita 401 em cascata
  if (["needs_reauth", "reconnect_required", "disabled"].includes(tokenRow.status)) {
    console.warn(`[auto-comment] skip ${platform}/${userId}: status=${tokenRow.status}`);
    return null;
  }
  try {
    const token = await decryptToken(tokenRow.access_token_encrypted);
    return { token, accountId: tokenRow.account_id || null };
  } catch (e) {
    console.error("[auto-comment] decrypt error:", e);
    return null;
  }
}

async function postYouTubeComment(videoId: string, text: string, accessToken: string): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          videoId,
          topLevelComment: { snippet: { textOriginal: text } },
        },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `YouTube comment failed: ${res.status}`);
  }
  return data.id || "";
}

async function postInstagramComment(mediaId: string, text: string, accessToken: string): Promise<string> {
  const url = `https://graph.facebook.com/v19.0/${mediaId}/comments?message=${encodeURIComponent(text)}&access_token=${accessToken}`;
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Instagram comment failed: ${res.status}`);
  }
  return data.id || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const nowIso = new Date().toISOString();

    const { data: pending, error } = await supabase
      .from("publication_targets")
      .select(`
        id, platform, platform_post_id,
        auto_comment_text, auto_comment_run_at,
        publications:publication_id ( user_id )
      `)
      .eq("auto_comment_status", "pending")
      .lte("auto_comment_run_at", nowIso)
      .limit(20);

    if (error) throw error;

    const results: any[] = [];

    for (const t of (pending || []) as any[]) {
      const targetId = t.id;
      const userId = t.publications?.user_id;
      const text = (t.auto_comment_text || "").trim();
      const platformPostId = t.platform_post_id;

      try {
        if (!userId) throw new Error("user_id da publicação não encontrado");
        if (!platformPostId) throw new Error("platform_post_id ausente");
        if (!text) throw new Error("Texto do comentário vazio");

        const tk = await getAccessToken(supabase, userId, t.platform);
        if (!tk) throw new Error(`Token ${t.platform} não encontrado`);

        let commentId = "";
        if (t.platform === "youtube") {
          commentId = await postYouTubeComment(platformPostId, text, tk.token);
        } else if (t.platform === "instagram") {
          commentId = await postInstagramComment(platformPostId, text, tk.token);
        } else {
          throw new Error(`Plataforma ${t.platform} não suporta comentário automático`);
        }

        await supabase
          .from("publication_targets")
          .update({
            auto_comment_status: "posted",
            auto_comment_platform_id: commentId,
            auto_comment_posted_at: new Date().toISOString(),
            auto_comment_error: null,
          })
          .eq("id", targetId);

        results.push({ targetId, status: "posted", commentId });
      } catch (err: any) {
        console.error(`[auto-comment] falha target=${targetId}:`, err?.message || err);
        const msg = (err?.message || "").toLowerCase();
        const isAuthError = msg.includes("401") || msg.includes("oauth") ||
          msg.includes("expired") || msg.includes("invalid") || msg.includes("revoked") ||
          msg.includes("permission");

        // Se for erro de auth, marca a conta como needs_reauth para parar de tentar
        if (isAuthError && userId && t.platform) {
          await supabase.from("social_tokens").update({
            status: "needs_reauth",
            last_error: err?.message?.slice(0, 500) || "Auth error em post-auto-comment",
            last_error_code: "AUTH_ERROR",
            last_refresh_attempt_at: new Date().toISOString(),
            next_refresh_attempt_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }).eq("user_id", userId).eq("platform", t.platform);
        }

        await supabase
          .from("publication_targets")
          .update({
            auto_comment_status: "failed",
            auto_comment_error: err?.message?.slice(0, 500) || "Erro desconhecido",
          })
          .eq("id", targetId);
        results.push({ targetId, status: "failed", error: err?.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[post-auto-comment] erro fatal:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
