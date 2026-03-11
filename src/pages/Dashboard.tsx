import React from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { HeroQuickAction } from "@/components/dashboard/HeroQuickAction";
import { TrendsList } from "@/components/dashboard/TrendsList";
import { RecentContentList } from "@/components/dashboard/RecentContentList";

export default function Dashboard() {
  const { user } = useAuth();
  const { trends, recentContent, contentCount, avgScore, loading } =
    useDashboardData();

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <DashboardHeader email={user?.email} />

        <DashboardStats
          contentCount={contentCount}
          avgScore={avgScore}
          trendsCount={trends.length}
          loading={loading}
        />

        <HeroQuickAction />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          <TrendsList trends={trends} loading={loading} />
          <RecentContentList recentContent={recentContent} loading={loading} />
        </div>
      </div>
    </AppLayout>
  );
}
