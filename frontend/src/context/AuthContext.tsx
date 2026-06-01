import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken } from "../api/http";

type User = { id: number; username: string; role: "ADMIN" | "HR" | "GUEST"; name: string };

const Ctx = createContext<{
  user: User | null;
  refreshUser: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const resp = await api<{ user: User }>("/api/auth/me", "GET", undefined, true);
      setUser(resp.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = useMemo(() => ({ user, refreshUser }), [user]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}