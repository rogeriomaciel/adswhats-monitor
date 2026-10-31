import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { loginWithCredentials } from "@/lib/api";
import { Logo, LogoSymbol } from "@/components/brand/Logo";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Sparkles,
  Zap,
  TrendingUp,
  Store,
  CheckCircle2,
  Radio,
  Sun,
  Moon,
  Shield,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
        setError(res.message || "Credenciais inválidas. Verifique seu usuário e senha.");
      }
    } catch {
      setError("Erro inesperado ao conectar ao servidor. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-500 relative overflow-hidden font-sans">
      {/* Background Glows Sutis */}
      <div className="absolute top-[-20%] left-[-10%] w-[650px] h-[650px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[650px] h-[650px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Top Header da Landing Page */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between z-10">
        <Logo size="md" showBadge={true} />

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Sistema Online • Monitoramento Ativo</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-2xs"
            title={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Hero Showcase + Login Split Screen */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center z-10 flex-1">
        {/* Lado Esquerdo: Showcase de Valor da Plataforma (Landing Page Hero) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>A Torre Central de Anúncios & WhatsApp</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-foreground leading-[1.12]">
              Transforme cliques de anúncios em vendas reais no{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                WhatsApp.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              Monitore a velocidade de resposta da sua equipe (SLA), rastreie a campanha exata de cada lead (Meta & Google Ads) e gerencie múltiplas lojas em tempo real.
            </p>
          </div>

          {/* 3 Pilares Visuais em Destaque */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground font-display">
                Atribuição de Anúncio
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Identifique instantaneamente qual criativo gerou a conversa.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2 hover:border-blue-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground font-display">
                Auditoria de SLA
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Reduza o tempo de espera e evite que leads quentes esfriem.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2 hover:border-purple-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-foreground font-display">
                Painel Multilojas
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Controle todas as unidades e instâncias em um só lugar.
              </p>
            </div>
          </div>

          {/* Micro Prova de Performance */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-foreground">SLA Médio &lt; 3min</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-foreground">Meta & Google Ads 100% Rastreados</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-foreground">Criptografia de Ponta a Ponta</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Card Executivo de Login */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="rounded-3xl bg-card/95 backdrop-blur-xl border border-border/90 shadow-2xl overflow-hidden transition-all">
            {/* Barra superior de destaque em gradiente esmeralda/ciano */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-600" />

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground">
                  Acesse sua Conta
                </h2>
                <p className="text-xs text-muted-foreground">
                  Entre com suas credenciais de operador ou gestor
                </p>
              </div>

              {/* Alerta de Erro */}
              {error && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive flex items-center gap-2.5 text-xs animate-shake font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Formulário de Autenticação */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo: E-mail ou WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>E-mail ou WhatsApp</span>
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-50 font-medium"
                    />
                  </div>
                </div>

                {/* Campo: Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Senha de Acesso
                    </label>
                  </div>
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
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background border border-input text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-50 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground transition-colors"
                      title={showPassword ? "Ocultar senha" : "Exibir senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Botão de Envio de Alto Impacto */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none min-h-[46px] touch-manipulation"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="px-6 sm:px-8 py-3.5 bg-muted/30 border-t border-border text-center">
              <span className="text-[11px] text-muted-foreground font-medium">
                🔒 Acesso restrito e criptografado para gestores e operadores.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer da Landing Page */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground z-10">
        <div>
          <span className="font-semibold text-foreground">AdsWhats Monitor PRO</span> • Plataforma de Gestão de Anúncios WhatsApp
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Multi-Lojas Integrado</span>
          <span>•</span>
          <span>Sincronização em Tempo Real</span>
        </div>
      </footer>
    </div>
  );
}
