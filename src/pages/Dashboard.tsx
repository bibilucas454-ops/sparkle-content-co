import React from "react";
import AppLayout from "@/components/AppLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Link } from "react-router-dom";

import { TrendingUp, Zap, BookOpen, Layers, Clock, Target, Sparkles, ArrowRight, Hash, FileText, Megaphone, Calendar } from "lucide-react";
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
      title: "Plano de Stories",
      description: "Sequências estratégicas com funil",
      icon: <Layers className="w-6 h-6" />,
      link: "/story-plan",
      color: "from-pink-500 to-rose-500",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
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

  const tools = [
    { label: "Ideia Viral", icon: Zap, link: "/generate?type=viral-idea", color: "text-yellow-500" },
    { label: "Hook", icon: BookOpen, link: "/hooks", color: "text-blue-500" },
    { label: "Roteiro", icon: FileText, link: "/generate?type=script", color: "text-purple-500" },
    { label: "Legenda", icon: FileText, link: "/generate?type=caption", color: "text-pink-500" },
    { label: "Hashtags", icon: Hash, link: "/generate?type=hashtags", color: "text-orange-500" },
    { label: "Calendário", icon: Calendar, link: "/calendar", color: "text-emerald-500" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
        
        {/* 1. HERO FORTE */}
        <section>
          <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/8 via-background to-background shadow-2xl shadow-primary/5">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10 p-8 md:p-12">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span>Impulsione seu conteúdo</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display tracking-tighter text-text-primary leading-[1.1] mb-4">
                  Transforme ideias em <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">conteúdo viral</span>
                </h1>
                
                <p className="text-lg text-text-secondary font-medium leading-relaxed max-w-xl mb-8">
                  Acompanhe o impacto do seu conteúdo e descubra onde focar para escalar sua audiência.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link 
                  to="/generate"
                  className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Zap className="w-5 h-5" />
                  <span className="text-base">Gerar Conteúdo</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <div className="flex items-stretch sm:items-center gap-3">
                  <Link 
                    to="/story-plan"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-secondary/60 hover:bg-secondary text-text-primary font-bold rounded-2xl border border-border/40 hover:border-primary/30 transition-all"
                  >
                    <Layers className="w-5 h-5 text-pink-500" />
                    <span>Stories</span>
                  </Link>
                  
                  <Link 
                    to="/hooks"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-secondary/60 hover:bg-secondary text-text-primary font-bold rounded-2xl border border-border/40 hover:border-primary/30 transition-all"
                  >
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>Hooks</span>
                  </Link>
                </div>
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

        {/* 4. AÇÕES RÁPIDAS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black font-display text-text-primary tracking-tight">
              Ações Rápidas
            </h2>
            <Link 
              to="/generate"
              className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Grid de Ações Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={action.title}
                to={action.link}
                className="group premium-card p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className={`w-12 h-12 rounded-2xl ${action.bg} border ${action.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <div className={`bg-gradient-to-r ${action.color} text-white`}>
                    {action.icon}
                  </div>
                </div>
                
                <h3 className="font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-text-secondary font-medium">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Ferramentas Secundárias */}
          <div className="flex flex-wrap gap-2 pt-2">
            {tools.map((tool) => (
              <Link
                key={tool.label}
                to={tool.link}
                className="flex items-center gap-2 px-4 py-2 bg-secondary/40 hover:bg-secondary border border-border/40 hover:border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-all"
              >
                <tool.icon className={`w-4 h-4 ${tool.color}`} />
                {tool.label}
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
