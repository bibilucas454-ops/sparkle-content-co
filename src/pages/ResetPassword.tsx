import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, Lock } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  const [linkExpired, setLinkExpired] = useState(false);

  useEffect(() => {
    // Verifica se há token de recovery na URL (formato hash do Supabase)
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hasRecoveryInHash = hash.includes('type=recovery') || (hash.includes('access_token') && hash.includes('type=recovery'));
    const hasCodeInSearch = params.has('code'); // PKCE flow

    // Escuta o evento de mudança de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setLinkExpired(false);
      } else if (event === "SIGNED_IN" && (hasRecoveryInHash || hasCodeInSearch)) {
        setReady(true);
        setLinkExpired(false);
      }
    });

    // Fallback: verifica sessão existente com token na URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && (hasRecoveryInHash || hasCodeInSearch)) {
        setReady(true);
      } else if (!hasRecoveryInHash && !hasCodeInSearch) {
        // Sem token de recovery na URL → link inválido
        setLinkExpired(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[180px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-[180px] animate-pulse" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-background to-background border border-primary/20 mb-8 shadow-2xl shadow-primary/20">
              <Zap className="w-10 h-10 text-primary fill-current" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-display tracking-tighter mb-3">
              Nova senha
            </h1>
            <p className="text-base text-muted-foreground/80 max-w-sm mx-auto">
              Defina uma nova senha para acessar sua conta.
            </p>
          </div>

          <div className="premium-card p-10 shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-400 to-primary opacity-80"></div>

            {linkExpired ? (
              <div className="text-center space-y-4">
                <div className="text-4xl">⏰</div>
                <p className="text-base font-semibold text-foreground">Link inválido ou expirado</p>
                <p className="text-sm text-muted-foreground">
                  Este link de redefinição não é válido ou já foi usado. Os links expiram em 1 hora.
                </p>
                <Button
                  variant="premium"
                  className="w-full h-12 rounded-2xl"
                  onClick={() => navigate("/login")}
                >
                  Solicitar novo link
                </Button>
              </div>
            ) : !ready ? (
              <p className="text-center text-sm text-muted-foreground">
                Validando link de redefinição...
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="pl-12 pr-14 h-14 bg-secondary/30 border-border/40 rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirme a nova senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="pl-12 h-14 bg-secondary/30 border-border/40 rounded-2xl"
                  />
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  className="w-full h-16 text-[16px] font-black rounded-2xl"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "SALVAR NOVA SENHA"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
