import { api } from "./http";

export type Step = "MANAGER" | "FINANCE" | "IT" | "ADMIN" | "FINAL_HR";

export type ApproveInfoResponse = {
  requestId: string;
  step: Step;
  employee: {
    employeeName: string;
    employeeId: string;
    department: string;
    jobTitle: string;
    lastWorkingDay: string;
    reasonForExit: string;
  };
  approvals: Record<string, any>;
  timeline: Array<{ at: string; who: string; action: string; details: string }>;
};

// Public GET (no login)
export async function getApproveInfo(token: string) {
  return api<ApproveInfoResponse>(`/api/public/approve/${token}`, "GET", undefined, false);
}

export type SubmitApprovalPayload = {
  action: "APPROVE" | "REJECT";
  comments?: string;
  data?: Record<string, any>;
};

// Public POST (no login)
export async function submitApproval(token: string, payload: SubmitApprovalPayload) {
  return api<any>(`/api/public/approve/${token}`, "POST", payload, false);
}