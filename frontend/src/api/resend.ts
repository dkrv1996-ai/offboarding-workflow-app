import { api } from "./http";

export async function resendApprovalLink(requestId: string) {
  return api<{ message: string; step: string; to: string; link: string }>(
    `/api/requests/${requestId}/resend`,
    "POST",
    {},
    true
  );
}