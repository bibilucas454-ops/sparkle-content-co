import { supabase } from "@/integrations/supabase/client";
import { Trend, ContentItem } from "@/types/dashboard";

export const dashboardService = {
  async getTrends(limit: number = 4): Promise<Trend[]> {
    const { data, error } = await supabase
      .from("trends")
      .select("*")
      .order("trending_score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching trends:", error);
      throw error;
    }

    return data as Trend[];
  },

  async getRecentContent(limit: number = 5): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent content:", error);
      throw error;
    }

    // Map necessary fields accurately to ContentItem (ignoring unrelated database fields)
    return (data || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      topic: item.topic,
      viral_score: item.viral_score,
      created_at: item.created_at,
    }));
  },
};
