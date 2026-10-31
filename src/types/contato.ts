export type OrigemContato = "organico" | "instagram_ads" | "facebook_ads" | "google" | string;

export interface DadosAds {
  isAd?: boolean;
  canal?: string;
  conversaoOrigem?: string;
  adId?: string;
  adTitulo?: string;
  adTema?: string;
  ctwaClid?: string;
}

export interface Criativo {
  id: number;
  criativo_id?: number;
  loja_id: number;
  loja_nome?: string;
  ad_id: string;
  titulo?: string;
  tema?: string;
  canal?: string;
  media_url?: string;
  source_url?: string;
  total_mensagens: number;
  total_pessoas_unicas: number;
  total_respondidas?: number;
  tempo_medio_segundos?: number;
  primeira_mensagem_at?: string;
  ultima_mensagem_at?: string;
  created_at?: string;
  conversas_profundas?: number;
  curiosos_1msg?: number;
}

export interface Pessoa {
  id: number;
  loja_id: number;
  loja_nome?: string;
  nome?: string;
  whatsapp: string;
  picture_url?: string;
  status: string;
  origem: OrigemContato;
  ultimo_criativo_id?: number;
  ultimo_criativo_titulo?: string;
  ultimo_criativo_tema?: string;
  ultimo_criativo_ad_id?: string;
  ultimo_criativo_canal?: string;
  ultimo_criativo_media_url?: string;
  ultimo_criativo_source_url?: string;
  tempo_medio_resposta_segundos?: number;
  tempo_primeira_resposta_segundos?: number;
  total_mensagens_ad?: number;
  metadata_json?: {
    isAd?: boolean;
    canal?: string;
    adId?: string;
    adTitulo?: string;
    adTema?: string;
    ctwaClid?: string;
    [key: string]: any;
  };
  total_mensagens: number;
  last_message_at?: string;
  created_at?: string;
  ultima_mensagem?: string;
  ultimo_tipo_mensagem?: string;
  ultima_direcao?: "inbound" | "outbound";
}

export interface Mensagem {
  id: number;
  loja_id: number;
  pessoa_id: number;
  message_id: string;
  direcao: "inbound" | "outbound";
  tipo: "texto" | "audio" | "imagem" | "video" | "documento" | string;
  conteudo: string;
  midia_url?: string;
  media_url?: string;
  status_entrega?: string;
  is_ad?: boolean;
  criativo_id?: number;
  criativo_ad_id?: string;
  criativo_titulo?: string;
  criativo_tema?: string;
  criativo_canal?: string;
  criativo_media_url?: string;
  criativo_source_url?: string;
  ctwa_clid?: string;
  tempo_resposta_segundos?: number | null;
  respondida_em?: string | null;
  respondida_por_mensagem_id?: string | null;
  metadata_json?: Record<string, any>;
  timestamp_mensagem?: string;
  created_at: string;
}

export interface ChatResponse {
  ok: boolean;
  contato: Pessoa;
  mensagens: Mensagem[];
}

export interface ResumoMetricasSLA {
  total_mensagens: number;
  total_inbound: number;
  total_outbound: number;
  total_mensagens_ad: number;
  total_respondidas: number;
  total_pendentes: number;
  tempo_medio_segundos: number;
  tempo_mediano_segundos: number;
  taxa_resposta_pct: number;
  leads_esfriando?: number;
  leads_ad_sem_resposta?: number;
  total_leads_ad?: number;
}

export interface LojaPerformance {
  loja_id: number;
  loja_nome: string;
  total_mensagens: number;
  total_pessoas: number;
  total_ads: number;
  total_respondidas: number;
  total_pendentes?: number;
  leads_esfriando?: number;
  tempo_medio_segundos: number;
  taxa_resposta_pct?: number;
  score_saude?: number;
}

export interface PessoaAudit {
  pessoa_id: number;
  loja_id: number;
  loja_nome: string;
  nome?: string;
  whatsapp: string;
  origem: string;
  ultimo_criativo_titulo?: string;
  ultimo_criativo_ad_id?: string;
  ultimo_criativo_media_url?: string;
  ultimo_criativo_canal?: string;
  total_mensagens: number;
  total_pendentes?: number;
  leads_esfriando?: number;
  tempo_medio_segundos: number;
  ultima_mensagem_at?: string;
  created_at?: string;
}

export interface MetricasSLAResponse {
  ok: boolean;
  resumo: ResumoMetricasSLA;
  por_criativo: Criativo[];
  por_loja: LojaPerformance[];
  por_periodo: {
    dia: string;
    total_inbound: number;
    total_outbound: number;
    total_ads: number;
    tempo_medio_segundos: number;
  }[];
  por_pessoa: PessoaAudit[];
}
