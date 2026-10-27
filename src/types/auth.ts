export interface User {
  id: number;
  user_id?: number;
  nome: string;
  email: string;
  whatsapp: string;
  avatar_url?: string;
  role: string;
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
