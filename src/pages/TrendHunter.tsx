import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { ViralScore } from "@/components/ViralScore";
import { motion } from "framer-motion";

interface Trend {
  id: string;
  topic: string;
  platform: string;
  trending_score: number;
  description: string;
  category: string;
}

export default function TrendHunter() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    supabase
      .from("trends")
      .select("*")
      .order("trending_score", { ascending: false })
      .then(({ data }) => {
        if (data) setTrends(data);
      });
  }, []);

  const platforms = ["Todos", "TikTok", "Instagram", "YouTube"];
  const filtered = filter === "Todos" ? trends : trends.filter((t) => t.platform.includes(filter));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">Caçador de Tendências</h1>
          <p className="text-muted-foreground mt-1">Descubra o que está em alta nas plataformas</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === p ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border bg-card p-5 space-y-3 glow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {t.platform}
                </span>
                <span className="text-xs text-muted-foreground">{t.category}</span>
              </div>
              <h3 className="font-medium">{t.topic}</h3>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <ViralScore score={t.trending_score} size="sm" />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhuma tendência encontrada para esta plataforma.</p>
        )}
      </div>
    </AppLayout>
  );
}
