import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processando autenticação...");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      setStatus("success");
      setMessage("Conta do Instagram conectada com sucesso.");
      toast.success("Conta do Instagram conectada com sucesso.");
      setTimeout(() => navigate("/publisher/accounts", { replace: true }), 2000);
    } else if (error) {
      setStatus("error");
      setMessage(error);
      toast.error("Erro ao conectar Instagram.");
      setTimeout(() => navigate("/publisher/accounts", { replace: true }), 3000);
    } else {
      setStatus("error");
      setMessage("Parâmetros inválidos.");
      setTimeout(() => navigate("/publisher/accounts", { replace: true }), 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        {status === "loading" && <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto" />}
        {status === "success" && <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />}
        {status === "error" && <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />}
        <p className="text-lg text-foreground font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
