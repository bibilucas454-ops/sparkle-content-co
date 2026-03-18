import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Youtube, Instagram, Play, CheckCircle2, AlertCircle, Loader2,
  Clock, ExternalLink, Copy, RotateCcw, Trash2, Search, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PubStatus = "pendente" | "queued" | "enviando" | "processando" | "publicado" | "erro" | "rascunho";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pendente: { label: "Agendado", icon: Clock, className: "text-muted-foreground" },
  queued: { label: "Na Fila", icon: Clock, className: "text-blue-500" },
  enviando: { label: "Enviando", icon: Loader2, className: "text-warning animate-spin" },
  processando: { label: "Processando", icon: Loader2, className: "text-accent animate-spin" },
  publicado: { label: "Publicado", icon: CheckCircle2, className: "text-green-500" },
  erro: { label: "Erro", icon: AlertCircle, className: "text-destructive" },
  rascunho: { label: "Rascunho", icon: Clock, className: "text-muted-foreground" },
};

const PLATFORM_ICONS: Record<string, { icon: typeof Youtube; color: string; label: string }> = {
  youtube: { icon: Youtube, color: "text-red-500", label: "YouTube Shorts" },
  instagram: { icon: Instagram, color: "text-pink-500", label: "Instagram Reels" },
  tiktok: { icon: Play, color: "text-cyan-400", label: "TikTok" },
};

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "publicado", label: "Publicados" },
  { id: "processando", label: "Em processamento" },
  { id: "erro", label: "Com erro" },
  { id: "rascunho", label: "Rascunhos" },
];

interface PublicationItem {
  id: string;
  title: string;
  created_at: string;
  overall_status: string | null;
  scheduled_for: string | null;
  thumbnail_path: string | null;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("publications")
      .select(`
        id, title, created_at, overall_status, scheduled_for, thumbnail_path,
        publication_targets (id, platform, status, platform_post_url, error_message, published_at)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

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
    if (filter === "all") return true;
    if (filter === "rascunho") return item.overall_status === "rascunho";
    return item.publication_targets?.some((t) => t.status === filter);
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">
            Histórico de Publicações
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe todas as suas publicações e seus status por plataforma.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === f.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
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
          <div className="text-center py-16 text-muted-foreground">
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
                  className="rounded-lg border border-border bg-card glow-card overflow-hidden"
                >
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    {/* Thumbnail placeholder */}
                    <div className="w-14 h-14 rounded-md bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.thumbnail_path ? (
                        <img src={item.thumbnail_path} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Play className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">{item.title}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                          Criado em: {new Date(item.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        
                        {item.scheduled_for && (item.overall_status === "pendente" || item.overall_status === "queued") && (
                          <div className="inline-flex items-center gap-2 mt-0.5 px-2 py-1 rounded-md bg-accent/10 border border-accent/20 w-fit">
                            <Clock className="w-3 h-3 text-accent" />
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                              <span className="capitalize">
                                {new Date(item.scheduled_for).toLocaleDateString("pt-BR", { weekday: 'long' })}
                              </span>
                              <span className="opacity-40">•</span>
                              <span>
                                {new Date(item.scheduled_for).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="opacity-40">•</span>
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
                            className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs"
                            title={`${platInfo?.label}: ${statusCfg.label}`}
                          >
                            <Icon className={`w-3 h-3 ${platInfo?.color}`} />
                            <statusCfg.icon className={`w-3 h-3 ${statusCfg.className}`} />
                          </div>
                        );
                      })}
                    </div>

                    <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
                              <span className="text-sm">{platInfo?.label}</span>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <statusCfg.icon className={`w-3.5 h-3.5 ${statusCfg.className}`} />
                                  <span className={`text-xs font-medium ${statusCfg.className}`}>{statusCfg.label}</span>
                                </div>
                                {t.status === "pendente" && item.scheduled_for && (
                                  <span className="text-[10px] text-muted-foreground mt-0.5 ml-4">
                                    {new Date(item.scheduled_for).toLocaleDateString("pt-BR", { weekday: 'short' })}, {new Date(item.scheduled_for).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {t.error_message && (
                                <span className="text-xs text-destructive max-w-[200px] truncate">
                                  {t.error_message}
                                </span>
                              )}
                              {t.platform_post_url && (
                                <a
                                  href={t.platform_post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent text-xs flex items-center gap-1 hover:underline"
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
