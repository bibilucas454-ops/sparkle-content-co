import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function updateTargetStatus(supabase: any, targetId: string, status: string, extra?: Record<string, string | null>) {
  await supabase
    .from("publication_targets")
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq("id", targetId);
}

async function logEvent(supabase: any, targetId: string, event: string, details?: string) {
  await supabase.from("publication_logs").insert({
    publication_target_id: targetId,
    event,
    details: details ?? null,
  });
}

// ====== YouTube Shorts Upload ======
async function publishToYouTube(supabase: any, accessToken: string, videoBytes: Uint8Array, meta: any, targetId: string) {
  await updateTargetStatus(supabase, targetId, "enviando");
  await logEvent(supabase, targetId, "enviando", "Iniciando upload para YouTube Shorts");

  const title = meta.platformSpecificTitle || meta.title;
  const description = (meta.platformSpecificCaption || meta.caption || "") + "\n" + (meta.hashtags || "") + "\n#Shorts";
  const privacy = meta.privacyStatus || "public";

  // Step 1: Initiate resumable upload
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": videoBytes.length.toString(),
      },
      body: JSON.stringify({
        snippet: { title, description, categoryId: "22" },
        status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
      }),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.json();
    throw new Error(err.error?.message || `YouTube init failed: ${initRes.status}`);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("YouTube não retornou URL de upload");

  await updateTargetStatus(supabase, targetId, "processando");
  await logEvent(supabase, targetId, "processando", "Enviando vídeo para YouTube");

  // Step 2: Upload video bytes
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: videoBytes,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(err.error?.message || `YouTube upload failed: ${uploadRes.status}`);
  }

  const videoData = await uploadRes.json();

  await updateTargetStatus(supabase, targetId, "publicado", {
    platform_post_id: videoData.id,
    platform_post_url: `https://youtube.com/shorts/${videoData.id}`,
    published_at: new Date().toISOString(),
  });
  await logEvent(supabase, targetId, "publicado", `Publicado: https://youtube.com/shorts/${videoData.id}`);
}

// ====== Instagram Reels Upload ======
async function publishToInstagram(supabase: any, accessToken: string, accountId: string, videoUrl: string, meta: any, targetId: string) {
  await updateTargetStatus(supabase, targetId, "enviando");
  await logEvent(supabase, targetId, "enviando", "Iniciando upload para Instagram Reels");

  const caption = (meta.platformSpecificCaption || meta.caption || "") + " " + (meta.hashtags || "");

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(containerData.error.message);

  const containerId = containerData.id;

  await updateTargetStatus(supabase, targetId, "processando");
  await logEvent(supabase, targetId, "processando", "Aguardando processamento do Instagram");

  // Step 2: Poll until ready
  let ready = false;
  let attempts = 0;
  while (!ready && attempts < 30) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    if (statusData.status_code === "FINISHED") ready = true;
    else if (statusData.status_code === "ERROR") throw new Error("Instagram reportou erro no processamento do vídeo");
    attempts++;
  }

  if (!ready) throw new Error("Timeout: Instagram não finalizou o processamento");

  // Step 3: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    }
  );

  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(publishData.error.message);

  // Get permalink
  const mediaRes = await fetch(
    `https://graph.facebook.com/v19.0/${publishData.id}?fields=permalink&access_token=${accessToken}`
  );
  const mediaData = await mediaRes.json();

  await updateTargetStatus(supabase, targetId, "publicado", {
    platform_post_id: publishData.id,
    platform_post_url: mediaData.permalink || null,
    published_at: new Date().toISOString(),
  });
  await logEvent(supabase, targetId, "publicado", `Publicado no Instagram: ${mediaData.permalink || publishData.id}`);
}

