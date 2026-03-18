import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/CopyButton";
import { Bot, Sparkles, Terminal, Code2, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNiche } from "@/contexts/NicheContext";

export default function GrokPrompt() {
  const { niche } = useNiche();
  const [tema, setTema] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleGenerate = () => {
    if (!tema.trim()) {
      toast.error("Por favor, insira um tema para o vídeo.");
      return;
    }

    const prompt = `Crie um roteiro curto e altamente viral para vídeo curto estilo TikTok / Reels / Shorts.

Público Alvo / Nicho do Criador: ${niche}
Tema: ${tema.trim()}

Estrutura obrigatória:
1. Hook extremamente forte nos primeiros 3 segundos
2. Explicação rápida e visual
3. Momento surpresa ou insight
4. Call to action

Formato:
[HOOK]
...

[CENA 1]
...

[CENA 2]
...

[CENA 3]
...

[CALL TO ACTION]
...`;

    setGeneratedPrompt(prompt);
  };

  return (
    <AppLayout>
      <div className="space-y-10 animate-fade-in max-w-4xl mx-auto pb-12">
        <header className="pb-8 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl shadow-primary/10">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-foreground leading-none">
                  Prompt Grok IA
                </h1>
                <p className="text-muted-foreground mt-3 text-base md:text-xl font-medium max-w-xl leading-relaxed">
                  Engenharia de prompt otimizada para o motor Grok da xAI produzir roteiros estelares.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary w-fit px-4 py-2 rounded-xl h-fit">
              <Target className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wide">Foco Ativo: {niche}</span>
            </div>
          </div>
        </header>

        <div className="premium-card p-8 md:p-12 space-y-10">
          <div className="flex items-center gap-3 border-b border-border/40 pb-6">
            <Terminal className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-bold text-foreground font-display tracking-tight">Parâmetros do Prompt</h3>
          </div>
          
          <div className="space-y-4">
            <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
              Qual é o tema central? <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ex: Como a inteligência artificial está mudando o mercado criativo em 2026..."
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="bg-secondary/40 border-border/60 text-lg py-7 shadow-inner focus-visible:ring-primary/40 focus-visible:border-primary/40 font-medium placeholder:text-muted-foreground/40 rounded-xl"
            />
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleGenerate} 
              variant="premium" 
              className="w-full text-lg rounded-2xl h-16 group relative overflow-hidden font-bold transition-all hover:scale-[1.01]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Sparkles className="w-6 h-6 mr-3 text-white fill-current" />
              SINTETIZAR PROMPT MESTRE
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {generatedPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Code2 className="w-6 h-6 text-primary" />
                  <h2 className="font-display font-bold text-2xl tracking-tight text-foreground">Output Gerado</h2>
                </div>
                <div className="bg-background rounded-md border border-border/50 shadow-sm">
                  <CopyButton text={generatedPrompt} />
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="premium-card p-8 md:p-12 relative overflow-hidden group shadow-2xl ring-1 ring-primary/10"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-400 to-primary opacity-80"></div>
                
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Grok Prompt Editor</span>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  </div>
                </div>

                <div className="bg-secondary/40 p-8 rounded-2xl border border-border/20 shadow-inner">
                  <pre className="text-sm md:text-base font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed font-medium custom-scrollbar overflow-x-auto">
                    {generatedPrompt}
                  </pre>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
