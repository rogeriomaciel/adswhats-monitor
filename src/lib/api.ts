import { LoginPayload, LoginResult, User, SaveUserPayload } from "@/types/auth";
import { Loja, DadosDaLoja, EvolutionConfig, EvolutionApiResult, EvolutionState } from "@/types/loja";
import { Pessoa, ChatResponse, MetricasSLAResponse } from "@/types/contato";

const API_BASE = (import.meta.env.VITE_API_URL as string || "").replace(/\/+$/, "");

/** Headers padrão com Bearer Token de autorização */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("adswhats_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Login com E-mail ou WhatsApp + Senha */
export async function loginWithCredentials(payload: LoginPayload): Promise<LoginResult> {
  const url = `${API_BASE}/adswhatslogin`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({
      ok: false,
      message: `Erro de comunicação HTTP ${res.status}`,
    }));

    const result: LoginResult = Array.isArray(data) ? data[0] : data;
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro de conexão com o servidor.";
    return { ok: false, message };
  }
}

/** Barramento central de ações da API (/paneladswhats) */
export async function callPanelAction<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  const url = `${API_BASE}/paneladswhats`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    throw new Error(`Erro na ação "${action}": HTTP ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

/** Buscar todas as lojas */
export async function getLojas(): Promise<Loja[]> {
  const res = await callPanelAction<{ ok: boolean; lojas?: Loja[] }>("GET-LOJAS", {});
  return res.lojas || [];
}

/** Salvar ou Atualizar Loja */
export async function saveLoja(lojaData: {
  id?: number;
  nome: string;
  whatsapp_loja: string;
  ativo?: boolean;
  dadosDaLoja?: DadosDaLoja;
  evolutionapi?: EvolutionConfig;
}): Promise<{ ok: boolean; loja?: Loja; message?: string }> {
  return await callPanelAction("SAVE-LOJA", lojaData);
}

/** Ações da Evolution API (STATUS, CONNECT, LOGOUT, RESTART) */
export async function callEvolutionApi(
  lojaId: number,
  evolutionAction: "STATUS" | "CONNECT" | "LOGOUT" | "RESTART"
): Promise<EvolutionApiResult> {
  try {
    const res = await callPanelAction<{
      ok: boolean;
      data?: any;
      message?: string;
      ownerPhone?: string;
      number?: string;
    }>("EVOLUTION-API", {
      loja_id: lojaId,
      evolutionAction,
    });

    if (!res.ok) {
      return { ok: false, message: res.message || "Erro retornado pela Evolution API", state: "error" };
    }

    const raw = res.data || {};
    const item = Array.isArray(raw) ? raw[0] : raw;
    const rawState =
      item?.connectionStatus ||
      item?.instance?.state ||
      item?.instance?.status ||
      item?.status ||
      item?.state ||
      "";
    const stateStr = String(rawState).toLowerCase().trim();

    let state: EvolutionState = "unknown";
    if (stateStr === "open" || stateStr === "connected") {
      state = "open";
    } else if (stateStr === "connecting") {
      state = "connecting";
    } else if (stateStr === "close" || stateStr === "closed" || stateStr === "disconnected") {
      state = "close";
    }

    const base64 = item?.base64 || item?.qrcode?.base64 || undefined;
    const code = item?.code || item?.qrcode?.code || undefined;
    const rawOwner =
      res.number ||
      res.ownerPhone ||
      item?.number ||
      item?.ownerJid ||
      item?.instance?.owner ||
      item?.instance?.ownerJid ||
      item?.owner;
    const cleanOwner = rawOwner ? String(rawOwner).split("@")[0].split(":")[0].replace(/\D/g, "") : undefined;
    const owner = cleanOwner ? (cleanOwner.startsWith("55") ? cleanOwner : `55${cleanOwner}`) : undefined;
    const profilePicUrl = item?.profilePicUrl || item?.instance?.profilePicUrl || undefined;

    return {
      ok: true,
      state,
      base64,
      code,
      number: owner || undefined,
      profilePicUrl,
      data: item,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro na requisição à API";
    return { ok: false, message, state: "error" };
  }
}

/** Buscar contatos monitorados com filtros */
export async function getContatos(filters: {
  loja_id?: number | null;
  search?: string;
  origem?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Pessoa[]> {
  const res = await callPanelAction<{ ok: boolean; contatos?: Pessoa[] }>("GET-CONTACTS", filters);
  return res.contatos || [];
}

/** Buscar histórico de chat de um contato específico */
export async function getChatMessages(pessoaId: number, lojaId?: number): Promise<ChatResponse> {
  return await callPanelAction<ChatResponse>("GET-CHAT-MESSAGES", {
    pessoa_id: pessoaId,
    loja_id: lojaId,
  });
}

/** Buscar métricas de SLA e Criativos com filtros por loja e período */
export async function getMetricsSLA(params: {
  loja_id?: number | null;
  dias?: number;
} = {}): Promise<MetricasSLAResponse> {
  return await callPanelAction<MetricasSLAResponse>("GET-METRICS-SLA", params);
}

/** Buscar todos os usuários do painel (apenas Admin) */
export async function getUsuarios(): Promise<User[]> {
  const res = await callPanelAction<{ ok: boolean; usuarios?: User[]; message?: string }>("GET-USERS", {});
  if (!res.ok) {
    throw new Error(res.message || "Não foi possível carregar os usuários.");
  }
  return res.usuarios || [];
}

/** Criar ou atualizar usuário do painel (apenas Admin) */
export async function saveUsuario(
  userData: SaveUserPayload
): Promise<{ ok: boolean; usuario?: User; message?: string }> {
  return await callPanelAction("SAVE-USER", userData);
}

export interface PublicConnectResult {
  ok: boolean;
  loja_nome?: string;
  state?: "open" | "connecting" | "close" | "unknown";
  number?: string;
  base64?: string;
  code?: string;
  error?: string;
}

/** Chamada pública para conectar WhatsApp da Loja via token exclusivo do Lojista */
export async function callPublicConnect(
  token: string,
  action: "STATUS" | "CONNECT" | "RESTART" = "CONNECT"
): Promise<PublicConnectResult> {
  const url = `${API_BASE}/adswhatsconnect`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });

    const text = await res.text();
    if (!text || !text.trim()) {
      return {
        ok: false,
        error: `O servidor n8n encerrou com status HTTP ${res.status}, mas corpo vazio (0 bytes).`,
      };
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: `Resposta inválida do servidor (HTTP ${res.status}): ${text.slice(0, 120)}`,
      };
    }

    const result: PublicConnectResult = Array.isArray(data) ? data[0] : data;
    if (!res.ok && !result.error) {
      result.error = data?.message || data?.error || `Erro HTTP ${res.status}`;
    }
    return result;
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Erro de conexão com o servidor.";
    return { ok: false, error };
  }
}

