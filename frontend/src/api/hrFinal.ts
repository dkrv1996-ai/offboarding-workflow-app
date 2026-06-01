import { api } from "./http";

export async function hrFinalDecision(
  requestId: string,
  action: "APPROVE" | "REJECT",
  hrFinalComments: string
) {
  return api<{ message: string; status: string }>(
    `/api/requests/${requestId}/hr-final`,
    "POST",
    { action, hrFinalComments },
    true
  );
}