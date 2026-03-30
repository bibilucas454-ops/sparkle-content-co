import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Youtube, Instagram, Play, CheckCircle2, AlertCircle, Loader2,
  Clock, ExternalLink, Copy, RotateCcw, Trash2, Search, Eye, History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PubStatus = "pendente" | "queued" | "enviando" | "processando" | "publicado" | "erro" | "rascunho";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pendente: { label: "Agendado", icon: Clock, className: "text-text-secondary" },
  queued: { label: "Na Fila", icon: Clock, className: "text-blue-400" },
  enviando: { label: "Enviando", icon: Loader2, className: "text-amber-400 animate-spin" },
  processando: { label: "Processando", icon: Loader2, className: "text-primary animate-spin" },
  publicado: { label: "Publicado", icon: CheckCircle2, className: "text-green-400" },
  erro: { label: "Erro", icon: AlertCircle, className: "text-red-400" },
  rascunho: { label: "Rascunho", icon: Clock, className: "text-text-secondary" },
};

const PLATFORM_ICONS: Record<string, { icon: typeof Youtube; color: string; label: string }> = {
  youtube: { icon: Youtube, color: "text-red-500", label: "YouTube Shorts" },
  instagram: { icon: Instagram, color: "text-pink-500", label: "Instagram Reels" },
};

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "publicado", label: "Publicados" },
  { id: "processando", label: "Em processamento" },
  { id: "erro", label: "Com erro" },
  { id: "rascunho", label: "Rascunhos" },
];

const FORMAT_FILTERS = [
  { id: "all", label: "TODOS" },
  { id: "reels", label: "REELS" },
  { id: "carousel", label: "CARROSSEL" },
  { id: "story", label: "STORY" },
];

