import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}

/**
 * Isotipo / Logomarca Oficial AdsWhats
 * Símbolo: Balão WhatsApp com Raio de Conversão de Anúncios e Gradiente Esmeralda -> Ciano -> Azul
 */
export function LogoSymbol({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/15 ${sizeMap[size]} ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform group-hover:scale-105 duration-300"
      >
        <defs>
          <linearGradient id="aw-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10B981" />
            <stop offset="50%" stop-color="#06B6D4" />
            <stop offset="100%" stop-color="#3B82F6" />
          </linearGradient>
          <linearGradient id="aw-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="100%" stop-color="#E0F2FE" />
          </linearGradient>
        </defs>

        {/* Balão WhatsApp Base */}
        <path
          d="M32 6C17.64 6 6 17.64 6 32c0 5.12 1.48 9.9 4.04 13.92L6.8 55.48a1.5 1.5 0 0 0 1.72 1.72l9.56-3.24C22.1 56.52 26.88 58 32 58c14.36 0 26-11.64 26-26S46.36 6 32 6z"
          fill="url(#aw-brand-grad)"
        />

        {/* Profundidade interna */}
        <circle cx="32" cy="32" r="23" fill="#030712" fillOpacity="0.22" />

        {/* Raio Dinâmico de Tráfego Pago & Conversão Imediata */}
        <path
          d="M35 16L20 34h11l-4 14 17-19H33l4-13z"
          fill="url(#aw-bolt-grad)"
        />
      </svg>
    </div>
  );
}

/**
 * Logotipo Completo (Símbolo + Tipografia de Marca + Badge de Categoria)
 */
export function Logo({ size = "md", showBadge = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <LogoSymbol size={size} />

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold font-display tracking-tight text-foreground text-sm sm:text-base leading-none">
            Ads<span className="text-emerald-500">Whats</span>
          </span>

          {showBadge && (
            <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 tracking-wider">
              MONITOR
            </span>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground font-medium tracking-tight mt-0.5">
          Gestão de Tráfego & Atendimento
        </span>
      </div>
    </div>
  );
}

