interface ViralScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ViralScore({ score, size = "md" }: ViralScoreProps) {
  const getColor = () => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    if (score >= 40) return "text-accent";
    return "text-destructive";
  };

  const getLabel = () => {
    if (score >= 80) return "🔥 Viral";
    if (score >= 60) return "📈 High";
    if (score >= 40) return "📊 Medium";
    return "📉 Low";
  };

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`font-bold font-display ${sizeClasses[size]} ${getColor()}`}>{score}</span>
      <span className="text-xs text-muted-foreground">{getLabel()}</span>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            score >= 80
              ? "bg-success"
              : score >= 60
              ? "bg-warning"
              : score >= 40
              ? "bg-accent"
              : "bg-destructive"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
