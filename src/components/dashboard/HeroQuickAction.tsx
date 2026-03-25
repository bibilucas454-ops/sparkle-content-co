import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Bot, BookOpen, Layers, Target } from "lucide-react";

export function HeroQuickAction() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/8 via-background to-background shadow-2xl shadow-primary/5"
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
      
      <div className="relative z-10 p-8 md:p-12 lg:p-16">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Impulsione seu conteúdo</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display tracking-tighter text-text-primary leading-[1.1] mb-6">
            Transforme ideias em <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">conteúdo viral</span> em segundos
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary font-medium leading-relaxed max-w-2xl mb-10">
            Acompanhe o impacto do seu conteúdo e descubra onde focar hoje para escalar sua audiência.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
          <Link 
            to="/generate"
            className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <Zap className="w-5 h-5" />
            <span className="text-base">Gerar Conteúdo Viral</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <div className="flex items-stretch sm:items-center gap-3">
            <Link 
              to="/story-plan"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-secondary/60 hover:bg-secondary text-text-primary font-bold rounded-2xl border border-border/40 hover:border-primary/30 transition-all text-[15px]"
            >
              <Layers className="w-5 h-5 text-pink-500" />
              <span>Plano Stories</span>
            </Link>
            
            <Link 
              to="/hooks"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-secondary/60 hover:bg-secondary text-text-primary font-bold rounded-2xl border border-border/40 hover:border-primary/30 transition-all text-[15px]"
            >
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Hooks</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-8 mt-10 pt-8 border-t border-border/20">
          <div className="flex items-center gap-2 text-text-muted">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium">IA otimizando retention</span>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Foco no seu nicho</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
