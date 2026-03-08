import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Youtube, Instagram, Play, Link2, Unlink, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  connectYouTubeAccount,
  connectInstagramAccount,
  connectTikTokAccount,
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
  created_at: string;
  token_expires_at: string | null;
}

export default function PublisherAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

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
      toast.success("Conta conectada com sucesso.");
      await fetchAccounts();
    } catch (err: any) {
      toast.error(err.message || "Falha ao conectar conta.");
    } finally {
      setConnecting(null);
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
            const account = accounts.find((a) => a.platform === platform.id);
            const isConnecting = connecting === platform.id;

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
                            <Link2 className="w-3 h-3" />
                            {account.account_name || "Conta conectada"}
                          </p>
                          <p className="text-xs">
                            Conectada em {new Date(account.created_at).toLocaleDateString("pt-BR")}
                          </p>
                          {account.token_expires_at && (
                            <p className="text-xs text-warning">
                              Token expira em {new Date(account.token_expires_at).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Não conectada</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {account ? (
                      <>
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

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-foreground mb-2">ℹ️ Sobre as integrações</h3>
          <p className="text-sm text-muted-foreground">
            As integrações OAuth com YouTube, Instagram e TikTok estão sendo preparadas.
            Em breve você poderá conectar suas contas e publicar diretamente de dentro do CreatorOS AI.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
