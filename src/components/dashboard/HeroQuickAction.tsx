import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function HeroQuickAction() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="glow-card border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card/60 backdrop-blur-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 group-hover:opacity-20 transition-all duration-700">
          <Sparkles className="w-32 h-32 text-primary" />
        </div>
        <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 md:hidden text-accent" />
              Gerar Conteúdo Viral
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Sem ideias hoje? Nossa IA analisa o que está em alta no seu nicho e
              cria roteiros, legendas e ganchos prontos para viralizar.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            variant="glow"
            className="w-full sm:w-auto font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 gap-2 h-14 rounded-xl text-[15px]"
          >
            <Link to="/generate">
              Começar a criar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
