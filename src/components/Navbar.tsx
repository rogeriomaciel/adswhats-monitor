import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getLojas } from "@/lib/api";
import { Logo } from "@/components/brand/Logo";
import {
  LogOut,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Sun,
  Moon,
  TrendingUp,
  Search,
  AlertTriangle,
} from "lucide-react";

const SILENCE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const isAdmin = (user?.role || "admin").toLowerCase() === "admin";

  const { data: lojas = [] } = useQuery({
    queryKey: ["lojas"],
    queryFn: () => getLojas(),
    staleTime: 60_000,
  });

  const lojasAtivas = lojas.filter((l) => l.ativo);
  const now = Date.now();
  const lojasEmSilencio = lojasAtivas.filter((l) => {
    if (!l.ultima_mensagem_at) return true;
    const lastTs = new Date(l.ultima_mensagem_at).getTime();
    return Number.isFinite(lastTs) && now - lastTs > SILENCE_THRESHOLD_MS;
  });

  const navItems = [
    { label: "Visão Geral", href: "/", icon: LayoutDashboard },
    { label: "Relatórios & SLA", href: "/criativos", icon: TrendingUp },
    { label: "Lojas", href: "/lojas", icon: Building2 },
    { label: "Leads & Fila", href: "/contatos", icon: MessageSquare },
    ...(isAdmin ? [{ label: "Usuários", href: "/usuarios", icon: Shield }] : []),
  ];

  return (
    <header className="h-16 border-b border-border/80 bg-background/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-6 lg:gap-8">
        <Link to="/" className="flex items-center">
          <Logo size="sm" showBadge={true} />
        </Link>

        {/* Real Sync / Silence Indicator */}
        {lojasAtivas.length > 0 && (
          lojasEmSilencio.length > 0 ? (
            <Link
              to="/lojas"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-semibold shadow-xs hover:bg-amber-500/20 transition-colors"
              title={`${lojasEmSilencio.length} loja(s) ativa(s) sem receber mensagem há mais de 24h`}
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="tracking-tight">
                {lojasEmSilencio.length} loja{lojasEmSilencio.length > 1 ? "s" : ""} sem sinal (&gt;24h)
              </span>
            </Link>
          ) : (
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[11px] font-semibold shadow-xs"
              title="Todas as lojas ativas receberam mensagens nas últimas 24h"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="tracking-tight">Lojas Sincronizadas</span>
            </div>
          )
        )}

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger Button (Pilar 1 do Manifesto Linear/Raycast) */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
          }}
          className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-all shadow-2xs font-medium"
          title="Abrir Command Palette (Ctrl+K / Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Comandos</span>
          <kbd className="px-1.5 py-0.2 rounded bg-background border border-border text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-2xs"
          title={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        <div className="text-right hidden sm:block pl-1">
          <p className="text-xs font-semibold leading-tight text-foreground">{user?.nome}</p>
          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
            {user?.role || "Operador"}
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-muted/80 border border-border flex items-center justify-center text-xs font-bold text-foreground">
          {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
        </div>

        <button
          onClick={signOut}
          className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-0.5"
          title="Encerrar Sessão"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
