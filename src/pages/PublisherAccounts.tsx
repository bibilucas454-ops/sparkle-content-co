import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Youtube, Instagram, Play, Link2, Unlink, RefreshCw, Loader2, AlertTriangle, CheckCircle2, XCircle, Settings } from "lucide-react";
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
      .select("id, platform, account_name, account_id, created_at, token_expires_at")
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
        <header className="pb-8 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl shadow-primary/10">
                <Link2 className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter text-foreground leading-none">
                  Contas Conectadas
                </h1>
                <p className="text-muted-foreground mt-3 text-base md:text-xl font-medium max-w-xl leading-relaxed">
                  Gerencie suas contas de redes sociais para publicação automática.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-4">
          {PLATFORMS.map((platform) => {
            const account = accounts.find((a) => a.platform === platform.id) || null;
            const isConnecting = connecting === platform.id;
            const isRefreshing = refreshing === platform.id;
            const status = getAccountStatus(account);

            return (
              <div
                key={platform.id}
                className="premium-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/80 flex items-center justify-center border border-border/40 shadow-inner">
                      <platform.icon className={`w-7 h-7 ${platform.color}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground font-display tracking-tight">{platform.label}</h3>
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
                          <p className="text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground/60">
                            Conectada em {new Date(account.created_at).toLocaleDateString("pt-BR")}
                          </p>
                          {account.token_expires_at && (
                            <p className={`text-xs ${status === "token_expirado" ? "text-yellow-500" : "text-muted-foreground"}`}>
                              {status === "token_expirado"
                                ? "⚠️ Token expirado — tentando renovação automática"
                                : `Token renovável até ${new Date(account.token_expires_at).toLocaleDateString("pt-BR")}`}
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
                        variant="premium"
                        size="default"
                        onClick={() => handleConnect(platform.id, platform.connectFn)}
                        disabled={isConnecting}
                        className="h-12 rounded-xl px-6 font-bold"
                      >
                        {isConnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Link2 className="w-4 h-4 mr-2" />
                        )}
                        CONECTAR CONTA
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="premium-card p-8 md:p-10 space-y-6">
          <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Credenciais Necessárias
          </h3>
          <p className="text-base text-muted-foreground font-medium leading-relaxed">
            Para conectar suas contas, as seguintes variáveis de ambiente devem estar configuradas no Supabase (Edge Function Secrets):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/40 shadow-inner">
              <span className="text-primary font-black uppercase text-[10px] tracking-widest block mb-2">YouTube</span>
              <span className="text-foreground/80 leading-loose">YOUTUBE_CLIENT_ID<br />YOUTUBE_CLIENT_SECRET</span>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/40 shadow-inner">
              <span className="text-primary font-black uppercase text-[10px] tracking-widest block mb-2">Instagram</span>
              <span className="text-foreground/80 leading-loose">INSTAGRAM_CLIENT_ID<br />INSTAGRAM_CLIENT_SECRET</span>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/40 shadow-inner">
              <span className="text-primary font-black uppercase text-[10px] tracking-widest block mb-2">TikTok</span>
              <span className="text-foreground/80 leading-loose">TIKTOK_CLIENT_KEY<br />TIKTOK_CLIENT_SECRET</span>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/40 shadow-inner">
              <span className="text-primary font-black uppercase text-[10px] tracking-widest block mb-2">App General</span>
              <span className="text-foreground/80 leading-loose">APP_URL (URL de Redirecionamento)</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground font-medium">
              Configure a URL de callback OAuth em cada plataforma como:<br />
              <code className="text-primary font-black mt-2 block select-all">https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/oauth-callback</code>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
