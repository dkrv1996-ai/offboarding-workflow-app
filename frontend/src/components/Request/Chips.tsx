import { Chip } from "@mui/material";

export function StatusChip({ status }: { status: string }) {
  const color =
    status === "COMPLETED" ? "success" :
    status === "REJECTED" ? "error" :
    status === "IN_PROGRESS" ? "warning" : "default";

  return <Chip label={status} color={color as any} size="small" />;
}

export function StepChip({ step }: { step: string }) {
  return <Chip label={step} variant="outlined" size="small" />;
}