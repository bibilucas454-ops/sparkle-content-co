import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ProblematicAccount {
  id: string;
  platform: string;
  account_name: string | null;
  status: string;
  last_error: string | null;
  last_error_code: string | null;
}

const BAD_STATUSES = ["needs_reauth", "reconnect_required", "error", "expired"];

const PLATFORM_NAMES: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
};

function getProblemMessage(accounts: ProblematicAccount[]): string {
  if (accounts.length === 1) {
    const account = accounts[0];
    const platformName = PLATFORM_NAMES[account.platform] || account.platform;
    if (account.platform === "youtube") {
      return "O Google revogou ou expirou o acesso do YouTube. Reconecte a conta para continuar publicando.";
    }
    return `A conexão com ${platformName} precisa ser restabelecida. Reconecte a conta para continuar publicando.`;
  }

  const hasYouTube = accounts.some((a) => a.platform === "youtube");
  if (hasYouTube) {
    return "O Google revogou ou expirou o acesso do YouTube e outras contas precisam ser reconectadas.";
  }
  return "Várias contas conectadas precisam ser reconectadas.";
}

export default function ConnectionAlertBanner() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ProblematicAccount[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const toastRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchProblematicAccounts = async () => {
      const { data, error } = await supabase
        .from("social_tokens")
        .select("id, platform, account_name, status, last_error, last_error_code")
        .eq("user_id", user.id)
        .in("status", BAD_STATUSES);

      if (error) {
        console.error("[ConnectionAlertBanner] Erro ao buscar contas:", error);
        return;
      }

      setAccounts((prev) => {
        const next = (data as ProblematicAccount[]) ?? [];
        const wentBad = next.length > 0 && prev.length === 0;
        const gotWorse = next.length > prev.length;

        if ((wentBad || gotWorse) && !dismissed) {
          const message = getProblemMessage(next);
          if (toastRef.current) {
            toast.dismiss(toastRef.current);
          }
          toastRef.current = toast.error(message, {
            duration: 8000,
            action: {
              label: "Reconectar",
              onClick: () => {
                window.location.href = "/publisher/accounts";
              },
            },
          });
        }

        return next;
      });
    };

    fetchProblematicAccounts();

    channel = supabase
      .channel("social_tokens_alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "social_tokens",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProblematicAccounts();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (toastRef.current) {
        toast.dismiss(toastRef.current);
      }
    };
  }, [user, dismissed]);

  if (!user || accounts.length === 0 || dismissed) {
    return null;
  }

  return (
    <div className="w-full bg-destructive/10 border-b border-destructive/20 px-4 py-3 md:px-6 md:py-4">
      <div className="max-w-7xl mx-auto flex items-start md:items-center gap-3 md:gap-4">
        <div className="shrink-0 p-1.5 rounded-full bg-destructive/15">
          <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-base font-bold text-foreground leading-snug">
            {getProblemMessage(accounts)}
          </p>
          <p className="text-xs md:text-sm text-text-secondary mt-0.5">
            A publicação automática pode falhar enquanto a conexão não for restabelecida.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="destructive"
            size="sm"
            asChild
            className="h-8 md:h-9 text-xs md:text-sm font-bold gap-1.5"
          >
            <Link to="/publisher/accounts">
              <RefreshCw className="w-3.5 h-3.5" />
              Reconectar
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 md:h-9 md:w-9 text-text-secondary hover:text-foreground shrink-0"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
