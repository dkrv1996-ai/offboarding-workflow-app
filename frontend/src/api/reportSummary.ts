import { api } from "./http";

export type ReportSummary = {
  request: any;
  approvals: Record<string, any>;
  timeline: Array<{ at: string; who: string; action: string; details: string }>;
};

export async function getReportSummary(requestId: string) {
  return api<ReportSummary>(`/api/reports/${requestId}/summary`, "GET", undefined, true);
}