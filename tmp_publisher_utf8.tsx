import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Play, Send, Clock, Youtube, Instagram,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Trash2,
} from "lucide-react";

const PLATFORMS = [
  { id: "youtube", label: "YouTube Shorts", icon: Youtube, color: "text-red-500" },
  { id: "instagram", label: "Instagram Reels", icon: Instagram, color: "text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: Play, color: "text-cyan-400" },
];

type PubStatus = "pendente" | "enviando" | "processando" | "publicado" | "erro";

const STATUS_CONFIG: Record<PubStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pendente: { label: "Pendente", icon: Clock, className: "text-muted-foreground" },
  enviando: { label: "Enviando", icon: Loader2, className: "text-yellow-500 animate-spin" },
  processando: { label: "Processando", icon: Loader2, className: "text-blue-400 animate-spin" },
  publicado: { label: "Publicado", icon: CheckCircle2, className: "text-green-500" },
  erro: { label: "Erro", icon: AlertCircle, className: "text-destructive" },
};

interface HistoryItem {
  id: string;
  platform: string;
  status: string;
  platform_post_url: string | null;
  error_message: string | null;
  published_at: string | null;
  created_at: string;
}

export default function PublisherHub() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, PubStatus>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("publication_targets")
      .select("id, platform, status, platform_post_url, error_message, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Selecione um arquivo de v├¡deo");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("O v├¡deo deve ter no m├íximo 500MB");
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
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

  const handlePublish = async (schedule: boolean) => {
    if (!videoFile) { toast.error("Envie um v├¡deo primeiro"); return; }
    if (!title.trim()) { toast.error("Insira um t├¡tulo"); return; }
    if (selectedPlatforms.length === 0) { toast.error("Selecione pelo menos uma plataforma"); return; }
    if (schedule && !scheduledFor) { toast.error("Selecione a data de agendamento"); return; }

    setPublishing(true);
    const statuses: Record<string, PubStatus> = {};
    selectedPlatforms.forEach((p) => { statuses[p] = "enviando"; });
    setPlatformStatuses({ ...statuses });

    try {
      // 1. Upload video to storage
      const filePath = `${user!.id}/${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("creator-media")
        .upload(filePath, videoFile);
      if (uploadError) throw uploadError;

      // 2. Upload thumbnail if exists
      let thumbnailPath: string | null = null;
      if (thumbnailFile) {
        thumbnailPath = `${user!.id}/thumbs/${Date.now()}-${thumbnailFile.name}`;
        await supabase.storage.from("creator-media").upload(thumbnailPath, thumbnailFile);
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
          scheduled_for: schedule ? scheduledFor : null,
        })
        .select()
        .single();
      if (pubError) throw pubError;

      // 5. Create targets for each platform
      for (const platform of selectedPlatforms) {
        statuses[platform] = "processando";
        setPlatformStatuses({ ...statuses });

        const { error: targetError } = await supabase
          .from("publication_targets")
          .insert({
            publication_id: publication.id,
            platform,
            status: schedule ? "pendente" : "pendente",
          });

        if (targetError) {
          statuses[platform] = "erro";
          setPlatformStatuses({ ...statuses });
          continue;
        }

        // Placeholder: actual API integration would happen here
        // For now, mark as pending (future OAuth integration)
        statuses[platform] = "pendente";
        setPlatformStatuses({ ...statuses });
      }

      toast.success(
        schedule
          ? "Publica├º├úo agendada com sucesso!"
          : "Publica├º├úo criada! Conecte suas contas para publicar."
      );

      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao publicar");
      selectedPlatforms.forEach((p) => {
        statuses[p] = "erro";
      });
      setPlatformStatuses({ ...statuses });
    } finally {
      setPublishing(false);
    }
  };

  const clearForm = () => {
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setThumbnailFile(null);
    setThumbnailPreviewUrl(null);
    setTitle("");
    setCaption("");
    setHashtags("");
    setSelectedPlatforms([]);
    setScheduledFor("");
    setPlatformStatuses({});
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">
            Central de Publica├º├úo
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie um v├¡deo e publique em todas as plataformas de uma vez
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Upload & Preview */}
          <div className="lg:col-span-1 space-y-4">
            {/* Video Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border-2 border-dashed border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer flex flex-col items-center justify-center p-8 min-h-[240px]"
            >
              {videoPreviewUrl ? (
                <video
                  src={videoPreviewUrl}
                  controls
                  className="w-full max-h-[300px] rounded-md object-contain"
                />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    Clique para enviar seu v├¡deo
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    MP4, MOV, WEBM ÔÇó M├íx 500MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
              />
            </div>

            {videoFile && (
              <div className="text-xs text-muted-foreground space-y-1 rounded-lg border border-border bg-card p-3">
                <p><span className="text-foreground/70">Arquivo:</span> {videoFile.name}</p>
                <p><span className="text-foreground/70">Tamanho:</span> {(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                <p><span className="text-foreground/70">Tipo:</span> {videoFile.type}</p>
              </div>
            )}

            {/* Thumbnail Upload */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Thumbnail (opcional)
              </label>
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="rounded-lg border border-dashed border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer flex items-center justify-center p-4 min-h-[80px]"
              >
                {thumbnailPreviewUrl ? (
                  <img
                    src={thumbnailPreviewUrl}
                    alt="Thumbnail"
                    className="max-h-[80px] rounded object-contain"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">Clique para enviar thumbnail</p>
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

          {/* Right: Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-lg border border-border bg-card p-6 space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">T├¡tulo</label>
                <Input
                  placeholder="T├¡tulo do seu v├¡deo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Legenda</label>
                <Textarea
                  placeholder="Escreva a legenda do seu v├¡deo..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="bg-secondary border-border min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Hashtags</label>
                <Input
                  placeholder="#viral #reels #tiktok"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Platform selectors */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Plataformas</label>
                <div className="flex gap-3 flex-wrap">
                  {PLATFORMS.map((p) => {
                    const selected = selectedPlatforms.includes(p.id);
                    const status = platformStatuses[p.id];
                    const StatusIcon = status ? STATUS_CONFIG[status]?.icon : null;
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border transition-all text-sm ${
                          selected
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <p.icon className={`w-4 h-4 ${selected ? p.color : ""}`} />
                        <span>{p.label}</span>
                        {status && StatusIcon && (
                          <StatusIcon className={`w-3.5 h-3.5 ml-1 ${STATUS_CONFIG[status].className}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform status display */}
              <AnimatePresence>
                {Object.keys(platformStatuses).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {Object.entries(platformStatuses).map(([platform, status]) => {
                      const cfg = STATUS_CONFIG[status];
                      const platInfo = PLATFORMS.find((p) => p.id === platform);
                      return (
                        <div
                          key={platform}
                          className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            {platInfo && <platInfo.icon className={`w-3.5 h-3.5 ${platInfo.color}`} />}
                            <span>{platInfo?.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <cfg.icon className={`w-3.5 h-3.5 ${cfg.className}`} />
                            <span className={`text-xs ${cfg.className}`}>{cfg.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Schedule */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Agendar para (opcional)
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="bg-secondary border-border max-w-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap pt-2">
                <Button
                  onClick={() => handlePublish(false)}
                  disabled={publishing}
                  variant="glow"
                  size="lg"
                  className="flex-1 min-w-[160px]"
                >
                  {publishing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Publicar Agora</>
                  )}
                </Button>
                <Button
                  onClick={() => handlePublish(true)}
                  disabled={publishing}
                  variant="outline"
                  size="lg"
                  className="flex-1 min-w-[160px]"
                >
                  <Clock className="w-4 h-4" /> Agendar Publica├º├úo
                </Button>
                <Button variant="ghost" size="lg" onClick={clearForm}>
                  <Trash2 className="w-4 h-4" /> Limpar
                </Button>
              </div>
            </div>

            {/* Integration placeholders */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-3">­ƒöù Integra├º├Áes (em breve)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLATFORMS.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground"
                  >
                    <p.icon className={`w-4 h-4 ${p.color}`} />
                    <span>{p.label}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      OAuth
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/60 mt-3">
                As integra├º├Áes OAuth com YouTube, Instagram e TikTok ser├úo ativadas em breve.
              </p>
            </div>
          </div>
        </div>

        {/* Publication History */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg">Hist├│rico de Publica├º├Áes</h2>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item, i) => {
                const status = (item.status as PubStatus) || "pendente";
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
                const platInfo = PLATFORMS.find((p) => p.id === item.platform);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-3">
                      {platInfo && <platInfo.icon className={`w-4 h-4 ${platInfo.color}`} />}
                      <span className="text-sm">{platInfo?.label || item.platform}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <cfg.icon className={`w-3.5 h-3.5 ${cfg.className}`} />
                        <span className={`text-xs ${cfg.className}`}>{cfg.label}</span>
                      </div>
                      {item.platform_post_url && (
                        <a
                          href={item.platform_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {item.error_message && (
                        <span className="text-xs text-destructive max-w-[200px] truncate">
                          {item.error_message}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma publica├º├úo ainda. Envie seu primeiro v├¡deo!
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
