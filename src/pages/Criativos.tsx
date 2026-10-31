import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getLojas, getMetricsSLA } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { ChatModal } from "@/components/chat/ChatModal";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import { Pessoa, LojaPerformance, Criativo, PessoaAudit } from "@/types/contato";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Store,
  RefreshCw,
  Loader2,
  Users,
  MessageSquare,
  Zap,
  Flame,
  Award,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Target,
  BarChart3,
  CheckCheck,
  Eye,
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

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "-";
  }
}

function calculateScore(loja: LojaPerformance): number {
  if (typeof loja.score_saude === "number" && !isNaN(loja.score_saude) && loja.score_saude > 0) {
    return Math.min(100, Math.max(0, loja.score_saude));
  }
  const taxa = loja.taxa_resposta_pct ?? (loja.total_mensagens > 0 ? (loja.total_respondidas / Math.max(1, loja.total_mensagens)) * 100 : 100);
  const ptsTaxa = (taxa / 100) * 45;

  const sla = loja.tempo_medio_segundos || 0;
  let ptsSla = 35;
  if (sla > 1800) ptsSla = 0;
  else if (sla > 900) ptsSla = 12;
  else if (sla > 300) ptsSla = 22;

  const esfriando = loja.leads_esfriando || 0;
  const ptsFila = Math.max(0, 20 - esfriando * 5);

  return Math.min(100, Math.max(0, Math.round(ptsTaxa + ptsSla + ptsFila)));
}

