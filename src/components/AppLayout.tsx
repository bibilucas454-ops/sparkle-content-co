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
      { path: "/publisher/history", label: "Histórico", icon: History },
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
        <div key={group.label} className="space-y-1">
          <h4 className="px-3 text-xs font-semibold text-muted-foreground/60 tracking-wider mb-2">
            {group.label}
          </h4>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className="pt-4 mt-4 border-t border-border">
        <button
          onClick={() => { signOut(); isMobile && setMobileOpen(false); }}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex selection:bg-primary/30 text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm p-4 fixed h-full overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 mb-8 px-2 pt-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-gradient-silver">CreatorOS</span>
        </div>
        <nav className="flex-1">
          {renderNavLinks()}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold font-display text-lg tracking-tight text-gradient-silver">CreatorOS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-muted-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
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
