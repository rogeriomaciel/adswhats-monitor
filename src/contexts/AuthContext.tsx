import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, userData: User) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  isAuthenticated: false,
});

/** Decodifica payload JWT no frontend para verificação de expiração */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && typeof payload.exp === "number") {
      if (Date.now() / 1000 > payload.exp) return null; // Expirado
    }
    return payload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("adswhats_token");
    const storedUser = localStorage.getItem("adswhats_user");

    if (storedToken && storedUser) {
      const decoded = decodeJwtPayload(storedToken);
      if (decoded) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("adswhats_token");
          localStorage.removeItem("adswhats_user");
        }
      } else {
        localStorage.removeItem("adswhats_token");
        localStorage.removeItem("adswhats_user");
      }
    }
    setLoading(false);
  }, []);

  const signIn = (newToken: string, userData: User) => {
    localStorage.setItem("adswhats_token", newToken);
    localStorage.setItem("adswhats_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const signOut = () => {
    localStorage.removeItem("adswhats_token");
    localStorage.removeItem("adswhats_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
