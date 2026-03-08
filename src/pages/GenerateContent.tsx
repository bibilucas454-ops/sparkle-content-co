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
import { Sparkles, Loader2 } from "lucide-react";

const contentTypes = [
  { id: "viral-idea", label: "Ideias Virais", emoji: "💡" },
  { id: "script", label: "Roteiro", emoji: "📝" },
  { id: "caption", label: "Legenda (AIDA)", emoji: "✍️" },
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
      toast.error("Please enter a topic");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Select at least one content type");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { topic, platform, types: selectedTypes },
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

      toast.success("Content generated and saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">Gerar Conteúdo</h1>
          <p className="text-muted-foreground mt-1">Digite um tema e gere conteúdo viral instantaneamente</p>
        </div>

        {/* Input area */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Tema</label>
            <Input
              placeholder="ex: Como crescer no TikTok em 2026..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-secondary border-border text-lg"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Plataforma</label>
            <div className="flex gap-2 flex-wrap">
              {platforms.map((p) => (
                <Button
                  key={p}
                  variant={platform === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatform(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Tipos de Conteúdo</label>
            <div className="flex gap-2 flex-wrap">
              {contentTypes.map((ct) => (
                <Button
                  key={ct.id}
                  variant={selectedTypes.includes(ct.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType(ct.id)}
                >
                  {ct.emoji} {ct.label}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} variant="glow" className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Gerar Conteúdo
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="font-display font-semibold text-lg">Conteúdo Gerado</h2>
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-lg border border-border bg-card p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-accent capitalize">
                      {contentTypes.find((ct) => ct.id === r.type)?.emoji}{" "}
                      {contentTypes.find((ct) => ct.id === r.type)?.label || r.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <ViralScore score={r.viralScore} size="sm" />
                      <CopyButton text={r.content} />
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-foreground/90">{r.content}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
