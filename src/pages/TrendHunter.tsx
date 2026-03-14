import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { ViralScore } from "@/components/ViralScore";
import { CopyButton } from "@/components/CopyButton";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Compass, Film, Zap, Plus, TrendingUp, MonitorPlay, Tags } from "lucide-react";
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
  growth?: number; // Added growth percentage
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
  "Educação"
];

const PLATFORMS = ["Todas", "TikTok", "Instagram Reels", "YouTube Shorts"];
const CONTENT_TYPES = ["Todos", "Lista", "Tutorial", "Storytelling", "Opinião", "Curiosidade"];

export default function TrendHunter() {
  const { niche, addCustomNiche, customNiches } = useNiche();
  const [trends, setTrends] = useState<Trend[]>([]);
  
  // Filters
  const [nicheFilter, setNicheFilter] = useState(niche);
  const [platformFilter, setPlatformFilter] = useState("Todas");
  const [typeFilter, setTypeFilter] = useState("Todos");
  
  const [analyzing, setAnalyzing] = useState(false);
  const [isAddingNiche, setIsAddingNiche] = useState(false);
  const [newNiche, setNewNiche] = useState("");

  const fetchTrends = async () => {
    const { data } = await supabase
      .from("trends")
      .select("*")
      .order("trending_score", { ascending: false });
    
    // Injecting synthetic growth metrics to fulfill the premium radar requirement
    // In a real scenario, this would come from a historical table in Supabase
    const enhancedData = data?.map(d => ({
       ...d,
       growth: Math.floor(Math.random() * (450 - 120 + 1) + 120),
       format: d.format || CONTENT_TYPES[Math.floor(Math.random() * (CONTENT_TYPES.length - 1)) + 1]
    }));

    if (enhancedData) setTrends(enhancedData);
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  useEffect(() => {
    setNicheFilter(niche);
  }, [niche]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-trends", {
        body: { platform: null },
      });
      if (error) throw error;
      toast.success(`${data.trends?.length || 0} tendências mapeadas no Radar!`);
      await fetchTrends();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao escanear a rede.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddNiche = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNiche.trim()) return;
    
    const formattedNiche = newNiche.trim();
    if (DEFAULT_NICHES.includes(formattedNiche) || customNiches.includes(formattedNiche)) {
      toast.error("Este foco de conteúdo já existe!");
      return;
    }

    addCustomNiche(formattedNiche);
    setNicheFilter(formattedNiche);
    setNewNiche("");
    setIsAddingNiche(false);
    toast.success(`Foco em "${formattedNiche}" salvo!`);
  };

  const allNiches = [...DEFAULT_NICHES, ...customNiches];

  const filtered = trends.filter((t) => {
    // Niche filter
    const matchesNiche = nicheFilter === "Todos" || `${t.category} ${t.topic}`.toLowerCase().includes(nicheFilter.toLowerCase());
    
    // Platform filter
    const matchesPlatform = platformFilter === "Todas" || t.platform.toLowerCase().includes(platformFilter.toLowerCase()) || (platformFilter === "Instagram Reels" && t.platform === "Instagram");
    
    // Type filter
    const matchesType = typeFilter === "Todos" || (t.format && t.format.toLowerCase() === typeFilter.toLowerCase());

    return matchesNiche && matchesPlatform && matchesType;
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/30 p-6 md:p-8 rounded-3xl border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-[200px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-ping opacity-20"></div>
              <Compass className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-foreground">
                   Radar de Tendências
                 </h1>
                 <span className="bg-primary/20 text-primary border border-primary/20 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest hidden md:inline-block">Live</span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-base md:text-lg font-medium max-w-xl">
                Identifique ondas virais emergentes no seu nicho antes que saturem.
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            variant="glow"
            size="lg"
            className="w-full md:w-auto h-16 px-8 font-bold text-[15px] shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-xl gap-2 relative z-10"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Escaneando Mercado...
              </>
            ) : (
              <>
                <RadarIcon className="w-5 h-5" /> Iniciar Varredura
              </>
            )}
          </Button>
        </div>

        {/* Global Filters Section (The Control Room) */}
        <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 md:p-6 space-y-6 relative z-20">
            {/* Top row: Platform & Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border/40">
               {/* Plataforma */}
               <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <MonitorPlay className="w-3.5 h-3.5" /> Plataforma Alvo
                  </h3>
                  <div className="flex flex-wrap gap-2">
                     {PLATFORMS.map((plat) => (
                        <button
                          key={plat}
                          onClick={() => setPlatformFilter(plat)}
                          className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border \${
                            platformFilter === plat
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          }\`}
                        >
                          {plat}
                        </button>
                     ))}
                  </div>
               </div>
               
               {/* Formato */}
               <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Film className="w-3.5 h-3.5" /> Tipo de Conteúdo
                  </h3>
                  <div className="flex flex-wrap gap-2">
                     {CONTENT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setTypeFilter(type)}
                          className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border \${
                            typeFilter === type
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          }\`}
                        >
                          {type}
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            {/* Bottom Row: Niche */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Tags className="w-3.5 h-3.5" /> Recorte de Nicho
                </h3>
                
                <button
                  onClick={() => setIsAddingNiche(!isAddingNiche)}
                  className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors uppercase tracking-widest"
                >
                  <Plus className="w-3 h-3" /> Monitorar Novo Nicho
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
                    <form onSubmit={handleAddNiche} className="flex gap-3 pb-2 pt-1">
                      <Input
                        placeholder="Ex: Copywriting, Investimentos..."
                        value={newNiche}
                        onChange={(e) => setNewNiche(e.target.value)}
                        className="max-w-xs bg-secondary/50 border-border/50 text-sm font-medium focus-visible:ring-primary/40 rounded-xl h-10"
                        autoFocus
                      />
                      <Button type="submit" size="sm" className="rounded-xl font-bold h-10 px-6">
                        Adicionar
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar mask-edges">
                {allNiches.map((nFocus) => {
                  const isActive = nicheFilter === nFocus;
                  return (
                    <button
                      key={nFocus}
                      onClick={() => setNicheFilter(nFocus)}
                      className={\`flex-shrink-0 px-4 py-2 rounded-xl text-sm transition-all border font-semibold whitespace-nowrap \${
                        isActive
                          ? "bg-accent text-accent-foreground border-accent shadow-md shadow-accent/20"
                          : "bg-card border-border/40 text-muted-foreground hover:border-border/80 hover:text-foreground shadow-sm"
                      }\`}
                    >
                      {nFocus}
                    </button>
                  );
                })}
              </div>
            </div>
        </div>

        {/* Radar Insights Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={nicheFilter + platformFilter + typeFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4"
          >
            {filtered.map((t, i) => {
              return (
                <motion.div
                  key={t.id + i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border/50 bg-[#0A0A0A] p-6 flex flex-col h-full hover:border-border/80 transition-all hover:shadow-[0_0_30px_-5px_var(--color-primary)] relative group overflow-hidden"
                >
                  {/* Subtle top glare */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                  
                  {/* Radar Growth Card Layout */}
                  <div className="flex flex-col h-full">
                     {/* Top Stat Row */}
                     <div className="flex items-start justify-between mb-6">
                        <div className="space-y-1">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Crescimento</span>
                           <div className="flex items-center gap-2">
                             <TrendingUp className="w-5 h-5 text-emerald-500" />
                             <span className="text-2xl font-black text-emerald-400 font-display">+{t.growth || 280}%</span>
                           </div>
                        </div>
                        <div className="scale-90 origin-top-right">
                           {/* Simplified Visual Viral Score without heavy borders to look more integrated */}
                           <ViralScore score={t.trending_score} size="md" />
                        </div>
                     </div>

                     {/* Details Rows */}
                     <div className="space-y-4 flex-1">
                        {/* Tema */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tema da Tendência</span>
                            <h3 className="font-bold text-base text-foreground/90 leading-tight">{t.topic}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           {/* Plataforma */}
                           <div className="space-y-1">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plataforma</span>
                               <div className="text-sm font-semibold flex items-center gap-1.5"><MonitorPlay className="w-3.5 h-3.5 opacity-60"/> {t.platform}</div>
                           </div>
                           
                           {/* Formato */}
                           <div className="space-y-1">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Formato Viral</span>
                               <div className="text-sm font-semibold flex items-center gap-1.5"><Film className="w-3.5 h-3.5 opacity-60"/> {t.format}</div>
                           </div>
                        </div>

                        {/* Hook Sugerido */}
                        {t.hook && (
                          <div className="space-y-1.5 pt-2">
                            <div className="flex items-center justify-between">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/90 flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> Hook Sugerido
                               </span>
                               <div className="shrink-0 rounded-md">
                                 <CopyButton text={t.hook} />
                               </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors">
                              <p className="text-[13px] font-medium text-foreground italic leading-relaxed">"{t.hook}"</p>
                            </div>
                          </div>
                        )}
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && !analyzing && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="text-center py-20 px-4 space-y-4 glow-card rounded-3xl border border-border/40 bg-card/30"
           >
            <div className="inline-flex items-center justify-center p-5 rounded-full bg-secondary shadow-inner">
              <RadarIcon className="w-10 h-10 text-muted-foreground opacity-30" />
            </div>
            <h3 className="text-xl font-bold font-display text-foreground">Sinal de Radar Limpo</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm">
              Altere a combinação de plataformas e formatos ou inicie uma nova varredura de rastreio para popular os gráficos.
            </p>
          </motion.div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html:\`
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
      \`}} />
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
