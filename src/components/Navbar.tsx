import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Building2, LayoutDashboard, MessageSquare, Sparkles, Shield } from "lucide-react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isAdmin = (user?.role || "admin").toLowerCase() === "admin";

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Criativos & SLA", href: "/criativos", icon: Sparkles },
    { label: "Lojas", href: "/lojas", icon: Building2 },
    { label: "Contatos", href: "/contatos", icon: MessageSquare },
    ...(isAdmin ? [{ label: "Usuários", href: "/usuarios", icon: Shield }] : []),
  ];

  return (
    <header className="h-16 border-b border-border bg-card/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm tracking-tight shadow-sm">
            AW
          </div>
          <div>
            <h1 className="text-sm font-bold font-display leading-tight text-foreground flex items-center gap-2">
              AdsWhats Monitor
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                PRO
              </span>
            </h1>
            <span className="text-[11px] text-muted-foreground block -mt-0.5">Torre de Gestão Multi-Lojas</span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold leading-tight text-foreground">{user?.nome}</p>
          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">{user?.role || "Operador"}</span>
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Encerrar Sessão"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
