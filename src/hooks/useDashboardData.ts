import { useState, useEffect } from "react";
import { Trend, ContentItem } from "@/types/dashboard";
import { dashboardService } from "@/services/dashboard.service";

export function useDashboardData() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [contentCount, setContentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trendsData, contentsData] = await Promise.all([
          dashboardService.getTrends(4),
          dashboardService.getRecentContent(5),
        ]);

        if (trendsData) setTrends(trendsData);
        if (contentsData) {
          setRecentContent(contentsData);
          setContentCount(contentsData.length);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const avgScore = recentContent.length
    ? Math.round(
        recentContent.reduce((a, b) => a + (b.viral_score || 0), 0) /
          recentContent.length
      )
    : 0;

  return {
    trends,
    recentContent,
    contentCount,
    avgScore,
    loading,
  };
}
