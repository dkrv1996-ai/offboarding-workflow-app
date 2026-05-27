import { api } from "./http";

export type CreateRequestPayload = {
  employeeName: string;
  employeeId: string;
  department: string;
  jobTitle: string;
  lastWorkingDay: string;   // yyyy-mm-dd
  reasonForExit: string;

  managerEmail: string;
  financeEmail: string;
  itEmail: string;
  adminEmail: string;
  finalHrEmail: string;

  companyAssets?: string;
  hrComments?: string;
};

export type CreateRequestResponse = {
  message: string;
  requestId: string;
  currentStep: string;
  approvalLink: string;
};

export async function createRequest(payload: CreateRequestPayload) {
  return api<CreateRequestResponse>("/api/requests", "POST", payload, true);
}