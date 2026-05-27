import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReportSummary, type ReportSummary } from "../api/reportSummary";

export default function PrintPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ReportSummary | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await getReportSummary(id);
        setData(res);
      } catch (e: any) {
        setError(e?.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const timeline = useMemo(() => {
    return (data?.timeline || [])
      .slice()
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [data]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (error) return <div style={{ padding: 20, color: "crimson" }}>{error}</div>;
  if (!data) return <div style={{ padding: 20 }}>No data</div>;

  const r = data.request;
  const a = data.approvals || {};

  return (
    <div style={{ padding: 20 }}>
      {/* Print-only CSS */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
          }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 12px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
          .muted { color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
          th { background: #f5f5f5; text-align: left; }
        `}
      </style>

      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => nav(`/requests/${r.id}`)}>Back</button>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()}>Print</button>
        </div>
      </div>

      <h1 style={{ marginBottom: 6 }}>Employee Offboarding Summary</h1>
      <div className="muted">
        <b>Request ID:</b> {r.id}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Employee Details</h3>
        <div className="grid">
          <div><b>Employee Name:</b> {r.employeeName}</div>
          <div><b>Employee ID:</b> {r.employeeId}</div>
          <div><b>Department:</b> {r.department}</div>
          <div><b>Job Title:</b> {r.jobTitle}</div>
          <div><b>Last Working Day:</b> {r.lastWorkingDay}</div>
          <div><b>Reason:</b> {r.reasonForExit}</div>
          <div><b>Company Assets:</b> {r.companyAssets || ""}</div>
          <div><b>HR Comments:</b> {r.hrComments || ""}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Approvals</h3>
        <ApprovalBlock title="Manager" approval={a.MANAGER} />
        <ApprovalBlock title="Finance" approval={a.FINANCE} />
        <ApprovalBlock title="IT" approval={a.IT} />
        <ApprovalBlock title="Admin" approval={a.ADMIN} />
        <ApprovalBlock title="Final HR" approval={a.FINAL_HR} />

        <div style={{ marginTop: 10 }}>
          <b>Final Status:</b> {r.status}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Timeline / Log</h3>
        <table>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Who</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((t, i) => (
              <tr key={i}>
                <td>{t.at}</td>
                <td>{t.who}</td>
                <td>{t.action}</td>
                <td>{t.details || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="muted">
        This print view includes all remarks/inputs + timeline, matching your offboarding summary requirement. [1](https://bing.com/search?q=Prisma+supported+Node.js+versions+2026+Prisma+Node+24+support)
      </div>
    </div>
  );
}

function ApprovalBlock({ title, approval }: { title: string; approval: any }) {
  if (!approval) {
    return (
      <div style={{ marginTop: 10 }}>
        <b>{title}</b>: No data
      </div>
    );
  }

  const data = approval.data || {};
  return (
    <div style={{ marginTop: 10, padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <b>{title}</b>
        <span>{approval.status}</span>
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        <div><b>Comments:</b> {approval.comments || ""}</div>
      </div>

      {Object.keys(data).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <b>Step Data</b>
          <ul style={{ margin: "6px 0 0 18px" }}>
            {Object.entries(data).map(([k, v]) => (
              <li key={k}>
                {k}: {String(v)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}