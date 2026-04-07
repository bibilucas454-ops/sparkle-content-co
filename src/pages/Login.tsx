import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Zap, Mail } from "lucide-react";
import { Footer } from "@/components/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) toast.error(error.message);
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 text-foreground overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[180px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-[180px] animate-pulse" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full max-w-lg mx-auto mt-8 md:mt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-background to-background border border-primary/20 mb-8 shadow-2xl shadow-primary/20"
            >
              <Zap className="w-10 h-10 text-primary fill-current" />
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black font-display tracking-tighter text-foreground mb-4 leading-none">
              Creator<span className="text-primary">OS</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground/80 font-medium max-w-sm mx-auto">
              A inteligência suprema por trás de vídeos virais.
            </p>
          </div>

          <div className="premium-card p-10 md:p-12 shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-400 to-primary opacity-80"></div>
            
            <Button 
              variant="outline" 
              className="w-full h-14 text-[15px] font-bold bg-secondary/30 hover:bg-secondary/60 border-border/40 hover:border-primary/30 transition-all rounded-2xl"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5 mr-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground/70 font-semibold tracking-wider">
                  Ou use e-mail
                </span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    type="email"
                    placeholder="E-mail profissional"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-14 bg-secondary/30 border-border/40 text-foreground placeholder:text-text-muted focus-visible:ring-primary/40 focus-visible:border-primary/40 text-base rounded-2xl transition-all font-medium"
                  />
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-14 bg-secondary/30 border-border/40 text-foreground placeholder:text-text-muted focus-visible:ring-primary/40 focus-visible:border-primary/40 text-base rounded-2xl px-6 transition-all font-medium"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                variant="premium"
                className="w-full h-16 text-[16px] font-black rounded-2xl"
                disabled={loading}
              >
                {loading ? "Processando..." : isSignUp ? "CRIAR CONTA MESTRE" : "ENTRAR NA PLATAFORMA"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                {isSignUp ? "Já tem uma conta? Fazer login" : "Não tem conta? Cadastre-se"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-4">
        <Footer />
      </div>
    </div>
  );
};

export default Login;
