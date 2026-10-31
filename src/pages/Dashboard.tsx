import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getLojas, getContatos, getMetricsSLA } from "@/lib/api";
import { useRealtimeNotifications } from "@/lib/pusher";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { ChatModal } from "@/components/chat/ChatModal";
import { Pessoa } from "@/types/contato";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import {
  Building2,
  Users,
  MessageSquare,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Phone,
  Search,
  Zap,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Store,
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

    if (diffMins < 1) return "Agora há pouco";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return isoString;
  }
}

function formatSLA(segundos?: number | null) {
  if (segundos === null || segundos === undefined || segundos <= 0) return "0s";
  if (segundos < 60) return `${segundos}s`;
  const mins = Math.floor(segundos / 60);
  const remSec = segundos % 60;
  if (mins < 60) return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMin = mins % 60;
  return `${hours}h ${remMin}m`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const [activeChatContact, setActiveChatContact] = useState<Pessoa | null>(null);

  // Escuta notificações em tempo real
  useRealtimeNotifications(selectedLojaId);

  // Consulta de Lojas
  const {
    data: lojas = [],
    isLoading: isLoadingLojas,
    isRefetching: isRefetchingLojas,
    refetch: refetchLojas,
  } = useQuery({
    queryKey: ["lojas"],
    queryFn: getLojas,
  });

  // Consulta das Métricas Globais de SLA (resumo dos últimos 30 dias)
  const { data: metricsData } = useQuery({
    queryKey: ["metrics-sla-summary", selectedLojaId],
    queryFn: () => getMetricsSLA({ loja_id: selectedLojaId, dias: 30 }),
  });

  // Feed ao vivo de leads que precisam de atenção
  const {
    data: contatos = [],
    isLoading: isLoadingContatos,
    refetch: refetchContatos,
  } = useQuery({
    queryKey: ["contatos-dashboard", selectedLojaId],
    queryFn: () => getContatos({ loja_id: selectedLojaId, limit: 10 }),
  });

  const totalLojas = lojas.length;
  const lojasAtivas = lojas.filter((l) => l.ativo).length;
  const totalContatos = lojas.reduce((acc, l) => acc + (l.total_contatos || 0), 0);
  const slaMedio = metricsData?.resumo?.tempo_medio_segundos || 0;
  const leadsSemResposta = metricsData?.resumo?.total_pendentes || 0;

  const handleRefreshAll = () => {
    refetchLojas();
    refetchContatos();
  };

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 lg:space-y-8 pb-24 md:pb-8">
        {/* Header Limpo e Respirável */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-foreground">
              Visão Geral
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Acompanhamento central de atendimento e conversão de tráfego pago
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Seletor de Loja Estilizado & Confiável */}
            <CustomDropdown
              value={selectedLojaId}
              onChange={setSelectedLojaId}
              options={lojaOptions}
              icon={<Store className="w-3.5 h-3.5" />}
              className="w-48 sm:w-56"
              ariaLabel="Filtrar por loja"
            />

            <button
              onClick={handleRefreshAll}
              disabled={isRefetchingLojas}
              className="p-2 rounded-xl border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetchingLojas ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 4 KPIs Essenciais com Design Respirável */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Lojas Conectadas */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Lojas Monitoradas</span>
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                {totalLojas}
              </h3>
              <p className="text-[11px] text-emerald-500 font-bold mt-1">
                {lojasAtivas} de {totalLojas} instâncias ativas
              </p>
            </div>
          </div>

          {/* KPI 2: Total de Leads Capturados */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Leads Capturados</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                {totalContatos}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                Registrados via WhatsApp
              </p>
            </div>
          </div>

          {/* KPI 3: Tempo Médio de Resposta (SLA) */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Tempo de Resposta (SLA)</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                {formatSLA(slaMedio)}
              </h3>
              <p className={`text-[11px] font-bold mt-1 ${slaMedio <= 300 ? "text-emerald-500" : "text-amber-500"}`}>
                {slaMedio <= 300 ? "⚡ Dentro da meta (< 5 min)" : "⚠️ Atenção: Acima da meta"}
              </p>
            </div>
          </div>

          {/* KPI 4: Leads Sem Resposta (Urgência) */}
          <Link
            to={
              selectedLojaId
                ? `/contatos?filter=sem_resposta&loja_id=${selectedLojaId}`
                : "/contatos?filter=sem_resposta"
            }
            className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2 hover:border-rose-500/40 transition-all group block"
            title="Clique para abrir a fila de leads aguardando resposta"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Aguardando Retorno</span>
              <AlertTriangle className={`w-4 h-4 ${leadsSemResposta > 0 ? "text-rose-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <h3 className={`text-3xl font-extrabold font-display tracking-tight ${leadsSemResposta > 0 ? "text-rose-500" : "text-foreground"}`}>
                {leadsSemResposta}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                <span>{leadsSemResposta > 0 ? "Requer atendimento imediato" : "Fila zerada"}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </Link>
        </div>

        {/* Bloco Operacional: Fila de Leads Recentes + Atalhos Estratégicos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Principal: Fila Viva de Atendimento (8 colunas) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Fila de Atendimento em Tempo Real
                </h2>
                <p className="text-xs text-muted-foreground">
                  Clientes mais recentes interceptados das campanhas de anúncios
                </p>
              </div>

              <Link
                to="/contatos"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Ver fila completa
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoadingContatos ? (
              <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border/80 rounded-2xl">
                Carregando fila ao vivo...
              </div>
            ) : contatos.length === 0 ? (
              <div className="p-12 rounded-2xl bg-card border border-border/80 text-center space-y-2">
                <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                <h3 className="text-sm font-bold text-foreground">Nenhum lead aguardando no momento</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Assim que os clientes clicarem nos anúncios e chamarem no WhatsApp, eles aparecerão aqui instantaneamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {contatos.slice(0, 7).map((contato) => {
                  const isGoogle =
                    contato.origem === "google_ads" ||
                    contato.ultimo_criativo_canal === "google" ||
                    contato.metadata_json?.canal === "google";
                  const isAd =
                    contato.origem === "instagram_ads" ||
                    contato.origem === "facebook_ads" ||
                    isGoogle ||
                    Boolean(contato.metadata_json?.isAd);

                  // Determina se o lead está realmente aguardando retorno da loja
                  // Se a última mensagem foi 'outbound', a loja já respondeu o cliente!
                  // Só é 'aguardando' se a última mensagem partiu do cliente ('inbound')
                  const isAguardandoResposta = contato.ultima_direcao === "inbound";
                  const tempoMedio = contato.tempo_medio_resposta_segundos;

                  const matchedLoja = lojas.find(
                    (l) => String(l.id) === String(contato.loja_id)
                  );
                  const lojaNome =
                    contato.loja_nome ||
                    matchedLoja?.nome ||
                    (contato.loja_id ? `Loja #${contato.loja_id}` : "Loja");

                  return (
                    <div
                      key={contato.id}
                      onClick={() => setActiveChatContact(contato)}
                      className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 cursor-pointer shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-4 group"
                    >
                      {/* Avatar & Nome */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {contato.nome?.substring(0, 2).toUpperCase() || "WA"}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {contato.nome || "Contato WhatsApp"}
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatPhone(contato.whatsapp)}
                            </span>

                            {/* Badge da Loja destacado junto ao contato */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] border border-emerald-500/20 shadow-2xs shrink-0">
                              <Store className="w-2.5 h-2.5" />
                              <span>{lojaNome}</span>
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                            {contato.ultima_mensagem || "Iniciou contato via WhatsApp"}
                          </p>
                        </div>
                      </div>

                      {/* Badges de Origem & SLA */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {isAd && (
                          <span
                            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isGoogle
                                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                            }`}
                          >
                            {isGoogle ? <Search className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                            {isGoogle ? "Google Ads" : "Meta Ads"}
                          </span>
                        )}

                        {isAguardandoResposta ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/25 text-[10px] font-bold animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Aguardando Resposta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {tempoMedio && tempoMedio > 0 ? `SLA: ${formatSLA(tempoMedio)}` : "Respondido"}
                          </span>
                        )}

                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDateRelative(contato.last_message_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna Lateral: Resumo das Lojas e Ações Rápidas (4 colunas) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Atalho para Relatórios de Criativos */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/10 via-card to-card border border-pink-500/20 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-pink-500 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Inteligência de Tráfego</span>
              </div>
              <h3 className="text-sm font-bold font-display text-foreground">
                Quais anúncios trazem mais retorno?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acesse o raio-x completo de criativos do Meta/Google Ads, divisão de canais e ranking de atendimento das lojas.
              </p>
              <Link
                to="/criativos"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Ver Relatório de Criativos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Status das Lojas Conectadas */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-foreground">
                  Status das Lojas ({lojas.length})
                </h3>
                <Link to="/lojas" className="text-[11px] font-bold text-primary hover:underline">
                  Gerenciar
                </Link>
              </div>

              <div className="space-y-2">
                {lojas.slice(0, 4).map((loja) => (
                  <div
                    key={loja.id}
                    className="p-2.5 rounded-xl bg-background border border-border/60 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{loja.nome}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {loja.whatsapp_loja ? formatPhone(loja.whatsapp_loja) : "Aguardando conexão"}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                        loja.ativo
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {loja.ativo ? "Online" : "Offline"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Slide-over Sheet Drawer (Abre ao clicar no lead) */}
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
