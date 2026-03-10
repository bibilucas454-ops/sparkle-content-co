import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { CopyButton } from "@/components/CopyButton";
import { motion } from "framer-motion";

interface Hook {
  id: string;
  hook_text: string;
  category: string;
  platform: string;
}

export default function HookLibrary() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [filter, setFilter] = useState("Todos");

  useEffect(() => {
    supabase
      .from("hooks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setHooks(data);
      });
  }, []);

  const categories = ["Todos", ...new Set(hooks.map((h) => h.category))];
  const filtered = filter === "Todos" ? hooks : hooks.filter((h) => h.category === filter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">Biblioteca de Hooks</h1>
          <p className="text-muted-foreground mt-1">Hooks comprovados para captar atenção instantaneamente</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === c ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border bg-card p-4 flex items-start justify-between gap-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">"{h.hook_text}"</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {h.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{h.platform}</span>
                </div>
              </div>
              <CopyButton text={h.hook_text} />
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
