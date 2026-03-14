import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/CopyButton";
import { ViralScore } from "@/components/ViralScore";
import { Bot, Sparkles, Terminal, Code2, Target, Type, Clock, Radio, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNiche } from "@/contexts/NicheContext";

const contentTypes = ["educacional", "storytelling", "opinião", "lista", "erro comum", "tutorial"];
const tones = ["impactante", "polêmico", "educacional", "motivacional", "emocional"];
const durations = ["15 segundos", "30 segundos", "60 segundos"];

export default function GrokPrompt() {
  const { niche } = useNiche();
  const [tema, setTema] = useState("");
  const [contentType, setContentType] = useState("storytelling");
  const [tone, setTone] = useState("impactante");
  const [duration, setDuration] = useState("30 segundos");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleGenerate = () => {
    if (!tema.trim()) {
      toast.error("Por favor, insira um tema para o vídeo.");
      return;
    }

    const prompt = `INSTRUÇÃO DE SISTEMA (GROK VIRAL ENGINE):
Você é um especialista em retenção de atenção e engenharia reversa de vídeos virais.
Aja como o cérebro criativo de um produtor que faz roteiros com milhares de visualizações.

=== CONTEXTO DO CRIADOR ===
Nicho Principal: ${niche}
Tema Específico: ${tema.trim()}
Formato Solicitado: Vídeo ${contentType}
Tom de Voz Direcionado: ${tone}
Duração Aproximada: ${duration}

=== TAREFA ===
Gere um roteiro completo, denso e direto ao ponto.
NÃO use introduções amigáveis como "Aqui está o roteiro". Entregue apenas a estrutura final formatada em Markdown abaixo:

## 🪝 Hook Magnético (0s - 3s)
(Uma única frase impossível de ser ignorada, baseada no tom ${tone})

## 🎬 Roteiro em Cenas
**[Cena 1 - Visual/Ação]**: (Descrição do que aparece)
**[Áudio/Fala]**: (Fala exata)

**[Cena 2 - Quebra de Padrão]**: (Descrição do que aparece)
**[Áudio/Fala]**: (Fala exata)

**[Cena 3 - Resolução]**: (Descrição do que aparece)
**[Áudio/Fala]**: (Fala exata)

**(Adicione mais cenas conforme necessário para ${duration})**

## ✍️ Legenda Otimizada
(Legenda pronta para uso usando copyrighting AIDA e chamando para o CTA)

## #️⃣ Hashtags Estratégicas
(5 a 8 hashtags altamente focadas em ${niche} e no formato ${contentType})

## 🎯 Call to Action (CTA)
(Instrução clara e única para aumentar engajamento)`;

    setGeneratedPrompt(prompt);
  };

  return (
    <AppLayout>
      <div className="space-y-10 animate-fade-in max-w-5xl mx-auto pb-12">
        <header className="pb-8 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
                  Prompt para Grok
                </h1>
                <p className="text-muted-foreground mt-2 text-base md:text-lg">
                  Sintetizador profissional de comandos estruturados para roteiros virais.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary w-fit px-4 py-2 rounded-xl">
              <Target className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wide">Foco Ativo: {niche}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-12 space-y-6">
              
              {/* Context Card */}
              <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Terminal className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground font-display tracking-tight">Arquitetura da Ideia</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
                      Qual é o tema central? <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Ex: Por que a maioria das startups falha no primeiro ano..."
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      className="bg-secondary/40 border-border/60 text-lg py-7 shadow-inner focus-visible:ring-primary/40 focus-visible:border-primary/40 font-medium placeholder:text-muted-foreground/40 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Type Card */}
                 <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <Type className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground tracking-tight">Tipo de Conteúdo</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {contentTypes.map((type) => (
                           <button
                             key={type}
                             onClick={() => setContentType(type)}
                             className={\`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border \${
                               contentType === type
                                 ? "bg-primary text-primary-foreground border-primary"
                                 : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                             }\`}
                           >
                             {type}
                           </button>
                       ))}
                    </div>
                 </div>

                 {/* Tone Card */}
                 <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <Radio className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground tracking-tight">Tom do Vídeo</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {tones.map((t) => (
                           <button
                             key={t}
                             onClick={() => setTone(t)}
                             className={\`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border \${
                               tone === t
                                 ? "bg-primary text-primary-foreground border-primary"
                                 : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                             }\`}
                           >
                             {t}
                           </button>
                       ))}
                    </div>
                 </div>

                 {/* Duration Card */}
                 <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground tracking-tight">Duração Projetada</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                       {durations.map((d) => (
                           <button
                             key={d}
                             onClick={() => setDuration(d)}
                             className={\`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all border \${
                               duration === d
                                 ? "bg-primary/10 border-primary text-primary"
                                 : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                             }\`}
                           >
                             {d}
                             {duration === d && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                           </button>
                       ))}
                    </div>
                 </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={handleGenerate} 
                  className="w-full text-lg shadow-xl shadow-primary/20 transition-all hover:shadow-primary/40 rounded-2xl h-16 border border-primary/30 group relative overflow-hidden font-bold"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <Sparkles className="w-6 h-6 mr-3 text-primary-foreground/90" />
                  GERAR ROTEIRO COM GROK
                </Button>
              </div>

           </div>
        </div>

        <AnimatePresence>
          {generatedPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-10"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-5">
                <div className="flex items-center gap-3">
                  <Rocket className="w-6 h-6 text-primary" />
                  <h2 className="font-display font-bold text-2xl tracking-tight text-foreground">Prompt Projetado</h2>
                </div>
                
                <div className="hidden md:block">
                   <ViralScore score={89} size="md" showLabel={true} />
                </div>
              </div>

              {/* AI Insights Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-6 flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl"></div>
                <div className="p-3 bg-background rounded-full border border-border/50 shadow-sm flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1 font-display tracking-tight">Engenharia Estruturada</h3>
                  <p className="text-sm text-foreground/80 font-medium">Este prompt foi desenhado usando engenharia reversa nas APIs de IA mais modernas. Copie-o abaixo e cole no Grok (ou ChatGPT/Claude) para um resultado de alto nível de conversão.</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border/50 bg-[#0A0A0A] p-6 md:p-8 relative overflow-hidden group shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
                <div className="absolute left-0 top-1 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-transparent"></div>
                
                <div className="flex justify-between items-center mb-6 pl-4 w-full">
                  <div className="md:hidden">
                    <ViralScore score={89} size="sm" showLabel={true} />
                  </div>
                   <div className="bg-background rounded-md border border-border/50 shadow-sm ml-auto">
                    <CopyButton text={generatedPrompt} />
                  </div>
                </div>

                <div className="prose prose-invert max-w-none prose-h2:text-xl prose-h2:font-display prose-h2:text-primary prose-h2:mt-8 prose-h2:mb-4 prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground pl-4">
                  <div dangerouslySetInnerHTML={{ __html: 
                    generatedPrompt
                      .replace(/=== (.*?) ===/g, '<h3 class="text-xs uppercase tracking-widest text-muted-foreground mt-8 mb-4 border-b border-border/40 pb-2">$1</h3>')
                      .replace(/## (.*?)\n/g, '<h2>$1</h2>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
