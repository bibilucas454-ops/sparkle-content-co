import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, Sunrise, Sun, Sunset, Moon, Star, Zap, CheckCircle2,
  TrendingUp, MessageCircle, Heart, Eye, ArrowRight, Sparkles,
  Camera, Music, BarChart3, Smile, Bookmark, Copy, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Data Models ---

interface TimeSlot {
  id: string;
  label: string;
  timeRange: string;
  icon: React.ElementType;
  engagementLevel: "Alta" | "Média-Alta" | "Média";
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
  contentTypes: { label: string; icon: React.ElementType }[];
  ctas: string[];
  engagementPercent: number;
  bestFor: string;
  storyCount: number;
}

const TIME_SLOTS: TimeSlot[] = [
  {
    id: "manha",
    label: "Manhã",
    timeRange: "07:00 – 09:00",
    icon: Sunrise,
    engagementLevel: "Média-Alta",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/10",
    description: "Seu público acorda e abre o Instagram enquanto toma café. Ótimo para começar o dia com leveza.",
    contentTypes: [
      { label: "Bom dia / rotina", icon: Sun },
      { label: "Motivacional", icon: Sparkles },
      { label: "Behind-the-scenes", icon: Camera },
    ],
    ctas: [
      "Bom dia! Qual seu plano de hoje? 💬",
      "Quem mais acordou com energia? 🔥",
      "Marque alguém que precisa ver isso!",
    ],
    engagementPercent: 72,
    bestFor: "Conexão emocional e rotina",
    storyCount: 2,
  },
  {
    id: "almoco",
    label: "Almoço",
    timeRange: "12:00 – 14:00",
    icon: Sun,
    engagementLevel: "Alta",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    glowColor: "shadow-orange-500/10",
    description: "Pico de uso no celular durante a pausa do almoço. Público relaxado e com tempo para interagir.",
    contentTypes: [
      { label: "Enquetes / Quiz", icon: BarChart3 },
      { label: "Dica rápida", icon: Zap },
      { label: "Conteúdo educativo", icon: Bookmark },
    ],
    ctas: [
      "Vote na enquete! 📊",
      "Concorda? Responda nos comentários!",
      "Salve essa dica para depois! 💾",
    ],
    engagementPercent: 89,
    bestFor: "Interação e enquetes",
    storyCount: 3,
  },
  {
    id: "tarde",
    label: "Tarde",
    timeRange: "15:00 – 17:00",
    icon: Sun,
    engagementLevel: "Média",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    glowColor: "shadow-yellow-500/10",
    description: "Momento de desaceleração da tarde. Pessoas buscam distração antes de encerrar o expediente.",
    contentTypes: [
      { label: "Meme / humor", icon: Smile },
      { label: "Repost de conteúdo", icon: Heart },
      { label: "Contagem regressiva", icon: Clock },
    ],
    ctas: [
      "Quem se identificou? 😂",
      "Reaja com emoji se concorda!",
      "Envie para um amigo! 📩",
    ],
    engagementPercent: 65,
    bestFor: "Leveza e entretenimento",
    storyCount: 2,
  },
  {
    id: "noite",
    label: "Noite",
    timeRange: "19:00 – 22:00",
    icon: Sunset,
    engagementLevel: "Alta",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    glowColor: "shadow-rose-500/10",
    description: "Horário de ouro. Maior tempo de tela, público receptivo e alto engajamento. Não perca essa janela.",
    contentTypes: [
      { label: "Reels / Vídeo", icon: Camera },
      { label: "Pergunta & Resposta", icon: MessageCircle },
      { label: "Story musical", icon: Music },
    ],
    ctas: [
      "Quer que eu faça parte 2? 💬",
      "Me manda uma DM com sua opinião!",
      "Salva e compartilha! 💾➡️",
    ],
    engagementPercent: 94,
    bestFor: "Conteúdo principal do dia",
    storyCount: 4,
  },
  {
    id: "madrugada",
    label: "Madrugada",
    timeRange: "23:00 – 02:00",
    icon: Moon,
    engagementLevel: "Média",
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    borderColor: "border-indigo-400/30",
    glowColor: "shadow-indigo-400/10",
    description: "Público noturno engajado: estudantes, freelancers e night owls. Menor concorrência no feed.",
    contentTypes: [
      { label: "Reflexão / poema", icon: Star },
      { label: "Promessa de conteúdo", icon: Sparkles },
      { label: "Story tranquilo", icon: Moon },
    ],
    ctas: [
      "Quem está acordado? 🌙",
      "Amanhã tem conteúdo novo! Fique ligado 🔔",
      "Boa noite! Até amanhã 👋",
    ],
    engagementPercent: 58,
    bestFor: "Conexão com nicho noturno",
    storyCount: 1,
  },
];

