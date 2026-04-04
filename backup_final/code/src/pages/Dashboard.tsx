import React from "react";
import AppLayout from "@/components/AppLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Link } from "react-router-dom";

import { Zap, BookOpen, ArrowRight, Sparkles, Megaphone } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { PerformanceByTime } from "@/components/dashboard/PerformanceByTime";
import { TrendsList } from "@/components/dashboard/TrendsList";
import { RecentContentList } from "@/components/dashboard/RecentContentList";

export default function Dashboard() {
  const { trends, recentContent, contentCount, avgScore, loading } = useDashboardData();

  const quickActions = [
    {
      title: "Gerar Conteúdo",
      description: "Crie ideas, hooks, roteiros e legendas",
      icon: <Sparkles className="w-6 h-6" />,
      link: "/generate",
      color: "from-primary to-pink-500",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Biblioteca de Hooks",
      description: "Ganchos psicológicos comprovados",
      icon: <BookOpen className="w-6 h-6" />,
      link: "/hooks",
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Prompt de Vídeo IA",
      description: "Roteiros com Grok Vision",
      icon: <Megaphone className="w-6 h-6" />,
      link: "/prompt-grok",
      color: "from-green-500 to-emerald-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
        
        {/* 1. HERO */}
        <section>
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-background">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 p-6 md:p-8">
              <div className="max-w-2xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-display tracking-tight text-text-primary leading-[1.15] mb-3">
                  Transforme ideias em <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">conteúdo viral</span>
                </h1>
                
                <p className="text-base text-text-secondary font-medium leading-relaxed max-w-lg mb-6">
                  Acompanhe o impacto do seu conteúdo e descubra onde focar para escalar sua audiência.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link 
                  to="/generate"
                  className="group relative flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  <Zap className="w-5 h-5" />
                  <span className="text-base">Gerar Conteúdo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link 
                  to="/hooks"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-secondary/60 hover:bg-secondary text-text-primary font-medium rounded-xl border border-border/50 hover:border-primary/30 transition-all"
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Hooks</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2. KPIs PRINCIPAIS */}
        <section>
          <DashboardStats
            contentCount={contentCount}
            avgScore={avgScore}
            trendsCount={trends.length}
            loading={loading}
          />
        </section>

        {/* 3. DESTAQUE: MELHORES HORÁRIOS */}
        <section>
          <PerformanceByTime />
        </section>

        {/* 4. AÇÕES PRINCIPAIS */}
        <section className="space-y-4">
          <h2 className="text-xl font-black font-display text-text-primary tracking-tight">
            Ações
          </h2>
          
          {/* Grid de Ações - 3 cards principais mais largos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                className="group premium-card p-5 relative overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
              >
                <div className={`w-10 h-10 rounded-xl ${action.bg} border ${action.border} flex items-center justify-center mb-3 transition-transform group-hover:scale-105`}>
                  <div className={`bg-gradient-to-r ${action.color} text-white`}>
                    {action.icon}
                  </div>
                </div>
                
                <h3 className="font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* TRENDS E CONTEÚDO RECENTE - LADO A LADO */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 pt-4">
          <div className="lg:col-span-3">
            <TrendsList trends={trends} loading={loading} />
          </div>
          <div className="lg:col-span-2">
            <RecentContentList recentContent={recentContent} loading={loading} />
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
