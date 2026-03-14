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
      className="text-center md:text-left space-y-6 bg-gradient-to-br from-card/30 via-background to-background p-6 md:p-10 rounded-3xl border border-border/50 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-full h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="space-y-4 relative z-10 max-w-3xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display tracking-tight text-foreground leading-[1.1]">
          Painel do CreatorOS
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground/90 font-medium">
          Crie conteúdos virais, analise tendências e publique com inteligência artificial.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 relative z-10">
        <Link 
          to="/generate"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-[15px] border border-primary/50 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Zap className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Gerar Conteúdo</span>
        </Link>
        
        <Link 
          to="/hooks"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-secondary/80 hover:bg-secondary text-foreground font-semibold rounded-xl border border-border/60 hover:border-border transition-all text-[15px]"
        >
          <BookOpen className="w-5 h-5 opacity-70" />
          Biblioteca de Hooks
        </Link>
        
        <Link 
          to="/prompt-grok"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-secondary/80 hover:bg-secondary text-foreground font-semibold rounded-xl border border-border/60 hover:border-border transition-all text-[15px]"
        >
          <Bot className="w-5 h-5 opacity-70" />
          Prompt para Grok
        </Link>
      </div>
    </motion.div>
  );
}
