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
  connect_token?: string;
  ativo: boolean;
  config_json?: LojaConfig;
  total_contatos?: number;
  total_mensagens?: number;
  created_at?: string;
  updated_at?: string;
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
