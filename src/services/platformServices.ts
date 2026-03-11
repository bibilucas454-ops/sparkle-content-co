import { supabase } from "@/integrations/supabase/client";

// ============================================================
// Platform Service Layer — Real OAuth + Publish via Edge Functions
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
  uploadId: string;
  videoUrl?: string;
  title: string;
  caption: string | null;
  hashtags: string | null;
  privacyStatus?: string;
  platformSpecificTitle?: string;
  platformSpecificCaption?: string;
}

// ---------- OAuth Connect helpers ----------

async function initiateOAuth(platform: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) throw new Error("Faça login primeiro.");

  const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-callback`;

  const { data, error } = await supabase.functions.invoke("oauth-connect", {
    body: { platform, redirectUri: callbackUrl },
  });

  if (error) throw new Error(error.message || "Erro ao iniciar autenticação");
  if (data?.error) {
    if (data.missingSecret) {
      throw new Error(`Credencial ausente: ${data.missingSecret}. Configure nas variáveis de ambiente do Supabase (Edge Function Secrets).`);
    }
    throw new Error(data.error);
  }

  if (data?.url) {
    window.open(data.url, "_blank", "noopener,noreferrer");
  } else {
    throw new Error("URL de autenticação não retornada");
  }
}

export async function connectYouTubeAccount(): Promise<void> {
  return initiateOAuth("youtube");
}

export async function connectInstagramAccount(): Promise<void> {
  return initiateOAuth("instagram");
}

export async function connectTikTokAccount(): Promise<void> {
  return initiateOAuth("tiktok");
}

// ---------- Token Refresh ----------

export async function refreshPlatformToken(platform: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("refresh-token", {
    body: { platform },
  });

  if (error) throw new Error(error.message || "Erro ao atualizar token");
  if (data?.error) throw new Error(data.error);
}

// ---------- Publish helpers (real Edge Function calls) ----------

export async function publishToYouTube(payload: PublishPayload): Promise<void> {
  return publishToPlatform(payload);
}

export async function publishToInstagram(payload: PublishPayload): Promise<void> {
  return publishToPlatform(payload);
}

export async function publishToTikTok(payload: PublishPayload): Promise<void> {
  return publishToPlatform(payload);
}

async function publishToPlatform(payload: PublishPayload): Promise<void> {
  const { data, error } = await supabase.functions.invoke("publish-video", {
    body: {
      targetId: payload.publicationTargetId,
      platform: payload.platform,
      uploadId: payload.uploadId,
      title: payload.title,
      caption: payload.caption,
      hashtags: payload.hashtags,
      privacyStatus: payload.privacyStatus,
      platformSpecificTitle: payload.platformSpecificTitle,
      platformSpecificCaption: payload.platformSpecificCaption,
    },
  });

  if (error) throw new Error(error.message || "Erro ao publicar");
  if (data?.error) throw new Error(data.error);
}

export async function retryPublication(targetId: string, platform: string, payload: PublishPayload): Promise<void> {
  // Reset status
  await supabase
    .from("publication_targets")
    .update({ status: "pendente", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", targetId);

  await supabase.from("publication_logs").insert({
    publication_target_id: targetId,
    event: "retry",
    details: "Tentando publicar novamente",
  });

  await publishToPlatform({ ...payload, publicationTargetId: targetId });
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

// ---------- Account Status helpers ----------

export type AccountStatus = "conectada" | "token_expirado" | "nao_conectada";

export function getAccountStatus(account: PlatformAccount | null): AccountStatus {
  if (!account) return "nao_conectada";
  if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
    return "token_expirado";
  }
  return "conectada";
}

export function getAccountStatusLabel(status: AccountStatus): string {
  const labels: Record<AccountStatus, string> = {
    conectada: "Conectada",
    token_expirado: "Token expirado",
    nao_conectada: "Não conectada",
  };
  return labels[status];
}

export function getAccountStatusColor(status: AccountStatus): string {
  const colors: Record<AccountStatus, string> = {
    conectada: "text-green-500",
    token_expirado: "text-yellow-500",
    nao_conectada: "text-muted-foreground",
  };
  return colors[status];
}
