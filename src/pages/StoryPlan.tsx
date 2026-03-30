import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/CopyButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Sparkles, Loader2, Layers, Target, Zap, Heart, 
  MessageCircle, Megaphone, UserPlus, TrendingUp,
  CheckCircle2, ArrowRight, RefreshCw, Play
} from "lucide-react";
import { useNiche } from "@/contexts/NicheContext";

interface StoryType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const storyTypes: StoryType[] = [
  { id: "conexao", label: "Conexão", description: "Humanize e crie proximidade", icon: <UserPlus className="w-5 h-5" /> },
  { id: "autoridade", label: "Autoridade", description: "Demonstre expertise e credibilidade", icon: <TrendingUp className="w-5 h-5" /> },
  { id: "prova", label: "Prova Social", description: "Mostre resultados e depoimentos", icon: <CheckCircle2 className="w-5 h-5" /> },
  { id: "bastidor", label: "Bastidor", description: "Mostre os por trás das câmeras", icon: <Layers className="w-5 h-5" /> },
  { id: "enquete", label: "Enquete", description: "Interaja com sua audiência", icon: <MessageCircle className="w-5 h-5" /> },
  { id: "objecao", label: "Objeção", description: "Responda dúvidas e objeções", icon: <Target className="w-5 h-5" /> },
  { id: "cta", label: "CTA", description: "Chamada para ação", icon: <Zap className="w-5 h-5" /> },
];

const objectives = [
  { id: "engajar", label: "Engajar", description: "Aumentar interação e alcance" },
  { id: "aquecer", label: "Aquecer", description: "Preparar audiência para oferta" },
  { id: "vender", label: "Vender", description: "Converter em produto/serviço" },
  { id: "caixinha", label: "Abrir Caixinha", description: "Receber perguntas no direct" },
  { id: "direct", label: "Chamar no Direct", description: "Levar para conversação privada" },
  { id: "nutrir", label: "Nutrir Audiência", description: "Educar e manter engajamento" },
];

const sequenceLengths = [
  { id: "3", label: "3 Stories", description: "Sequência rápida" },
  { id: "5", label: "5 Stories", description: "Sequência padrão" },
  { id: "7", label: "7 Stories", description: "Sequência completa" },
];

interface GeneratedStory {
  order: number;
  type: string;
  typeLabel: string;
  content: string;
  tip?: string;
}

