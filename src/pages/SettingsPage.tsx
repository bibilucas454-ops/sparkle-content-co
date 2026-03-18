import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNiche } from "@/contexts/NicheContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, User, Key, LogOut, CheckCircle2 } from "lucide-react";

const STANDARD_NICHES = [
  "Empreendedorismo",
  "Desenvolvimento pessoal",
  "Motivação",
  "Marketing digital",
  "Negócios online",
  "Inteligência artificial",
  "Finanças",
  "Fitness",
  "Educação",
  "Lifestyle",
  "Conteúdo cristão",
  "Tecnologia",
  "Produtividade"
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { niche, setNiche, customNiches, addCustomNiche } = useNiche();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [newCustomNiche, setNewCustomNiche] = useState("");

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada!");
      setNewPassword("");
    }
    setLoading(false);
  };

  const handleAddCustomNiche = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomNiche.trim()) return;
    
    addCustomNiche(newCustomNiche.trim());
    toast.success(`Nicho "${newCustomNiche}" adicionado e selecionado!`);
    setNewCustomNiche("");
  };

  const allNiches = [...STANDARD_NICHES, ...customNiches];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl animate-fade-in relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 premium-card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl shadow-primary/10">
              <Settings className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-foreground leading-none">
                Configurações
              </h1>
              <p className="text-muted-foreground mt-3 text-base md:text-xl font-medium leading-relaxed">
                Gerencie suas preferências e o algoritmo da plataforma.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Main Config Area */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Motor de Nicho Card */}
            <div className="premium-card p-6 md:p-10 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/30 pb-6 mb-8">
                <div>
                  <h2 className="font-display font-black text-xl text-foreground tracking-tight">Motor de Nicho</h2>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">Defina o foco do seu conteúdo em toda a rede.</p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/10">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    Nicho Ativo Atual
                  </label>
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 font-black text-primary text-center text-2xl shadow-inner tracking-tight">
                    {niche}
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    Nichos Sugeridos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allNiches.map((n) => (
                      <button
                        key={n}
                        onClick={() => setNiche(n)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all border font-bold ${
                          niche === n
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                            : "bg-secondary/40 border-border/40 text-muted-foreground hover:border-border/80 hover:bg-secondary/60 hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-border/30">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    Criar Nicho Customizado
                  </label>
                  <form onSubmit={handleAddCustomNiche} className="flex gap-2">
                    <Input
                      placeholder="Ex: Copywriting Médico..."
                      value={newCustomNiche}
                      onChange={(e) => setNewCustomNiche(e.target.value)}
                      className="bg-card/60 border-border/50 focus-visible:ring-primary/40 rounded-xl"
                    />
                    <Button type="submit" variant="secondary" className="rounded-xl font-bold">
                      Adicionar
                    </Button>
                  </form>
                </div>

              </div>
            </div>

            {/* Account Settings */}
            <div className="premium-card p-6 md:p-10">
               <div className="flex items-center gap-3 border-b border-border/30 pb-6 mb-8">
                <Key className="w-6 h-6 text-muted-foreground/60" />
                <h2 className="font-display font-black text-xl text-foreground tracking-tight">Alterar Senha</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="password"
                  placeholder="Nova senha mestre"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary/40 border-border/40 h-14 rounded-2xl text-base font-medium focus-visible:ring-primary/40"
                />
                <Button onClick={handleUpdatePassword} disabled={loading} variant="premium" className="h-14 px-8 font-bold whitespace-nowrap">
                  Atualizar
                </Button>
              </div>
            </div>

          </div>

          {/* Sidebar Settings Area */}
          <div className="md:col-span-2 space-y-6">
            <div className="premium-card p-6 md:p-10">
              <div className="flex items-center gap-3 border-b border-border/30 pb-6 mb-6">
                <User className="w-6 h-6 text-muted-foreground/60" />
                <h2 className="font-display font-black text-lg text-foreground tracking-tight">Perfil</h2>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Email da Conta</label>
                <p className="text-sm font-bold mt-2 p-4 bg-secondary/50 rounded-2xl border border-border/40 truncate text-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 backdrop-blur-xl p-8 md:p-10">
              <h2 className="font-display font-black text-xl text-destructive mb-3 tracking-tight">Sessão Crítica</h2>
              <p className="text-sm text-destructive/70 font-medium mb-6 leading-relaxed">Encerrar sessão de todos os dispositivos conectados à sua conta.</p>
              <Button variant="destructive" onClick={signOut} className="w-full h-14 rounded-2xl font-black gap-3 text-base shadow-lg shadow-destructive/10">
                <LogOut className="w-5 h-5" /> Sair da Plataforma
              </Button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
