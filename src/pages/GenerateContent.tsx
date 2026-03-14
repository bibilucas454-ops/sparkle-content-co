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
import { Sparkles, Loader2, LayoutGrid, Zap, AlignLeft, Target, Fingerprint } from "lucide-react";

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
}

export default function GenerateContent() {
  const { user } = useAuth();
  const [videoTitle, setVideoTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram Reels");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["viral-idea"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedContent[]>([]);

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

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          videoTitle: videoTitle.trim() || undefined,
          topic,
          platform,
          types: selectedTypes,
        },
      });

      if (error) throw error;

      const generated: GeneratedContent[] = data.results || [];
      setResults(generated);

      // Save to database
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

      toast.success("Conteúdo gerado e salvo com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao gerar conteúdo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-10 max-w-6xl mx-auto animate-fade-in pb-12">
        <header className="pb-8 border-b border-border/40">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
                Gerar Conteúdo Viral
              </h1>
              <p className="text-muted-foreground mt-2 text-base md:text-lg max-w-2xl">
                Crie roteiros, hooks e textos que aumentam radicalmente o alcance e o engajamento nas suas redes sociais.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 space-y-6">
            
            {/* Context Card */}
            <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlignLeft className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground font-display tracking-tight">Contexto do Conteúdo</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
                    Tema Principal <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ex: Como viralizar no Instagram com 3 ferramentas gratuitas..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-secondary/40 border-border/60 text-lg py-7 shadow-inner focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-medium placeholder:text-muted-foreground/40 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
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
              <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground font-display tracking-tight">Plataforma Alvo</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {platforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`flex items-center justify-between px-5 py-4 rounded-xl text-sm font-semibold transition-all border ${
                        platform === p
                          ? "bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10"
                          : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/60 hover:border-border/60 hover:text-foreground"
                      }`}
                    >
                      {p}
                      {platform === p && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outputs Card */}
              <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 md:p-8">
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
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
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
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 font-semibold"
                            : "bg-secondary/30 border-border/40 text-muted-foreground hover:border-border/80 hover:bg-secondary/60 hover:text-foreground font-medium"
                        }`}
                      >
                        <span className="text-base">{ct.emoji}</span> {ct.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Generative Button */}
            <div className="pt-6">
              <Button 
                onClick={handleGenerate} 
                disabled={loading} 
                className="w-full h-16 text-lg font-bold shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-2xl relative overflow-hidden group border border-primary/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" /> Processando Inteligência...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 mr-3 text-primary-foreground/90" /> GERAR CONTEÚDO
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
                  <div className="flex items-center gap-3 border-b border-border/40 pb-5">
                    <LayoutGrid className="w-6 h-6 text-primary" />
                    <h2 className="font-display font-bold text-2xl tracking-tight text-foreground">Resultados Gerados</h2>
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
                      <p className="text-sm text-foreground/80 font-medium">Hook forte detectado com alto apelo visual • Retenção projetada acima da média • Duração ideal configurada para {platform}</p>
                    </div>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 space-y-5 hover:border-border/80 transition-colors shadow-sm group flex flex-col h-full"
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
                          <p className="text-sm md:text-base whitespace-pre-wrap text-foreground/90 font-medium leading-relaxed bg-black/40 p-5 rounded-xl border border-white/5 h-full">
                            {r.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
