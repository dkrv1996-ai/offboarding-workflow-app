const prisma = require("../db");
const { generateRequestId } = require("../utils/id");
const { generateToken } = require("../utils/token");

function validateRequiredFields(body) {
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

  const missing = required.filter((k) => !body[k]);
  return missing;
}

exports.createRequest = async (req, res) => {
  try {
    const hrUser = req.user;

    const missing = validateRequiredFields(req.body);
    if (missing.length) {
      return res.status(400).json({
        message: "Missing required fields",
        missing,
      });
    }

    const {
      employeeName,
      employeeId,
      department,
      jobTitle,
      lastWorkingDay, // stored as string in your schema
      reasonForExit,

      managerEmail,
      financeEmail,
      itEmail,
      adminEmail,
      finalHrEmail,

      companyAssets,
      hrComments,
    } = req.body;

    const requestId = generateRequestId();
    const firstStep = "MANAGER";

    // Atomic create
    const result = await prisma.$transaction(async (tx) => {
      // 1) Request
      const createdReq = await tx.offboardingRequest.create({
        data: {
          id: requestId,
          employeeName,
          employeeId,
          department,
          jobTitle,
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
          currentStep: firstStep,
          createdBy: hrUser.email,
        },
      });

      // 2) Approvals
      await tx.approval.createMany({
        data: [
          { requestId, step: "MANAGER", approverEmail: managerEmail, status: "PENDING" },
          { requestId, step: "FINANCE", approverEmail: financeEmail, status: "PENDING" },
          { requestId, step: "IT", approverEmail: itEmail, status: "PENDING" },
          { requestId, step: "ADMIN", approverEmail: adminEmail, status: "PENDING" },
          { requestId, step: "FINAL_HR", approverEmail: finalHrEmail, status: "PENDING" },
        ],
      });

      // 3) Audit log
      await tx.auditLog.create({
        data: {
          requestId,
          who: "HR",
          action: "Created",
          details: `Created by ${hrUser.email}`,
        },
      });

      // 4) Token for first step
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await tx.approvalToken.create({
        data: {
          token,
          requestId,
          step: firstStep,
          expiresAt,
          used: false,
        },
      });

      return { createdReq, token };
    });

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
    const approvalLink = `${baseUrl}/approve/${result.token}`;

    // For now console (SMTP later)
    console.log(`✅ Approval link for MANAGER (${req.body.managerEmail}): ${approvalLink}`);

    return res.status(201).json({
      message: "Request created & submitted",
      requestId: result.createdReq.id,
      currentStep: result.createdReq.currentStep,
      approvalLink,
    });
  } catch (err) {
    console.error("createRequest error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Optional: HR dashboard list
exports.listRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const rows = await prisma.offboardingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(rows);
  } catch (err) {
    console.error("listRequests error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Optional: HR request details (with approvals + logs)
exports.getRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;

    const reqObj = await prisma.offboardingRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true, auditLogs: true },
    });

    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    res.json(reqObj);
  } catch (err) {
    console.error("getRequestById error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};