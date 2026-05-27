import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../api/http";
import { listRequests } from "../api/requests";
import type { RequestRow } from "../api/requests";

export default function DashboardPage() {
  const nav = useNavigate();

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>(""); // empty = all
  const [search, setSearch] = useState("");

  const logout = () => {
    clearToken();
    nav("/login");
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listRequests(statusFilter || undefined);
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      (r.id || "").toLowerCase().includes(s) ||
      (r.employeeName || "").toLowerCase().includes(s) ||
      (r.employeeId || "").toLowerCase().includes(s) ||
      (r.department || "").toLowerCase().includes(s) ||
      (r.jobTitle || "").toLowerCase().includes(s)
    );
  }, [rows, search]);


  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>HR Dashboard (All Requests)</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => nav("/requests/new")}>Create New Request</button>
          <button onClick={load}>Refresh</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <label>
          Status:&nbsp;
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="REJECTED">REJECTED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </label>

        <input
          style={{ padding: 8, minWidth: 260 }}
          placeholder="Search by Request ID / Employee / Dept / Job"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div style={{ marginTop: 14 }}>Loading...</div>}
      {error && <div style={{ marginTop: 14, color: "crimson" }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 8, color: "#666" }}>Total: {filtered.length}</div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  {["Request ID", "Employee", "Department / Title", "Status", "Current Step", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        border: "1px solid #ddd",
                        padding: 10,
                        textAlign: "left",
                        background: "#f5f5f5",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ border: "1px solid #ddd", padding: 10, whiteSpace: "nowrap" }}>{r.id}</td>
                    <td style={{ border: "1px solid #ddd", padding: 10 }}>
                      <div><b>{r.employeeName}</b></div>
                      <div style={{ color: "#666" }}>{r.employeeId}</div>
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 10 }}>
                      <div><b>{r.department}</b></div>
                      <div style={{ color: "#666" }}>{r.jobTitle}</div>
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 10, whiteSpace: "nowrap" }}>{r.status}</td>
                    <td style={{ border: "1px solid #ddd", padding: 10, whiteSpace: "nowrap" }}>{r.currentStep}</td>
                    <td style={{ border: "1px solid #ddd", padding: 10, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => nav(`/requests/${r.id}`)}>View</button>
                        <button onClick={() => nav(`/requests/${r.id}/print`)}>Print</button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 12, color: "#666" }}>
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}