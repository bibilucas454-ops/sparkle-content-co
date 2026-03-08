import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada!");
      setNewPassword("");
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-silver">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display font-semibold">Account</h2>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display font-semibold">Change Password</h2>
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-secondary border-border"
          />
          <Button onClick={handleUpdatePassword} disabled={loading}>
            Update Password
          </Button>
        </div>

        <div className="rounded-lg border border-destructive/30 bg-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-destructive">Danger Zone</h2>
          <Button variant="destructive" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