// ====== TikTok Upload ======
async function publishToTikTok(supabase: any, accessToken: string, videoBytes: Uint8Array, meta: any, targetId: string) {
  await updateTargetStatus(supabase, targetId, "enviando");
  await logEvent(supabase, targetId, "enviando", "Iniciando upload para TikTok");

  const caption = (meta.platformSpecificCaption || meta.caption || "") + " " + (meta.hashtags || "");

  // Step 1: Initialize upload
  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: caption.slice(0, 150),
        privacy_level: "SELF_ONLY", // Start as private, user can change on TikTok
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoBytes.length,
        chunk_size: videoBytes.length,
        total_chunk_count: 1,
      },
    }),
  });

  const initData = await initRes.json();
  if (initData.error?.code) throw new Error(initData.error.message || `TikTok init error: ${initData.error.code}`);

  const uploadUrl = initData.data?.upload_url;
  const publishId = initData.data?.publish_id;
  if (!uploadUrl) throw new Error("TikTok não retornou URL de upload");

  await updateTargetStatus(supabase, targetId, "processando");
  await logEvent(supabase, targetId, "processando", "Enviando vídeo para TikTok");

  // Step 2: Upload video
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${videoBytes.length - 1}/${videoBytes.length}`,
    },
    body: videoBytes,
  });

  if (!uploadRes.ok) throw new Error(`TikTok upload failed: ${uploadRes.status}`);

  // Step 3: Check publish status
  let published = false;
  let attempts = 0;
  while (!published && attempts < 20) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const statusData = await statusRes.json();
    const status = statusData.data?.status;

    if (status === "PUBLISH_COMPLETE") {
      published = true;
      await updateTargetStatus(supabase, targetId, "publicado", {
        platform_post_id: publishId,
        platform_post_url: null, // TikTok doesn't return URL directly
        published_at: new Date().toISOString(),
      });
      await logEvent(supabase, targetId, "publicado", "Publicado no TikTok com sucesso");
    } else if (status === "FAILED") {
      throw new Error(statusData.data?.fail_reason || "TikTok publicação falhou");
    }
    attempts++;
  }

  if (!published) throw new Error("Timeout: TikTok não finalizou o processamento");
}

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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { targetId, platform, uploadId, title, caption, hashtags, privacyStatus, platformSpecificTitle, platformSpecificCaption } = await req.json();

    // Get social account for this platform
    const { data: account, error: accError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("platform", platform)
      .single();

    if (accError || !account) {
      await updateTargetStatus(supabase, targetId, "erro", { error_message: `Nenhuma conta ${platform} conectada.` });
      await logEvent(supabase, targetId, "erro", `Conta ${platform} não encontrada`);
      return new Response(JSON.stringify({ error: `Conta ${platform} não conectada` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check token expiry
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      // Try to refresh
      try {
        await refreshToken(supabase, account, platform, userId);
      } catch {
        await updateTargetStatus(supabase, targetId, "erro", { error_message: "Token expirado. Reconecte sua conta." });
        await logEvent(supabase, targetId, "erro", "Token expirado");
        return new Response(JSON.stringify({ error: "Token expirado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Re-fetch account after refresh
      const { data: refreshedAccount } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("id", account.id)
        .single();
      if (refreshedAccount) Object.assign(account, refreshedAccount);
    }

    const accessToken = account.access_token_encrypted!;

    // Get upload info
    const { data: upload } = await supabase.from("uploads").select("*").eq("id", uploadId).single();
    if (!upload) {
      await updateTargetStatus(supabase, targetId, "erro", { error_message: "Vídeo não encontrado" });
      return new Response(JSON.stringify({ error: "Upload não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = { title, caption, hashtags, privacyStatus, platformSpecificTitle, platformSpecificCaption };

    // Download video from storage
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from("videos")
      .download(upload.file_path);

    if (fileError || !fileData) {
      await updateTargetStatus(supabase, targetId, "erro", { error_message: "Falha ao baixar vídeo do storage" });
      return new Response(JSON.stringify({ error: "Falha ao baixar vídeo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoBytes = new Uint8Array(await fileData.arrayBuffer());

    // Get public URL for Instagram (needs accessible URL)
    const { data: publicUrlData } = supabaseAdmin.storage.from("videos").getPublicUrl(upload.file_path);
    const videoPublicUrl = publicUrlData?.publicUrl || "";

    // Publish to platform
    if (platform === "youtube") {
      await publishToYouTube(supabase, accessToken, videoBytes, meta, targetId);
    } else if (platform === "instagram") {
      await publishToInstagram(supabase, accessToken, account.account_id!, videoPublicUrl, meta, targetId);
    } else if (platform === "tiktok") {
      await publishToTikTok(supabase, accessToken, videoBytes, meta, targetId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Publish error:", err);

    // Try to update status to error
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.targetId) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseAdmin
          .from("publication_targets")
          .update({ status: "erro", error_message: err.message, updated_at: new Date().toISOString() })
          .eq("id", body.targetId);
        await supabaseAdmin.from("publication_logs").insert({
          publication_target_id: body.targetId,
          event: "erro",
          details: err.message,
        });
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: err.message || "Erro ao publicar" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ====== Token Refresh ======
async function refreshToken(supabase: any, account: any, platform: string, userId: string) {
  if (!account.refresh_token_encrypted) throw new Error("Sem refresh token");

  let tokenData: any;

  if (platform === "youtube") {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("YOUTUBE_CLIENT_ID")!,
        client_secret: Deno.env.get("YOUTUBE_CLIENT_SECRET")!,
        refresh_token: account.refresh_token_encrypted,
        grant_type: "refresh_token",
      }),
    });
    tokenData = await res.json();
    if (tokenData.error) throw new Error(tokenData.error_description);
  } else if (platform === "tiktok") {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: Deno.env.get("TIKTOK_CLIENT_KEY")!,
        client_secret: Deno.env.get("TIKTOK_CLIENT_SECRET")!,
        refresh_token: account.refresh_token_encrypted,
        grant_type: "refresh_token",
      }),
    });
    tokenData = await res.json();
    if (tokenData.error) throw new Error(tokenData.error_description);
  } else {
    throw new Error("Refresh não suportado para esta plataforma");
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabaseAdmin.from("social_accounts").update({
    access_token_encrypted: tokenData.access_token,
    refresh_token_encrypted: tokenData.refresh_token || account.refresh_token_encrypted,
    token_expires_at: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : account.token_expires_at,
    updated_at: new Date().toISOString(),
  }).eq("id", account.id);
}
