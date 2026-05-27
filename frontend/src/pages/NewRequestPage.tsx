import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../api/createRequest";

export default function NewRequestPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    employeeName: "",
    employeeId: "",
    department: "",
    jobTitle: "",
    lastWorkingDay: "",
    reasonForExit: "Resignation",

    managerEmail: "",
    financeEmail: "",
    itEmail: "",
    adminEmail: "",
    finalHrEmail: "",

    companyAssets: "",
    hrComments: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<null | {
    requestId: string;
    approvalLink: string;
    currentStep: string;
  }>(null);

  const set = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validate = () => {
    const required = [
      "employeeName",
      "employeeId",
      "department",
      "jobTitle",
      "lastWorkingDay",
      "reasonForExit",
      "managerEmail",
      "financeEmail",
      "itEmail",
      "adminEmail",
      "finalHrEmail",
    ];

    const missing = required.filter((k) => !String((form as any)[k]).trim());
    return missing;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const missing = validate();
    if (missing.length) {
      setError("Please fill required fields: " + missing.join(", "));
      return;
    }

    setLoading(true);
    try {
      const resp = await createRequest({
        employeeName: form.employeeName.trim(),
        employeeId: form.employeeId.trim(),
        department: form.department.trim(),
        jobTitle: form.jobTitle.trim(),
        lastWorkingDay: form.lastWorkingDay,
        reasonForExit: form.reasonForExit.trim(),

        managerEmail: form.managerEmail.trim(),
        financeEmail: form.financeEmail.trim(),
        itEmail: form.itEmail.trim(),
        adminEmail: form.adminEmail.trim(),
        finalHrEmail: form.finalHrEmail.trim(),

        companyAssets: form.companyAssets.trim() || undefined,
        hrComments: form.hrComments.trim() || undefined,
      });

      setSuccess({
        requestId: resp.requestId,
        approvalLink: resp.approvalLink,
        currentStep: resp.currentStep,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 20, maxWidth: 720 }}>
        <h2>Request Created ✅</h2>
        <p>
          <b>Request ID:</b> {success.requestId}
        </p>
        <p>
          <b>Current Step:</b> {success.currentStep}
        </p>

        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Manager Approval Link (for testing)</div>
          <div style={{ wordBreak: "break-all" }}>{success.approvalLink}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => window.open(success.approvalLink, "_blank")}>Open Approval Link</button>
            <button onClick={() => nav(`/requests/${success.requestId}`)}>View Request Details</button>
            <button onClick={() => nav("/dashboard")}>Back to Dashboard</button>
          </div>
        </div>

        <p style={{ marginTop: 12, color: "#666" }}>
          Next step: we will build the Approver page UI for token approvals (no login).
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <h2>Create Offboarding Request (HR)</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        {/* Employee Details */}
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Employee Details</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Employee Name *
              <input style={{ width: "100%", padding: 8 }} value={form.employeeName} onChange={(e) => set("employeeName", e.target.value)} />
            </label>

            <label>
              Employee ID *
              <input style={{ width: "100%", padding: 8 }} value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} />
            </label>

            <label>
              Department *
              <input style={{ width: "100%", padding: 8 }} value={form.department} onChange={(e) => set("department", e.target.value)} />
            </label>

            <label>
              Job Title *
              <input style={{ width: "100%", padding: 8 }} value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
            </label>

            <label>
              Last Working Day *
              <input
                style={{ width: "100%", padding: 8 }}
                type="date"
                value={form.lastWorkingDay}
                onChange={(e) => set("lastWorkingDay", e.target.value)}
              />
            </label>

            <label>
              Reason for Exit *
              <input style={{ width: "100%", padding: 8 }} value={form.reasonForExit} onChange={(e) => set("reasonForExit", e.target.value)} />
            </label>
          </div>
        </section>

        {/* Approvers */}
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Approver Emails</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Line Manager Email *
              <input style={{ width: "100%", padding: 8 }} value={form.managerEmail} onChange={(e) => set("managerEmail", e.target.value)} />
            </label>

            <label>
              Finance Approver Email *
              <input style={{ width: "100%", padding: 8 }} value={form.financeEmail} onChange={(e) => set("financeEmail", e.target.value)} />
            </label>

            <label>
              IT Approver Email *
              <input style={{ width: "100%", padding: 8 }} value={form.itEmail} onChange={(e) => set("itEmail", e.target.value)} />
            </label>

            <label>
              Admin Approver Email *
              <input style={{ width: "100%", padding: 8 }} value={form.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} />
            </label>

            <label style={{ gridColumn: "1 / span 2" }}>
              Final HR Approver Email *
              <input style={{ width: "100%", padding: 8 }} value={form.finalHrEmail} onChange={(e) => set("finalHrEmail", e.target.value)} />
            </label>
          </div>
        </section>

        {/* Optional */}
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Optional</h3>

          <div style={{ display: "grid", gap: 12 }}>
            <label>
              Company Assets (optional)
              <input style={{ width: "100%", padding: 8 }} value={form.companyAssets} onChange={(e) => set("companyAssets", e.target.value)} />
            </label>

            <label>
              HR Comments
              <textarea style={{ width: "100%", padding: 8, minHeight: 80 }} value={form.hrComments} onChange={(e) => set("hrComments", e.target.value)} />
            </label>
          </div>
        </section>

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={loading} style={{ padding: "10px 14px" }}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>

          <button type="button" onClick={() => nav("/dashboard")} style={{ padding: "10px 14px" }}>
            Cancel
          </button>
        </div>

        <div style={{ color: "#666" }}>
          This form matches your offboarding request fields (employee details, approver emails, assets, HR comments). [1](https://bing.com/search?q=Prisma+supported+Node.js+versions+2026+Prisma+Node+24+support)
        </div>
      </form>
    </div>
  );
}