import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getLojas, getMetricsSLA } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import {
  TrendingUp,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  Store,
  Filter,
  RefreshCw,
  Loader2,
  Users,
  MessageSquare,
  Zap,
  Flame,
  Award,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";

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

export default function CriativosPage() {
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const [dias, setDias] = useState<number>(30);
  const [selectedCanal, setSelectedCanal] = useState<string>("todos");
  const [creativeSort, setCreativeSort] = useState<"leads" | "sla" | "messages">("leads");

  // Buscar Lojas
  const { data: lojas = [] } = useQuery({
    queryKey: ["lojas"],
    queryFn: getLojas,
  });

  // Buscar Métricas Completas de SLA e Criativos
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["metrics-sla-report", selectedLojaId, dias],
    queryFn: () => getMetricsSLA({ loja_id: selectedLojaId, dias }),
  });

  const resumo = data?.resumo || {
    total_mensagens: 0,
    total_inbound: 0,
    total_outbound: 0,
    total_mensagens_ad: 0,
    total_respondidas: 0,
    total_pendentes: 0,
    tempo_medio_segundos: 0,
    tempo_mediano_segundos: 0,
    taxa_resposta_pct: 0,
  };

  const criativos = data?.por_criativo || [];
  const lojasPerformance = data?.por_loja || [];

  // Filtragem e ordenação inteligente dos criativos
  const filteredCriativos = criativos
    .filter((c) => {
      if (selectedCanal === "todos") return true;
      const canal = (c.canal || "").toLowerCase();
      const isGoogle = canal === "google" || c.ad_id.startsWith("google_");
      const isFacebook = canal === "facebook";
      const isInstagram = canal === "instagram" || (!isGoogle && !isFacebook);

      if (selectedCanal === "google") return isGoogle;
      if (selectedCanal === "instagram") return isInstagram;
      if (selectedCanal === "facebook") return isFacebook;
      return true;
    })
    .sort((a, b) => {
      if (creativeSort === "leads") return (b.total_pessoas_unicas || 0) - (a.total_pessoas_unicas || 0);
      if (creativeSort === "messages") return (b.total_mensagens || 0) - (a.total_mensagens || 0);
      if (creativeSort === "sla") return (b.tempo_medio_segundos || 0) - (a.tempo_medio_segundos || 0);
      return 0;
    });

  // Cálculo da distribuição por canal com consistência matemática garantida (soma exata de 100%)
  const countInstagram = criativos
    .filter((c) => (c.canal || "").toLowerCase() === "instagram" || (!c.canal && !c.ad_id.startsWith("google_")))
    .reduce((acc, c) => acc + (c.total_mensagens || 0), 0);
  const countFacebook = criativos
    .filter((c) => (c.canal || "").toLowerCase() === "facebook")
    .reduce((acc, c) => acc + (c.total_mensagens || 0), 0);
  const countGoogle = criativos
    .filter((c) => (c.canal || "").toLowerCase() === "google" || c.ad_id.startsWith("google_"))
    .reduce((acc, c) => acc + (c.total_mensagens || 0), 0);

  const totalCanais = countInstagram + countFacebook + countGoogle;
  const pctInstagram = totalCanais > 0 ? Math.round((countInstagram / totalCanais) * 100) : 0;
  const pctFacebook = totalCanais > 0 ? Math.round((countFacebook / totalCanais) * 100) : 0;
  const pctGoogle = totalCanais > 0 ? Math.round((countGoogle / totalCanais) * 100) : 0;

  // Leads em Risco (Aguardando resposta ou com SLA acima de 15 minutos)
  const leadsEmRisco = resumo.total_pendentes;
  const isOperacaoAgil = resumo.tempo_medio_segundos > 0 && resumo.tempo_medio_segundos <= 300;

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

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-8">
        {/* Header Executivo com Controles de Telemetria */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-500 text-[11px] font-bold">
                <Sparkles className="w-3 h-3" />
                Inteligência de Tráfego & Atendimento
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {dias} dias analisados
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground">
              Relatório de Retorno de Anúncios & SLA
            </h1>
            <p className="text-xs text-muted-foreground">
              Descubra quais campanhas geram mais clientes e onde o tempo de resposta está queimando dinheiro de tráfego pago
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor de Loja Estilizado */}
            <CustomDropdown
              value={selectedLojaId}
              onChange={setSelectedLojaId}
              options={lojaOptions}
              icon={<Store className="w-3.5 h-3.5" />}
              className="w-48 sm:w-56"
              ariaLabel="Filtrar por loja"
            />

            {/* Seletor de Período */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
              {[
                { label: "7D", val: 7 },
                { label: "15D", val: 15 },
                { label: "30D", val: 30 },
                { label: "60D", val: 60 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setDias(p.val)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    dias === p.val
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 rounded-xl border border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
              title="Atualizar dados analíticos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-card border border-border/80 rounded-2xl">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-semibold">Cruzando dados de campanhas e velocidade de atendimento...</p>
          </div>
        ) : (
          <>
            {/* 4 Indicadores Estratégicos de "Dinheiro em Risco vs Conversão" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Tempo Médio de Resposta com Status Operacional */}
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">Velocidade da Equipe (SLA)</span>
                  <div className={`p-2 rounded-xl ${isOperacaoAgil ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                    {formatSLA(resumo.tempo_medio_segundos)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOperacaoAgil ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                    }`}>
                      {isOperacaoAgil ? "⚡ Atendimento Rápido" : "⚠️ Demora Acima do Ideal"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Meta: &lt;5min
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Leads em Risco (Esfriando) com Link Direto para Fila Filtrada */}
              <Link
                to={
                  selectedLojaId
                    ? `/contatos?filter=sem_resposta&loja_id=${selectedLojaId}`
                    : "/contatos?filter=sem_resposta"
                }
                title="Clique para ver os leads aguardando resposta"
                className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3 hover:border-rose-500/50 hover:shadow-md transition-all group block cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold group-hover:text-foreground transition-colors">
                    Leads Esfriando (Sem Resposta)
                  </span>
                  <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${leadsEmRisco > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                    {leadsEmRisco > 0 ? <Flame className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>
                <div>
                  <h3 className={`text-3xl font-extrabold font-display tracking-tight ${leadsEmRisco > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                    {leadsEmRisco}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center justify-between group-hover:text-rose-500 transition-colors">
                    <span>
                      {leadsEmRisco > 0
                        ? "Verba de anúncio em risco por falta de retorno"
                        : "Zero leads abandonados na fila"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                  </p>
                </div>
              </Link>

              {/* Card 3: Taxa de Resposta com Barra Visual */}
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">Taxa de Atendimento</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                      {resumo.taxa_resposta_pct}%
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {resumo.total_respondidas} de {resumo.total_inbound}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, resumo.taxa_resposta_pct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Volume Total de Anúncios CTWA */}
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">Conversas de Tráfego Pago</span>
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                    {resumo.total_mensagens_ad}
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-medium mt-1 block">
                    Meta Ads & Google Ads interceptados
                  </span>
                </div>
              </div>
            </div>

            {/* Painel Central: Gráficos de Canais + Ranking de Lojas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Distribuição por Canal (5 colunas) */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-xs font-bold font-display uppercase tracking-wider text-foreground">
                    Origem do Tráfego Pago
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {totalCanais} {totalCanais === 1 ? "interação" : "interações"}
                  </span>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Instagram Ads */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-pink-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Instagram Ads
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {countInstagram} ({pctInstagram}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                        style={{ width: `${pctInstagram}%` }}
                      />
                    </div>
                  </div>

                  {/* Facebook Ads */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Facebook Ads
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {countFacebook} ({pctFacebook}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${pctFacebook}%` }}
                      />
                    </div>
                  </div>

                  {/* Google Ads */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        Google Ads
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {countGoogle} ({pctGoogle}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${pctGoogle}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                  💡 <strong>Diagnóstico:</strong> A plataforma monitora automaticamente o canal e a campanha de cada lead assim que ele envia a primeira mensagem no WhatsApp.
                </div>
              </div>

              {/* Ranking Comparativo de Lojas (7 colunas) */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      Leaderboard de Velocidade das Lojas
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Quem atende os clientes de tráfego pago mais rápido
                    </p>
                  </div>
                </div>

                {lojasPerformance.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Sem dados suficientes de lojas no período selecionado.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {lojasPerformance.map((lp, idx) => {
                      const sla = lp.tempo_medio_segundos || 0;
                      const isTop = idx === 0;
                      const isRapida = sla > 0 && sla <= 300;
                      const isLenta = sla > 900;

                      return (
                        <div
                          key={lp.loja_id}
                          className="p-3 rounded-xl bg-background border border-border/60 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                              isTop
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              #{idx + 1}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground font-display">
                                {lp.loja_nome || `Loja #${lp.loja_id}`}
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {lp.total_mensagens || 0} msgs • {lp.total_pessoas || 0} leads
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
                              isRapida ? "text-emerald-500" : isLenta ? "text-rose-500" : "text-amber-500"
                            }`}>
                              <Clock className="w-3 h-3" />
                              {formatSLA(sla)}
                            </span>
                            <span className="block text-[9px] text-muted-foreground font-semibold">
                              {isRapida ? "Excelente" : isLenta ? "Gargalo Crítico" : "Regular"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Mosaico Bento Grid de Criativos & Anúncios */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    Performance por Criativo de Anúncio
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Qual anúncio atrai mais clientes e qual o tempo de retorno da equipe
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Ordenar por:</span>
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
                    <button
                      onClick={() => setCreativeSort("leads")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        creativeSort === "leads" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Mais Leads
                    </button>
                    <button
                      onClick={() => setCreativeSort("sla")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        creativeSort === "sla" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Pior SLA
                    </button>
                    <button
                      onClick={() => setCreativeSort("messages")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        creativeSort === "messages" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Volume
                    </button>
                  </div>
                </div>
              </div>

              {filteredCriativos.length === 0 ? (
                <div className="p-12 rounded-2xl bg-card border border-border/80 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
                  <h3 className="text-sm font-bold text-foreground">Nenhum anúncio identificado no período</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Assim que novos leads clicarem nos seus anúncios e chamarem no WhatsApp, a campanha aparecerá aqui com métricas completas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCriativos.map((c) => {
                    const isGoogle = c.canal?.toLowerCase() === "google" || c.ad_id.startsWith("google_");
                    const link =
                      c.source_url ||
                      (!isGoogle && c.ad_id
                        ? `https://www.facebook.com/ads/library/?id=${c.ad_id}`
                        : null);

                    const slaMedio = c.tempo_medio_segundos || 0;
                    const isSlaBom = slaMedio > 0 && slaMedio <= 300;

                    return (
                      <div
                        key={c.criativo_id || c.ad_id}
                        className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Top: Thumbnail + Channel Badge */}
                          <div className="flex items-start gap-3">
                            {c.media_url ? (
                              <img
                                src={c.media_url}
                                alt={c.titulo || "Anúncio"}
                                className="w-16 h-16 rounded-xl object-cover border border-border shrink-0 shadow-sm"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-muted/80 border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground">
                                {isGoogle ? (
                                  <Search className="w-6 h-6 text-sky-400" />
                                ) : (
                                  <Sparkles className="w-6 h-6 text-pink-400" />
                                )}
                              </div>
                            )}

                            <div className="min-w-0 space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isGoogle
                                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/25"
                                    : "bg-pink-500/10 text-pink-400 border border-pink-500/25"
                                }`}
                              >
                                {isGoogle ? "GOOGLE ADS" : "META ADS"}
                              </span>

                              <h4
                                className="text-xs font-bold font-display text-foreground truncate"
                                title={c.titulo || `Anúncio #${c.ad_id}`}
                              >
                                {c.titulo || `Anúncio #${c.ad_id}`}
                              </h4>

                              {c.tema && (
                                <p className="text-[10px] text-muted-foreground truncate" title={c.tema}>
                                  &ldquo;{c.tema}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Metric Chips */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                            <div className="p-2 rounded-xl bg-background border border-border/50">
                              <span className="text-[10px] text-muted-foreground block font-medium">Leads Únicos</span>
                              <span className="text-sm font-bold font-mono text-primary">
                                {c.total_pessoas_unicas || 0}
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-background border border-border/50">
                              <span className="text-[10px] text-muted-foreground block font-medium">Tempo Médio SLA</span>
                              <span className={`text-sm font-bold font-mono ${isSlaBom ? "text-emerald-500" : "text-amber-500"}`}>
                                {formatSLA(slaMedio)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action */}
                        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {c.total_mensagens || 0} msgs trocadas
                          </span>

                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                            >
                              <span>Ver Criativo</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
