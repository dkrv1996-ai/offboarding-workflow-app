const prisma = require("../db");

// ---------- helpers ----------
function safeJsonParse(s) {
  try {
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

function approvalsToMap(approvalsArray) {
  const map = {};
  for (const a of approvalsArray || []) {
    map[a.step] = {
      status: a.status,
      comments: a.comments || "",
      data: safeJsonParse(a.dataJson),
      approverEmail: a.approverEmail, // stored in Approval table
      actedAt: a.actedAt,
    };
  }
  return map;
}

function timelineToArray(auditLogs) {
  return (auditLogs || [])
    .slice()
    .sort((x, y) => new Date(x.at) - new Date(y.at))
    .map((l) => ({
      at: l.at instanceof Date ? l.at.toISOString() : String(l.at),
      who: l.who,
      action: l.action,
      details: l.details || "",
    }));
}

// ---------- HTML PRINT (fallback) ----------
exports.printReport = async (req, res) => {
  try {
    const requestId = req.params.id;

    const reqObj = await prisma.offboardingRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true, auditLogs: true },
    });

    if (!reqObj) return res.status(404).send("Request not found");

    const approvals = approvalsToMap(reqObj.approvals);
    const timeline = timelineToArray(reqObj.auditLogs);

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Offboarding Summary - ${reqObj.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            h1 { margin: 0 0 8px 0; }
            .muted { color: #555; }
            .card { border: 1px solid #ddd; padding: 12px; border-radius: 8px; margin: 12px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
            th { background: #f5f5f5; text-align: left; }
            @media print { button { display:none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Print</button>
          <h1>Employee Offboarding Summary</h1>
          <div class="muted">Request ID: <b>${reqObj.id}</b></div>

          <div class="card">
            <h3>Employee Details</h3>
            <div><b>Name:</b> ${reqObj.employeeName}</div>
            <div><b>Employee ID:</b> ${reqObj.employeeId}</div>
            <div><b>Department:</b> ${reqObj.department}</div>
            <div><b>Job Title:</b> ${reqObj.jobTitle}</div>
            <div><b>Last Working Day:</b> ${reqObj.lastWorkingDay}</div>
            <div><b>Reason:</b> ${reqObj.reasonForExit}</div>
            <div><b>Manager Email:</b> ${reqObj.managerEmail || ""}</div>
            <div><b>Finance Email:</b> ${reqObj.financeEmail || ""}</div>
            <div><b>IT Email:</b> ${reqObj.itEmail || ""}</div>
            <div><b>Admin Email:</b> ${reqObj.adminEmail || ""}</div>
            <div><b>Final HR Email:</b> ${reqObj.finalHrEmail || ""}</div>
          </div>

          <div class="card">
            <h3>Approvals</h3>
            <pre>${JSON.stringify(approvals, null, 2)}</pre>
          </div>

          <div class="card">
            <h3>Timeline / Log</h3>
            <table>
              <thead><tr><th>Date/Time</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
              <tbody>
                ${timeline.map(t => `<tr><td>${t.at}</td><td>${t.who}</td><td>${t.action}</td><td>${t.details}</td></tr>`).join("")}
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

// ---------- JSON SUMMARY (React Print uses this) ----------
exports.getSummaryJson = async (req, res) => {
  try {
    const requestId = req.params.id;

    const reqObj = await prisma.offboardingRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true, auditLogs: true },
    });

    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    const approvals = approvalsToMap(reqObj.approvals);
    const timeline = timelineToArray(reqObj.auditLogs);

    // âœ… IMPORTANT: includes approver emails entered by HR at creation
    res.json({
      request: {
        id: reqObj.id,
        employeeName: reqObj.employeeName,
        employeeId: reqObj.employeeId,
        department: reqObj.department,
        jobTitle: reqObj.jobTitle,
		country: reqObj.country,
		city: reqObj.city,
        lastWorkingDay: reqObj.lastWorkingDay,
        reasonForExit: reqObj.reasonForExit,

        managerEmail: reqObj.managerEmail,
        financeEmail: reqObj.financeEmail,
        itEmail: reqObj.itEmail,
        adminEmail: reqObj.adminEmail,
        finalHrEmail: reqObj.finalHrEmail,

        companyAssets: reqObj.companyAssets,
        hrComments: reqObj.hrComments,

        status: reqObj.status,
        currentStep: reqObj.currentStep,
        createdBy: reqObj.createdBy,
        createdAt: reqObj.createdAt,
        updatedAt: reqObj.updatedAt,
      },
      approvals,
      timeline,
    });
  } catch (err) {
    console.error("getSummaryJson error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
