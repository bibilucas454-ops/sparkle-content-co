import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { ViralScore } from "@/components/ViralScore";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, FileText, Zap, ArrowRight, Clock, Hash } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [trendsRes, contentsRes] = await Promise.all([
        supabase.from("trends").select("*").order("trending_score", { ascending: false }).limit(4),
        supabase.from("contents").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      if (trendsRes.data) setTrends(trendsRes.data);
      if (contentsRes.data) {
        setRecentContent(contentsRes.data);
        setContentCount(contentsRes.data.length);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const avgScore = recentContent.length
    ? Math.round(recentContent.reduce((a, b) => a + (b.viral_score || 0), 0) / recentContent.length)
    : 0;

  const stats = [
    { label: "Conteúdos Criados", value: contentCount, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Score Viral Médio", value: avgScore, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Temas em Alta", value: trends.length, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Visão Geral
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Bem-vindo de volta, <span className="text-foreground font-medium">{user?.email?.split("@")[0]}</span>. Aqui está o resumo de hoje.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative group hover:border-border transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                      <p className="text-3xl font-bold font-display tracking-tight">{loading ? "-" : s.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${s.bg}`}>
                      <s.icon className={`w-6 h-6 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Hero Quick Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-32 h-32" />
            </div>
            <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-gradient-accent flex items-center gap-2">
                  <Sparkles className="w-6 h-6 md:hidden text-accent" />
                  Gerar Conteúdo Viral
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Sem ideias hoje? Nossa IA analisa o que está em alta no seu nicho e cria roteiros, legendas e ganchos prontos para viralizar.
                </p>
              </div>
              <Button asChild size="lg" className="w-full sm:w-auto font-medium shadow-glow gap-2">
                <Link to="/generate">
                  Começar a criar
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content & Trends Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          
          {/* Trends */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="h-full border-border/50 bg-card/30">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 font-display">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Tendências do Dia
                  </CardTitle>
                </div>
                <Link to="/trends" className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                     {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : trends.length > 0 ? (
                  trends.map((t) => (
                    <div key={t.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {t.platform}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                             <Hash className="w-3 h-3" /> {t.category}
                          </span>
                        </div>
                        <h3 className="font-medium text-sm text-foreground truncate">{t.topic}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                      </div>
                      <div className="flex-shrink-0 self-start sm:self-center">
                        <ViralScore score={t.trending_score} size="sm" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl border-border">
                    Nenhuma tendência encontrada hoje.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Content */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="h-full border-border/50 bg-card/30">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 font-display">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Conteúdo Recente
                </CardTitle>
                <Link to="/saved" className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
                  Ver tudo <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                   <div className="space-y-4">
                     {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex justify-between items-center py-2">
                         <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-40"></div>
                            <div className="h-3 bg-muted rounded w-20"></div>
                         </div>
                         <div className="h-8 w-16 bg-muted rounded-full"></div>
                      </div>
                    ))}
                  </div>
                ) : recentContent.length > 0 ? (
                  recentContent.map((c) => (
                    <div key={c.id} className="group flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1 min-w-0 pr-4">
                        <h3 className="text-sm font-medium text-foreground truncate">{c.topic}</h3>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                             {c.type}
                           </span>
                           <span className="text-[10px] text-muted-foreground/60">•</span>
                           <span className="text-[10px] text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString()}
                           </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ViralScore score={c.viral_score || 0} size="sm" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl border-border flex flex-col items-center justify-center gap-3">
                     <FileText className="w-8 h-8 text-muted-foreground/50" />
                     <p>Você ainda não criou nenhum conteúdo.</p>
                     <Button variant="outline" size="sm" asChild className="mt-2">
                        <Link to="/generate">Criar agora</Link>
                     </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </AppLayout>
  );
}
