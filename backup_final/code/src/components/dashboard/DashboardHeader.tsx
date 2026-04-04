import React from "react";

interface DashboardHeaderProps {
  email?: string;
}

export function DashboardHeader({ email }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
          Visão Geral
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Bem-vindo de volta,{" "}
          <span className="text-foreground font-medium">
            {email?.split("@")[0] || "Visitante"}
          </span>
          . Aqui está o resumo de hoje.
        </p>
      </div>
    </div>
  );
}
