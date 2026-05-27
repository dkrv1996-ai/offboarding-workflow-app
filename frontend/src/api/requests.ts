import { api } from "./http";

export type RequestRow = {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  jobTitle: string;
  lastWorkingDay: string;
  reasonForExit: string;

  status: "SUBMITTED" | "IN_PROGRESS" | "REJECTED" | "COMPLETED";
  currentStep: "MANAGER" | "FINANCE" | "IT" | "ADMIN" | "FINAL_HR";

  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export async function listRequests(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return api<RequestRow[]>(`/api/requests${q}`, "GET", undefined, true);
}
