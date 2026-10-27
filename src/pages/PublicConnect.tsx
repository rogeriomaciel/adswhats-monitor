import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { callPublicConnect, PublicConnectResult } from "@/lib/api";
import {
  CheckCircle2,
  AlertTriangle,
  QrCode,
  RefreshCw,
  Loader2,
  Smartphone,
  ShieldCheck,
  Check,
  Phone,
  ArrowRight,
  ExternalLink,
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

export default function PublicConnect() {
  const { token } = useParams<{ token: string }>();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<PublicConnectResult | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [activeOsTab, setActiveOsTab] = useState<"android" | "iphone">("android");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para consultar status ou solicitar conexão
  const fetchStatus = async (
    action: "STATUS" | "CONNECT" | "RESTART" = "STATUS",
    silent = false,
    isInitialOrManual = false
  ) => {
    if (!token) return;
    if (!silent) setIsRefreshing(true);
    setQrCodeError(null);

    try {
      const res = await callPublicConnect(token, action);

      setData((prev) => ({
        ...res,
        // Preserva o QR code se a checagem de status não trouxer base64 e o estado ainda não for open
        base64: res.base64 || (res.state !== "open" ? prev?.base64 : undefined),
        code: res.code || (res.state !== "open" ? prev?.code : undefined),
      }));

      if (res.base64) {
        setQrCode(res.base64);
        setQrCodeError(null);
      }

      if (res.ok && res.state === "open") {
        setQrCode(null);
        if (data?.state !== "open") {
          toast.success("WhatsApp conectado com sucesso!");
        }
      } else if (res.ok && res.state !== "open" && !res.base64 && isInitialOrManual && action === "CONNECT") {
        // Se a Evolution API retornou OK mas sem base64 e não está conectado, força reinício automático
        setTimeout(() => {
          fetchStatus("RESTART", silent, false);
        }, 1200);
      } else if (!res.base64 && !qrCode && action === "RESTART") {
        setQrCodeError("Aguardando nova imagem do QR Code. Clique em 'Recarregar QR Code' novamente em instantes.");
      }
    } catch {
      if (!silent) {
        toast.error("Erro ao verificar status do WhatsApp.");
      }
    } finally {
      if (!silent) setIsRefreshing(false);
      setLoadingInitial(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    if (!token) {
      setLoadingInitial(false);
      return;
    }

    // Primeiro faz um CONNECT
    fetchStatus("CONNECT", false, true);

    // Polling a cada 4 segundos apenas checando STATUS
    pollIntervalRef.current = setInterval(() => {
      fetchStatus("STATUS", true, false);
    }, 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [token]);

  // Se o estado mudar para 'open', para o polling
  useEffect(() => {
    if (data?.state === "open" && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [data?.state]);

  const handleManualRefresh = () => {
    setQrCode(null);
    setQrCodeError(null);
    fetchStatus("RESTART", false, true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header / Brand */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 font-display">
              AdsWhats <span className="text-emerald-400 font-mono text-[11px] font-semibold">CONNECT</span>
            </h1>
            <p className="text-[11px] text-slate-400">Canal Seguro de Conexão WhatsApp</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Conexão Criptografada</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 z-10">
        {loadingInitial ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">Verificando conexão da loja...</p>
              <p className="text-xs text-slate-400">Aguarde alguns segundos enquanto preparamos a sessão.</p>
            </div>
          </div>
        ) : !data || !data.ok ? (
          /* Error or Invalid Token */
          <div className="py-12 flex flex-col items-center text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-lg font-bold text-white">Link de Conexão Indisponível</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {data?.error || "Este link de conexão é inválido, expirou ou a loja correspondente foi desativada."}
              </p>
              <p className="text-xs text-slate-500 pt-2">
                Por favor, solicite ao administrador da sua conta um novo link de conexão atualizado.
              </p>
            </div>

            <button
              onClick={() => handleManualRefresh()}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar Novamente
            </button>
          </div>
        ) : data.state === "open" ? (
          /* Connected State */
          <div className="py-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full shadow">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                WhatsApp Conectado
              </span>
              <h2 className="text-xl font-bold text-white font-display pt-1">
                {data.loja_nome || "Loja Conectada"}
              </h2>
              {data.number && (
                <div className="inline-flex items-center gap-1.5 text-sm font-mono text-emerald-300 bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800 mt-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatPhone(data.number)}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left space-y-2 max-w-md w-full">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 animate-ping" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  O monitor de anúncios e contatos está ativo e sincronizado em tempo real.
                </p>
              </div>
              <p className="text-[11px] text-slate-500 pl-4.5">
                Você pode fechar esta página com segurança. Não é necessário escanear novamente.
              </p>
            </div>

            <button
              onClick={() => fetchStatus("STATUS", false)}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Verificar Conexão
            </button>
          </div>
        ) : (
          /* Connecting / Disconnected - Show QR Code */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header info inside card */}
            <div className="text-center space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                {data.loja_nome || "WhatsApp da Loja"}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                Conecte seu WhatsApp Comercial
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Escaneie o QR Code abaixo com o aparelho que atende os clientes da sua loja.
              </p>
            </div>

            {/* QR Code Presentation Box */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-4">
              <div className="relative inline-block p-4 bg-white rounded-2xl shadow-xl shadow-black/40">
                {qrCode || data?.base64 ? (
                  <img
                    src={(qrCode || data?.base64)!.startsWith("data:") ? (qrCode || data?.base64)! : `data:image/png;base64,${qrCode || data?.base64}`}
                    alt="WhatsApp QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                  />
                ) : qrCodeError ? (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center text-slate-700 gap-3 p-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-800 text-center">{qrCodeError}</span>
                  </div>
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center text-slate-700 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <span className="text-xs font-semibold">Gerando QR Code...</span>
                  </div>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Aguardando leitura do WhatsApp...</span>
              </div>

              <div className="pt-1 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  Recarregar QR Code
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions Tabs */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-300">Como escanear:</h3>

                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveOsTab("android")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      activeOsTab === "android"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Android
                  </button>
                  <button
                    onClick={() => setActiveOsTab("iphone")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      activeOsTab === "iphone"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    iPhone (iOS)
                  </button>
                </div>
              </div>

              {activeOsTab === "android" ? (
                <ol className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Abra o <strong>WhatsApp</strong> no celular do estabelecimento.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Selecione <strong>Aparelhos conectados</strong> e depois <strong>Conectar um aparelho</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>Aponte a câmera para o <strong>QR Code acima</strong>.</span>
                  </li>
                </ol>
              ) : (
                <ol className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Abra o <strong>WhatsApp</strong> no iPhone do estabelecimento.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Toque em <strong>Configurações (⚙)</strong> no canto inferior direito.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Selecione <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>Aponte a câmera para o <strong>QR Code acima</strong>.</span>
                  </li>
                </ol>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Notice */}
      <div className="w-full max-w-xl mx-auto text-center mt-6 z-10 text-[11px] text-slate-500">
        AdsWhats Monitor • Plataforma de Gestão e Monitoramento de Anúncios WhatsApp
      </div>
    </div>
  );
}
