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
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Score Viral Médio",
      value: avgScore,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Temas em Alta",
      value: trendsCount,
      icon: Zap,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
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
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative group hover:border-border transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-3xl font-bold font-display tracking-tight">
                    {loading ? "-" : s.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${s.bg}`}>
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
