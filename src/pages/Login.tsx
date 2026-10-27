import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { loginWithCredentials } from "@/lib/api";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, UserCheck } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const targetDestination = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) {
      setError("Por favor, preencha o seu e-mail/WhatsApp e senha.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await loginWithCredentials({ login: login.trim(), password });
      if (res.ok && res.access_token && res.user) {
        signIn(res.access_token, res.user);
        navigate(targetDestination, { replace: true });
      } else {
        setError(res.message || "Credenciais inválidas. Tente novamente.");
      }
    } catch (err: unknown) {
      setError("Erro inesperado ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative selection:bg-primary selection:text-primary-foreground">
      {/* Background Decorativo */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Card Principal */}
        <div className="rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-md overflow-hidden">
          {/* Barra superior de destaque */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />

          <div className="p-8 space-y-6">
            {/* Header / Logo */}
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-1 border border-primary/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
                AdsWhats Monitor
              </h1>
              <p className="text-xs text-muted-foreground">
                Torre de Gestão Centralizada de Lojas e Contatos
              </p>
            </div>

            {/* Alerta de Erro */}
            {error && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2.5 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo: E-mail ou WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  E-mail ou WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="ex: admin@empresa.com ou 11999998888"
                    autoComplete="username"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Campo: Senha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar na Plataforma</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Rodapé do Card */}
          <div className="px-8 py-3.5 bg-muted/30 border-t border-border text-center">
            <span className="text-[11px] text-muted-foreground">
              Acesso exclusivo para administradores e operadores da empresa gestora.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
