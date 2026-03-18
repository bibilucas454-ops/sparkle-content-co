import React from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";

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
          <HeroQuickAction />
        </section>

        {/* Core Features as Visual Cards */}
        <section className="space-y-4">
          <FeatureBlocks />
        </section>

        {/* Metrics and Recent */}
        <section className="space-y-6 pt-6 border-t border-border/40">
          <h3 className="text-xl font-display font-bold text-foreground">Visão Geral da Conta</h3>
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
