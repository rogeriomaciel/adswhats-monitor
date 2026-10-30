import React, { useState, useEffect, useRef } from "react";
import { Loja, DadosDaLoja, EvolutionConfig, EvolutionState } from "@/types/loja";
import { saveLoja, callEvolutionApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  X,
  Store,
  Share2,
  Copy,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  LogOut,
  Power,
  Globe,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface LojaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  loja?: Loja | null;
  initialTab?: "geral" | "social" | "localizacao" | "evolution";
}

export function LojaModal({ isOpen, onClose, onSaved, loja, initialTab = "geral" }: LojaModalProps) {
  const { user } = useAuth();
  const isAdmin = (user?.role || "admin").toLowerCase() === "admin";
  const [activeTab, setActiveTab] = useState<"geral" | "social" | "localizacao" | "evolution">(initialTab);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [nome, setNome] = useState("");
  const [whatsappLoja, setWhatsappLoja] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [googleAdsKeywords, setGoogleAdsKeywords] = useState("");

  // Dados da Loja
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [endereco, setEndereco] = useState("");
  const [linkGoogleMaps, setLinkGoogleMaps] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [horarioSegSex, setHorarioSegSex] = useState("08:00 às 18:00");
  const [horarioSab, setHorarioSab] = useState("08:00 às 12:00");
  const [horarioDomingo, setHorarioDomingo] = useState("Fechado");

  // Evolution API
  const [instanceName, setInstanceName] = useState("");
  const [apikey, setApikey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  // Evolution Connection Status & QR Code state
  const [evoStatus, setEvoStatus] = useState<EvolutionState>("unknown");
  const [evoQrCode, setEvoQrCode] = useState<string | null>(null);
  const [evoOwnerNumber, setEvoOwnerNumber] = useState<string | null>(null);
  const [isEvoLoading, setIsEvoLoading] = useState(false);
  const pollTimerRef = useRef<number | null>(null);

  // Populate data when opening
  useEffect(() => {
    if (!isOpen) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    setActiveTab(initialTab);
    setEvoQrCode(null);
    setEvoStatus("unknown");
    setEvoOwnerNumber(null);

    if (loja) {
      setNome(loja.nome || "");
      setWhatsappLoja(loja.whatsapp_loja || "");
      setAtivo(loja.ativo ?? true);
      setGoogleAdsKeywords(loja.config_json?.google_ads_keywords || "");

      const dados = loja.config_json?.dadosDaLoja || ({} as DadosDaLoja);
      setEmail(dados.email || "");
      setSite(dados.site || "");
      setEndereco(dados.endereco || "");
      setLinkGoogleMaps(dados.linkGoogleMaps || "");
      setInstagram(dados.instagram || "");
      setFacebook(dados.facebook || "");
      setHorarioSegSex(dados.horarioDeFuncionamento?.["seg-sex"] || "08:00 às 18:00");
      setHorarioSab(dados.horarioDeFuncionamento?.sab || "08:00 às 12:00");
      setHorarioDomingo(dados.horarioDeFuncionamento?.domingo || "Fechado");

      const evo = loja.config_json?.evolutionapi || ({} as EvolutionConfig);
      const rawInstance = evo.instanceName?.trim();
      const cleanInstance = (!rawInstance || rawInstance === "loja-undefined" || rawInstance === "loja-null")
        ? `loja-${loja.id}`
        : rawInstance;
      setInstanceName(cleanInstance);
      setApikey(evo.apikey || "");
      
      const rawApiUrl = evo.apiUrl?.trim() || "";
      setApiUrl(rawApiUrl.includes("api.evolution.com.br") ? "" : rawApiUrl);
      
      let initialWebhook = (evo.webhookUrl || "").trim();
      if (initialWebhook && initialWebhook.endsWith("/adswhatsinbound") && !initialWebhook.includes("/app/")) {
        initialWebhook = initialWebhook.replace("/adswhatsinbound", "/app/adswhatsinbound");
      }
      setWebhookUrl(initialWebhook);

      // Só consulta status na Evolution API automaticamente se abrir direto na aba "evolution"
      if (initialTab === "evolution") {
        checkStatus(loja.id);
      }
    } else {
      // Nova Loja defaults
      setNome("");
      setWhatsappLoja("");
      setAtivo(true);
      setEmail("");
      setSite("");
      setEndereco("");
      setLinkGoogleMaps("");
      setInstagram("");
      setFacebook("");
      setHorarioSegSex("08:00 às 18:00");
      setHorarioSab("08:00 às 12:00");
      setHorarioDomingo("Fechado");
      setInstanceName("");
      setApikey("");
      setApiUrl("");
      setWebhookUrl("");
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, loja?.id, initialTab]);

  // Se o usuário clicar manualmente na aba "evolution" e o status ainda não foi consultado, consulta 1 vez
  useEffect(() => {
    if (isOpen && activeTab === "evolution" && loja?.id && evoStatus === "unknown" && !isEvoLoading) {
      checkStatus(loja.id);
    }
  }, [isOpen, activeTab, loja?.id]);

  const checkStatus = async (lojaId?: number) => {
    const id = lojaId || loja?.id;
    if (!id) return;

    setIsEvoLoading(true);
    const res = await callEvolutionApi(id, "STATUS");
    setIsEvoLoading(false);

    if (res.ok && res.state) {
      setEvoStatus(res.state);
      if (res.number) {
        setEvoOwnerNumber(res.number);
        setWhatsappLoja((prev) => (prev ? prev : res.number!));
      }
      if (res.state === "open") {
        setEvoQrCode(null);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      }
    } else {
      setEvoStatus("error");
    }
  };

  const handleConnectQrCode = async (forceRestart = false) => {
    if (!loja?.id) {
      toast.error("Salve a loja primeiro antes de conectar o WhatsApp.");
      return;
    }

    setIsEvoLoading(true);

    if (forceRestart) {
      setEvoQrCode(null);
      toast.loading("Reiniciando sessão e gerando novo QR Code...", { id: "evo-qr-connect" });
      try {
        await callEvolutionApi(loja.id, "RESTART");
        // Aguarda 1.5s para o socket da Evolution API reiniciar
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (err) {
        // Prossegue para tentar a chamada de connect
      }
    } else {
      setEvoQrCode(null);
    }

    const res = await callEvolutionApi(loja.id, "CONNECT");
    setIsEvoLoading(false);
    toast.dismiss("evo-qr-connect");

    if (res.ok) {
      if (res.base64) {
        setEvoQrCode(res.base64);
        setEvoStatus("connecting");
        toast.info(forceRestart ? "Novo QR Code gerado! Aponte o WhatsApp." : "Aponte o WhatsApp no seu celular para o QR Code.");

        // Polling limitado a 18 tentativas (~60s) e pausado se a aba do navegador estiver oculta
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        let attempts = 0;
        const maxAttempts = 18;
        pollTimerRef.current = window.setInterval(async () => {
          if (document.hidden) return;
          attempts += 1;
          if (attempts > maxAttempts) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            setEvoQrCode(null);
            setEvoStatus("close");
            toast.info("Tempo de leitura do QR Code expirou. Clique em Conectar WhatsApp para gerar um novo.");
            return;
          }

          const pollRes = await callEvolutionApi(loja.id, "STATUS");
          if (pollRes.ok && pollRes.state === "open") {
            setEvoStatus("open");
            setEvoQrCode(null);
            if (pollRes.number) {
              setEvoOwnerNumber(pollRes.number);
              setWhatsappLoja(pollRes.number);
            }
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            toast.success("WhatsApp conectado com sucesso!");
            onSaved();
          }
        }, 3500);
      } else if (res.state === "open") {
        setEvoStatus("open");
        setEvoQrCode(null);
        if (res.number) {
          setEvoOwnerNumber(res.number);
          setWhatsappLoja((prev) => (prev ? prev : res.number!));
        }
        toast.success("Instância já está conectada!");
      } else {
        // Se a Evolution API retornou OK mas sem base64 e não está conectado, força reinício
        if (!forceRestart) {
          toast.info("Aguardando renovação do código... Gerando novo QR Code.");
          return handleConnectQrCode(true);
        } else {
          toast.error("A Evolution API não retornou a imagem do QR Code. Tente reiniciar a instância.");
        }
      }
    } else {
      toast.error(res.message || "Erro ao gerar QR Code na Evolution API.");
    }
  };

  const handleDisconnect = async () => {
    if (!loja?.id) return;
    if (!confirm("Deseja realmente desconectar esta instância do WhatsApp?")) return;

    setIsEvoLoading(true);
    const res = await callEvolutionApi(loja.id, "LOGOUT");
    setIsEvoLoading(false);

    if (res.ok) {
      setEvoStatus("close");
      setEvoQrCode(null);
      setEvoOwnerNumber(null);
      toast.success("WhatsApp desconectado.");
      onSaved();
    } else {
      toast.error(res.message || "Erro ao desconectar instância.");
    }
  };

  const handleRestart = async () => {
    if (!loja?.id) return;
    setIsEvoLoading(true);
    const res = await callEvolutionApi(loja.id, "RESTART");
    setIsEvoLoading(false);

    if (res.ok) {
      toast.success("Instância reiniciada. Verificando status...");
      setTimeout(() => checkStatus(loja.id), 2500);
    } else {
      toast.error(res.message || "Erro ao reiniciar instância.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loja?.id && !isAdmin) {
      toast.error("Apenas administradores podem cadastrar novas lojas.");
      return;
    }

    if (!nome.trim()) {
      toast.error("O nome da loja é obrigatório.");
      setActiveTab("geral");
      return;
    }

    const cleanPhone = whatsappLoja.replace(/\D/g, "");
    const formattedPhone = cleanPhone ? (cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`) : "";

    setIsSaving(true);
    try {
      const payload = {
        id: loja?.id,
        nome: nome.trim(),
        whatsapp_loja: formattedPhone,
        ativo,
        google_ads_keywords: googleAdsKeywords.trim(),
        dadosDaLoja: {
          nome: nome.trim(),
          whatsapp_loja: formattedPhone,
          email: email.trim(),
          site: site.trim(),
          endereco: endereco.trim(),
          linkGoogleMaps: linkGoogleMaps.trim(),
          instagram: instagram.trim(),
          facebook: facebook.trim(),
          horarioDeFuncionamento: {
            "seg-sex": horarioSegSex.trim(),
            sab: horarioSab.trim(),
            domingo: horarioDomingo.trim(),
          },
        },
        evolutionapi: {
          instanceName: (!instanceName.trim() || instanceName.trim() === "loja-undefined" || instanceName.trim() === "loja-null")
            ? (loja?.id ? `loja-${loja.id}` : "")
            : instanceName.trim(),
          apikey: apikey.trim(),
          apiUrl: apiUrl.trim().includes("api.evolution.com.br") ? "" : apiUrl.trim(),
          webhookUrl: webhookUrl.trim().endsWith("/adswhatsinbound") && !webhookUrl.trim().includes("/app/")
            ? webhookUrl.trim().replace("/adswhatsinbound", "/app/adswhatsinbound")
            : webhookUrl.trim(),
        },
      };

      const res = await saveLoja(payload);
      if (res.ok) {
        toast.success(loja ? "Loja atualizada com sucesso!" : "Loja cadastrada com sucesso!");
        onSaved();
        onClose();
      } else {
        toast.error(res.message || "Erro ao salvar dados da loja.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao se comunicar com o servidor.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-foreground">
                {loja ? `Editar Loja: ${loja.nome}` : "Cadastrar Nova Loja"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure os dados comerciais e a instância da Evolution API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-border bg-card gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("geral")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "geral"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Dados Gerais
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "social"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Redes Sociais
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("localizacao")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "localizacao"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Localização & Horários
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("evolution")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "evolution"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Evolution API (WhatsApp)
            {evoStatus === "open" && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body / Tab Contents */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GERAL */}
          {activeTab === "geral" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    Nome da Loja <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: AdsWhats Loja Centro"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    WhatsApp Oficial da Loja
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={whatsappLoja}
                      onChange={(e) => setWhatsappLoja(e.target.value)}
                      placeholder="Ex: 5511999998888 (opcional)"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-muted-foreground">
                      Definido automaticamente após conectar o WhatsApp (ou informe manualmente).
                    </span>
                    {evoOwnerNumber && (!whatsappLoja || whatsappLoja !== evoOwnerNumber) && (
                      <button
                        type="button"
                        onClick={() => setWhatsappLoja(evoOwnerNumber)}
                        className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        Usar número conectado ({evoOwnerNumber})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    E-mail Comercial
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@sualoja.com.br"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    Site / Catálogo Online
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                    <input
                      type="url"
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      placeholder="https://sualoja.com.br"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Rastreio Google Ads & Cupons */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Palavras-chave de Anúncios Google (Cupons / Rastreamento)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Identifique automaticamente conversões do Google Ads sem precisar de scripts na Landing Page.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <textarea
                    rows={2}
                    value={googleAdsKeywords}
                    onChange={(e) => setGoogleAdsKeywords(e.target.value)}
                    placeholder="Ex: CUPOM10, VIM PELO GOOGLE, DESCONTO SITE, PROMO GOOGLE"
                    className="w-full px-3.5 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono transition-all"
                  />
                  <div className="text-[10px] text-muted-foreground bg-muted/60 p-2.5 rounded-lg leading-relaxed">
                    💡 <strong>Dica de uso:</strong> Sugira ao cliente colocar no botão do WhatsApp da Landing Page uma mensagem contendo cupons ou códigos (ex: <em>"Olá, vim pelo cupom CUPOM10"</em> ou <em>"Olá! Vim pelo Google"</em>). Separe múltiplos termos por vírgula.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Status de Operação</h4>
                  <p className="text-[11px] text-muted-foreground">Lojas ativas participam do monitoramento e fluxos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: REDES SOCIAIS */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                Essas URLs e identificadores alimentam as informações de perfil da loja e respostas inteligentes.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/sualoja ou @sualoja"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  Facebook
                </label>
                <div className="relative">
                  <Facebook className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/sualoja"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCALIZAÇÃO & HORÁRIOS */}
          {activeTab === "localizacao" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  Endereço Físico Completo
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  Link do Google Maps
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                  <input
                    type="url"
                    value={linkGoogleMaps}
                    onChange={(e) => setLinkGoogleMaps(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  Horários de Atendimento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Segunda a Sexta</label>
                    <input
                      type="text"
                      value={horarioSegSex}
                      onChange={(e) => setHorarioSegSex(e.target.value)}
                      placeholder="08:00 às 18:00"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Sábados</label>
                    <input
                      type="text"
                      value={horarioSab}
                      onChange={(e) => setHorarioSab(e.target.value)}
                      placeholder="08:00 às 12:00"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Domingos / Feriados</label>
                    <input
                      type="text"
                      value={horarioDomingo}
                      onChange={(e) => setHorarioDomingo(e.target.value)}
                      placeholder="Fechado"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EVOLUTION API */}
          {activeTab === "evolution" && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  evoStatus === "open"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : evoStatus === "connecting"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-muted/40 border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      evoStatus === "open"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isEvoLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : evoStatus === "open" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">
                      {evoStatus === "open"
                        ? "WhatsApp Conectado e Ativo"
                        : evoStatus === "connecting"
                        ? "Aguardando Leitura do QR Code..."
                        : evoStatus === "error"
                        ? "Erro ao Comunicar com a Evolution API"
                        : "WhatsApp Desconectado"}
                    </h4>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {evoStatus === "open" && evoOwnerNumber
                        ? `Número Conectado: ${evoOwnerNumber}`
                        : `Instância: ${instanceName || (loja?.id ? `loja-${loja.id}` : "Automática")}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => checkStatus()}
                    disabled={isEvoLoading}
                    className="p-2 rounded-lg bg-background border border-border text-foreground hover:bg-muted text-xs flex items-center gap-1.5 transition-colors"
                    title="Atualizar Status"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isEvoLoading ? "animate-spin" : ""}`} />
                  </button>

                  {evoStatus === "open" ? (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={isEvoLoading}
                      className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Desconectar
                    </button>
                  ) : evoQrCode ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConnectQrCode(true)}
                        disabled={isEvoLoading}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isEvoLoading ? "animate-spin" : ""}`} />
                        Recriar QR Code
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={isEvoLoading}
                        className="px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                        title="Cancelar conexão"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnectQrCode(false)}
                      disabled={isEvoLoading || !loja?.id}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Conectar WhatsApp
                    </button>
                  )}
                </div>
              </div>

              {/* Link Público para o Lojista */}
              {loja?.connect_token && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-primary" />
                      Link Público para Conexão do Lojista
                    </label>
                    <span className="text-[10px] text-muted-foreground">Sem necessidade de login</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/conectar/${loja.connect_token}`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-muted-foreground font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/conectar/${loja.connect_token}`);
                        toast.success("Link copiado para a área de transferência!");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Link
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Envie este link direto para o lojista escanear o QR Code no aparelho dele sem acessar o painel administrativo.
                  </p>
                </div>
              )}

              {/* QR Code Presentation if Available */}
              {evoQrCode && (
                <div className="p-6 rounded-2xl bg-card border-2 border-primary/30 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="inline-block p-3 bg-white rounded-xl shadow-lg border border-border">
                    <img
                      src={evoQrCode.startsWith("data:") ? evoQrCode : `data:image/png;base64,${evoQrCode}`}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 mx-auto object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground">Escaneie o QR Code no seu WhatsApp</h5>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      Abra o WhatsApp no smartphone &gt; Dispositivos Conectados &gt; Conectar um aparelho.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Aguardando leitura e autenticação...</span>
                  </div>

                  {/* Actions right under QR Code */}
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConnectQrCode(true)}
                      disabled={isEvoLoading}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isEvoLoading ? "animate-spin" : ""}`} />
                      Recriar QR Code
                    </button>

                    <button
                      type="button"
                      onClick={handleRestart}
                      disabled={isEvoLoading}
                      className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Reiniciar socket do WhatsApp na Evolution API"
                    >
                      <Power className="w-3.5 h-3.5" />
                      Reiniciar Instância
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 max-w-sm mx-auto text-left flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs">Deu erro ao ler no celular?</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        O QR Code expira rapidamente (30 a 40s). Se o WhatsApp avisar falha, clique em <strong>Recriar QR Code</strong> para resetar a sessão e gerar um código novo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Evolution Configuration Fields */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-foreground">Credenciais da Instância</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Nome da Instância</label>
                    <input
                      type="text"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      placeholder={loja?.id ? `loja-${loja.id}` : "loja-1"}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">Padrão: loja-ID</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Evolution API Key</label>
                    <input
                      type="password"
                      value={apikey}
                      onChange={(e) => setApikey(e.target.value)}
                      placeholder="Deixe em branco para usar a chave padrão"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">URL Base Evolution API</label>
                    <input
                      type="url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="https://whats.seudominio.com (padrão)"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Webhook URL (Inbound)</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.seudominio.com/app/adswhatsinbound (padrão)"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">Padrão: herdado das configurações do servidor</span>
                  </div>
                </div>

                {loja?.id && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleRestart}
                      disabled={isEvoLoading}
                      className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reiniciar Instância
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando Loja...
                </>
              ) : (
                "Salvar Loja"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
