const prisma = require("../db");
const { generateRequestId } = require("../utils/id");
const { generateToken } = require("../utils/token");

const {
  sendMail,
  approvalEmailHtml,
  closedEmailHtml,
} = require("../services/email.service");

const TOKEN_STEPS = ["MANAGER", "FINANCE", "IT", "ADMIN"];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HR: Create Request (emails MANAGER token link)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.createRequest = async (req, res) => {
  try {
    const hrUser = req.user;

    const {
      employeeName,
      employeeId,
      department,
      jobTitle,

      country,
      city,

      lastWorkingDay,
      reasonForExit,

      managerEmail,
      financeEmail,
      itEmail,
      adminEmail,
      finalHrEmail, // still required in your DB

      companyAssets,
      hrComments,
    } = req.body;

    if (
      !employeeName ||
      !employeeId ||
      !department ||
      !jobTitle ||
      !country ||
      !city ||
      !lastWorkingDay ||
      !reasonForExit ||
      !managerEmail ||
      !financeEmail ||
      !itEmail ||
      !adminEmail ||
      !finalHrEmail
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const requestId = generateRequestId();

    const { token } = await prisma.$transaction(async (tx) => {
      await tx.offboardingRequest.create({
        data: {
          id: requestId,
          employeeName,
          employeeId,
          department,
          jobTitle,

          country,
          city,

          lastWorkingDay: String(lastWorkingDay),
          reasonForExit,

          managerEmail,
          financeEmail,
          itEmail,
          adminEmail,
          finalHrEmail,

          companyAssets: companyAssets || null,
          hrComments: hrComments || null,

          status: "SUBMITTED",
          currentStep: "MANAGER",
		  createdBy: hrUser.email || hrUser.username, // ✅ FI
         
        },
      });

      await tx.approval.createMany({
        data: [
          { requestId, step: "MANAGER", approverEmail: managerEmail, status: "PENDING" },
          { requestId, step: "FINANCE", approverEmail: financeEmail, status: "PENDING" },
          { requestId, step: "IT", approverEmail: itEmail, status: "PENDING" },
          { requestId, step: "ADMIN", approverEmail: adminEmail, status: "PENDING" },
		  { requestId, step: "HR_FINAL", approverEmail: hrUser.email || hrUser.username, status: "PENDING" },

        ],
      });

      await tx.auditLog.create({
        data: { requestId, who: "HR", action: "Created", details: `Created by ${hrUser.email}` },
      });

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await tx.approvalToken.create({
        data: { token, requestId, step: "MANAGER", expiresAt, used: false },
      });

      return { token };
    });

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
    const approvalLink = `${baseUrl}/approve/${token}`;

    // Email Manager (full summary)
    try {
      await sendMail({
        to: managerEmail,
        subject: `Offboarding Approval Required: MANAGER | ${requestId}`,
        html: approvalEmailHtml({
          step: "MANAGER",
          requestId,
          employeeName,
          employeeId,
          department,
          jobTitle,
          lastWorkingDay: String(lastWorkingDay),
          reasonForExit,
          link: approvalLink,
        }),
      });
      console.log("ðŸ“§ Sent MANAGER email to:", managerEmail);
    } catch (e) {
      console.error("âŒ MANAGER email failed:", e?.message || e);
    }

    return res.status(201).json({
      message: "Request created & submitted",
      requestId,
      currentStep: "MANAGER",
      approvalLink,
    });
  } catch (err) {
    console.error("createRequest error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HR: List Requests
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.listRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const rows = await prisma.offboardingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json(rows);
  } catch (err) {
    console.error("listRequests error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HR: Request Details
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;

    const reqObj = await prisma.offboardingRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true, auditLogs: true },
    });

    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    return res.json(reqObj);
  } catch (err) {
    console.error("getRequestById error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HR: Resend current step token (Manager/Finance/IT/Admin only)
// POST /api/requests/:id/resend
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.resendCurrentApprovalLink = async (req, res) => {
  try {
    const requestId = req.params.id;
    const hrUser = req.user;

    const reqObj = await prisma.offboardingRequest.findUnique({ where: { id: requestId } });
    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    const step = reqObj.currentStep;

    if (!TOKEN_STEPS.includes(step)) {
      return res.status(400).json({ message: `Cannot resend token for step ${step}.` });
    }

    const to =
      step === "MANAGER"
        ? reqObj.managerEmail
        : step === "FINANCE"
        ? reqObj.financeEmail
        : step === "IT"
        ? reqObj.itEmail
        : step === "ADMIN"
        ? reqObj.adminEmail
        : null;

    if (!to) return res.status(400).json({ message: `Missing email for ${step}` });

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";

    const { token } = await prisma.$transaction(async (tx) => {
      await tx.approvalToken.updateMany({
        where: { requestId, step, used: false },
        data: { used: true },
      });

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await tx.approvalToken.create({
        data: { token, requestId, step, expiresAt, used: false },
      });

      await tx.auditLog.create({
        data: {
          requestId,
          who: "HR",
          action: "Resent Approval Link",
          details: `Resent ${step} link to ${to} by ${hrUser.email}`,
        },
      });

      return { token };
    });

    const link = `${baseUrl}/approve/${token}`;

    await sendMail({
      to,
      subject: `Offboarding Approval Required: ${step} | ${requestId} (Resent)`,
      html: approvalEmailHtml({
        step,
        requestId,
        employeeName: reqObj.employeeName,
        employeeId: reqObj.employeeId,
        department: reqObj.department,
        jobTitle: reqObj.jobTitle,
        lastWorkingDay: reqObj.lastWorkingDay,
        reasonForExit: reqObj.reasonForExit,
        link,
      }),
    });

    return res.json({ message: "Resent", requestId, step, to, link });
  } catch (err) {
    console.error("resendCurrentApprovalLink error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HR: Delete Request (and children rows)
// DELETE /api/requests/:id
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.deleteRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const exists = await prisma.offboardingRequest.findUnique({ where: { id: requestId } });
    if (!exists) return res.status(404).json({ message: "Request not found" });

    await prisma.$transaction(async (tx) => {
      await tx.approvalToken.deleteMany({ where: { requestId } });
      await tx.auditLog.deleteMany({ where: { requestId } });
      await tx.approval.deleteMany({ where: { requestId } });
      await tx.offboardingRequest.delete({ where: { id: requestId } });
    });

    return res.json({ message: "Deleted", requestId });
  } catch (err) {
    console.error("deleteRequest error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HR: Final Decision (mandatory comment for APPROVE & REJECT)
// POST /api/requests/:id/hr-final
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.hrFinalDecision = async (req, res) => {
  try {
    const requestId = req.params.id;
    const hrUser = req.user;
    const { action, hrFinalComments } = req.body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({ message: "action must be APPROVE or REJECT" });
    }

    const comment = String(hrFinalComments || "").trim();
    if (!comment) {
      return res.status(400).json({
        message: "HR Final Comments is mandatory for both Approve & Reject.",
      });
    }

    const reqObj = await prisma.offboardingRequest.findUnique({ where: { id: requestId } });
    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    if (reqObj.status !== "HR_PENDING" || reqObj.currentStep !== "HR_FINAL") {
      return res.status(400).json({ message: "Request is not pending HR final approval" });
    }

    await prisma.approval.update({
      where: { requestId_step: { requestId, step: "HR_FINAL" } },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        comments: comment,
        actedAt: new Date(),
        dataJson: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        requestId,
        who: "HR_FINAL",
        action: action === "APPROVE" ? "Approved & Closed" : "Rejected",
        details: comment,
      },
    });

    if (action === "REJECT") {
      await prisma.offboardingRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", hrComments: comment },
      });
      return res.json({ message: "Rejected by HR", requestId, status: "REJECTED" });
    }

    await prisma.offboardingRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED", hrComments: comment },
    });

    const appBase = process.env.APP_BASE_URL || "http://localhost:5173";
    const printLink = `${appBase}/requests/${requestId}/print`;

    try {
      await sendMail({
        to: hrUser.email,
        subject: `Offboarding Closed | ${requestId}`,
        html: closedEmailHtml({ requestId, hrComments: comment, printLink }),
      });
    } catch (e) {
      console.error("âŒ HR close confirmation email failed:", e?.message || e);
    }

    return res.json({ message: "Approved & Closed by HR", requestId, status: "COMPLETED" });
  } catch (err) {
    console.error("hrFinalDecision error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
