import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowRight, FileText } from "lucide-react";
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
        <CardHeader className="pb-6 flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2 font-display font-bold">
            <Clock className="w-5 h-5 text-indigo-500 fill-current" />
            Conteúdo Recente
          </CardTitle>
          <Link
            to="/saved"
            className="text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-all flex items-center gap-1.5"
          >
            Ver tudo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex justify-between items-center py-2"
                >
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
              <div
                key={c.id}
                className="group flex items-center justify-between p-5 rounded-2xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/20 transition-all duration-300"
              >
                <div className="space-y-2 min-w-0 pr-4">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {c.topic}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                      {c.type}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      •
                    </span>
                    <span className="text-[10px] font-bold text-text-secondary">
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
  );
}
