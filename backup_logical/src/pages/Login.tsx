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

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 text-foreground overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[150px]" />
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
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-secondary to-background border border-border/50 mb-6 shadow-xl shadow-black/50"
            >
              <Zap className="w-7 h-7 text-primary" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground mb-3">
              CreatorOS AI
            </h1>
            <p className="text-base text-muted-foreground">
              A inteligência por trás dos vídeos virais.
            </p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-2xl p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            
            <div className="space-y-3 mb-8">
              <Button 
                variant="outline" 
                className="w-full h-11 text-sm font-medium bg-secondary/30 hover:bg-secondary/60 border-border/50 hover:border-border transition-all text-foreground"
              >
                <Instagram className="w-5 h-5 mr-3 text-foreground/80" />
                Continuar com Instagram
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-11 text-sm font-medium bg-secondary/30 hover:bg-secondary/60 border-border/50 hover:border-border transition-all text-foreground"
              >
                <Facebook className="w-5 h-5 mr-3 text-foreground/80" />
                Continuar com Facebook
              </Button>
            </div>

            <div className="relative mb-8">
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
                    className="pl-10 h-11 bg-secondary/20 border-border/40 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-border text-sm rounded-xl transition-all"
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
                    className="h-11 bg-secondary/20 border-border/40 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-border text-sm rounded-xl px-4 transition-all"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-sm font-medium tracking-wide shadow-md shadow-primary/10 hover:shadow-primary/20 rounded-xl"
                disabled={loading}
              >
                {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar na plataforma"}
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
