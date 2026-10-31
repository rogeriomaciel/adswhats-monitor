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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
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
            <CommandPalette />
            <BottomNav />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
