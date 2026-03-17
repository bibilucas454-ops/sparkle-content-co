import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../_shared/crypto.ts";

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

// ====== Polling Helper para Facebook/Instagram ======
async function pollInstagramContainer(containerId: string, accessToken: string) {
  let ready = false;
  let attempts = 0;
  while (!ready && attempts < 30) {
    await new Promise((r) => setTimeout(r, 4000));
    const statusRes = await fetch(
      `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    if (statusData.status_code === "FINISHED") {
      ready = true;
    } else if (statusData.status_code === "ERROR") {
      throw new Error(`Instagram reportou erro no container ${containerId}`);
    } else if (statusData.error) {
       // if container doesn't exist yet or graph api error
       if (statusData.error.code !== 100) throw new Error(statusData.error.message);
    }
    attempts++;
  }
  if (!ready) throw new Error("Timeout: Instagram não finalizou o processamento da mídia.");
}

// ====== API Publishing Handlers ======

async function publishToYouTube(supabase: any, accessToken: string, mediaFiles: any[], meta: any, targetId: string) {
  if (mediaFiles.length > 1) throw new Error("YouTube Shorts não suporta carrossel de múltiplas mídias.");
  const videoBytes = mediaFiles[0].bytes;
  
  await updateTargetStatus(supabase, targetId, "enviando");
  await logEvent(supabase, targetId, "enviando", "Iniciando upload para YouTube Shorts");

  const title = meta.platformSpecificTitle || meta.title;
  const description = (meta.platformSpecificCaption || meta.caption || "") + "\n" + (meta.hashtags || "") + "\n#Shorts";
  const privacy = meta.privacyStatus || "public";

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

async function publishToInstagram(supabase: any, accessToken: string, accountId: string, mediaFiles: any[], meta: any, targetId: string) {
  await updateTargetStatus(supabase, targetId, "enviando");
  const caption = (meta.platformSpecificCaption || meta.caption || "") + " " + (meta.hashtags || "");
  const format = meta.contentFormat || "reels";

  if (mediaFiles.length === 1 && format !== "carousel") {
    // Single Media (Reel, Photo or Story)
    await logEvent(supabase, targetId, "enviando", `Iniciando upload single (${format}) para Instagram`);
    const media = mediaFiles[0];
    const isVideo = media.mime_type?.startsWith("video");
    
    const body: any = { caption, access_token: accessToken };
    
    if (format === "story") {
      body.media_type = "STORIES";
    } else if (isVideo) {
      body.media_type = "REELS";
      body.video_url = media.publicUrl;
    } else {
      body.image_url = media.publicUrl;
    }

    if (isVideo && format !== "story") {
      body.video_url = media.publicUrl;
    } else if (format === "story") {
      if (isVideo) body.video_url = media.publicUrl;
      else body.image_url = media.publicUrl;
    }

    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const containerData = await containerRes.json();
    if (containerData.error) throw new Error(containerData.error.message);

    const containerId = containerData.id;
    await updateTargetStatus(supabase, targetId, "processando");
    
    if (isVideo) await pollInstagramContainer(containerId, accessToken);

    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media_publish`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);

    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${publishData.id}?fields=permalink&access_token=${accessToken}`);
    const mediaDat = await mediaRes.json();

    await updateTargetStatus(supabase, targetId, "publicado", {
      platform_post_id: publishData.id, platform_post_url: mediaDat.permalink || null, published_at: new Date().toISOString(),
    });
    await logEvent(supabase, targetId, "publicado", `Publicado: ${mediaDat.permalink || publishData.id}`);
  } else {
    // Carousel (Multi-Media)
    await logEvent(supabase, targetId, "enviando", "Iniciando upload Carousel para Instagram (Multi-Media)");
    const childIds: string[] = [];

    // Step 1: Create Child Containers
    for (const media of mediaFiles) {
      const isVideo = media.mime_type?.startsWith("video");
      const body: any = { is_carousel_item: "true", access_token: accessToken };
      if (isVideo) {
        body.media_type = "REELS";
        body.video_url = media.publicUrl;
      } else {
        body.image_url = media.publicUrl;
      }

      const childRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const childData = await childRes.json();
      if (childData.error) throw new Error("Erro na mídia do carrossel: " + childData.error.message);
      childIds.push(childData.id);
    }

    await updateTargetStatus(supabase, targetId, "processando");

    // Poll all children if they contain video (best practice is polling all to be safe)
    for (const cid of childIds) {
      // images might be ready instantly, but safe to poll
      await pollInstagramContainer(cid, accessToken);
    }

    // Step 2: Create Parent Container
    const parentRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
      method: "POST", headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds,
        caption,
        access_token: accessToken
      })
    });
    const parentData = await parentRes.json();
    if (parentData.error) throw new Error("Erro ao compilar carrossel: " + parentData.error.message);
    
    // Step 3: Publish Parent
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media_publish`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: parentData.id, access_token: accessToken }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);

    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${publishData.id}?fields=permalink&access_token=${accessToken}`);
    const mediaDat = await mediaRes.json();

    await updateTargetStatus(supabase, targetId, "publicado", {
      platform_post_id: publishData.id, platform_post_url: mediaDat.permalink || null, published_at: new Date().toISOString(),
    });
    await logEvent(supabase, targetId, "publicado", `Carrossel Publicado: ${mediaDat.permalink || publishData.id}`);
  }
}

async function publishToTikTok(supabase: any, accessToken: string, mediaFiles: any[], meta: any, targetId: string) {
  const format = meta.contentFormat || "reels";
  const isCarousel = format === "carousel" || format === "story" || mediaFiles.length > 1 || (mediaFiles.length === 1 && !mediaFiles[0].mime_type?.startsWith("video"));
  
  await updateTargetStatus(supabase, targetId, "enviando");
  await logEvent(supabase, targetId, "enviando", `Iniciando upload para TikTok (${isCarousel ? 'Photo Carousel' : 'Video'})`);

  const caption = (meta.platformSpecificCaption || meta.caption || "") + " " + (meta.hashtags || "");

  if (isCarousel) {
    // Foto / Photo Carousel mode via PULL_FROM_URL
    const photoUrls = mediaFiles.map(m => m.publicUrl);
    const privacyLevel = meta.privacyStatus === "private" ? "SELF_ONLY" : "PUBLIC_TO_EVERYONE";
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: { title: caption.slice(0, 150), privacy_level: privacyLevel, disable_duet: false, disable_comment: false, disable_stitch: false },
        source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_urls: photoUrls },
        media_type: "PHOTO"
      }),
    });

    const initData = await initRes.json();
    if (initData.error?.code) throw new Error(initData.error.message || `TikTok init photo error: ${initData.error.code}`);

    const publishId = initData.data?.publish_id;
    if (!publishId) throw new Error("TikTok não retornou publish_id");

    await updateTargetStatus(supabase, targetId, "processando");

    let published = false;
    let attempts = 0;
    const maxAttempts = 30; // Increased to 2.5 minutes total (5s * 30)
    
    while (!published && attempts < maxAttempts) {
      console.log(`[TikTok Publish] Polling status for publishId: ${publishId} (Attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, 5000));
      
      const statusRes = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
        method: "POST", 
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ publish_id: publishId }),
      });
      
      const statusData = await statusRes.json();
      const status = statusData.data?.status;
      console.log(`[TikTok Publish] Status response:`, JSON.stringify(statusData));

      if (status === "PUBLISH_COMPLETE") {
        published = true;
        await updateTargetStatus(supabase, targetId, "publicado", { platform_post_id: publishId, published_at: new Date().toISOString() });
        await logEvent(supabase, targetId, "publicado", "Publicação no TikTok concluída com sucesso.");
      } else if (status === "FAILED") {
        const reason = statusData.data?.fail_reason || "TikTok publicação falhou";
        console.error(`[TikTok Publish] Failed: ${reason}`);
        throw new Error(reason);
      } else if (status === "PROCESSING_FAILED") {
         throw new Error("TikTok reportou falha no processamento da mídia.");
      }
      attempts++;
    }

    if (!published) throw new Error("Timeout: O TikTok demorou muito para processar o carrossel de fotos.");

  } else {
    // Single Video mode via FILE_UPLOAD
    const videoBytes = mediaFiles[0].bytes;
    const privacyLevel = meta.privacyStatus === "private" ? "SELF_ONLY" : "PUBLIC_TO_EVERYONE";

    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: { title: caption.slice(0, 150), privacy_level: privacyLevel, disable_duet: false, disable_comment: false, disable_stitch: false },
        source_info: { source: "FILE_UPLOAD", video_size: videoBytes.length, chunk_size: videoBytes.length, total_chunk_count: 1 },
      }),
    });

    const initData = await initRes.json();
    if (initData.error?.code) throw new Error(initData.error.message || `TikTok init error: ${initData.error.code}`);

    const uploadUrl = initData.data?.upload_url;
    const publishId = initData.data?.publish_id;
    if (!uploadUrl) throw new Error("TikTok não retornou URL de upload");

    await updateTargetStatus(supabase, targetId, "processando");

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes 0-${videoBytes.length - 1}/${videoBytes.length}`,
      },
      body: videoBytes,
    });

    if (!uploadRes.ok) throw new Error(`TikTok upload failed: ${uploadRes.status}`);

    let published = false;
    let attempts = 0;
    while (!published && attempts < 20) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
        method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ publish_id: publishId }),
      });
      const statusData = await statusRes.json();
      const status = statusData.data?.status;

      if (status === "PUBLISH_COMPLETE") {
        published = true;
        await updateTargetStatus(supabase, targetId, "publicado", { platform_post_id: publishId, published_at: new Date().toISOString() });
      } else if (status === "FAILED") {
        throw new Error(statusData.data?.fail_reason || "TikTok publicação falhou");
      }
      attempts++;
    }

    if (!published) throw new Error("Timeout: TikTok não finalizou o processamento do vídeo");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") { return new Response(null, { headers: corsHeaders }); }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Token check bypass for internal invoke if needed, but the original logic uses it
    const token = authHeader.replace("Bearer ", "");
    let userId = "";
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.error("Error decoding JWT:", e);
    }

    const payload = await req.json();
    const { jobId } = payload;
    
    let pTargetId = payload.targetId;
    let pPlatform = payload.platform;
    let pMeta = { 
      title: payload.title, caption: payload.caption, hashtags: payload.hashtags, 
      privacyStatus: payload.privacyStatus, platformSpecificTitle: payload.platformSpecificTitle, platformSpecificCaption: payload.platformSpecificCaption 
    };
    
    let mediaList: any[] = [];

    // ====== Job & Payload Resolution ======
    if (jobId) {
      // Called by cron-scheduler or async worker
      const { data: job, error: jobErr } = await supabaseAdmin.from("publication_jobs").select("publication_target_id").eq("id", jobId).single();
      if (jobErr || !job) throw new Error("Job não encontrado");
      pTargetId = job.publication_target_id;

      const { data: target, error: targetErr } = await supabaseAdmin.from("publication_targets").select("*, publications(*)").eq("id", pTargetId).single();
      if (targetErr || !target) throw new Error("Target não encontrado");
      
      const pub = target.publications;
      pPlatform = target.platform;
      pMeta = {
        title: pub.title, caption: pub.caption, hashtags: pub.hashtags,
        contentFormat: pub.content_format,
        privacyStatus: target.privacy_status, platformSpecificTitle: target.platform_specific_title, platformSpecificCaption: target.platform_specific_caption,
      };
      
      // Override userId to the publication owner so we can fetch their account
      userId = pub.user_id;

      // Extract Media (N mídias or 1 legacy)
      const { data: pmList } = await supabaseAdmin.from("post_media").select("*, uploads(*)").eq("publication_id", pub.id).order("sort_order");
      if (pmList && pmList.length > 0) {
        mediaList = pmList.map(pm => pm.uploads);
      } else if (pub.upload_id) {
        const { data: up } = await supabaseAdmin.from("uploads").select("*").eq("id", pub.upload_id).single();
        if (up) mediaList = [up];
      }
    } else {
      // Legacy caller
      if (payload.uploadId) {
         const { data: up } = await supabaseAdmin.from("uploads").select("*").eq("id", payload.uploadId).single();
         if (up) mediaList = [up];
      }
    }

    if (mediaList.length === 0) throw new Error("Nenhuma mídia vinculada encontrada para publicar");

    // ====== Account Resolution ======
    const { data: account, error: accError } = await supabaseAdmin
      .from("social_tokens")
      .select("*")
      .eq("platform", pPlatform)
      .eq("user_id", userId)
      .single();
      
    if (accError || !account) {
      await updateTargetStatus(supabaseAdmin, pTargetId, "erro", { error_message: `Conta ${pPlatform} não conectada/encontrada.` });
      return new Response(JSON.stringify({ error: `Conta ${pPlatform} não encontrada` }), { status: 400, headers: corsHeaders });
    }

    // Pre-flight Token Refresh: Check if expired or expiring in less than 5 minutes
    const now = new Date();
    const expiry = account.expires_at ? new Date(account.expires_at) : null;
    
    if (expiry && expiry.getTime() < now.getTime() + 5 * 60 * 1000) {
      console.log(`Token ${pPlatform} expirado ou próximo da expiração. Iniciando refresh automático...`);
      try {
        const { data: refreshData, error: refreshError } = await supabaseAdmin.functions.invoke("refresh-token", {
          body: { platform: pPlatform, userId: userId },
        });
        
        if (refreshError || refreshData?.error) {
          throw new Error(`Falha no auto-refresh: ${refreshError?.message || refreshData?.error}`);
        }
        
        // Re-fetch account to get new token
        const { data: updatedAccount } = await supabaseAdmin
          .from("social_tokens")
          .select("*")
          .eq("id", account.id)
          .single();
        
        if (updatedAccount) {
          Object.assign(account, updatedAccount);
          console.log(`Token ${pPlatform} renovado com sucesso via pre-flight.`);
        }
      } catch (e) {
        console.error(`Erro no refresh preventivo:`, e);
        // We still try to proceed if we have a token, or fail if it's strictly required
      }
    }

    const accessToken = await decryptToken(account.access_token_encrypted!);

    // ====== Download Media Bytes ======
    console.log(`Baixando ${mediaList.length} midia(s) do Storage...`);
    const mediaFilesReady = await Promise.all(mediaList.map(async (upload) => {
      const { data: fileData, error: fileError } = await supabaseAdmin.storage.from("videos").download(upload.file_path);
      if (fileError || !fileData) throw new Error(`Falha ao baixar mídia: ${upload.file_name}`);
      const bytes = new Uint8Array(await fileData.arrayBuffer());
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage.from("videos").createSignedUrl(upload.file_path, 3600);
      if (signedUrlError) throw new Error(`Falha ao gerar URL assinada: ${signedUrlError.message}`);
      return { ...upload, bytes, publicUrl: signedUrlData.signedUrl };
    }));

    // ====== Route to Platform ======
    if (pPlatform === "youtube") {
      await publishToYouTube(supabaseAdmin, accessToken, mediaFilesReady, pMeta, pTargetId);
    } else if (pPlatform === "instagram") {
      await publishToInstagram(supabaseAdmin, accessToken, account.account_id!, mediaFilesReady, pMeta, pTargetId);
    } else if (pPlatform === "tiktok") {
      await publishToTikTok(supabaseAdmin, accessToken, mediaFilesReady, pMeta, pTargetId);
    }

    // If we've made it here, mark Job as COMPLETED
    if (jobId) {
      await supabaseAdmin.from("publication_jobs").update({ status: "completed" }).eq("id", jobId);
    }

    return new Response(JSON.stringify({ success: true, publishedMediaCount: mediaFilesReady.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Publish Fatal Error:", err);
    try {
      const { jobId, targetId } = await req.clone().json().catch(() => ({}));
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      
      if (targetId) await updateTargetStatus(supabaseAdmin, targetId, "erro", { error_message: err.message });
      if (jobId) {
         // Actually, if it fails, cron-scheduler is wrapping this call and dealing with `publication_jobs`
         // It's safer to let cron-scheduler handle the job failing by throwing.
      }
    } catch (_) {}
    return new Response(JSON.stringify({ error: err.message || "Erro de publicação" }), { status: 500, headers: corsHeaders });
  }
});
