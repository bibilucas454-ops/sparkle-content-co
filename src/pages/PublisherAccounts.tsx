import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Youtube, Instagram, Play, Link2, Unlink, RefreshCw, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  connectYouTubeAccount,
  connectInstagramAccount,
  connectTikTokAccount,
  refreshPlatformToken,
  getAccountStatus,
  getAccountStatusLabel,
  getAccountStatusColor,
  type AccountStatus,
} from "@/services/platformServices";

const PLATFORMS = [
  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-500", connectFn: connectYouTubeAccount },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500", connectFn: connectInstagramAccount },
  { id: "tiktok", label: "TikTok", icon: Play, color: "text-cyan-400", connectFn: connectTikTokAccount },
];

interface Account {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  created_at: string;
  token_expires_at: string | null;
}

export default function PublisherAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("social_accounts")
      .select("id, platform, account_name, created_at, token_expires_at")
      .order("created_at", { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  };

  const handleConnect = async (platformId: string, connectFn: () => Promise<void>) => {
    setConnecting(platformId);
    try {
      await connectFn();
      // Will redirect to OAuth, so no need to handle success here
    } catch (err: any) {
      toast.error(err.message || "Falha ao conectar conta.");
      setConnecting(null);
    }
  };

  const handleRefresh = async (platformId: string) => {
    setRefreshing(platformId);
    try {
      await refreshPlatformToken(platformId);
      toast.success("Token atualizado com sucesso!");
      await fetchAccounts();
    } catch (err: any) {
      toast.error(err.message || "Falha ao atualizar token.");
    } finally {
      setRefreshing(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    const { error } = await supabase.from("social_accounts").delete().eq("id", accountId);
    if (error) {
      toast.error("Falha ao desconectar conta.");
    } else {
      toast.success("Conta desconectada.");
      await fetchAccounts();
    }
  };

  const getStatusIcon = (status: AccountStatus) => {
    if (status === "conectada") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    if (status === "token_expirado") return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
    return <XCircle className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">
            Contas Conectadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas contas de redes sociais para publicação automática.
          </p>
        </div>

        <div className="grid gap-4">
          {PLATFORMS.map((platform) => {
            const account = accounts.find((a) => a.platform === platform.id) || null;
            const isConnecting = connecting === platform.id;
            const isRefreshing = refreshing === platform.id;
            const status = getAccountStatus(account);

            return (
              <div
                key={platform.id}
                className="rounded-lg border border-border bg-card p-6 glow-card"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      <platform.icon className={`w-6 h-6 ${platform.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{platform.label}</h3>
                      {account ? (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p className="flex items-center gap-1.5">
                            {getStatusIcon(status)}
                            <span className={getAccountStatusColor(status)}>
                              {getAccountStatusLabel(status)}
                            </span>
                            {account.account_name && (
                              <span className="text-foreground ml-1">— {account.account_name}</span>
                            )}
                          </p>
                          <p className="text-xs">
                            Conectada em {new Date(account.created_at).toLocaleDateString("pt-BR")}
                          </p>
                          {account.token_expires_at && (
                            <p className={`text-xs ${status === "token_expirado" ? "text-yellow-500" : "text-muted-foreground"}`}>
                              {status === "token_expirado"
                                ? "⚠️ Token expirado — reconecte ou atualize"
                                : `Token expira em ${new Date(account.token_expires_at).toLocaleDateString("pt-BR")}`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          {getStatusIcon(status)}
                          Não conectada
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {account ? (
                      <>
                        {status === "token_expirado" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefresh(platform.id)}
                            disabled={isRefreshing}
                          >
                            {isRefreshing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            Atualizar Token
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(platform.id, platform.connectFn)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Reconectar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(account.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="glow"
                        size="sm"
                        onClick={() => handleConnect(platform.id, platform.connectFn)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5" />
                        )}
                        Conectar conta
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h3 className="text-sm font-medium text-foreground">⚙️ Credenciais necessárias</h3>
          <p className="text-sm text-muted-foreground">
            Para conectar suas contas, as seguintes variáveis de ambiente devem estar configuradas no Supabase (Edge Function Secrets):
          </p>
          <div className="grid gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-secondary">
              <span className="text-accent">YouTube:</span> YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
            </div>
            <div className="p-2 rounded bg-secondary">
              <span className="text-accent">Instagram:</span> INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET
            </div>
            <div className="p-2 rounded bg-secondary">
              <span className="text-accent">TikTok:</span> TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
            </div>
            <div className="p-2 rounded bg-secondary">
              <span className="text-accent">App:</span> APP_URL (URL do seu app para redirecionamento)
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure a URL de callback OAuth em cada plataforma como:<br />
            <code className="text-accent">https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/oauth-callback</code>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
