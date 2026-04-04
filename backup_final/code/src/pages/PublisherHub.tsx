import { useState, useRef, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSmartSchedule } from "@/hooks/useSmartSchedule";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Play, Send, Clock, Youtube, Instagram, CheckCircle2,
  AlertCircle, Loader2, ExternalLink, Trash2, Save, X, ImageIcon,
  Search, Flame, PlayCircle, PauseCircle, TrendingUp, Sparkles, Music,
  Volume2, RotateCcw
} from "lucide-react";

const RECOMMENDED_SCHEDULES = [
  { time: "10:00", label: "Manhã", icon: "☀️", isMorning: true },
  { time: "12:00 - 14:00", label: "Almoço", icon: "🍽️", isMorning: false },
  { time: "18:00 - 22:00", label: "Noite", icon: "🌙", isMorning: false },
  { time: "02:00 - 03:00", label: "Madrugada", icon: "🌌", isMorning: false },
];

let morningScheduleIndex = 0;
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "youtube", label: "YouTube Shorts", icon: Youtube, color: "text-red-500" },
];

const CONTENT_FORMATS = [
  { id: "reels", label: "Reels", icon: PlayCircle },
  { id: "carousel", label: "Carrossel", icon: ImageIcon },
  { id: "story", label: "Story", icon: Flame },
] as const;

type ContentFormat = typeof CONTENT_FORMATS[number]["id"];

type PubStatus = "pendente" | "draft" | "ready" | "scheduled" | "queued" | "processing" | "published" | "failed" | "retrying" | "cancelled" | "enviando" | "erro";

const STATUS_CONFIG: Record<PubStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pendente: { label: "Agendado", icon: Clock, className: "text-text-secondary" },
  draft: { label: "Rascunho", icon: Save, className: "text-text-secondary" },
  ready: { label: "Pronto", icon: CheckCircle2, className: "text-primary" },
  scheduled: { label: "Cronometrado", icon: Clock, className: "text-amber-400" },
  queued: { label: "Na Fila", icon: Clock, className: "text-primary" },
  processing: { label: "Processando", icon: Loader2, className: "text-primary animate-spin" },
  published: { label: "Publicado", icon: CheckCircle2, className: "text-green-400" },
  failed: { label: "Falha", icon: AlertCircle, className: "text-red-400" },
  retrying: { label: "Tentando Novamente", icon: Loader2, className: "text-amber-400 animate-spin" },
  cancelled: { label: "Cancelado", icon: X, className: "text-text-secondary" },
  enviando: { label: "Enviando", icon: Loader2, className: "text-amber-400 animate-spin" },
  erro: { label: "Erro Crítico", icon: AlertCircle, className: "text-red-400" },
};

interface PlatformSettings {
  youtube: { title: string; description: string; privacy: string };
  instagram: { caption: string; useGlobalHashtags: boolean };
}

interface MediaFile {
  id: string;
  file: File;
  previewUrl: string;
  type: string; // 'video/mp4' or 'image/jpeg'
}

