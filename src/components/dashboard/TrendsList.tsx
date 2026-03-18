import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Hash } from "lucide-react";
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
        <CardHeader className="pb-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 font-display font-bold">
              <Zap className="w-5 h-5 text-amber-500 fill-current" />
              Tendências do Dia
            </CardTitle>
          </div>
          <Link
            to="/trends"
            className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5"
          >
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
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
              <div
                key={t.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/20 transition-all duration-300"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/10">
                      {t.platform}
                    </span>
                    <span className="text-[11px] font-bold text-muted-foreground/80 flex items-center gap-1.5 truncate">
                      <Hash className="w-3.5 h-3.5" /> {t.category}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {t.topic}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {t.description}
                  </p>
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
  );
}
