import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  BarChart3, TrendingUp, CheckCircle2, XCircle, Clock, 
  Instagram, Youtube, Percent, Activity, Target, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlatformMetric {
  platform: string;
  total_attempts: number;
  successful_posts: number;
  failed_posts: number;
  success_rate_percent: number;
  unique_publications: number;
}

interface UserSummary {
  user_id: string;
  total_publications: number;
  published_count: number;
  failed_count: number;
  pending_count: number;
  total_targets: number;
  successful_posts: number;
  failed_posts: number;
  success_rate_percent: number;
}

export default function MetricsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetric[]>([]);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  const fetchMetrics = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data: summary, error: summaryError } = await supabase
        .from("user_publication_summary")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (summaryError && summaryError.code !== "PGRST116") {
        throw summaryError;
      }

      if (summary) setUserSummary(summary);

      const { data: targets, error: targetsError } = await supabase
        .from("publication_targets")
        .select("platform, status")
        .in("status", ["publicado", "erro"]);

      if (targetsError) throw targetsError;

      const platformMap = new Map<string, PlatformMetric>();
      
      if (targets) {
        targets.forEach((t: any) => {
          const existing = platformMap.get(t.platform) || {
            platform: t.platform,
            total_attempts: 0,
            successful_posts: 0,
            failed_posts: 0,
            success_rate_percent: 0,
            unique_publications: new Set()
          };
          
          existing.total_attempts++;
          if (t.status === "publicado") {
            existing.successful_posts++;
          } else if (t.status === "erro") {
            existing.failed_posts++;
          }
          
          platformMap.set(t.platform, existing);
        });

        const metrics = Array.from(platformMap.values()).map(m => ({
          ...m,
          success_rate_percent: m.total_attempts > 0 
            ? Math.round((m.successful_posts / m.total_attempts) * 100 * 100) / 100 
            : 0
        }));
        
        setPlatformMetrics(metrics);
      }
    } catch (err: any) {
      console.error("Erro ao carregar métricas:", err);
      toast.error("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return Instagram;
      case "youtube": return Youtube;
      default: return Target;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram": return "text-pink-500";
      case "youtube": return "text-red-500";
      default: return "text-blue-500";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="pb-8 border-b border-border/40">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl shadow-primary/10">
              <BarChart3 className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-text-primary leading-none">
                Métricas
              </h1>
              <p className="text-text-secondary mt-4 text-base md:text-xl font-medium max-w-xl leading-relaxed">
                Acompanhe o desempenho das suas publicações e taxa de sucesso.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Publicações com Sucesso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-emerald-500">
                    {userSummary?.successful_posts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {userSummary?.total_targets || 0} tentativas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Falhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-red-500">
                    {userSummary?.failed_posts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    publicações com erro
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-amber-500">
                    {userSummary?.pending_count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    na fila de processamento
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    Taxa de Sucesso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-primary">
                    {userSummary?.success_rate_percent || 0}%
                  </div>
                  <Progress 
                    value={userSummary?.success_rate_percent || 0} 
                    className="h-2 mt-2" 
                  />
                </CardContent>
              </Card>
            </div>

            {/* Platform Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Desempenho por Plataforma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {platformMetrics.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma publicação ainda.
                    </p>
                  ) : (
                    platformMetrics.map((platform) => {
                      const Icon = getPlatformIcon(platform.platform);
                      return (
                        <div key={platform.platform} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${getPlatformColor(platform.platform)}`} />
                              <span className="font-semibold capitalize">{platform.platform}</span>
                            </div>
                            <span className="text-sm font-bold text-primary">
                              {platform.success_rate_percent}%
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{platform.successful_posts} publicados</span>
                            <span>{platform.failed_posts} falhas</span>
                            <span>{platform.total_attempts} tentativas</span>
                          </div>
                          <Progress 
                            value={platform.success_rate_percent} 
                            className="h-2"
                          />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Informações do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <span className="text-sm font-medium">Total de Publicações</span>
                    <span className="font-bold">{userSummary?.total_publications || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <span className="text-sm font-medium">Alvos Publicados</span>
                    <span className="font-bold">{userSummary?.total_targets || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <span className="text-sm font-medium">Retry Automático</span>
                    <span className="font-bold text-emerald-500">Ativo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <span className="text-sm font-medium">Máximo de Tentativas</span>
                    <span className="font-bold">3</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
