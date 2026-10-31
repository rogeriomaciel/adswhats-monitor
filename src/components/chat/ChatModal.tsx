import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getChatMessages } from "@/lib/api";
import { Pessoa, Mensagem } from "@/types/contato";
import {
  X,
  Phone,
  Store,
  Sparkles,
  ExternalLink,
  Volume2,
  Image as ImageIcon,
  Clock,
  Loader2,
  RefreshCw,
  MessageSquare,
  Search,
  Play,
  Pause,
  Bot,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  CornerDownRight,
  ShieldCheck,
} from "lucide-react";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  contato: Pessoa | null;
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

// Custom Audio Player with Speed Control & AI Transcription Toggle
function CustomAudioPlayer({
  mediaUrl,
  transcription,
  isInbound,
}: {
  mediaUrl?: string | null;
  transcription?: string | null;
  isInbound: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscription, setShowTranscription] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const cycleSpeed = () => {
    const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatAudioTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="space-y-2 mt-1">
      {mediaUrl && (
        <audio ref={audioRef} src={mediaUrl} preload="metadata" className="hidden" />
      )}

      {/* Modern Audio Player Bar */}
      <div
        className={`flex items-center gap-2 p-2 rounded-xl ${
          isInbound
            ? "bg-muted/70 border border-border/80 text-foreground"
            : "bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-foreground"
        }`}
      >
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 touch-manipulation ${
            isInbound
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-emerald-950 shadow-xs"
          }`}
          title={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col justify-center min-w-[130px] px-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex items-center justify-between text-[10px] mt-1 font-mono text-muted-foreground">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all touch-manipulation min-h-[28px] bg-background/80 border border-border text-foreground hover:bg-muted"
          title="Alterar velocidade"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Transcription drawer */}
      {transcription && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setShowTranscription(!showTranscription)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bot className="w-3 h-3" />
            <span>{showTranscription ? "Ocultar Transcrição de Áudio" : "Ver Transcrição de Áudio"}</span>
          </button>

          {showTranscription && (
            <div className="p-2.5 rounded-lg text-xs leading-relaxed border bg-background/80 border-border/80 text-foreground">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold mb-1 opacity-70">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Transcrição Automática:</span>
              </div>
              <p className="whitespace-pre-wrap select-text italic font-sans">{transcription}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Slide-over Sheet Drawer (Split-View / Preservação de Contexto)
 * Substitui o modal invasivo de centro por uma gaveta lateral que preserva a visão da tabela ao fundo.
 */
export function ChatModal({ isOpen, onClose, contato }: ChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });

  const mensagens: Mensagem[] = data?.mensagens || [];
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
  const isGoogle =
    contato.origem === "google_ads" ||
    ads?.canal === "google" ||
    contato.ultimo_criativo_canal === "google";
  const isAd = isInstagram || isFacebook || isGoogle || ads?.isAd;

  const adThumbnail = contato.ultimo_criativo_media_url || ads?.mediaUrl;
  const adLink =
    contato.ultimo_criativo_source_url ||
    ads?.sourceUrl ||
    (!isGoogle && (contato.ultimo_criativo_ad_id || ads?.adId)
      ? `https://www.facebook.com/ads/library/?id=${contato.ultimo_criativo_ad_id || ads?.adId}`
      : null);
  const adTitle =
    contato.ultimo_criativo_titulo ||
    ads?.adTitulo ||
    (isGoogle ? "Anúncio Google Ads" : "Anúncio Meta");
  const adTema = contato.ultimo_criativo_tema || ads?.adTema;

  // SLA Analysis
  const primeiraMsgRespondida = mensagens.find(
    (m) => m.direcao === "inbound" && m.tempo_resposta_segundos && m.tempo_resposta_segundos > 0
  );
  const slaSegundos =
    primeiraMsgRespondida?.tempo_resposta_segundos ||
    contato.tempo_medio_resposta_segundos;

  const ultimaMsg = mensagens.length > 0 ? mensagens[mensagens.length - 1] : null;
  const aguardandoResposta = ultimaMsg
    ? ultimaMsg.direcao === "inbound"
    : contato.ultima_direcao === "inbound";

  const slaStatus = aguardandoResposta
    ? "sem_resposta"
    : slaSegundos && slaSegundos <= 300
    ? "otimo"
    : slaSegundos && slaSegundos <= 900
    ? "alerta"
    : slaSegundos
    ? "critico"
    : "respondido";

  // Resumo Contextual de Inteligência Artificial
  const totalMsgs = mensagens.length;
  const temInbound = mensagens.some((m) => m.direcao === "inbound");
  const temOutbound = mensagens.some((m) => m.direcao === "outbound");

  return (
    <>
      {/* Backdrop transparente sutil para fechamento com clique fora */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Sheet Drawer (Padrão Ouro Linear / Stripe) */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] md:w-[580px] lg:w-[620px] bg-card border-l border-border/80 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center text-primary font-bold text-sm shrink-0 shadow-xs">
              {contato.nome?.substring(0, 2).toUpperCase() || "WA"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-display text-foreground leading-tight truncate">
                  {contato.nome || "Contato WhatsApp"}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border shrink-0">
                  #{contato.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-mono font-medium">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  {formatPhone(contato.whatsapp)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium truncate">
                  <Store className="w-3 h-3 text-muted-foreground" />
                  {contato.loja_nome || `Loja #${contato.loja_id}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
              title="Atualizar mensagens"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="text-[10px] font-mono opacity-60 hidden sm:inline">ESC</span>
            </button>
          </div>
        </div>

        {/* Context Bar Unificado (SLA + Origem do Anúncio + Contagem) */}
        <div className="px-5 py-2.5 border-b border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Status SLA */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-medium">SLA:</span>
            {slaStatus === "otimo" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold text-[11px]">
                <Zap className="w-3 h-3" />
                Excelente ({formatSLA(slaSegundos)})
              </span>
            )}
            {slaStatus === "alerta" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold text-[11px]">
                <Clock className="w-3 h-3" />
                Atenção ({formatSLA(slaSegundos)})
              </span>
            )}
            {slaStatus === "critico" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-semibold text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                Estourado ({formatSLA(slaSegundos)})
              </span>
            )}
            {slaStatus === "respondido" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                {slaSegundos && slaSegundos > 0 ? `Atendido (${formatSLA(slaSegundos)})` : "Respondido"}
              </span>
            )}
            {slaStatus === "sem_resposta" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500 font-semibold text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                Aguardando Resposta
              </span>
            )}
          </div>

          {/* Origem do Anúncio & Mensagens */}
          <div className="flex items-center gap-2.5 ml-auto">
            {isAd && (
              <div className="flex items-center gap-1.5 max-w-[260px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted border border-border text-foreground shrink-0">
                  {isGoogle ? <Search className="w-2.5 h-2.5 text-blue-400" /> : <Sparkles className="w-2.5 h-2.5 text-pink-400" />}
                  {isGoogle ? "Google Ads" : "Meta Ads"}
                </span>
                {adTitle && (
                  <span className="text-[11px] text-muted-foreground truncate" title={adTitle}>
                    {adTitle}
                  </span>
                )}
                {adLink && (
                  <a
                    href={adLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Ver Anúncio"
                  >
                    <ExternalLink className="w-3 h-3 text-primary" />
                  </a>
                )}
              </div>
            )}

            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
              {totalMsgs} {totalMsgs === 1 ? "msg" : "msgs"}
            </span>
          </div>
        </div>

        {/* Chat Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3.5 bg-muted/15">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Carregando histórico do atendimento...</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="py-24 text-center space-y-3 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs text-muted-foreground">
                Nenhuma mensagem registrada ainda para este contato na base do WhatsApp.
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
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-2xs text-xs leading-relaxed ${
                      isInbound
                        ? "bg-card border border-border/80 text-foreground rounded-tl-xs"
                        : "bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-foreground rounded-tr-xs"
                    }`}
                  >
                    {/* Anúncio disparador da mensagem */}
                    {(msg.is_ad || msg.criativo_titulo) && (
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium border border-border/70">
                        <Sparkles className="w-3 h-3 text-pink-500 shrink-0" />
                        <span className="truncate">
                          Origem: {msg.criativo_titulo || "Meta Ads"}
                        </span>
                      </div>
                    )}

                    {/* Imagem */}
                    {isImage && (
                      <div className="mb-2">
                        {(msg.media_url || msg.midia_url) ? (
                          <img
                            src={msg.media_url || msg.midia_url}
                            alt="Mídia da mensagem"
                            className="rounded-xl max-h-56 object-cover border border-border/60"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold opacity-90">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Mídia de imagem</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Player de Áudio com Velocidades e Transcrição */}
                    {isAudio ? (
                      <CustomAudioPlayer
                        mediaUrl={msg.media_url || msg.midia_url}
                        transcription={msg.conteudo}
                        isInbound={isInbound}
                      />
                    ) : (
                      /* Mensagem de Texto */
                      <p className="whitespace-pre-wrap select-text font-normal">{msg.conteudo}</p>
                    )}

                    {/* Timestamp & Recibo & SLA integrado */}
                    <div className="text-[10px] mt-1.5 flex items-center justify-end gap-1.5 font-mono text-muted-foreground">
                      <span>{formatDate(msg.created_at)}</span>
                      <span>{formatTime(msg.created_at)}</span>
                      {!isInbound &&
                        msg.tempo_resposta_segundos !== null &&
                        msg.tempo_resposta_segundos !== undefined &&
                        msg.tempo_resposta_segundos > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Clock className="w-2.5 h-2.5" />
                            SLA {formatSLA(msg.tempo_resposta_segundos)}
                          </span>
                        )}
                      {!isInbound && <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 border-t border-border/80 bg-card/50 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ao vivo
          </span>

          <span className="text-[11px] font-mono">
            {mensagens.length} mensagens auditadas
          </span>
        </div>
      </aside>
    </>
  );
}
