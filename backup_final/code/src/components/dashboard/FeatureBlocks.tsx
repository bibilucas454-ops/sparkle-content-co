import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, BookOpen, Bot, Edit3, Hash } from "lucide-react";
import { Search } from "lucide-react";

export function FeatureBlocks() {
  const features = [
    {
      title: "Ideia Viral",
      description: "Gere ideias com alto potencial de viralização para qualquer nicho.",
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      link: "/generate?type=viral-idea",
    },
    {
      title: "Hook (Gancho)",
      description: "Crie aberturas magnéticas que capturam atenção nos primeiros segundos.",
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      link: "/hooks",
    },
    {
      title: "Prompt Grok",
      description: "Estrutura pronta para gerar roteiros virais usando IA avançada.",
      icon: <Bot className="w-6 h-6 text-green-500" />,
      link: "/prompt-grok",
    },
    {
      title: "Legenda AIDA",
      description: "Legendas persuasivas focadas em atenção, interesse, desejo e ação.",
      icon: <Edit3 className="w-6 h-6 text-purple-500" />,
      link: "/generate?type=caption",
    },
    {
      title: "Hashtags",
      description: "Conjuntos de hashtags otimizadas estrategicamente para máximo alcance.",
      icon: <Hash className="w-6 h-6 text-pink-500" />,
      link: "/generate?type=hashtags",
    },
    {
      title: "Tags SEO",
      description: "SEO agressivo para YouTube Shorts e Instagram para otimizar o algoritmo.",
      icon: <Search className="w-6 h-6 text-orange-500" />,
      link: "/generate?type=tags",
    },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-xl font-display font-bold text-foreground mb-4">Ferramentas Criativas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.1 }}
          >
            <Link 
              to={f.link}
              className="premium-card p-8 group block h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-2"
            >
              <div className="absolute top-0 left-0 w-1 h-0 bg-primary group-hover:h-full transition-all duration-300 ease-out"></div>
              
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 w-fit rounded-2xl border border-primary/10 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {f.icon}
                </div>
                
                <div>
                  <h4 className="font-bold text-xl text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {f.title}
                  </h4>
                  <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] font-black text-primary uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                  <span>Acessar</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
