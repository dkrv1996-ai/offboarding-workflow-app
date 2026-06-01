const prisma = require("../db");
const { generateToken } = require("../utils/token");
const mailer = require("../services/email.service");
console.log("EMAIL SERVICE EXPORTS:", Object.keys(mailer));

const {
  sendMail,
  approvalEmailHtml,
  hrFinalEmailHtml,
  rejectedEmailHtml,
} = require("../services/email.service");

// Token workflow steps (HR final is NOT token-based)
const STEP_ORDER = ["MANAGER", "FINANCE", "IT", "ADMIN"];

function nextStep(currentStep) {
  const idx = STEP_ORDER.indexOf(currentStep);
  if (idx === -1) return null;
  return STEP_ORDER[idx + 1] || null;
}

function tokenError(res, message) {
  return res.status(400).json({ message });
}

// GET /api/public/approve/:token
exports.getApproveInfo = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenRecord = await prisma.approvalToken.findUnique({ where: { token } });
    if (!tokenRecord) return tokenError(res, "Invalid token");
    if (tokenRecord.used) return tokenError(res, "Token already used");
    if (new Date() > tokenRecord.expiresAt) return tokenError(res, "Token expired");

    const reqObj = await prisma.offboardingRequest.findUnique({
      where: { id: tokenRecord.requestId },
      include: { approvals: true, auditLogs: true },
    });
    if (!reqObj) return tokenError(res, "Request not found");

    // approvals map
    const approvalsMap = {};
    for (const a of reqObj.approvals) {
      approvalsMap[a.step] = {
        status: a.status,
        comments: a.comments || "",
        data: a.dataJson ? JSON.parse(a.dataJson) : {},
      };
    }

    const timeline = reqObj.auditLogs
      .slice()
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .map((l) => ({
        at: l.at instanceof Date ? l.at.toISOString() : String(l.at),
        who: l.who,
        action: l.action,
        details: l.details || "",
      }));

    return res.json({
      requestId: reqObj.id,
      step: tokenRecord.step,
      employee: {
        employeeName: reqObj.employeeName,
        employeeId: reqObj.employeeId,
        department: reqObj.department,
        jobTitle: reqObj.jobTitle,
        lastWorkingDay: reqObj.lastWorkingDay,
        reasonForExit: reqObj.reasonForExit,
      },
      approvals: approvalsMap,
      timeline,
    });
  } catch (err) {
    console.error("getApproveInfo error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/public/approve/:token
exports.submitApproval = async (req, res) => {
  try {
    const { token } = req.params;
    const { action, comments, data } = req.body;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({ message: "action must be APPROVE or REJECT" });
    }

    const tokenRecord = await prisma.approvalToken.findUnique({ where: { token } });
    if (!tokenRecord) return tokenError(res, "Invalid token");
    if (tokenRecord.used) return tokenError(res, "Token already used");
    if (new Date() > tokenRecord.expiresAt) return tokenError(res, "Token expired");

    const reqObj = await prisma.offboardingRequest.findUnique({ where: { id: tokenRecord.requestId } });
    if (!reqObj) return tokenError(res, "Request not found");

    const step = tokenRecord.step;

    if (reqObj.currentStep !== step) {
      return tokenError(res, `This token is for ${step}, but current step is ${reqObj.currentStep}`);
    }

    // Mark token used
    await prisma.approvalToken.update({ where: { token }, data: { used: true } });

    // Update approval record
    await prisma.approval.update({
      where: { requestId_step: { requestId: reqObj.id, step } },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        comments: comments || null,
        dataJson: data ? JSON.stringify(data) : null,
        actedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        requestId: reqObj.id,
        who: step,
        action: action === "APPROVE" ? "Approved" : "Rejected",
        details: comments || null,
      },
    });

    // REJECT -> set REJECTED and email HR
    if (action === "REJECT") {
      await prisma.offboardingRequest.update({
        where: { id: reqObj.id },
        data: { status: "REJECTED" },
      });

      const appBase = process.env.APP_BASE_URL || "http://localhost:5173";
      const hrLink = `${appBase}/requests/${reqObj.id}`;

      try {
        await sendMail({
          to: reqObj.createdBy,
          subject: `Offboarding Rejected | ${reqObj.id}`,
          html: rejectedEmailHtml({
            requestId: reqObj.id,
            rejectedBy: step,
            comments,
            hrLink,
          }),
        });
        console.log("ðŸ“§ Rejection email sent to HR:", reqObj.createdBy);
      } catch (e) {
        console.error("âŒ Rejection email to HR failed:", e?.message || e);
      }

      return res.json({ message: "Rejected", requestId: reqObj.id, status: "REJECTED" });
    }

    // APPROVE -> next token step or HR final
    const ns = nextStep(step);

    // If ADMIN was approved -> send to HR_FINAL (no token)
    if (!ns) {
      await prisma.offboardingRequest.update({
        where: { id: reqObj.id },
        data: { status: "HR_PENDING", currentStep: "HR_FINAL" },
      });

      await prisma.auditLog.create({
        data: {
          requestId: reqObj.id,
          who: "SYSTEM",
          action: "Waiting HR Final",
          details: "Admin approved; sent to HR for final decision",
        },
      });

      const appBase = process.env.APP_BASE_URL || "http://localhost:5173";
      const hrLink = `${appBase}/requests/${reqObj.id}`;

      try {
        await sendMail({
          to: reqObj.createdBy,
          subject: `Offboarding Ready for HR Final Approval | ${reqObj.id}`,
          html: hrFinalEmailHtml({
		  requestId: reqObj.id,
		  employeeName: reqObj.employeeName,
		  employeeId: reqObj.employeeId,
		  department: reqObj.department,
		  jobTitle: reqObj.jobTitle,
		  lastWorkingDay: reqObj.lastWorkingDay,
		  reasonForExit: reqObj.reasonForExit,
		  hrLink
		}),
        });
        console.log("ðŸ“§ HR final email sent to:", reqObj.createdBy);
      } catch (e) {
        console.error("âŒ HR final email failed:", e?.message || e);
      }

      return res.json({
        message: "Approved - Sent to HR for final approval",
        requestId: reqObj.id,
        status: "HR_PENDING",
        nextStep: "HR_FINAL",
      });
    }

    // Move request to next step and create token
    await prisma.offboardingRequest.update({
      where: { id: reqObj.id },
      data: { status: "IN_PROGRESS", currentStep: ns },
    });

    const nextToken = generateToken();
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await prisma.approvalToken.create({
      data: { token: nextToken, requestId: reqObj.id, step: ns, expiresAt, used: false },
    });

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
    const nextLink = `${baseUrl}/approve/${nextToken}`;

    // Email next approver
    const nextEmail =
      ns === "FINANCE" ? reqObj.financeEmail :
      ns === "IT" ? reqObj.itEmail :
      ns === "ADMIN" ? reqObj.adminEmail :
      null;

    try {
      await sendMail({
        to: nextEmail,
        subject: `Offboarding Approval Required: ${ns} | ${reqObj.id}`,
        html: approvalEmailHtml({
		  step: ns,
		  requestId: reqObj.id,
		  employeeName: reqObj.employeeName,
		  employeeId: reqObj.employeeId,
		  department: reqObj.department,
		  jobTitle: reqObj.jobTitle,
		  lastWorkingDay: reqObj.lastWorkingDay,
		  reasonForExit: reqObj.reasonForExit,
		  link: nextLink,
		}),
      });
      console.log(`ðŸ“§ ${ns} email sent to:`, nextEmail);
    } catch (e) {
      console.error(`âŒ ${ns} email failed:`, e?.message || e);
    }

    return res.json({
      message: "Approved",
      requestId: reqObj.id,
      nextStep: ns,
      
    });
  } catch (err) {
    console.error("submitApproval error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
