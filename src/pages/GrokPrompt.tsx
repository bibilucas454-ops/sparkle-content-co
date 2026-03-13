import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/CopyButton";
import { Bot, Sparkles } from "lucide-react";
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
Hook:
...

Cena 1:
...

Cena 2:
...

Cena 3:
...

Call to action:
...`;

    setGeneratedPrompt(prompt);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-gradient-silver flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            Prompt de Vídeo IA
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Gere o prompt perfeito para criar roteiros virais usando o Grok da xAI.
          </p>
        </div>

        <div className="glow-card rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground tracking-wide block">
              Qual é o tema do seu vídeo?
            </label>
            <Input
              placeholder="Ex: Como a inteligência artificial está mudando o mercado financeiro"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="bg-secondary/50 border-border text-lg py-6 shadow-inner focus-visible:ring-primary/50"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            variant="glow" 
            className="w-full text-lg shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 h-14"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Gerar Prompt para Grok
          </Button>
        </div>

        <AnimatePresence>
          {generatedPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-xl tracking-tight">Seu Prompt Otimizado</h2>
                <CopyButton text={generatedPrompt} />
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border bg-black/40 p-6 md:p-8 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
                <pre className="text-sm md:text-base font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed font-light">
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
