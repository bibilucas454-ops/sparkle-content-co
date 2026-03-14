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
        <div className="flex items-center gap-4 bg-card/30 p-6 md:p-8 rounded-3xl border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-[200px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-foreground">
              Configurações
            </h1>
            <p className="text-muted-foreground mt-1.5 text-base font-medium">
              Gerencie suas preferências e o algoritmo da plataforma.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Main Config Area */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Motor de Nicho Card */}
            <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/30 pb-4 mb-5">
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">Motor de Nicho</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Defina o foco do seu conteúdo para toda a plataforma.</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Nicho Ativo Atual
                  </label>
                  <div className="p-4 rounded-xl bg-secondary border border-border/50 font-medium text-foreground text-center text-lg shadow-inner">
                    {niche}
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Nichos Sugeridos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allNiches.map((n) => (
                      <button
                        key={n}
                        onClick={() => setNiche(n)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all border font-medium ${
                          niche === n
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                            : "bg-card/40 border-border/40 text-muted-foreground hover:border-border/80 hover:bg-card/80 hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/30">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
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
            <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
               <div className="flex items-center gap-2 border-b border-border/30 pb-4 mb-5">
                <Key className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-display font-bold text-lg text-foreground">Alterar Senha</h2>
              </div>
              <div className="flex gap-3">
                <Input
                  type="password"
                  placeholder="Nova senha (min. 6 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-card border-border/50 rounded-xl"
                />
                <Button onClick={handleUpdatePassword} disabled={loading} variant="glow" className="rounded-xl font-bold whitespace-nowrap">
                  Atualizar
                </Button>
              </div>
            </div>

          </div>

          {/* Sidebar Settings Area */}
          <div className="md:col-span-2 space-y-6">
            <div className="glow-card rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
              <div className="flex items-center gap-2 border-b border-border/30 pb-4 mb-4">
                <User className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-display font-bold text-lg text-foreground">Perfil</h2>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email da Conta</label>
                <p className="text-sm font-medium mt-1 p-3 bg-secondary/50 rounded-xl border border-border/40 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 backdrop-blur-xl p-6">
              <h2 className="font-display font-bold text-lg text-destructive mb-2">Sessão</h2>
              <p className="text-sm text-muted-foreground mb-4">Encerrar sessão de todos os dispositivos.</p>
              <Button variant="destructive" onClick={signOut} className="w-full rounded-xl font-bold gap-2">
                <LogOut className="w-4 h-4" /> Sair da Plataforma
              </Button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
