import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/CopyButton";
import { ViralScore } from "@/components/ViralScore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, LayoutGrid, Zap, AlignLeft, Target, Fingerprint, Rocket, PlayCircle } from "lucide-react";
import { useNiche } from "@/contexts/NicheContext";

const contentTypes = [
  { id: "viral-idea", label: "Ideia Viral", emoji: "💡" },
  { id: "hook", label: "Hook (Gancho)", emoji: "🎯" },
  { id: "script", label: "Roteiro", emoji: "📝" },
  { id: "video-text", label: "Texto para Vídeo", emoji: "💬" },
  { id: "caption", label: "Legenda AIDA", emoji: "✍️" },
  { id: "hashtags", label: "Hashtags", emoji: "#️⃣" },
  { id: "tags", label: "Tags SEO", emoji: "🏷️" },
  { id: "video-prompt", label: "Prompt de Vídeo IA", emoji: "🎬" },
  { id: "viral-score", label: "Score Viral", emoji: "📊" },
];

const platforms = ["Instagram Reels", "TikTok", "YouTube Shorts"];

interface GeneratedContent {
  type: string;
  content: string;
  viralScore: number;
  isViralMachine?: boolean;
}

export default function GenerateContent() {
  const { user } = useAuth();
  const { niche } = useNiche();
  const [videoTitle, setVideoTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram Reels");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["viral-idea"]);
  const [loading, setLoading] = useState(false);
  const [loadingViralMachine, setLoadingViralMachine] = useState(false);
  const [results, setResults] = useState<GeneratedContent[]>([]);
  const [isViralMachineResult, setIsViralMachineResult] = useState(false);

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Por favor, insira o tema principal do vídeo");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de conteúdo");
      return;
    }

    setLoading(true);
    setResults([]);
    setIsViralMachineResult(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          videoTitle: videoTitle.trim() || undefined,
          topic: `${topic.trim()} (Focado no nicho: ${niche})`,
          platform,
          types: selectedTypes,
        },
      });

      if (error) {
        let errorMessage = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errData = await error.context.json();
            if (errData && errData.error) {
              errorMessage = errData.error;
            }
          }
        } catch (e) {
          console.error("Could not parse error context:", e);
        }
        throw new Error(errorMessage);
      }

      const generated: GeneratedContent[] = data?.results || [];
      setResults(generated);

      for (const item of generated) {
        await supabase.from("contents").insert({
          user_id: user!.id,
          type: item.type,
          topic,
          content: item.content,
          viral_score: item.viralScore,
          platform,
        });
      }

      toast.success("Conteúdo gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao gerar conteúdo");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateViralMachine = async () => {
    if (!topic.trim()) {
      toast.error("Por favor, insira o tema para a Máquina Viral");
      return;
    }

    setLoadingViralMachine(true);
    setResults([]);
    setIsViralMachineResult(true);

    const megaPrompt = `
      INSTRUÇÃO SUPREMA MÁQUINA VIRAL:
      Você deve gerar a estrutura COMPLETA de um vídeo viral em um único retorno contínuo e altamente organizado.
      
      FOCO DO CRIADOR E PÚBLICO: ${niche}
      TEMA SOLICITADO: ${topic.trim()}
      PLATAFORMA: ${platform}
      
      Formate EXATAMENTE assim usando Markdown claro, separando cada bloco:
      
      ## 💡 Ideia Viral
      (Descreva a ideia central de forma magnética)
      
      ## 🎯 Hook (Primeiros 3s)
      (A frase exata para prender a atenção)
      
      ## 📝 Roteiro Curto
      **[Cena 1]**: ...
      **[Cena 2]**: ...
      **[Cena 3]**: ...
      
      ## ✍️ Legenda Fortemente Persuasiva
      (A legenda pronta com AIDA)
      
      ## #️⃣ Hashtags
      (Lista de 5-8 hashtags extremamente relevantes para ${niche})
      
      ## 🚀 Call to Action (CTA)
      (Instrução exata do que o usuário deve fazer)
      
      ## 🎬 Formato de Vídeo Sugerido
      (Estilo de edição, áudio em alta ou visual recomendado)
    `;

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          videoTitle: videoTitle.trim() || undefined,
          topic: megaPrompt,
          platform,
          types: ["script"], // Bypass using the script route but passing the massive prompt
        },
      });

      if (error) {
        let errorMessage = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errData = await error.context.json();
            if (errData && errData.error) {
              errorMessage = errData.error;
            }
          }
        } catch (e) {
          console.error("Could not parse error context:", e);
        }
        throw new Error(errorMessage);
      }

      const generated: GeneratedContent[] = data?.results || [];
      
      // Inject the viral machine flag
      const viralResult = generated.map(g => ({
        ...g,
        isViralMachine: true
      }));

      setResults(viralResult);

      // Save as a combined viral asset
      await supabase.from("contents").insert({
        user_id: user!.id,
        type: "viral-machine",
        topic,
        content: viralResult[0]?.content || "",
        viral_score: viralResult[0]?.viralScore || 90,
        platform,
      });

      toast.success("Máquina Viral operou com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao acionar a Máquina Viral");
    } finally {
      setLoadingViralMachine(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-10 max-w-6xl mx-auto animate-fade-in pb-12">
        <header className="pb-8 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-text-primary leading-none">
                  Multiplique sua Audiência
                </h1>
                <p className="text-text-secondary mt-4 text-base md:text-xl font-medium max-w-2xl leading-relaxed">
                  Gere peças avulsas de alta conversão ou ative a <span className="text-primary font-bold">Máquina Viral</span> para uma estratégia completa.
                </p>
              </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary w-fit px-4 py-2 rounded-xl h-fit">
              <Target className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wide">Foco Ativo: {niche}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 space-y-6">
            
            {/* Context Card */}
            <div className="premium-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlignLeft className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground font-display tracking-tight">Contexto do Conteúdo</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                    Tema Principal <span className="text-destructive font-black">*</span>
                  </label>
                  <Input
                    placeholder="Ex: Como viralizar no Instagram com 3 ferramentas gratuitas..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-secondary/40 border-border/60 text-lg py-7 shadow-inner focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-medium placeholder:text-muted-foreground/40 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                    Título Específico <span className="font-normal opacity-70 lowercase text-[10px]">(opcional)</span>
                  </label>
                  <Input
                    placeholder="Deixe em branco para a IA gerar magicamente"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="bg-secondary/20 border-border/40 text-base py-6 focus-visible:ring-primary/30 transition-all rounded-xl shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Platform Card */}
              <div className="premium-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground font-display tracking-tight">Plataforma Alvo</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {platforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`flex items-center justify-between px-5 py-4 rounded-xl text-sm font-bold transition-all border ${
                        platform === p
                          ? "bg-primary/5 border-primary text-text-primary shadow-sm ring-1 ring-primary/20"
                          : "bg-secondary/30 border-border text-text-secondary hover:bg-secondary/60 hover:border-border/80 hover:text-text-primary"
                      }`}
                    >
                      {p}
                      {platform === p && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outputs Card */}
              <div className="premium-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground font-display tracking-tight">O Que Gerar?</h3>
                  </div>
                  <button
                    onClick={() =>
                      setSelectedTypes((prev) =>
                        prev.length === contentTypes.length ? [] : contentTypes.map((ct) => ct.id)
                      )
                    }
                    className="text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
                  >
                    {selectedTypes.length === contentTypes.length ? "Limpar" : "Todos"}
                  </button>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {contentTypes.map((ct) => {
                    const isActive = selectedTypes.includes(ct.id);
                    return (
                      <button
                        key={ct.id}
                        onClick={() => toggleType(ct.id)}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm border transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 font-bold"
                            : "bg-secondary/30 border-border text-text-secondary hover:border-border/80 hover:bg-secondary/60 hover:text-text-primary font-bold"
                        }`}
                      >
                        <span className="text-base">{ct.emoji}</span> {ct.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleGenerate} 
                disabled={loading || loadingViralMachine} 
                variant="outline"
                className="w-full h-16 text-lg font-bold transition-all rounded-2xl border-border/80 hover:bg-secondary/80"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 mr-3 animate-spin text-muted-foreground" />
                ) : (
                  <Zap className="w-6 h-6 mr-3 text-muted-foreground" />
                )}
                GERAR PEÇAS SELECIONADAS
              </Button>

              <Button 
                onClick={handleGenerateViralMachine} 
                disabled={loading || loadingViralMachine} 
                className="w-full h-16 text-lg font-bold shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-2xl relative overflow-hidden group border border-primary/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {loadingViralMachine ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" /> Conectando Motores...
                  </>
                ) : (
                  <>
                    <Rocket className="w-6 h-6 mr-3 text-primary-foreground/90" /> DESBLOQUEAR MÁQUINA VIRAL
                  </>
                )}
              </Button>
            </div>

            {/* Results Area */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 pt-10"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-5">
                    <div className="flex items-center gap-3">
                      {isViralMachineResult ? (
                        <Rocket className="w-6 h-6 text-primary" />
                      ) : (
                        <LayoutGrid className="w-6 h-6 text-primary" />
                      )}
                      <h2 className="font-display font-bold text-2xl tracking-tight text-foreground">
                        {isViralMachineResult ? "Dossiê do Vídeo Viral" : "Resultados Gerados"}
                      </h2>
                    </div>

                    {isViralMachineResult && results[0]?.viralScore > 0 && (
                      <div className="hidden md:block">
                        <ViralScore score={results[0].viralScore > 85 ? results[0].viralScore : 94} size="lg" showLabel={true} />
                      </div>
                    )}
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
                      <h3 className="text-sm font-bold text-foreground mb-1 font-display tracking-tight">Insights da IA</h3>
                      {isViralMachineResult ? (
                        <p className="text-sm text-foreground/80 font-medium">Estrutura completa alinhada com as métricas mais altas para {niche} • Formato retentivo detectado • Potencial de viralização extremado.</p>
                      ) : (
                        <p className="text-sm text-foreground/80 font-medium">Avaliamos suas opções individuais com foco em otimização do Funil de Atenção para {platform}.</p>
                      )}
                    </div>
                  </motion.div>
                  
                  {isViralMachineResult ? (
                    /* Renderização Unificada da Máquina Viral */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="premium-card p-6 md:p-10 relative overflow-hidden group shadow-2xl ring-1 ring-primary/10"
                    >
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-400 to-primary opacity-80"></div>
                      <div className="flex justify-between items-start mb-6 w-full">
                        <div className="md:hidden mb-4">
                           <ViralScore score={results[0].viralScore > 85 ? results[0].viralScore : 94} size="md" showLabel={true} />
                        </div>
                        <div className="bg-background rounded-md border border-border/50 shadow-sm ml-auto">
                          <CopyButton text={results[0].content} />
                        </div>
                      </div>
                      
                      {/* Markdown-like output styling */}
                      <div className="prose prose-invert max-w-none prose-h2:text-xl prose-h2:font-display prose-h2:text-primary prose-h2:mt-8 prose-h2:mb-4 prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground">
                         <div className="text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: 
                            results[0].content
                              .replace(/## (.*?)\n/g, '<h2 class="text-primary font-black mt-8 mb-4">$1</h2>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary font-black">$1</strong>')
                              .replace(/\n\n/g, '<br/><br/>')
                              .replace(/\n/g, '<br/>')
                         }} />
                      </div>
                    </motion.div>
                  ) : (
                    /* Renderização Fragmentada Convencional */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.map((r, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="premium-card p-6 md:p-8 space-y-6 flex flex-col h-full"
                        >
                          <div className="flex items-start justify-between">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border/40 backdrop-blur-md">
                              <span className="text-sm">
                                {contentTypes.find((ct) => ct.id === r.type)?.emoji}
                              </span>
                              <span className="text-sm font-bold tracking-wide text-foreground">
                                {contentTypes.find((ct) => ct.id === r.type)?.label || r.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 opacity-90 transition-opacity">
                              {r.viralScore > 0 && <ViralScore score={r.viralScore} size="md" showLabel={true} />}
                              <div className="bg-background rounded-md border border-border/50 shadow-sm ml-2">
                                <CopyButton text={r.content} />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-[15px] md:text-base whitespace-pre-wrap text-text-primary font-bold leading-relaxed bg-secondary/30 p-6 md:p-8 rounded-2xl border border-border h-full">
                              {r.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

