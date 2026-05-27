import { getToken } from "./http";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function downloadPrintHtml(requestId: string) {
  const token = getToken();
  if (!token) throw new Error("Missing token. Please login again.");

  const res = await fetch(`${API_BASE_URL}/api/reports/${requestId}/print`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let msg = `Print failed: ${res.status}`;
    try {
      const txt = await res.text();
      msg = txt || msg;
    } catch {}
    throw new Error(msg);
  }

  const html = await res.text();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // open new tab
  window.open(url, "_blank");

  // cleanup after some time
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
