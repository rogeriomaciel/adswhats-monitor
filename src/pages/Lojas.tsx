import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLojas } from "@/lib/api";
import { Loja } from "@/types/loja";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { LojaModal } from "@/components/lojas/LojaModal";
import {
  Building2,
  Plus,
  Search,
  MessageSquare,
  Users,
  QrCode,
  Settings,
  CheckCircle2,
  XCircle,
  Phone,
  Globe,
  Instagram,
  Facebook,
  MapPin,
  ExternalLink,
  Loader2,
  RefreshCw,
  Clock,
  Share2,
  Copy,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";

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

export default function LojasPage() {
  const { user } = useAuth();
  const isAdmin = (user?.role || "admin").toLowerCase() === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
  const [modalTab, setModalTab] = useState<"geral" | "social" | "localizacao" | "evolution">("geral");

  const {
    data: lojas = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["lojas"],
    queryFn: getLojas,
  });

  // Sincroniza selectedLoja com os dados atualizados das lojas após refetch
  useEffect(() => {
    if (selectedLoja) {
      const fresh = lojas.find((l) => l.id === selectedLoja.id);
      if (fresh && (fresh.whatsapp_loja !== selectedLoja.whatsapp_loja || fresh.nome !== selectedLoja.nome)) {
        setSelectedLoja(fresh);
      }
    }
  }, [lojas, selectedLoja]);

  const filteredLojas = lojas.filter((loja) => {
    const term = searchTerm.toLowerCase();
    const nome = loja.nome?.toLowerCase() || "";
    const whatsapp = loja.whatsapp_loja || "";
    const email = loja.config_json?.dadosDaLoja?.email?.toLowerCase() || "";
    return nome.includes(term) || whatsapp.includes(term) || email.includes(term);
  });

  const totalLojas = lojas.length;
  const lojasAtivas = lojas.filter((l) => l.ativo).length;
  const totalContatos = lojas.reduce((acc, l) => acc + (l.total_contatos || 0), 0);
  const totalMensagens = lojas.reduce((acc, l) => acc + (l.total_mensagens || 0), 0);

  const handleNovaLoja = () => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem cadastrar novas lojas.");
      return;
    }
    setSelectedLoja(null);
    setModalTab("geral");
    setIsModalOpen(true);
  };

  const handleEditarLoja = (loja: Loja) => {
    setSelectedLoja(loja);
    setModalTab("geral");
    setIsModalOpen(true);
  };

  const handleConectarWhatsApp = (loja: Loja) => {
    setSelectedLoja(loja);
    setModalTab("evolution");
    setIsModalOpen(true);
  };

  const handleCopiarLinkLojista = (loja: Loja) => {
    if (!loja.connect_token) {
      toast.error("Esta loja ainda não possui token de conexão. Execute as migrações no sistema.");
      return;
    }
    const link = `${window.location.origin}/conectar/${loja.connect_token}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link de conexão copiado! Envie ao lojista de "${loja.nome}".`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Gestão de Lojas & Instâncias
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cadastre e gerencie os canais de WhatsApp, dados das lojas e instâncias da Evolution API
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            {isAdmin && (
              <button
                onClick={handleNovaLoja}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Nova Loja
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total de Lojas</p>
              <h3 className="text-lg font-bold font-display">{totalLojas}</h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Lojas Ativas</p>
              <h3 className="text-lg font-bold font-display">
                {lojasAtivas} <span className="text-xs font-normal text-muted-foreground">/ {totalLojas}</span>
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Contatos Coletados</p>
              <h3 className="text-lg font-bold font-display">{totalContatos}</h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Mensagens Registradas</p>
              <h3 className="text-lg font-bold font-display">{totalMensagens}</h3>
            </div>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, WhatsApp ou e-mail da loja..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>

        {/* Store List (Table or Cards) */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Carregando lojas cadastradas...</p>
          </div>
        ) : filteredLojas.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card border border-border text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                {searchTerm ? "Nenhuma loja encontrada para a busca" : "Nenhuma loja cadastrada ainda"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchTerm
                  ? "Tente buscar por outro termo ou limpe o filtro de pesquisa."
                  : "Comece cadastrando a primeira loja gerenciada para habilitar a conexão da Evolution API e recepção de contatos."}
              </p>
            </div>
            {!searchTerm && isAdmin && (
              <button
                onClick={handleNovaLoja}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Primeira Loja
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Loja</th>
                    <th className="py-3 px-4">WhatsApp Oficial</th>
                    <th className="py-3 px-4">Canais & Endereço</th>
                    <th className="py-3 px-4 text-center">Contatos</th>
                    <th className="py-3 px-4 text-center">Mensagens</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLojas.map((loja) => {
                    const dados = loja.config_json?.dadosDaLoja;
                    return (
                      <tr key={loja.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {loja.nome?.substring(0, 2).toUpperCase() || "LJ"}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground">{loja.nome}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">#{loja.id}</span>
                              </div>
                              {dados?.email && (
                                <span className="text-[11px] text-muted-foreground block">{dados.email}</span>
                              )}
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

                        <td className="py-3 px-4 max-w-xs">
                          <div className="space-y-1">
                            {dados?.endereco && (
                              <p className="truncate text-[11px] text-muted-foreground flex items-center gap-1" title={dados.endereco}>
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{dados.endereco}</span>
                              </p>
                            )}
                            <div className="flex items-center gap-2.5 text-[11px]">
                              {dados?.site && (
                                <a
                                  href={dados.site}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <Globe className="w-3 h-3" />
                                  Site
                                </a>
                              )}
                              {dados?.instagram && (
                                <a
                                  href={
                                    dados.instagram.startsWith("http")
                                      ? dados.instagram
                                      : `https://instagram.com/${dados.instagram.replace("@", "")}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-pink-500 hover:underline flex items-center gap-1"
                                >
                                  <Instagram className="w-3 h-3" />
                                  Instagram
                                </a>
                              )}
                              {dados?.facebook && (
                                <a
                                  href={dados.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline flex items-center gap-1"
                                >
                                  <Facebook className="w-3 h-3" />
                                  Facebook
                                </a>
                              )}
                              {!dados?.endereco && !dados?.site && !dados?.instagram && !dados?.facebook && (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </div>
                          </div>
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
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleConectarWhatsApp(loja)}
                              className="py-1.5 px-2.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                              title="Gerenciar conexão do WhatsApp"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">WhatsApp</span>
                            </button>

                            <button
                              onClick={() => handleCopiarLinkLojista(loja)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors"
                              title="Copiar link público para o lojista conectar WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleEditarLoja(loja)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Editar Loja"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
            {filteredLojas.map((loja) => {
              const dados = loja.config_json?.dadosDaLoja;
              const evo = loja.config_json?.evolutionapi;
              const instanceName = evo?.instanceName || `loja-${loja.id}`;

              return (
                <div
                  key={loja.id}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top line: Name + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {loja.nome?.substring(0, 2).toUpperCase() || "LJ"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground font-display leading-tight">
                              {loja.nome}
                            </h3>
                            <span className="text-[10px] font-mono text-muted-foreground">#{loja.id}</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {loja.whatsapp_loja ? (
                              formatPhone(loja.whatsapp_loja)
                            ) : (
                              <span className="italic text-amber-500/90 dark:text-amber-400 font-medium">Aguardando conexão</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                          loja.ativo
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {loja.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    {/* Store Info Pills */}
                    <div className="space-y-2 text-xs text-muted-foreground pt-1 border-t border-border/60">
                      {dados?.endereco && (
                        <p className="truncate flex items-center gap-1.5 text-[11px]">
                          <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{dados.endereco}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] pt-1">
                        {dados?.site && (
                          <a
                            href={dados.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" />
                            Site
                          </a>
                        )}
                        {dados?.instagram && (
                          <a
                            href={dados.instagram.startsWith("http") ? dados.instagram : `https://instagram.com/${dados.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-500 hover:underline flex items-center gap-1"
                          >
                            <Instagram className="w-3 h-3" />
                            Instagram
                          </a>
                        )}
                        {dados?.facebook && (
                          <a
                            href={dados.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <Facebook className="w-3 h-3" />
                            Facebook
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Stats Badge */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                        <span className="text-[10px] text-muted-foreground block">Contatos</span>
                        <span className="text-xs font-bold text-foreground font-mono">
                          {loja.total_contatos || 0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                        <span className="text-[10px] text-muted-foreground block">Mensagens</span>
                        <span className="text-xs font-bold text-foreground font-mono">
                          {loja.total_mensagens || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleConectarWhatsApp(loja)}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      title="Gerenciar conexão da Evolution API"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Instância WhatsApp
                    </button>

                    <button
                      onClick={() => handleCopiarLinkLojista(loja)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors"
                      title="Copiar link público para o lojista conectar WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEditarLoja(loja)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Editar Loja"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Loja Edit / Create Modal */}
      <LojaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => refetch()}
        loja={selectedLoja}
        initialTab={modalTab}
      />
    </div>
  );
}
