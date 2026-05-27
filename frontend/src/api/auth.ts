import { api } from "./http";

export type LoginResponse = {
  token: string;
  user: { email: string; role: string; name: string };
};

export async function login(email: string, password: string) {
  return api<LoginResponse>("/api/auth/login", "POST", { email, password }, false);
}

export async function me() {
  return api<{ user: any }>("/api/auth/me", "GET", undefined, true);
}