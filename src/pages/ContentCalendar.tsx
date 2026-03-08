import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">Plan and schedule your content</p>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-display font-semibold">{monthName}</h2>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground py-2">{d}</div>
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
                className={`min-h-[80px] md:min-h-[100px] rounded-md border p-1.5 text-xs cursor-pointer transition-colors ${
                  isToday ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary/50"
                }`}
                onClick={() => setShowAdd(showAdd === dateStr ? null : dateStr)}
              >
                <span className={`font-medium ${isToday ? "text-accent" : "text-muted-foreground"}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.map((e, ei) => (
                    <div key={ei} className="bg-secondary rounded px-1 py-0.5 truncate text-[10px]">
                      {e.title}
                    </div>
                  ))}
                </div>
                {showAdd === dateStr && (
                  <div className="mt-1 space-y-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="h-6 text-[10px] bg-secondary"
                    />
                    <Button size="sm" className="h-5 text-[10px] w-full" onClick={() => addEvent(dateStr)}>
                      <Plus className="w-3 h-3" /> Add
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
