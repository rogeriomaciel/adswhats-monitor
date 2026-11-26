import { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface DropdownOption<T = string | number | null> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: string;
}

interface CustomDropdownProps<T = string | number | null> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  dropdownClassName?: string;
  ariaLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

function normalizeText(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CustomDropdown<T = string | number | null>({
  value,
  onChange,
  options,
  placeholder = "Selecionar...",
  icon,
  className = "",
  dropdownClassName = "",
  ariaLabel = "Menu de opções",
  searchable,
  searchPlaceholder = "Digite para buscar...",
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length > 8;

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      if (showSearch) {
        window.setTimeout(() => searchInputRef.current?.focus(), 10);
      }
    } else {
      setSearchTerm("");
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, showSearch]);

  const filteredOptions = useMemo(() => {
    const query = normalizeText(searchTerm.trim());
    if (!query) return options;
    return options.filter((opt) => normalizeText(opt.label).includes(query));
  }, [options, searchTerm]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Botão Gatilho */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted/40 text-foreground text-xs font-semibold shadow-2xs hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Menu Flutuante Estilizado */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 min-w-[240px] w-full rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl text-foreground focus:outline-none animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden ${dropdownClassName}`}
        >
          {showSearch && (
            <div className="p-1.5 border-b border-border/70 bg-muted/30">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-background border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                    title="Limpar busca"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-2.5 py-3 text-center text-xs text-muted-foreground">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {option.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-mono">
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

