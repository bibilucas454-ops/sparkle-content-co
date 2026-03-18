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
  AlertCircle, Loader2, ExternalLink, Trash2, Save, X, Image as ImageIcon,
  Music, Search, Flame, PlayCircle, PauseCircle, TrendingUp
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: Play, color: "text-cyan-400" },
  { id: "youtube", label: "YouTube Shorts", icon: Youtube, color: "text-red-500" },
];

const CONTENT_FORMATS = [
  { id: "reels", label: "Reels", icon: PlayCircle },
  { id: "carousel", label: "Carrossel", icon: ImageIcon },
  { id: "story", label: "Story", icon: Flame },
] as const;

type ContentFormat = typeof CONTENT_FORMATS[number]["id"];

type PubStatus = "pendente" | "queued" | "enviando" | "processando" | "publicado" | "erro";

const STATUS_CONFIG: Record<PubStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pendente: { label: "Agendado", icon: Clock, className: "text-muted-foreground" },
  queued: { label: "Na Fila do Motor", icon: Clock, className: "text-blue-500" },
  enviando: { label: "Enviando", icon: Loader2, className: "text-warning animate-spin" },
  processando: { label: "Processando", icon: Loader2, className: "text-accent animate-spin" },
  publicado: { label: "Publicado", icon: CheckCircle2, className: "text-green-500" },
  erro: { label: "Erro na Fila", icon: AlertCircle, className: "text-destructive" },
};

interface PlatformSettings {
  youtube: { title: string; description: string; privacy: string };
  instagram: { caption: string; useGlobalHashtags: boolean };
  tiktok: { caption: string; useGlobalHashtags: boolean };
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
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>("reels");
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

