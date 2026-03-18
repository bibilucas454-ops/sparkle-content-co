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
    <div className="space-y-8">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          <h4 className="px-4 text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">
            {group.label}
          </h4>
          <div className="space-y-1.5">
            {group.items.map((item) => {
              const active = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 relative overflow-hidden ${
                    active
                      ? "bg-primary text-white shadow-glow ring-1 ring-white/10"
                      : "text-muted-foreground/90 hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
                  )}
                  <item.icon className={`w-4.5 h-4.5 transition-all duration-300 ${active ? "text-white scale-110" : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"}`} strokeWidth={active ? 2.5 : 2} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className="pt-8 mt-10 border-t border-border/40">
        <button
          onClick={() => { signOut(); isMobile && setMobileOpen(false); }}
          className="group flex items-center gap-3.5 px-5 py-4 rounded-2xl text-[14px] font-black text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex selection:bg-primary/20 text-foreground overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border/40 bg-card/60 backdrop-blur-2xl p-6 fixed h-full overflow-y-auto custom-scrollbar z-50">
        <div className="flex items-center justify-between mb-12 px-2 pt-4">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 group hover:rotate-0 transition-transform duration-500">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black font-display tracking-tighter text-gradient-primary">CreatorOS</span>
          </Link>
        </div>
        <nav className="flex-1">
          {renderNavLinks()}
        </nav>
        <div className="pt-8 border-t border-border/40">
          <div className="flex items-center justify-between px-3 bg-secondary/50 p-2.5 rounded-2xl border border-border/20 backdrop-blur-sm">
            <span className="text-[11px] font-black text-muted-foreground/80 uppercase tracking-widest px-2">Visual</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="font-black font-display text-xl tracking-tighter text-gradient-primary">CreatorOS</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground h-11 w-11 rounded-2xl hover:bg-secondary border border-border/20">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl pt-24 p-6 overflow-y-auto animate-fade-in">
          <nav>
            {renderNavLinks(true)}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-72 pt-20 md:pt-0 max-w-full overflow-hidden flex flex-col min-h-screen">
        <div className="p-5 md:p-10 max-w-7xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex-1 space-y-8">
            {children}
          </div>
          <div className="mt-20">
            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}