export default function PublisherHub() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [instagramTitle, setInstagramTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>("reels");
  const [scheduledFor, setScheduledFor] = useState("");

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    youtube: { title: "", description: "", privacy: "public" },
    instagram: { caption: "", useGlobalHashtags: true },
  });

  const [approved, setApproved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, { status: PubStatus; url?: string; error?: string; jobId?: string }>>({});
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  // Music state
  const [selectedMusic, setSelectedMusic] = useState<{title: string; artist: string; preview_url?: string; source_platform?: string} | null>(null);
  const [musicSearch, setMusicSearch] = useState("");
  const [trendingSounds, setTrendingSounds] = useState<any[]>([]);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Audio file upload state
  const [audioFile, setAudioFile] = useState<{id: string; file: File; name: string; previewUrl: string} | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Smart Schedule
  const { suggestion: smartSuggestion, loading: smartLoading, applySuggestion } = useSmartSchedule(selectedFormat);

  useEffect(() => {
    clearForm();
    fetchConnectedAccounts();
    fetchTrendingSounds();
  }, []);

  const fetchConnectedAccounts = async () => {
    const { data } = await supabase.from("social_tokens").select("platform");
    const active = data?.map((d: any) => d.platform) || [];
    setConnectedAccounts(active);
  };

  const fetchTrendingSounds = async () => {
    setLoadingTrending(true);
    try {
      const { data, error } = await supabase
        .from("music_catalog")
        .select("id, title, artist, source_platform, trend_score, usage_count, is_trending, category")
        .eq("is_active", true)
        .order("trend_score", { ascending: false })
        .limit(15);
      
      if (!error && data) {
        setTrendingSounds(data);
      }
    } catch (err) {
      console.error("Error fetching trending sounds:", err);
    } finally {
      setLoadingTrending(false);
    }
  };

  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      fetchTrendingSounds();
      return;
    }
    setLoadingTrending(true);
    try {
      const { data, error } = await supabase
        .from("music_catalog")
        .select("id, title, artist, source_platform, trend_score, usage_count, is_trending, category")
        .eq("is_active", true)
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
        .order("trend_score", { ascending: false })
        .limit(15);
      
      if (!error && data) {
        setTrendingSounds(data);
      }
    } catch (err) {
      console.error("Error searching music:", err);
    } finally {
      setLoadingTrending(false);
    }
  };

  const selectMusic = (sound: any) => {
    setSelectedMusic({
      title: sound.title,
      artist: sound.artist,
      preview_url: sound.preview_url,
      source_platform: sound.source_platform
    });
    setShowMusicPanel(false);
    toast.success(`🎵 Música selecionada: ${sound.title}`);
  };

  const removeMusic = () => {
    setSelectedMusic(null);
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith("audio/")) {
      toast.error("Apenas arquivos de áudio são permitidos (MP3, WAV, etc)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo de áudio muito grande (Max 50MB)");
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    setAudioFile({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      previewUrl
    });
    toast.success(`🎵 Áudio carregado: ${file.name}`);
  };

  const removeAudioFile = () => {
    if (audioFile?.previewUrl) {
      URL.revokeObjectURL(audioFile.previewUrl);
    }
    setAudioFile(null);
  };

  const uploadAudioFile = async (): Promise<string | null> => {
    if (!audioFile || !user) return null;
    
    setUploadingAudio(true);
    try {
      const filePath = `${user.id}/audio/${Date.now()}-${audioFile.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("videos").upload(filePath, audioFile.file);
      if (uploadError) throw uploadError;

      const { data: uploadRecord, error: uploadRecError } = await supabase.from("uploads").insert({
        user_id: user.id,
        file_path: filePath,
        file_name: audioFile.file.name,
        mime_type: audioFile.file.type,
        size_bytes: audioFile.file.size,
      }).select().single();

      if (uploadRecError) throw uploadRecError;
      return uploadRecord.id;
    } catch (err: any) {
      console.error("Error uploading audio:", err);
      toast.error("Erro ao fazer upload do áudio");
      return null;
    } finally {
      setUploadingAudio(false);
    }
  };

  const processFiles = (files: FileList | File[]) => {
    const newMedia: MediaFile[] = [];
    for (const file of Array.from(files)) {
      if (mediaFiles.length + newMedia.length >= 10) {
        toast.error("Máximo de 10 mídias permitido.");
        break;
      }
      if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) {
        toast.error(`Formato não suportado: ${file.name}`);
        continue;
      }
      if (file.size > 500 * 1024 * 1024) {
        toast.error(`Arquivo muito grande (Max 500MB): ${file.name}`);
        continue;
      }
      newMedia.push({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type
      });
    }
    setMediaFiles(prev => [...prev, ...newMedia]);
    setUploadProgress(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const removeMedia = (idToRemove: string) => {
    setMediaFiles(prev => {
      const filtered = prev.filter(m => m.id !== idToRemove);
      // Optional: revoke object url to save memory
      return filtered;
    });
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleFormatChange = (formatId: ContentFormat) => {
    setSelectedFormat(formatId);
    // Auto-remove YouTube if format is not Reels (YouTube only supports Shorts/Reels in this context)
    if (formatId !== "reels") {
      setSelectedPlatforms(prev => prev.filter(p => p !== "youtube"));
    }
  };

  // Validation checklist
  const validationChecks = [
    { label: "Mídia(s) selecionada(s)", ok: mediaFiles.length > 0 },
    { label: "Título preenchido", ok: title.trim().length > 0 },
    { label: "Pelo menos uma plataforma selecionada", ok: selectedPlatforms.length > 0 },
    {
      label: "Conta conectada para as plataformas selecionadas",
      ok: selectedPlatforms.length === 0 || selectedPlatforms.every((p) => connectedAccounts.includes(p)),
      warning: true,
    },
    {
      label: "YouTube não suporta carrossel ou stories",
      ok: !(selectedPlatforms.includes('youtube') && (selectedFormat !== "reels" || mediaFiles.length > 1)),
    },
    {
      label: "Limite de 10 mídias respeitado",
      ok: mediaFiles.length <= 10,
    }
  ];

  const hasErrors = validationChecks.some((c) => !c.ok && !(c as any).warning);

  const handlePublish = async (schedule: boolean) => {
    if (hasErrors) { toast.error("Corrija os erros na lista de validação."); return; }
    if (schedule && !scheduledFor) { toast.error("Selecione a data de agendamento."); return; }

    setPublishing(true);
    const statuses: Record<string, { status: PubStatus; error?: string; jobId?: string }> = {};
    selectedPlatforms.forEach((p) => { statuses[p] = { status: "enviando" }; });
    setPlatformStatuses({ ...statuses });

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 95));
      }, 500);

      const uploadRecords = [];

      // 1. Upload All files (video/image)
      for (const m of mediaFiles) {
        const filePath = `${user!.id}/${Date.now()}-${m.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("videos").upload(filePath, m.file);
        if (uploadError) throw uploadError;

        const { data: uploadRecord, error: uploadRecError } = await supabase.from("uploads").insert({
          user_id: user!.id,
          file_path: filePath,
          file_name: m.file.name,
          mime_type: m.file.type,
          size_bytes: m.file.size,
        }).select().single();

        if (uploadRecError) throw uploadRecError;
        uploadRecords.push(uploadRecord);
      }

      // 1b. Upload audio file if present (for Story with music)
      let audioUploadId: string | null = null;
      if (selectedFormat === "story" && audioFile) {
        audioUploadId = await uploadAudioFile();
        if (!audioUploadId) {
          throw new Error("Falha ao upload do arquivo de áudio");
        }
        toast.success("🎵 Áudio processado com sucesso!");
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 2. Create publication - preserve local time correctly
      let scheduledDateTime: string | null = null;
      if (schedule && scheduledFor) {
        const [datePart, timePart] = scheduledFor.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        scheduledDateTime = localDate.toISOString();
      }
      
      const { data: publication, error: pubError } = await supabase.from("publications").insert({
        user_id: user!.id,
        upload_id: uploadRecords[0].id,
        title, caption, hashtags, cta,
        content_format: selectedFormat,
        scheduled_for: scheduledDateTime,
        overall_status: schedule ? "pendente" : (approved ? "queued" : "draft"),
        approval_status: approved ? "approved" : "draft",
        music_metadata: selectedMusic ? {
          title: selectedMusic.title,
          artist: selectedMusic.artist,
          preview_url: selectedMusic.preview_url,
          source_platform: selectedMusic.source_platform,
          format_compatibility: selectedFormat === "story" ? "full" : "recommendation"
        } : null,
      }).select().single();
      if (pubError) throw pubError;

      // 3. Link multiple media (post_media)
      const postMediaInserts = uploadRecords.map((up, index) => ({
        publication_id: publication.id,
        upload_id: up.id,
        sort_order: index,
        media_type: up.mime_type.startsWith("video") ? "video" : "image"
      }));
      const { error: pmError } = await supabase.from("post_media").insert(postMediaInserts);
      if (pmError) throw pmError;

      // 3b. Save music selection
      if (selectedMusic) {
        const { error: musicError } = await supabase.from("content_music").insert({
          publication_id: publication.id,
          user_id: user!.id,
          title: selectedMusic.title,
          artist: selectedMusic.artist,
          source_platform: selectedMusic.source_platform,
          preview_url: selectedMusic.preview_url,
        });
        if (musicError) {
          console.warn("Music save warning:", musicError);
        }
      }

      // 4. Create targets and queued jobs
      for (const platform of selectedPlatforms) {
        const settings = platformSettings[platform as keyof PlatformSettings];

        // Define Target
        const { data: target, error: targetError } = await supabase.from("publication_targets").insert({
          publication_id: publication.id,
          platform,
          status: schedule ? "pendente" : "queued",
          platform_specific_title: (settings as any)?.title || null,
          platform_specific_caption: (settings as any)?.caption || null,
          privacy_status: (settings as any)?.privacy || "public",
        }).select().single();
        if (targetError || !target) throw targetError;

        // Define Job for the Background Worker (Only if approved or scheduled)
        let jobDate: Date;
        if (schedule && scheduledFor) {
          const [datePart, timePart] = scheduledFor.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes] = timePart.split(':').map(Number);
          jobDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        } else {
          jobDate = new Date();
        }
        const initialStatus = schedule ? "scheduled" : (approved ? "ready" : "draft");
        
        const { data: job, error: jobError } = await supabase.from("publication_jobs").insert({
          publication_target_id: target.id,
          run_at: jobDate.toISOString(),
          status: initialStatus
        }).select("id").single();
        if (jobError) throw jobError;

        statuses[platform] = { status: initialStatus as PubStatus, jobId: job?.id };
        if (initialStatus === "ready" && job?.id) {
          pollJobStatus(job.id, platform);
        }
      }

      setPlatformStatuses({ ...statuses });
      toast.success(schedule ? "Publicação agendada com sucesso!" : "Post enviado para a fila do motor. Aguarde o processamento no Histórico.");

      setTimeout(() => {
        clearForm();
      }, 3000);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao enviar a publicação.");
      selectedPlatforms.forEach((p) => { statuses[p] = { status: "erro", error: err.message }; });
      setPlatformStatuses({ ...statuses });
    } finally {
      setPublishing(false);
    }
  };

  const cancelJob = async (id: string, platform: string) => {
    try {
      const { error } = await supabase
        .from("publication_jobs")
        .update({ status: "cancelled" })
        .eq("id", id);
      
      if (error) throw error;
      
      setPlatformStatuses(prev => ({
        ...prev,
        [platform]: { ...prev[platform], status: "erro", error: "Publicação cancelada pelo usuário." }
      }));
      toast.success("Publicação cancelada.");
    } catch (err: any) {
      toast.error("Erro ao cancelar: " + err.message);
    }
  };

  const pollJobStatus = useCallback(async (jobId: string, platform: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 2.5 minutes total (5s * 30)
    
    const interval = setInterval(async () => {
      attempts++;
      const { data, error } = await supabase
        .from("publication_jobs")
        .select("status, last_error")
        .eq("id", jobId)
        .single();
      
      if (error || !data) {
        clearInterval(interval);
        return;
      }

      const currentStatus = data.status as PubStatus;
      setPlatformStatuses(prev => ({
        ...prev,
        [platform]: { 
          status: currentStatus,
          error: data.last_error as string,
          jobId: jobId // ensure it's preserved
        }
      }));

      if (currentStatus === "published" || currentStatus === "failed" || currentStatus === "cancelled" || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 5000);
  }, []);

  const clearForm = () => {
    setMediaFiles([]);
    setTitle("");
    setInstagramTitle("");
    setCaption("");
    setHashtags("");
    setCta("");
    setSelectedPlatforms([]);
    setSelectedFormat("reels");
    setScheduledFor("");
    setPlatformStatuses({});
    setUploadProgress(0);
    setSelectedMusic(null);
    setShowMusicPanel(false);
    setMusicSearch("");
    setApproved(false);
    setAudioFile(null);
    setPlatformSettings({
      youtube: { title: "", description: "", privacy: "public" },
      instagram: { caption: "", useGlobalHashtags: true },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="pb-6 border-b border-border/60">
          <h1 className="text-3xl md:text-4xl font-black font-display text-text-primary tracking-tighter">
            Publicar
          </h1>
          <p className="text-text-secondary mt-2 text-sm md:text-base font-medium">
            Prepare e distribua seu conteúdo para todas as plataformas.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8">
          {/* COLUNA ESQUERDA - Conteúdo Principal */}
          <div className="space-y-6 max-w-3xl">
            {/* Upload de Mídia */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`premium-card p-10 min-h-[220px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center ${
                dragging ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/50 hover:bg-secondary/20"
              }`}
            >
              <Upload className="w-10 h-10 text-text-secondary mb-3" />
              <p className="text-base text-text-secondary text-center font-medium">
                Arraste mídias aqui ou clique (Até 10)
              </p>
              <p className="text-sm text-text-muted mt-2">
                MP4, JPEG, PNG
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/mp4,video/quicktime,image/jpeg,image/png"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="h-2" />
            )}

            {/* Miniaturas */}
            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {mediaFiles.map((media, i) => (
                  <div key={media.id} className="relative group w-[100px] h-[130px] rounded-lg border border-border overflow-hidden bg-black/50">
                    {media.type.startsWith('video') ? (
                      <video src={media.previewUrl} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <img src={media.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-black/70 px-1.5 rounded text-[10px] uppercase font-bold text-white/90">
                      {i + 1}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMedia(media.id); }}
                      className="absolute top-1.5 right-1.5 bg-destructive/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Audio Upload for Story */}
            {selectedFormat === "story" && (
              <div className="premium-card p-4 space-y-3 border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                  <Music className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Áudio para Story</h3>
                </div>
                
                {!audioFile ? (
                  <div
                    onClick={() => audioFileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/60 rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-secondary/20 transition-all text-center"
                  >
                    <Volume2 className="w-6 h-6 text-text-secondary mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">
                      Clique para adicionar arquivo de áudio (MP3, WAV)
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      O áudio será mesclado ao vídeo automaticamente
                    </p>
                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleAudioFileSelect}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                          {audioFile.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {uploadingAudio ? "Enviando..." : "Pronto para mesclar"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeAudioFile}
                      className="text-destructive hover:bg-destructive/10 rounded-full p-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Campos de Conteúdo */}
            <div className="premium-card p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em] mb-2.5 block">Título Interno</label>
                <Input
                  placeholder="Ex: Carrossel sobre Hábitos"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary/50 border-border h-11 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em] mb-2.5 block">Título para Instagram</label>
                <Input
                  placeholder="Título que aparecerá no Instagram"
                  value={instagramTitle}
                  onChange={(e) => setInstagramTitle(e.target.value)}
                  className="bg-secondary/50 border-border h-11 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em] mb-2.5 block">Legenda Principal</label>
                <Textarea
                  placeholder="Escreva a legenda principal..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="bg-secondary/50 border-border min-h-[120px] rounded-lg text-text-primary font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em] mb-2.5 block">Hashtags</label>
                  <Input placeholder="#hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="bg-secondary/50 border-border h-10 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em] mb-2.5 block">CTA</label>
                  <Input placeholder="Call to action" value={cta} onChange={(e) => setCta(e.target.value)} className="bg-secondary/50 border-border h-10 text-sm" />
                </div>
              </div>
            </div>

            {/* Configurações Específicas por Plataforma */}
            {selectedPlatforms.length > 0 && (
              <div className="premium-card p-6 space-y-4">
                <h3 className="text-sm font-bold font-display flex items-center gap-2">
                  <Save className="w-4 h-4 text-primary" /> Configurações por Plataforma
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {selectedPlatforms.includes("youtube") && (
                    <AccordionItem value="youtube">
                      <AccordionTrigger className="text-xs py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Shorts
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-2">
                        <Input
                          placeholder="Título para YouTube"
                          value={platformSettings.youtube.title}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, youtube: { ...prev.youtube, title: e.target.value } }))}
                          className="bg-secondary text-sm"
                        />
                        <Textarea
                          placeholder="Descrição para YouTube"
                          value={platformSettings.youtube.description}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, youtube: { ...prev.youtube, description: e.target.value } }))}
                          className="bg-secondary text-sm min-h-[50px]"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {selectedPlatforms.includes("instagram") && (
                    <AccordionItem value="instagram">
                      <AccordionTrigger className="text-xs py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-2">
                        <Textarea
                          placeholder="Legenda específica para Instagram"
                          value={platformSettings.instagram.caption}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, instagram: { ...prev.instagram, caption: e.target.value } }))}
                          className="bg-secondary text-sm min-h-[50px]"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            )}

            {/* Histórico - sempre no final da coluna esquerda */}
            <div className="mt-8">
              <h2 className="text-xl font-black font-display text-gradient-primary flex items-center gap-2 tracking-tighter mb-4">
                <Clock className="w-5 h-5" /> Histórico
              </h2>
               <div className="premium-card p-6 text-center">
                <div className="max-w-md mx-auto space-y-2">
                   <Clock className="w-8 h-8 text-text-secondary mx-auto" />
                   <p className="text-text-secondary text-sm">Publicações recentes aparecerão aqui.</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - Painel de Controle (STICKY) */}
          <div className="lg:min-w-[420px]">
            <div className="sticky top-6 space-y-6">
              {/* BLOCO 1: CONFIGURAÇÃO - Formato + Plataformas juntos */}
              <div className="premium-card p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                  <PlayCircle className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Configuração</h3>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em]">Formato</label>
                  <div className="flex gap-2">
                    {CONTENT_FORMATS.map((f) => {
                      const isSelected = selectedFormat === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => handleFormatChange(f.id)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all text-sm flex-1 justify-center ${isSelected
                            ? "border-primary bg-primary/10 text-text-primary font-semibold"
                            : "border-border bg-secondary/30 text-text-secondary hover:text-text-primary hover:border-border/80 font-medium"
                          }`}
                        >
                          <f.icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-text-secondary"}`} />
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em]">Plataformas</label>
                  <div className="flex gap-2">
                    {PLATFORMS.map((p) => {
                      const isSelected = selectedPlatforms.includes(p.id);
                      const isConnected = connectedAccounts.includes(p.id);
                      const isYoutube = p.id === 'youtube';
                      
                      if (isYoutube && selectedFormat !== "reels") return null;

                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all text-sm flex-1 justify-center ${isSelected
                              ? "border-primary bg-primary/10 text-foreground font-semibold"
                              : "border-border bg-secondary/30 text-text-secondary hover:text-foreground font-medium"
                            }`}
                        >
                          <p.icon className={`w-4 h-4 ${isSelected ? p.color : "opacity-70"}`} />
                          <span>{p.label}</span>
                          {!isConnected && <span className="text-[10px] text-warning">!</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-text-muted italic">
                    * Carrosséis não vão para YouTube
                  </p>
                </div>
              </div>

              {/* BLOCO 2: HORÁRIOS */}
              <div className="premium-card p-6 bg-gradient-to-br from-primary/5 to-secondary/20 border-primary/20 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-bold text-foreground">Horários Recomendados</h3>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase">Métrica</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {RECOMMENDED_SCHEDULES.map((slot, i) => (
                    <div 
                      key={i} 
                      className="bg-card/60 border border-border/50 rounded-lg p-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                      onClick={() => {
                        const now = new Date();
                        let hours: number, minutes: number;
                        
                        if (slot.isMorning) {
                          hours = morningScheduleIndex % 2 === 0 ? 10 : 10;
                          minutes = morningScheduleIndex % 2 === 0 ? 0 : 30;
                          morningScheduleIndex++;
                        } else {
                          const [start] = slot.time.split(' - ');
                          [hours, minutes] = start.split(':').map(Number);
                        }
                        
                        const scheduleDate = new Date(now);
                        scheduleDate.setHours(hours, minutes, 0, 0);
                        if (scheduleDate <= now) scheduleDate.setDate(scheduleDate.getDate() + 1);
                        
                        const year = scheduleDate.getFullYear();
                        const month = String(scheduleDate.getMonth() + 1).padStart(2, '0');
                        const day = String(scheduleDate.getDate()).padStart(2, '0');
                        const hoursStr = String(scheduleDate.getHours()).padStart(2, '0');
                        const minsStr = String(scheduleDate.getMinutes()).padStart(2, '0');
                        const localDateTime = `${year}-${month}-${day}T${hoursStr}:${minsStr}`;
                        setScheduledFor(localDateTime);
                        toast.success(`${slot.icon} ${slot.isMorning ? `${hours}:${minsStr} - ${hours}:${minutes === 30 ? '30' : '00'}` : slot.time}`);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{slot.icon}</span>
                        <span className="text-[10px] font-bold text-text-secondary uppercase">{slot.label}</span>
                      </div>
                      <div className="text-sm font-black text-foreground font-mono">{slot.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCO 3: VALIDAÇÃO */}
              <div className="premium-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                  <AlertCircle className="w-5 h-5 text-text-secondary" />
                  <h3 className="text-base font-bold text-foreground">Validação</h3>
                </div>
                <div className="space-y-3">
                  {validationChecks.map((check, i) => (
                    <div key={i} className={`flex items-center gap-3 text-sm ${check.ok ? 'text-text-secondary' : (check as any).warning ? 'text-warning' : 'text-destructive'}`}>
                      {check.ok ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCO 4: AÇÃO - O mais importante visualmente */}
              <div className="premium-card p-6 space-y-5 border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-card">
                <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                  <Send className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Publicar Conteúdo</h3>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> Aprovação
                    </h4>
                    <p className="text-xs text-text-secondary">Autorizar publicação</p>
                  </div>
                  <Switch checked={approved} onCheckedChange={setApproved} />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em]">Agendar (opcional)</label>
                  
                  {smartSuggestion && !scheduledFor && (
                    <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-[0.1em]">Próximo Horário</span>
                      </div>
                      {smartSuggestion.lastPostFormatted ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">Último {selectedFormat}:</span>
                            <span className="font-mono font-semibold text-foreground">{smartSuggestion.lastPostFormatted}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">Próximo {selectedFormat}:</span>
                            <span className="font-mono font-bold text-primary">{smartSuggestion.nextPostFormatted}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary">
                          Primeiro {selectedFormat}: {smartSuggestion.nextPostFormatted}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const dateStr = applySuggestion();
                          if (dateStr) {
                            setScheduledFor(dateStr);
                            toast.success("Horário aplicado!");
                          }
                        }}
                        disabled={smartLoading}
                        className="w-full text-xs h-8"
                      >
                        {smartLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-2" />
                        )}
                        Aplicar próximo horário
                      </Button>
                    </div>
                  )}
                  
                  <Input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="bg-secondary border-border text-sm h-11"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => handlePublish(false)} disabled={publishing || hasErrors} variant="glow" className="flex-1 h-14 text-lg font-bold shadow-lg shadow-primary/25">
                    {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    <span className="ml-2">Publicar Agora</span>
                  </Button>
                  <Button onClick={() => handlePublish(true)} disabled={publishing || hasErrors} variant="outline" className="flex-1 h-14 text-lg font-bold">
                    <Clock className="w-5 h-5" />
                    <span className="ml-2">Agendar</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearForm} className="h-14 w-14">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Status */}
              <AnimatePresence>
                {Object.keys(platformStatuses).length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="premium-card p-5 space-y-3">
                    <h3 className="text-sm font-bold">Status</h3>
                    {Object.entries(platformStatuses).map(([platform, info]) => {
                      const cfg = STATUS_CONFIG[info.status] || STATUS_CONFIG.pendente;
                      return (
                        <div key={platform} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2.5">
                          <span className="text-xs capitalize font-bold">{platform}</span>
                          <div className="flex items-center gap-2">
                            <cfg.icon className={`w-3.5 h-3.5 ${cfg.className}`} />
                            <span className={`text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
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
      </div>
    </AppLayout>
  );
}
