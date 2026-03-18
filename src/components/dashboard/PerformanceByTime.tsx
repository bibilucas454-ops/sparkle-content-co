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
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 font-display">
          <TrendingUp className="w-5 h-5 text-accent" />
          Melhores Horários para Publicar
        </CardTitle>
        <p className="text-xs text-muted-foreground font-medium">
          Análise de performance baseada no histórico de publicações.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-4">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground font-medium max-w-[200px]">
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
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {i + 1}º Lugar • {m.window}
                    </span>
                    <h4 className="font-bold text-foreground">{m.band}</h4>
                    
                    <div className="mt-3 flex items-end gap-1.5">
                      <span className={`text-2xl font-black ${i === 0 ? "text-accent" : "text-foreground"}`}>
                        {m.performanceScore}%
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold pb-1 lowercase">
                        performance
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {m.count} post{m.count !== 1 ? 's' : ''} analisado{m.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Practical Insight */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Insight Prático
              </h4>
              <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                {bestBand && bestBand.count > 0 ? (
                  <>
                    Seu melhor horário hoje é <span className="text-accent font-bold">{bestBand.band} ({bestBand.window})</span>. 
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
