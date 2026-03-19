import React from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";

import { TrendingUp } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { HeroQuickAction } from "@/components/dashboard/HeroQuickAction";
import { TrendsList } from "@/components/dashboard/TrendsList";
import { RecentContentList } from "@/components/dashboard/RecentContentList";
import { FeatureBlocks } from "@/components/dashboard/FeatureBlocks";
import { PerformanceByTime } from "@/components/dashboard/PerformanceByTime";

export default function Dashboard() {
  const { user } = useAuth();
  const { trends, recentContent, contentCount, avgScore, loading } =
    useDashboardData();

  return (
    <AppLayout>
      <div className="space-y-8 md:space-y-12 animate-fade-in max-w-7xl mx-auto pb-12">
        
        {/* Superior Hero Section */}
        <section className="space-y-6">
          <header className="mb-10 last:mb-0">
            <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-text-primary leading-tight">
              Bem-vindo, {user?.email?.split('@')[0]}
            </h1>
            <p className="text-text-secondary mt-3 text-base md:text-xl font-medium max-w-2xl leading-relaxed">
              Aqui está uma visão geral da sua performance e ações rápidas.
            </p>
          </header>
          <HeroQuickAction />
        </section>

        {/* Core Features as Visual Cards */}
        <section className="space-y-4">
          <FeatureBlocks />
        </section>

        {/* Metrics and Recent */}
        <section className="space-y-8 pt-10 border-t border-border/60">
          <h3 className="text-2xl font-display font-black text-text-primary tracking-tight flex items-center gap-3">
             <TrendingUp className="w-6 h-6 text-primary" /> Visão Geral de Performance
          </h3>
          <DashboardStats
            contentCount={contentCount}
            avgScore={avgScore}
            trendsCount={trends.length}
            loading={loading}
          />

          <PerformanceByTime />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            <TrendsList trends={trends} loading={loading} />
            <RecentContentList recentContent={recentContent} loading={loading} />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
