import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Zap, Instagram, Facebook, Mail } from "lucide-react";
import { Footer } from "@/components/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Verifique seu e-mail para o link de confirmação!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] selection:bg-primary/30 text-foreground overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full"
        >
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-6 shadow-lg shadow-primary/10"
            >
              <Zap className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-4xl font-bold font-display tracking-tight text-white mb-3">
              Bem-vindo ao CreatorOS AI
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Gere conteúdos virais para redes sociais em segundos.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-8 shadow-2xl">
            <div className="space-y-4 mb-8">
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border-white/5 hover:border-white/10 transition-all text-white relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-white/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <Instagram className="w-5 h-5 mr-3 text-pink-500" />
                Continuar com Instagram
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border-white/5 hover:border-white/10 transition-all text-white"
              >
                <Facebook className="w-5 h-5 mr-3 text-[#1877F2]" />
                Continuar com Facebook
              </Button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0f0f0f] px-4 text-muted-foreground font-medium tracking-wider">
                  Ou use seu e-mail
                </span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-muted-foreground/50" />
                  <Input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-primary/50 text-base rounded-xl transition-all"
                  />
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-primary/50 text-base rounded-xl px-4 transition-all"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-xl" 
                variant="glow" 
                disabled={loading}
              >
                {loading ? "Processando..." : isSignUp ? "Criar conta" : "Entrar na plataforma"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
              >
                {isSignUp ? "Já tem uma conta? Fazer login" : "Não tem conta? Cadastre-se"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="p-6 relative z-10 w-full flex justify-center text-center">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-xs text-muted-foreground/60">
          <span>&copy; {currentYear} CreatorOS AI</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-white transition-colors">Política de Privacidade</a>
            <span className="cursor-pointer hover:text-white transition-colors">Termos de Uso</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
