import { Component, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CommandPalette } from "@/components/CommandPalette";
import { BottomNav } from "@/components/navigation/BottomNav";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import LojasPage from "@/pages/Lojas";
import ContatosPage from "@/pages/Contatos";
import CriativosPage from "@/pages/Criativos";
import UsuariosPage from "@/pages/Usuarios";
import PublicConnect from "@/pages/PublicConnect";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos de cache em memória sem re-consultar o n8n ao trocar de tela
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Erro inesperado ao renderizar esta página." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-card border border-border p-6 text-center space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-foreground">Ops, algo falhou ao carregar esta tela</h2>
            <p className="text-xs text-muted-foreground break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <AppErrorBoundary>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/conectar/:token" element={<PublicConnect />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/criativos"
                element={
                  <ProtectedRoute>
                    <CriativosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lojas"
                element={
                  <ProtectedRoute>
                    <LojasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contatos"
                element={
                  <ProtectedRoute>
                    <ContatosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute requireAdmin>
                    <UsuariosPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </AppErrorBoundary>
            <CommandPalette />
            <BottomNav />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