export default function StoryPlan() {
  const { user } = useAuth();
  const { niche } = useNiche();
  const [topic, setTopic] = useState("");
  const [objective, setObjective] = useState("engajar");
  const [sequenceLength, setSequenceLength] = useState("5");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(storyTypes.map(t => t.id));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedStory[]>([]);

  const toggleType = (id: string) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Por favor, insira o tema ou objetivo dos stories");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de story");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      console.log("Invoking generate-story-plan with:", { topic: topic.trim(), objective, sequenceLength, selectedTypes });
      
      const { data, error } = await supabase.functions.invoke("generate-story-plan", {
        body: {
          topic: topic.trim(),
          objective,
          sequenceLength: parseInt(sequenceLength),
          selectedTypes,
        },
      });

      console.log("Response:", { data, error });

      if (error) {
        let errorMsg = "Erro ao gerar stories";
        if (typeof error === 'object' && error !== null) {
          const errObj = error as any;
          errorMsg = errObj.message || errObj.error || JSON.stringify(error);
        }
        throw new Error(errorMsg);
      }

      if (!data?.stories) {
        throw new Error("Resposta inválida do servidor");
      }

      const generated: GeneratedStory[] = data.stories;
      setResults(generated);

      for (const story of generated) {
        await supabase.from("contents").insert({
          user_id: user!.id,
          type: `story-${story.type}`,
          topic,
          content: story.content,
        });
      }

      if (generated.length > 0) {
        toast.success(`${generated.length} stories gerados com sucesso!`);
      }
    } catch (error: any) {
      console.error("Error generating story plan:", error);
      let errorMsg = "Erro ao gerar plano de stories";
      
      if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error?.error?.message) {
        errorMsg = error.error.message;
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const objectiveLabel = objectives.find(o => o.id === objective)?.label || objective;

  return (
    <AppLayout>
      <div className="space-y-10 max-w-7xl mx-auto animate-fade-in pb-12">
        <header className="pb-8 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 shadow-xl shadow-pink-500/10">
                <Layers className="w-10 h-10 text-pink-500" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-text-primary leading-none">
                  Plano de Stories
                </h1>
                <p className="text-text-secondary mt-4 text-base md:text-xl font-medium max-w-xl leading-relaxed">
                  Crie sequências estratégicas de stories com lógica de funil para engajamento e conversão.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="premium-card p-8 space-y-6">
              <div>
                <label htmlFor="topic-input" className="block text-sm font-bold text-text-primary mb-3">
                  Tema ou Objetivo
                </label>
                <Input 
                  id="topic-input"
                  placeholder="Ex: Lançar curso de marketing digital,Promover consultoria,Conteúdo sobre fitness..." 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-secondary/40 border-border/40 h-14 text-base rounded-2xl focus-visible:ring-pink-500/40 focus-visible:border-pink-500/40 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">
                  Objetivo da Sequência
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {objectives.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => setObjective(obj.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        objective === obj.id
                          ? "bg-pink-500/10 border-pink-500 shadow-lg shadow-pink-500/20"
                          : "bg-secondary/40 border-border hover:border-pink-500/40"
                      }`}
                    >
                      <span className={`text-sm font-bold ${
                        objective === obj.id ? "text-pink-500" : "text-text-primary"
                      }`}>
                        {obj.label}
                      </span>
                      <p className="text-xs text-text-secondary mt-1">{obj.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">
                  Tamanho da Sequência
                </label>
                <div className="flex gap-3">
                  {sequenceLengths.map((len) => (
                    <button
                      key={len.id}
                      onClick={() => setSequenceLength(len.id)}
                      className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                        sequenceLength === len.id
                          ? "bg-pink-500/10 border-pink-500 shadow-lg shadow-pink-500/20"
                          : "bg-secondary/40 border-border hover:border-pink-500/40"
                      }`}
                    >
                      <span className={`text-sm font-bold block ${
                        sequenceLength === len.id ? "text-pink-500" : "text-text-primary"
                      }`}>
                        {len.label}
                      </span>
                      <span className="text-xs text-text-secondary">{len.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">
                  Tipos de Story (selecione pelo menos 1)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {storyTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => toggleType(type.id)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        selectedTypes.includes(type.id)
                          ? "bg-pink-500/10 border-pink-500 shadow-lg shadow-pink-500/20"
                          : "bg-secondary/40 border-border hover:border-pink-500/40"
                      }`}
                    >
                      <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        selectedTypes.includes(type.id) 
                          ? "bg-pink-500 text-white" 
                          : "bg-secondary text-text-secondary"
                      }`}>
                        {type.icon}
                      </div>
                      <span className={`text-xs font-bold block ${
                        selectedTypes.includes(type.id) ? "text-pink-500" : "text-text-primary"
                      }`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={loading || !topic.trim() || selectedTypes.length === 0}
                className="w-full h-14 text-base font-bold bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando Plano de Stories...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Gerar Plano de {objectiveLabel}
                  </>
                )}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-text-primary">
                    Sequência de {objectiveLabel}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="border-pink-500/40 text-pink-500 hover:bg-pink-500/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerar
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-500 via-pink-300 to-pink-500/30" />
                  
                  <div className="space-y-4">
                    {results.map((story, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-16"
                      >
                        <div className="absolute left-0 top-4 w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-pink-500/30">
                          {story.order}
                        </div>
                        
                        <div className="premium-card p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-500 text-xs font-bold">
                              {story.typeLabel}
                            </span>
                            {story.tip && (
                              <span className="text-xs text-text-secondary flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {story.tip}
                              </span>
                            )}
                          </div>
                          <p className="text-text-primary font-medium leading-relaxed">
                            {story.content}
                          </p>
                          <div className="mt-4 flex justify-end">
                            <CopyButton text={story.content} />
                          </div>
                        </div>
                        
                        {index < results.length - 1 && (
                          <ArrowRight className="absolute left-14 -bottom-6 w-5 h-5 text-pink-500/50 rotate-90" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="premium-card p-6">
              <h3 className="font-black text-text-primary mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-pink-500" />
                Como funciona
              </h3>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <div>
                    <span className="font-bold text-text-primary text-sm">Defina o tema</span>
                    <p className="text-xs text-text-secondary">Escolha sobre o que quer falar nos stories</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <span className="font-bold text-text-primary text-sm">Escolha o objetivo</span>
                    <p className="text-xs text-text-secondary">Engajar, aquecer, vender ou nutrir</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <div>
                    <span className="font-bold text-text-primary text-sm">Selecione tipos</span>
                    <p className="text-xs text-text-secondary">Escolha os tipos de story que deseja incluir</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
                  <div>
                    <span className="font-bold text-text-primary text-sm">Receba a sequência</span>
                    <p className="text-xs text-text-secondary">Obtenha um funil pronto para publicar</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="premium-card p-6 bg-gradient-to-br from-pink-500/5 to-transparent">
              <h3 className="font-black text-text-primary mb-3">Dica</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Para melhores resultados, use sequências de 5-7 stories com mix de tipos diferentes. 
                Comece com conexão,Build autoridade,Prove valor,Termine com CTA forte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
