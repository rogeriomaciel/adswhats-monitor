export type UserRole = "admin" | "operador";

export interface User {
  id: number;
  user_id?: number;
  nome: string;
  email: string;
  whatsapp: string;
  avatar_url?: string;
  role: UserRole | string;
  ativo?: boolean;
  created_at?: string;
  ultimo_login?: string;
}

export interface SaveUserPayload {
  id?: number;
  nome: string;
  email: string;
  whatsapp: string;
  password?: string;
  role: UserRole;
  ativo: boolean;
  avatar_url?: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface LoginResult {
  ok: boolean;
  access_token?: string;
  user?: User;
  message?: string;
}
