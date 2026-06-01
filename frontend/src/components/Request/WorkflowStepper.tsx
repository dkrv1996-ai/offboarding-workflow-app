import { Stepper, Step, StepLabel, Paper, Typography } from "@mui/material";

const FLOW = ["MANAGER", "FINANCE", "IT", "ADMIN", "FINAL_HR"] as const;

export default function WorkflowStepper({ currentStep }: { currentStep: string }) {
  const activeStep = Math.max(0, FLOW.indexOf(currentStep as any));

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>
        Workflow Progress
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel>
        {FLOW.map((s) => (
          <Step key={s}>
            <StepLabel>{s}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
}
