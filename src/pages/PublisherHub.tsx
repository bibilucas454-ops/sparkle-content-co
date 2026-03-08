import { useState, useRef, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Play, Send, Clock, Youtube, Instagram, CheckCircle2,
  AlertCircle, Loader2, ExternalLink, Trash2, Link2, Save,
  ChevronDown, Info, RotateCcw, FileVideo,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  publishToYouTube,
  publishToInstagram,
  publishToTikTok,
  validateVideoForPlatforms,
  type PublishPayload,
} from "@/services/platformServices";

const PLATFORMS = [
  { id: "youtube", label: "YouTube Shorts", icon: Youtube, color: "text-red-500" },
  { id: "instagram", label: "Instagram Reels", icon: Instagram, color: "text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: Play, color: "text-cyan-400" },
];

type PubStatus = "pendente" | "enviando" | "processando" | "publicado" | "erro";

const STATUS_CONFIG: Record<PubStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pendente: { label: "Pendente", icon: Clock, className: "text-muted-foreground" },
  enviando: { label: "Enviando", icon: Loader2, className: "text-warning animate-spin" },
  processando: { label: "Processando", icon: Loader2, className: "text-accent animate-spin" },
  publicado: { label: "Publicado", icon: CheckCircle2, className: "text-green-500" },
  erro: { label: "Erro", icon: AlertCircle, className: "text-destructive" },
};

interface PlatformSettings {
  youtube: { title: string; description: string; privacy: string };
  instagram: { caption: string; useGlobalHashtags: boolean };
  tiktok: { caption: string; useGlobalHashtags: boolean };
}

interface VideoMeta {
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
}

