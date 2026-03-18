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
      label: "Conteúdos Criados",
      value: contentCount,
      icon: FileText,
      color: "text-indigo-500 dark:text-indigo-400",
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    },
    {
      label: "Score Viral Médio",
      value: avgScore,
      icon: TrendingUp,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      label: "Temas em Alta",
      value: trendsCount,
      icon: Zap,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
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
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-text-secondary">
                    {s.label}
                  </p>
                  <p className="text-4xl font-black font-display tracking-tighter text-text-primary">
                    {loading ? "-" : s.value}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl ${s.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                  <s.icon className={`w-7 h-7 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
