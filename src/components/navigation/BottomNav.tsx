import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  Building2,
} from "lucide-react";

export function BottomNav() {
  const location = useLocation();

  const isPublicRoute =
    location.pathname === "/login" ||
    location.pathname.startsWith("/conectar");

  if (isPublicRoute) return null;

  const navItems = [
    { label: "Visão Geral", href: "/", icon: LayoutDashboard },
    { label: "Relatórios", href: "/criativos", icon: TrendingUp },
    { label: "Leads", href: "/contatos", icon: MessageSquare },
    { label: "Lojas", href: "/lojas", icon: Building2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/80 px-2 py-1.5 flex items-center justify-around shadow-2xl pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-all">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;

        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 min-h-[48px] touch-manipulation active:scale-95 ${
              isActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary" : ""}`}>
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
