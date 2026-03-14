import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/CopyButton";
import { Bot, Sparkles, Terminal, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function GrokPrompt() {
  const [tema, setTema] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleGenerate = () => {
    if (!tema.trim()) {
      toast.error("Por favor, insira um tema para o vídeo.");
      return;
    }

    const prompt = `Crie um roteiro curto e altamente viral para vídeo curto estilo TikTok / Reels / Shorts.

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
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
                Prompt Grok IA
              </h1>
              <p className="text-muted-foreground mt-2 text-base md:text-lg">
                Engenharia de prompt otimizada para o motor Grok da xAI produzir roteiros estelares.
              </p>
            </div>
          </div>
        </header>

        <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 md:p-10 space-y-8">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <Terminal className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground font-display tracking-tight">Parâmetros do Prompt</h3>
          </div>
          
          <div className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
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
              variant="glow" 
              className="w-full text-lg shadow-xl shadow-primary/20 transition-all hover:shadow-primary/40 rounded-2xl h-16 border border-primary/30 group relative overflow-hidden font-bold"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Sparkles className="w-6 h-6 mr-3 text-primary-foreground/90" />
              SINTETIZAR PROMPT
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
                className="rounded-2xl border border-border/50 bg-[#0A0A0A] p-6 md:p-8 relative overflow-hidden group shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
                <div className="absolute left-0 top-1 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-transparent"></div>
                
                <div className="flex justify-between items-center mb-6 pl-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Grok.md</span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-border/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-border/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-border/80"></div>
                  </div>
                </div>

                <pre className="text-sm md:text-base font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed font-light pl-4 custom-scrollbar overflow-x-auto">
                  {generatedPrompt}
                </pre>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
