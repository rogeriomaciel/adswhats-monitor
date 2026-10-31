import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getContatos, getLojas } from "@/lib/api";
import { useRealtimeNotifications } from "@/lib/pusher";
import { Pessoa } from "@/types/contato";
import { Navbar } from "@/components/Navbar";
import { ChatModal } from "@/components/chat/ChatModal";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import {
  Users,
  Search,
  Store,
  Sparkles,
  Phone,
  MessageSquare,
  RefreshCw,
  Loader2,
  Calendar,
  Filter,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
  Radio,
} from "lucide-react";

function formatPhone(phone: string) {
  const p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("55") && (p.length === 12 || p.length === 13)) {
    const ddd = p.substring(2, 4);
    const prefix = p.length === 13 ? p.substring(4, 9) : p.substring(4, 8);
    const suffix = p.length === 13 ? p.substring(9) : p.substring(8);
    return `+55 (${ddd}) ${prefix}-${suffix}`;
  }
  return phone;
}

function formatDateRelative(isoString?: string) {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return "Agora há pouco";
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return isoString;
  }
}

function formatSLA(segundos?: number | null) {
  if (segundos === null || segundos === undefined || segundos <= 0) return null;
  if (segundos < 60) return `${segundos}s`;
  const mins = Math.floor(segundos / 60);
  const remSec = segundos % 60;
  if (mins < 60) return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMin = mins % 60;
  return `${hours}h ${remMin}m`;
}

type QuickFilter = "todos" | "sem_resposta" | "sla_estourado" | "meta_ads" | "google_ads";

