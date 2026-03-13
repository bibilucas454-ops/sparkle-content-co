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
import { Sparkles, Loader2, LayoutGrid, Zap } from "lucide-react";

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
  const [platform, setPlatform] = useState("TikTok");
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
      <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
        <header className="pb-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-gradient-silver">Workspace</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Sua área de criação de conteúdo viral. Preencha os detalhes e deixe a IA fazer a mágica.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 space-y-8">
            <div className="glow-card rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 md:p-8 space-y-8">
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground tracking-wide flex items-center gap-2 mb-2">
                    TEMA / IDEIA PRINCIPAL <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ex: Como viralizar no Instagram com 3 ferramentas gratuitas..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-secondary/50 border-border/80 text-lg py-7 shadow-inner focus-visible:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground tracking-wide flex items-center gap-2 mb-2 text-muted-foreground">
                    TÍTULO DO VÍDEO <span className="font-normal opacity-70">(opcional)</span>
                  </label>
                  <Input
                    placeholder="Deixe em branco para a IA gerar automaticamente"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="bg-secondary/30 border-border/60 text-base py-5 opacity-90 transition-all focus-visible:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/50">
                <div>
                  <label className="text-sm font-semibold text-foreground tracking-wide mb-4 block">
                    PLATAFORMA ALVO
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {platforms.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          platform === p
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                            : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-foreground tracking-wide">
                      O QUE VOCÊ PRECISA? (Tipos de Conteúdo)
                    </label>
                    <button
                      onClick={() =>
                        setSelectedTypes((prev) =>
                          prev.length === contentTypes.length ? [] : contentTypes.map((ct) => ct.id)
                        )
                      }
                      className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer"
                    >
                      {selectedTypes.length === contentTypes.length ? "Limpar" : "Todos"}
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {contentTypes.map((ct) => {
                      const isActive = selectedTypes.includes(ct.id);
                      return (
                        <button
                          key={ct.id}
                          onClick={() => toggleType(ct.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                            isActive
                              ? "bg-primary/10 border-primary/30 text-primary font-medium"
                              : "bg-transparent border-border/60 text-muted-foreground hover:border-border hover:bg-secondary/40"
                          }`}
                        >
                          <span className="text-base">{ct.emoji}</span> {ct.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading} 
                  variant="glow" 
                  className="w-full h-16 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" /> Gerando seu conteúdo viral...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-3" /> GERAR CONTEÚDO
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results Area */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-8"
                >
                  <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <LayoutGrid className="w-6 h-6 text-accent" />
                    <h2 className="font-display font-bold text-2xl tracking-tight text-gradient-silver">Resultados Gerados</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 space-y-4 hover:border-border transition-colors shadow-sm group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/80 border border-border/50">
                            <span className="text-sm">
                              {contentTypes.find((ct) => ct.id === r.type)?.emoji}
                            </span>
                            <span className="text-sm font-semibold tracking-wide text-foreground">
                              {contentTypes.find((ct) => ct.id === r.type)?.label || r.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                            {r.viralScore > 0 && <ViralScore score={r.viralScore} size="sm" />}
                            <CopyButton text={r.content} />
                          </div>
                        </div>
                        <div className="pt-2">
                          <p className="text-sm md:text-base whitespace-pre-wrap text-foreground/90 font-medium leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
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
