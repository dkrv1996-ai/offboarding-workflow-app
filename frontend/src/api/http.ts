const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T>(
  path: string,
  method: HttpMethod = "GET",
  body?: unknown,
  auth: boolean = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle non-2xx
  if (!res.ok) {
    let errMsg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      errMsg = data?.message || data?.error || errMsg;
    } catch {
      // ignore JSON parse
    }
    throw new Error(errMsg);
  }

  // Some endpoints may return plain text, but ours return JSON
  return res.json() as Promise<T>;
}