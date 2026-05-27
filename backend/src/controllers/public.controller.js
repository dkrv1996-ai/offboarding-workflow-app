const prisma = require("../db");
const { generateToken } = require("../utils/token");

const STEP_ORDER = ["MANAGER", "FINANCE", "IT", "ADMIN", "FINAL_HR"];

function nextStep(step) {
  const idx = STEP_ORDER.indexOf(step);
  return idx === -1 ? null : STEP_ORDER[idx + 1] || null;
}

function tokenError(res, message) {
  return res.status(400).json({ message });
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

function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

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

    const approvals = approvalsToMap(reqObj.approvals);
    const timeline = reqObj.auditLogs
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .map((l) => ({ at: l.at, who: l.who, action: l.action, details: l.details || "" }));

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
      approvals,
      timeline,
    });
  } catch (err) {
    console.error("getApproveInfo error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.submitApproval = async (req, res) => {
  try {
    const { token } = req.params;
    const { action, comments, data } = req.body; // action = APPROVE|REJECT

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({ message: "action must be APPROVE or REJECT" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.approvalToken.findUnique({ where: { token } });
      if (!tokenRecord) return { error: "Invalid token" };
      if (tokenRecord.used) return { error: "Token already used" };
      if (new Date() > tokenRecord.expiresAt) return { error: "Token expired" };

      const reqObj = await tx.offboardingRequest.findUnique({
        where: { id: tokenRecord.requestId },
      });
      if (!reqObj) return { error: "Request not found" };

      const step = tokenRecord.step;

      if (reqObj.currentStep !== step) {
        return { error: `This token is for ${step}, but current step is ${reqObj.currentStep}` };
      }

      // Mark token used
      await tx.approvalToken.update({
        where: { token },
        data: { used: true },
      });

      // Update approval row
      await tx.approval.update({
        where: { requestId_step: { requestId: reqObj.id, step } },
        data: {
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          comments: comments || null,
          dataJson: data ? JSON.stringify(data) : null,
          actedAt: new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          requestId: reqObj.id,
          who: step,
          action: action === "APPROVE" ? "Approved" : "Rejected",
          details: comments || null,
        },
      });

      if (action === "REJECT") {
        // Mark request rejected (HR will handle from dashboard)
        await tx.offboardingRequest.update({
          where: { id: reqObj.id },
          data: { status: "REJECTED" },
        });

        return { done: true, message: "Rejected", requestId: reqObj.id, status: "REJECTED" };
      }

      // APPROVE => move next or complete
      const ns = nextStep(step);

      if (!ns) {
        await tx.offboardingRequest.update({
          where: { id: reqObj.id },
          data: { status: "COMPLETED" },
        });

        await tx.auditLog.create({
          data: {
            requestId: reqObj.id,
            who: "FINAL_HR",
            action: "Approved & Closed",
            details: comments || null,
          },
        });

        return { done: true, message: "Completed", requestId: reqObj.id, status: "COMPLETED" };
      }

      // Move to next step
      await tx.offboardingRequest.update({
        where: { id: reqObj.id },
        data: { status: "IN_PROGRESS", currentStep: ns },
      });

      // Create token for next step
      const nextToken = generateToken();
      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await tx.approvalToken.create({
        data: {
          token: nextToken,
          requestId: reqObj.id,
          step: ns,
          expiresAt,
          used: false,
        },
      });

      const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
      const nextLink = `${baseUrl}/approve/${nextToken}`;

      return { done: true, message: "Approved", requestId: reqObj.id, nextStep: ns, nextLink };
    });

    if (result?.error) return tokenError(res, result.error);
    return res.json(result);
  } catch (err) {
    console.error("submitApproval error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};