import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { ViralScore } from "@/components/ViralScore";
import { CopyButton } from "@/components/CopyButton";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Compass, Hash, Film, Zap } from "lucide-react";

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

export default function TrendHunter() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [filter, setFilter] = useState("Todos");
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-trends", {
        body: { platform: filter === "Todos" ? null : filter },
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

  const platforms = ["Todos", "TikTok", "Instagram", "YouTube"];
  const filtered = filter === "Todos" ? trends : trends.filter((t) => t.platform.includes(filter));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">
              Caçador de Tendências
            </h1>
            <p className="text-muted-foreground mt-1">
              Descubra padrões de conteúdo viral em tempo real
            </p>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            variant="glow"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analisando...
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" /> Analisar Tendências
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === p
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-border bg-card p-5 space-y-4 glow-card"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {t.platform}
                  </span>
                  <ViralScore score={t.trending_score} size="sm" />
                </div>

                {/* Topic */}
                <div>
                  <h3 className="font-semibold text-sm">{t.topic}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                </div>

                {/* Hook */}
                {t.hook && (
                  <div className="rounded-md bg-secondary/50 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Zap className="w-3 h-3 text-accent" />
                      <span>Hook</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-foreground/90">"{t.hook}"</p>
                      <CopyButton text={t.hook} />
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {t.hashtags && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Hash className="w-3 h-3" />
                      <span>Hashtags</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-accent break-all">{t.hashtags}</p>
                      <CopyButton text={t.hashtags} />
                    </div>
                  </div>
                )}

                {/* Format */}
                {t.format && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Film className="w-3 h-3" />
                      <span>Formato</span>
                    </div>
                    <p className="text-xs text-foreground/80">{t.format}</p>
                  </div>
                )}

                {/* Category */}
                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && !analyzing && (
          <div className="text-center py-16 space-y-3">
            <Compass className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              Nenhuma tendência encontrada. Clique em "Analisar Tendências" para descobrir!
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
