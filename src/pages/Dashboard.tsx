import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { ViralScore } from "@/components/ViralScore";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, FileText, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Trend {
  id: string;
  topic: string;
  platform: string;
  trending_score: number;
  description: string;
  category: string;
}

interface ContentItem {
  id: string;
  type: string;
  topic: string;
  viral_score: number;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [contentCount, setContentCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [trendsRes, contentsRes] = await Promise.all([
        supabase.from("trends").select("*").order("trending_score", { ascending: false }).limit(4),
        supabase.from("contents").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      if (trendsRes.data) setTrends(trendsRes.data);
      if (contentsRes.data) {
        setRecentContent(contentsRes.data);
        setContentCount(contentsRes.data.length);
      }
    };
    fetchData();
  }, []);

  const avgScore = recentContent.length
    ? Math.round(recentContent.reduce((a, b) => a + (b.viral_score || 0), 0) / recentContent.length)
    : 0;

  const stats = [
    { label: "Conteúdos Criados", value: contentCount, icon: FileText },
    { label: "Score Viral Médio", value: avgScore, icon: TrendingUp },
    { label: "Temas em Alta", value: trends.length, icon: Zap },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">Painel</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo de volta, {user?.email?.split("@")[0]}</p>
        </div>

        {/* Quick action */}
        <Link to="/generate">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="glow-card rounded-lg border border-border bg-card p-6 flex items-center justify-between cursor-pointer"
          >
            <div>
              <h2 className="font-display font-semibold text-lg">Gerar Conteúdo Viral</h2>
              <p className="text-muted-foreground text-sm">Digite um tema e deixe a IA criar conteúdo para você</p>
            </div>
            <Sparkles className="w-8 h-8 text-accent" />
          </motion.div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <s.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-2xl font-bold font-display">{s.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Trends of the day */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-4">🔥 Tendências do Dia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trends.map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {t.platform}
                  </span>
                  <ViralScore score={t.trending_score} size="sm" />
                </div>
                <h3 className="font-medium text-sm">{t.topic}</h3>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                <span className="text-xs text-muted-foreground">{t.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent content */}
        {recentContent.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-lg mb-4">Recent Content</h2>
            <div className="space-y-2">
              {recentContent.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <span className="text-sm font-medium">{c.topic}</span>
                    <span className="text-xs text-muted-foreground ml-3">{c.type}</span>
                  </div>
                  <ViralScore score={c.viral_score || 0} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
