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
  expires_at: string | null;
  status?: string;
  last_sync_at?: string | null;
  last_error?: string | null;
  last_error_code?: string | null;
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

  if (error) {
    console.error(`[Auth Error] ${platform}:`, error);
    let errorMessage = error.message || "Erro ao iniciar autenticação";
    
    // Attempt to extract detail from the error context (Edge Function body)
    try {
      if (error && typeof error === 'object' && 'context' in error) {
        const context = (error as any).context;
        // FunctionsHttpError often attaches the Response object as `context`
        if (context && typeof context.text === 'function') {
           const cloned = context.clone();
           const textData = await cloned.text();
           try {
             const jsonData = JSON.parse(textData);
             errorMessage += ` - Detalhes: ${jsonData.error || jsonData.message || textData}`;
             if (jsonData.missingSecret) {
               errorMessage += ` (Falta Secret: ${jsonData.missingSecret})`;
             }
           } catch {
             errorMessage += ` - Detalhes: ${textData}`;
           }
        } else if (context) {
          errorMessage += ` - Detalhes: ${JSON.stringify(context)}`;
        }
      }
    } catch (e) {
      console.warn("Could not parse error context", e);
    }
    
    throw new Error(errorMessage);
  }

  if (data?.url) {
    window.location.href = data.url;
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
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) throw new Error("Faça login primeiro.");

  const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-auth-callback`;

  const { data, error } = await supabase.functions.invoke("tiktok-auth-start", {
    body: { redirectUri: callbackUrl },
  });

  if (error) {
    console.error("[Auth Error] TikTok:", error);
    let errorMessage = error.message || "Erro ao iniciar autenticação TikTok";
    throw new Error(errorMessage);
  }

  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error("URL de autenticação TikTok não retornada");
  }
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
  const responseData = data as any;
  if (responseData && !responseData.success) {
    throw new Error(responseData.message || "Erro ao publicar");
  }
}

export async function retryPublication(targetId: string): Promise<void> {
  const { data: target, error: targetError } = await supabase
    .from("publication_targets")
    .select("*, publications(*), uploads(*)")
    .eq("id", targetId)
    .single();

  if (targetError || !target) {
    throw new Error("Target não encontrado");
  }

  const pub = target.publications;
  const upload = target.uploads;

  if (!pub || !upload) {
    throw new Error("Dados da publicação ou upload não encontrados");
  }

  const payload: PublishPayload = {
    publicationTargetId: targetId,
    platform: target.platform,
    uploadId: upload.id,
    videoUrl: upload.file_path ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/${upload.file_path}` : undefined,
    title: pub.title || "Sem título",
    caption: pub.caption,
    hashtags: pub.hashtags,
    privacyStatus: target.privacy_status || "public",
    platformSpecificTitle: target.platform_specific_title || undefined,
    platformSpecificCaption: target.platform_specific_caption || undefined,
  };

  await supabase
    .from("publication_targets")
    .update({ status: "pendente", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", targetId);

  await supabase.from("publication_logs").insert({
    publication_target_id: targetId,
    event: "retry",
    details: "Tentando publicar novamente",
  });

  await publishToPlatform(payload);
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

export type AccountStatus = "conectada" | "token_expirado" | "nao_conectada" | "erro" | "precisa_reautenticar" | "desconectada";

export function getAccountStatus(account: PlatformAccount | null): AccountStatus {
  if (!account) return "nao_conectada";
  
  if (account.status === 'needs_reauth') return "precisa_reautenticar";
  if (account.status === 'expired') return "token_expirado";
  if (account.status === 'error') return "erro";
  if (account.status === 'disconnected') return "desconectada";
  
  return "conectada";
}

export function getAccountStatusLabel(status: AccountStatus): string {
  const labels: Record<AccountStatus, string> = {
    conectada: "Conectada",
    token_expirado: "Token expirado",
    nao_conectada: "Não conectada",
    erro: "Erro de conexão",
    precisa_reautenticar: "Reautenticação necessária",
    desconectada: "Desconectada"
  };
  return labels[status];
}

export function getAccountStatusColor(status: AccountStatus): string {
  const colors: Record<AccountStatus, string> = {
    conectada: "text-green-500",
    token_expirado: "text-yellow-500",
    nao_conectada: "text-muted-foreground",
    erro: "text-red-500",
    precisa_reautenticar: "text-orange-500",
    desconectada: "text-muted-foreground"
  };
  return colors[status];
}
