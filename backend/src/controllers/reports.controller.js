const prisma = require("../db");

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function approvalsToMap(approvalsArray) {
  const map = {};
  for (const a of approvalsArray) {
    map[a.step] = {
      status: a.status,
      comments: a.comments || "",
      data: a.dataJson ? safeParseJson(a.dataJson) : {},
      approverEmail: a.approverEmail,
      actedAt: a.actedAt,
    };
  }
  return map;
}

function renderKVTable(obj) {
  if (!obj || typeof obj !== "object") return "";
  const entries = Object.entries(obj);
  if (!entries.length) return "";

  return `
    <table>
      <thead><tr><th>Field</th><th>Value</th></tr></thead>
      <tbody>
        ${entries
          .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
          .join("")}
      </tbody>
    </table>
  `;
}

function renderApprovalCard(title, approval) {
  if (!approval) {
    return `<div class="card"><h4>${escapeHtml(title)}</h4><div class="row">No data</div></div>`;
  }

  const st = approval.status || "PENDING";
  const cls = st === "APPROVED" ? "ok" : st === "REJECTED" ? "bad" : "";

  return `
    <div class="card">
      <h4>${escapeHtml(title)}</h4>
      <div class="row"><span class="label">Status:</span> <span class="${cls}">${escapeHtml(st)}</span></div>
      <div class="row"><span class="label">Approver Email:</span> ${escapeHtml(approval.approverEmail || "")}</div>
      <div class="row"><span class="label">Comments:</span> ${escapeHtml(approval.comments || "")}</div>
      ${renderKVTable(approval.data)}
    </div>
  `;
}

// HTML print
exports.printReport = async (req, res) => {
  try {
    const requestId = req.params.id;

    const reqObj = await prisma.offboardingRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true, auditLogs: true },
    });

    if (!reqObj) return res.status(404).send("Request not found");

    const approvals = approvalsToMap(reqObj.approvals);
    const timeline = reqObj.auditLogs
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .map((l) => ({
        at: l.at instanceof Date ? l.at.toISOString() : String(l.at),
        who: l.who,
        action: l.action,
        details: l.details || "",
      }));

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Employee Offboarding Summary - ${escapeHtml(reqObj.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            h1 { margin: 0 0 8px 0; }
            .muted { color: #555; }
            .card { border: 1px solid #ddd; padding: 12px 14px; border-radius: 8px; margin: 12px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
            .row { margin: 4px 0; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
            th { background: #f5f5f5; text-align: left; }
            .ok { color: #0a7; font-weight: bold; }
            .bad { color: #c00; font-weight: bold; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Print</button>

          <h1>Employee Offboarding Summary</h1>
          <div class="muted">Request ID: <b>${escapeHtml(reqObj.id)}</b></div>

          <div class="card">
            <h3>Employee Details</h3>
            <div class="grid">
              <div class="row"><span class="label">Employee Name:</span> ${escapeHtml(reqObj.employeeName)}</div>
              <div class="row"><span class="label">Employee ID:</span> ${escapeHtml(reqObj.employeeId)}</div>
              <div class="row"><span class="label">Department:</span> ${escapeHtml(reqObj.department)}</div>
              <div class="row"><span class="label">Job Title:</span> ${escapeHtml(reqObj.jobTitle)}</div>
              <div class="row"><span class="label">Last Working Day:</span> ${escapeHtml(reqObj.lastWorkingDay)}</div>
              <div class="row"><span class="label">Reason:</span> ${escapeHtml(reqObj.reasonForExit)}</div>
              <div class="row"><span class="label">Company Assets:</span> ${escapeHtml(reqObj.companyAssets || "")}</div>
              <div class="row"><span class="label">HR Comments:</span> ${escapeHtml(reqObj.hrComments || "")}</div>
            </div>
          </div>

          <div class="card">
            <h3>Approvals</h3>
            ${renderApprovalCard("Manager", approvals.MANAGER)}
            ${renderApprovalCard("Finance", approvals.FINANCE)}
            ${renderApprovalCard("IT", approvals.IT)}
            ${renderApprovalCard("Admin", approvals.ADMIN)}
            ${renderApprovalCard("Final HR", approvals.FINAL_HR)}
            <div class="row"><span class="label">Final Status:</span>
              <span class="${reqObj.status === "COMPLETED" ? "ok" : ""}">${escapeHtml(reqObj.status)}</span>
            </div>
          </div>

          <div class="card">
            <h3>Timeline / Log</h3>
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
                ${timeline
                  .map(
                    (t) => `
                    <tr>
                      <td>${escapeHtml(t.at)}</td>
                      <td>${escapeHtml(t.who)}</td>
                      <td>${escapeHtml(t.action)}</td>
                      <td>${escapeHtml(t.details)}</td>
                    </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error("printReport error:", err);
    res.status(500).send("Report generation failed");
  }
};

// Optional: JSON summary endpoint (for frontend later)
exports.getSummaryJson = async (req, res) => {
  try {
    const requestId = req.params.id;

    const reqObj = await prisma.offboardingRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true, auditLogs: true },
    });

    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    return res.json({
      request: reqObj,
      approvals: approvalsToMap(reqObj.approvals),
      timeline: reqObj.auditLogs
        .sort((a, b) => new Date(a.at) - new Date(b.at))
        .map((l) => ({ at: l.at, who: l.who, action: l.action, details: l.details || "" })),
    });
  } catch (err) {
    console.error("getSummaryJson error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};