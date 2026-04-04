import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

async function logMergeEvent(
  supabase: any,
  mergeId: string,
  event: string,
  details?: string
) {
  const update: any = { status: "processing" };
  
  if (event === "completed") {
    update.status = "completed";
    update.completed_at = new Date().toISOString();
  } else if (event === "failed") {
    update.status = "failed";
    update.error_message = details;
  }
  
  await supabase.from("audio_merges").update(update).eq("id", mergeId);
}

async function downloadFile(supabase: any, filePath: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from("videos").download(filePath);
  if (error) throw error;
  return new Uint8Array(await (data as Blob).arrayBuffer());
}

async function uploadFile(
  supabase: any, 
  userId: string, 
  fileName: string, 
  data: Uint8Array, 
  mimeType: string
): Promise<{ id: string; filePath: string }> {
  const filePath = `${userId}/merged/${Date.now()}_${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from("videos")
    .upload(filePath, data, { contentType: mimeType });
  
  if (uploadError) throw uploadError;
  
  const { data: uploadRecord, error: insertError } = await supabase
    .from("uploads")
    .insert({
      user_id: userId,
      file_path: filePath,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: data.length,
    })
    .select()
    .single();
  
  if (insertError) throw insertError;
  
  return { id: uploadRecord.id, filePath };
}

async function mergeAudioWithFFmpeg(
  videoBytes: Uint8Array,
  audioBytes: Uint8Array,
  options: { audioVolume: number }
): Promise<Uint8Array> {
  const ffmpegServiceUrl = Deno.env.get("FFMPEG_SERVICE_URL");
  
  if (!ffmpegServiceUrl) {
    throw new Error("FFmpeg service not configured. Set FFMPEG_SERVICE_URL environment variable.");
  }
  
  const formData = new FormData();
  formData.append("video", new Blob([videoBytes]), "video.mp4");
  formData.append("audio", new Blob([audioBytes]), "audio.mp3");
  formData.append("audio_volume", options.audioVolume.toString());
  
  const response = await fetch(`${ffmpegServiceUrl}/merge`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FFmpeg service error: ${errorText}`);
  }
  
  const result = await response.blob();
  return new Uint8Array(await result.arrayBuffer());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const featureEnabled = Deno.env.get("FF_MUSIC_IN_STORIES") === "true";
  if (!featureEnabled) {
    return jsonResponse({ success: false, message: "Music in Stories feature is not enabled" }, 403);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, message: "Unauthorized" }, 401);
    }

    const payload = await req.json();
    const {
      publication_id,
      video_upload_id,
      audio_upload_id,
      music_volume = 0.8,
    } = payload;

    if (!publication_id || !video_upload_id || !audio_upload_id) {
      return jsonResponse({ 
        success: false, 
        message: "Missing required fields: publication_id, video_upload_id, audio_upload_id" 
      }, 400);
    }

    console.log("[merge-audio-video] Starting merge for publication:", publication_id);

    const { data: videoUpload } = await supabaseAdmin
      .from("uploads")
      .select("*")
      .eq("id", video_upload_id)
      .single();

    const { data: audioUpload } = await supabaseAdmin
      .from("uploads")
      .select("*")
      .eq("id", audio_upload_id)
      .single();

    if (!videoUpload) {
      return jsonResponse({ success: false, message: "Video upload not found" }, 404);
    }

    if (!audioUpload) {
      return jsonResponse({ success: false, message: "Audio upload not found" }, 404);
    }

    const { data: publication } = await supabaseAdmin
      .from("publications")
      .select("user_id")
      .eq("id", publication_id)
      .single();

    if (!publication) {
      return jsonResponse({ success: false, message: "Publication not found" }, 404);
    }

    const { data: mergeRecord, error: mergeError } = await supabaseAdmin
      .from("audio_merges")
      .insert({
        publication_id,
        video_upload_id,
        audio_upload_id,
        music_volume,
        status: "processing",
      })
      .select()
      .single();

    if (mergeError) throw mergeError;

    try {
      console.log("[merge-audio-video] Downloading video:", videoUpload.file_path);
      const videoBytes = await downloadFile(supabaseAdmin, videoUpload.file_path);
      
      console.log("[merge-audio-video] Downloading audio:", audioUpload.file_path);
      const audioBytes = await downloadFile(supabaseAdmin, audioUpload.file_path);

      console.log("[merge-audio-video] Merging with FFmpeg service...");
      const mergedBytes = await mergeAudioWithFFmpeg(videoBytes, audioBytes, {
        audioVolume: music_volume,
      });

      const outputFileName = `merged_${videoUpload.file_name.replace(/\.[^/.]+$/, "")}.mp4`;
      const { id: mergedUploadId, filePath: mergedFilePath } = await uploadFile(
        supabaseAdmin,
        publication.user_id,
        outputFileName,
        mergedBytes,
        "video/mp4"
      );

      await supabaseAdmin
        .from("audio_merges")
        .update({ 
          merged_upload_id: mergedUploadId,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", mergeRecord.id);

      console.log("[merge-audio-video] Merge completed:", mergedUploadId);

      return jsonResponse({
        success: true,
        merged_upload_id: mergedUploadId,
        merged_file_path: mergedFilePath,
        message: "Video with audio created successfully",
      });

    } catch (err: any) {
      await logMergeEvent(supabaseAdmin, mergeRecord.id, "failed", err.message);
      console.error("[merge-audio-video] Merge failed:", err.message);
      throw err;
    }

  } catch (err: any) {
    console.error("[merge-audio-video] Error:", err.message);
    return jsonResponse({ success: false, message: err.message }, 500);
  }
});
