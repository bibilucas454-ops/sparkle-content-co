import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SmartScheduleSuggestion {
  recommendedDate: Date;
  reason: string;
  basedOnLastPost: boolean;
  lastPostDate: Date | null;
}

const FORMAT_LABELS: Record<string, string> = {
  reels: "Reels",
  carousel: "Carrossel",
  story: "Story",
};

const DEFAULT_BEST_TIMES = [
  { day: 1, hour: 10, label: "Segunda-feira" },
  { day: 3, hour: 15, label: "Quarta-feira" },
  { day: 5, hour: 18, label: "Sexta-feira" },
];

export function useSmartSchedule(selectedFormat: string) {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<SmartScheduleSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id && selectedFormat) {
      analyzeAndSuggest();
    }
  }, [user?.id, selectedFormat]);

  const analyzeAndSuggest = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      const { data: publications, error } = await supabase
        .from("publications")
        .select("id, content_format, scheduled_for, overall_status, created_at")
        .eq("user_id", user.id)
        .eq("content_format", selectedFormat)
        .in("overall_status", ["published", "publicado"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.warn("Error fetching publications:", error);
        setSuggestion(getDefaultSuggestion());
        setLoading(false);
        return;
      }

      if (!publications || publications.length === 0) {
        setSuggestion(getDefaultSuggestion());
        setLoading(false);
        return;
      }

      const lastPost = publications[0];
      const lastPostDate = new Date(lastPost.created_at);
      const now = new Date();
      const daysSinceLastPost = Math.floor((now.getTime() - lastPostDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let recommendedDate = new Date();
      
      if (daysSinceLastPost < 2) {
        recommendedDate.setDate(recommendedDate.getDate() + (2 - daysSinceLastPost));
      }
      
      const formatBestTimes = getBestTimesForFormat(selectedFormat);
      recommendedDate.setHours(formatBestTimes.hour, 0, 0, 0);
      
      if (recommendedDate <= now) {
        recommendedDate.setDate(recommendedDate.getDate() + 1);
      }

      const dayName = recommendedDate.toLocaleDateString("pt-BR", { weekday: "long" });
      const formattedTime = recommendedDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      
      setSuggestion({
        recommendedDate,
        reason: `Último ${FORMAT_LABELS[selectedFormat] || selectedFormat} foi há ${daysSinceLastPost} dia(s). Melhor horário: ${dayName} às ${formattedTime}`,
        basedOnLastPost: true,
        lastPostDate: lastPostDate,
      });

    } catch (error) {
      console.error("Error in smart schedule:", error);
      setSuggestion(getDefaultSuggestion());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSuggestion = (): SmartScheduleSuggestion => {
    const formatBestTimes = getBestTimesForFormat(selectedFormat);
    const now = new Date();
    const nextDayWithBestTime = new Date(now);
    
    const daysUntilBest = (formatBestTimes.day - now.getDay() + 7) % 7;
    nextDayWithBestTime.setDate(now.getDate() + (daysUntilBest === 0 ? 7 : daysUntilBest));
    nextDayWithBestTime.setHours(formatBestTimes.hour, 0, 0, 0);

    return {
      recommendedDate: nextDayWithBestTime,
      reason: `Horário padrão para ${FORMAT_LABELS[selectedFormat] || selectedFormat}: ${formatBestTimes.label} às ${String(formatBestTimes.hour).padStart(2, '0')}:00`,
      basedOnLastPost: false,
      lastPostDate: null,
    };
  };

  const getBestTimesForFormat = (format: string) => {
    const defaults: Record<string, typeof DEFAULT_BEST_TIMES[0]> = {
      reels: { day: 5, hour: 18, label: "Sexta-feira" },
      carousel: { day: 3, hour: 15, label: "Quarta-feira" },
      story: { day: 1, hour: 10, label: "Segunda-feira" },
    };
    return defaults[format] || DEFAULT_BEST_TIMES[0];
  };

  const applySuggestion = () => {
    if (!suggestion) return null;
    
    const date = suggestion.recommendedDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return {
    suggestion,
    loading,
    applySuggestion,
  };
}
