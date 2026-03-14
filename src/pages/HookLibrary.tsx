import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { CopyButton } from "@/components/CopyButton";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Filter, Hash, Smartphone, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNiche } from "@/contexts/NicheContext";

interface Hook {
  id: string;
  hook_text: string;
  category: string;
  platform: string;
}

const defaultHooks: Hook[] = [
  { id: "dh-1", hook_text: "Pare de rolar o feed. Isso pode mudar tudo.", category: "Atenção", platform: "Instagram Reels" },
  { id: "dh-2", hook_text: "Ninguém está falando disso no Instagram.", category: "Curiosidade", platform: "Instagram Reels" },
  { id: "dh-3", hook_text: "Testei isso por 30 dias e o resultado foi absurdo.", category: "Resultados", platform: "TikTok" },
  { id: "dh-4", hook_text: "Se eu começasse do zero hoje, faria isso.", category: "Valor", platform: "YouTube Shorts" },
  { id: "dh-5", hook_text: "O algoritmo não quer que você descubra isso.", category: "Conspiração", platform: "TikTok" },
  { id: "dh-6", hook_text: "3 coisas que eu queria saber antes de começar.", category: "Lista", platform: "Instagram Reels" },
  { id: "dh-7", hook_text: "Esse detalhe pode estar travando seu crescimento.", category: "Dor", platform: "Instagram Reels" },
  { id: "dh-8", hook_text: "Você está fazendo isso errado a vida toda e não sabia.", category: "Correção", platform: "TikTok" },
  { id: "dh-9", hook_text: "POV: Você descobriu o segredo para viralizar em 2026.", category: "POV", platform: "TikTok" },
  { id: "dh-10", hook_text: "O final desse vídeo vai bugar sua mente.", category: "Suspense", platform: "YouTube Shorts" },
  { id: "dh-11", hook_text: "Aja rápido antes que essa estratégia sature.", category: "FOMO", platform: "Instagram Reels" },
  { id: "dh-12", hook_text: "De 0 a 10K seguidores: A história real de como eu fiz.", category: "Story", platform: "YouTube Shorts" },
];

export default function HookLibrary() {
  const { niche } = useNiche();
  const [dbHooks, setDbHooks] = useState<Hook[]>([]);
  const [filter, setFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    supabase
      .from("hooks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setDbHooks(data);
      });
  }, []);

  const allHooks = useMemo(() => {
    // Merge default hooks with DB hooks, preventing exact text duplicates
    const dbTexts = new Set(dbHooks.map(h => h.hook_text));
    const uniqueDefaults = defaultHooks.filter(h => !dbTexts.has(h.hook_text));
    return [...uniqueDefaults, ...dbHooks];
  }, [dbHooks]);

  const categories = ["Todos", ...new Set(allHooks.map((h) => h.category))];

  const filtered = allHooks.filter((h) => {
    const matchesCategory = filter === "Todos" || h.category === filter;
    const matchesSearch = h.hook_text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-10 max-w-7xl mx-auto animate-fade-in pb-12">
        <header className="pb-8 border-b border-border/40">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
                Biblioteca de Hooks
              </h1>
              <p className="text-muted-foreground mt-2 text-base md:text-lg">
                Hooks psicológicos comprovados para captar atenção nos primeiros 3 segundos do seu vídeo.
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary w-fit px-4 py-2 rounded-xl">
            <Target className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wide">Foco Ativo: {niche}</span>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card/40 p-5 rounded-2xl border border-border/50 backdrop-blur-xl shadow-sm">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
            <Input 
              placeholder="Buscar hook magnético..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary/40 border-border/60 h-11 w-full text-sm rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar mask-fade-edges">
            <Filter className="w-4 h-4 text-muted-foreground/80 mr-2 flex-shrink-0" />
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold tracking-widest transition-all border ${
                  filter === c 
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
                    : "bg-secondary/30 text-muted-foreground border-border/40 hover:border-border/80 hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((h, i) => (
              <motion.div
                layout
                key={h.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                className="group glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="space-y-5 flex-1 pl-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary border border-border/40">
                      <Hash className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold tracking-widest text-foreground uppercase">
                        {h.category}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/30 border border-white/5">
                      <Smartphone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                        {h.platform}
                      </span>
                    </div>
                  </div>
                  <p className="font-medium text-base md:text-lg leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors line-clamp-4">
                    "{h.hook_text}"
                  </p>
                </div>
                
                <div className="pt-4 border-t border-border/40 flex justify-end pl-2">
                  <div className="opacity-70 group-hover:opacity-100 transition-opacity bg-background rounded-md border border-border/40 shadow-sm">
                    <CopyButton text={h.hook_text} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum hook encontrado para os filtros selecionados.</p>
              <Button 
                variant="outline" 
                onClick={() => { setFilter("Todos"); setSearchTerm(""); }}
                className="mt-4 border-border/50"
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
