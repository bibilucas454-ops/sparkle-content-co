import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { CopyButton } from "@/components/CopyButton";
import { ViralScore } from "@/components/ViralScore";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ContentItem {
  id: string;
  type: string;
  topic: string;
  content: string;
  viral_score: number;
  platform: string;
  created_at: string;
}

export default function SavedContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState("Todos");
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("contents")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from("contents").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Conteúdo excluído");
  };

  const handleClearAll = async () => {
    if (!user) return;
    setClearing(true);
    try {
      await supabase.from("contents").delete().eq("user_id", user.id);
      setItems([]);
      setShowClearModal(false);
      toast.success("Todo conteúdo salvo foi removido");
    } catch (error) {
      toast.error("Erro ao limpar conteúdo");
    } finally {
      setClearing(false);
    }
  };

  const types = ["Todos", ...new Set(items.map((i) => i.type))];
  const filtered = filter === "Todos" ? items : items.filter((i) => i.type === filter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-border/40">
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-display text-gradient-primary tracking-tighter">Conteúdo Salvo</h1>
            <p className="text-muted-foreground mt-2 text-base md:text-lg font-medium">{items.length} peças no seu arsenal criativo</p>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowClearModal(true)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar tudo
            </Button>
          )}
        </header>

        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                filter === t 
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                  : "bg-secondary/40 border-border/40 text-muted-foreground hover:border-border/80 hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="premium-card p-6 md:p-8 space-y-5 group transition-all duration-300 hover:border-primary/20"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/10">
                    {item.type}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground/60">{item.platform}</span>
                  <span className="text-[11px] font-bold text-muted-foreground/40">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ViralScore score={item.viral_score || 0} size="sm" />
                  <CopyButton text={item.content} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive/60 group-hover:text-destructive transition-colors" />
                  </Button>
                </div>
              </div>
              <p className="text-lg font-bold text-foreground font-display tracking-tight group-hover:text-primary transition-colors">{item.topic}</p>
              <div className="bg-secondary/30 p-5 md:p-7 rounded-2xl border border-border/20">
                <p className="text-sm md:text-base text-foreground/90 font-medium leading-relaxed whitespace-pre-wrap">{item.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhum conteúdo salvo ainda. Comece a gerar!</p>
        )}
      </div>

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !clearing && setShowClearModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground">Limpar tudo?</h2>
                <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-8">
              Tem certeza que deseja apagar todo o conteúdo salvo? 
              Essa ação não pode ser desfeita.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleClearAll}
                disabled={clearing}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                {clearing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sim, limpar tudo
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