// --- Sub-Components ---

function EngagementBar({ percent, colorClass }: { percent: number; colorClass: string }) {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
        <span className="text-text-secondary">Taxa de Engajamento</span>
        <span className={colorClass}>{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className={`h-full rounded-full ${colorClass.replace("text-", "bg-")}`}
        />
      </div>
    </div>
  );
}

function CtaButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="group flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg bg-secondary/40 border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all text-[13px] font-medium text-text-secondary hover:text-text-primary"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-text-muted group-hover:text-primary shrink-0 transition-colors" />
            )}
            <span className="truncate">{text}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-[12px]">{copied ? "Copiado!" : "Clique para copiar"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TimeSlotCard({ slot, index }: { slot: TimeSlot; index: number }) {
  const isTop = slot.engagementLevel === "Alta";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        className={`premium-card overflow-visible ${isTop ? "ring-1 ring-primary/20" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${slot.bgColor} ${slot.borderColor} border flex items-center justify-center`}>
                <slot.icon className={`w-5 h-5 ${slot.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-text-primary flex items-center gap-2">
                  {slot.label}
                  {isTop && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-wider">
                      <Zap className="w-3 h-3 mr-1" /> Melhor Horário
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-[13px] font-bold text-text-secondary mt-0.5">
                  {slot.timeRange}
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <Badge variant="outline" className={`${slot.borderColor} ${slot.color} text-[11px] font-black border`}>
                {slot.engagementLevel} Engajamento
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">
          <p className="text-[13px] font-medium text-text-secondary leading-relaxed">
            {slot.description}
          </p>

          <EngagementBar percent={slot.engagementPercent} colorClass={slot.color} />

          {/* Content Types */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-1.5">
              <Camera className="w-3 h-3" /> Tipos de Conteúdo Recomendados
            </h4>
            <div className="flex flex-wrap gap-2">
              {slot.contentTypes.map((ct) => (
                <span
                  key={ct.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${slot.bgColor} border ${slot.borderColor} text-[12px] font-bold ${slot.color}`}
                >
                  <ct.icon className="w-3.5 h-3.5" />
                  {ct.label}
                </span>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-1.5">
              <MessageCircle className="w-3 h-3" /> Chamadas para Ação (CTAs)
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {slot.ctas.map((cta, i) => (
                <CtaButton key={i} text={cta} />
              ))}
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <span className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Ideal para: {slot.bestFor}
            </span>
            <span className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              {slot.storyCount} stories sugeridos
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WeeklyRoutine() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const routineMatrix = [
    // Segunda
    ["manha", "almoco", "noite"],
    // Terça
    ["manha", "tarde", "noite"],
    // Quarta
    ["manha", "almoco", "tarde", "noite"],
    // Quinta
    ["manha", "noite"],
    // Sexta
    ["manha", "almoco", "tarde", "noite", "madrugada"],
    // Sábado
    ["tarde", "noite"],
    // Domingo
    ["manha", "tarde", "noite"],
  ];

  const slotColors: Record<string, string> = {
    manha: "bg-amber-500",
    almoco: "bg-orange-500",
    tarde: "bg-yellow-500",
    noite: "bg-rose-500",
    madrugada: "bg-indigo-400",
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3 font-display font-bold text-text-primary">
          <CalendarDays className="w-5 h-5 text-primary" />
          Rotina Semanal Sugerida
        </CardTitle>
        <p className="text-sm text-text-secondary font-medium">
          Combine os horários ao longo da semana para manter consistência sem saturar.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-muted text-center py-2">Horário</div>
              {days.map((d) => (
                <div key={d} className="text-[11px] font-black text-text-primary text-center py-2 bg-secondary/30 rounded-lg">
                  {d}
                </div>
              ))}
            </div>
            {TIME_SLOTS.map((slot) => (
              <div key={slot.id} className="grid grid-cols-8 gap-2 mb-2">
                <div className={`text-[10px] font-bold ${slot.color} flex items-center gap-1 justify-center`}>
                  <slot.icon className="w-3 h-3" />
                  {slot.timeRange.split(" – ")[0]}
                </div>
                {days.map((_, dayIdx) => {
                  const active = routineMatrix[dayIdx].includes(slot.id);
                  return (
                    <div
                      key={dayIdx}
                      className={`h-9 rounded-lg flex items-center justify-center transition-all ${
                        active
                          ? `${slotColors[slot.id]} text-white shadow-lg`
                          : "bg-secondary/20 border border-border/20"
                      }`}
                    >
                      {active && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-text-muted font-medium mt-4 text-center">
          Clique nos CTAs acima para copiar e usar nos seus stories.
        </p>
      </CardContent>
    </Card>
  );
}

// Lucide doesn't export CalendarDays directly, let me create a local wrapper or use another icon
function CalendarDays({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
      <path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
    </svg>
  );
}

// --- Main Page Component ---

export default function StoriesScheduleGuide() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long" });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <TooltipProvider>
      <div className="space-y-10 pb-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 md:p-10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Clock className="w-32 h-32 text-primary" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <Badge variant="outline" className="border-primary/30 text-primary text-[11px] font-black uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3 mr-1" /> Guia de Engajamento
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-text-primary mb-3">
              Horários Recomendados para Stories
            </h1>
            <p className="text-[15px] font-medium text-text-secondary leading-relaxed mb-6">
              Poste seu story hoje e já planeje o do próximo dia. Estes são os melhores horários,
              tipos de conteúdo e chamadas para ação testados para maximizar o engajamento no Instagram.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[13px] font-bold">
                <Sun className="w-4 h-4" />
                Hoje é {todayCapitalized}
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/40 text-text-secondary text-[13px] font-bold">
                <TrendingUp className="w-4 h-4" />
                Meta: 8–12 stories/dia
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Action Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="premium-card bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-wider">Dica de Ouro</span>
              </div>
              <p className="text-[13px] font-bold text-text-primary">
                Espalhe seus stories ao longo do dia em vez de postar tudo de uma vez. O algoritmo premia a consistência.
              </p>
            </CardContent>
          </Card>

          <Card className="premium-card bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-500">
                <Heart className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-wider">Regra dos 3</span>
              </div>
              <p className="text-[13px] font-bold text-text-primary">
                Varie entre: 1 conteúdo de valor, 1 conteúdo pessoal e 1 conteúdo interativo (enquete/quiz) por dia.
              </p>
            </CardContent>
          </Card>

          <Card className="premium-card bg-gradient-to-br from-rose-500/5 to-transparent">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-rose-500">
                <ArrowRight className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-wider">Próximo Passo</span>
              </div>
              <p className="text-[13px] font-bold text-text-primary">
                Ao postar agora, programe o próximo story para amanhã às 19h — o horário de maior engajamento.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Time Slots Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black font-display text-text-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Janelas de Publicação
            </h2>
            <Badge variant="outline" className="text-[11px] font-black border-border/40 text-text-muted">
              Baseado em dados de audiência brasileira
            </Badge>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {TIME_SLOTS.map((slot, i) => (
              <TimeSlotCard key={slot.id} slot={slot} index={i} />
            ))}
          </div>
        </div>

        {/* Weekly Routine */}
        <WeeklyRoutine />

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border/60 bg-card p-8 text-center space-y-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-black font-display text-text-primary mb-2">
              Quer automatizar essa rotina?
            </h3>
            <p className="text-[14px] font-medium text-text-secondary max-w-lg mx-auto mb-5">
              Use o MINDMAX Stories para gerar, agendar e publicar seus stories automaticamente nos melhores horários.
            </p>
            <Button
              size="lg"
              className="font-black text-[14px] px-8 py-6 rounded-xl bg-primary hover:bg-primary/90 shadow-glow transition-all"
              onClick={() => window.location.href = "/story-engine"}
            >
              Ir para MINDMAX Stories
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
