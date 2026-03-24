import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../_shared/crypto.ts";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

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
       if (statusData.error.code !== 100) throw new Error(statusData.error.message);
    }
    attempts++;
  }
  if (!ready) throw new Error("Timeout: Instagram não finalizou o processamento da mídia.");
}

// ====== API Publishing Handlers ======

async function publishToYouTube(supabase: any, accessToken: string, mediaFiles: any[], meta: any, targetId: string) {
  if (mediaFiles.length > 1) throw new Error("YouTube Shorts não suporta carrossel de múltiplas mídias.");
  const media = mediaFiles[0];
  const finalSizeBytes = media.bytes?.length;
  if (!finalSizeBytes) throw new Error("Tamanho do vídeo (bytes) não encontrado.");

  await updateTargetStatus(supabase, targetId, "enviando");
  await logEvent(supabase, targetId, "enviando", "Iniciando upload via STREAM para YouTube Shorts");

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
        "X-Upload-Content-Length": finalSizeBytes.toString(),
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
    headers: { 
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${finalSizeBytes - 1}/${finalSizeBytes}`
    },
    body: media.bytes,
  });

  if (!uploadRes.ok) {
    throw new Error(`YouTube upload failed: ${await uploadRes.text()}`);
  }

  const videoData = await uploadRes.json();
  await updateTargetStatus(supabase, targetId, "publicado", {
    platform_post_id: videoData.id,
    platform_post_url: `https://youtube.com/shorts/${videoData.id}`,
    published_at: new Date().toISOString(),
  });
}

