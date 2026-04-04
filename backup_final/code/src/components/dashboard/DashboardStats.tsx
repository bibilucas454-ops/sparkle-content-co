import React from "react";
import { motion } from "framer-motion";
import { FileText, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsProps {
  contentCount: number;
  avgScore: number;
  trendsCount: number;
  loading: boolean;
}

export function DashboardStats({
  contentCount,
  avgScore,
  trendsCount,
  loading,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Score Viral Médio",
      value: avgScore,
      icon: TrendingUp,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      tooltip: "Potencial médio de viralização dos seus conteúdos baseados em nossa IA.",
    },
    {
      label: "Temas em Alta",
      value: trendsCount,
      icon: Zap,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      tooltip: "Tópicos com alta demanda e baixa concorrência no momento.",
    },
    {
      label: "Conteúdos Criados",
      value: contentCount,
      icon: FileText,
      color: "text-indigo-500 dark:text-indigo-400",
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      tooltip: "Total de conteúdos gerados ou gerenciados por você.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card className="premium-card overflow-hidden relative group">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-secondary flex items-center gap-1.5 cursor-help" title={s.tooltip}>
                    {s.label}
                    <span className="w-3 h-3 rounded-full border border-border flex items-center justify-center text-[8px] opacity-50 hover:opacity-100 transition-opacity">?</span>
                  </p>
                  <p className="text-4xl font-black font-display tracking-tight text-text-primary">
                    {loading ? "-" : s.value}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${s.bg} transition-all duration-300 group-hover:scale-105 shadow-sm`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
