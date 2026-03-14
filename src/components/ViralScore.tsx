import { Flame, Activity, TrendingUp } from "lucide-react";

interface ViralScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ViralScore({ score, size = "md", showLabel = false }: ViralScoreProps) {
  const getTheme = () => {
    if (score >= 90) return { color: "text-orange-500", bg: "bg-orange-500", shadow: "shadow-orange-500/20", icon: Flame, title: "Potencial Viral Extremo" };
    if (score >= 70) return { color: "text-primary", bg: "bg-primary", shadow: "shadow-primary/20", icon: TrendingUp, title: "Alta Probabilidade de Retenção" };
    if (score >= 50) return { color: "text-yellow-500", bg: "bg-yellow-500", shadow: "shadow-yellow-500/20", icon: TrendingUp, title: "Bom Engajamento Previsto" };
    return { color: "text-muted-foreground", bg: "bg-secondary", shadow: "shadow-black/10", icon: Activity, title: "Score Padrão" };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  if (showLabel) {
    return (
      <div className={`flex items-center gap-4 glow-card p-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl ${theme.shadow}`}>
        <div className={`p-3 rounded-xl bg-background border border-border/50 shadow-sm flex items-center justify-center`}>
          <Icon className={`${iconSizes[size]} ${theme.color}`} />
        </div>
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-end gap-1.5 leading-none">
            <span className={`font-black font-display tracking-tight text-3xl ${theme.color}`}>{score}</span>
            <span className="text-sm text-muted-foreground font-semibold pb-0.5">/ 100</span>
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-foreground/80">{theme.title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end gap-1 relative">
        <span className={`font-black font-display ${sizeClasses[size]} ${theme.color} leading-none`}>{score}</span>
        {size !== "sm" && <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase absolute -bottom-4 right-0 leading-none whitespace-nowrap">{theme.title}</span>}
      </div>
      {(size !== "sm" || score >= 70) && (
        <div className={`p-2 rounded-lg bg-background border border-border/50 shadow-sm`}>
          <Icon className={`${iconSizes[size]} ${theme.color}`} />
        </div>
      )}
    </div>
  );
}
