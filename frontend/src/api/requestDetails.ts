import { api } from "./http";

export type RequestDetails = {
  id: string;

  employeeName: string;
  employeeId: string;
  department: string;
  jobTitle: string;
  lastWorkingDay: string;
  reasonForExit: string;

  // ✅ Approver emails captured by HR
  managerEmail: string;
  financeEmail: string;
  itEmail: string;
  adminEmail: string;
  finalHrEmail: string;

  companyAssets?: string | null;
  hrComments?: string | null;

  status: "SUBMITTED" | "IN_PROGRESS" | "REJECTED" | "COMPLETED";
  currentStep: "MANAGER" | "FINANCE" | "IT" | "ADMIN" | "FINAL_HR";

  approvals: Array<{
    step: "MANAGER" | "FINANCE" | "IT" | "ADMIN" | "FINAL_HR";
    approverEmail: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    comments?: string | null;
    dataJson?: string | null;
    actedAt?: string | null;
  }>;

  auditLogs: Array<{
    at: string;
    who: string;
    action: string;
    details?: string | null;
  }>;
};

export async function getRequestDetails(id: string) {
  return api<RequestDetails>(`/api/requests/${id}`, "GET", undefined, true);
}