export default function ContatosPage() {
  const [searchParams] = useSearchParams();

  const initialFilter = (searchParams.get("filter") as QuickFilter) || "todos";
  const initialLojaId = searchParams.get("loja_id") ? Number(searchParams.get("loja_id")) : null;

  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(initialLojaId);
  const [selectedOrigem, setSelectedOrigem] = useState<string>("todos");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(initialFilter);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [activeChatContact, setActiveChatContact] = useState<Pessoa | null>(null);

  // Sincroniza com parâmetros de URL (ex: ?filter=sem_resposta&loja_id=2)
  useEffect(() => {
    const filterParam = searchParams.get("filter") as QuickFilter | null;
    if (filterParam && ["todos", "sem_resposta", "sla_estourado", "meta_ads", "google_ads"].includes(filterParam)) {
      setQuickFilter(filterParam);
    }
    const lojaParam = searchParams.get("loja_id");
    if (lojaParam !== null) {
      setSelectedLojaId(lojaParam ? Number(lojaParam) : null);
    }
  }, [searchParams]);

  // Escuta notificações em tempo real via Pusher
  useRealtimeNotifications(selectedLojaId, activeChatContact?.id);

  // Debounce de 400ms para busca fluida
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // Buscar lista de lojas para o filtro
  const { data: lojas = [] } = useQuery({
    queryKey: ["lojas"],
    queryFn: getLojas,
  });

  // Buscar contatos
  const {
    data: contatos = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["contatos", selectedLojaId, selectedOrigem, debouncedSearch],
    queryFn: () =>
      getContatos({
        loja_id: selectedLojaId,
        origem: selectedOrigem,
        search: debouncedSearch,
      }),
  });

  // Aplicação do filtro rápido de urgência (SLA / Origem)
  const filteredContatos = contatos.filter((c) => {
    if (quickFilter === "sem_resposta") {
      return c.ultima_direcao === "inbound";
    }
    if (quickFilter === "sla_estourado") {
      const waitTimeExceeded =
        c.ultima_direcao === "inbound" &&
        c.last_message_at &&
        Date.now() - new Date(c.last_message_at).getTime() > 15 * 60 * 1000;
      return waitTimeExceeded || Boolean(c.tempo_medio_resposta_segundos && c.tempo_medio_resposta_segundos > 900);
    }
    if (quickFilter === "meta_ads") {
      return c.origem === "instagram_ads" || c.origem === "facebook_ads" || Boolean(c.metadata_json?.isAd && c.metadata_json?.canal !== "google");
    }
    if (quickFilter === "google_ads") {
      return c.origem === "google_ads" || c.ultimo_criativo_canal === "google" || c.metadata_json?.canal === "google";
    }
    return true;
  });

  const totalContatos = contatos.length;
  const leadsAds = contatos.filter(
    (c) =>
      c.origem === "instagram_ads" ||
      c.origem === "facebook_ads" ||
      c.origem === "google_ads" ||
      Boolean(c.metadata_json?.isAd)
  ).length;
  // Sem resposta = cliente mandou mensagem e a loja ainda não respondeu (inbound)
  const semRespostaCount = contatos.filter((c) => c.ultima_direcao === "inbound").length;
  const slaCriticoCount = contatos.filter(
    (c) =>
      (c.ultima_direcao === "inbound" &&
        c.last_message_at &&
        Date.now() - new Date(c.last_message_at).getTime() > 15 * 60 * 1000) ||
      Boolean(c.tempo_medio_resposta_segundos && c.tempo_medio_resposta_segundos > 900)
  ).length;

  const lojaOptions = useMemo<DropdownOption<number | null>[]>(() => {
    return [
      { value: null, label: "Todas as Lojas" },
      ...lojas.map((l) => ({
        value: l.id,
        label: l.nome,
        badge: l.ativo ? "Online" : "Pausada",
      })),
    ];
  }, [lojas]);

  const origemOptions: DropdownOption<string>[] = [
    { value: "todos", label: "Todas as Origens" },
    { value: "google_ads", label: "Google Ads" },
    { value: "instagram_ads", label: "Instagram Ads" },
    { value: "facebook_ads", label: "Facebook Ads" },
    { value: "organico", label: "Orgânico" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-8">
        {/* Header Telemetry */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Monitoramento de Leads & Contatos
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                Fila ao Vivo
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Audite tempo de resposta (SLA), atribuição de anúncios e conversas interceptadas das lojas
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs flex items-center gap-2 text-xs font-medium"
              title="Sincronizar contatos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total de Leads</p>
              <h3 className="text-xl font-bold font-display tracking-tight mt-0.5">{totalContatos}</h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Leads de Anúncios</p>
              <h3 className="text-xl font-bold font-display tracking-tight mt-0.5">{leadsAds}</h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Sem Resposta</p>
              <h3 className="text-xl font-bold font-display tracking-tight mt-0.5 text-amber-600 dark:text-amber-400">
                {semRespostaCount}
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">SLA Estourado (&gt;15m)</p>
              <h3 className="text-xl font-bold font-display tracking-tight mt-0.5 text-rose-600 dark:text-rose-400">
                {slaCriticoCount}
              </h3>
            </div>
          </div>
        </div>

        {/* Quick Urgency Chips Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-muted-foreground font-semibold shrink-0 mr-1">Filtro rápido:</span>

          <button
            type="button"
            onClick={() => setQuickFilter("todos")}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              quickFilter === "todos"
                ? "bg-foreground text-background shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({totalContatos})
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter("sem_resposta")}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
              quickFilter === "sem_resposta"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-amber-600"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Sem Resposta ({semRespostaCount})
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter("sla_estourado")}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
              quickFilter === "sla_estourado"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-rose-600"
            }`}
          >
            <Clock className="w-3 h-3" />
            SLA Estourado ({slaCriticoCount})
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter("meta_ads")}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
              quickFilter === "meta_ads"
                ? "bg-pink-600 text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-pink-600"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Meta Ads
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter("google_ads")}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
              quickFilter === "google_ads"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-blue-600"
            }`}
          >
            <Search className="w-3 h-3" />
            Google Ads
          </button>
        </div>

        {/* Detailed Filters & View Mode */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou WhatsApp..."
                className="w-full pl-10 pr-3.5 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Store Filter */}
            <div className="w-full sm:w-56">
              <CustomDropdown
                value={selectedLojaId}
                onChange={setSelectedLojaId}
                options={lojaOptions}
                icon={<Store className="w-3.5 h-3.5" />}
                ariaLabel="Filtrar por loja"
              />
            </div>

            {/* Origin Filter */}
            <div className="w-full sm:w-48">
              <CustomDropdown
                value={selectedOrigem}
                onChange={setSelectedOrigem}
                options={origemOptions}
                icon={<Filter className="w-3.5 h-3.5" />}
                ariaLabel="Filtrar por canal de origem"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted/60 border border-border rounded-xl p-1 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "cards"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* Contacts Table / Cards */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-card border border-border/80 rounded-2xl">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Carregando leads das lojas...</p>
          </div>
        ) : filteredContatos.length === 0 ? (
          <div className="p-16 rounded-2xl bg-card border border-border/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Nenhum contato encontrado para o filtro selecionado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Tente redefinir o filtro de origem ou a busca por nome/WhatsApp para visualizar os dados.
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Lead / Contato</th>
                    <th className="py-3 px-4">Loja</th>
                    <th className="py-3 px-4">Origem / Anúncio</th>
                    <th className="py-3 px-4">Última Mensagem & SLA</th>
                    <th className="py-3 px-4 text-center">Mensagens</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredContatos.map((contato) => {
                    const isGoogle =
                      contato.origem === "google_ads" ||
                      contato.ultimo_criativo_canal === "google" ||
                      contato.metadata_json?.canal === "google";
                    const isInstagram = contato.origem === "instagram_ads";
                    const isFacebook = contato.origem === "facebook_ads";
                    const isAd = isGoogle || isInstagram || isFacebook || Boolean(contato.metadata_json?.isAd);

                    const isAguardandoResposta = contato.ultima_direcao === "inbound";
                    const tempoResposta = contato.tempo_medio_resposta_segundos;

                    return (
                      <tr
                        key={contato.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* Contato info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {contato.nome?.substring(0, 2).toUpperCase() || "WA"}
                            </div>
                            <div>
                              <p className="font-bold text-foreground leading-tight">
                                {contato.nome || "Contato WhatsApp"}
                              </p>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {formatPhone(contato.whatsapp)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Loja */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted text-[11px] text-foreground font-medium border border-border/50">
                            <Store className="w-3 h-3 text-muted-foreground" />
                            {contato.loja_nome || `Loja #${contato.loja_id}`}
                          </span>
                        </td>

                        {/* Origem / Criativo */}
                        <td className="py-3 px-4">
                          {isAd ? (
                            <div className="space-y-1">
                              {isGoogle ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                  <Search className="w-2.5 h-2.5" />
                                  GOOGLE ADS
                                </span>
                              ) : isFacebook ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-600/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  FACEBOOK ADS
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  INSTAGRAM ADS
                                </span>
                              )}
                              {(contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo) && (
                                <p
                                  className="text-[10px] font-medium text-foreground truncate max-w-[200px]"
                                  title={contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo}
                                >
                                  {contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium">Orgânico</span>
                          )}
                        </td>

                        {/* Última mensagem & SLA */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="space-y-1">
                            <p className="text-foreground truncate text-xs font-normal">
                              {contato.ultima_mensagem || "Nenhuma mensagem gravada"}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1 font-mono">
                                <Calendar className="w-2.5 h-2.5" />
                                {formatDateRelative(contato.last_message_at)}
                              </span>

                              {isAguardandoResposta ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px] animate-pulse">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Aguardando Resposta
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-mono font-medium text-[10px] ${
                                    tempoResposta && tempoResposta <= 300
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                      : tempoResposta && tempoResposta <= 900
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                      : tempoResposta
                                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  }`}
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  {tempoResposta && tempoResposta > 0
                                    ? `SLA: ${formatSLA(tempoResposta)}`
                                    : "Respondido"}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total mensagens */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-muted/80 border border-border/50">
                            {contato.total_mensagens || 0}
                          </span>
                        </td>

                        {/* Ação */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setActiveChatContact(contato)}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs group-hover:scale-102"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Auditar Chat</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContatos.map((contato) => {
              const isGoogle =
                contato.origem === "google_ads" ||
                contato.ultimo_criativo_canal === "google" ||
                contato.metadata_json?.canal === "google";
              const isInstagram = contato.origem === "instagram_ads";
              const isFacebook = contato.origem === "facebook_ads";
              const isAd = isGoogle || isInstagram || isFacebook || Boolean(contato.metadata_json?.isAd);

              return (
                <div
                  key={contato.id}
                  className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {contato.nome?.substring(0, 2).toUpperCase() || "WA"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-foreground font-display truncate">
                            {contato.nome || "Contato WhatsApp"}
                          </h3>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            {formatPhone(contato.whatsapp)}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-[10px] text-foreground font-medium shrink-0 border border-border/50">
                        <Store className="w-3 h-3 text-muted-foreground" />
                        {contato.loja_nome || `Loja #${contato.loja_id}`}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {isAd ? (
                          isGoogle ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                              <Search className="w-2.5 h-2.5" />
                              GOOGLE ADS
                            </span>
                          ) : isFacebook ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-600/20">
                              <Sparkles className="w-2.5 h-2.5" />
                              FACEBOOK ADS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                              <Sparkles className="w-2.5 h-2.5" />
                              INSTAGRAM ADS
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                            Orgânico
                          </span>
                        )}

                        {contato.ultima_direcao === "inbound" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px] animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Aguardando Resposta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-medium border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {contato.tempo_medio_resposta_segundos && contato.tempo_medio_resposta_segundos > 0
                              ? `SLA: ${formatSLA(contato.tempo_medio_resposta_segundos)}`
                              : "Respondido"}
                          </span>
                        )}
                      </div>

                      {/* Last Message Box */}
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                        <p className="text-xs text-foreground line-clamp-2">
                          {contato.ultima_mensagem || "Nenhuma mensagem gravada"}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDateRelative(contato.last_message_at)}
                          </span>
                          <span className="font-semibold">
                            {contato.total_mensagens || 0} msg(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-end">
                    <button
                      onClick={() => setActiveChatContact(contato)}
                      className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Auditar Chat Completo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Chat History Viewer Modal */}
      {activeChatContact && (
        <ChatModal
          isOpen={true}
          onClose={() => setActiveChatContact(null)}
          contato={activeChatContact}
        />
      )}
    </div>
  );
}
