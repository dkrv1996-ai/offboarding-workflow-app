const nodemailer = require("nodemailer");

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 2525),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true", // true for 465; false for 2525/587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendMail({ to, subject, html }) {
  const transport = makeTransport();
  return transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HTML helpers (professional layout)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function baseLayout({ title, subtitle, bodyHtml }) {
  return `
  <div style="background:#f6f8fb;padding:24px;font-family:Segoe UI,Arial,sans-serif;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e6e8ee;border-radius:12px;overflow:hidden;">
      <div style="padding:18px 20px;background:#0b3d91;color:#fff;">
        <div style="font-size:18px;font-weight:800;">${escapeHtml(title)}</div>
        <div style="margin-top:4px;font-size:13px;opacity:.95;">${escapeHtml(subtitle || "")}</div>
      </div>
      <div style="padding:18px 20px;color:#0f172a;">
        ${bodyHtml}
      </div>
      <div style="padding:14px 20px;background:#fafafa;border-top:1px solid #eee;color:#64748b;font-size:12px;">
        This is an automated message. Please do not forward token links.
      </div>
    </div>
  </div>`;
}

function summaryTable({
  requestId,
  employeeName,
  employeeId,
  department,
  jobTitle,
  lastWorkingDay,
  reasonForExit,
}) {
  const row = (k, v) => `
    <tr>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:700;width:190px;">${escapeHtml(
        k
      )}</td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(v)}</td>
    </tr>`;

  return `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:10px;">
      ${row("Request ID", requestId)}
      ${row("Employee", `${employeeName} (${employeeId})`)}
      ${row("Department", department)}
      ${row("Job Title", jobTitle)}
      ${row("Last Working Day", lastWorkingDay)}
      ${row("Reason for Exit", reasonForExit)}
    </table>`;
}

function ctaButton({ url, label }) {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `
    <div style="margin:16px 0;">
      <a href="${safeUrl}"
         style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                padding:10px 14px;border-radius:10px;font-weight:800;">
        ${safeLabel}
      </a>
    </div>
    <div style="font-size:12px;color:#64748b;">
      If the button doesnâ€™t work, copy and paste this link:<br/>
      <a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a>
    </div>`;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Templates
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function approvalEmailHtml({
  step,
  requestId,
  employeeName,
  employeeId,
  department,
  jobTitle,
  lastWorkingDay,
  reasonForExit,
  link,
}) {
  const body = `
    <div style="font-size:13px;">
      An offboarding approval is required for the step: <b>${escapeHtml(step)}</b>.
      ${summaryTable({
        requestId,
        employeeName,
        employeeId,
        department,
        jobTitle,
        lastWorkingDay,
        reasonForExit,
      })}
      ${ctaButton({ url: link, label: "Open Approval Page" })}
    </div>
  `;
  return baseLayout({
    title: `Offboarding Approval Required: ${step}`,
    subtitle: `Request ${requestId}`,
    bodyHtml: body,
  });
}

function hrFinalEmailHtml({
  requestId,
  employeeName,
  employeeId,
  department,
  jobTitle,
  lastWorkingDay,
  reasonForExit,
  hrLink,
}) {
  const body = `
    <div style="font-size:13px;">
      Admin has approved. HR must provide final comments and either <b>Approve & Close</b> or <b>Reject</b>.
      ${summaryTable({
        requestId,
        employeeName,
        employeeId,
        department,
        jobTitle,
        lastWorkingDay,
        reasonForExit,
      })}
      ${ctaButton({ url: hrLink, label: "Open Request (HR Final)" })}
    </div>
  `;
  return baseLayout({
    title: "Ready for HR Final Decision",
    subtitle: `Request ${requestId}`,
    bodyHtml: body,
  });
}

function rejectedEmailHtml({ requestId, rejectedBy, comments, hrLink }) {
  const body = `
    <div style="font-size:13px;">
      This offboarding request was <b style="color:#b91c1c;">REJECTED</b>.
      <p style="margin:10px 0 0 0;"><b>Rejected By:</b> ${escapeHtml(rejectedBy)}</p>
      <p style="margin:6px 0 0 0;"><b>Remarks:</b> ${escapeHtml(comments || "")}</p>
      ${ctaButton({ url: hrLink, label: "Open Request" })}
    </div>
  `;
  return baseLayout({
    title: "Offboarding Rejected",
    subtitle: `Request ${requestId}`,
    bodyHtml: body,
  });
}

function closedEmailHtml({ requestId, hrComments, printLink }) {
  const body = `
    <div style="font-size:13px;">
      This offboarding request is <b style="color:#166534;">CLOSED</b>.
      <p style="margin:10px 0 0 0;"><b>HR Final Comments:</b> ${escapeHtml(hrComments || "")}</p>
      ${ctaButton({ url: printLink, label: "Open Print Summary" })}
    </div>
  `;
  return baseLayout({
    title: "Offboarding Closed",
    subtitle: `Request ${requestId}`,
    bodyHtml: body,
  });
}

module.exports = {
  sendMail,
  approvalEmailHtml,
  hrFinalEmailHtml,
  rejectedEmailHtml,
  closedEmailHtml,
};
