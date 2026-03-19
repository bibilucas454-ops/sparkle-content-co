import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Trophy, AlertCircle, Loader2 } from "lucide-react";
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

            {/* Practical Insight */}
            <div className="p-5 rounded-xl bg-accent border border-accent-foreground/10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Insight Prático
              </h4>
              <p className="text-[15px] font-medium text-text-primary leading-relaxed">
                {bestBand && bestBand.count > 0 ? (
                  <>
                    Seu melhor horário hoje é <span className="text-primary font-black underline underline-offset-4 decoration-primary/30">{bestBand.band} ({bestBand.window})</span>. 
                    {bestBand.band === "Noite" && " O engajamento noturno está superando as outras faixas significativamente."}
                    {bestBand.band === "Tarde" && " A audiência no meio do dia tem mostrado uma resposta muito positiva."}
                    {bestBand.band === "Manhã" && " O público está consumindo seu conteúdo logo cedo com alta retenção."}
                  </>
                ) : (
                  "Continue publicando em horários variados para que possamos identificar o melhor padrão para seu perfil."
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
