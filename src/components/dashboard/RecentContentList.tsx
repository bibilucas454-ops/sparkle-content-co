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
      <Card className="h-full border-border/50 bg-card/30">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 font-display">
            <Clock className="w-5 h-5 text-blue-500" />
            Conteúdo Recente
          </CardTitle>
          <Link
            to="/saved"
            className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
          >
            Ver tudo <ArrowRight className="w-3 h-3" />
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
                className="group flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1 min-w-0 pr-4">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {c.topic}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {c.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      •
                    </span>
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
  );
}
