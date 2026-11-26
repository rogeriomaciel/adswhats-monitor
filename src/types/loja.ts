export interface HorarioFuncionamento {
  "seg-sex"?: string;
  sab?: string;
  domingo?: string;
  exceto?: string;
}

export interface DadosDaLoja {
  nome: string;
  whatsapp_loja: string;
  email?: string;
  site?: string;
  endereco?: string;
  linkGoogleMaps?: string;
  instagram?: string;
  facebook?: string;
  horarioDeFuncionamento?: HorarioFuncionamento;
}

export interface EvolutionConfig {
  instanceName: string;
  apikey?: string;
  hasApiKey?: boolean;
  hasToken?: boolean;
  apiUrl?: string;
  webhookUrl?: string;
}

export interface LojaConfig {
  dadosDaLoja?: DadosDaLoja;
  evolutionapi?: EvolutionConfig;
  google_ads_keywords?: string;
}

export interface Loja {
  id: number;
  nome: string;
  whatsapp_loja: string;
  has_connect_token?: boolean;
  ativo: boolean;
  evolution_status?: "open" | "connecting" | "close" | "unknown";
  deleted_at?: string | null;
  config_json?: LojaConfig;
  total_contatos?: number;
  total_mensagens?: number;
  ultima_mensagem_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Retorna o rótulo real de status da instância da loja na Evolution API */
export function getLojaStatusLabel(loja: Loja): "Online" | "Conectando" | "Offline" | "Pausada" {
  if (!loja.ativo) return "Pausada";
  if (loja.evolution_status === "open") return "Online";
  if (loja.evolution_status === "connecting") return "Conectando";
  return "Offline";
}

export type EvolutionState = "open" | "connecting" | "close" | "disconnected" | "loading" | "error" | "unknown";

export interface EvolutionApiResult {
  ok: boolean;
  state?: EvolutionState;
  base64?: string;
  code?: string;
  number?: string;
  profilePicUrl?: string;
  message?: string;
  data?: any;
}
