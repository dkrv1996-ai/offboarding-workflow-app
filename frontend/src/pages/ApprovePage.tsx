import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getApproveInfo, submitApproval, type ApproveInfoResponse, type Step } from "../api/publicApprove";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string; nextStep?: string; nextLink?: string; requestId?: string; finalStatus?: string }
  | { status: "error"; message: string };

export default function ApprovePage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<ApproveInfoResponse | null>(null);
  const [error, setError] = useState("");

  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [comments, setComments] = useState("");

  // step-specific data fields
  const [data, setData] = useState<Record<string, any>>({});

  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      setSubmitState({ status: "idle" });

      try {
        const res = await getApproveInfo(token);
        setInfo(res);

        // initialize step-specific defaults (optional)
        setComments("");
        setAction("APPROVE");
        setData(getDefaultDataForStep(res.step));
      } catch (e: any) {
        setError(e?.message || "Failed to load approval data");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const step = info?.step as Step | undefined;

  const title = useMemo(() => {
    if (!step) return "Approval";
    return `Approval Required: ${step}`;
  }, [step]);

  const onSetData = (k: string, v: any) => setData((p) => ({ ...p, [k]: v }));

  const onSubmit = async () => {
    if (!token) return;
    setSubmitState({ status: "submitting" });

    try {
      const resp = await submitApproval(token, {
        action,
        comments: comments || undefined,
        data: data || {},
      });

      // Backend returns different shapes depending on step completion
      if (resp?.status === "COMPLETED" || resp?.message === "Completed") {
        setSubmitState({
          status: "success",
          message: "Completed ✅ (Final HR Approved & Closed)",
          requestId: resp.requestId,
          finalStatus: resp.status || "COMPLETED",
        });
      } else if (resp?.status === "REJECTED" || resp?.message?.toLowerCase().includes("reject")) {
        setSubmitState({
          status: "success",
          message: "Rejected ❌ (Saved)",
          requestId: resp.requestId,
          finalStatus: resp.status || "REJECTED",
        });
      } else {
        setSubmitState({
          status: "success",
          message: "Approved ✅",
          requestId: resp.requestId,
          nextStep: resp.nextStep,
          nextLink: resp.nextLink,
        });
      }
    } catch (e: any) {
      setSubmitState({ status: "error", message: e?.message || "Submit failed" });
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Approval Link Error</h2>
        <div style={{ color: "crimson" }}>{error}</div>
        <p style={{ color: "#666" }}>
          This can happen if token is invalid/expired/used already.
        </p>
      </div>
    );
  }

  if (!info) return <div style={{ padding: 20 }}>No data</div>;

  return (
    <div style={{ padding: 20, maxWidth: 960 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      {/* Employee Summary (from PDF summary concept) */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Employee</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><b>Request ID:</b> {info.requestId}</div>
          <div><b>Employee:</b> {info.employee.employeeName} ({info.employee.employeeId})</div>
          <div><b>Department:</b> {info.employee.department}</div>
          <div><b>Job Title:</b> {info.employee.jobTitle}</div>
          <div><b>Last Working Day:</b> {info.employee.lastWorkingDay}</div>
          <div><b>Reason:</b> {info.employee.reasonForExit}</div>
        </div>
      </section>

      {/* Action */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Your Action</h3>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label>
            <input
              type="radio"
              checked={action === "APPROVE"}
              onChange={() => setAction("APPROVE")}
            />
            &nbsp;Approve
          </label>

          <label>
            <input
              type="radio"
              checked={action === "REJECT"}
              onChange={() => setAction("REJECT")}
            />
            &nbsp;Reject
          </label>
        </div>

        {/* Step-specific fields */}
        <div style={{ marginTop: 14 }}>
          {step && renderStepFields(step, data, onSetData)}
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block" }}>
            Comments
            <textarea
              style={{ width: "100%", padding: 8, minHeight: 90 }}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter remarks/comments"
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={onSubmit}
            disabled={submitState.status === "submitting"}
            style={{ padding: "10px 14px" }}
          >
            {submitState.status === "submitting" ? "Submitting..." : "Submit"}
          </button>
        </div>

        {/* Result */}
        {submitState.status === "success" && (
          <div style={{ marginTop: 14, padding: 12, border: "1px solid #cfe9d5", background: "#f3fff6", borderRadius: 8 }}>
            <b>{submitState.message}</b>
            {submitState.requestId && <div>Request: {submitState.requestId}</div>}
            {submitState.nextStep && <div>Next Step: {submitState.nextStep}</div>}
            {submitState.nextLink && (
              <div style={{ marginTop: 6, wordBreak: "break-all" }}>
                Next Approval Link (for testing): {submitState.nextLink}
              </div>
            )}
          </div>
        )}

        {submitState.status === "error" && (
          <div style={{ marginTop: 14, color: "crimson" }}>
            {submitState.message}
          </div>
        )}
      </section>

      {/* Timeline / Log */}
      <section style={{ marginTop: 14, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Timeline / Log</h3>
        {info.timeline?.length ? (
          <ul style={{ margin: 0 }}>
            {info.timeline.map((t, i) => (
              <li key={i}>
                <b>{t.at}</b> | {t.who}: {t.action} {t.details ? `- ${t.details}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: "#666" }}>No timeline yet</div>
        )}
      </section>

      <div style={{ marginTop: 12, color: "#666" }}>
        This page matches your offboarding flow where approvals happen step-by-step without login using email token links. [1](https://bing.com/search?q=Prisma+supported+Node.js+versions+2026+Prisma+Node+24+support)
      </div>
    </div>
  );
}

function getDefaultDataForStep(step: Step) {
  switch (step) {
    case "FINANCE":
      return { pendingSalary: "", recovery: 0 };
    case "IT":
      return { laptopReturned: "No", emailDisabled: "No", vpnDisabled: "No", otherSystems: "" };
    case "ADMIN":
      return { idCardReturned: "No", parkingDisabled: "No", deskCleared: "No" };
    case "FINAL_HR":
      return { experienceLetter: "No", exitInterview: "No" };
    default:
      return {};
  }
}

function renderStepFields(step: Step, data: Record<string, any>, setData: (k: string, v: any) => void) {
  // Fields based on your PDF summary sections: Finance/IT/Admin/Final HR specifics [1](https://bing.com/search?q=Prisma+supported+Node.js+versions+2026+Prisma+Node+24+support)
  if (step === "MANAGER") {
    return (
      <div style={{ color: "#666" }}>
        Manager step: enter comments and approve/reject. [1](https://bing.com/search?q=Prisma+supported+Node.js+versions+2026+Prisma+Node+24+support)
      </div>
    );
  }

  if (step === "FINANCE") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>
          Pending Salary
          <input
            style={{ width: "100%", padding: 8 }}
            value={data.pendingSalary ?? ""}
            onChange={(e) => setData("pendingSalary", e.target.value)}
            placeholder="No due"
          />
        </label>
        <label>
          Recovery
          <input
            style={{ width: "100%", padding: 8 }}
            type="number"
            value={data.recovery ?? 0}
            onChange={(e) => setData("recovery", Number(e.target.value))}
          />
        </label>
      </div>
    );
  }

  if (step === "IT") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>
          Laptop Returned
          <select
            style={{ width: "100%", padding: 8 }}
            value={data.laptopReturned ?? "No"}
            onChange={(e) => setData("laptopReturned", e.target.value)}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label>
          Email Disabled
          <select
            style={{ width: "100%", padding: 8 }}
            value={data.emailDisabled ?? "No"}
            onChange={(e) => setData("emailDisabled", e.target.value)}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label>
          VPN Disabled
          <select
            style={{ width: "100%", padding: 8 }}
            value={data.vpnDisabled ?? "No"}
            onChange={(e) => setData("vpnDisabled", e.target.value)}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label style={{ gridColumn: "1 / span 2" }}>
          Other Systems
          <input
            style={{ width: "100%", padding: 8 }}
            value={data.otherSystems ?? ""}
            onChange={(e) => setData("otherSystems", e.target.value)}
            placeholder="Any other system access removed?"
          />
        </label>
      </div>
    );
  }

  if (step === "ADMIN") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>
          ID Card Returned
          <select
            style={{ width: "100%", padding: 8 }}
            value={data.idCardReturned ?? "No"}
            onChange={(e) => setData("idCardReturned", e.target.value)}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label>
          Parking Disabled
          <select
            style={{ width: "100%", padding: 8 }}
            value={data.parkingDisabled ?? "No"}
            onChange={(e) => setData("parkingDisabled", e.target.value)}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label style={{ gridColumn: "1 / span 2" }}>
          Desk Cleared
          <select
            style={{ width: "100%", padding: 8 }}
            value={data.deskCleared ?? "No"}
            onChange={(e) => setData("deskCleared", e.target.value)}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>
      </div>
    );
  }

  // FINAL_HR
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <label>
        Experience Letter
        <select
          style={{ width: "100%", padding: 8 }}
          value={data.experienceLetter ?? "No"}
          onChange={(e) => setData("experienceLetter", e.target.value)}
        >
          <option>Yes</option>
          <option>No</option>
        </select>
      </label>

      <label>
        Exit Interview
        <select
          style={{ width: "100%", padding: 8 }}
          value={data.exitInterview ?? "No"}
          onChange={(e) => setData("exitInterview", e.target.value)}
        >
          <option>Yes</option>
          <option>No</option>
        </select>
      </label>
    </div>
  );
}
