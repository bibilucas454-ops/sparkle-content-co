import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowRight, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ViralScore } from "@/components/ViralScore";
import { ContentItem } from "@/types/dashboard";

interface RecentContentListProps {
  recentContent: ContentItem[];
  loading: boolean;
}

export function RecentContentList({
  recentContent,
  loading,
}: RecentContentListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="premium-card h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Clock className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-display font-bold text-text-primary">
                  Conteúdo Recente
                </CardTitle>
                <p className="text-xs text-text-muted font-medium mt-0.5">
                  Suas últimas criações
                </p>
              </div>
            </div>
            <Link
              to="/saved"
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
            >
              Ver tudo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center gap-4 p-3"
                >
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                  <div className="h-8 w-14 bg-muted rounded-full"></div>
                </div>
              ))}
            </div>
          ) : recentContent.length > 0 ? (
            recentContent.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-secondary/5 hover:bg-secondary/30 hover:border-primary/20 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                    {c.topic}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {c.type}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <ViralScore score={c.viral_score || 0} size="sm" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-sm font-medium text-text-secondary">
                Você ainda não criou conteúdo.
              </p>
              <p className="text-xs text-text-muted mt-1 mb-4">
                Comece agora e acompanhe seu progresso.
              </p>
              <Button variant="outline" size="sm" asChild className="border-primary/30 text-primary hover:bg-primary/10">
                <Link to="/generate">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar agora
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
