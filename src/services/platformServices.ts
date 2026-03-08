import { supabase } from "@/integrations/supabase/client";

// ============================================================
// Platform Service Layer — Placeholder for future OAuth/API
// ============================================================

export interface PlatformAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  created_at: string;
  token_expires_at: string | null;
}

export interface PublishPayload {
  publicationTargetId: string;
  platform: string;
  videoUrl: string;
  title: string;
  caption: string | null;
  hashtags: string | null;
  privacyStatus?: string;
  platformSpecificTitle?: string;
  platformSpecificCaption?: string;
}

// ---------- Connect helpers (mock / future OAuth) ----------

export async function connectYouTubeAccount(): Promise<void> {
  // TODO: Implement YouTube OAuth 2.0 flow
  // 1. Redirect to Google OAuth consent screen
  // 2. Exchange code for tokens
  // 3. Store encrypted tokens in social_accounts
  throw new Error("Integração com YouTube ainda não disponível. Em breve!");
}

export async function connectInstagramAccount(): Promise<void> {
  // TODO: Implement Instagram/Facebook OAuth flow
  throw new Error("Integração com Instagram ainda não disponível. Em breve!");
}

export async function connectTikTokAccount(): Promise<void> {
  // TODO: Implement TikTok OAuth flow
  throw new Error("Integração com TikTok ainda não disponível. Em breve!");
}

// ---------- Publish helpers (mock / future API) ----------

async function updateTargetStatus(targetId: string, status: string, extra?: Record<string, string | null>) {
  await supabase
    .from("publication_targets")
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq("id", targetId);
}

async function logEvent(targetId: string, event: string, details?: string) {
  await supabase.from("publication_logs").insert({
    publication_target_id: targetId,
    event,
    details: details ?? null,
  });
}

export async function publishToYouTube(payload: PublishPayload): Promise<void> {
  await updateTargetStatus(payload.publicationTargetId, "enviando");
  await logEvent(payload.publicationTargetId, "enviando", "Iniciando upload para YouTube Shorts");

  // Simulate processing
  await new Promise((r) => setTimeout(r, 2000));
  await updateTargetStatus(payload.publicationTargetId, "processando");
  await logEvent(payload.publicationTargetId, "processando", "Vídeo sendo processado pelo YouTube");

  await new Promise((r) => setTimeout(r, 2000));
  await updateTargetStatus(payload.publicationTargetId, "publicado", {
    platform_post_url: "https://youtube.com/shorts/mock-id",
    platform_post_id: "mock-yt-id",
    published_at: new Date().toISOString(),
  });
  await logEvent(payload.publicationTargetId, "publicado", "Publicado com sucesso no YouTube Shorts");
}

export async function publishToInstagram(payload: PublishPayload): Promise<void> {
  await updateTargetStatus(payload.publicationTargetId, "enviando");
  await logEvent(payload.publicationTargetId, "enviando", "Iniciando upload para Instagram Reels");

  await new Promise((r) => setTimeout(r, 2000));
  await updateTargetStatus(payload.publicationTargetId, "processando");
  await logEvent(payload.publicationTargetId, "processando", "Vídeo sendo processado pelo Instagram");

  await new Promise((r) => setTimeout(r, 3000));
  // Mock: stays processing
  await logEvent(payload.publicationTargetId, "processando", "Aguardando aprovação do Instagram");
}

export async function publishToTikTok(payload: PublishPayload): Promise<void> {
  await updateTargetStatus(payload.publicationTargetId, "enviando");
  await logEvent(payload.publicationTargetId, "enviando", "Iniciando upload para TikTok");

  await new Promise((r) => setTimeout(r, 2000));
  // Mock: error
  await updateTargetStatus(payload.publicationTargetId, "erro", {
    error_message: "Token expirado. Reconecte sua conta do TikTok.",
  });
  await logEvent(payload.publicationTargetId, "erro", "Falha: token expirado");
}

export async function retryPublication(targetId: string, platform: string, payload: PublishPayload): Promise<void> {
  await updateTargetStatus(targetId, "pendente", { error_message: null });
  await logEvent(targetId, "retry", "Tentando publicar novamente");

  const publishers: Record<string, (p: PublishPayload) => Promise<void>> = {
    youtube: publishToYouTube,
    instagram: publishToInstagram,
    tiktok: publishToTikTok,
  };

  const fn = publishers[platform];
  if (fn) await fn({ ...payload, publicationTargetId: targetId });
}

export function validateVideoForPlatforms(
  file: File | null,
  duration?: number,
  aspectRatio?: string
): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!file) {
    errors.push("Nenhum vídeo selecionado.");
    return { warnings, errors };
  }

  const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
  if (!validTypes.includes(file.type)) {
    errors.push("Formato de vídeo incompatível. Use MP4 ou MOV.");
  }

  if (file.size > 500 * 1024 * 1024) {
    errors.push("O vídeo excede o tamanho máximo de 500MB.");
  }

  if (duration && duration > 180) {
    warnings.push("Vídeos com mais de 3 minutos podem não ser aceitos como Shorts/Reels.");
  }

  if (aspectRatio && !["9:16", "vertical"].includes(aspectRatio)) {
    warnings.push("Seu vídeo não está em formato vertical. Isso pode reduzir o desempenho.");
  }

  return { warnings, errors };
}
