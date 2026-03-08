import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { CopyButton } from "@/components/CopyButton";
import { ViralScore } from "@/components/ViralScore";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState("All");

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

  const types = ["Todos", ...new Set(items.map((i) => i.type))];
  const filtered = filter === "Todos" ? items : items.filter((i) => i.type === filter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">Saved Content</h1>
          <p className="text-muted-foreground mt-1">{items.length} pieces of content saved</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                    {item.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.platform}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ViralScore score={item.viral_score || 0} size="sm" />
                  <CopyButton text={item.content} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-sm font-medium">{item.topic}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No saved content yet. Start generating!</p>
        )}
      </div>
    </AppLayout>
  );
}
