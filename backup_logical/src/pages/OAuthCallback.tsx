import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const platform = searchParams.get("platform");

    if (success === "true" && platform) {
      setStatus("success");
      const names: Record<string, string> = {
        youtube: "YouTube",
        instagram: "Instagram",
        tiktok: "TikTok",
      };
      setMessage(`Conta ${names[platform] || platform} conectada com sucesso!`);
      toast.success(`Conta ${names[platform] || platform} conectada com sucesso!`);
      setTimeout(() => navigate("/publisher/accounts"), 2000);
    } else if (error) {
      setStatus("error");
      setMessage(decodeURIComponent(error));
      toast.error(decodeURIComponent(error));
      setTimeout(() => navigate("/publisher/accounts"), 3000);
    } else {
      setStatus("loading");
      setMessage("Processando autenticação...");
      setTimeout(() => navigate("/publisher/accounts"), 5000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="rounded-lg border border-border bg-card p-8 max-w-md w-full text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Processando...</h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Conectado!</h2>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Erro na Conexão</h2>
          </>
        )}
        <p className="text-muted-foreground text-sm">{message}</p>
        <p className="text-xs text-muted-foreground">Redirecionando automaticamente...</p>
      </div>
    </div>
  );
}
