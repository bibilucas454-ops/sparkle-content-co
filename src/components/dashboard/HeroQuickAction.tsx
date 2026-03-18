import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Bot, BookOpen } from "lucide-react";

export function HeroQuickAction() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="text-center md:text-left space-y-8 bg-gradient-to-br from-primary/5 via-background to-background p-8 md:p-12 rounded-3xl border border-primary/10 relative overflow-hidden shadow-glass"
    >
      <div className="absolute top-0 right-0 w-full h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="space-y-5 relative z-10 max-w-3xl">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black font-display tracking-tighter text-foreground leading-[1] text-gradient-primary">
          Seu Império de Conteúdo <br className="hidden lg:block"/> Começa Aqui.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground/80 font-medium leading-relaxed max-w-2xl">
          Use inteligência artificial para dominar algoritmos, capturar atenção e escalar sua presença digital com CreatorOS.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 relative z-10">
        <Link 
          to="/generate"
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-glow hover:-translate-y-1 transition-all text-[16px] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <Zap className="w-5 h-5 relative z-10 fill-current" />
          <span className="relative z-10">Novo Conteúdo Viral</span>
        </Link>
        
        <Link 
          to="/hooks"
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-secondary/50 hover:bg-secondary text-foreground font-bold rounded-2xl border border-border/30 hover:border-primary/30 transition-all text-[15px] backdrop-blur-sm"
        >
          <BookOpen className="w-5 h-5 opacity-70" />
          Hooks
        </Link>
        
        <Link 
          to="/prompt-grok"
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-secondary/50 hover:bg-secondary text-foreground font-bold rounded-2xl border border-border/30 hover:border-primary/30 transition-all text-[15px] backdrop-blur-sm"
        >
          <Bot className="w-5 h-5 opacity-70" />
          Prompt IA
        </Link>
      </div>
    </motion.div>
  );
}
