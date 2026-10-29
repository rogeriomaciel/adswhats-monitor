import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContatos, getLojas } from "@/lib/api";
import { Pessoa } from "@/types/contato";
import { Navbar } from "@/components/Navbar";
import { ChatModal } from "@/components/chat/ChatModal";
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
} from "lucide-react";

function formatPhone(phone: string) {
  const p = String(phone).replace(/\D/g, "");
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


export default function ContatosPage() {
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const [selectedOrigem, setSelectedOrigem] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [activeChatContact, setActiveChatContact] = useState<Pessoa | null>(null);

  // Debounce de 400ms para evitar disparar 1 requisição ao n8n por tecla digitada
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

  const totalContatos = contatos.length;
  const leadsAds = contatos.filter((c) => c.origem === "instagram_ads" || c.origem === "facebook_ads").length;
  const leadsOrganicos = contatos.filter((c) => c.origem === "organico" || !c.origem).length;
  const totalMensagens = contatos.reduce((acc, c) => acc + (c.total_mensagens || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Monitoramento de Contatos & Leads
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acompanhe contatos interceptados via WhatsApp, atribuição de anúncios e conversas em tempo real
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm self-start sm:self-auto flex items-center gap-2 text-xs"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="sm:hidden">Atualizar</span>
          </button>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total de Contatos</p>
              <h3 className="text-lg font-bold font-display">{totalContatos}</h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Leads de Anúncios</p>
              <h3 className="text-lg font-bold font-display">{leadsAds}</h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Leads Orgânicos</p>
              <h3 className="text-lg font-bold font-display">{leadsOrganicos}</h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Mensagens Gravadas</p>
              <h3 className="text-lg font-bold font-display">{totalMensagens}</h3>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou WhatsApp..."
                className="w-full pl-10 pr-3.5 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Store Filter */}
            <div className="relative w-full sm:w-56 flex items-center gap-2">
              <Store className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
              <select
                value={selectedLojaId ?? ""}
                onChange={(e) => setSelectedLojaId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Todas as Lojas</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Origin Filter */}
            <div className="relative w-full sm:w-48 flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
              <select
                value={selectedOrigem}
                onChange={(e) => setSelectedOrigem(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="todos">Todas as Origens</option>
                <option value="instagram_ads">Instagram Ads</option>
                <option value="facebook_ads">Facebook Ads</option>
                <option value="organico">Orgânico</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Carregando contatos...</p>
          </div>
        ) : contatos.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card border border-border text-center space-y-3">
            <Users className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">Nenhum contato encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Quando os clientes enviarem mensagens pelo WhatsApp das lojas, os contatos e conversas aparecerão aqui automaticamente.
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Contato / Cliente</th>
                    <th className="py-3 px-4">Loja</th>
                    <th className="py-3 px-4">Origem / Anúncio</th>
                    <th className="py-3 px-4">Última Mensagem</th>
                    <th className="py-3 px-4 text-center">Mensagens</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contatos.map((contato) => {
                    const isInstagram = contato.origem === "instagram_ads";
                    const isFacebook = contato.origem === "facebook_ads";
                    const isAd = isInstagram || isFacebook;

                    return (
                      <tr
                        key={contato.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* Contato info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
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
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted text-[11px] text-foreground font-medium">
                            <Store className="w-3 h-3 text-muted-foreground" />
                            {contato.loja_nome || `Loja #${contato.loja_id}`}
                          </span>
                        </td>

                        {/* Origem / Criativo */}
                        <td className="py-3 px-4">
                          {isAd ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                                <Sparkles className="w-2.5 h-2.5" />
                                {contato.ultimo_criativo_canal?.toUpperCase() || (isInstagram ? "INSTAGRAM" : "FACEBOOK")} ADS
                              </span>
                              {(contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo) && (
                                <p className="text-[10px] font-medium text-foreground truncate max-w-[190px]" title={contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo}>
                                  {contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo}
                                </p>
                              )}
                              {contato.ultimo_criativo_tema && (
                                <p className="text-[9px] text-muted-foreground truncate max-w-[190px]">
                                  {contato.ultimo_criativo_tema}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              Orgânico
                            </span>
                          )}
                        </td>

                        {/* Última mensagem & SLA */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="space-y-0.5">
                            <p className="text-foreground truncate text-xs">
                              {contato.ultima_mensagem || "Nenhuma mensagem gravada"}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {formatDateRelative(contato.last_message_at)}
                              </span>
                              {contato.tempo_medio_resposta_segundos && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                                  SLA: {formatSLA(contato.tempo_medio_resposta_segundos)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total mensagens */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted">
                            {contato.total_mensagens || 0}
                          </span>
                        </td>

                        {/* Ação */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setActiveChatContact(contato)}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Ver Chat
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {contatos.map((contato) => {
              const isInstagram = contato.origem === "instagram_ads";
              const isFacebook = contato.origem === "facebook_ads";
              const isAd = isInstagram || isFacebook;

              return (
                <div
                  key={contato.id}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top: Contact + Store */}
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

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-[10px] text-foreground font-medium shrink-0">
                        <Store className="w-3 h-3 text-muted-foreground" />
                        {contato.loja_nome || `Loja #${contato.loja_id}`}
                      </span>
                    </div>

                    {/* Origin / Ad Creative */}
                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {isAd ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                            <Sparkles className="w-2.5 h-2.5" />
                            {contato.ultimo_criativo_canal?.toUpperCase() || (isInstagram ? "INSTAGRAM" : "FACEBOOK")} ADS
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                            Orgânico
                          </span>
                        )}

                        {contato.tempo_medio_resposta_segundos && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-semibold">
                            SLA: {formatSLA(contato.tempo_medio_resposta_segundos)}
                          </span>
                        )}
                      </div>

                      {isAd && (contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo) && (
                        <p className="text-[11px] font-medium text-foreground truncate" title={contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo}>
                          {contato.ultimo_criativo_titulo || contato.metadata_json?.adTitulo}
                        </p>
                      )}

                      {/* Last Message Box */}
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                        <p className="text-xs text-foreground line-clamp-2">
                          {contato.ultima_mensagem || "Nenhuma mensagem gravada"}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDateRelative(contato.last_message_at)}
                          </span>
                          <span className="font-mono font-semibold">
                            {contato.total_mensagens || 0} msg(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-end">
                    <button
                      onClick={() => setActiveChatContact(contato)}
                      className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Ver Histórico de Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Chat History Viewer Modal — montado apenas quando há um chat aberto */}
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
