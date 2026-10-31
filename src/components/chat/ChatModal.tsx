import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getChatMessages } from "@/lib/api";
import { Pessoa } from "@/types/contato";
import {
  X,
  Phone,
  Store,
  Sparkles,
  ExternalLink,
  Volume2,
  FileText,
  Image as ImageIcon,
  Clock,
  Loader2,
  RefreshCw,
  MessageSquare,
  Search,
} from "lucide-react";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  contato: Pessoa | null;
}

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

function formatTime(isoString?: string) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDate(isoString?: string) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
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

export function ChatModal({ isOpen, onClose, contato }: ChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["chat", contato?.id],
    queryFn: () => getChatMessages(contato!.id, contato!.loja_id),
    enabled: isOpen && Boolean(contato?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: false, // Tempo real gerenciado via Pusher (elimina polling de 5s)
    refetchIntervalInBackground: false,
  });

  const mensagens = data?.mensagens || [];
  const ads = contato?.metadata_json;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (mensagens.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens.length]);

  if (!isOpen || !contato) return null;

  const isInstagram = contato.origem === "instagram_ads";
  const isFacebook = contato.origem === "facebook_ads";
  const isGoogle = contato.origem === "google_ads" || ads?.canal === "google" || contato.ultimo_criativo_canal === "google";
  const isAd = isInstagram || isFacebook || isGoogle || ads?.isAd;

  const adThumbnail = contato.ultimo_criativo_media_url || ads?.mediaUrl;
  const adLink = contato.ultimo_criativo_source_url || ads?.sourceUrl || (!isGoogle && (contato.ultimo_criativo_ad_id || ads?.adId) ? `https://www.facebook.com/ads/library/?id=${contato.ultimo_criativo_ad_id || ads?.adId}` : null);
  const adTitle = contato.ultimo_criativo_titulo || ads?.adTitulo || (isGoogle ? "Anúncio Google Ads" : "Anúncio Meta");
  const adTema = contato.ultimo_criativo_tema || ads?.adTema;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {contato.nome?.substring(0, 2).toUpperCase() || "WA"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-display text-foreground leading-tight">
                  {contato.nome || "Contato WhatsApp"}
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">ID #{contato.id}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  {formatPhone(contato.whatsapp)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Store className="w-3 h-3 text-muted-foreground" />
                  {contato.loja_nome || `Loja #${contato.loja_id}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Atualizar mensagens"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ad Attribution Banner (Meta Ads ou Google Ads) */}
        {isAd && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-primary/10 border-b border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {adThumbnail && (
                <img
                  src={adThumbnail}
                  alt={adTitle}
                  className="w-8 h-8 rounded-md object-cover border border-border shrink-0 shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] shrink-0 ${
                  isGoogle
                    ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                    : isFacebook
                    ? "bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-600/30"
                    : "bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-500/30"
                }`}
              >
                {isGoogle ? <Search className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                {isGoogle ? "Google Ads" : isFacebook ? "Facebook Ads" : "Instagram Ads"}
              </span>
              {adTitle && (
                <span className="font-semibold text-foreground truncate max-w-xs md:max-w-md">
                  {adTitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {adTema && (
                <span className="text-[11px] text-muted-foreground italic truncate max-w-xs hidden lg:inline">
                  &ldquo;{adTema}&rdquo;
                </span>
              )}

              {adLink && (
                <a
                  href={adLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background/80 hover:bg-background text-foreground text-[11px] font-medium border border-border shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-primary" />
                  <span>Ver Anúncio</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Chat Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-muted/20">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Carregando histórico do chat...</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                Nenhuma mensagem registrada ainda para este contato.
              </p>
            </div>
          ) : (
            mensagens.map((msg) => {
              const isInbound = msg.direcao === "inbound";
              const isAudio = msg.tipo === "audio";
              const isImage = msg.tipo === "imagem";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isInbound ? "items-start" : "items-end"} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm text-xs leading-relaxed ${
                      isInbound
                        ? "bg-card border border-border text-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    }`}
                  >
                    {/* Ad Attribution badge on this specific message */}
                    {(msg.is_ad || msg.criativo_titulo) && (
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-lg bg-pink-500/15 text-pink-700 dark:text-pink-300 text-[10px] font-semibold border border-pink-500/20">
                        <Sparkles className="w-3 h-3 text-pink-500 shrink-0" />
                        <span className="truncate">
                          Anúncio: {msg.criativo_titulo || "Meta Ads"}
                          {msg.criativo_canal ? ` (${msg.criativo_canal})` : ""}
                        </span>
                      </div>
                    )}

                    {/* SLA response time badge on attendant replies */}
                    {msg.tempo_resposta_segundos !== null && msg.tempo_resposta_segundos !== undefined && msg.tempo_resposta_segundos > 0 && (
                      <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-[10px] font-semibold">
                        <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>SLA de Resposta: {formatSLA(msg.tempo_resposta_segundos)}</span>
                      </div>
                    )}

                    {/* Audio tag badge if transcribed */}
                    {isAudio && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold opacity-90">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Áudio Transcrito:</span>
                      </div>
                    )}

                    {/* Image indicator */}
                    {isImage && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold opacity-90">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Imagem</span>
                      </div>
                    )}

                    {/* Message content */}
                    <p className="whitespace-pre-wrap select-text">{msg.conteudo}</p>

                    {/* Timestamp */}
                    <div
                      className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                        isInbound ? "text-muted-foreground" : "text-primary-foreground/75"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatDate(msg.created_at)}</span>
                      <span>{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Sincronização em tempo real (Evolution API)
          </span>

          <span className="text-[11px] font-mono">
            Total: {mensagens.length} mensagens gravadas
          </span>
        </div>
      </div>
    </div>
  );
}
