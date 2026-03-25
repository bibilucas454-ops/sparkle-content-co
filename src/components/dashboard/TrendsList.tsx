import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Hash, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViralScore } from "@/components/ViralScore";
import { Trend } from "@/types/dashboard";

interface TrendsListProps {
  trends: Trend[];
  loading: boolean;
}

export function TrendsList({ trends, loading }: TrendsListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="premium-card h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-display font-bold text-text-primary">
                  Tendências do Dia
                </CardTitle>
                <p className="text-xs text-text-muted font-medium mt-0.5">
                  Topics mais quentes agora
                </p>
              </div>
            </div>
            <Link
              to="/trends"
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4">
                  <div className="w-8 h-8 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : trends.length > 0 ? (
            trends.slice(0, 5).map((t, index) => (
              <div
                key={t.id}
                className="group flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-secondary/10 hover:bg-secondary/40 hover:border-primary/20 hover:shadow-md transition-all duration-200"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                  index === 0 
                    ? "bg-amber-500/20 text-amber-500" 
                    : index === 1 
                    ? "bg-zinc-400/20 text-zinc-500"
                    : index === 2
                    ? "bg-orange-400/20 text-orange-500"
                    : "bg-secondary text-text-muted"
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {t.platform}
                    </span>
                    <span className="text-[10px] font-medium text-text-muted flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {t.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-text-primary truncate group-hover:text-primary transition-colors">
                    {t.topic}
                  </h3>
                </div>
                
                <div className="flex-shrink-0">
                  <ViralScore score={t.trending_score} size="sm" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-sm font-medium text-text-secondary">
                Nenhuma tendência encontrada hoje.
              </p>
              <p className="text-xs text-text-muted mt-1">
                Volte mais tarde para novas tendências.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