  // Audio state
  const [selectedAudio, setSelectedAudio] = useState<{ id: string, title: string, artist: string, url: string } | null>(null);
  const [trendAudio, setTrendAudio] = useState<any[]>([]);
  const [audioSearch, setAudioSearch] = useState("");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchConnectedAccounts();
    fetchTrendAudio();
  }, []);

  const fetchTrendAudio = async () => {
    const { data } = await supabase
      .from("trends")
      .select("*")
      .order("trending_score", { ascending: false });
    if (data) {
      // For now, mapping from generic trends table if it contains audio-like content
      // Should ideally use a specialized audio table, but let's fulfill the viral/trend requirement
      setTrendAudio(data.filter(t => t.description?.toLowerCase().includes("áudio") || t.format === 'video'));
    }
  };

  const fetchConnectedAccounts = async () => {
    const { data } = await supabase.from("social_tokens").select("platform");
    const active = data?.map((d: any) => d.platform) || [];
    setConnectedAccounts(active);
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
    const statuses: Record<string, { status: PubStatus; error?: string }> = {};
    selectedPlatforms.forEach((p) => { statuses[p] = { status: "enviando" }; });
    setPlatformStatuses({ ...statuses });

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 95));
      }, 500);

      const uploadRecords = [];

      // 1. Upload All files
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

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 2. Create publication
      const { data: publication, error: pubError } = await supabase.from("publications").insert({
        user_id: user!.id,
        upload_id: uploadRecords[0].id, // fallback for legacy safety
        title, caption, hashtags, cta,
        content_format: selectedFormat,
        scheduled_for: schedule ? new Date(scheduledFor).toISOString() : null,
        overall_status: schedule ? "pendente" : "queued",
        music_metadata: selectedAudio ? {
          id: selectedAudio.id,
          title: selectedAudio.title,
          artist: selectedAudio.artist,
          url: selectedAudio.url
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

        // Define Job for the Background Worker
        const jobDate = schedule && scheduledFor ? new Date(scheduledFor) : new Date();
        const { error: jobError } = await supabase.from("publication_jobs").insert({
          publication_target_id: target.id,
          run_at: jobDate.toISOString(),
          status: "queued"
        });
        if (jobError) throw jobError;

        statuses[platform] = { status: schedule ? "pendente" : "queued" };
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

  const clearForm = () => {
    setMediaFiles([]);
    setTitle("");
    setCaption("");
    setHashtags("");
    setCta("");
    setSelectedPlatforms([]);
    setSelectedFormat("reels");
    setSelectedAudio(null);
    setScheduledFor("");
    setPlatformStatuses({});
    setUploadProgress(0);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="pb-8 border-b border-border/40">
          <h1 className="text-3xl md:text-4xl font-black font-display text-gradient-primary tracking-tighter">
            Central de Publicação
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg font-medium max-w-2xl">
            Mande carrosséis, fotos ou vídeos e deixe o Motor de Publicação assíncrono agir.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Upload + Preview */}
          <div className="lg:col-span-1 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`premium-card p-12 min-h-[240px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center ${
                dragging ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/50 hover:bg-secondary/20"
              }`}
            >
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center font-medium">
                Arraste mídias aqui ou clique (Até 10)
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1 mt-1">
                Formatos aceitos: MP4, JPEG, PNG
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
              <Progress value={uploadProgress} className="h-1.5" />
            )}

            {/* Media Miniatures (Horizontal / Wrap) */}
            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {mediaFiles.map((media, i) => (
                  <div key={media.id} className="relative group w-[100px] h-[140px] rounded-lg border border-border overflow-hidden bg-black/50">
                    {media.type.startsWith('video') ? (
                      <video src={media.previewUrl} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <img src={media.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    )}
                    <span className="absolute top-1 left-1 bg-black/70 px-1.5 rounded text-[10px] uppercase font-bold text-white/90">
                      {i + 1}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMedia(media.id); }}
                      className="absolute top-1 right-1 bg-destructive/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-1 right-1">
                      {media.type.startsWith('video') ? <Play className="w-4 h-4 text-white drop-shadow-md" /> : <ImageIcon className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="premium-card p-6 md:p-8 space-y-6">
              <div>
                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 block">Título Interno</label>
                <Input
                  placeholder="Ex: Carrossel sobre Hábitos"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 block">Legenda Principal</label>
                <Textarea
                  placeholder="Escreva a legenda principal do post..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="bg-secondary border-border min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 block">Hashtags</label>
                  <Input placeholder="#empreendedorismo #viral" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="bg-secondary/50 border-border/40" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 block">CTA (opcional)</label>
                  <Input placeholder="Salve este post para depois" value={cta} onChange={(e) => setCta(e.target.value)} className="bg-secondary/50 border-border/40" />
                </div>
              </div>
            </div>

            {/* Content Format Selection */}
            <div className="premium-card p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
                <PlayCircle className="w-5 h-5 text-primary" /> Formato do Conteúdo
              </h3>
              <div className="flex gap-3 flex-wrap">
                {CONTENT_FORMATS.map((f) => {
                  const isSelected = selectedFormat === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFormatChange(f.id)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all text-sm group relative ${isSelected
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/20"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-secondary/50"
                        }`}
                    >
                      <f.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isSelected ? "text-primary" : "opacity-70"}`} />
                      <span className="font-semibold">{f.label}</span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform Selection */}
            <div className="premium-card p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
                <ExternalLink className="w-5 h-5 text-primary" /> Distribuição Automática
              </h3>
              <div className="flex gap-3 flex-wrap">
                {PLATFORMS.map((p) => {
                  const isSelected = selectedPlatforms.includes(p.id);
                  const isConnected = connectedAccounts.includes(p.id);
                  const isYoutube = p.id === 'youtube';
                  
                  // Hide YouTube for Carrossel and Story formats
                  if (isYoutube && selectedFormat !== "reels") return null;

                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all text-sm group relative ${isSelected
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/20"
                          : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-secondary/50"
                        }`}
                    >
                      <p.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isSelected ? p.color : "opacity-70"}`} />
                      <span className="font-semibold">{p.label}</span>

                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}

                      {!isConnected && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-warning/90 text-[8px] text-black px-1 rounded uppercase font-bold tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Não Conectado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground/60 italic">
                {selectedFormat === "reels" 
                  ? "* Selecione uma ou mais plataformas. Carrosséis não são suportados no YouTube."
                  : `* Selecione canais de distribuição para seu ${selectedFormat}. YouTube Shorts não suporta este formato.`
                }
              </p>
            </div>

            {selectedPlatforms.length > 0 && (
              <div className="premium-card p-6 md:p-8 space-y-6">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <Save className="w-5 h-5 text-primary" /> Configurações Específicas
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {selectedPlatforms.includes("youtube") && (
                    <AccordionItem value="youtube">
                      <AccordionTrigger className="text-sm py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-500" /> YouTube Shorts
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-3">
                        <Input
                          placeholder="Título específico para YouTube"
                          value={platformSettings.youtube.title}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, youtube: { ...prev.youtube, title: e.target.value } }))}
                          className="bg-secondary"
                        />
                        <Textarea
                          placeholder="Descrição específica para YouTube"
                          value={platformSettings.youtube.description}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, youtube: { ...prev.youtube, description: e.target.value } }))}
                          className="bg-secondary min-h-[60px]"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {selectedPlatforms.includes("instagram") && (
                    <AccordionItem value="instagram">
                      <AccordionTrigger className="text-sm py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-500" /> Instagram {selectedFormat === "reels" ? "Reels" : selectedFormat === "carousel" ? "Carrossel" : "Story"}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-3">
                        <Textarea
                          placeholder="Legenda específica para Instagram"
                          value={platformSettings.instagram.caption}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, instagram: { ...prev.instagram, caption: e.target.value } }))}
                          className="bg-secondary min-h-[60px]"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {selectedPlatforms.includes("tiktok") && (
                    <AccordionItem value="tiktok">
                      <AccordionTrigger className="text-sm py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4 text-cyan-400" /> TikTok {selectedFormat === "reels" ? "Vídeo" : selectedFormat === "carousel" ? "Foto/Carrossel" : "Story"}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-3">
                        <Textarea
                          placeholder="Legenda específica para TikTok"
                          value={platformSettings.tiktok.caption}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, tiktok: { ...prev.tiktok, caption: e.target.value } }))}
                          className="bg-secondary min-h-[60px]"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            )}

            {/* Audio Module */}
            <div className="premium-card p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
                <Music className="w-5 h-5 text-primary" /> Música / Áudio do Post
              </h3>

              <div className="space-y-4">
                {selectedAudio ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none">{selectedAudio.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{selectedAudio.artist}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedAudio(null)} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar áudio ou artista..."
                        value={audioSearch}
                        onChange={(e) => setAudioSearch(e.target.value)}
                        className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500 fill-current" /> Tendências Virais
                      </h4>
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {trendAudio.length > 0 ? (
                          trendAudio.map((track) => (
                            <div
                              key={track.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-transparent hover:border-border/50 hover:bg-secondary/40 transition-all group cursor-pointer"
                              onClick={() => setSelectedAudio({
                                id: track.id,
                                title: track.topic,
                                artist: track.category || "Trend Viral",
                                url: "" // Would be track.url
                              })}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-black/20 rounded shadow-inner group-hover:bg-primary/10 transition-colors">
                                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-foreground leading-tight">{track.topic}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{track.category}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded italic">
                                  SCORE: {track.trending_score}
                                </span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <PlayCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-muted-foreground text-center py-4 italic">Nenhum áudio de tendência no momento.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Validation checklist */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" /> Validação do Post
              </h3>
              <div className="space-y-1.5">
                {validationChecks.map((check, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${check.ok ? 'text-muted-foreground' : (check as any).warning ? 'text-warning' : 'text-destructive'}`}>
                    {check.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <label className="text-sm text-muted-foreground mb-1.5 block">Agendar para (Opcional - Motor Assíncrono)</label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="bg-secondary border-border max-w-xs"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => handlePublish(false)} disabled={publishing || hasErrors} variant="glow" size="lg" className="flex-1 min-w-[140px]">
                {publishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando Fila...</> : <><Send className="w-4 h-4" /> Enviar Agora</>}
              </Button>
              <Button onClick={() => handlePublish(true)} disabled={publishing || hasErrors} variant="outline" size="lg" className="flex-1 min-w-[140px]">
                <Clock className="w-4 h-4" /> Agendar
              </Button>
              <Button variant="ghost" size="lg" onClick={clearForm}>
                <Trash2 className="w-4 h-4" /> Limpar
              </Button>
            </div>

            <AnimatePresence>
              {Object.keys(platformStatuses).length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-lg border border-border bg-card p-4 space-y-2 mt-4">
                  <h3 className="text-sm font-medium">Status da Fila de Processamento</h3>
                  {Object.entries(platformStatuses).map(([platform, info]) => {
                    const cfg = STATUS_CONFIG[info.status] || STATUS_CONFIG.pendente;
                    return (
                      <div key={platform} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2.5">
                        <span className="text-sm capitalize">{platform}</span>
                        <div className="flex items-center gap-2">
                          <cfg.icon className={`w-4 h-4 ${cfg.className}`} />
                          <span className={`text-xs ${cfg.className}`}>{cfg.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-black font-display text-gradient-primary flex items-center gap-3 tracking-tighter">
            <Clock className="w-6 h-6" /> Histórico de Publicações
          </h2>
          <div className="premium-card p-12 text-center">
            <div className="max-w-md mx-auto space-y-3">
               <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto" />
               <p className="text-muted-foreground font-medium">As publicações recentes aparecerão aqui após o processamento.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
