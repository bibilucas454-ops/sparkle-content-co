import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { ViralScore } from "@/components/ViralScore";
import { CopyButton } from "@/components/CopyButton";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Compass, Hash, Film, Zap, Plus, TrendingUp, Flame, Rocket, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNiche } from "@/contexts/NicheContext";

interface Trend {
  id: string;
  topic: string;
  platform: string;
  trending_score: number;
  description: string;
  category: string;
  hook: string | null;
  hashtags: string | null;
  format: string | null;
}

const DEFAULT_NICHES = [
  "Todos",
  "Empreendedorismo",
  "Desenvolvimento pessoal",
  "Motivação",
  "Marketing digital",
  "Negócios online",
  "Finanças",
  "Inteligência artificial",
  "Tecnologia",
  "Lifestyle",
  "Fitness",
  "Educação",
  "Curiosidades",
  "Histórias reais",
  "Humor"
];

export default function TrendHunter() {
  const { niche, setNiche, customNiches, addCustomNiche } = useNiche();
  const [trends, setTrends] = useState<Trend[]>([]);
  
  // We sync local filter with global niche to start, but allow user to explore
  const [nicheFilter, setNicheFilter] = useState(niche);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [isAddingNiche, setIsAddingNiche] = useState(false);
  const [newNiche, setNewNiche] = useState("");

  const fetchTrends = async () => {
    const { data } = await supabase
      .from("trends")
      .select("*")
      .order("trending_score", { ascending: false });
    if (data) setTrends(data);
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  // Update filter if global niche changes elsewhere, but don't force it continuously
  useEffect(() => {
    setNicheFilter(niche);
  }, [niche]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-trends", {
        body: { platform: null }, // Fetch all platforms, we filter client-side if needed
      });
      if (error) throw error;
      toast.success(`${data.trends?.length || 0} tendências descobertas!`);
      await fetchTrends();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao analisar tendências");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddNiche = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNiche.trim()) return;
    
    const formattedNiche = newNiche.trim();
    if (DEFAULT_NICHES.includes(formattedNiche) || customNiches.includes(formattedNiche)) {
      toast.error("Este nicho já existe!");
      return;
    }

    addCustomNiche(formattedNiche);
    setNicheFilter(formattedNiche);
    setNewNiche("");
    setIsAddingNiche(false);
    toast.success(`Nicho "${formattedNiche}" adicionado!`);
  };

  const allNiches = [...DEFAULT_NICHES, ...customNiches];

  const filtered = trends.filter((t) => {
    if (nicheFilter === "Todos") return true;
    const searchTarget = `${t.category} ${t.topic}`.toLowerCase();
    return searchTarget.includes(nicheFilter.toLowerCase());
  });

  const getRadarBadge = (score: number) => {
    if (score >= 90) return { icon: Rocket, text: "Potencial viral", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" };
    if (score >= 75) return { icon: Flame, text: "Tendência emergente", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    if (score >= 60) return { icon: TrendingUp, text: "Crescimento rápido", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/30 p-6 md:p-8 rounded-3xl border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-[200px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
              <Compass className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-foreground">
                Caçador de Tendências
              </h1>
              <p className="text-muted-foreground mt-1.5 text-base md:text-lg font-medium max-w-xl">
                Descubra padrões de conteúdo viral no seu nicho antes de todo mundo.
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            variant="glow"
            size="lg"
            className="w-full md:w-auto h-14 px-8 font-bold text-[15px] shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-xl gap-2 relative z-10"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Mapeando Algoritmo...
              </>
            ) : (
              <>
                <RadarIcon className="w-5 h-5" /> Localizar Tendências
              </>
            )}
          </Button>
        </div>

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtro de Nicho
            </h3>
            
            <button
              onClick={() => setIsAddingNiche(!isAddingNiche)}
              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
            >
              <Plus className="w-3 h-3" /> Adicionar Nicho
            </button>
          </div>

          <AnimatePresence>
            {isAddingNiche && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleAddNiche} className="flex gap-3 pb-4">
                  <Input
                    placeholder="Ex: Copywriting, Investimentos..."
                    value={newNiche}
                    onChange={(e) => setNewNiche(e.target.value)}
                    className="max-w-xs bg-card/60 border-border/50 text-sm font-medium focus-visible:ring-primary/40 rounded-xl"
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="rounded-xl font-bold">
                    Salvar
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Niche Scroll Strip */}
          <div className="flex overflow-x-auto pb-4 pt-1 gap-2.5 hide-scrollbar mask-edges">
            {allNiches.map((niche) => {
              const isActive = nicheFilter === niche;
              return (
                <button
                  key={niche}
                  onClick={() => setNicheFilter(niche)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm transition-all border font-semibold whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-card/40 border-border/40 text-muted-foreground hover:border-border/80 hover:bg-card/80 hover:text-foreground shadow-sm"
                  }`}
                >
                  {niche}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={nicheFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filtered.map((t, i) => {
              const radar = getRadarBadge(t.trending_score);
              const RadarBadgeIcon = radar?.icon;

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 flex flex-col h-full hover:border-border/80 transition-all hover:-translate-y-1 relative group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Visual Tags & Score */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col gap-2">
                       <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-md bg-secondary/80 border border-border/40 text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                        {t.platform}
                      </span>
                      {radar && RadarBadgeIcon && (
                        <span className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md border ${radar.bg} ${radar.border} ${radar.color} text-[10px] font-bold uppercase tracking-widest shadow-sm`}>
                          <RadarBadgeIcon className="w-3 h-3" />
                          {radar.text}
                        </span>
                      )}
                    </div>
                    <div className="scale-90 origin-top-right">
                      <ViralScore score={t.trending_score} size="sm" />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 space-y-5">
                    <div>
                      <h3 className="font-bold text-lg text-foreground font-display leading-tight">{t.topic}</h3>
                      <p className="text-sm text-muted-foreground font-medium mt-1.5 line-clamp-2 leading-relaxed">{t.description}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/30">
                      {t.hook && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <Zap className="w-3 h-3 text-yellow-500" /> Hook
                          </div>
                          <div className="flex items-start justify-between gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-sm font-medium text-foreground/90 italic">"{t.hook}"</p>
                            <div className="shrink-0 bg-background rounded-md border border-border/50 shadow-sm">
                              <CopyButton text={t.hook} />
                            </div>
                          </div>
                        </div>
                      )}

                      {t.hashtags && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <Hash className="w-3 h-3 text-pink-500" /> Hashtags
                          </div>
                          <div className="flex items-center justify-between gap-3 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                            <p className="text-xs text-primary font-medium truncate">{t.hashtags}</p>
                            <div className="shrink-0 bg-background rounded-md border border-border/50 shadow-sm">
                              <CopyButton text={t.hashtags} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center gap-3 pt-5 mt-5 border-t border-border/30">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t.category}
                    </span>
                    {t.format && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Film className="w-3 h-3 opacity-70" />
                        {t.format}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && !analyzing && (
          <div className="text-center py-20 px-4 space-y-4 glow-card rounded-3xl border border-border/40 bg-card/30">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-secondary">
              <Compass className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold font-display text-foreground">Nenhuma tendência encontrada</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              Experimente ajustar o filtro de nicho ou clique em "Localizar Tendências" para a IA analisar o mercado agora.
            </p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .mask-edges {
          mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 30px), transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 30px), transparent);
        }
      `}} />
    </AppLayout>
  );
}

// Custom Radar Icon
function RadarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
      <path d="M4 6h.01" />
      <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
      <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" />
      <path d="M12 18h.01" />
      <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" />
      <circle cx="12" cy="12" r="2" />
      <path d="m13.41 10.59 5.66-5.66" />
    </svg>
  );
}
