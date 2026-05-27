import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRequestDetails, type RequestDetails } from "../api/requestDetails";
import { downloadPrintHtml } from "../api/reports";

function safeParseJson(s?: string | null) {
  try {
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

export default function RequestDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<RequestDetails | null>(null);

  const approvalsMap = useMemo(() => {
    const map: Record<string, any> = {};
    (data?.approvals || []).forEach((a) => {
      map[a.step] = {
        ...a,
        parsed: safeParseJson(a.dataJson),
      };
    });
    return map;
  }, [data]);

  const timeline = useMemo(() => {
    return (data?.auditLogs || [])
      .slice()
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [data]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await getRequestDetails(id);
        setData(res);
      } catch (e: any) {
        setError(e?.message || "Failed to load request");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const onPrint = async () => {
    if (!id) return;
    try {
      await downloadPrintHtml(id);
    } catch (e: any) {
      alert(e?.message || "Print failed");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (error) return <div style={{ padding: 20, color: "crimson" }}>{error}</div>;
  if (!data) return <div style={{ padding: 20 }}>No data</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Request Details</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => nav("/dashboard")}>Back</button>
          <button onClick={onPrint}>Print</button>
        </div>
      </div>

      <div style={{ marginTop: 8, color: "#666" }}>
        <b>Request ID:</b> {data.id} &nbsp; | &nbsp;
        <b>Status:</b> {data.status} &nbsp; | &nbsp;
        <b>Current Step:</b> {data.currentStep}
      </div>

      {/* Employee Details (matches your summary section) */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Employee Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><b>Name:</b> {data.employeeName}</div>
          <div><b>Employee ID:</b> {data.employeeId}</div>
          <div><b>Department:</b> {data.department}</div>
          <div><b>Job Title:</b> {data.jobTitle}</div>
          <div><b>Last Working Day:</b> {data.lastWorkingDay}</div>
          <div><b>Reason:</b> {data.reasonForExit}</div>
          <div><b>Company Assets:</b> {data.companyAssets || ""}</div>
          <div><b>HR Comments:</b> {data.hrComments || ""}</div>
        </div>
      </section>

      {/* Approvals (Manager/Finance/IT/Admin/Final HR) */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Approvals</h3>

        <ApprovalCard title="Manager" a={approvalsMap.MANAGER} />
        <ApprovalCard title="Finance" a={approvalsMap.FINANCE} />
        <ApprovalCard title="IT" a={approvalsMap.IT} />
        <ApprovalCard title="Admin" a={approvalsMap.ADMIN} />
        <ApprovalCard title="Final HR" a={approvalsMap.FINAL_HR} />

        <div style={{ marginTop: 10, color: "#666" }}>
          (Finance/IT/Admin/Final HR include step-specific fields like in your offboarding summary.) 
        </div>
      </section>

      {/* Timeline / Log */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Timeline / Log</h3>
        {timeline.length ? (
          <ul style={{ margin: 0 }}>
            {timeline.map((t, i) => (
              <li key={i}>
                <b>{t.at}</b> | {t.who}: {t.action} {t.details ? `- ${t.details}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: "#666" }}>No timeline entries</div>
        )}
      </section>

      <div style={{ marginTop: 12, color: "#666" }}>
        This page consolidates all inputs/remarks + timeline similar to your PDF summary requirement. [1](https://bing.com/search?q=Prisma+supported+Node.js+versions+2026+Prisma+Node+24+support)
      </div>
    </div>
  );
}

function ApprovalCard({ title, a }: { title: string; a: any }) {
  if (!a) {
    return (
      <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 10 }}>
        <b>{title}</b>
        <div style={{ color: "#666" }}>No data</div>
      </div>
    );
  }

  const dataObj = a.parsed || {};

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <b>{title}</b>
        <span style={{ color: a.status === "APPROVED" ? "#0a7" : a.status === "REJECTED" ? "#c00" : "#666" }}>
          {a.status}
        </span>
      </div>

      <div style={{ marginTop: 6, color: "#666" }}>
        <div><b>Email:</b> {a.approverEmail}</div>
        <div><b>Comments:</b> {a.comments || ""}</div>
      </div>

      {Object.keys(dataObj).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <b>Step Data</b>
          <ul style={{ margin: "6px 0 0 18px" }}>
            {Object.entries(dataObj).map(([k, v]) => (
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