export default function PublisherHub() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState("");

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    youtube: { title: "", description: "", privacy: "public" },
    instagram: { caption: "", useGlobalHashtags: true },
    tiktok: { caption: "", useGlobalHashtags: true },
  });

  const [publishing, setPublishing] = useState(false);
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, { status: PubStatus; url?: string; error?: string }>>({});
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    const { data } = await supabase
      .from("social_accounts")
      .select("platform");
    if (data) setConnectedAccounts(data.map((a) => a.platform));
  };

  const handleVideoMeta = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const ar = h > w ? "9:16" : w > h ? "16:9" : "1:1";
    setVideoMeta({
      duration: Math.round(video.duration),
      width: w,
      height: h,
      aspectRatio: ar,
    });
  }, []);

  const processVideoFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Selecione um arquivo de vídeo.");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("O vídeo deve ter no máximo 500MB.");
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setUploadProgress(0);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processVideoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processVideoFile(file);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Validation checklist
  const validationChecks = [
    { label: "Vídeo enviado", ok: !!videoFile },
    { label: "Título preenchido", ok: title.trim().length > 0 },
    { label: "Pelo menos uma plataforma selecionada", ok: selectedPlatforms.length > 0 },
    {
      label: "Conta conectada para plataformas selecionadas",
      ok: selectedPlatforms.length === 0 || selectedPlatforms.some((p) => connectedAccounts.includes(p)),
      warning: true,
    },
    {
      label: "Formato compatível (MP4, MOV)",
      ok: !videoFile || ["video/mp4", "video/quicktime", "video/webm"].includes(videoFile.type),
    },
    {
      label: "Proporção vertical recomendada",
      ok: !videoMeta || videoMeta.aspectRatio === "9:16",
      warning: true,
    },
    {
      label: "Duração dentro do recomendado (≤ 180s)",
      ok: !videoMeta || videoMeta.duration <= 180,
      warning: true,
    },
  ];

  const hasErrors = validationChecks.some((c) => !c.ok && !(c as any).warning);
  const hasWarnings = validationChecks.some((c) => !c.ok && (c as any).warning);

  const handleSaveDraft = async () => {
    if (!user) return;
    const { error } = await supabase.from("drafts").insert({
      user_id: user.id,
      title,
      caption,
      hashtags,
      cta,
      selected_platforms: selectedPlatforms,
      scheduled_for: scheduledFor || null,
    });
    if (error) {
      toast.error("Falha ao salvar rascunho.");
    } else {
      toast.success("Rascunho salvo.");
    }
  };

  const handlePublish = async (schedule: boolean) => {
    if (!videoFile) { toast.error("Envie um vídeo primeiro."); return; }
    if (!title.trim()) { toast.error("Preencha o título antes de continuar."); return; }
    if (selectedPlatforms.length === 0) { toast.error("Selecione pelo menos uma plataforma."); return; }
    if (schedule && !scheduledFor) { toast.error("Selecione a data de agendamento."); return; }

    setPublishing(true);
    const statuses: Record<string, { status: PubStatus; url?: string; error?: string }> = {};
    selectedPlatforms.forEach((p) => { statuses[p] = { status: "enviando" }; });
    setPlatformStatuses({ ...statuses });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 90));
      }, 300);

      // 1. Upload video
      const filePath = `${user!.id}/${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, videoFile);
      if (uploadError) throw uploadError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 2. Upload thumbnail
      let thumbnailPath: string | null = null;
      if (thumbnailFile) {
        thumbnailPath = `${user!.id}/thumbs/${Date.now()}-${thumbnailFile.name}`;
        await supabase.storage.from("thumbnails").upload(thumbnailPath, thumbnailFile);
      }

      // 3. Create upload record
      const { data: uploadRecord, error: uploadRecError } = await supabase
        .from("uploads")
        .insert({
          user_id: user!.id,
          file_path: filePath,
          file_name: videoFile.name,
          mime_type: videoFile.type,
          size_bytes: videoFile.size,
          duration_seconds: videoMeta?.duration ?? null,
          aspect_ratio: videoMeta?.aspectRatio ?? null,
          thumbnail_path: thumbnailPath,
        })
        .select()
        .single();
      if (uploadRecError) throw uploadRecError;

      // 4. Create publication
      const { data: publication, error: pubError } = await supabase
        .from("publications")
        .insert({
          user_id: user!.id,
          upload_id: uploadRecord.id,
          title,
          caption,
          hashtags,
          cta,
          thumbnail_path: thumbnailPath,
          scheduled_for: schedule ? scheduledFor : null,
          overall_status: schedule ? "pendente" : "enviando",
        })
        .select()
        .single();
      if (pubError) throw pubError;

      // 5. Create targets and publish
      const publishers: Record<string, (p: PublishPayload) => Promise<void>> = {
        youtube: publishToYouTube,
        instagram: publishToInstagram,
        tiktok: publishToTikTok,
      };

      for (const platform of selectedPlatforms) {
        const settings = platformSettings[platform as keyof PlatformSettings];

        const { data: target, error: targetError } = await supabase
          .from("publication_targets")
          .insert({
            publication_id: publication.id,
            platform,
            status: "pendente",
            platform_specific_title: (settings as any)?.title || null,
            platform_specific_caption: (settings as any)?.caption || null,
            privacy_status: (settings as any)?.privacy || "public",
          })
          .select()
          .single();

        if (targetError || !target) {
          statuses[platform] = { status: "erro", error: "Falha ao criar registro." };
          setPlatformStatuses({ ...statuses });
          continue;
        }

        if (!schedule) {
          // Publish (mock)
          const videoUrl = supabase.storage.from("videos").getPublicUrl(filePath).data.publicUrl;
          const payload: PublishPayload = {
            publicationTargetId: target.id,
            platform,
            videoUrl,
            title,
            caption,
            hashtags,
          };

          statuses[platform] = { status: "enviando" };
          setPlatformStatuses({ ...statuses });

          try {
            await publishers[platform]?.(payload);
            // Re-fetch target to get final status
            const { data: updatedTarget } = await supabase
              .from("publication_targets")
              .select("status, platform_post_url, error_message")
              .eq("id", target.id)
              .single();

            if (updatedTarget) {
              statuses[platform] = {
                status: updatedTarget.status as PubStatus,
                url: updatedTarget.platform_post_url ?? undefined,
                error: updatedTarget.error_message ?? undefined,
              };
            }
          } catch {
            statuses[platform] = { status: "erro", error: "Falha na publicação." };
          }
          setPlatformStatuses({ ...statuses });
        }
      }

      toast.success(schedule ? "Publicação agendada com sucesso!" : "Publicação iniciada.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao publicar.");
      selectedPlatforms.forEach((p) => {
        statuses[p] = { status: "erro", error: err.message };
      });
      setPlatformStatuses({ ...statuses });
    } finally {
      setPublishing(false);
    }
  };

  const clearForm = () => {
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoMeta(null);
    setThumbnailFile(null);
    setThumbnailPreviewUrl(null);
    setTitle("");
    setCaption("");
    setHashtags("");
    setCta("");
    setSelectedPlatforms([]);
    setScheduledFor("");
    setPlatformStatuses({});
    setUploadProgress(0);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">
            Central de Publicação
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie um vídeo uma vez e publique em múltiplas plataformas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Upload + Preview */}
          <div className="lg:col-span-1 space-y-4">
            {/* Video Upload with Drag & Drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center p-8 min-h-[260px] ${
                dragging
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card hover:bg-secondary/30"
              }`}
            >
              {videoPreviewUrl ? (
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  onLoadedMetadata={handleVideoMeta}
                  className="w-full max-h-[320px] rounded-md object-contain"
                />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center font-medium">
                    Arraste seu vídeo aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Formatos aceitos: MP4, MOV
                  </p>
                  <p className="text-xs text-muted-foreground/40 mt-0.5">
                    Ideal para Shorts, Reels e TikTok: vídeo vertical
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleVideoSelect}
              />
            </div>

            {/* Upload progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="h-1.5" />
            )}

            {/* Video metadata */}
            {videoFile && (
              <div className="text-xs text-muted-foreground space-y-1 rounded-lg border border-border bg-card p-3">
                <p><span className="text-foreground/70">Arquivo:</span> {videoFile.name}</p>
                <p><span className="text-foreground/70">Tamanho:</span> {(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                <p><span className="text-foreground/70">Tipo:</span> {videoFile.type}</p>
                {videoMeta && (
                  <>
                    <p><span className="text-foreground/70">Duração:</span> {videoMeta.duration}s</p>
                    <p><span className="text-foreground/70">Resolução:</span> {videoMeta.width}×{videoMeta.height}</p>
                    <p><span className="text-foreground/70">Proporção:</span> {videoMeta.aspectRatio}</p>
                  </>
                )}
              </div>
            )}

            {/* Thumbnail Upload */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Miniatura (opcional)</label>
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="rounded-lg border border-dashed border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer flex items-center justify-center p-4 min-h-[80px]"
              >
                {thumbnailPreviewUrl ? (
                  <img src={thumbnailPreviewUrl} alt="Thumbnail" className="max-h-[80px] rounded object-contain" />
                ) : (
                  <p className="text-xs text-muted-foreground">Clique para enviar miniatura</p>
                )}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailSelect}
                />
              </div>
            </div>
          </div>

          {/* Right column: Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Metadata */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Título</label>
                <Input
                  placeholder="Ex: O erro que está travando seu crescimento"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Legenda</label>
                <Textarea
                  placeholder="Escreva a legenda principal do post"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="bg-secondary border-border min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Hashtags</label>
                  <Input
                    placeholder="#empreendedorismo #viral #reels"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">CTA (opcional)</label>
                  <Input
                    placeholder="Ex: Salve este vídeo para assistir depois"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Platform selectors */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Plataformas</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLATFORMS.map((p) => {
                    const selected = selectedPlatforms.includes(p.id);
                    const connected = connectedAccounts.includes(p.id);
                    const statusInfo = platformStatuses[p.id];
                    const StatusIcon = statusInfo ? STATUS_CONFIG[statusInfo.status]?.icon : null;

                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`rounded-lg border p-4 cursor-pointer transition-all ${
                          selected
                            ? "border-accent bg-accent/10"
                            : "border-border bg-secondary/30 hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <p.icon className={`w-5 h-5 ${selected ? p.color : "text-muted-foreground"}`} />
                          <span className="text-sm font-medium">{p.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${connected ? "text-green-500" : "text-muted-foreground"}`}>
                            {connected ? "Conectada" : "Não conectada"}
                          </span>
                          {!connected && (
                            <a
                              href="/publisher/accounts"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-accent hover:underline"
                            >
                              Conectar conta
                            </a>
                          )}
                        </div>
                        {statusInfo && StatusIcon && (
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                            <StatusIcon className={`w-3.5 h-3.5 ${STATUS_CONFIG[statusInfo.status].className}`} />
                            <span className={`text-xs ${STATUS_CONFIG[statusInfo.status].className}`}>
                              {STATUS_CONFIG[statusInfo.status].label}
                            </span>
                            {statusInfo.url && (
                              <a href={statusInfo.url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                                <ExternalLink className="w-3 h-3 text-accent" />
                              </a>
                            )}
                            {statusInfo.error && (
                              <span className="text-xs text-destructive ml-auto truncate max-w-[120px]">
                                {statusInfo.error}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Platform-specific settings */}
            {selectedPlatforms.length > 0 && (
              <Accordion type="single" collapsible className="rounded-lg border border-border bg-card">
                {selectedPlatforms.includes("youtube") && (
                  <AccordionItem value="youtube" className="border-border">
                    <AccordionTrigger className="px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        Ajustes YouTube Shorts
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Título específico</label>
                        <Input
                          placeholder="Título para YouTube (opcional)"
                          value={platformSettings.youtube.title}
                          onChange={(e) =>
                            setPlatformSettings((s) => ({ ...s, youtube: { ...s.youtube, title: e.target.value } }))
                          }
                          className="bg-secondary border-border text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Descrição curta</label>
                        <Textarea
                          placeholder="Descrição para YouTube (opcional)"
                          value={platformSettings.youtube.description}
                          onChange={(e) =>
                            setPlatformSettings((s) => ({ ...s, youtube: { ...s.youtube, description: e.target.value } }))
                          }
                          className="bg-secondary border-border text-sm min-h-[60px]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Privacidade</label>
                        <div className="flex gap-2">
                          {["public", "unlisted", "private"].map((opt) => (
                            <button
                              key={opt}
                              onClick={() =>
                                setPlatformSettings((s) => ({ ...s, youtube: { ...s.youtube, privacy: opt } }))
                              }
                              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                                platformSettings.youtube.privacy === opt
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-secondary text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {opt === "public" ? "Público" : opt === "unlisted" ? "Não listado" : "Privado"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {selectedPlatforms.includes("instagram") && (
                  <AccordionItem value="instagram" className="border-border">
                    <AccordionTrigger className="px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        Ajustes Instagram Reels
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Legenda específica</label>
                        <Textarea
                          placeholder="Legenda para Instagram (opcional)"
                          value={platformSettings.instagram.caption}
                          onChange={(e) =>
                            setPlatformSettings((s) => ({ ...s, instagram: { ...s.instagram, caption: e.target.value } }))
                          }
                          className="bg-secondary border-border text-sm min-h-[60px]"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Usar hashtags globais</label>
                        <Switch
                          checked={platformSettings.instagram.useGlobalHashtags}
                          onCheckedChange={(v) =>
                            setPlatformSettings((s) => ({ ...s, instagram: { ...s.instagram, useGlobalHashtags: v } }))
                          }
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {selectedPlatforms.includes("tiktok") && (
                  <AccordionItem value="tiktok" className="border-border">
                    <AccordionTrigger className="px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-cyan-400" />
                        Ajustes TikTok
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Legenda específica</label>
                        <Textarea
                          placeholder="Legenda para TikTok (opcional)"
                          value={platformSettings.tiktok.caption}
                          onChange={(e) =>
                            setPlatformSettings((s) => ({ ...s, tiktok: { ...s.tiktok, caption: e.target.value } }))
                          }
                          className="bg-secondary border-border text-sm min-h-[60px]"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Usar hashtags globais</label>
                        <Switch
                          checked={platformSettings.tiktok.useGlobalHashtags}
                          onCheckedChange={(v) =>
                            setPlatformSettings((s) => ({ ...s, tiktok: { ...s.tiktok, useGlobalHashtags: v } }))
                          }
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}

            {/* Validation checklist */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Checklist de Validação
              </h3>
              <div className="space-y-1.5">
                {validationChecks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {check.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (check as any).warning ? (
                      <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    )}
                    <span className={check.ok ? "text-muted-foreground" : (check as any).warning ? "text-warning" : "text-destructive"}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="text-sm text-muted-foreground mb-1.5 block">Agendar para (opcional)</label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="bg-secondary border-border max-w-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => handlePublish(false)}
                disabled={publishing || hasErrors}
                variant="glow"
                size="lg"
                className="flex-1 min-w-[140px]"
              >
                {publishing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Publicar Agora</>
                )}
              </Button>
              <Button
                onClick={() => handlePublish(true)}
                disabled={publishing || hasErrors}
                variant="outline"
                size="lg"
                className="flex-1 min-w-[140px]"
              >
                <Clock className="w-4 h-4" /> Agendar Publicação
              </Button>
              <Button variant="outline" size="lg" onClick={handleSaveDraft}>
                <Save className="w-4 h-4" /> Salvar Rascunho
              </Button>
              <Button variant="ghost" size="lg" onClick={clearForm}>
                <Trash2 className="w-4 h-4" /> Limpar
              </Button>
            </div>

            {/* Publication status */}
            <AnimatePresence>
              {Object.keys(platformStatuses).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-border bg-card p-4 space-y-2"
                >
                  <h3 className="text-sm font-medium text-foreground mb-2">Status de Publicação</h3>
                  {Object.entries(platformStatuses).map(([platform, info]) => {
                    const cfg = STATUS_CONFIG[info.status];
                    const platInfo = PLATFORMS.find((p) => p.id === platform);
                    return (
                      <div
                        key={platform}
                        className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          {platInfo && <platInfo.icon className={`w-4 h-4 ${platInfo.color}`} />}
                          <span>{platInfo?.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {info.error && (
                            <span className="text-xs text-destructive max-w-[180px] truncate">{info.error}</span>
                          )}
                          {info.url && (
                            <a href={info.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 text-accent" />
                            </a>
                          )}
                          <cfg.icon className={`w-3.5 h-3.5 ${cfg.className}`} />
                          <span className={`text-xs ${cfg.className}`}>{cfg.label}</span>
                          {info.status === "erro" && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                              <RotateCcw className="w-3 h-3" /> Tentar novamente
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
