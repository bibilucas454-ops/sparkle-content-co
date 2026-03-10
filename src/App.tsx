import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import GenerateContent from "./pages/GenerateContent";
import TrendHunter from "./pages/TrendHunter";
import HookLibrary from "./pages/HookLibrary";
import SavedContent from "./pages/SavedContent";
import ContentCalendar from "./pages/ContentCalendar";
import SettingsPage from "./pages/SettingsPage";
import PublisherHub from "./pages/PublisherHub";
import PublisherHistory from "./pages/PublisherHistory";
import PublisherAccounts from "./pages/PublisherAccounts";
import OAuthCallback from "./pages/OAuthCallback";
import InstagramCallback from "./pages/InstagramCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse-glow text-muted-foreground">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/generate" element={<ProtectedRoute><GenerateContent /></ProtectedRoute>} />
            <Route path="/publisher" element={<ProtectedRoute><PublisherHub /></ProtectedRoute>} />
            <Route path="/publisher/history" element={<ProtectedRoute><PublisherHistory /></ProtectedRoute>} />
            <Route path="/publisher/accounts" element={<ProtectedRoute><PublisherAccounts /></ProtectedRoute>} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/auth/instagram/callback" element={<InstagramCallback />} />
            <Route path="/trends" element={<ProtectedRoute><TrendHunter /></ProtectedRoute>} />
            <Route path="/hooks" element={<ProtectedRoute><HookLibrary /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedContent /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><ContentCalendar /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
