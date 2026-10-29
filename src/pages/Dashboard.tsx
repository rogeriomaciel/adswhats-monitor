import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getLojas } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { MetricsSLASection } from "@/components/dashboard/MetricsSLASection";
import {
  Building2,
  Users,
  MessageSquare,
  Shield,
  ArrowRight,
  Plus,
  RefreshCw,
  QrCode,
  Sparkles,
  Phone,
  LayoutGrid,
  List,
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

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const [lojasViewMode, setLojasViewMode] = useState<"table" | "cards">("table");

  const {
    data: lojas = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["lojas"],
    queryFn: getLojas,
  });

  const totalLojas = lojas.length;
  const lojasAtivas = lojas.filter((l) => l.ativo).length;
  const totalContatos = lojas.reduce((acc, l) => acc + (l.total_contatos || 0), 0);
  const totalMensagens = lojas.reduce((acc, l) => acc + (l.total_mensagens || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Torre Central AdsWhats
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-foreground">
              Olá, {user?.nome || "Operador"}!
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
              Monitore instâncias da Evolution API, capture contatos via webhook e gerencie canais de WhatsApp em escala multi-loja.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-3 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <Link
              to="/lojas"
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Building2 className="w-4 h-4" />
              Gerenciar Lojas
            </Link>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lojas Cadastradas</p>
              <h3 className="text-2xl font-bold font-display mt-0.5">{totalLojas}</h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {lojasAtivas} ativas
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contatos Coletados</p>
              <h3 className="text-2xl font-bold font-display mt-0.5">{totalContatos}</h3>
              <span className="text-[10px] text-muted-foreground">Isolados por loja_id</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mensagens Registradas</p>
              <h3 className="text-2xl font-bold font-display mt-0.5">{totalMensagens}</h3>
              <span className="text-[10px] text-muted-foreground">Via webhook inbound</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gateway de Integração</p>
              <h3 className="text-base font-bold font-display mt-1 text-emerald-600 dark:text-emerald-400">
                API Online
              </h3>
              <span className="text-[10px] text-muted-foreground">Serviços Conectados</span>
            </div>
          </div>
        </div>

        {/* Seção Central de Métricas de SLA & Criativos */}
        <MetricsSLASection
          lojas={lojas}
          selectedLojaId={selectedLojaId}
          onSelectLojaId={setSelectedLojaId}
        />

        {/* Lojas Preview & Quick Actions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-display text-foreground">
                Lojas Recentes
              </h2>
              <p className="text-xs text-muted-foreground">
                Status das instâncias e volume de contatos
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setLojasViewMode("table")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    lojasViewMode === "table"
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
                  onClick={() => setLojasViewMode("cards")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    lojasViewMode === "cards"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              <Link
                to="/lojas"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Ver todas ({totalLojas})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
              Carregando dados das lojas...
            </div>
          ) : lojas.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                Nenhuma loja cadastrada no momento.
              </p>
              <Link
                to="/lojas"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Loja Agora
              </Link>
            </div>
          ) : lojasViewMode === "table" ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">Loja</th>
                      <th className="py-3 px-4">WhatsApp Oficial</th>
                      <th className="py-3 px-4 text-center">Contatos</th>
                      <th className="py-3 px-4 text-center">Mensagens</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lojas.map((loja) => (
                      <tr key={loja.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {loja.nome?.substring(0, 2).toUpperCase() || "LJ"}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground">{loja.nome}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">#{loja.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          {loja.whatsapp_loja ? (
                            <span className="text-foreground">{formatPhone(loja.whatsapp_loja)}</span>
                          ) : (
                            <span className="italic text-amber-500/90 dark:text-amber-400 font-sans text-[11px] font-medium">
                              Aguardando conexão
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted">
                            {loja.total_contatos || 0}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted">
                            {loja.total_mensagens || 0}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              loja.ativo
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {loja.ativo ? "Ativa" : "Inativa"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link
                            to="/lojas"
                            className="py-1.5 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 transition-colors"
                          >
                            Abrir Configurações
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lojas.map((loja) => (
                <div
                  key={loja.id}
                  className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground font-display">
                        {loja.nome}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {loja.whatsapp_loja}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        loja.ativo
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {loja.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Contatos</span>
                      <span className="font-bold font-mono">{loja.total_contatos || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Mensagens</span>
                      <span className="font-bold font-mono">{loja.total_mensagens || 0}</span>
                    </div>
                  </div>

                  <Link
                    to="/lojas"
                    className="w-full py-1.5 px-3 rounded-lg border border-border text-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Abrir Configurações
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
