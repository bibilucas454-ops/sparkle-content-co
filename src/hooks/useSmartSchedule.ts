import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getNextContentSlot, formatDateTimeForInput, formatDateTimeDisplay, type SlotResult } from "@/lib/schedule-utils";

interface SmartScheduleSuggestion {
  recommendedDate: Date;
  reason: string;
  basedOnLastPost: boolean;
  lastPostDate: Date | null;
  slotResult?: SlotResult;
  lastPostFormatted: string | null;
  nextPostFormatted: string;
}

const FORMAT_LABELS: Record<string, string> = {
  reels: "Reels",
  carousel: "Carrossel",
  story: "Story",
};

export function useSmartSchedule(selectedFormat: string) {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<SmartScheduleSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id && selectedFormat) {
      analyzeAndSuggest();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        .is("deleted_at", null)
        .in("overall_status", ["published", "publicado", "pendente", "scheduled"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.warn("Error fetching publications:", error);
        setSuggestion(getDefaultSuggestion());
        setLoading(false);
        return;
      }

      const lastDate = publications && publications.length > 0
        ? new Date(publications[0].scheduled_for || publications[0].created_at)
        : null;

      const slotResult = getNextContentSlot(lastDate, "America/Sao_Paulo");

      const lastLabel = FORMAT_LABELS[selectedFormat] || selectedFormat;
      
      if (slotResult.lastPublishedAt) {
        const lastFormatted = formatDateTimeDisplay(slotResult.lastPublishedAt);
        const nextFormatted = formatDateTimeDisplay(slotResult.nextSuggestedAt);
        const isNextDay = slotResult.nextSuggestedAt.getDate() !== slotResult.lastPublishedAt.getDate();
        
        let reason = `Último ${lastLabel}: ${lastFormatted}`;
        if (isNextDay) {
          reason += ` → Próximo: ${nextFormatted}`;
        } else {
          reason += ` → Próximo ${lastLabel}: ${nextFormatted.split(" ")[1]}`;
        }
        
        if (slotResult.fallbackUsed) {
          reason += " (horário não-padrão)";
        }

        setSuggestion({
          recommendedDate: slotResult.nextSuggestedAt,
          reason,
          basedOnLastPost: true,
          lastPostDate: slotResult.lastPublishedAt,
          slotResult,
          lastPostFormatted: lastFormatted,
          nextPostFormatted: nextFormatted,
        });
      } else {
        const nextFormatted = formatDateTimeDisplay(slotResult.nextSuggestedAt);
        setSuggestion({
          recommendedDate: slotResult.nextSuggestedAt,
          reason: `Primeiro ${lastLabel}: ${nextFormatted}`,
          basedOnLastPost: false,
          lastPostDate: null,
          slotResult,
          lastPostFormatted: null,
          nextPostFormatted: nextFormatted,
        });
      }

    } catch (error) {
      console.error("Error in smart schedule:", error);
      setSuggestion(getDefaultSuggestion());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSuggestion = (): SmartScheduleSuggestion => {
    const slotResult = getNextContentSlot(null, "America/Sao_Paulo");
    const formatLabel = FORMAT_LABELS[selectedFormat] || selectedFormat;
    const nextFormatted = formatDateTimeDisplay(slotResult.nextSuggestedAt);
    
    return {
      recommendedDate: slotResult.nextSuggestedAt,
      reason: `Sugestão ${formatLabel}: ${nextFormatted}`,
      basedOnLastPost: false,
      lastPostDate: null,
      slotResult,
      lastPostFormatted: null,
      nextPostFormatted: nextFormatted,
    };
  };

  const applySuggestion = () => {
    if (!suggestion) return null;
    return formatDateTimeForInput(suggestion.recommendedDate);
  };

  return {
    suggestion,
    loading,
    applySuggestion,
  };
}