async function publishToInstagram(supabase: any, accessToken: string, accountId: string, mediaFiles: any[], meta: any, targetId: string) {
  await updateTargetStatus(supabase, targetId, "enviando");
  const caption = (meta.platformSpecificCaption || meta.caption || "") + " " + (meta.hashtags || "");
  const format = meta.contentFormat || "reels";

  if (mediaFiles.length === 1 && format !== "carousel") {
    const media = mediaFiles[0];
    const isVideo = media.mime_type?.startsWith("video");
    const body: any = { caption, access_token: accessToken };
    
    if (format === "story") body.media_type = "STORIES";
    else if (isVideo) body.media_type = "REELS";

    if (isVideo) body.video_url = media.publicUrl;
    else body.image_url = media.publicUrl;

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
  } else {
    // Carousel logic... (simplified here for brevity, assume full implementation matches previous working state)
    // [Full Carousel implementation as per previous clean version]
    const childIds: string[] = [];
    for (const media of mediaFiles) {
      const isVideo = media.mime_type?.startsWith("video");
      const body: any = { is_carousel_item: "true", access_token: accessToken };
      if (isVideo) body.video_url = media.publicUrl;
      else body.image_url = media.publicUrl;

      const childRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const childData = await childRes.json();
      if (childData.error) throw new Error(childData.error.message);
      childIds.push(childData.id);
    }
    await updateTargetStatus(supabase, targetId, "processando");
    for (const cid of childIds) await pollInstagramContainer(cid, accessToken);

    const parentRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
      method: "POST", headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ media_type: "CAROUSEL", children: childIds, caption, access_token: accessToken })
    });
    const parentData = await parentRes.json();
    if (parentData.error) throw new Error(parentData.error.message);
    
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
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return jsonResponse({ success: true, message: "OK" });

  let captureJobId: string | undefined;
  let captureTargetId: string | undefined;
  let pUserId: string | undefined;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ success: false, message: "Não autorizado" }, 401);

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const payload = await req.json();
    const { jobId, idempotencyKey, correlationId } = payload;
    captureJobId = jobId;

    // 1. Idempotency & Status Check
    if (jobId) {
      const { data: job } = await supabaseAdmin.from("publication_jobs").select("status, publication_target_id").eq("id", jobId).single();
      if (!job) throw new Error("Job não encontrado");
      if (job.status === "published") return jsonResponse({ success: true, message: "Já publicado" });
      if (job.status === "cancelled") return jsonResponse({ success: false, message: "Cancelado", code: "CANCELLED" });
      captureTargetId = job.publication_target_id;
    }

    // 2. Resolve Data
    const { data: target } = await supabaseAdmin.from("publication_targets").select("*, publications(*)").eq("id", captureTargetId).single();
    if (!target) throw new Error("Target não encontrado");
    const pub = target.publications;
    pUserId = pub.user_id;

    await supabaseAdmin.rpc("log_audit_event", {
      p_user_id: pUserId, p_event_type: "publish_started", p_provider: target.platform, p_publication_id: pub.id,
      p_message: `Worker iniciando ${target.platform}`, p_correlation_id: correlationId || jobId
    });

    // 3. Resolve Media
    const { data: pmList } = await supabaseAdmin.from("post_media").select("*, uploads(*)").eq("publication_id", pub.id).order("sort_order");
    let mediaList = pmList?.map(pm => pm.uploads) || [];
    if (mediaList.length === 0 && pub.upload_id) {
       const { data: up } = await supabaseAdmin.from("uploads").select("*").eq("id", pub.upload_id).single();
       if (up) mediaList = [up];
    }
    if (mediaList.length === 0) throw new Error("Sem mídia vinculada");

    // 4. Token & Auto-Refresh (with proper re-fetch after refresh)
    const { data: account } = await supabaseAdmin.from("social_tokens").select("*").eq("platform", target.platform).eq("user_id", pUserId).single();
    if (!account) throw new Error("Conta não conectada");

    const now = new Date();
    const expiry = account.expires_at ? new Date(account.expires_at) : null;
    let accessToken: string;

    // Trigger refresh if token expires within 1 hour (instead of just 5 minutes)
    if (!expiry || expiry.getTime() < now.getTime() + 60 * 60 * 1000) {
       console.log(`[publish-video] Token for ${target.platform} expiring soon (${account.expires_at || 'unknown'}). Invoking refresh...`);
       await supabaseAdmin.functions.invoke("refresh-token", { 
         body: { platform: target.platform, userId: pUserId },
         headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` }
       });
       
       // CRITICAL FIX: Re-fetch the updated token from database after refresh
       console.log(`[publish-video] Re-fetching refreshed token from database...`);
       const { data: refreshedAccount } = await supabaseAdmin
         .from("social_tokens")
         .select("*")
         .eq("platform", target.platform)
         .eq("user_id", pUserId)
         .single();
       
       if (!refreshedAccount) {
         throw new Error(`Token refresh failed: Account not found after refresh for ${target.platform}`);
       }
       
       accessToken = await decryptToken(refreshedAccount.access_token_encrypted!);
    } else {
       accessToken = await decryptToken(account.access_token_encrypted!);
    }
    
    // 5. Download Media
    const mediaFilesReady = await Promise.all(mediaList.map(async (upload: any) => {
      const { data: signedUrlData } = await supabaseAdmin.storage.from("videos").createSignedUrl(upload.file_path, 3600);
      const { data: fileData } = await supabaseAdmin.storage.from("videos").download(upload.file_path);
      const bytes = new Uint8Array(await fileData!.arrayBuffer());
      return { ...upload, bytes, publicUrl: signedUrlData!.signedUrl };
    }));

    // 6. Route to Platform
    const pMeta = { title: pub.title, caption: pub.caption, hashtags: pub.hashtags, ...pub.platform_settings };
    if (target.platform === "youtube") await publishToYouTube(supabaseAdmin, accessToken, mediaFilesReady, pMeta, target.id);
    else if (target.platform === "instagram") await publishToInstagram(supabaseAdmin, accessToken, account.account_id, mediaFilesReady, pMeta, target.id);
    // TikTok removed

    // Success
    if (jobId) await supabaseAdmin.from("publication_jobs").update({ status: "published" }).eq("id", jobId);
    await supabaseAdmin.rpc("log_audit_event", {
      p_user_id: pUserId, p_event_type: "publish_success", p_provider: target.platform, p_publication_id: pub.id,
      p_message: `Publicado no ${target.platform}`, p_correlation_id: correlationId || jobId
    });

    return jsonResponse({ success: true, message: "OK" });

  } catch (err: any) {
    console.error("Worker Error:", err.message);
    if (captureJobId) {
       const isPermanent = err.message?.includes("PERMANENT_AUTH_ERROR") || err.message?.includes("invalid_grant") || err.message?.includes("token");
       
       const { data: job } = await supabaseAdmin.from("publication_jobs").select("attempt_count").eq("id", captureJobId).single();
       const attempts = (job?.attempt_count || 0) + 1;
       
       await supabaseAdmin.from("publication_attempts").insert({
         publication_job_id: captureJobId,
         attempt_number: attempts,
         error_message: err.message,
         http_status: 500
       });
       
       if (attempts >= 3 || isPermanent) {
         await supabaseAdmin.from("publication_jobs").update({
           status: "failed",
           last_error: `Falha permanente após ${attempts} tentativas. Último erro: ${err.message}`
         }).eq("id", captureJobId);
       } else {
         const nextRun = new Date(Date.now() + 60000 * 5);
         await supabaseAdmin.from("publication_jobs").update({
           status: "queued",
           attempt_count: attempts,
           run_at: nextRun.toISOString(),
           last_error: err.message,
           locked_at: null
         }).eq("id", captureJobId);
       }
    }
    if (captureTargetId) await updateTargetStatus(supabaseAdmin, captureTargetId, "erro", { error_message: err.message });
    return jsonResponse({ success: false, message: err.message }, 500);
  }
});
