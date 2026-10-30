import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMetricsSLA } from "@/lib/api";
import { Loja } from "@/types/loja";
import {
  Clock,
  Sparkles,
  Timer,
  CheckCircle2,
  AlertCircle,
  Filter,
  BarChart3,
  Layers,
  Store,
  Users,
  MessageSquare,
  RefreshCw,
  Loader2,
  ExternalLink,
  Search,
} from "lucide-react";

interface MetricsSLASectionProps {
  lojas: Loja[];
  selectedLojaId: number | null;
  onSelectLojaId: (lojaId: number | null) => void;
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

export function MetricsSLASection({
  lojas,
  selectedLojaId,
  onSelectLojaId,
}: MetricsSLASectionProps) {
  const [dias, setDias] = useState<number>(30);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["metrics-sla", selectedLojaId, dias],
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
  const lojasList = data?.por_loja || [];

  return (
    <div className="space-y-6">
      {/* Header com Filtros de Loja e Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div>
          <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Performance de SLA & Atribuição de Criativos
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tempo de resposta dos atendentes, velocidade de retorno e impacto por anúncio Meta CTWA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Loja */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs">
            <Store className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedLojaId ?? ""}
              onChange={(e) => onSelectLojaId(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent border-none text-foreground font-medium focus:outline-none cursor-pointer"
            >
              <option value="">Todas as Lojas</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

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
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  dias === p.val
                    ? "bg-card text-foreground shadow-sm"
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
            className="p-2 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
            title="Atualizar métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-card border border-border rounded-2xl">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Consolidando métricas de atendimento e criativos...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards de SLA e Conversão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SLA Médio */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Tempo Médio de SLA</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display text-foreground">
                  {formatSLA(resumo.tempo_medio_segundos)}
                </h3>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Mediana: <strong className="text-foreground">{formatSLA(resumo.tempo_mediano_segundos)}</strong>
                </span>
              </div>
            </div>

            {/* Taxa de Resposta */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Taxa de Resposta</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display text-foreground">
                  {resumo.taxa_resposta_pct}%
                </h3>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  {resumo.total_respondidas} de {resumo.total_inbound} recebidas
                </span>
              </div>
            </div>

            {/* Mensagens de Anúncios CTWA */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Mensagens de Anúncios</span>
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display text-foreground">
                  {resumo.total_mensagens_ad}
                </h3>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  CTWA Meta Ads interceptadas
                </span>
              </div>
            </div>

            {/* Inbound Pendente */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Aguardando Resposta</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display text-foreground">
                  {resumo.total_pendentes}
                </h3>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 block">
                  {resumo.total_pendentes > 0 ? "Requer atendimento" : "Fila zerada"}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Criativos Meta Ads */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  Métricas por Criativo (Meta Ads / Instagram / Facebook)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Identificação automática do anúncio que originou a conversa e tempo de resposta da equipe
                </p>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {criativos.length} criativo(s) ativo(s)
              </span>
            </div>

            {criativos.length === 0 ? (
              <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">
                  Nenhum anúncio Meta Ads identificado no período selecionado.
                </p>
                <p className="text-[11px] text-muted-foreground/80 max-w-md mx-auto">
                  Assim que leads clicarem em anúncios no Instagram ou Facebook e enviarem mensagens pelo WhatsApp, os criativos serão listados aqui com SLA e contatos únicos.
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-3 px-4">Criativo / Anúncio</th>
                        <th className="py-3 px-4">Canal</th>
                        <th className="py-3 px-4 text-center">Mensagens</th>
                        <th className="py-3 px-4 text-center">Leads Únicos</th>
                        <th className="py-3 px-4 text-center">SLA Médio</th>
                        <th className="py-3 px-4 text-center">Link / Anúncio</th>
                        <th className="py-3 px-4 text-right">Última Mensagem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {criativos.map((c) => {
                        const isGoogle = c.canal?.toLowerCase() === "google" || c.ad_id.startsWith("google_");
                        const link = c.source_url || (!isGoogle && c.ad_id ? `https://www.facebook.com/ads/library/?id=${c.ad_id}` : null);

                        return (
                          <tr key={c.criativo_id || c.ad_id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 max-w-sm">
                              <div className="flex items-center gap-3">
                                {c.media_url ? (
                                  <img
                                    src={c.media_url}
                                    alt={c.titulo || "Criativo"}
                                    className="w-10 h-10 rounded-lg object-cover border border-border shrink-0 shadow-xs"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground border border-border/60">
                                    {isGoogle ? <Search className="w-4 h-4 text-blue-500" /> : <Sparkles className="w-4 h-4 opacity-60" />}
                                  </div>
                                )}
                                <div className="space-y-0.5 min-w-0">
                                  <p className="font-bold text-foreground text-xs leading-snug truncate">
                                    {c.titulo || `Anúncio #${c.ad_id}`}
                                  </p>
                                  {c.tema && (
                                    <p className="text-[10px] text-muted-foreground truncate" title={c.tema}>
                                      {c.tema}
                                    </p>
                                  )}
                                  <span className="text-[9px] font-mono text-muted-foreground/75">
                                    {c.ad_id.startsWith("google_")
                                      ? `Termo: ${c.ad_id.replace("google_", "")}`
                                      : `Ad ID: ${c.ad_id}`}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {isGoogle ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                  <Search className="w-2.5 h-2.5" />
                                  GOOGLE ADS
                                </span>
                              ) : c.canal?.toLowerCase() === "facebook" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-600/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  FACEBOOK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {c.canal?.toUpperCase() || "INSTAGRAM"}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted">
                                {c.total_mensagens || 0}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                {c.total_pessoas_unicas || 0}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-foreground font-mono font-bold text-[11px]">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {formatSLA(c.tempo_medio_segundos)}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              {link ? (
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  title={c.source_url ? "Abrir Link de Origem" : "Ver na Biblioteca de Anúncios da Meta"}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {c.source_url ? "Ver Link" : "Ad Library"}
                                </a>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/75 font-mono">
                                  {isGoogle ? "Cupom" : "-"}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right text-muted-foreground text-[11px]">
                              {c.ultima_mensagem_at
                                ? new Date(c.ultima_mensagem_at).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