const FORMAT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  reels: { label: "Reels", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  carousel: { label: "Carrossel", color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  story: { label: "Story", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
};

interface PublicationItem {
  id: string;
  title: string;
  created_at: string;
  overall_status: string | null;
  scheduled_for: string | null;
  thumbnail_path: string | null;
  content_format: string | null;
  publication_targets: {
    id: string;
    platform: string;
    status: string;
    platform_post_url: string | null;
    error_message: string | null;
    published_at: string | null;
  }[];
}

export default function PublisherHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState<PublicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("publications")
      .select(`
        id, title, created_at, overall_status, scheduled_for, thumbnail_path, content_format,
        publication_targets (id, platform, status, platform_post_url, error_message, published_at)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico.");
      setLoading(false);
      return;
    }

    if (data) setItems(data as unknown as PublicationItem[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("publications").delete().eq("id", id);
    if (error) {
      toast.error("Falha ao excluir publicação.");
    } else {
      toast.success("Publicação excluída.");
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const filtered = items.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (formatFilter !== "all" && item.content_format !== formatFilter) return false;
    if (filter === "all") return true;
    if (filter === "rascunho") return item.overall_status === "rascunho";
    return item.publication_targets?.some((t) => t.status === filter);
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="pb-8 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl shadow-primary/10">
                <History className="w-10 h-10 text-primary" />
              </div>
              <div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-text-primary leading-none">
                  Histórico de Envios
                </h1>
                <p className="text-text-secondary mt-4 text-base md:text-xl font-medium max-w-xl leading-relaxed">
                  Acompanhe todas as suas publicações e seus status por plataforma.
                </p>
              </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          {/* Row 1: Status filters + Search */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card/40 p-5 rounded-2xl border border-border/40 backdrop-blur-xl shadow-sm">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 bg-secondary/40 border-border/40 h-12 rounded-xl focus-visible:ring-primary/40 font-medium"
              />
            </div>
            <div className="flex gap-2 flex-wrap overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all border ${
                    filter === f.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-secondary text-text-secondary border-border hover:border-border/80 hover:bg-secondary/60 hover:text-text-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Row 2: Format filters */}
          <div className="flex items-center gap-3 bg-card/30 p-4 rounded-xl border border-border/30">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">Tipo:</span>
            <div className="flex gap-2">
              {FORMAT_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormatFilter(f.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${
                    formatFilter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-text-secondary hover:bg-secondary hover:text-text-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-card animate-pulse border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <p>Nenhuma publicação encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="premium-card overflow-hidden group border-border/40"
                >
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    {/* Thumbnail placeholder */}
                    <div className="w-16 h-16 rounded-xl bg-secondary/80 flex-shrink-0 flex items-center justify-center overflow-hidden border border-border/40 shadow-inner">
                      {item.thumbnail_path ? (
                        <img src={item.thumbnail_path} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                      ) : (
                        <Play className="w-6 h-6 text-text-secondary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg md:text-xl text-text-primary font-display tracking-tight group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </h3>
                        {item.content_format && FORMAT_CONFIG[item.content_format] && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] border ${FORMAT_CONFIG[item.content_format].bg} ${FORMAT_CONFIG[item.content_format].color}`}>
                            {FORMAT_CONFIG[item.content_format].label}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-text-secondary">
                          {new Date(item.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        
                        {item.scheduled_for && (item.overall_status === "pendente" || item.overall_status === "queued") && (
                          <div className="inline-flex items-center gap-2 mt-0.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 w-fit">
                            <Clock className="w-3 h-3 text-primary" />
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                              <span className="capitalize">
                                {new Date(item.scheduled_for).toLocaleDateString("pt-BR", { weekday: 'long' })}
                              </span>
                              <span className="opacity-60">•</span>
                              <span>
                                {new Date(item.scheduled_for).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="opacity-60">•</span>
                              <span>
                                {new Date(item.scheduled_for).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Platform status pills */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      {item.publication_targets?.map((t) => {
                        const platInfo = PLATFORM_ICONS[t.platform];
                        const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.pendente;
                        const Icon = platInfo?.icon || Play;
                        return (
                          <div
                            key={t.id}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs text-text-primary"
                            title={`${platInfo?.label}: ${statusCfg.label}`}
                          >
                            <Icon className={`w-3 h-3 ${platInfo?.color}`} />
                            <statusCfg.icon className={`w-3 h-3 ${statusCfg.className}`} />
                          </div>
                        );
                      })}
                    </div>

                    <Eye className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  </div>

                  {/* Expanded details */}
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      className="border-t border-border px-4 py-4 space-y-3"
                    >
                      {item.publication_targets?.map((t) => {
                        const platInfo = PLATFORM_ICONS[t.platform];
                        const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.pendente;
                        const Icon = platInfo?.icon || Play;
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-3 rounded-md bg-secondary/50 px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${platInfo?.color}`} />
                              <span className="text-sm text-text-primary">{platInfo?.label}</span>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <statusCfg.icon className={`w-3.5 h-3.5 ${statusCfg.className}`} />
                                  <span className={`text-xs font-medium ${statusCfg.className}`}>{statusCfg.label}</span>
                                </div>
                                {t.status === "pendente" && item.scheduled_for && (
                                  <span className="text-[10px] text-text-secondary mt-0.5 ml-4">
                                    {new Date(item.scheduled_for).toLocaleDateString("pt-BR", { weekday: 'short' })}, {new Date(item.scheduled_for).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {t.error_message && (
                                <span className="text-xs text-red-400 max-w-[200px] truncate">
                                  {t.error_message}
                                </span>
                              )}
                              {t.platform_post_url && (
                                <a
                                  href={t.platform_post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary text-xs flex items-center gap-1 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver post
                                </a>
                              )}
                              {t.status === "erro" && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs">
                                  <RotateCcw className="w-3 h-3" />
                                  Tentar novamente
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex gap-2 pt-1">
                        <Button variant="ghost" size="sm" className="text-xs">
                          <Copy className="w-3 h-3" />
                          Duplicar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
