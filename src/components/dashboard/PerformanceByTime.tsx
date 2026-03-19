import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Trophy, AlertCircle, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsService, TimeBandMetric } from "@/services/analytics.service";

export function PerformanceByTime() {
  const [metrics, setMetrics] = useState<TimeBandMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const data = await analyticsService.getTimeBandMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Error loading time band metrics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <Card className="premium-card h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </Card>
    );
  }

  const bestBand = metrics[0];
  const hasData = metrics.some(m => m.count > 0);

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-3 font-display font-bold text-text-primary">
          <TrendingUp className="w-5 h-5 text-primary" />
          Melhores Horários para Publicar
        </CardTitle>
        <p className="text-sm text-text-secondary font-medium">
          Análise de performance baseada no histórico de publicações.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-4">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-text-muted" />
            <p className="text-sm text-text-secondary font-bold max-w-[200px]">
              Dados insuficientes para uma conclusão confiável.
            </p>
          </div>
        ) : (
          <>
            {/* Ranking Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.map((m, i) => (
                <div 
                  key={m.band} 
                  className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
                    i === 0 
                      ? "bg-accent/10 border-accent/30 ring-1 ring-accent/20" 
                      : "bg-secondary/20 border-border/40"
                  }`}
                >
                  {i === 0 && (
                    <div className="absolute top-0 right-0 p-2">
                      <Trophy className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
                      {i + 1}º Lugar • {m.window}
                    </span>
                    <h4 className="text-lg font-bold text-text-primary">{m.band}</h4>
                    
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className={`text-3xl font-black ${i === 0 ? "text-primary" : "text-text-primary"}`}>
                        {m.performanceScore}%
                      </span>
                      <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">
                        performance
                      </span>
                    </div>
                    
                    <p className="text-xs text-text-muted font-medium mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      {m.count} post{m.count !== 1 ? 's' : ''} analisado{m.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actionable Golden Insight */}
            {bestBand && bestBand.count > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2 relative overflow-hidden group hover:shadow-glow transition-all">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5"><Zap className="w-3 h-3" /> O QUE FAZER</h4>
                   <p className="text-sm font-bold text-text-primary">Programe seu próximo post para <span className="underline decoration-primary/40 underline-offset-2">{bestBand.band}</span> <span className="text-text-secondary">({bestBand.window})</span>.</p>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary flex items-center gap-1.5"><Clock className="w-3 h-3" /> POR QUE FUNCIONA</h4>
                   <p className="text-[13px] font-medium text-text-secondary leading-relaxed">
                    {bestBand.band === "Noite" && "Este horário concentra o pico de engajamento do seu nicho, com menor concorrência no feed."}
                    {bestBand.band === "Tarde" && "Sua audiência tem mostrado picos de resposta e compartilhamento no meio do dia."}
                    {bestBand.band === "Manhã" && "O algoritmo prioriza seu conteúdo logo cedo, garantindo alta retenção inicial."}
                    {!["Noite", "Tarde", "Manhã"].includes(bestBand.band) && "Este é o momento de maior atividade histórica da sua base de seguidores."}
                   </p>
                </div>
                
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp className="w-12 h-12 text-emerald-500" /></div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 relative z-10">IMPACTO ESPERADO</h4>
                   <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-300 relative z-10 leading-relaxed">
                     Potencial de +30% na taxa de retenção inicial e maior distribuição orgânica nas primeiras 2 horas.
                   </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-secondary/30 border border-border/40 text-center">
                <p className="text-[14px] font-medium text-text-secondary">
                  Continue publicando em horários variados para que a IA identifique o melhor padrão de crescimento para seu perfil.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
