import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  TrendingUp,
  Building2,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Sun,
  Moon,
  ArrowRight,
  Command,
  X,
} from "lucide-react";

interface CommandItem {
  id: string;
  category: "Navegação" | "Fila de Atendimento" | "Sistema";
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Escuta de teclado global Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Foca no input quando abre
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("adswhats_theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("adswhats_theme", "dark");
    }
    setIsOpen(false);
  };

  const commands: CommandItem[] = [
    // Navegação
    {
      id: "nav-dashboard",
      category: "Navegação",
      label: "Ir para Visão Geral",
      shortcut: "G D",
      icon: LayoutDashboard,
      perform: () => {
        navigate("/");
        setIsOpen(false);
      },
    },
    {
      id: "nav-reports",
      category: "Navegação",
      label: "Ir para Relatórios & SLA de Anúncios",
      shortcut: "G R",
      icon: TrendingUp,
      perform: () => {
        navigate("/criativos");
        setIsOpen(false);
      },
    },
    {
      id: "nav-stores",
      category: "Navegação",
      label: "Ir para Gerenciar Lojas",
      shortcut: "G L",
      icon: Building2,
      perform: () => {
        navigate("/lojas");
        setIsOpen(false);
      },
    },
    {
      id: "nav-contacts",
      category: "Navegação",
      label: "Ir para Fila de Leads & Contatos",
      shortcut: "G C",
      icon: MessageSquare,
      perform: () => {
        navigate("/contatos");
        setIsOpen(false);
      },
    },

    // Fila & Ações Rápidas
    {
      id: "action-unanswered",
      category: "Fila de Atendimento",
      label: "🚨 Filtrar Leads Sem Resposta (Urgente)",
      icon: AlertTriangle,
      perform: () => {
        navigate("/contatos");
        setIsOpen(false);
      },
    },
    {
      id: "action-meta",
      category: "Fila de Atendimento",
      label: "🎯 Ver Leads Originados do Meta Ads",
      icon: Sparkles,
      perform: () => {
        navigate("/contatos");
        setIsOpen(false);
      },
    },
    {
      id: "action-google",
      category: "Fila de Atendimento",
      label: "🔍 Ver Leads Originados do Google Ads",
      icon: Search,
      perform: () => {
        navigate("/contatos");
        setIsOpen(false);
      },
    },

    // Sistema
    {
      id: "sys-theme",
      category: "Sistema",
      label: "Alternar Tema Escuro / Claro",
      shortcut: "T",
      icon: Sun,
      perform: toggleTheme,
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].perform();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 sm:pt-28 p-4 animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-card border border-border/90 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Command Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite um comando, tela ou filtro rápido..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Nenhum comando encontrado para &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.perform()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-foreground hover:bg-muted/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    <span className="truncate">{cmd.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <span className={`text-[10px] font-mono hidden sm:inline ${
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground/80"
                      }`}>
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ navegar</span>
            <span>↵ selecionar</span>
            <span>esc fechar</span>
          </div>
          <span>AdsWhats Speed-Nav</span>
        </div>
      </div>
    </div>
  );
}