export default function CriativosPage() {
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const [dias, setDias] = useState<number>(30);
  const [selectedCanal, setSelectedCanal] = useState<string>("todos");
  const [creativeSort, setCreativeSort] = useState<"leads" | "sla" | "messages" | "qualidade">("leads");
  const [selectedChatContato, setSelectedChatContato] = useState<Pessoa | null>(null);

  // Buscar Lojas cadastradas
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
    leads_esfriando: 0,
    leads_ad_sem_resposta: 0,
    total_leads_ad: 0,
    tempo_medio_segundos: 0,
    tempo_mediano_segundos: 0,
    taxa_resposta_pct: 0,
  };

  const criativos = data?.por_criativo || [];
  const lojasPerformance = data?.por_loja || [];
  const leadsPessoas = data?.por_pessoa || [];

  const selectedLoja = useMemo(() => {
    return lojas.find((l) => l.id === selectedLojaId) || null;
  }, [lojas, selectedLojaId]);

  const selectedLojaPerf = useMemo(() => {
    return lojasPerformance.find((lp) => lp.loja_id === selectedLojaId) || null;
  }, [lojasPerformance, selectedLojaId]);

  // Cálculo de Score da Carteira ou da Loja Selecionada
  const activeLojas = useMemo(() => {
    return lojasPerformance.filter((lp) => (lp.total_mensagens || 0) > 0 || (lp.total_pessoas || 0) > 0);
  }, [lojasPerformance]);

  const carteiraScore = useMemo(() => {
    if (activeLojas.length === 0) return 100;
    const sum = activeLojas.reduce((acc, l) => acc + calculateScore(l), 0);
    return Math.round(sum / activeLojas.length);
  }, [activeLojas]);

  const currentStoreScore = useMemo(() => {
    if (!selectedLojaPerf) return 100;
    return calculateScore(selectedLojaPerf);
  }, [selectedLojaPerf]);

  // Contagem de lojas com gargalo crítico (SLA > 15m ou leads esfriando)
  const lojasEmRisco = useMemo(() => {
    return activeLojas.filter((lp) => (lp.tempo_medio_segundos || 0) > 900 || (lp.leads_esfriando || 0) > 0);
  }, [activeLojas]);

  // Filtragem e ordenação inteligente dos criativos
  const filteredCriativos = useMemo(() => {
    return criativos
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
        if (creativeSort === "qualidade") {
          const qualB = b.total_pessoas_unicas > 0 ? ((b.conversas_profundas || 0) / b.total_pessoas_unicas) : 0;
          const qualA = a.total_pessoas_unicas > 0 ? ((a.conversas_profundas || 0) / a.total_pessoas_unicas) : 0;
          return qualB - qualA;
        }
        return 0;
      });
  }, [criativos, selectedCanal, creativeSort]);

  // Cálculo da distribuição por canal com consistência matemática garantida
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

  // Leads em Risco (Aguardando resposta > 15m)
  const leadsEsfriandoTotal = resumo.leads_esfriando || 0;
  const isOperacaoAgil = resumo.tempo_medio_segundos > 0 && resumo.tempo_medio_segundos <= 300;

  const lojaOptions = useMemo<DropdownOption<number | null>[]>(() => {
    return [
      { value: null, label: "Todas as Lojas (Geral)" },
      ...lojas.map((l) => ({
        value: l.id,
        label: l.nome,
        badge: l.ativo ? "Online" : "Pausada",
      })),
    ];
  }, [lojas]);

  const periodLabel = dias === 1 ? "Hoje" : `${dias} dias`;

  // Função para abrir o ChatModal a partir de um lead da lista
  const handleOpenChat = (p: PessoaAudit) => {
    const contatoObj: Pessoa = {
      id: p.pessoa_id,
      loja_id: p.loja_id,
      loja_nome: p.loja_nome,
      nome: p.nome,
      whatsapp: p.whatsapp,
      status: "ativo",
      origem: p.origem || "meta_ads",
      ultimo_criativo_titulo: p.ultimo_criativo_titulo,
      ultimo_criativo_ad_id: p.ultimo_criativo_ad_id,
      ultimo_criativo_media_url: p.ultimo_criativo_media_url,
      ultimo_criativo_canal: p.ultimo_criativo_canal,
      total_mensagens: p.total_mensagens || 0,
      tempo_medio_resposta_segundos: p.tempo_medio_segundos,
      last_message_at: p.ultima_mensagem_at,
      created_at: p.created_at,
    };
    setSelectedChatContato(contatoObj);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-8">
        {/* Header Executivo com Controles de Telemetria e Alternância Geral vs Loja */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {selectedLojaId !== null ? (
                <button
                  onClick={() => setSelectedLojaId(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors cursor-pointer border border-border"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para Visão Geral da Carteira
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-500 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  Auditoria Executiva da Carteira
                </span>
              )}
              <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md">
                Período: {periodLabel}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              {selectedLojaId !== null ? (
                <>
                  <Store className="w-6 h-6 text-primary" />
                  <span>Dossiê da Loja: {selectedLoja?.nome || `Loja #${selectedLojaId}`}</span>
                </>
              ) : (
                "Auditoria Diária de Tráfego & SLA da Agência"
              )}
            </h1>

            <p className="text-xs text-muted-foreground max-w-2xl">
              {selectedLojaId !== null
                ? "Raio-X minucioso de conversão e atendimento: veja quais criativos geram diálogo real e audite conversas diretamente."
                : "Monitore onde a recepção das suas lojas clientes está queimando dinheiro de anúncios e priorize quem precisa de socorro."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor de Loja Estilizado */}
            <CustomDropdown
              value={selectedLojaId}
              onChange={setSelectedLojaId}
              options={lojaOptions}
              icon={<Store className="w-3.5 h-3.5" />}
              className="w-48 sm:w-60"
              ariaLabel="Filtrar por loja"
            />

            {/* Seletor de Período Ágil com 1D (Hoje) */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
              {[
                { label: "1D (Hoje)", val: 1 },
                { label: "7D", val: 7 },
                { label: "15D", val: 15 },
                { label: "30D", val: 30 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setDias(p.val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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
            <p className="text-xs text-muted-foreground font-semibold">
              Calculando pontuação de saúde, SLA e engajamento dos criativos...
            </p>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* VIEW 1: VISÃO GERAL DA CARTEIRA DA AGÊNCIA (Todas as Lojas) */}
            {/* ======================================================== */}
            {selectedLojaId === null && (
              <div className="space-y-6">
                {/* Banner de Diagnóstico Executivo da Carteira */}
                <div
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                    lojasEmRisco.length > 0
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 rounded-xl bg-background/80 shrink-0">
                      {lojasEmRisco.length > 0 ? (
                        <Flame className="w-5 h-5 text-rose-500" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold font-display text-foreground">
                        {lojasEmRisco.length > 0
                          ? `Alerta de Risco: ${lojasEmRisco.length} ${
                              lojasEmRisco.length === 1 ? "loja cliente está" : "lojas clientes estão"
                            } com demora no atendimento no período (${periodLabel})`
                          : `Carteira Saudável: Todas as lojas ativas atendem anúncios com agilidade (${periodLabel})`}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {lojasEmRisco.length > 0
                          ? "Quando o atendimento demora mais de 15 minutos, a probabilidade de conversão do lead cai em até 80%."
                          : "O tempo médio de resposta está dentro da meta recomendada de menos de 5 minutos."}
                      </p>
                    </div>
                  </div>

                  {lojasEmRisco.length > 0 && (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500 text-white shrink-0 self-start sm:self-center">
                      Ação Necessária
                    </span>
                  )}
                </div>

                {/* 4 Bento Cards da Carteira */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Score Geral da Carteira */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Saúde Geral da Carteira</span>
                      <div
                        className={`p-2 rounded-xl ${
                          carteiraScore >= 80
                            ? "bg-emerald-500/10 text-emerald-500"
                            : carteiraScore >= 50
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                          {carteiraScore}
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">/ 100</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            carteiraScore >= 80
                              ? "bg-emerald-500/15 text-emerald-500"
                              : carteiraScore >= 50
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-rose-500/15 text-rose-500"
                          }`}
                        >
                          {carteiraScore >= 80 ? "🟢 Excelente" : carteiraScore >= 50 ? "🟡 Regular" : "🔴 Crítico"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {activeLojas.length} lojas avaliadas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Leads Esfriando (Verba em Risco) */}
                  <Link
                    to="/contatos?filter=sem_resposta"
                    title="Ver contatos aguardando retorno"
                    className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3 hover:border-rose-500/50 hover:shadow-md transition-all group block cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold group-hover:text-foreground transition-colors">
                        Leads Esfriando (&gt;15 min)
                      </span>
                      <div
                        className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${
                          leadsEsfriandoTotal > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {leadsEsfriandoTotal > 0 ? <Flame className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                    <div>
                      <h3
                        className={`text-3xl font-extrabold font-display tracking-tight ${
                          leadsEsfriandoTotal > 0 ? "text-rose-500" : "text-emerald-500"
                        }`}
                      >
                        {leadsEsfriandoTotal}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center justify-between group-hover:text-rose-500 transition-colors">
                        <span>
                          {leadsEsfriandoTotal > 0
                            ? "Leads de anúncio sem resposta"
                            : "Nenhum lead abandonado"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                      </p>
                    </div>
                  </Link>

                  {/* Card 3: Velocidade Média da Carteira */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">SLA Médio de Retorno</span>
                      <div
                        className={`p-2 rounded-xl ${
                          isOperacaoAgil ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                        {formatSLA(resumo.tempo_medio_segundos)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOperacaoAgil ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                          }`}
                        >
                          {isOperacaoAgil ? "⚡ Abaixo de 5 min" : "⚠️ Demora Acima do Ideal"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Meta: &lt;5min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Volume Total de Leads de Tráfego Pago */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Leads de Tráfego Pago</span>
                      <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                        {resumo.total_leads_ad || resumo.total_mensagens_ad}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {resumo.total_mensagens_ad} mensagens trocadas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grade de Lojas da Agência com Ação Direta "Abrir Dossiê" */}
                <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <h2 className="text-sm font-bold font-display uppercase tracking-wider text-foreground flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Auditoria de Performance por Loja Cliente
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Clique em &ldquo;Abrir Dossiê da Loja&rdquo; para auditar criativos específicos e ler o histórico das conversas.
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {lojasPerformance.length} lojas monitoradas
                    </span>
                  </div>

                  {lojasPerformance.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Nenhuma atividade registrada no período selecionado ({periodLabel}).
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lojasPerformance.map((lp) => {
                        const score = calculateScore(lp);
                        const sla = lp.tempo_medio_segundos || 0;
                        const isSlaBom = sla > 0 && sla <= 300;
                        const esfriando = lp.leads_esfriando || 0;
                        const taxa = lp.taxa_resposta_pct ?? 100;

                        return (
                          <div
                            key={lp.loja_id}
                            className={`p-4 rounded-2xl bg-background border transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md ${
                              esfriando > 0 ? "border-rose-500/40" : "border-border/80"
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Top: Loja Nome + Score */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-sm font-bold font-display text-foreground">
                                    {lp.loja_nome || `Loja #${lp.loja_id}`}
                                  </h3>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {lp.total_pessoas || 0} leads • {lp.total_mensagens || 0} msgs
                                  </span>
                                </div>

                                <div
                                  className={`px-2.5 py-1 rounded-xl font-mono font-bold text-xs flex items-center gap-1 border shrink-0 ${
                                    score >= 80
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                                      : score >= 50
                                      ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                                      : "bg-rose-500/10 text-rose-500 border-rose-500/25"
                                  }`}
                                  title="Score de Saúde da Loja (0-100)"
                                >
                                  <span>{score}</span>
                                  <span className="text-[10px] opacity-70">pts</span>
                                </div>
                              </div>

                              {/* Telemetria Rápida */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-xl bg-card border border-border/50">
                                  <span className="text-[10px] text-muted-foreground block font-medium">SLA Atendimento</span>
                                  <span
                                    className={`text-xs font-bold font-mono inline-flex items-center gap-1 ${
                                      isSlaBom ? "text-emerald-500" : "text-amber-500"
                                    }`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    {formatSLA(sla)}
                                  </span>
                                </div>

                                <div className="p-2 rounded-xl bg-card border border-border/50">
                                  <span className="text-[10px] text-muted-foreground block font-medium">Taxa Retorno</span>
                                  <span className="text-xs font-bold font-mono text-foreground">
                                    {taxa}%
                                  </span>
                                </div>
                              </div>

                              {/* Alerta de Leads Esfriando na Loja */}
                              {esfriando > 0 ? (
                                <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-semibold flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5" />
                                    {esfriando} {esfriando === 1 ? "lead esfriando" : "leads esfriando"}
                                  </span>
                                  <span className="text-[9px] uppercase font-bold tracking-wider">Atenção</span>
                                </div>
                              ) : (
                                <div className="px-2.5 py-1.5 rounded-xl bg-muted/60 text-muted-foreground text-[11px] flex items-center gap-1.5 font-medium">
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Zero fila pendente</span>
                                </div>
                              )}
                            </div>

                            {/* Botão de Ação Direta para a Visão 2 */}
                            <button
                              onClick={() => setSelectedLojaId(lp.loja_id)}
                              className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
                            >
                              <span>Abrir Dossiê da Loja</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Canais e Criativos Vencedores da Carteira */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Distribuição por Canal (5 colunas) */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <h3 className="text-xs font-bold font-display uppercase tracking-wider text-foreground">
                        Origem do Tráfego Pago
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {totalCanais} interações
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
                      💡 <strong>Inteligência Automática:</strong> Toda mensagem inbound vinda de anúncio com token ou link de campanha é mapeada instantaneamente sem depender de APIs lentas ou caras.
                    </div>
                  </div>

                  {/* Top Criativos da Carteira (7 colunas) */}
                  <div className="lg:col-span-7 p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-pink-500" />
                          Top Criativos Campeões da Carteira
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Anúncios com maior volume de leads qualificados
                        </p>
                      </div>
                    </div>

                    {filteredCriativos.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Nenhum criativo com tráfego identificado no período.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredCriativos.slice(0, 5).map((c, idx) => {
                          const isGoogle = c.canal?.toLowerCase() === "google" || c.ad_id.startsWith("google_");
                          const link =
                            c.source_url ||
                            (!isGoogle && c.ad_id
                              ? `https://www.facebook.com/ads/library/?id=${c.ad_id}`
                              : null);

                          return (
                            <div
                              key={c.criativo_id || c.ad_id}
                              className="p-3 rounded-xl bg-background border border-border/60 flex items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 font-bold text-xs flex items-center justify-center shrink-0 border border-pink-500/20">
                                  #{idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-foreground font-display truncate">
                                    {c.titulo || `Anúncio #${c.ad_id}`}
                                  </h4>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {c.total_pessoas_unicas || 0} leads únicos • SLA {formatSLA(c.tempo_medio_segundos)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {link && (
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Ver anúncio na biblioteca"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: DOSSIÊ OPERACIONAL DA LOJA (Loja Específica)      */}
            {/* ======================================================== */}
            {selectedLojaId !== null && (
              <div className="space-y-6">
                {/* Veredito Automático do Gestor de Tráfego (Diagnóstico Executivo para Reunião) */}
                <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold font-display uppercase tracking-wider text-primary">
                      <Target className="w-4 h-4" />
                      Diagnóstico Executivo para Reunião de Alinhamento
                    </span>
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                        currentStoreScore >= 80
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                          : currentStoreScore >= 50
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                          : "bg-rose-500/10 text-rose-500 border-rose-500/25"
                      }`}
                    >
                      Score de Atendimento: {currentStoreScore}/100
                    </span>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {resumo.tempo_medio_segundos > 900 || leadsEsfriandoTotal > 0 ? (
                      <>
                        🚨 <strong>Atenção ao Gargalo de Atendimento:</strong> No período de {periodLabel}, as campanhas
                        geraram <span className="font-bold text-foreground">{resumo.total_leads_ad || resumo.total_inbound} leads</span> para
                        a <span className="font-bold text-foreground">{selectedLoja?.nome}</span>, mas a equipe levou em média{" "}
                        <span className="font-bold text-rose-500">{formatSLA(resumo.tempo_medio_segundos)}</span> para responder. Há{" "}
                        <span className="font-bold text-rose-500">{leadsEsfriandoTotal} leads aguardando retorno há mais de 15 minutos</span>.
                        Antes de alterar orçamentos ou criativos, a equipe comercial precisa agilizar o primeiro contato para evitar queima de verba.
                      </>
                    ) : (
                      <>
                        ⚡ <strong>Operação de Recepção Afiada:</strong> A equipe da{" "}
                        <span className="font-bold text-foreground">{selectedLoja?.nome}</span> está respondendo os leads de anúncios
                        com agilidade média de <span className="font-bold text-emerald-500">{formatSLA(resumo.tempo_medio_segundos)}</span> e
                        taxa de resposta de <span className="font-bold text-emerald-500">{resumo.taxa_resposta_pct}%</span>. O terreno está
                        preparado para escala nos criativos vencedores.
                      </>
                    )}
                  </p>
                </div>

                {/* 4 Bento Cards da Loja */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Score de Recepção da Loja */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Score da Recepção</span>
                      <div
                        className={`p-2 rounded-xl ${
                          currentStoreScore >= 80
                            ? "bg-emerald-500/10 text-emerald-500"
                            : currentStoreScore >= 50
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                          {currentStoreScore}
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">/ 100</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        Baseado em SLA, taxa e fila
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Leads Esfriando na Loja */}
                  <Link
                    to={`/contatos?loja_id=${selectedLojaId}&filter=sem_resposta`}
                    title="Ver leads sem resposta desta loja"
                    className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3 hover:border-rose-500/50 hover:shadow-md transition-all group block cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold group-hover:text-foreground transition-colors">
                        Leads Esfriando (&gt;15 min)
                      </span>
                      <div
                        className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${
                          leadsEsfriandoTotal > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {leadsEsfriandoTotal > 0 ? <Flame className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                    <div>
                      <h3
                        className={`text-3xl font-extrabold font-display tracking-tight ${
                          leadsEsfriandoTotal > 0 ? "text-rose-500" : "text-emerald-500"
                        }`}
                      >
                        {leadsEsfriandoTotal}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center justify-between group-hover:text-rose-500 transition-colors">
                        <span>Aguardando resposta da recepção</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                      </p>
                    </div>
                  </Link>

                  {/* Card 3: Tempo Médio de Resposta (SLA) */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">SLA Médio da Loja</span>
                      <div
                        className={`p-2 rounded-xl ${
                          isOperacaoAgil ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                        {formatSLA(resumo.tempo_medio_segundos)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOperacaoAgil ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                          }`}
                        >
                          {isOperacaoAgil ? "⚡ Resposta Ágil" : "⚠️ Demora Crítica"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Total de Leads de Anúncio da Loja */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Leads de Anúncio</span>
                      <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                        {resumo.total_leads_ad || resumo.total_mensagens_ad}
                      </h3>
                      <span className="text-[11px] text-muted-foreground font-medium mt-1 block">
                        {resumo.taxa_resposta_pct}% atendidos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Raio-X dos Criativos da Loja Selecionada */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        Raio-X de Criativos da Loja: Conversas Reais vs Curiosos
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Identifique se o criativo atrai compradores dispostos a dialogar ou curiosos de 1 mensagem.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold">Ordenar:</span>
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
                          onClick={() => setCreativeSort("qualidade")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            creativeSort === "qualidade" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                          }`}
                        >
                          Qualidade (≥4 msgs)
                        </button>
                        <button
                          onClick={() => setCreativeSort("sla")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            creativeSort === "sla" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                          }`}
                        >
                          Pior SLA
                        </button>
                      </div>
                    </div>
                  </div>

                  {filteredCriativos.length === 0 ? (
                    <div className="p-12 rounded-2xl bg-card border border-border/80 text-center space-y-2">
                      <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
                      <h3 className="text-sm font-bold text-foreground">Nenhum criativo registrado nesta loja no período</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Quando novos leads chegarem clicando nos anúncios desta loja, eles serão listados aqui.
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
                        const leadsUnicos = c.total_pessoas_unicas || 0;
                        const conversasProfundas = c.conversas_profundas || 0;
                        const pctProfundas = leadsUnicos > 0 ? Math.round((conversasProfundas / leadsUnicos) * 100) : 0;

                        return (
                          <div
                            key={c.criativo_id || c.ad_id}
                            className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                          >
                            <div className="space-y-3">
                              {/* Thumbnail + Tag Canal */}
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

                              {/* Telemetria de Conversas Profundas vs Curiosos */}
                              <div className="space-y-1.5 p-2.5 rounded-xl bg-background border border-border/60 text-xs">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                    Conversas Reais (≥4 msgs)
                                  </span>
                                  <span className="font-mono font-bold text-foreground">
                                    {conversasProfundas} ({pctProfundas}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${pctProfundas}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-muted-foreground block">
                                  {pctProfundas >= 35
                                    ? "🏆 Alta qualificação de público"
                                    : "⚠️ Maioria são curiosos de 1 mensagem"}
                                </span>
                              </div>

                              {/* SLA e Leads */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-xl bg-background border border-border/50">
                                  <span className="text-[10px] text-muted-foreground block font-medium">Leads Únicos</span>
                                  <span className="text-sm font-bold font-mono text-primary">
                                    {leadsUnicos}
                                  </span>
                                </div>

                                <div className="p-2 rounded-xl bg-background border border-border/50">
                                  <span className="text-[10px] text-muted-foreground block font-medium">SLA Atendimento</span>
                                  <span className={`text-sm font-bold font-mono ${isSlaBom ? "text-emerald-500" : "text-amber-500"}`}>
                                    {formatSLA(slaMedio)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Ações */}
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

                {/* Auditoria Individual de Leads Recentes da Loja (com botão de auditar chat) */}
                <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <h2 className="text-sm font-bold font-display uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Auditoria de Leads Recentes no WhatsApp
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Clique em &ldquo;Auditar Conversa&rdquo; para ver a transcrição completa do atendimento deste lead.
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {leadsPessoas.length} contatos analisados
                    </span>
                  </div>

                  {leadsPessoas.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Nenhum lead com conversa registrado no período selecionado.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {leadsPessoas.map((p) => {
                        const isEsfriando = (p.leads_esfriando || 0) > 0;
                        const sla = p.tempo_medio_segundos || 0;
                        const isSlaBom = sla > 0 && sla <= 300;

                        return (
                          <div
                            key={p.pessoa_id}
                            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                                {(p.nome || p.whatsapp || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-foreground truncate">
                                    {p.nome || formatPhone(p.whatsapp)}
                                  </h4>
                                  {isEsfriando && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-500 text-[9px] font-bold flex items-center gap-1">
                                      <Flame className="w-3 h-3" />
                                      Esfriando
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                  <span>{formatPhone(p.whatsapp)}</span>
                                  {p.ultimo_criativo_titulo && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[200px] text-foreground font-medium">
                                        Campanha: {p.ultimo_criativo_titulo}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <div className="text-left sm:text-right">
                                <span
                                  className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
                                    isEsfriando
                                      ? "text-rose-500"
                                      : isSlaBom
                                      ? "text-emerald-500"
                                      : "text-foreground"
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  {isEsfriando ? "Sem Resposta" : formatSLA(sla)}
                                </span>
                                <span className="block text-[10px] text-muted-foreground font-mono">
                                  {formatDateRelative(p.ultima_mensagem_at || p.created_at)}
                                </span>
                              </div>

                              <button
                                onClick={() => handleOpenChat(p)}
                                className="px-3 py-1.5 rounded-xl bg-background hover:bg-primary hover:text-primary-foreground border border-border text-foreground text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Auditar Chat</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Drawer Modal de Chat para Auditoria de Conversa Completa */}
      <ChatModal
        isOpen={!!selectedChatContato}
        onClose={() => setSelectedChatContato(null)}
        contato={selectedChatContato}
      />
    </div>
  );
}