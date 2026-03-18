import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Sparkles, Compass, BookOpen, Save,
  Calendar, Settings, LogOut, Zap, Menu, X, Upload, Bot, History, Link as LinkIcon
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Footer } from "./Footer";
import { ThemeToggle } from "./ThemeToggle";

type NavGroup = {
  label: string;
  items: { path: string; label: string; icon: any }[];
};

const navGroups: NavGroup[] = [
  {
    label: "PAINEL",
    items: [
      { path: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    ]
  },
  {
    label: "CRIAR",
    items: [
      { path: "/generate", label: "Gerar Conteúdo", icon: Sparkles },
      { path: "/hooks", label: "Biblioteca de Hooks", icon: BookOpen },
      { path: "/prompt-grok", label: "Prompt de Vídeo IA", icon: Bot },
    ]
  },
  {
    label: "GERENCIAR",
    items: [
      { path: "/publisher", label: "Publicar", icon: Upload },
      { path: "/saved", label: "Conteúdo Salvo", icon: Save },
      { path: "/publisher/history", label: "Histórico de Publicações", icon: History },
      { path: "/calendar", label: "Calendário", icon: Calendar },
    ]
  },
  {
    label: "INTEGRAÇÕES",
    items: [
      { path: "/publisher/accounts", label: "Contas Conectadas", icon: LinkIcon },
    ]
  },
  {
    label: "ANÁLISE",
    items: [
      { path: "/trends", label: "Tendências", icon: Compass },
    ]
  },
  {
    label: "CONFIGURAÇÕES",
    items: [
      { path: "/settings", label: "Configurações", icon: Settings },
    ]
  }
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderNavLinks = (isMobile = false) => (
    <div className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1 mb-6">
          <h4 className="px-3 text-[10px] font-black text-muted-foreground/80 uppercase tracking-[0.15em] mb-3">
            {group.label}
          </h4>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                    active
                      ? "bg-secondary text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r-md"></div>
                  )}
                  <item.icon className={`w-4 h-4 transition-colors duration-300 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className="pt-6 mt-8 border-t border-border/60">
        <button
          onClick={() => { signOut(); isMobile && setMobileOpen(false); }}
          className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4 group-hover:text-destructive transition-colors" />
          Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex selection:bg-primary/30 text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/40 backdrop-blur-xl p-5 fixed h-full overflow-y-auto custom-scrollbar z-50">
        <div className="flex items-center justify-between mb-10 px-1 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xl font-black font-display tracking-tight text-gradient-silver">CreatorOS</span>
          </div>
        </div>
        <nav className="flex-1">
          {renderNavLinks()}
        </nav>
        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center justify-between px-2 bg-secondary/40 p-2 rounded-2xl border border-border/50">
            <span className="text-xs font-bold text-muted-foreground px-2">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-black font-display text-lg tracking-tight text-gradient-silver">CreatorOS</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground h-10 w-10 rounded-xl hover:bg-secondary">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-16 p-4 overflow-y-auto">
          <nav className="mt-4">
            {renderNavLinks(true)}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 max-w-full overflow-hidden flex flex-col min-h-screen">
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1 animate-fade-in flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
