import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter } from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CalendarEvent {
  date: string;
  title: string;
  platform: string;
}

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("TikTok");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const navigate = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  const addEvent = (dateStr: string) => {
    if (!newTitle.trim()) return;
    setEvents((prev) => [...prev, { date: dateStr, title: newTitle, platform: newPlatform }]);
    setNewTitle("");
    setShowAdd(null);
  };

  const monthName = currentDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="pb-8 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl shadow-primary/10">
                <CalendarIcon className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-foreground leading-none">
                  Calendário
                </h1>
                <p className="text-muted-foreground mt-3 text-base md:text-xl font-medium max-w-xl leading-relaxed">
                  Planeje sua estratégia de conteúdo e visualize seus agendamentos.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-12 px-6 rounded-xl font-bold gap-2">
                <Filter className="w-4 h-4" /> FILTRAR
              </Button>
              <Button variant="premium" className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20">
                NOVO AGENDAMENTO
              </Button>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between bg-card/40 p-4 rounded-2xl border border-border/40 backdrop-blur-xl shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl hover:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-black font-display tracking-tight capitalize">{monthName}</h2>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)} className="h-10 w-10 rounded-xl hover:bg-secondary">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 py-4 italic">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = events.filter((e) => e.date === dateStr);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={day}
                className={`min-h-[120px] md:min-h-[160px] premium-card p-3 text-xs cursor-pointer transition-all duration-300 relative group ${
                  isToday ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-primary/20 hover:-translate-y-1"
                }`}
                onClick={() => setShowAdd(showAdd === dateStr ? null : dateStr)}
              >
                <span className={`text-[14px] font-black font-display ${isToday ? "text-primary" : "text-muted-foreground/40 group-hover:text-foreground/60 transition-colors"}`}>{day}</span>
                <div className="mt-3 space-y-2">
                  {dayEvents.map((e, ei) => (
                    <div key={ei} className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1.5 truncate text-[11px] font-bold shadow-sm">
                      {e.platform}: {e.title}
                    </div>
                  ))}
                </div>
                {showAdd === dateStr && (
                  <div className="mt-1 space-y-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Título"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="h-6 text-[10px] bg-secondary"
                    />
                    <Button size="sm" className="h-5 text-[10px] w-full" onClick={() => addEvent(dateStr)}>
                      <Plus className="w-3 h-3" /> Adicionar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
