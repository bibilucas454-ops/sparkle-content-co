import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { CopyButton } from "@/components/CopyButton";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Hook {
  id: string;
  hook_text: string;
  category: string;
  platform: string;
}

const defaultHooks: Hook[] = [
  { id: "dh-1", hook_text: "Pare de rolar o feed. Isso pode mudar seu perfil hoje.", category: "Atenção", platform: "Instagram Reels" },
  { id: "dh-2", hook_text: "Ninguém está falando disso no Instagram.", category: "Curiosidade", platform: "Instagram Reels" },
  { id: "dh-3", hook_text: "Testei isso por 30 dias e o resultado foi absurdo.", category: "Resultados", platform: "TikTok" },
  { id: "dh-4", hook_text: "Se eu começasse do zero hoje, faria isso.", category: "Valor", platform: "YouTube Shorts" },
  { id: "dh-5", hook_text: "O algoritmo não quer que você descubra isso.", category: "Conspiração", platform: "TikTok" },
  { id: "dh-6", hook_text: "3 coisas que eu queria saber antes de começar.", category: "Lista", platform: "Instagram Reels" },
  { id: "dh-7", hook_text: "Isso é o que está destruindo seu alcance.", category: "Dor", platform: "Instagram Reels" },
  { id: "dh-8", hook_text: "Você está fazendo isso errado a vida toda e não sabia.", category: "Correção", platform: "TikTok" },
  { id: "dh-9", hook_text: "POV: Você descobriu o segredo para viralizar em 2026.", category: "POV", platform: "TikTok" },
  { id: "dh-10", hook_text: "O final desse vídeo vai bugar sua mente.", category: "Suspense", platform: "YouTube Shorts" },
  { id: "dh-11", hook_text: "Aja rápido antes que essa estratégia sature.", category: "FOMO", platform: "Instagram Reels" },
  { id: "dh-12", hook_text: "De 0 a 10K seguidores: A história real de como eu fiz.", category: "Story", platform: "YouTube Shorts" },
];

export default function HookLibrary() {
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
      <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
        <header className="pb-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-gradient-silver">Biblioteca de Hooks</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Hooks psicológicos comprovados para captar atenção nos primeiros 3 segundos.
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card/30 p-4 rounded-2xl border border-border/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar hook..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary/50 border-border/80 h-10 w-full"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
            <Filter className="w-4 h-4 text-muted-foreground mr-1 flex-shrink-0" />
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border ${
                  filter === c 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-transparent text-muted-foreground border-border/60 hover:border-border hover:bg-secondary/40"
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((h, i) => (
              <motion.div
                layout
                key={h.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 flex flex-col justify-between gap-4 hover:border-border hover:shadow-lg transition-all"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold tracking-wider px-2.5 py-1 rounded-md bg-secondary text-foreground">
                      {h.category.toUpperCase()}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-black/20 px-2 py-1 rounded-sm">
                      {h.platform}
                    </span>
                  </div>
                  <p className="font-medium text-lg leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors">
                    "{h.hook_text}"
                  </p>
                </div>
                
                <div className="pt-4 border-t border-border/50 flex justify-end">
                  <CopyButton text={h.hook_text} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p>Nenhum hook encontrado para os filtros selecionados.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
